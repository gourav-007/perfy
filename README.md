# Performance Testing Framework

A comprehensive performance testing framework built with k6, InfluxDB, Grafana, and a modern React dashboard for managing and visualizing load tests.

## 🚀 Features

- **Modern Web Interface**: Beautiful React-based dashboard for test management
- **k6 Load Testing**: JavaScript-based load testing with advanced scenarios
- **Real-time Metrics**: InfluxDB integration for storing performance metrics
- **Visual Analytics**: Grafana dashboards for comprehensive data visualization
- **Docker Integration**: Fully containerized setup with Docker Compose
- **Multiple Test Types**: Load, stress, spike, and volume testing capabilities
- **CI/CD Ready**: GitHub Actions workflow for automated testing

## 📋 Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

## 🛠 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd performance-testing-framework
```

### 2. Start the Complete Stack

```bash
# Start all services
docker-compose up -d

# Or start individual services
docker-compose up -d influxdb grafana  # Start monitoring stack only
```

### 3. Access the Applications

- **Web Dashboard**: http://localhost:5173
- **Grafana**: http://localhost:3000 (admin/admin123)
- **InfluxDB**: http://localhost:8086
- **Test API**: http://localhost:8080

### 4. Run Your First Test

```bash
# Run a load test
docker-compose run --rm k6 run /scripts/load-test.js

# Run a stress test
docker-compose run --rm k6 run /scripts/stress-test.js

# Run a spike test
docker-compose run --rm k6 run /scripts/spike-test.js
```

## 🏗 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React UI      │    │   Test API      │    │   k6 Engine     │
│   (Port 5173)   │◄──►│   (Port 8080)   │◄──►│   (Container)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Grafana       │    │   InfluxDB      │    │   Test Results  │
│   (Port 3000)   │◄──►│   (Port 8086)   │◄──►│   Storage       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📊 Test Scenarios

### Load Test
- **Purpose**: Test normal expected load
- **Virtual Users**: 100-1000 users
- **Duration**: 5-30 minutes
- **Ramp-up**: Gradual increase

### Stress Test
- **Purpose**: Find system breaking point
- **Virtual Users**: 1000-2500 users
- **Duration**: 10-20 minutes
- **Pattern**: Progressive load increase

### Spike Test
- **Purpose**: Test sudden traffic spikes
- **Virtual Users**: 100 → 2000 → 100
- **Duration**: 5-10 minutes
- **Pattern**: Rapid load changes

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
# InfluxDB Configuration
INFLUXDB_URL=http://influxdb:8086
INFLUXDB_TOKEN=my-super-secret-auth-token
INFLUXDB_ORG=performance-testing
INFLUXDB_BUCKET=k6-metrics

# API Configuration
NODE_ENV=production
PORT=8080

# Grafana Configuration
GF_SECURITY_ADMIN_PASSWORD=admin123
```

### Test Configuration

Edit test files in the `tests/` directory:

```javascript
// tests/load-test.js
export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.05'],
  }
};
```

## 📈 Monitoring & Dashboards

### Grafana Dashboards

Access Grafana at http://localhost:3000 with:
- Username: `admin`
- Password: `admin123`

Pre-configured dashboards include:
- **k6 Performance Dashboard**: Real-time test metrics
- **System Resource Monitoring**: Infrastructure health
- **Error Analysis**: Detailed error breakdowns

### Key Metrics

- **Response Time**: p50, p95, p99 percentiles
- **Throughput**: Requests per second
- **Error Rate**: Percentage of failed requests
- **Virtual Users**: Active concurrent users
- **System Resources**: CPU, Memory, Network

## 🔄 CI/CD Integration

The project includes a GitHub Actions workflow:

```yaml
# .github/workflows/ci-cd.yml
- Run performance tests in CI
- Archive test results
- Deploy on successful tests
- Integration with monitoring alerts
```

### Running Tests in CI

```bash
# Local CI simulation
docker-compose -f docker-compose.ci.yml up --abort-on-container-exit
```

## 🎯 API Endpoints

The Test API provides endpoints for managing tests:

```bash
# Health check
GET /api/health

# Get test configurations
GET /api/tests

# Create new test
POST /api/tests

# Start test execution
POST /api/tests/:id/start

# Get test results
GET /api/tests/:id/results

# Get metrics summary
GET /api/metrics/summary
```

## 📝 Test Scripts

### Custom Test Creation

Create new test scenarios:

```javascript
// tests/custom-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 100,
  duration: '5m',
};

export default function() {
  const response = http.get('https://your-api.com/endpoint');
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

## 🛡 Best Practices

### Test Design
- Start with small loads and gradually increase
- Include realistic think times between requests
- Test different user scenarios
- Monitor system resources during tests

### Monitoring
- Set appropriate thresholds for your SLAs
- Monitor both application and infrastructure metrics
- Set up alerts for critical thresholds
- Regular baseline testing

### Security
- Use environment variables for sensitive data
- Implement proper authentication in production
- Secure Grafana and InfluxDB access
- Regular security updates

## 🔍 Troubleshooting

### Common Issues

1. **Services not starting**
   ```bash
   docker-compose logs [service-name]
   docker-compose down -v && docker-compose up -d
   ```

2. **No data in Grafana**
   - Check InfluxDB connection
   - Verify test execution
   - Check data source configuration

3. **High error rates**
   - Reduce virtual user count
   - Increase think time
   - Check target API capacity

### Debug Commands

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f k6
docker-compose logs -f influxdb

# Execute shell in container
docker-compose exec grafana sh
```

## 📚 Additional Resources

- [k6 Documentation](https://k6.io/docs/)
- [InfluxDB Documentation](https://docs.influxdata.com/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎉 Getting Started

Ready to start performance testing? Follow the Quick Start guide above and begin analyzing your application's performance with this comprehensive framework!

For questions or support, please open an issue in the repository.