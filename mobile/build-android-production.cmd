@echo off
cd /d "%~dp0"
call "%~dp0eas.cmd" build --platform android --profile production
