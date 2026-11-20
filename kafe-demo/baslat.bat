@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js kurulu degil. https://nodejs.org adresinden LTS surumunu kurup tekrar deneyin.
  pause
  exit /b 1
)
node server.mjs
pause
