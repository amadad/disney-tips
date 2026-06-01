#!/usr/bin/env bash
# Ensure WARP proxy is healthy before pipeline runs.
# Checks end-to-end connectivity, repairs the container if needed, fails if unrecoverable.
set -euo pipefail

PROXY_HOST="${WARP_PROXY_HOST:-127.0.0.1}"
PROXY_PORT="${WARP_PROXY_PORT:-1080}"
PROXY_URL="socks5h://${PROXY_HOST}:${PROXY_PORT}"
COMPOSE_DIR="/home/deploy/warp-proxy"
MAX_RECOVERY_ATTEMPTS=2

check_proxy() {
  curl --proxy "${PROXY_URL}" \
    -sS -o /dev/null -w "%{http_code}" \
    --max-time 8 \
    "https://www.youtube.com/robots.txt" 2>/dev/null
}

wait_for_healthy() {
  local max_wait=45
  local interval=5
  local elapsed=0
  while [ "$elapsed" -lt "$max_wait" ]; do
    local status
    status=$(check_proxy || echo "000")
    if [ "$status" = "200" ]; then
      return 0
    fi
    sleep "$interval"
    elapsed=$((elapsed + interval))
  done
  return 1
}

repair_proxy() {
  local attempt="$1"
  if [ "$attempt" -eq 1 ]; then
    echo "[ensure-warp] Restarting warp container..."
    docker compose -f "${COMPOSE_DIR}/docker-compose.yml" restart warp 2>&1
    return
  fi

  echo "[ensure-warp] Recreating warp container..."
  docker compose -f "${COMPOSE_DIR}/docker-compose.yml" up -d --force-recreate --no-deps warp 2>&1
}

echo "[ensure-warp] Checking WARP proxy at ${PROXY_URL}..."

status=$(check_proxy || echo "000")
if [ "$status" = "200" ]; then
  echo "[ensure-warp] WARP proxy is healthy"
  exit 0
fi

for attempt in $(seq 1 "$MAX_RECOVERY_ATTEMPTS"); do
  echo "[ensure-warp] WARP proxy unhealthy (HTTP ${status}), recovery attempt ${attempt}/${MAX_RECOVERY_ATTEMPTS}..."
  repair_proxy "$attempt"

  if wait_for_healthy; then
    echo "[ensure-warp] WARP proxy recovered"
    exit 0
  fi
  status=$(check_proxy || echo "000")
done

echo "[ensure-warp] WARP proxy still unhealthy after ${MAX_RECOVERY_ATTEMPTS} recovery attempts (HTTP ${status})" >&2
exit 1
