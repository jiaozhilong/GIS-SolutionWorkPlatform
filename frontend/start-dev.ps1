param(
  [string]$HostName = "127.0.0.1",
  [int]$Port = 5173
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$node = "D:\java\nodejs\node.exe"
$vite = Join-Path $root "node_modules\vite\bin\vite.js"

if (-not (Test-Path -LiteralPath $node)) {
  throw "Node.js not found: $node"
}

if (-not (Test-Path -LiteralPath $vite)) {
  throw "Vite entry not found. Run npm install in $root first."
}

$existing = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($existing) {
  $pids = $existing | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($pid in $pids) {
    $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
    if ($process -and $process.ProcessName -eq "node") {
      Write-Host "Stopping existing node process on port ${Port}: PID $pid"
      Stop-Process -Id $pid -Force
    } else {
      throw "Port $Port is already used by PID $pid. Stop it first or choose another port."
    }
  }
}

$env:Path = "D:\java\nodejs;" + [Environment]::GetEnvironmentVariable("Path", "Process")
$env:SystemRoot = $env:SystemRoot
$env:WINDIR = $env:WINDIR
$env:COMSPEC = $env:COMSPEC

Set-Location -LiteralPath $root

Write-Host ""
Write-Host "GeoAgent frontend dev server"
Write-Host "URL: http://$HostName`:$Port"
Write-Host "Workspace: $root"
Write-Host "Press Ctrl+C to stop."
Write-Host ""

& $node $vite --host $HostName --port $Port --strictPort
