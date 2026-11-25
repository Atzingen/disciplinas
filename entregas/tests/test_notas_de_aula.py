"""Nota de aula do professor: só a conta de professor lê, e só o que está na pasta de notas."""

from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from tests.conftest import como

NOTA = '<article id="s-capa">roteiro do professor</article>'


@pytest.fixture
def nota_no_servidor(cliente: TestClient, pasta_dados: Path) -> Path:
    # `cliente` vem antes: é a criação do app que prepara a pasta de dados.
    pasta = pasta_dados / "notas-de-aula"
    pasta.mkdir(parents=True, exist_ok=True)
    caminho = pasta / "maxwell-ondas.html"
    caminho.write_text(NOTA, encoding="utf-8")
    return caminho


def test_professor_le_a_nota_de_aula(cliente: TestClient, nota_no_servidor: Path) -> None:
    resposta = cliente.get("/notas-de-aula/maxwell-ondas", headers=como("professor"))

    assert resposta.status_code == 200
    assert resposta.text == NOTA
    assert resposta.headers["content-type"].startswith("text/html")
    # A nota não pode ficar guardada em cache de navegador ou de intermediário.
    assert resposta.headers["cache-control"] == "no-store"


def test_so_a_conta_de_professor_le_a_nota_de_aula(
    cliente: TestClient, nota_no_servidor: Path
) -> None:
    assert cliente.get("/notas-de-aula/maxwell-ondas").status_code == 401
    assert (
        cliente.get("/notas-de-aula/maxwell-ondas", headers=como("token-inventado")).status_code
        == 401
    )

    for aluno in ("ana", "de_outra_turma"):
        resposta = cliente.get("/notas-de-aula/maxwell-ondas", headers=como(aluno))
        assert resposta.status_code == 403, aluno
        assert "roteiro do professor" not in resposta.text


def test_nome_fora_do_padrao_nao_le_arquivo_fora_da_pasta_de_notas(
    cliente: TestClient, nota_no_servidor: Path, pasta_dados: Path
) -> None:
    (pasta_dados / "segredo.html").write_text("fora da pasta de notas", encoding="utf-8")
    # Arquivos que existem na pasta, mas com nome fora do padrão: sem a validação do nome,
    # a rota os entregaria.
    (nota_no_servidor.parent / "Maxwell-Ondas.html").write_text("nome com maiúscula", encoding="utf-8")
    (nota_no_servidor.parent / "rascunho.v2.html").write_text("nome com ponto", encoding="utf-8")
    professor = como("professor")

    for caminho in (
        "/notas-de-aula/aula-que-nao-existe",
        "/notas-de-aula/..%2Fsegredo",
        "/notas-de-aula/%2E%2E%2Fsegredo",
        "/notas-de-aula/..%2Fentregas.sqlite3",
        "/notas-de-aula/maxwell-ondas.html",
        "/notas-de-aula/Maxwell-Ondas",
        "/notas-de-aula/rascunho.v2",
    ):
        resposta = cliente.get(caminho, headers=professor)
        assert resposta.status_code == 404, caminho
        for conteudo in ("fora da pasta de notas", "nome com", "roteiro do professor"):
            assert conteudo not in resposta.text, caminho


def test_link_simbolico_na_pasta_de_notas_nao_entrega_arquivo_de_fora(
    cliente: TestClient, nota_no_servidor: Path, pasta_dados: Path
) -> None:
    fora = pasta_dados / "segredo.html"
    fora.write_text("fora da pasta de notas", encoding="utf-8")
    (nota_no_servidor.parent / "atalho.html").symlink_to(fora)

    resposta = cliente.get("/notas-de-aula/atalho", headers=como("professor"))

    assert resposta.status_code == 404
    assert "fora da pasta de notas" not in resposta.text
