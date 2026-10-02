"""Consultas ao banco compartilhadas pelas rotas de aluno e de professor."""

from __future__ import annotations

import sqlite3
from typing import Any

from fastapi import HTTPException

from app.regras import utc_para_prazo_local


def buscar_turma(conexao: sqlite3.Connection, turma_id: int) -> sqlite3.Row:
    turma = conexao.execute("SELECT * FROM turma WHERE id = ?", (turma_id,)).fetchone()
    if turma is None:
        raise HTTPException(status_code=404, detail="Turma não encontrada.")
    return turma


def buscar_turma_vigente(conexao: sqlite3.Connection, disciplina: str) -> sqlite3.Row | None:
    """A turma vigente de uma disciplina é a de semestre mais recente."""
    return conexao.execute(
        "SELECT * FROM turma WHERE disciplina = ? ORDER BY semestre DESC LIMIT 1",
        (disciplina.upper(),),
    ).fetchone()


def buscar_atividade(conexao: sqlite3.Connection, atividade_id: int) -> sqlite3.Row:
    atividade = conexao.execute(
        "SELECT * FROM atividade WHERE id = ?", (atividade_id,)
    ).fetchone()
    if atividade is None:
        raise HTTPException(status_code=404, detail="Atividade não encontrada.")
    return atividade


def turma_para_json(turma: sqlite3.Row) -> dict[str, Any]:
    return {"id": turma["id"], "disciplina": turma["disciplina"], "semestre": turma["semestre"]}


def atividade_para_json(atividade: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": atividade["id"],
        "turma_id": atividade["turma_id"],
        "titulo": atividade["titulo"],
        "descricao": atividade["descricao"],
        "prazo": atividade["prazo"],
        "prazo_local": utc_para_prazo_local(atividade["prazo"]),
        "em_grupo": bool(atividade["em_grupo"]),
        "extensoes": atividade["extensoes"].split(","),
        "tamanho_max_mb": atividade["tamanho_max_mb"],
        "max_arquivos": atividade["max_arquivos"],
        "material": atividade["material"],
        "aberta": bool(atividade["aberta"]),
    }


def buscar_entrega_vigente_do_membro(
    conexao: sqlite3.Connection, atividade_id: int, email: str
) -> sqlite3.Row | None:
    return conexao.execute(
        """
        SELECT entrega.*
        FROM entrega
        JOIN entrega_membro ON entrega_membro.entrega_id = entrega.id
        WHERE entrega.atividade_id = ? AND entrega.substituida = 0 AND entrega_membro.email = ?
        """,
        (atividade_id, email),
    ).fetchone()


def nome_na_turma(conexao: sqlite3.Connection, turma_id: int, email: str) -> str:
    matricula = conexao.execute(
        "SELECT nome FROM matricula WHERE turma_id = ? AND email = ?", (turma_id, email)
    ).fetchone()
    # Quem saiu da lista da turma continua aparecendo nas entregas antigas, pelo e-mail.
    return matricula["nome"] if matricula is not None else email


def entrega_para_json(
    conexao: sqlite3.Connection, entrega: sqlite3.Row, turma_id: int, com_emails: bool
) -> dict[str, Any]:
    # Quem saiu da lista da turma continua na entrega, identificado pelo e-mail e sem matrícula.
    linhas_dos_membros = conexao.execute(
        """
        SELECT entrega_membro.email, matricula.id AS matricula_id, matricula.nome
        FROM entrega_membro
        LEFT JOIN matricula
            ON matricula.email = entrega_membro.email AND matricula.turma_id = ?
        WHERE entrega_membro.entrega_id = ?
        """,
        (turma_id, entrega["id"]),
    ).fetchall()
    membros: list[dict[str, Any]] = []
    for linha in linhas_dos_membros:
        membro = {"nome": linha["nome"] or linha["email"], "matricula_id": linha["matricula_id"]}
        if com_emails:
            membro["email"] = linha["email"]
        membros.append(membro)
    membros.sort(key=lambda membro: membro["nome"].casefold())

    arquivos = [
        {"id": linha["id"], "nome": linha["nome_original"], "tamanho": linha["tamanho"]}
        for linha in conexao.execute(
            "SELECT * FROM arquivo WHERE entrega_id = ? ORDER BY id", (entrega["id"],)
        )
    ]

    return {
        "id": entrega["id"],
        "atividade_id": entrega["atividade_id"],
        "enviada_por": nome_na_turma(conexao, turma_id, entrega["enviada_por"]),
        "enviada_em": entrega["enviada_em"],
        "atrasada": bool(entrega["atrasada"]),
        "substituida": bool(entrega["substituida"]),
        "membros": membros,
        "arquivos": arquivos,
    }
