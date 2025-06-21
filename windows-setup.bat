@echo off
echo 🔧 Quick Fix for NPM Issues...

REM Stop everything first
echo 🛑 Stopping all services...
docker-compose down -v

REM Remove the problematic image
echo 🗑️ Removing old API image...
docker rmi performance-testing-framework-test-api 2>nul
docker rmi performance-testing-framework_test-api 2>nul

REM Clear Docker build cache
echo 🧹 Clearing Docker build cache...
docker builder prune -f

REM Build with no cache
echo 🏗️ Building API with no cache...
docker-compose build --no-cache test-api

REM Start services
echo 🚀 Starting services...
docker-compose up -d influxdb

echo ⏳ Waiting for InfluxDB...
timeout /t 20 /nobreak > nul

docker-compose up -d grafana test-api

echo ⏳ Waiting for services...
timeout /t 15 /nobreak > nul

REM Start React app
echo 📱 Starting React app...
start "React Dev Server" cmd /k "npm run dev"

echo.
echo ✅ Quick fix complete!
echo 🔍 Check status with: check-status.bat
pause