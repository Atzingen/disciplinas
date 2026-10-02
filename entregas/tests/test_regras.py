"""Regras puras: leitura da lista do SUAP, prazo e material."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.regras import interpretar_lista_de_alunos, material_valido, prazo_local_para_utc
from tests.conftest import como, criar_atividade


def test_lista_do_suap_e_lida_em_formatos_variados() -> None:
    texto = """
    1\tPC3012345\tAna Beatriz de Souza\tana.souza@aluno.ifsp.edu.br\tMatriculado
    Bruno Lima <Bruno.Lima@aluno.ifsp.edu.br>
    carla.dias@aluno.ifsp.edu.br
    Davi Reis;davi@gmail.com;davi.reis@aluno.ifsp.edu.br
    Érica Nunes, erica@gmail.com
    Nome  Prontuário  E-mail
    Ana repetida;ana.souza@aluno.ifsp.edu.br
    """

    alunos, linhas_ignoradas = interpretar_lista_de_alunos(texto)

    assert alunos == {
        "ana.souza@aluno.ifsp.edu.br": "Ana Beatriz de Souza",
        "bruno.lima@aluno.ifsp.edu.br": "Bruno Lima",
        "carla.dias@aluno.ifsp.edu.br": "carla.dias",
        "davi.reis@aluno.ifsp.edu.br": "Davi Reis",
    }
    assert linhas_ignoradas == ["Érica Nunes, erica@gmail.com", "Nome  Prontuário  E-mail"]


def test_reimportar_a_lista_informa_quem_entrou_e_saiu_e_corta_o_acesso(
    cliente: TestClient, turma_id: int
) -> None:
    nova_lista = "Ana Souza;ana@aluno.ifsp.edu.br\nÉrica Nunes;erica@aluno.ifsp.edu.br"

    resultado = cliente.put(
        f"/turmas/{turma_id}/matriculas", json={"texto": nova_lista}, headers=como("professor")
    ).json()

    assert (resultado["entraram"], resultado["sairam"], resultado["permaneceram"]) == (1, 3, 1)
    assert cliente.get("/disciplinas/prclfbe/minhas-entregas", headers=como("bruno")).status_code == 403
    assert cliente.get("/disciplinas/prclfbe/minhas-entregas", headers=como("de_outra_turma")).status_code == 200


def test_prazo_e_interpretado_no_horario_de_sao_paulo() -> None:
    assert prazo_local_para_utc("2026-10-10T23:59").isoformat() == "2026-10-11T02:59:00+00:00"


def test_prazo_volta_para_o_professor_no_horario_local(cliente: TestClient, turma_id: int) -> None:
    atividade = criar_atividade(cliente, turma_id, prazo_local="2026-10-10T23:59")

    assert atividade["prazo"] == "2026-10-11T02:59:00+00:00"
    assert atividade["prazo_local"] == "2026-10-10T23:59"


def test_material_so_aceita_caminho_dentro_do_portal(cliente: TestClient, turma_id: int) -> None:
    assert material_valido("experimentos/08-ressonancia-rlc/")
    assert material_valido("")
    for perigoso in ("javascript:alert(1)", "https://exemplo.com/", "//exemplo.com", "/etc", "../fora"):
        assert not material_valido(perigoso)
        resposta = cliente.post(
            f"/turmas/{turma_id}/atividades",
            json={"titulo": "x", "prazo_local": "2099-01-01T10:00", "material": perigoso},
            headers=como("professor"),
        )
        assert resposta.status_code == 400
