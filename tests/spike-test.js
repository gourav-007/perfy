import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

// Spike test specific metrics
let spikeErrors = new Rate('spike_errors');
let spikeRecovery = new Counter('spike_recovery_requests');

export let options = {
  stages: [
    { duration: '2m', target: 100 },   // Normal baseline
    { duration: '10s', target: 2000 }, // Sudden spike
    { duration: '1m', target: 2000 },  // Sustain spike
    { duration: '10s', target: 100 },  // Drop back down
    { duration: '2m', target: 100 },   // Recovery period
    { duration: '10s', target: 0 },    // End
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'],
    http_req_failed: ['rate<0.15'],
    spike_errors: ['rate<0.2'],
  }
};

const baseUrl = 'https://jsonplaceholder.typicode.com';

export default function () {
  const response = http.get(`${baseUrl}/posts`, {
    tags: { test_type: 'spike' }
  });
  
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'spike response acceptable': (r) => r.timings.duration < 2000,
  });
  
  if (!success) {
    spikeErrors.add(1);
  } else {
    spikeRecovery.add(1);
  }
  
  sleep(1);
}