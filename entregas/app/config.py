"""Configuração do serviço, lida das variáveis de ambiente."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

# O domínio dos servidores é aceito como aluno para que o professor possa entrar em uma
# turma de teste com a própria conta. A barreira efetiva é sempre a lista da turma.
DOMINIOS_DE_ALUNO = frozenset({"aluno.ifsp.edu.br", "ifsp.edu.br"})

MAXIMO_DE_VERSOES_POR_ATIVIDADE = 10


@dataclass(frozen=True)
class Configuracao:
    google_client_id: str
    professores: frozenset[str]
    origens_permitidas: tuple[str, ...]
    pasta_dados: Path


def _separar_por_virgula(valor: str) -> list[str]:
    return [item.strip() for item in valor.split(",") if item.strip()]


def carregar_configuracao() -> Configuracao:
    professores = _separar_por_virgula(os.environ["PROFESSORES"])
    return Configuracao(
        google_client_id=os.environ["GOOGLE_CLIENT_ID"],
        professores=frozenset(email.lower() for email in professores),
        origens_permitidas=tuple(_separar_por_virgula(os.environ["ORIGENS_PERMITIDAS"])),
        pasta_dados=Path(os.environ.get("PASTA_DADOS", "/dados")),
    )
