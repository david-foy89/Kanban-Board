@echo off
cd /d "%~dp0"
echo.
echo  Kanban Board - starting dev server...
echo  Do NOT close this window while using the app.
echo.
call npm run dev
pause
