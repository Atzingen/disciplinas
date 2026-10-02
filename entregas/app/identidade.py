"""Identidade do usuário a partir do token do Google."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

import cachecontrol
import google.auth.transport.requests
import requests
from google.auth.exceptions import GoogleAuthError
from google.oauth2 import id_token

from app.config import Configuracao

VerificadorDeToken = Callable[[str], dict[str, Any]]


class TokenInvalido(Exception):
    pass


@dataclass(frozen=True)
class Usuario:
    email: str
    nome: str
    dominio: str | None
    professor: bool


def criar_verificador_google(google_client_id: str) -> VerificadorDeToken:
    """Verifica assinatura, público, emissor e validade do token do Google.

    A sessão com cache evita buscar os certificados do Google a cada requisição.
    """
    sessao_com_cache = cachecontrol.CacheControl(requests.Session())
    requisicao = google.auth.transport.requests.Request(session=sessao_com_cache)

    def verificar(token: str) -> dict[str, Any]:
        # A folga cobre a diferença de relógio entre o Google e o servidor, que faria um
        # token recém-emitido ser recusado como "usado cedo demais".
        return id_token.verify_oauth2_token(
            token, requisicao, audience=google_client_id, clock_skew_in_seconds=10
        )

    return verificar


def identificar_usuario(
    token: str, verificar_token: VerificadorDeToken, configuracao: Configuracao
) -> Usuario:
    try:
        dados = verificar_token(token)
    except (ValueError, GoogleAuthError) as erro:
        raise TokenInvalido("Login expirado ou inválido. Entre novamente.") from erro

    email = str(dados.get("email", "")).lower()
    if not email or dados.get("email_verified") is not True:
        raise TokenInvalido("A conta Google não tem e-mail verificado.")

    return Usuario(
        email=email,
        nome=str(dados.get("name") or email),
        # "hd" só existe em contas de um domínio hospedado no Google Workspace; o sufixo do
        # e-mail sozinho não garante que a conta pertença ao domínio.
        dominio=dados.get("hd"),
        professor=email in configuracao.professores,
    )
