#!/usr/bin/env bash
# Ensure WARP proxy is healthy before pipeline runs.
# Checks end-to-end connectivity, restarts if broken, fails if unrecoverable.
set -euo pipefail

PROXY_HOST="${WARP_PROXY_HOST:-127.0.0.1}"
PROXY_PORT="${WARP_PROXY_PORT:-1080}"
COMPOSE_DIR="/home/deploy/warp-proxy"
MAX_RESTARTS=2

check_proxy() {
  curl -x "socks5://${PROXY_HOST}:${PROXY_PORT}" \
    -s -o /dev/null -w "%{http_code}" \
    --max-time 5 \
    "https://www.youtube.com/robots.txt" 2>/dev/null
}

wait_for_healthy() {
  local max_wait=30
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

echo "[ensure-warp] Checking WARP proxy at ${PROXY_HOST}:${PROXY_PORT}..."

status=$(check_proxy || echo "000")
if [ "$status" = "200" ]; then
  echo "[ensure-warp] WARP proxy is healthy"
  exit 0
fi

for attempt in $(seq 1 "$MAX_RESTARTS"); do
  echo "[ensure-warp] WARP proxy unhealthy (HTTP $status), restarting (attempt ${attempt}/${MAX_RESTARTS})..."
  docker compose -f "${COMPOSE_DIR}/docker-compose.yml" restart warp 2>&1

  if wait_for_healthy; then
    echo "[ensure-warp] WARP proxy recovered after restart"
    exit 0
  fi
  status=$(check_proxy || echo "000")
done

echo "[ensure-warp] WARP proxy still unhealthy after ${MAX_RESTARTS} restarts (HTTP $status)" >&2
exit 1
