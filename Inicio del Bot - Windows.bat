@echo off
setlocal enableextensions enabledelayedexpansion

rem ------------------------------------------------------------------
rem Lanzador sin credenciales: ahora se introducen SOLO en la UI.
rem (Se elimina el bloque de variables de entorno para evitar texto plano.)
rem Puedes pasar broker como primer argumento: exnova | iqoption
rem ------------------------------------------------------------------
if "%~1" NEQ "" set "BOT_BROKER=%~1"
if not defined BOT_BROKER set "BOT_BROKER=exnova"

rem ------------------------------------------------------------------
rem Lanzador "run-and-play" para la distribución portable sin Electron.
rem - Busca server.js en rutas comunes dentro del ZIP portable
rem - Usa node.exe incluido en la raíz si existe, o node en PATH
rem - Arranca el backend en background (detached), espera /health y abre el navegador por defecto

set "SCRIPT_DIR=%~dp0"
rem Permitir configurar el puerto via var de entorno o por defecto 3000
if not defined PORT set "PORT=3000"
rem Retencion por defecto para limpieza automatica
if not defined BOT_KEEP_RUNS_MAX set "BOT_KEEP_RUNS_MAX=30"
if not defined BOT_KEEP_RUNS_DAYS set "BOT_KEEP_RUNS_DAYS=14"
if not defined STARTED_KEEP_MAX set "STARTED_KEEP_MAX=5"
if not defined STARTED_KEEP_DAYS set "STARTED_KEEP_DAYS=14"

rem Limpieza automatica de historiales (var\configs\run_*.json) y server.started.*
set "CFG_DIR=%SCRIPT_DIR%var\configs"
set "STARTED_DIR=%SCRIPT_DIR%resources\app.asar.unpacked\dist-server"
powershell -NoProfile -Command "try { $cfgDir = '%CFG_DIR%'; $max = [int]$env:BOT_KEEP_RUNS_MAX; if(-not $max){$max=30}; $days = [int]$env:BOT_KEEP_RUNS_DAYS; if(-not $days){$days=14}; if(Test-Path -LiteralPath $cfgDir){ $files = Get-ChildItem -LiteralPath $cfgDir -Filter 'run_*.json' -File | Sort-Object LastWriteTime -Descending; $cutoff=(Get-Date).AddDays(-$days); $toRemove = @(); $toRemove += $files | Where-Object { $_.LastWriteTime -lt $cutoff }; if($files.Count -gt $max){ $toRemove += $files[$max..($files.Count-1)] }; $toRemove = $toRemove | Sort-Object FullName -Unique; foreach($f in $toRemove){ Remove-Item -LiteralPath $f.FullName -Force -ErrorAction SilentlyContinue } } } catch { }"
powershell -NoProfile -Command "try { $dir = '%STARTED_DIR%'; $max=[int]$env:STARTED_KEEP_MAX; if(-not $max){$max=5}; $days=[int]$env:STARTED_KEEP_DAYS; if(-not $days){$days=14}; if(Test-Path -LiteralPath $dir){ $files = Get-ChildItem -LiteralPath $dir -Filter 'server.started.*.txt' -File | Sort-Object LastWriteTime -Descending; $cutoff=(Get-Date).AddDays(-$days); $toRemove=@(); $toRemove += $files | Where-Object { $_.LastWriteTime -lt $cutoff }; if($files.Count -gt $max){ $toRemove += $files[$max..($files.Count-1)] }; $toRemove = $toRemove | Sort-Object FullName -Unique; foreach($f in $toRemove){ Remove-Item -LiteralPath $f.FullName -Force -ErrorAction SilentlyContinue } } } catch { }"

rem elegir node
if exist "%SCRIPT_DIR%node.exe" (
  set "NODE=%SCRIPT_DIR%node.exe"
) else (
  set "NODE=node"
)

rem paths candidatos para server.js
set "TRIED="
set "BACKEND_PATH="
for %%P in (
  "%SCRIPT_DIR%resources\app.asar.unpacked\dist-server\server.js"
  "%SCRIPT_DIR%resources\app\dist-server\server.js"
  "%SCRIPT_DIR%app\dist-server\server.js"
  "%SCRIPT_DIR%dist-server\server.js"
) do (
  set "TRIED=!TRIED!%%~P\r\n"
  if exist %%~P if not defined BACKEND_PATH set "BACKEND_PATH=%%~P"
)

if not defined BACKEND_PATH (
  echo No pude encontrar "server.js" en el paquete portable.
  echo Rutas probadas:
  echo.
  echo %TRIED%
  echo.
  echo Asegurate de extraer todo el contenido del ZIP y volver a intentarlo.
  pause
  exit /b 1
)

echo Usando backend: %BACKEND_PATH%

rem arrancar backend en background usando PowerShell Start-Process (con redirección si está disponible)
powershell -NoProfile -Command "try { Start-Process -FilePath '%NODE%' -ArgumentList (\"%BACKEND_PATH%\",'--port','%PORT%') -WorkingDirectory '%SCRIPT_DIR%' -WindowStyle Hidden -RedirectStandardOutput '%SCRIPT_DIR%backend.stdout.log' -RedirectStandardError '%SCRIPT_DIR%backend.stderr.log' } catch { Start-Process -FilePath '%NODE%' -ArgumentList '%BACKEND_PATH%','--port','%PORT%' -WorkingDirectory '%SCRIPT_DIR%' -WindowStyle Hidden }"

rem Poll /health hasta 30s
set /a MAX_TRIES=30
set /a i=0
:waitloop
powershell -NoProfile -Command "try { $r=Invoke-WebRequest -UseBasicParsing -Uri ('http://127.0.0.1:'+$env:PORT+'/health') -TimeoutSec 3; if($r.StatusCode -eq 200){ exit 0 } else { exit 2 } } catch { exit 1 }"
if %ERRORLEVEL%==0 (
  echo Backend listo.
  echo Abriendo UI en el navegador por defecto...
  start "" "http://127.0.0.1:%PORT%"
  exit /b 0
)

set /a i+=1
if %i% GEQ %MAX_TRIES% (
  echo Timeout esperando /health (aprox %MAX_TRIES% s). Revisa backend.stdout.log y backend.stderr.log
  exit /b 2
)

timeout /t 1 >nul
goto waitloop