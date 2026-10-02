"""Dependências das rotas: configuração, conexão com o banco e usuário autenticado."""

from __future__ import annotations

import sqlite3
from collections.abc import Iterator
from pathlib import Path

from fastapi import Depends, Header, HTTPException, Request

from app.banco import conectar
from app.config import DOMINIOS_DE_ALUNO, Configuracao
from app.identidade import TokenInvalido, Usuario, identificar_usuario


def obter_configuracao(request: Request) -> Configuracao:
    return request.app.state.configuracao


def caminho_do_banco(configuracao: Configuracao) -> Path:
    return configuracao.pasta_dados / "entregas.sqlite3"


def pasta_de_arquivos(configuracao: Configuracao) -> Path:
    return configuracao.pasta_dados / "arquivos"


def obter_conexao(
    configuracao: Configuracao = Depends(obter_configuracao),
) -> Iterator[sqlite3.Connection]:
    conexao = conectar(caminho_do_banco(configuracao))
    try:
        yield conexao
        conexao.commit()
    except BaseException:
        conexao.rollback()
        raise
    finally:
        conexao.close()


def obter_usuario(
    request: Request,
    authorization: str | None = Header(default=None),
    configuracao: Configuracao = Depends(obter_configuracao),
) -> Usuario:
    if authorization is None or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Entre com a sua conta Google.")

    token = authorization.removeprefix("Bearer ").strip()
    try:
        return identificar_usuario(token, request.app.state.verificar_token, configuracao)
    except TokenInvalido as erro:
        raise HTTPException(status_code=401, detail=str(erro)) from erro


def exigir_professor(usuario: Usuario = Depends(obter_usuario)) -> Usuario:
    if not usuario.professor:
        raise HTTPException(status_code=403, detail="Esta área é só para professores.")
    return usuario


def exigir_aluno_da_turma(conexao: sqlite3.Connection, usuario: Usuario, turma_id: int) -> None:
    if usuario.dominio not in DOMINIOS_DE_ALUNO:
        raise HTTPException(
            status_code=403,
            detail="Entre com a conta Google do IFSP (@aluno.ifsp.edu.br).",
        )
    matricula = conexao.execute(
        "SELECT 1 FROM matricula WHERE turma_id = ? AND email = ?",
        (turma_id, usuario.email),
    ).fetchone()
    if matricula is None:
        raise HTTPException(
            status_code=403,
            detail="A sua conta não está na lista desta turma. Fale com o professor.",
        )
