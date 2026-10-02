"""Rotas do professor: turmas, lista de permitidos, atividades e entregas recebidas."""

from __future__ import annotations

import os
import shutil
import sqlite3
import tempfile
import zipfile
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from starlette.background import BackgroundTask

from app.config import Configuracao
from app.consultas import (
    atividade_para_json,
    buscar_atividade,
    buscar_turma,
    entrega_para_json,
    turma_para_json,
)
from app.dependencias import (
    exigir_professor,
    obter_conexao,
    obter_configuracao,
    pasta_de_arquivos,
)
from app.regras import (
    PADRAO_DE_DISCIPLINA,
    PADRAO_DE_SEMESTRE,
    agora_em_utc,
    interpretar_lista_de_alunos,
    material_valido,
    normalizar_extensoes,
    prazo_local_para_utc,
)

roteador = APIRouter(dependencies=[Depends(exigir_professor)])


class NovaTurma(BaseModel):
    disciplina: str
    semestre: str


class ListaDeAlunos(BaseModel):
    texto: str


class NovaAtividade(BaseModel):
    titulo: str = Field(min_length=1, max_length=200)
    descricao: str = Field(default="", max_length=5000)
    prazo_local: str
    em_grupo: bool = False
    extensoes: list[str] = ["pdf"]
    tamanho_max_mb: int = Field(default=20, ge=1, le=100)
    max_arquivos: int = Field(default=1, ge=1, le=5)
    material: str = Field(default="", max_length=300)


class AlteracaoDaAtividade(BaseModel):
    titulo: str | None = Field(default=None, min_length=1, max_length=200)
    descricao: str | None = Field(default=None, max_length=5000)
    prazo_local: str | None = None
    em_grupo: bool | None = None
    extensoes: list[str] | None = None
    tamanho_max_mb: int | None = Field(default=None, ge=1, le=100)
    max_arquivos: int | None = Field(default=None, ge=1, le=5)
    material: str | None = Field(default=None, max_length=300)
    aberta: bool | None = None


def campos_da_atividade_para_o_banco(campos: dict[str, Any]) -> dict[str, Any]:
    """Valida e converte os campos recebidos para as colunas da tabela atividade."""
    colunas: dict[str, Any] = {}
    try:
        for campo, valor in campos.items():
            if campo == "prazo_local":
                colunas["prazo"] = prazo_local_para_utc(valor).isoformat(timespec="seconds")
            elif campo == "extensoes":
                colunas["extensoes"] = ",".join(normalizar_extensoes(valor))
            elif campo == "material":
                if not material_valido(valor):
                    raise ValueError("O material deve ser um caminho do portal, como experimentos/08-ressonancia-rlc/.")
                colunas["material"] = valor
            elif campo in ("titulo", "descricao"):
                colunas[campo] = valor.strip()
            else:
                colunas[campo] = valor
    except ValueError as erro:
        raise HTTPException(status_code=400, detail=str(erro)) from erro
    return colunas


def nome_para_pasta(texto: str) -> str:
    sem_barras = texto.replace("/", "-").replace("\\", "-")
    limpo = "".join(caractere for caractere in sem_barras if caractere.isprintable()).strip(" .")
    return limpo or "sem-nome"


@roteador.get("/turmas")
def listar_turmas(conexao: sqlite3.Connection = Depends(obter_conexao)) -> list[dict[str, Any]]:
    turmas = conexao.execute(
        """
        SELECT turma.*,
            (SELECT COUNT(*) FROM matricula WHERE matricula.turma_id = turma.id) AS alunos,
            (SELECT COUNT(*) FROM atividade WHERE atividade.turma_id = turma.id) AS atividades
        FROM turma
        ORDER BY turma.semestre DESC, turma.disciplina
        """
    ).fetchall()
    return [
        {**turma_para_json(turma), "alunos": turma["alunos"], "atividades": turma["atividades"]}
        for turma in turmas
    ]


@roteador.post("/turmas", status_code=201)
def criar_turma(
    dados: NovaTurma, conexao: sqlite3.Connection = Depends(obter_conexao)
) -> dict[str, Any]:
    disciplina = dados.disciplina.strip().upper()
    semestre = dados.semestre.strip()
    if not PADRAO_DE_DISCIPLINA.fullmatch(disciplina):
        raise HTTPException(status_code=400, detail="Use o código oficial da disciplina, como PRCLFBE.")
    if not PADRAO_DE_SEMESTRE.fullmatch(semestre):
        raise HTTPException(status_code=400, detail="Escreva o semestre como 2026-2.")

    try:
        turma_id = conexao.execute(
            "INSERT INTO turma (disciplina, semestre, criada_em) VALUES (?, ?, ?)",
            (disciplina, semestre, agora_em_utc().isoformat(timespec="seconds")),
        ).lastrowid
    except sqlite3.IntegrityError as erro:
        raise HTTPException(
            status_code=409, detail=f"Já existe a turma de {disciplina} em {semestre}."
        ) from erro
    return turma_para_json(buscar_turma(conexao, turma_id))


@roteador.delete("/turmas/{turma_id}", status_code=204)
def apagar_turma(
    turma_id: int,
    conexao: sqlite3.Connection = Depends(obter_conexao),
    configuracao: Configuracao = Depends(obter_configuracao),
) -> None:
    """Apaga a turma com matrículas, atividades, entregas e arquivos."""
    buscar_turma(conexao, turma_id)
    conexao.execute("DELETE FROM turma WHERE id = ?", (turma_id,))
    shutil.rmtree(pasta_de_arquivos(configuracao) / str(turma_id), ignore_errors=True)


@roteador.get("/turmas/{turma_id}/matriculas")
def listar_matriculas(
    turma_id: int, conexao: sqlite3.Connection = Depends(obter_conexao)
) -> list[dict[str, Any]]:
    buscar_turma(conexao, turma_id)
    matriculas = conexao.execute(
        "SELECT id, nome, email FROM matricula WHERE turma_id = ? ORDER BY nome COLLATE NOCASE",
        (turma_id,),
    ).fetchall()
    return [dict(matricula) for matricula in matriculas]


@roteador.put("/turmas/{turma_id}/matriculas")
def importar_matriculas(
    turma_id: int, dados: ListaDeAlunos, conexao: sqlite3.Connection = Depends(obter_conexao)
) -> dict[str, Any]:
    """Substitui a lista de permitidos da turma pelo texto colado do SUAP."""
    buscar_turma(conexao, turma_id)
    alunos_novos, linhas_ignoradas = interpretar_lista_de_alunos(dados.texto)
    if not alunos_novos:
        raise HTTPException(
            status_code=400,
            detail="Nenhum e-mail @aluno.ifsp.edu.br foi encontrado no texto.",
        )

    emails_atuais = {
        linha["email"]
        for linha in conexao.execute("SELECT email FROM matricula WHERE turma_id = ?", (turma_id,))
    }
    entraram = sorted(set(alunos_novos) - emails_atuais)
    sairam = sorted(emails_atuais - set(alunos_novos))
    permaneceram = sorted(emails_atuais & set(alunos_novos))

    # Quem permanece mantém o mesmo id de matrícula; só o nome é atualizado.
    conexao.executemany(
        "DELETE FROM matricula WHERE turma_id = ? AND email = ?",
        [(turma_id, email) for email in sairam],
    )
    conexao.executemany(
        "UPDATE matricula SET nome = ? WHERE turma_id = ? AND email = ?",
        [(alunos_novos[email], turma_id, email) for email in permaneceram],
    )
    conexao.executemany(
        "INSERT INTO matricula (turma_id, email, nome) VALUES (?, ?, ?)",
        [(turma_id, email, alunos_novos[email]) for email in entraram],
    )
    return {
        "entraram": len(entraram),
        "sairam": len(sairam),
        "permaneceram": len(permaneceram),
        "linhas_ignoradas": linhas_ignoradas,
    }


@roteador.get("/turmas/{turma_id}/atividades")
def listar_atividades_da_turma(
    turma_id: int, conexao: sqlite3.Connection = Depends(obter_conexao)
) -> list[dict[str, Any]]:
    buscar_turma(conexao, turma_id)
    atividades = conexao.execute(
        """
        SELECT atividade.*,
            (SELECT COUNT(*) FROM entrega
             WHERE entrega.atividade_id = atividade.id AND entrega.substituida = 0) AS entregas
        FROM atividade WHERE turma_id = ? ORDER BY prazo, id
        """,
        (turma_id,),
    ).fetchall()
    return [
        {**atividade_para_json(atividade), "entregas": atividade["entregas"]}
        for atividade in atividades
    ]


@roteador.post("/turmas/{turma_id}/atividades", status_code=201)
def criar_atividade(
    turma_id: int, dados: NovaAtividade, conexao: sqlite3.Connection = Depends(obter_conexao)
) -> dict[str, Any]:
    buscar_turma(conexao, turma_id)
    colunas = campos_da_atividade_para_o_banco(dados.model_dump())
    colunas["turma_id"] = turma_id
    colunas["aberta"] = True
    colunas["criada_em"] = agora_em_utc().isoformat(timespec="seconds")

    nomes = ", ".join(colunas)
    marcadores = ", ".join("?" for _ in colunas)
    atividade_id = conexao.execute(
        f"INSERT INTO atividade ({nomes}) VALUES ({marcadores})", tuple(colunas.values())
    ).lastrowid
    return atividade_para_json(buscar_atividade(conexao, atividade_id))


@roteador.patch("/atividades/{atividade_id}")
def alterar_atividade(
    atividade_id: int,
    dados: AlteracaoDaAtividade,
    conexao: sqlite3.Connection = Depends(obter_conexao),
) -> dict[str, Any]:
    buscar_atividade(conexao, atividade_id)
    colunas = campos_da_atividade_para_o_banco(dados.model_dump(exclude_none=True))
    if colunas:
        atribuicoes = ", ".join(f"{coluna} = ?" for coluna in colunas)
        conexao.execute(
            f"UPDATE atividade SET {atribuicoes} WHERE id = ?",
            (*colunas.values(), atividade_id),
        )
    return atividade_para_json(buscar_atividade(conexao, atividade_id))


@roteador.delete("/atividades/{atividade_id}", status_code=204)
def apagar_atividade(
    atividade_id: int,
    conexao: sqlite3.Connection = Depends(obter_conexao),
    configuracao: Configuracao = Depends(obter_configuracao),
) -> None:
    atividade = buscar_atividade(conexao, atividade_id)
    conexao.execute("DELETE FROM atividade WHERE id = ?", (atividade_id,))
    pasta = pasta_de_arquivos(configuracao) / str(atividade["turma_id"]) / str(atividade_id)
    shutil.rmtree(pasta, ignore_errors=True)


@roteador.get("/atividades/{atividade_id}/entregas")
def listar_entregas(
    atividade_id: int, conexao: sqlite3.Connection = Depends(obter_conexao)
) -> dict[str, Any]:
    atividade = buscar_atividade(conexao, atividade_id)
    turma = buscar_turma(conexao, atividade["turma_id"])
    entregas = conexao.execute(
        "SELECT * FROM entrega WHERE atividade_id = ? ORDER BY enviada_em, id", (atividade_id,)
    ).fetchall()
    faltam = conexao.execute(
        """
        SELECT nome, email FROM matricula
        WHERE turma_id = ? AND email NOT IN (
            SELECT entrega_membro.email FROM entrega_membro
            JOIN entrega ON entrega.id = entrega_membro.entrega_id
            WHERE entrega.atividade_id = ? AND entrega.substituida = 0
        )
        ORDER BY nome COLLATE NOCASE
        """,
        (turma["id"], atividade_id),
    ).fetchall()

    em_json = [entrega_para_json(conexao, entrega, turma["id"], com_emails=True) for entrega in entregas]
    return {
        "atividade": atividade_para_json(atividade),
        "turma": turma_para_json(turma),
        "vigentes": [entrega for entrega in em_json if not entrega["substituida"]],
        "substituidas": [entrega for entrega in em_json if entrega["substituida"]],
        "faltam": [dict(aluno) for aluno in faltam],
    }


@roteador.get("/atividades/{atividade_id}/entregas.zip")
def baixar_entregas_em_zip(
    atividade_id: int,
    conexao: sqlite3.Connection = Depends(obter_conexao),
    configuracao: Configuracao = Depends(obter_configuracao),
) -> FileResponse:
    """Um zip com as entregas vigentes, uma pasta por aluno ou grupo."""
    atividade = buscar_atividade(conexao, atividade_id)
    turma = buscar_turma(conexao, atividade["turma_id"])
    entregas = conexao.execute(
        "SELECT * FROM entrega WHERE atividade_id = ? AND substituida = 0 ORDER BY enviada_em, id",
        (atividade_id,),
    ).fetchall()
    if not entregas:
        raise HTTPException(status_code=404, detail="Ainda não há entregas nesta atividade.")

    descritor, caminho_do_zip = tempfile.mkstemp(suffix=".zip")
    os.close(descritor)
    pastas_usadas: set[str] = set()
    with zipfile.ZipFile(caminho_do_zip, "w", zipfile.ZIP_DEFLATED) as pacote:
        for entrega in entregas:
            em_json = entrega_para_json(conexao, entrega, turma["id"], com_emails=False)
            pasta = nome_para_pasta(" + ".join(membro["nome"] for membro in em_json["membros"]))
            if em_json["atrasada"]:
                pasta += " (atrasada)"
            if pasta in pastas_usadas:
                pasta += f" [{entrega['id']}]"
            pastas_usadas.add(pasta)

            arquivos = conexao.execute(
                "SELECT * FROM arquivo WHERE entrega_id = ? ORDER BY id", (entrega["id"],)
            ).fetchall()
            nomes_usados: set[str] = set()
            for arquivo in arquivos:
                nome = arquivo["nome_original"]
                if nome in nomes_usados:
                    nome = f"{arquivo['id']}-{nome}"
                nomes_usados.add(nome)
                pacote.write(
                    pasta_de_arquivos(configuracao) / arquivo["nome_em_disco"], f"{pasta}/{nome}"
                )

    nome_do_zip = nome_para_pasta(
        f"{turma['disciplina']} {turma['semestre']} - {atividade['titulo']}.zip"
    )
    return FileResponse(
        caminho_do_zip,
        filename=nome_do_zip,
        media_type="application/zip",
        background=BackgroundTask(os.unlink, caminho_do_zip),
    )
