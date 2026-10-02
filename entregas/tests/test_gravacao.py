"""O que foi gravado precisa estar no banco quando a resposta chega ao navegador."""

from __future__ import annotations

import asyncio
import json
import sqlite3
from pathlib import Path
from typing import Any

from fastapi import FastAPI


def test_turma_criada_ja_esta_no_banco_quando_a_resposta_sai(
    aplicacao: FastAPI, pasta_dados: Path
) -> None:
    """A página consulta a turma assim que recebe a resposta da criação.

    O cliente de teste comum só devolve a resposta depois de a requisição inteira terminar
    e não enxerga a ordem; por isso este teste observa o instante em que a resposta sai.
    """
    turmas_no_banco_quando_a_resposta_saiu: list[int] = []
    corpo = json.dumps({"disciplina": "PRCLFBE", "semestre": "2026-2"}).encode()

    async def receber() -> dict[str, Any]:
        return {"type": "http.request", "body": corpo, "more_body": False}

    async def enviar(mensagem: dict[str, Any]) -> None:
        if mensagem["type"] == "http.response.start":
            outra_conexao = sqlite3.connect(pasta_dados / "entregas.sqlite3")
            total = outra_conexao.execute("SELECT COUNT(*) FROM turma").fetchone()[0]
            outra_conexao.close()
            turmas_no_banco_quando_a_resposta_saiu.append(total)

    requisicao = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": "POST",
        "scheme": "http",
        "path": "/turmas",
        "raw_path": b"/turmas",
        "query_string": b"",
        "root_path": "",
        "headers": [
            (b"authorization", b"Bearer professor"),
            (b"content-type", b"application/json"),
            (b"content-length", str(len(corpo)).encode()),
        ],
        "client": ("127.0.0.1", 50000),
        "server": ("teste", 80),
    }

    asyncio.run(aplicacao(requisicao, receber, enviar))

    assert turmas_no_banco_quando_a_resposta_saiu == [1]
