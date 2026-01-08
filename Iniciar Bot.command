#!/bin/zsh
set -euo pipefail

# Iniciar Bot (double-clickable) - macOS
# Doble click abre Terminal y ejecuta este script.
# Modos:
#   run  -> comportamiento por defecto: lanza backend y abre UI
#   check -> solo comprueba requisitos (node, server.js, permisos) y sale
# Ejecución desde Windows (PowerShell):
#   - Con WSL instalado:
#       wsl /mnt/d/esposotrader_portable/Iniciar\ Bot.command check
#     (ajusta la ruta a /mnt/d/... según tu unidad)
#   - Con Git Bash o MSYS2 (si tienes zsh disponible):
#       zsh "./Iniciar Bot.command" check

DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${PORT:-3000}"
MODE="${1:-run}"
NODE=${NODE:-$(command -v node 2>/dev/null || echo)}

cd "$DIR"

log() { printf "%s %s\n" "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')]" "$*"; }

# Intentar auto-otorgar permisos si es posible (silencioso)
if command -v chmod >/dev/null 2>&1; then
  chmod +x "$DIR/Iniciar Bot.command" >/dev/null 2>&1 || true
fi
if command -v xattr >/dev/null 2>&1; then
  xattr -dr com.apple.quarantine "$DIR/Iniciar Bot.command" >/dev/null 2>&1 || true
fi

# Modo "check": no inicia nada, solo valida y sale
if [ "$MODE" = "check" ]; then
  log "Modo: check. Validando entorno (no se iniciará el backend)."
  if [ -z "$NODE" ]; then
    log "ERROR: Node no encontrado en PATH. Instala Node 18+ o establece NODE env var."
    exit 1
  fi
  log "Node detectado: $($NODE --version 2>/dev/null || echo 'versión desconocida')"

  SERVER_JS="$DIR/resources/app.asar.unpacked/dist-server/server.js"
  if [ -f "$SERVER_JS" ]; then
    log "OK: encontrado $SERVER_JS"
  else
    log "ERROR: no se encontró $SERVER_JS. Verifica que los archivos estén en resources/app.asar.unpacked/dist-server/"
    exit 2
  fi

  if [ -r "$SERVER_JS" ]; then
    log "OK: $SERVER_JS es legible"
  else
    log "WARN: $SERVER_JS no es legible por el usuario actual"
  fi

  if [ -x "$0" ]; then
    log "OK: este script es ejecutable"
  else
    log "INFO: este script no tiene bit de ejecución. Puedes otorgarlo con: chmod +x \"$DIR/Iniciar Bot.command\""
  fi

  if command -v xattr >/dev/null 2>&1; then
    QUIRKS=$(xattr -l "$0" 2>/dev/null || true)
    if echo "$QUIRKS" | grep -q "com.apple.quarantine" 2>/dev/null; then
      log "INFO: el archivo está marcado con com.apple.quarantine. Para quitarlo: xattr -dr com.apple.quarantine \"$DIR/Iniciar Bot.command\""
    fi
  fi

  log "Check completado. Si todo está OK puedes ejecutar: ./Iniciar\ Bot.command  (doble click o desde Terminal)"
  exit 0
fi

# Modo por defecto: run -> iniciar backend en background redirigiendo logs
if [ -z "$NODE" ]; then
  log "Node no encontrado. Instala Node 18+ o coloca el binario en PATH." 
  exit 1
fi

STDOUT_LOG="$DIR/backend.stdout.log"
STDERR_LOG="$DIR/backend.stderr.log"
nohup "$NODE" "$DIR/resources/app.asar.unpacked/dist-server/server.js" --port "$PORT" >"$STDOUT_LOG" 2>"$STDERR_LOG" &
PID=$!
sleep 0.5
if ! ps -p $PID >/dev/null 2>&1; then
  log "No pude iniciar el backend (PID no válido). Revisa $STDERR_LOG"
  exit 2
fi
log "Backend lanzado PID=$PID"

# Poll /health
MAX_TRIES=30
i=0
while [ $i -lt $MAX_TRIES ]; do
  if curl -sS --max-time 3 "http://127.0.0.1:$PORT/health" >/dev/null 2>&1; then
    log "Backend listo. Abriendo UI en el navegador por defecto..."
    # Preferir navegadores concretos en macOS para evitar que Finder elija VSCode
    if command -v open >/dev/null 2>&1; then
      if open -a "Google Chrome" "http://127.0.0.1:$PORT" >/dev/null 2>&1; then
        exit 0
      fi
      if open -a "Brave Browser" "http://127.0.0.1:$PORT" >/dev/null 2>&1; then
        exit 0
      fi
      if open -a "Safari" "http://127.0.0.1:$PORT" >/dev/null 2>&1; then
        exit 0
      fi
      open "http://127.0.0.1:$PORT" >/dev/null 2>&1 || true
    fi
    exit 0
  fi
  i=$((i+1))
  sleep 1
done
log "Timeout esperando /health (aprox ${MAX_TRIES}s). Revisa $STDOUT_LOG y $STDERR_LOG"
exit 3
