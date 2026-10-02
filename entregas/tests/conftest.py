from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.config import Configuracao
from app.main import criar_app

# Cada "token" de teste é o nome de uma identidade. A verificação real do Google é trocada
# por esta tabela; as regras de domínio, lista e papel rodam de verdade.
IDENTIDADES: dict[str, dict[str, Any]] = {
    "professor": {"email": "professor@ifsp.edu.br", "email_verified": True, "hd": "ifsp.edu.br", "name": "Professor"},
    "ana": {"email": "ana@aluno.ifsp.edu.br", "email_verified": True, "hd": "aluno.ifsp.edu.br", "name": "Ana"},
    "bruno": {"email": "bruno@aluno.ifsp.edu.br", "email_verified": True, "hd": "aluno.ifsp.edu.br", "name": "Bruno"},
    "carla": {"email": "carla@aluno.ifsp.edu.br", "email_verified": True, "hd": "aluno.ifsp.edu.br", "name": "Carla"},
    "davi": {"email": "davi@aluno.ifsp.edu.br", "email_verified": True, "hd": "aluno.ifsp.edu.br", "name": "Davi"},
    "de_outra_turma": {"email": "erica@aluno.ifsp.edu.br", "email_verified": True, "hd": "aluno.ifsp.edu.br", "name": "Érica"},
    # Mesmo e-mail da Ana, mas a conta não pertence ao domínio hospedado do IFSP.
    "ana_sem_dominio": {"email": "ana@aluno.ifsp.edu.br", "email_verified": True, "name": "Ana"},
    "ana_de_outro_dominio": {"email": "ana@aluno.ifsp.edu.br", "email_verified": True, "hd": "outro.edu.br", "name": "Ana"},
}

LISTA_DA_TURMA = """
Ana Souza;ana@aluno.ifsp.edu.br
Bruno Lima;bruno@aluno.ifsp.edu.br
Carla Dias;carla@aluno.ifsp.edu.br
Davi Reis;davi@aluno.ifsp.edu.br
"""

PDF = ("relatorio.pdf", b"%PDF-1.4 conteudo", "application/pdf")


def verificar_token_de_teste(token: str) -> dict[str, Any]:
    if token not in IDENTIDADES:
        raise ValueError("token desconhecido")
    return IDENTIDADES[token]


def como(identidade: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {identidade}"}


@pytest.fixture
def pasta_dados(tmp_path: Path) -> Path:
    return tmp_path / "dados"


@pytest.fixture
def aplicacao(pasta_dados: Path) -> FastAPI:
    configuracao = Configuracao(
        google_client_id="cliente-de-teste",
        professores=frozenset({"professor@ifsp.edu.br"}),
        origens_permitidas=("https://atzingen.github.io",),
        pasta_dados=pasta_dados,
    )
    return criar_app(configuracao, verificar_token_de_teste)


@pytest.fixture
def cliente(aplicacao: FastAPI) -> TestClient:
    return TestClient(aplicacao)


@pytest.fixture
def turma_id(cliente: TestClient) -> int:
    turma = cliente.post(
        "/turmas", json={"disciplina": "PRCLFBE", "semestre": "2026-2"}, headers=como("professor")
    ).json()
    resposta = cliente.put(
        f"/turmas/{turma['id']}/matriculas", json={"texto": LISTA_DA_TURMA}, headers=como("professor")
    )
    assert resposta.json()["entraram"] == 4
    return turma["id"]


def criar_atividade(cliente: TestClient, turma_id: int, **campos: Any) -> dict[str, Any]:
    dados = {"titulo": "Relatório do experimento 8", "prazo_local": "2099-12-31T23:59", **campos}
    resposta = cliente.post(f"/turmas/{turma_id}/atividades", json=dados, headers=como("professor"))
    assert resposta.status_code == 201, resposta.text
    return resposta.json()


def enviar(
    cliente: TestClient,
    atividade_id: int,
    identidade: str,
    arquivos: list[tuple[str, bytes, str]] | None = None,
    membros: list[int] | None = None,
):
    return cliente.post(
        f"/atividades/{atividade_id}/entregas",
        files=[("arquivos", arquivo) for arquivo in (arquivos or [PDF])],
        data={"membros": [str(membro) for membro in (membros or [])]},
        headers=como(identidade),
    )


def id_do_colega(cliente: TestClient, turma_id: int, nome: str) -> int:
    colegas = cliente.get(f"/turmas/{turma_id}/colegas", headers=como("professor")).json()
    return next(colega["id"] for colega in colegas if colega["nome"].startswith(nome))
