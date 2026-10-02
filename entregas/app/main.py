"""Serviço de entregas de arquivos por disciplina."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import rotas_aluno, rotas_professor
from app.banco import preparar_banco
from app.config import Configuracao, carregar_configuracao
from app.dependencias import caminho_do_banco, pasta_de_arquivos
from app.identidade import VerificadorDeToken, criar_verificador_google


def criar_app(configuracao: Configuracao, verificar_token: VerificadorDeToken) -> FastAPI:
    preparar_banco(caminho_do_banco(configuracao))
    pasta_de_arquivos(configuracao).mkdir(parents=True, exist_ok=True)

    app = FastAPI(title="Entregas", docs_url=None, redoc_url=None, openapi_url=None)
    app.state.configuracao = configuracao
    app.state.verificar_token = verificar_token

    # As páginas ficam no GitHub Pages, em outro domínio. A identidade vai no cabeçalho
    # Authorization, não em cookies.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(configuracao.origens_permitidas),
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
        expose_headers=["Content-Disposition"],
    )

    @app.get("/saude")
    def saude() -> dict[str, str]:
        return {"situacao": "ok"}

    app.include_router(rotas_aluno.roteador)
    app.include_router(rotas_professor.roteador)
    return app


def criar_app_de_producao() -> FastAPI:
    configuracao = carregar_configuracao()
    return criar_app(configuracao, criar_verificador_google(configuracao.google_client_id))
