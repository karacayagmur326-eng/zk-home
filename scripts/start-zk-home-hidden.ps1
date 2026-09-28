$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot

$listener = Get-NetTCPConnection -LocalPort 8015 -State Listen -ErrorAction SilentlyContinue
if ($listener) {
    Write-Host 'ZK Home zaten http://localhost:8015 adresinde calisiyor.'
    exit 0
}

$pnpm = (Get-Command pnpm.cmd -ErrorAction Stop).Source
$stdoutLog = Join-Path $projectRoot 'zk-home-dev.log'
$stderrLog = Join-Path $projectRoot 'zk-home-dev-error.log'

Start-Process -FilePath $pnpm -ArgumentList 'dev' -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog
Write-Host 'ZK Home arka planda baslatildi: http://localhost:8015'
