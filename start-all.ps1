# OceanOS Platform — Start All Services
# Run this script from the project root

$ROOT = $PSScriptRoot

Write-Host ''
Write-Host '  =========================================' -ForegroundColor Cyan
Write-Host '  OceanOS Platform — Starting All Services' -ForegroundColor Cyan
Write-Host '  =========================================' -ForegroundColor Cyan
Write-Host ''

# Helper to find a free port while excluding already selected ports
function Get-FreePort([int]$startPort, [int[]]$allocatedPorts) {
    $port = $startPort
    while ($true) {
        if ($allocatedPorts -contains $port) {
            $port++
            continue
        }
        $listeners = [System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners() | Where-Object { $_.Port -eq $port }
        if (-not $listeners) {
            return $port
        }
        $port++
    }
}

$allocated = @()

# Determine free ports
$BACKEND_PORT = Get-FreePort 3001 $allocated
$allocated += $BACKEND_PORT

$DASHBOARD_PORT = Get-FreePort 3002 $allocated
$allocated += $DASHBOARD_PORT

$FISHERMAN_PORT = Get-FreePort 3003 $allocated
$allocated += $FISHERMAN_PORT

$SIMULATION_PORT = Get-FreePort 3004 $allocated
$allocated += $SIMULATION_PORT

# Write the dynamic ports config
Write-Host '  Generating port configurations...' -ForegroundColor Gray
"window.OceanOS_Backend_Port = $BACKEND_PORT;" | Out-File -FilePath "$ROOT\shared\port-config.js" -Encoding utf8 -Force

# Sync shared files to sub-apps to resolve relative paths under sub-servers
New-Item -ItemType Directory -Force -Path "$ROOT\dashboard\shared" | Out-Null
Copy-Item "$ROOT\shared\port-config.js" "$ROOT\dashboard\shared\port-config.js" -Force
Copy-Item "$ROOT\shared\mock-api.js" "$ROOT\dashboard\shared\mock-api.js" -Force

New-Item -ItemType Directory -Force -Path "$ROOT\fisherman-app\shared" | Out-Null
Copy-Item "$ROOT\shared\port-config.js" "$ROOT\fisherman-app\shared\port-config.js" -Force
Copy-Item "$ROOT\shared\mock-api.js" "$ROOT\fisherman-app\shared\mock-api.js" -Force

New-Item -ItemType Directory -Force -Path "$ROOT\simulation\shared" | Out-Null
Copy-Item "$ROOT\shared\port-config.js" "$ROOT\simulation\shared\port-config.js" -Force
Copy-Item "$ROOT\shared\mock-api.js" "$ROOT\simulation\shared\mock-api.js" -Force

Write-Host ''

# Start Backend
Write-Host "  [1/4] Starting Backend (port $BACKEND_PORT)..." -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$ROOT\backend'; `$env:PORT=$BACKEND_PORT; node server.js" -WindowStyle Minimized

Start-Sleep -Seconds 2

# Start Dashboard
Write-Host "  [2/4] Starting Dashboard (port $DASHBOARD_PORT)..." -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$ROOT\dashboard'; npx -y serve -l $DASHBOARD_PORT" -WindowStyle Minimized

# Start Fisherman App
Write-Host "  [3/4] Starting Fisherman App (port $FISHERMAN_PORT)..." -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$ROOT\fisherman-app'; npx -y serve -l $FISHERMAN_PORT" -WindowStyle Minimized

# Start Simulation
Write-Host "  [4/4] Starting Simulation (port $SIMULATION_PORT)..." -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$ROOT\simulation'; npx -y serve -l $SIMULATION_PORT" -WindowStyle Minimized

Start-Sleep -Seconds 3

Write-Host ''
Write-Host '  All services started!' -ForegroundColor Yellow
Write-Host ''
Write-Host "  Dashboard:     http://localhost:$DASHBOARD_PORT" -ForegroundColor White
Write-Host "  Fisherman App: http://localhost:$FISHERMAN_PORT" -ForegroundColor White
Write-Host "  Simulation:    http://localhost:$SIMULATION_PORT" -ForegroundColor White
Write-Host "  Backend API:   http://localhost:$BACKEND_PORT" -ForegroundColor White
Write-Host ''
Write-Host '  Press any key to open Dashboard in browser...' -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Start-Process "http://localhost:$DASHBOARD_PORT"
