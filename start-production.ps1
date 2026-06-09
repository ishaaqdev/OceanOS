# OceanOS - Start Production Build Locally
# Run this script to preview the exact static monorepo deployment

$ROOT = $PSScriptRoot

Write-Host ''
Write-Host '  =========================================' -ForegroundColor Cyan
Write-Host '  OceanOS - Preparing Production Local Server' -ForegroundColor Cyan
Write-Host '  =========================================' -ForegroundColor Cyan
Write-Host ''

Write-Host '  [1/2] Compiling Vite projects and gathering assets...' -ForegroundColor Green
node "$ROOT\build.js"

if ($LASTEXITCODE -ne 0) {
    Write-Host '  Error during compilation!' -ForegroundColor Red
    Exit 1
}

# Helper to find a free port
function Get-FreePort([int]$startPort) {
    $port = $startPort
    while ($true) {
        $listeners = [System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners() | Where-Object { $_.Port -eq $port }
        if (-not $listeners) {
            return $port
        }
        $port++
    }
}

$PORT = Get-FreePort 5000

Write-Host ''
Write-Host "  [2/2] Launching local web server (port $PORT)..." -ForegroundColor Green
Write-Host '  Dashboard/Simulations will run in Client-Side Demo Mode.' -ForegroundColor Yellow
Write-Host ''
Write-Host "  Preview URL: http://localhost:$PORT" -ForegroundColor White
Write-Host ''
Write-Host '  Press Ctrl+C in this terminal window to stop the server.' -ForegroundColor Gray
Write-Host ''

npx -y serve -l $PORT "$ROOT\dist"
