<#
support-health.ps1
Diagnóstico y control remoto básico para ESPOSOTRADER_BOT
Ejecutar en PowerShell (Run as Administrator si desea detener procesos)
#>
param(
  [switch]$KillConflicting
)
Write-Host "=== ESPOSOTRADER_BOT - Support Health Check ==="
$port = 3000
Write-Host "Checking HTTP /health on localhost:$port..."
try{
  $r = Invoke-WebRequest -Uri "http://127.0.0.1:$port/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
  if($r.StatusCode -eq 200){ Write-Host "OK: /health returned:"; Write-Host $r.Content; } else { Write-Host "Health: status=$($r.StatusCode)" }
}catch{
  Write-Host "No response from /health: $($_.Exception.Message)"
}

Write-Host "\nNetstat (listeners on port $port):"
try{ Get-NetTCPConnection -LocalPort $port -State Listen | Select-Object LocalAddress,LocalPort,State,OwningProcess | Format-Table -AutoSize } catch { netstat -ano | findstr ":$port" }

Write-Host "\nProcesses matching dist-server/server.js (if any):"
$procs = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and $_.CommandLine -match '\\dist-server\\server\\.js' }
if($procs){ $procs | Select-Object ProcessId,ParentProcessId,CommandLine | Format-Table -AutoSize } else { Write-Host "None found." }

if($KillConflicting -and $procs){
  Write-Host "\nKillConflicting requested. Will stop these processes now (requires Admin)."
  foreach($p in $procs){
    Write-Host "Stopping PID $($p.ProcessId) -> $($p.CommandLine)"
    try{ Stop-Process -Id $p.ProcessId -Force -ErrorAction Stop; Write-Host "Stopped $($p.ProcessId)" } catch { Write-Host "Failed to stop $($p.ProcessId): $($_.Exception.Message)" }
  }
  Write-Host "Waiting 1s and re-checking listeners..."
  Start-Sleep -Seconds 1
  try{ Get-NetTCPConnection -LocalPort $port -State Listen | Select-Object LocalAddress,LocalPort,State,OwningProcess | Format-Table -AutoSize } catch { netstat -ano | findstr ":$port" }
}

Write-Host "\nIf the application still doesn't start, collect and send these files to support:\n - backend.stdout.log\n - backend.stderr.log\n - (if present) dashboard-spawn-error.json or dashboard-server-locate-error.json\n"
