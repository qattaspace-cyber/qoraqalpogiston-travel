@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is required to run this local development server.
  pause
  exit /b 1
)
echo Qoraqalpog'iston local development server
echo Open http://127.0.0.1:3000/ after the server prints its ready message.
node server.js
set "QORA_SERVER_EXIT=%ERRORLEVEL%"
if not "%QORA_SERVER_EXIT%"=="0" pause
exit /b %QORA_SERVER_EXIT%
