"""Quem pode entrar: domínio da conta, lista da turma e papel de professor."""

from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from tests.conftest import como, criar_atividade, enviar


def test_conta_fora_do_dominio_do_ifsp_e_recusada_mesmo_com_email_da_lista(
    cliente: TestClient, turma_id: int
) -> None:
    atividade = criar_atividade(cliente, turma_id)

    for identidade in ("ana_sem_dominio", "ana_de_outro_dominio"):
        assert enviar(cliente, atividade["id"], identidade).status_code == 403
        assert cliente.get("/disciplinas/prclfbe/minhas-entregas", headers=como(identidade)).status_code == 403


def test_aluno_fora_da_lista_da_turma_nao_envia_nem_le_entregas(
    cliente: TestClient, turma_id: int
) -> None:
    atividade = criar_atividade(cliente, turma_id)

    assert enviar(cliente, atividade["id"], "de_outra_turma").status_code == 403
    assert cliente.get("/disciplinas/prclfbe/minhas-entregas", headers=como("de_outra_turma")).status_code == 403
    assert cliente.get(f"/turmas/{turma_id}/colegas", headers=como("de_outra_turma")).status_code == 403


def test_sem_token_ou_com_token_invalido_nao_entra(cliente: TestClient, turma_id: int) -> None:
    assert cliente.get("/eu").status_code == 401
    assert cliente.get("/eu", headers=como("token-inventado")).status_code == 401


def test_aluno_nao_usa_rotas_de_professor(cliente: TestClient, turma_id: int) -> None:
    atividade = criar_atividade(cliente, turma_id)
    aluno = como("ana")

    assert cliente.get("/turmas", headers=aluno).status_code == 403
    assert cliente.get(f"/turmas/{turma_id}/matriculas", headers=aluno).status_code == 403
    assert cliente.put(f"/turmas/{turma_id}/matriculas", json={"texto": "x"}, headers=aluno).status_code == 403
    assert cliente.post(f"/turmas/{turma_id}/atividades", json={}, headers=aluno).status_code == 403
    assert cliente.patch(f"/atividades/{atividade['id']}", json={"aberta": False}, headers=aluno).status_code == 403
    assert cliente.get(f"/atividades/{atividade['id']}/entregas", headers=aluno).status_code == 403
    assert cliente.get(f"/atividades/{atividade['id']}/entregas.zip", headers=aluno).status_code == 403
    assert cliente.delete(f"/turmas/{turma_id}", headers=aluno).status_code == 403


def test_aluno_nao_baixa_arquivo_de_entrega_alheia(cliente: TestClient, turma_id: int) -> None:
    atividade = criar_atividade(cliente, turma_id)
    entrega_da_ana = enviar(cliente, atividade["id"], "ana").json()
    arquivo_id = entrega_da_ana["arquivos"][0]["id"]

    assert cliente.get(f"/arquivos/{arquivo_id}", headers=como("bruno")).status_code == 404
    assert cliente.get(f"/arquivos/{arquivo_id}", headers=como("ana")).status_code == 200
    assert cliente.get(f"/arquivos/{arquivo_id}", headers=como("professor")).status_code == 200


def test_lista_publica_de_atividades_nao_expoe_dados_de_alunos(
    cliente: TestClient, turma_id: int
) -> None:
    atividade = criar_atividade(cliente, turma_id)
    enviar(cliente, atividade["id"], "ana")

    resposta = cliente.get("/disciplinas/prclfbe/atividades")

    assert resposta.status_code == 200
    assert resposta.json()["atividades"][0]["titulo"] == "Relatório do experimento 8"
    assert "aluno.ifsp.edu.br" not in resposta.text
    assert "Ana" not in resposta.text
    assert "relatorio.pdf" not in resposta.text


def test_apagar_turma_remove_os_arquivos_do_disco(
    cliente: TestClient, turma_id: int, pasta_dados: Path
) -> None:
    atividade = criar_atividade(cliente, turma_id)
    enviar(cliente, atividade["id"], "ana")
    assert list((pasta_dados / "arquivos").rglob("*.pdf"))

    assert cliente.delete(f"/turmas/{turma_id}", headers=como("professor")).status_code == 204

    assert not list((pasta_dados / "arquivos").rglob("*.pdf"))
    assert cliente.get("/disciplinas/prclfbe/atividades").json() == {"turma": None, "atividades": []}
