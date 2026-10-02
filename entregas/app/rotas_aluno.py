"""Rotas públicas e de aluno: ver atividades, enviar e baixar a própria entrega."""

from __future__ import annotations

import shutil
import sqlite3
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.config import DOMINIOS_DE_ALUNO, MAXIMO_DE_VERSOES_POR_ATIVIDADE
from app.consultas import (
    atividade_para_json,
    buscar_atividade,
    buscar_entrega_vigente_do_membro,
    buscar_turma,
    buscar_turma_vigente,
    entrega_para_json,
    nome_na_turma,
    turma_para_json,
)
from app.dependencias import (
    ConexaoDoBanco,
    ConfiguracaoAtual,
    UsuarioAtual,
    exigir_aluno_da_turma,
    pasta_de_arquivos,
)
from app.identidade import Usuario
from app.regras import agora_em_utc, esta_atrasada, extensao_do_arquivo, nome_seguro

roteador = APIRouter()

BYTES_POR_MB = 1024 * 1024


@roteador.get("/disciplinas/{codigo}/atividades")
def listar_atividades_da_disciplina(
    codigo: str, conexao: ConexaoDoBanco
) -> dict[str, Any]:
    """Lista pública: só título, prazo e regras da atividade. Nenhum dado de aluno."""
    turma = buscar_turma_vigente(conexao, codigo)
    if turma is None:
        return {"turma": None, "atividades": []}

    atividades = conexao.execute(
        "SELECT * FROM atividade WHERE turma_id = ? ORDER BY prazo, id", (turma["id"],)
    ).fetchall()
    return {
        "turma": turma_para_json(turma),
        "atividades": [atividade_para_json(atividade) for atividade in atividades],
    }


@roteador.get("/eu")
def descrever_usuario(
    usuario: UsuarioAtual,
    conexao: ConexaoDoBanco,
) -> dict[str, Any]:
    turmas: list[sqlite3.Row] = []
    if usuario.dominio in DOMINIOS_DE_ALUNO:
        turmas = conexao.execute(
            """
            SELECT turma.* FROM turma
            JOIN matricula ON matricula.turma_id = turma.id
            WHERE matricula.email = ?
            ORDER BY turma.semestre DESC, turma.disciplina
            """,
            (usuario.email,),
        ).fetchall()
    return {
        "email": usuario.email,
        "nome": usuario.nome,
        "professor": usuario.professor,
        "turmas": [turma_para_json(turma) for turma in turmas],
    }


@roteador.get("/disciplinas/{codigo}/minhas-entregas")
def listar_minhas_entregas(
    codigo: str,
    usuario: UsuarioAtual,
    conexao: ConexaoDoBanco,
) -> dict[str, Any]:
    turma = buscar_turma_vigente(conexao, codigo)
    if turma is None:
        raise HTTPException(status_code=404, detail="Não há turma aberta para esta disciplina.")
    exigir_aluno_da_turma(conexao, usuario, turma["id"])

    entregas = conexao.execute(
        """
        SELECT entrega.* FROM entrega
        JOIN entrega_membro ON entrega_membro.entrega_id = entrega.id
        JOIN atividade ON atividade.id = entrega.atividade_id
        WHERE atividade.turma_id = ? AND entrega.substituida = 0 AND entrega_membro.email = ?
        """,
        (turma["id"], usuario.email),
    ).fetchall()
    return {
        "turma": turma_para_json(turma),
        "nome": nome_na_turma(conexao, turma["id"], usuario.email),
        "entregas": [
            entrega_para_json(conexao, entrega, turma["id"], com_emails=False)
            for entrega in entregas
        ],
    }


@roteador.get("/turmas/{turma_id}/colegas")
def listar_colegas(
    turma_id: int,
    usuario: UsuarioAtual,
    conexao: ConexaoDoBanco,
) -> list[dict[str, Any]]:
    """Nomes da turma para montar o grupo. Os e-mails dos colegas não são expostos."""
    buscar_turma(conexao, turma_id)
    if not usuario.professor:
        exigir_aluno_da_turma(conexao, usuario, turma_id)

    matriculas = conexao.execute(
        "SELECT id, nome, email FROM matricula WHERE turma_id = ? ORDER BY nome COLLATE NOCASE",
        (turma_id,),
    ).fetchall()
    return [
        {
            "id": matricula["id"],
            "nome": matricula["nome"],
            "voce": matricula["email"] == usuario.email,
        }
        for matricula in matriculas
    ]


def tamanho_do_envio(arquivo: UploadFile) -> int:
    arquivo.file.seek(0, 2)
    tamanho = arquivo.file.tell()
    arquivo.file.seek(0)
    return tamanho


def validar_arquivos(arquivos: list[UploadFile], atividade: sqlite3.Row) -> None:
    maximo_de_arquivos = atividade["max_arquivos"]
    if len(arquivos) > maximo_de_arquivos:
        raise HTTPException(
            status_code=400,
            detail=f"Esta atividade aceita no máximo {maximo_de_arquivos} arquivo(s) por envio.",
        )

    extensoes_aceitas = atividade["extensoes"].split(",")
    limite_em_bytes = atividade["tamanho_max_mb"] * BYTES_POR_MB
    for arquivo in arquivos:
        nome = nome_seguro(arquivo.filename or "")
        if extensao_do_arquivo(nome) not in extensoes_aceitas:
            raise HTTPException(
                status_code=400,
                detail=f"O arquivo {nome} não é aceito. Tipos aceitos: {', '.join(extensoes_aceitas)}.",
            )
        tamanho = tamanho_do_envio(arquivo)
        if tamanho == 0:
            raise HTTPException(status_code=400, detail=f"O arquivo {nome} está vazio.")
        if tamanho > limite_em_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"O arquivo {nome} passa do limite de {atividade['tamanho_max_mb']} MB.",
            )


def reunir_emails_dos_membros(
    conexao: sqlite3.Connection, atividade: sqlite3.Row, usuario: Usuario, membros: list[int]
) -> set[str]:
    emails = {usuario.email}
    if not membros:
        return emails
    if not atividade["em_grupo"]:
        raise HTTPException(status_code=400, detail="Esta atividade é individual.")

    for matricula_id in membros:
        matricula = conexao.execute(
            "SELECT email FROM matricula WHERE id = ? AND turma_id = ?",
            (matricula_id, atividade["turma_id"]),
        ).fetchone()
        if matricula is None:
            raise HTTPException(status_code=400, detail="Colega não encontrado na lista da turma.")
        emails.add(matricula["email"])
    return emails


def recusar_colega_de_outro_grupo(
    conexao: sqlite3.Connection,
    atividade: sqlite3.Row,
    usuario: Usuario,
    emails_dos_membros: set[str],
    entrega_anterior: sqlite3.Row | None,
) -> None:
    """Um aluno só pode estar em uma entrega vigente por atividade."""
    for email in sorted(emails_dos_membros - {usuario.email}):
        entrega_do_colega = buscar_entrega_vigente_do_membro(conexao, atividade["id"], email)
        if entrega_do_colega is None:
            continue
        if entrega_anterior is not None and entrega_do_colega["id"] == entrega_anterior["id"]:
            continue
        nome_do_colega = nome_na_turma(conexao, atividade["turma_id"], email)
        quem_enviou = nome_na_turma(conexao, atividade["turma_id"], entrega_do_colega["enviada_por"])
        raise HTTPException(
            status_code=409,
            detail=f"{nome_do_colega} já está na entrega enviada por {quem_enviou}.",
        )


def recusar_excesso_de_versoes(
    conexao: sqlite3.Connection, atividade_id: int, usuario: Usuario
) -> None:
    total_de_envios = conexao.execute(
        """
        SELECT COUNT(*) FROM entrega
        JOIN entrega_membro ON entrega_membro.entrega_id = entrega.id
        WHERE entrega.atividade_id = ? AND entrega_membro.email = ?
        """,
        (atividade_id, usuario.email),
    ).fetchone()[0]
    if total_de_envios >= MAXIMO_DE_VERSOES_POR_ATIVIDADE:
        raise HTTPException(
            status_code=409,
            detail=(
                f"Limite de {MAXIMO_DE_VERSOES_POR_ATIVIDADE} envios por atividade atingido. "
                "Fale com o professor."
            ),
        )


@roteador.post("/atividades/{atividade_id}/entregas", status_code=201)
def enviar_entrega(
    atividade_id: int,
    usuario: UsuarioAtual,
    conexao: ConexaoDoBanco,
    configuracao: ConfiguracaoAtual,
    arquivos: list[UploadFile] = File(...),
    membros: list[int] = Form(default=[]),
) -> dict[str, Any]:
    atividade = buscar_atividade(conexao, atividade_id)
    turma_id = atividade["turma_id"]
    exigir_aluno_da_turma(conexao, usuario, turma_id)
    if not atividade["aberta"]:
        raise HTTPException(status_code=409, detail="Esta atividade está encerrada.")
    validar_arquivos(arquivos, atividade)

    # A trava de escrita impede que dois membros do mesmo grupo enviem ao mesmo tempo e
    # fiquem ambos com entrega vigente.
    conexao.execute("BEGIN IMMEDIATE")
    emails_dos_membros = reunir_emails_dos_membros(conexao, atividade, usuario, membros)
    entrega_anterior = buscar_entrega_vigente_do_membro(conexao, atividade_id, usuario.email)
    recusar_colega_de_outro_grupo(conexao, atividade, usuario, emails_dos_membros, entrega_anterior)
    recusar_excesso_de_versoes(conexao, atividade_id, usuario)

    enviada_em = agora_em_utc()
    if entrega_anterior is not None:
        conexao.execute("UPDATE entrega SET substituida = 1 WHERE id = ?", (entrega_anterior["id"],))
    entrega_id = conexao.execute(
        "INSERT INTO entrega (atividade_id, enviada_por, enviada_em, atrasada) VALUES (?, ?, ?, ?)",
        (
            atividade_id,
            usuario.email,
            enviada_em.isoformat(timespec="seconds"),
            esta_atrasada(enviada_em, atividade["prazo"]),
        ),
    ).lastrowid
    conexao.executemany(
        "INSERT INTO entrega_membro (entrega_id, email) VALUES (?, ?)",
        [(entrega_id, email) for email in sorted(emails_dos_membros)],
    )

    # O nome em disco é gerado aqui; o nome enviado pelo navegador é só metadado.
    pasta_relativa = f"{turma_id}/{atividade_id}/{entrega_id}"
    pasta_da_entrega = pasta_de_arquivos(configuracao) / pasta_relativa
    pasta_da_entrega.mkdir(parents=True)
    try:
        for indice, arquivo in enumerate(arquivos, start=1):
            nome_original = nome_seguro(arquivo.filename or "")
            nome_em_disco = f"{indice}.{extensao_do_arquivo(nome_original)}"
            with (pasta_da_entrega / nome_em_disco).open("wb") as destino:
                shutil.copyfileobj(arquivo.file, destino)
            conexao.execute(
                "INSERT INTO arquivo (entrega_id, nome_original, nome_em_disco, tamanho) VALUES (?, ?, ?, ?)",
                (
                    entrega_id,
                    nome_original,
                    f"{pasta_relativa}/{nome_em_disco}",
                    (pasta_da_entrega / nome_em_disco).stat().st_size,
                ),
            )
    except BaseException:
        shutil.rmtree(pasta_da_entrega, ignore_errors=True)
        raise

    entrega = conexao.execute("SELECT * FROM entrega WHERE id = ?", (entrega_id,)).fetchone()
    return entrega_para_json(conexao, entrega, turma_id, com_emails=False)


@roteador.get("/arquivos/{arquivo_id}")
def baixar_arquivo(
    arquivo_id: int,
    usuario: UsuarioAtual,
    conexao: ConexaoDoBanco,
    configuracao: ConfiguracaoAtual,
) -> FileResponse:
    arquivo = conexao.execute(
        """
        SELECT arquivo.*, atividade.turma_id FROM arquivo
        JOIN entrega ON entrega.id = arquivo.entrega_id
        JOIN atividade ON atividade.id = entrega.atividade_id
        WHERE arquivo.id = ?
        """,
        (arquivo_id,),
    ).fetchone()
    if arquivo is None:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado.")

    if not usuario.professor:
        e_membro = conexao.execute(
            "SELECT 1 FROM entrega_membro WHERE entrega_id = ? AND email = ?",
            (arquivo["entrega_id"], usuario.email),
        ).fetchone()
        # Mesma resposta de arquivo inexistente: não revela que a entrega de outro existe.
        if e_membro is None:
            raise HTTPException(status_code=404, detail="Arquivo não encontrado.")
        exigir_aluno_da_turma(conexao, usuario, arquivo["turma_id"])

    return FileResponse(
        pasta_de_arquivos(configuracao) / arquivo["nome_em_disco"],
        filename=arquivo["nome_original"],
        media_type="application/octet-stream",
        headers={"X-Content-Type-Options": "nosniff"},
    )
