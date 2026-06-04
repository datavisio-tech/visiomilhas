#!/usr/bin/env bash
set -euo pipefail

repo="${1:-datavisio/visiomilhas}"
keep_count="${2:-4}"

active_ids="$(
  docker ps -q \
    | xargs -r docker inspect --format '{{.Image}}' 2>/dev/null \
    | awk 'NF && !seen[$0]++'
)"

latest_ids="$(
  docker image ls --filter "reference=${repo}" --format '{{.ID}}' \
    | awk 'NF && !seen[$0]++' \
    | head -n "${keep_count}"
)"

keep_ids="$(
  printf '%s\n%s\n' "${active_ids}" "${latest_ids}" \
    | awk 'NF && !seen[$0]++'
)"

mapfile -t repo_ids < <(
  docker image ls --filter "reference=${repo}" --format '{{.ID}}' \
    | awk 'NF && !seen[$0]++'
)

for id in "${repo_ids[@]}"; do
  if ! printf '%s\n' "${keep_ids}" | grep -qx "${id}"; then
    docker rmi -f "${id}" >/dev/null 2>&1 || true
  fi
done

docker image prune -f >/dev/null 2>&1 || true
