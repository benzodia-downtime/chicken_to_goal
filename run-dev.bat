@echo off
setlocal
set "PATH=C:\Program Files\nodejs;%PATH%"

start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:5173/"
"C:\Program Files\nodejs\npm.cmd" run dev

endlocal
