@echo off
echo 🔧 Fixing Grafana Issues...

REM Stop all services
echo 🛑 Stopping all services...
docker-compose down -v

REM Remove Grafana volume to reset configuration
echo 🗑️ Removing Grafana volume...
docker volume rm performance-testing-framework_grafana-data 2>nul

REM Create the grafana directories with proper permissions
echo 📁 Creating Grafana directories...
if not exist "grafana\provisioning\datasources" mkdir grafana\provisioning\datasources
if not exist "grafana\provisioning\dashboards" mkdir grafana\provisioning\dashboards
if not exist "grafana\dashboards" mkdir grafana\dashboards

REM Start InfluxDB first
echo 🚀 Starting InfluxDB...
docker-compose up -d influxdb

echo ⏳ Waiting for InfluxDB to be ready...
timeout /t 30 /nobreak > nul

REM Test InfluxDB
curl -s http://localhost:8086/ping && echo ✅ InfluxDB is ready || echo ❌ InfluxDB not ready

REM Start Grafana with fresh configuration
echo 🚀 Starting Grafana...
docker-compose up -d grafana

echo ⏳ Waiting for Grafana to start...
timeout /t 45 /nobreak > nul

REM Check Grafana logs if it's still failing
echo 📋 Checking Grafana status...
docker-compose logs grafana | findstr "error\|Error\|ERROR" && echo ❌ Grafana has errors || echo ✅ Grafana looks good

REM Start API
echo 🚀 Starting Test API...
docker-compose up -d test-api

echo ⏳ Waiting for API...
timeout /t 15 /nobreak > nul

REM Final status check
echo 🔍 Final status check...
docker-compose ps

echo.
echo ✅ Grafana fix complete!
echo 📊 Try accessing: http://localhost:3000 (admin/admin123)
echo 🔍 Check status: check-status.bat
pause