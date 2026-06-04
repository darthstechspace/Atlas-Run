@echo off
REM Run EAS CLI without npx (avoids "input line is too long" on Windows).
setlocal
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs"
set "EAS_NO_VCS=1"
node "%APPDATA%\npm\node_modules\eas-cli\bin\run" %*
exit /b %ERRORLEVEL%
