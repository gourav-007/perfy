@echo off
echo 🔍 Debugging Grafana Issues...

echo 📋 Grafana Container Logs:
echo ================================
docker-compose logs --tail=50 grafana

echo.
echo 📊 Container Status:
echo ================================
docker-compose ps grafana

echo.
echo 🔧 Grafana Volume Info:
echo ================================
docker volume ls | findstr grafana

echo.
echo 🌐 Testing Grafana Port:
echo ================================
netstat -an | findstr :3000

echo.
echo 📁 Grafana Files:
echo ================================
dir grafana\provisioning\datasources
dir grafana\provisioning\dashboards

pause