#!/bin/bash

echo "🚀 Starting Performance Testing Framework..."

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Start the React development server in the background
echo "📱 Starting React development server..."
npm run dev &
REACT_PID=$!

# Wait a moment for npm to start
sleep 3

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d influxdb grafana test-api

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service status
echo "🔍 Checking service status..."
docker-compose ps

# Test API connectivity
echo "🧪 Testing API connectivity..."
curl -f http://localhost:8080/api/health || echo "API not ready yet"

echo ""
echo "✅ Setup complete! Access your services:"
echo "   📊 Web Dashboard: http://localhost:5173"
echo "   📈 Grafana: http://localhost:3000 (admin/admin123)"
echo "   🗄️  InfluxDB: http://localhost:8086"
echo "   🔌 API: http://localhost:8080"
echo ""
echo "🧪 To run a test:"
echo "   docker-compose run --rm k6 run /scripts/load-test.js"
echo ""
echo "🛑 To stop everything:"
echo "   docker-compose down && kill $REACT_PID"