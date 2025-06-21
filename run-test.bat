@echo off
echo 🧪 Running Performance Tests...

echo Available tests:
echo 1. Simple Test (10 users, 30 seconds)
echo 2. Load Test (up to 1000 users, 35 minutes)
echo 3. Stress Test (up to 2500 users, 20 minutes)
echo 4. Spike Test (sudden spike to 2000 users)

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo Running Simple Test...
    docker-compose run --rm k6 run /scripts/simple-test.js
) else if "%choice%"=="2" (
    echo Running Load Test...
    docker-compose run --rm k6 run /scripts/load-test.js
) else if "%choice%"=="3" (
    echo Running Stress Test...
    docker-compose run --rm k6 run /scripts/stress-test.js
) else if "%choice%"=="4" (
    echo Running Spike Test...
    docker-compose run --rm k6 run /scripts/spike-test.js
) else (
    echo Invalid choice. Running Simple Test by default...
    docker-compose run --rm k6 run /scripts/simple-test.js
)

echo.
echo ✅ Test completed! Check the results in:
echo    📊 Web Dashboard: http://localhost:5173
echo    📈 Grafana: http://localhost:3000
pause