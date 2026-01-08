# ESPOSOTRADER_BOT — Instrucciones para la distribución portable

## Resumen

Este paquete es una distribución "portable": el usuario sólo debe extraer el ZIP y ejecutar dos scripts en orden para usar la app sin instalar nada.

## Contenido principal del ZIP

- electron-dist/ (main.cjs, preload.js, package.json)
- resources/app.asar.unpacked/dist-server/ (server.js, bot/ , sdk_adapter.js, package.json)
- resources/app/dist-react/ (frontend estático)
- resources/app.asar.unpacked/libs/ (client-sdk y librerías)
- node.exe (binario incluido para que no sea necesario instalar Node)
- Inicio del Bot.bat <-- inicia el backend y abre la UI automáticamente
- support-health.ps1 <-- script de soporte (opcional)
- backend.stdout.log, backend.stderr.log (se crean al arrancar el backend)

## Quick start (usuario final)

1. Extraer el ZIP en una carpeta, por ejemplo C:\ESPOSOTRADER
2. Abrir PowerShell o doble-clic en `Inicio del Bot.bat`.

- El script usa el `node.exe` incluido si existe en la misma carpeta, así que no hace falta instalar Node.

3. El script arrancará el backend y abrirá la UI automáticamente tras pasar la verificación de salud.
   - En PowerShell:
     Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3000/health
   - En un navegador: abrir http://127.0.0.1:3000/health
   - Respuesta esperada: HTTP 200 / página de la app (o texto OK dependiendo de la versión).
4. Si prefieres abrir manualmente, puedes usar los comandos de la sección siguiente.

Si el usuario prefiere usar línea de comandos manualmente:

- Arrancar backend (foreground, útil para depurar):
  "C:\ruta\a\node.exe" resources\\app.asar.unpacked\\dist-server\\server.js --port 3000
- Arrancar backend (detached):
  Start-Process -FilePath 'C:\ruta\a\node.exe' -ArgumentList @('resources\\app.asar.unpacked\\dist-server\\server.js','--port','3000') -RedirectStandardOutput backend.stdout.log -RedirectStandardError backend.stderr.log

## Logs y diagnóstico

- `backend.stdout.log` y `backend.stderr.log` se generan en la carpeta raíz del ZIP/extracción.
- Comandos útiles para soporte (PowerShell):
  - Listar quien escucha en el puerto 3000:
    Get-NetTCPConnection -LocalPort 3000 -State Listen | Select-Object LocalAddress,LocalPort,OwningProcess
  - Ver información del proceso por PID:
    Get-CimInstance Win32_Process -Filter "ProcessId=<PID>" | Select-Object ProcessId,Name,CommandLine
  - Parar backend por PID:
    Stop-Process -Id <PID> -Force
  - Revisar logs:
    Get-Content .\backend.stdout.log -Tail 200
    Get-Content .\backend.stderr.log -Tail 200

## Problemas comunes y soluciones

- Error EADDRINUSE (puerto 3000 ya en uso):

  - Diagnóstico: Get-NetTCPConnection -LocalPort 3000 -State Listen
  - Si corresponde a un proceso antiguo, detenerlo: Stop-Process -Id <PID> -Force
  - Opción alternativa: en `Inicio del Bot.bat` puedes definir la variable `PORT` antes de ejecutarlo para usar otro puerto libre (por ejemplo 3001):
    set PORT=3001 & "Inicio del Bot.bat"

- Si el script muestra "node: término no reconocido":
  - Asegurarse de ejecutar el script desde la carpeta donde está `node.exe` incluido.
  - Si no se incluyó node.exe en tu ZIP de distribución, pide al usuario instalar Node LTS o copia `node.exe` en la carpeta.

## Firewall / Antivirus

- Normalmente no hace falta abrir puertos para `localhost` pero algunos antivirus/firewalls podrían bloquear la ejecución o redirección de procesos.
- Si la app no carga, pedir al usuario que permita la ejecución del ejecutable en su AV o que ejecute temporalmente el script con AV deshabilitado para probar.

## Validación de cuentas (Allowed Account IDs por Google Sheets)

Desde esta versión la lista de IDs de cuenta permitidos ya no se toma del `.env`, sino de una hoja de cálculo de Google Sheets exportada como CSV.

Hoja base (editable/visualizable según permisos):
https://docs.google.com/spreadsheets/d/14vMXmMNGtb5z-8yQYuU0cHuUkyQ2citvZMzqEmg7rBE/edit

El backend descarga periódicamente el CSV usando la URL de exportación:
https://docs.google.com/spreadsheets/d/14vMXmMNGtb5z-8yQYuU0cHuUkyQ2citvZMzqEmg7rBE/export?format=csv

Reglas de parseo:
- Se toma la primera columna de cada fila.
- Se ignoran filas vacías y encabezados como "account", "id", "ids".
- Se aceptan tokens alfanuméricos de longitud >=3.

Variables de entorno opcionales:
- SHEET_ALLOWED_URL: URL completa a un CSV alternativo.
- SHEET_REFRESH_SEC: Frecuencia de refresco (segundos). Default 300 (5 min). Mínimo 30.
- FALLBACK_ALLOWED_ENV=1: Si se activa y la hoja falla al cargar, usa `ALLOWED_ACCOUNT_IDS` del entorno como respaldo.

Comportamiento inicial:
- Mientras no se haya cargado al menos una vez la hoja, el endpoint de verificación devolverá 503 (lista_ids_no_cargada) para evitar accesos no autorizados.
- Una vez cargada, se muestra en la respuesta `allowedSource` (sheet o env-fallback), `allowedAccounts` y `allowedRefreshedAt` (timestamp ms).

Cómo actualizar la lista:
- Editar la hoja; el backend la recargará automáticamente en el siguiente intervalo.
- Para forzar antes del intervalo, reiniciar el backend.

## Soporte remoto (qué pedir al usuario)

- `backend.stdout.log` y `backend.stderr.log` (archivo completos)
- Salida de:
  Get-NetTCPConnection -LocalPort 3000 -State Listen
  Get-CimInstance Win32_Process -Filter "ProcessId=<PID>" | Select-Object ProcessId,Name,CommandLine
- Captura de pantalla del error o del mensaje que ve en la UI

## Notas técnicas para el empaquetador

- La carpeta `resources\app.asar.unpacked\dist-server` debe conservarse tal cual (no comprimida dentro del asar) para que el backend pueda requerir módulos dinámicamente.
- Incluir `libs` en `app.asar.unpacked` (ya configurado en electron-builder via `asarUnpack`).
- `main.cjs` ya inyecta `--DASH_URL` y env vars; `preload` resuelve `--DASH_URL`, `global.__DASH_URL__` y `process.env.DASH_URL`.

## Últimos consejos

- Prueba el ZIP en al menos 1 máquina limpia o VM Windows antes de distribuir.
- Si vas a soportar usuarios con arquitecturas distintas (x86 vs x64), crea ZIPs separados con el `node.exe` correcto.

## Contacto de soporte

Incluye aquí la dirección de correo o canal de soporte de tu equipo para que los usuarios o el equipo de helpdesk envíen los logs y la información de diagnóstico.

-- Fin del README portable --
