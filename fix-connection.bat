@echo off
echo 🔧 Fixing API Connection Issues...

echo 🛑 Stopping all services...
docker-compose down

echo 🧹 Cleaning up...
docker system prune -f

echo 🚀 Starting services in correct order...

echo 📊 Starting InfluxDB...
docker-compose up -d influxdb
timeout /t 20 /nobreak > nul

echo 📈 Starting Grafana...
docker-compose up -d grafana
timeout /t 15 /nobreak > nul

echo 🔌 Starting API...
docker-compose up -d test-api
timeout /t 10 /nobreak > nul

echo 🧪 Testing API connection...
curl -s http://localhost:8080/api/health && (
    echo ✅ API is responding!
) || (
    echo ❌ API still not responding
    echo 📋 Checking API logs...
    docker-compose logs test-api
)

echo.
echo 📱 Starting React development server...
start "React Dev Server" cmd /k "npm run dev"

echo ⏳ Waiting for React to start...
timeout /t 10 /nobreak > nul

echo.
echo ✅ Connection fix complete!
echo 🌐 Try accessing: http://localhost:5173
echo 🔍 Check status: check-status.bat

pause