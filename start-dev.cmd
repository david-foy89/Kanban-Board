@echo off
cd /d "%~dp0"
echo.
echo  Kanban Board
echo  =============
echo  Starting dev server...
echo  Your browser will open: http://localhost:5173/index.html
echo.
echo  KEEP THIS WINDOW OPEN while using the app.
echo.
start "" cmd /c "ping -n 6 127.0.0.1 >nul && start http://localhost:5173/index.html"
call npm run dev
pause
