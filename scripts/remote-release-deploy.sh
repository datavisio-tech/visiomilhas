#!/usr/bin/env bash
set -euo pipefail

: "${VISIOMILIAS_CONTAINER_NAME:?}"
: "${VISIOMILIAS_PUBLIC_HOST:?}"
: "${REMOTE_DIR:?}"

RELEASE_IMAGE_TAR="${RELEASE_IMAGE_TAR:-release-image.tar}"
PRUNE_KEEP="${PRUNE_KEEP:-4}"

mkdir -p "${REMOTE_DIR}"
cd "${REMOTE_DIR}"

if [ -f "${RELEASE_IMAGE_TAR}" ]; then
  docker load -i "${RELEASE_IMAGE_TAR}"
  rm -f "${RELEASE_IMAGE_TAR}"
fi

if [ -f .env.production.tmp ]; then
  mv .env.production.tmp .env.production
fi

if [ ! -s .env.production ]; then
  echo "Missing .env.production on remote host"
  exit 1
fi

chmod 600 .env.production
set -a
. ./.env.production
set +a

docker rm -f "${VISIOMILIAS_CONTAINER_NAME}" >/dev/null 2>&1 || true
docker compose --env-file .env.production -f docker-compose.visiomilhas.standalone.yml up -d

container_id="$(docker ps -q --filter name="${VISIOMILIAS_CONTAINER_NAME}" | head -n1)"
test -n "${container_id}"

docker exec "${container_id}" node scripts/healthcheck.js
docker exec "${container_id}" node --input-type=module -e "const routes=['/','/sign-in','/subscribe','/app','/app/dashboard','/app/accounts','/app/programs','/app/purchases']; for (const route of routes) { const res = await fetch('http://127.0.0.1:3000' + route, { redirect: 'follow' }); const html = await res.text(); if (!html.startsWith('<!DOCTYPE html>')) { console.error('Missing DOCTYPE on', route); process.exit(1); } if (html.includes('React error #418') || html.includes('React error #423') || html.includes('HierarchyRequestError') || html.includes('NotFoundError')) { console.error('Hydration/runtime error text found on', route); process.exit(2); } } const authRes = await fetch('http://127.0.0.1:3000/api/auth/sign-in/social', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider: 'google' }) }); const authText = await authRes.text(); if (authRes.status === 503 || authText.includes('AUTH_BOOTSTRAP_FAILED') || authText.includes('503')) { console.error('OAuth bootstrap failed'); process.exit(3); } console.log('Internal smoke checks passed');"

curl -fsS http://127.0.0.1:8082/api/http/routers | grep -n "${VISIOMILIAS_PUBLIC_HOST}" || true

bash scripts/prune-docker-images.sh datavisio/visiomilhas "${PRUNE_KEEP}"
