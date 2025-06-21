@echo off
echo 🔌 Testing API Connection...

echo 📊 Checking if API server is running...
curl -s http://localhost:8080/api/health && (
    echo ✅ API is responding!
    echo.
    echo 📋 API Health Response:
    curl -s http://localhost:8080/api/health | jq .
) || (
    echo ❌ API is not responding
    echo.
    echo 🔧 Trying to start API...
    docker-compose up -d test-api
    echo ⏳ Waiting for API to start...
    timeout /t 10 /nobreak > nul
    echo 🔄 Testing again...
    curl -s http://localhost:8080/api/health && echo ✅ API is now responding! || echo ❌ API still not responding
)

echo.
echo 📈 Testing metrics endpoint...
curl -s http://localhost:8080/api/metrics/summary && (
    echo ✅ Metrics endpoint is working!
) || (
    echo ❌ Metrics endpoint not responding
)

echo.
echo 🧪 Testing tests endpoint...
curl -s http://localhost:8080/api/tests && (
    echo ✅ Tests endpoint is working!
) || (
    echo ❌ Tests endpoint not responding
)

echo.
echo 🌐 Testing if React dev server can reach API...
curl -s http://localhost:5173 > nul && (
    echo ✅ React dev server is running
    echo 💡 The dashboard should now be able to connect to the API
) || (
    echo ❌ React dev server is not running
    echo 🚀 Start it with: npm run dev
)

pause