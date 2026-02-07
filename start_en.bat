@echo off
chcp 936 > nul
echo ========================================
echo HTTP Test Website - Port 14514 Startup Script
echo ========================================
echo.

echo Checking Node.js installation...
node --version
if errorlevel 1 (
    echo Error: Node.js not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo Checking dependencies...
if not exist "node_modules" (
    echo Installing packages...
    npm install
) else (
    echo Dependencies already installed
)

echo.
echo ========================================
echo Configuration:
echo - Node.js app running on port 14514 (HTTP)
echo - HTTPS access through IIS reverse proxy
echo - Reverse proxy rules configured in web.config
echo ========================================
echo.
echo Press any key to start HTTP server (port 14514)...
pause > nul

echo.
echo Starting HTTP server...
echo Access URL: http://localhost:14514
echo Via IIS reverse proxy: https://localhost
echo.
echo Press Ctrl+C to stop server
echo.

node server.js