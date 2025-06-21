@echo off
echo 🔍 Checking System Status...

echo.
echo 🐳 Docker Container Status:
docker-compose ps

echo.
echo 🌐 Service Health Checks:
echo Testing Web Dashboard...
curl -s http://localhost:5173 > nul && echo ✅ Web Dashboard: RUNNING || echo ❌ Web Dashboard: NOT RUNNING

echo Testing Grafana...
curl -s http://localhost:3000/api/health > nul && echo ✅ Grafana: RUNNING || echo ❌ Grafana: NOT RUNNING

echo Testing InfluxDB...
curl -s http://localhost:8086/ping > nul && echo ✅ InfluxDB: RUNNING || echo ❌ InfluxDB: NOT RUNNING

echo Testing API...
curl -s http://localhost:8080/api/health > nul && echo ✅ Test API: RUNNING || echo ❌ Test API: NOT RUNNING

echo.
echo 📊 Access URLs:
echo    Web Dashboard: http://localhost:5173
echo    Grafana: http://localhost:3000 (admin/admin123)
echo    InfluxDB: http://localhost:8086
echo    Test API: http://localhost:8080

pause