#!/usr/bin/env bash
set -euo pipefail

RELEASE_IMAGE_TAR="${RELEASE_IMAGE_TAR:-release-image.tar}"
PRUNE_KEEP="${PRUNE_KEEP:-4}"
REMOTE_DIR="${REMOTE_DIR:-$(pwd)}"

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

load_env_value() {
  local name="$1"
  local value
  value="$(grep -E "^${name}=" .env.production | tail -n 1 | cut -d= -f2- || true)"
  if [ -n "${value}" ]; then
    export "${name}=${value}"
  fi
}

load_env_value VISIOMILIAS_CONTAINER_NAME
load_env_value VISIOMILIAS_PUBLIC_HOST
load_env_value VISIOMILIAS_ROUTER_NAME
load_env_value VISIOMILIAS_SERVICE_NAME
load_env_value COMPOSE_PROJECT_NAME

: "${VISIOMILIAS_CONTAINER_NAME:?}"
: "${VISIOMILIAS_PUBLIC_HOST:?}"
: "${VISIOMILIAS_ROUTER_NAME:?}"
: "${VISIOMILIAS_SERVICE_NAME:?}"
: "${COMPOSE_PROJECT_NAME:?}"

docker rm -f "${VISIOMILIAS_CONTAINER_NAME}" >/dev/null 2>&1 || true
docker compose --env-file .env.production -f docker-compose.visiomilhas.standalone.yml up -d

container_id="$(docker ps -q --filter name="${VISIOMILIAS_CONTAINER_NAME}" | head -n1)"
test -n "${container_id}"

health_ok="false"
for attempt in 1 2 3 4 5 6 7 8 9 10 11 12; do
  if docker exec "${container_id}" node scripts/healthcheck.js; then
    health_ok="true"
    break
  fi
  echo "Container healthcheck attempt ${attempt} failed, retrying..."
  sleep 5
done

if [ "${health_ok}" != "true" ]; then
  echo "Container healthcheck failed after retries"
  docker logs "${container_id}" --tail 120 || true
  exit 1
fi

docker exec "${container_id}" node --input-type=module -e "const routes=['/','/sign-in','/subscribe','/app','/app/dashboard','/app/accounts','/app/programs','/app/purchases']; for (const route of routes) { const res = await fetch('http://127.0.0.1:3000' + route, { redirect: 'follow' }); const html = await res.text(); if (!html.startsWith('<!DOCTYPE html>')) { console.error('Missing DOCTYPE on', route); process.exit(1); } if (html.includes('React error #418') || html.includes('React error #423') || html.includes('HierarchyRequestError') || html.includes('NotFoundError')) { console.error('Hydration/runtime error text found on', route); process.exit(2); } } const authRes = await fetch('http://127.0.0.1:3000/api/auth/sign-in/social', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider: 'google' }) }); const authText = await authRes.text(); if (authRes.status === 503 || authText.includes('AUTH_BOOTSTRAP_FAILED') || authText.includes('503')) { console.error('OAuth bootstrap failed'); process.exit(3); } console.log('Internal smoke checks passed');"

curl -fsS http://127.0.0.1:8082/api/http/routers | grep -n "${VISIOMILIAS_PUBLIC_HOST}" || true

bash scripts/prune-docker-images.sh datavisio/visiomilhas "${PRUNE_KEEP}"
