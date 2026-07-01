#!/usr/bin/env bash

set -euo pipefail

script_directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
project_directory="$(cd -- "${script_directory}/.." && pwd)"

cd "${project_directory}"

postgres_service="$(docker compose ps --status running postgres --format '{{.Service}}')"

if [[ "${postgres_service}" != "postgres" ]]; then
    echo "O PostgreSQL não está em execução. Rode docker compose up -d antes."
    exit 1
fi

echo "Aguardando o PostgreSQL ficar disponível..."

until docker compose exec -T postgres sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"' >/dev/null 2>&1; do
    sleep 1
done

docker compose exec -T postgres sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < "${script_directory}/test-data.sql"

echo "Dados de teste carregados."
echo "Senha de todas as contas: teste123456"
echo "Jogador: gabriel.player@teste.local"
echo "Proprietário: rafael.owner@teste.local"
