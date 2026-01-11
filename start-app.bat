@echo off
title Anonymous Grading App - Starting...

echo ========================================
echo   Anonymous Grading Web Application
echo ========================================
echo.

:: Start the backend server in a new window
echo Starting backend server...
start "Backend Server (Port 3000)" cmd /k "cd /d %~dp0server && npm run dev"

:: Wait a moment for backend to initialize
timeout /t 3 /nobreak > nul

:: Start the frontend in a new window
echo Starting frontend server...
start "Frontend (Port 5173)" cmd /k "cd /d %~dp0client && npm run dev"

:: Wait for frontend to start
timeout /t 5 /nobreak > nul

:: Open the browser
echo Opening browser...
start http://localhost:5173

echo.
echo ========================================
echo   App is running!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3000
echo ========================================
echo.
echo Close this window to keep servers running,
echo or close the server windows to stop them.
pause
