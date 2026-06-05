#!/usr/bin/env bash
set -euo pipefail

required=(
  SSH_HOST
  SSH_PORT
  SSH_USER
  SSH_PRIVATE_KEY
  REMOTE_DIR
)

for name in "${required[@]}"; do
  if [ -z "${!name:-}" ]; then
    echo "Missing required precheck input: ${name}"
    exit 1
  fi
done

MIN_DISK_KB="${PRECHECK_MIN_DISK_KB:-2097152}"
SSH_KEY_PATH="${HOME}/.ssh/visiomilhas_deploy_key"
KNOWN_HOSTS_PATH="${HOME}/.ssh/known_hosts"

mkdir -p "${HOME}/.ssh"
chmod 700 "${HOME}/.ssh"
printf '%s\n' "${SSH_PRIVATE_KEY}" > "${SSH_KEY_PATH}"
chmod 600 "${SSH_KEY_PATH}"

echo "Precheck: resolving ${SSH_HOST}"
if ! getent ahostsv4 "${SSH_HOST}" >/dev/null 2>&1; then
  getent hosts "${SSH_HOST}" >/dev/null 2>&1 || {
    echo "PRECHECK_INFRASTRUCTURE failed: unable to resolve target ${SSH_HOST}"
    exit 1
  }
fi

echo "Precheck: capturing SSH host key on ${SSH_HOST}:${SSH_PORT}"
if ! ssh-keyscan -T 5 -p "${SSH_PORT}" "${SSH_HOST}" >> "${KNOWN_HOSTS_PATH}" 2>/dev/null; then
  echo "PRECHECK_INFRASTRUCTURE failed: ssh-keyscan could not capture host key"
  exit 1
fi

if [ ! -s "${KNOWN_HOSTS_PATH}" ]; then
  echo "PRECHECK_INFRASTRUCTURE failed: known_hosts was not materialized"
  exit 1
fi

echo "Precheck: validating SSH handshake"
if ! ssh -i "${SSH_KEY_PATH}" -o BatchMode=yes -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new -p "${SSH_PORT}" "${SSH_USER}@${SSH_HOST}" "true"; then
  echo "PRECHECK_INFRASTRUCTURE failed: SSH handshake could not be established"
  exit 1
fi

echo "Precheck: validating remote directory, disk space and Docker runtime"
if ! ssh -i "${SSH_KEY_PATH}" -o BatchMode=yes -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new -p "${SSH_PORT}" "${SSH_USER}@${SSH_HOST}" "set -euo pipefail
test -d '${REMOTE_DIR}'
test -w '${REMOTE_DIR}'
free_kb=\$(df -Pk '${REMOTE_DIR}' | awk 'NR==2 { print \$4 }')
if [ \"\${free_kb}\" -lt '${MIN_DISK_KB}' ]; then
  echo 'PRECHECK_INFRASTRUCTURE failed: insufficient disk space'
  exit 1
fi
docker version >/dev/null
docker compose version >/dev/null
"; then
  echo "PRECHECK_INFRASTRUCTURE failed: remote directory, disk space or Docker runtime check failed"
  exit 1
fi

echo "PRECHECK_INFRASTRUCTURE passed"
