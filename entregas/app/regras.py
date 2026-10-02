"""Regras puras do serviço: não tocam em banco, disco nem rede."""

from __future__ import annotations

import re
from datetime import datetime, timezone
from pathlib import PurePosixPath
from zoneinfo import ZoneInfo

from app.config import DOMINIOS_DE_ALUNO

FUSO_DO_CAMPUS = ZoneInfo("America/Sao_Paulo")
FORMATO_DO_PRAZO_LOCAL = "%Y-%m-%dT%H:%M"

PADRAO_DE_EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
PADRAO_DE_DISCIPLINA = re.compile(r"[A-Z0-9]{3,12}")
PADRAO_DE_SEMESTRE = re.compile(r"\d{4}-[12]")
PADRAO_DE_EXTENSAO = re.compile(r"[a-z0-9]{1,8}")
PADRAO_DE_MATERIAL = re.compile(r"[A-Za-z0-9._/#-]*")
SEPARADORES_DE_COLUNA = re.compile(r"[\t;,|]| {2,}")


def agora_em_utc() -> datetime:
    return datetime.now(timezone.utc)


def prazo_local_para_utc(prazo_local: str) -> datetime:
    """Converte "2026-10-10T23:59", no horário de São Paulo, para UTC."""
    momento_local = datetime.strptime(prazo_local, FORMATO_DO_PRAZO_LOCAL)
    return momento_local.replace(tzinfo=FUSO_DO_CAMPUS).astimezone(timezone.utc)


def utc_para_prazo_local(momento_em_utc: str) -> str:
    momento = datetime.fromisoformat(momento_em_utc)
    return momento.astimezone(FUSO_DO_CAMPUS).strftime(FORMATO_DO_PRAZO_LOCAL)


def esta_atrasada(enviada_em: datetime, prazo_em_utc: str) -> bool:
    return enviada_em > datetime.fromisoformat(prazo_em_utc)


def dominio_do_email(email: str) -> str:
    return email.rsplit("@", 1)[-1].lower()


def interpretar_lista_de_alunos(texto: str) -> tuple[dict[str, str], list[str]]:
    """Lê o texto colado do SUAP, um aluno por linha.

    Devolve os alunos reconhecidos (e-mail -> nome) e as linhas ignoradas. O formato das
    colunas do SUAP não é fixo: a linha vale pelo e-mail institucional que contém, e o nome
    é a coluna com mais letras entre as demais.
    """
    alunos: dict[str, str] = {}
    linhas_ignoradas: list[str] = []

    for linha_bruta in texto.splitlines():
        linha = linha_bruta.strip()
        if not linha:
            continue

        emails_institucionais = [
            email.lower()
            for email in PADRAO_DE_EMAIL.findall(linha)
            if dominio_do_email(email) in DOMINIOS_DE_ALUNO
        ]
        if not emails_institucionais:
            linhas_ignoradas.append(linha)
            continue

        email = emails_institucionais[0]
        linha_sem_emails = PADRAO_DE_EMAIL.sub("\t", linha)
        colunas = [coluna.strip(" \"'<>()") for coluna in SEPARADORES_DE_COLUNA.split(linha_sem_emails)]
        nome = max(colunas, key=lambda coluna: sum(caractere.isalpha() for caractere in coluna))
        if not any(caractere.isalpha() for caractere in nome):
            nome = email.split("@")[0]

        alunos.setdefault(email, nome)

    return alunos, linhas_ignoradas


def normalizar_extensoes(extensoes: list[str]) -> list[str]:
    normalizadas: list[str] = []
    for extensao in extensoes:
        limpa = extensao.strip().lower().lstrip(".")
        if not PADRAO_DE_EXTENSAO.fullmatch(limpa):
            raise ValueError(f"Extensão inválida: {extensao!r}.")
        if limpa not in normalizadas:
            normalizadas.append(limpa)
    if not normalizadas:
        raise ValueError("Informe ao menos uma extensão aceita.")
    return normalizadas


def extensao_do_arquivo(nome: str) -> str:
    return PurePosixPath(nome_seguro(nome)).suffix.lstrip(".").lower()


def nome_seguro(nome_original: str) -> str:
    """Reduz o nome enviado pelo navegador a um nome de arquivo sem diretórios."""
    sem_barras_invertidas = nome_original.replace("\\", "/")
    apenas_o_nome = PurePosixPath(sem_barras_invertidas).name
    sem_controle = "".join(caractere for caractere in apenas_o_nome if caractere.isprintable())
    limpo = sem_controle.strip().strip(".")
    return limpo or "arquivo"


def material_valido(material: str) -> bool:
    """O material é um caminho relativo dentro do portal, nunca um endereço externo."""
    if material.startswith("/") or ".." in material:
        return False
    return PADRAO_DE_MATERIAL.fullmatch(material) is not None
