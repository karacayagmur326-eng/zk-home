@echo off
setlocal
cd /d "%~dp0"

where pnpm >nul 2>&1
if errorlevel 1 (
    echo Hata: pnpm bulunamadi. Once pnpm kurun ve "pnpm install" calistirin.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Hata: Bagimliliklar bulunamadi. Once "pnpm install" calistirin.
    pause
    exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-zk-home-hidden.ps1"
if errorlevel 1 (
    echo.
    echo Proje baslatilamadi. Yukaridaki hatayi kontrol edin.
    pause
    exit /b 1
)
