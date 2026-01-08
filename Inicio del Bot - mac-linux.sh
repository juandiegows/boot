#!/usr/bin/env bash
set -euo pipefail

# Inicio del Bot - macOS / Linux
# Uso: ./"Inicio del Bot.sh" [broker]
# Replica la lógica de "Inicio del Bot.bat" en entornos POSIX.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-3000}"
BOT_BROKER="${1:-${BOT_BROKER:-exnova}}"
BOT_KEEP_RUNS_MAX="${BOT_KEEP_RUNS_MAX:-30}"
BOT_KEEP_RUNS_DAYS="${BOT_KEEP_RUNS_DAYS:-14}"
STARTED_KEEP_MAX="${STARTED_KEEP_MAX:-5}"
STARTED_KEEP_DAYS="${STARTED_KEEP_DAYS:-14}"
CFG_DIR="$SCRIPT_DIR/var/configs"
STARTED_DIR="$SCRIPT_DIR/resources/app.asar.unpacked/dist-server"

# Helpers
log() { printf "%s %s\n" "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')]" "$*"; }

# Limpieza automatica de run_*.json y server.started.*
if [ -d "$CFG_DIR" ]; then
  find "$CFG_DIR" -maxdepth 1 -type f -name 'run_*.json' -printf '%T@ %p\n' | sort -rn | awk -v max="$BOT_KEEP_RUNS_MAX" -v days="$BOT_KEEP_RUNS_DAYS" '{ if (NR>max) print $2 }' | xargs -r rm -f || true
  find "$CFG_DIR" -type f -name 'run_*.json' -mtime +$BOT_KEEP_RUNS_DAYS -print0 | xargs -0r rm -f || true
fi
if [ -d "$STARTED_DIR" ]; then
  find "$STARTED_DIR" -maxdepth 1 -type f -name 'server.started.*.txt' -printf '%T@ %p\n' | sort -rn | awk -v max="$STARTED_KEEP_MAX" -v days="$STARTED_KEEP_DAYS" '{ if (NR>max) print $2 }' | xargs -r rm -f || true
  find "$STARTED_DIR" -type f -name 'server.started.*.txt' -mtime +$STARTED_KEEP_DAYS -print0 | xargs -0r rm -f || true
fi

# Seleccionar node (usar node incluido si existe)
if [ -x "$SCRIPT_DIR/node" ]; then
  NODE="$SCRIPT_DIR/node"
elif command -v node >/dev/null 2>&1; then
  NODE=$(command -v node)
else
  log "No se encontró node en PATH ni node en la carpeta principal. Instala node o coloca node binario aquí.";
  exit 1
fi

# Rutas candidatas para server.js
CANDIDATES=(
  "$SCRIPT_DIR/resources/app.asar.unpacked/dist-server/server.js"
  "$SCRIPT_DIR/resources/app/dist-server/server.js"
  "$SCRIPT_DIR/app/dist-server/server.js"
  "$SCRIPT_DIR/dist-server/server.js"
)
BACKEND_PATH=""
for p in "${CANDIDATES[@]}"; do
  if [ -f "$p" ] && [ -z "$BACKEND_PATH" ]; then
    BACKEND_PATH="$p"
  fi
done
if [ -z "$BACKEND_PATH" ]; then
  log "No pude encontrar server.js. Rutas probadas: ${CANDIDATES[*]}"
  exit 2
fi
log "Usando backend: $BACKEND_PATH"

# Logs
STDOUT_LOG="$SCRIPT_DIR/backend.stdout.log"
STDERR_LOG="$SCRIPT_DIR/backend.stderr.log"

# Lanzar backend en background (redirigir stdout/stderr)
# Usamos nohup y disown para mantenerlo detached en POSIX
nohup "$NODE" "$BACKEND_PATH" --port "$PORT" >"$STDOUT_LOG" 2>"$STDERR_LOG" &
PID=$!
sleep 0.2
if ! ps -p $PID >/dev/null 2>&1; then
  log "No pude iniciar el backend (PID no válido). Revisa $STDERR_LOG"
  exit 3
fi
log "Backend lanzado PID=$PID"

# Poll /health hasta 30s
MAX_TRIES=30
i=0
while [ $i -lt $MAX_TRIES ]; do
  if curl -sS --max-time 3 "http://127.0.0.1:$PORT/health" >/dev/null 2>&1; then
    log "Backend listo. Abriendo UI en el navegador por defecto..."
    # Intentar abrir el navegador de forma portable
    URL="http://127.0.0.1:$PORT"
    if command -v xdg-open >/dev/null 2>&1; then
      xdg-open "$URL" >/dev/null 2>&1 || true
    elif command -v open >/dev/null 2>&1; then
      # En macOS preferir navegadores conocidos para evitar que apps como VS Code
      # (si se configuraron como receptor de URLs) se abran por defecto.
      BROWSERS=("/Applications/Google Chrome.app" "/Applications/Brave Browser.app" "/Applications/Firefox.app" "/Applications/Safari.app")
      opened=false
      for app in "${BROWSERS[@]}"; do
        if [ -d "$app" ]; then
          name=$(basename "$app" .app)
          open -a "$name" "$URL" >/dev/null 2>&1 || true
          opened=true
          break
        fi
      done
      if [ "$opened" = false ]; then
        # Fallback genérico
        open "$URL" >/dev/null 2>&1 || true
      fi
    else
      log "Abre manualmente: http://127.0.0.1:$PORT"
    fi
    exit 0
  fi
  i=$((i+1))
  sleep 1
done
log "Timeout esperando /health (aprox ${MAX_TRIES}s). Revisa $STDOUT_LOG y $STDERR_LOG"
exit 4
