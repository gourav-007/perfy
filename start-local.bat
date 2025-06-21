@echo off
echo 🚀 Starting Performance Testing Framework...

REM Start the React development server in a new window
echo 📱 Starting React development server...
start "React Dev Server" cmd /k "npm run dev"

REM Wait a moment for npm to start
timeout /t 5 /nobreak > nul

REM Start Docker services
echo 🐳 Starting Docker services...
docker-compose up -d influxdb grafana test-api

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak > nul

REM Check service status
echo 🔍 Checking service status...
docker-compose ps

REM Test API connectivity
echo 🧪 Testing API connectivity...
curl -f http://localhost:8080/api/health 2>nul || echo API not ready yet

echo.
echo ✅ Setup complete! Access your services:
echo    📊 Web Dashboard: http://localhost:5173
echo    📈 Grafana: http://localhost:3000 (admin/admin123)
echo    🗄️  InfluxDB: http://localhost:8086
echo    🔌 API: http://localhost:8080
echo.
echo 🧪 To run a test:
echo    docker-compose run --rm k6 run /scripts/load-test.js
echo.
echo 🛑 To stop everything, run: stop-local.bat
pause