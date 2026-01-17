@echo off
echo ====================================
echo AIS Forwarder - Setup and Run Script
echo ====================================
echo.

echo [1/6] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed!
    pause
    exit /b %errorlevel%
)
echo Dependencies installed successfully!
echo.

echo [2/6] Installing PM2 globally...
call npm install -g pm2
if %errorlevel% neq 0 (
    echo ERROR: PM2 installation failed!
    pause
    exit /b %errorlevel%
)
echo PM2 installed successfully!
echo.

echo [3/6] Installing PM2 Windows Startup globally...
call npm install -g pm2-windows-startup
if %errorlevel% neq 0 (
    echo ERROR: pm2-windows-startup installation failed!
    pause
    exit /b %errorlevel%
)
echo PM2 Windows Startup installed successfully!
echo.

echo [4/6] Setting up PM2 auto-start on Windows boot...
call pm2-startup install
if %errorlevel% neq 0 (
    echo ERROR: PM2 startup installation failed!
    pause
    exit /b %errorlevel%
)
echo PM2 auto-start configured successfully!
echo.

echo [5/6] Starting application with PM2...
call pm2 start src/index.js --name "ais-forwarder"
if %errorlevel% neq 0 (
    echo ERROR: PM2 start failed!
    pause
    exit /b %errorlevel%
)
echo Application started successfully!
echo.

echo [6/6] Saving PM2 configuration...
call pm2 save
if %errorlevel% neq 0 (
    echo ERROR: PM2 save failed!
    pause
    exit /b %errorlevel%
)
echo PM2 configuration saved successfully!
echo.

echo ====================================
echo Setup completed successfully!
echo ====================================
echo.
echo Useful PM2 commands:
echo   pm2 list          - Show all running processes
echo   pm2 logs          - Show logs
echo   pm2 stop all      - Stop all processes
echo   pm2 restart all   - Restart all processes
echo   pm2 delete all    - Delete all processes
echo.
pause
