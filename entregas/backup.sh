#!/usr/bin/env bash
# Refaz, no próprio servidor, o arquivo único de backup do serviço de entregas: uma cópia
# consistente do banco e os arquivos enviados. Roda toda noite pelo cron do deployer.
set -euo pipefail

DADOS="/var/local/apps/disciplinas-dados"
DESTINO="/var/local/apps/disciplinas-backup"
ARQUIVO="$DESTINO/entregas-backup.tar.gz"

mkdir -p "$DESTINO"
chmod 700 "$DESTINO"

# Cópia consistente do banco, feita pelo próprio SQLite com o serviço no ar.
cd /var/local/apps/disciplinas/entregas
docker compose exec -T entregas python -c "
import sqlite3
origem = sqlite3.connect('/dados/entregas.sqlite3')
destino = sqlite3.connect('/dados/entregas.backup.sqlite3')
origem.backup(destino)
destino.close()
origem.close()
" < /dev/null

# Grava em um arquivo provisório e troca no fim: uma falha no meio não destrói o backup anterior.
tar -czf "$ARQUIVO.novo" -C "$DADOS" entregas.backup.sqlite3 arquivos
mv "$ARQUIVO.novo" "$ARQUIVO"
rm "$DADOS/entregas.backup.sqlite3"

echo "$(date -Is) backup refeito: $ARQUIVO ($(du -h "$ARQUIVO" | cut -f1))"
