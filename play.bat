@echo off
setlocal
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"

start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:5173/chicken_to_goal/"
"C:\Program Files\nodejs\npm.cmd" run dev

endlocal
