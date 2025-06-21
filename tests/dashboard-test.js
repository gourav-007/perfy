import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics for dashboard
let dashboardRequests = new Counter('dashboard_requests');
let dashboardErrors = new Rate('dashboard_errors');
let dashboardResponseTime = new Trend('dashboard_response_time');

export let options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '1m', target: 100 },   // Stay at 100 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'],
    dashboard_errors: ['rate<0.1'],
  }
};

const baseUrl = 'https://jsonplaceholder.typicode.com';

export default function () {
  // Simulate different API endpoints
  const endpoints = [
    '/posts',
    '/users',
    '/comments',
    '/albums',
    '/photos'
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const url = `${baseUrl}${endpoint}`;

  const response = http.get(url, {
    tags: {
      name: `GET ${endpoint}`,
      test_type: 'dashboard_test'
    }
  });

  // Record custom metrics
  dashboardRequests.add(1);
  dashboardResponseTime.add(response.timings.duration);

  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
    'response has content': (r) => r.body.length > 0,
  });

  if (!success) {
    dashboardErrors.add(1);
  }

  // Simulate user think time
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

export function handleSummary(data) {
  console.log('Dashboard test completed!');
  console.log(`Total requests: ${data.metrics.http_reqs.count}`);
  console.log(`Average response time: ${data.metrics.http_req_duration.avg.toFixed(2)}ms`);
  console.log(`Error rate: ${(data.metrics.http_req_failed.rate * 100).toFixed(2)}%`);

  return {
    'dashboard-test-summary.json': JSON.stringify(data, null, 2),
  };
}