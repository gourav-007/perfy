@echo off
echo 🛑 Stopping Performance Testing Framework...

REM Stop Docker services
echo 🐳 Stopping Docker services...
docker-compose down

REM Kill any running npm/vite processes
echo 📱 Stopping React development server...
taskkill /f /im node.exe 2>nul || echo No Node.js processes found
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq React Dev Server*" 2>nul || echo No React dev server window found

echo ✅ All services stopped!
pause