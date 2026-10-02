"""Regras de envio: prazo, versões, grupos e limites dos arquivos."""

from __future__ import annotations

import io
import zipfile
from pathlib import Path

from fastapi.testclient import TestClient

from tests.conftest import PDF, como, criar_atividade, enviar, id_do_colega


def test_envio_depois_do_prazo_entra_marcado_como_atrasado(
    cliente: TestClient, turma_id: int
) -> None:
    no_prazo = criar_atividade(cliente, turma_id, prazo_local="2099-12-31T23:59")
    vencida = criar_atividade(cliente, turma_id, prazo_local="2020-01-01T08:00")

    assert enviar(cliente, no_prazo["id"], "ana").json()["atrasada"] is False

    resposta = enviar(cliente, vencida["id"], "ana")
    assert resposta.status_code == 201
    assert resposta.json()["atrasada"] is True


def test_reenvio_cria_versao_nova_e_mantem_a_anterior(
    cliente: TestClient, turma_id: int
) -> None:
    atividade = criar_atividade(cliente, turma_id)
    primeira = enviar(cliente, atividade["id"], "ana", [("v1.pdf", b"versao 1", "application/pdf")]).json()
    segunda = enviar(cliente, atividade["id"], "ana", [("v2.pdf", b"versao 2", "application/pdf")]).json()

    recebidas = cliente.get(f"/atividades/{atividade['id']}/entregas", headers=como("professor")).json()

    assert [entrega["id"] for entrega in recebidas["vigentes"]] == [segunda["id"]]
    assert [entrega["id"] for entrega in recebidas["substituidas"]] == [primeira["id"]]
    arquivo_antigo = primeira["arquivos"][0]["id"]
    assert cliente.get(f"/arquivos/{arquivo_antigo}", headers=como("professor")).content == b"versao 1"

    minhas = cliente.get("/disciplinas/prclfbe/minhas-entregas", headers=como("ana")).json()
    assert [entrega["id"] for entrega in minhas["entregas"]] == [segunda["id"]]


def test_zip_traz_so_as_entregas_vigentes_e_lista_quem_falta(
    cliente: TestClient, turma_id: int
) -> None:
    atividade = criar_atividade(cliente, turma_id)
    enviar(cliente, atividade["id"], "ana", [("v1.pdf", b"versao 1", "application/pdf")])
    enviar(cliente, atividade["id"], "ana", [("v2.pdf", b"versao 2", "application/pdf")])
    enviar(cliente, atividade["id"], "bruno")

    resposta = cliente.get(f"/atividades/{atividade['id']}/entregas.zip", headers=como("professor"))
    nomes = zipfile.ZipFile(io.BytesIO(resposta.content)).namelist()
    recebidas = cliente.get(f"/atividades/{atividade['id']}/entregas", headers=como("professor")).json()

    assert sorted(nomes) == ["Ana Souza/v2.pdf", "Bruno Lima/relatorio.pdf"]
    assert [aluno["nome"] for aluno in recebidas["faltam"]] == ["Carla Dias", "Davi Reis"]


def test_colega_que_ja_esta_em_outro_grupo_recusa_o_envio(
    cliente: TestClient, turma_id: int
) -> None:
    atividade = criar_atividade(cliente, turma_id, em_grupo=True)
    bruno = id_do_colega(cliente, turma_id, "Bruno")
    carla = id_do_colega(cliente, turma_id, "Carla")
    assert enviar(cliente, atividade["id"], "ana", membros=[bruno]).status_code == 201

    resposta = enviar(cliente, atividade["id"], "carla", membros=[bruno])

    assert resposta.status_code == 409
    assert resposta.json()["detail"] == "Bruno Lima já está na entrega enviada por Ana Souza."
    # O próprio grupo pode reenviar, por qualquer membro, e trocar a composição.
    reenvio = enviar(cliente, atividade["id"], "bruno", membros=[id_do_colega(cliente, turma_id, "Ana"), carla])
    assert reenvio.status_code == 201
    assert [membro["nome"] for membro in reenvio.json()["membros"]] == ["Ana Souza", "Bruno Lima", "Carla Dias"]
    recebidas = cliente.get(f"/atividades/{atividade['id']}/entregas", headers=como("professor")).json()
    assert len(recebidas["vigentes"]) == 1
    assert [aluno["nome"] for aluno in recebidas["faltam"]] == ["Davi Reis"]


def test_atividade_individual_nao_aceita_colegas(cliente: TestClient, turma_id: int) -> None:
    atividade = criar_atividade(cliente, turma_id, em_grupo=False)
    bruno = id_do_colega(cliente, turma_id, "Bruno")

    assert enviar(cliente, atividade["id"], "ana", membros=[bruno]).status_code == 400


def test_arquivo_fora_dos_limites_e_recusado_e_nada_fica_no_disco(
    cliente: TestClient, turma_id: int, pasta_dados: Path
) -> None:
    atividade = criar_atividade(cliente, turma_id, extensoes=["pdf"], tamanho_max_mb=1, max_arquivos=1)
    grande_demais = ("grande.pdf", b"x" * (1024 * 1024 + 1), "application/pdf")

    assert enviar(cliente, atividade["id"], "ana", [("virus.exe", b"MZ", "application/pdf")]).status_code == 400
    assert enviar(cliente, atividade["id"], "ana", [("sem-extensao", b"abc", "application/pdf")]).status_code == 400
    assert enviar(cliente, atividade["id"], "ana", [grande_demais]).status_code == 413
    assert enviar(cliente, atividade["id"], "ana", [PDF, PDF]).status_code == 400
    assert enviar(cliente, atividade["id"], "ana", [("vazio.pdf", b"", "application/pdf")]).status_code == 400

    assert not [caminho for caminho in (pasta_dados / "arquivos").rglob("*") if caminho.is_file()]
    recebidas = cliente.get(f"/atividades/{atividade['id']}/entregas", headers=como("professor")).json()
    assert recebidas["vigentes"] == []


def test_nome_de_arquivo_com_diretorios_nao_escapa_da_pasta_de_dados(
    cliente: TestClient, turma_id: int, pasta_dados: Path
) -> None:
    atividade = criar_atividade(cliente, turma_id)

    resposta = enviar(cliente, atividade["id"], "ana", [("../../../fora.pdf", b"conteudo", "application/pdf")])

    assert resposta.status_code == 201
    assert resposta.json()["arquivos"][0]["nome"] == "fora.pdf"
    arquivos_gravados = [caminho for caminho in pasta_dados.parent.rglob("*.pdf")]
    assert len(arquivos_gravados) == 1
    assert arquivos_gravados[0].is_relative_to(pasta_dados / "arquivos")
    assert arquivos_gravados[0].name == "1.pdf"


def test_atividade_encerrada_nao_recebe_envio(cliente: TestClient, turma_id: int) -> None:
    atividade = criar_atividade(cliente, turma_id)
    cliente.patch(f"/atividades/{atividade['id']}", json={"aberta": False}, headers=como("professor"))

    assert enviar(cliente, atividade["id"], "ana").status_code == 409


def test_limite_de_versoes_por_atividade(cliente: TestClient, turma_id: int) -> None:
    atividade = criar_atividade(cliente, turma_id)
    for _ in range(10):
        assert enviar(cliente, atividade["id"], "ana").status_code == 201

    assert enviar(cliente, atividade["id"], "ana").status_code == 409
