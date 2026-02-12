#!/bin/sh
set -e
# Com volume .:/app, node_modules fica vazio; popula antes de iniciar
npm ci
exec "$@"
