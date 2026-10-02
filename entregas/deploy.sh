#!/usr/bin/env bash
# Atualiza o clone do servidor para a main e reconstrói o serviço de entregas.
# É o único comando que a chave de deploy do GitHub Actions executa: ela entra no
# authorized_keys do servidor com este script como comando forçado.
set -euo pipefail

cd /var/local/apps/disciplinas
git fetch --quiet origin main
git checkout --quiet main
git reset --quiet --hard origin/main

cd entregas
docker compose up -d --build < /dev/null

for _ in $(seq 1 30); do
    if curl -fsS http://127.0.0.1:8100/saude > /dev/null; then
        echo "Serviço de entregas no ar."
        exit 0
    fi
    sleep 2
done

echo "O serviço não respondeu em /saude." >&2
docker compose logs --tail 50 < /dev/null >&2
exit 1
