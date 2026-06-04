@echo off
cd /d "%~dp0"
echo Running fix:city-icons before iOS build...
call npm run fix:city-icons
if errorlevel 1 exit /b 1
call "%~dp0eas.cmd" build --platform ios --profile preview
