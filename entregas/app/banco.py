"""Banco SQLite do serviço: conexão e criação das tabelas."""

from __future__ import annotations

import sqlite3
from pathlib import Path

TABELAS = """
CREATE TABLE IF NOT EXISTS turma (
    id INTEGER PRIMARY KEY,
    disciplina TEXT NOT NULL,
    semestre TEXT NOT NULL,
    criada_em TEXT NOT NULL,
    UNIQUE (disciplina, semestre)
);

CREATE TABLE IF NOT EXISTS matricula (
    id INTEGER PRIMARY KEY,
    turma_id INTEGER NOT NULL REFERENCES turma(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    nome TEXT NOT NULL,
    UNIQUE (turma_id, email)
);

CREATE TABLE IF NOT EXISTS atividade (
    id INTEGER PRIMARY KEY,
    turma_id INTEGER NOT NULL REFERENCES turma(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    prazo TEXT NOT NULL,
    em_grupo INTEGER NOT NULL,
    extensoes TEXT NOT NULL,
    tamanho_max_mb INTEGER NOT NULL,
    max_arquivos INTEGER NOT NULL,
    material TEXT NOT NULL,
    aberta INTEGER NOT NULL,
    criada_em TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS entrega (
    id INTEGER PRIMARY KEY,
    atividade_id INTEGER NOT NULL REFERENCES atividade(id) ON DELETE CASCADE,
    enviada_por TEXT NOT NULL,
    enviada_em TEXT NOT NULL,
    atrasada INTEGER NOT NULL,
    substituida INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS entrega_membro (
    entrega_id INTEGER NOT NULL REFERENCES entrega(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    PRIMARY KEY (entrega_id, email)
);

CREATE TABLE IF NOT EXISTS arquivo (
    id INTEGER PRIMARY KEY,
    entrega_id INTEGER NOT NULL REFERENCES entrega(id) ON DELETE CASCADE,
    nome_original TEXT NOT NULL,
    nome_em_disco TEXT NOT NULL,
    tamanho INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS entrega_por_atividade ON entrega (atividade_id, substituida);
CREATE INDEX IF NOT EXISTS membro_por_email ON entrega_membro (email);
"""


def conectar(caminho_do_banco: Path) -> sqlite3.Connection:
    # As rotas síncronas do FastAPI rodam em um conjunto de threads; a conexão é criada
    # em uma e usada em outra dentro da mesma requisição, nunca por duas ao mesmo tempo.
    conexao = sqlite3.connect(caminho_do_banco, timeout=10, check_same_thread=False)
    conexao.row_factory = sqlite3.Row
    conexao.execute("PRAGMA foreign_keys = ON")
    return conexao


def preparar_banco(caminho_do_banco: Path) -> None:
    caminho_do_banco.parent.mkdir(parents=True, exist_ok=True)
    conexao = conectar(caminho_do_banco)
    try:
        conexao.execute("PRAGMA journal_mode = WAL")
        conexao.executescript(TABELAS)
        conexao.commit()
    finally:
        conexao.close()
