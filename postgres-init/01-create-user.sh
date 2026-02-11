#!/bin/sh
# Garante usuário "protos" e banco "protos_farm" (ignora erros se já existirem)
set +e
psql -v ON_ERROR_STOP=0 -U postgres <<'EOSQL'
CREATE ROLE protos WITH LOGIN PASSWORD 'protos_secret';
CREATE DATABASE protos_farm OWNER protos;
EOSQL
