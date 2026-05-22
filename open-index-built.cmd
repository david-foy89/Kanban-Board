@echo off
cd /d "%~dp0"
echo.
echo  Building Kanban Board for index.html launch...
call npm run build
if errorlevel 1 (
  echo Build failed.
  pause
  exit /b 1
)
echo.
echo  Starting server for dist\index.html ...
echo  Opening http://localhost:8080/index.html
echo  KEEP THIS WINDOW OPEN.
echo.
start "" cmd /c "ping -n 3 127.0.0.1 >nul && start http://localhost:8080/index.html"
call npx --yes serve@14 dist -l 8080
pause
