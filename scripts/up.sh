#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
# 1) Asegurar Docker
if ! docker info >/dev/null 2>&1; then
 echo "→ arrancando Docker Desktop…"
 open -a Docker
 until docker info >/dev/null 2>&1; do sleep 2; done
fi
# 2) Asegurar Supabase
if ! curl -fsS http://127.0.0.1:54321/auth/v1/health >/dev/null 2>&1; then
 echo "→ arrancando Supabase…"
 supabase start
fi
# 3) Lanzar el dev server (foreground)
echo "→ npm run dev"
npm run dev
