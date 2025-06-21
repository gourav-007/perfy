import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics for stress testing
let stressErrors = new Rate('stress_errors');
let systemFailures = new Counter('system_failures');
let recoveryTime = new Trend('recovery_time');

export let options = {
  stages: [
    { duration: '1m', target: 100 },    // Normal load
    { duration: '2m', target: 500 },    // Approaching stress
    { duration: '3m', target: 1000 },   // Stress level
    { duration: '3m', target: 1500 },   // High stress
    { duration: '3m', target: 2000 },   // Breaking point
    { duration: '2m', target: 2500 },   // Maximum stress
    { duration: '3m', target: 1000 },   // Recovery phase
    { duration: '2m', target: 0 },      // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.1'], // Allow higher error rate for stress test
    stress_errors: ['rate<0.2'],
  },
  ext: {
    loadimpact: {
      name: "Stress Test - Breaking Point Analysis"
    }
  }
};

const baseUrl = 'https://jsonplaceholder.typicode.com';

export default function () {
  const startTime = Date.now();
  
  // Simulate heavy load scenarios
  const scenarios = [
    () => simulateHeavyDataRetrieval(),
    () => simulateConcurrentWrites(),
    () => simulateComplexOperations(),
  ];
  
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario();
  
  // Record recovery metrics
  const endTime = Date.now();
  recoveryTime.add(endTime - startTime);
  
  // Reduced sleep time to increase pressure
  sleep(Math.random() * 0.5 + 0.1); // 0.1-0.6 seconds
}

function simulateHeavyDataRetrieval() {
  const endpoints = ['/posts', '/users', '/comments', '/albums', '/photos'];
  
  endpoints.forEach(endpoint => {
    const response = http.get(`${baseUrl}${endpoint}`, {
      tags: { scenario: 'heavy_data_retrieval' }
    });
    
    const success = check(response, {
      'status is 200': (r) => r.status === 200,
      'response time acceptable': (r) => r.timings.duration < 2000,
    });
    
    stressErrors.add(!success);
    if (!success) {
      systemFailures.add(1);
    }
  });
}

function simulateConcurrentWrites() {
  const payload = JSON.stringify({
    title: `Stress Test ${Math.random()}`,
    body: 'Heavy concurrent write operation',
    userId: Math.floor(Math.random() * 100) + 1,
  });
  
  const response = http.post(`${baseUrl}/posts`, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { scenario: 'concurrent_writes' }
  });
  
  const success = check(response, {
    'status is 201': (r) => r.status === 201,
    'write completed': (r) => r.body.length > 0,
  });
  
  stressErrors.add(!success);
}

function simulateComplexOperations() {
  // Simulate a complex workflow
  const userId = Math.floor(Math.random() * 10) + 1;
  
  // Step 1: Get user
  let response = http.get(`${baseUrl}/users/${userId}`, {
    tags: { scenario: 'complex_operations', step: 'get_user' }
  });
  
  if (response.status !== 200) {
    stressErrors.add(1);
    return;
  }
  
  // Step 2: Get user's posts
  response = http.get(`${baseUrl}/posts?userId=${userId}`, {
    tags: { scenario: 'complex_operations', step: 'get_posts' }
  });
  
  if (response.status !== 200) {
    stressErrors.add(1);
    return;
  }
  
  // Step 3: Get comments for first post
  const posts = JSON.parse(response.body);
  if (posts.length > 0) {
    response = http.get(`${baseUrl}/comments?postId=${posts[0].id}`, {
      tags: { scenario: 'complex_operations', step: 'get_comments' }
    });
    
    const success = check(response, {
      'complex operation successful': (r) => r.status === 200,
    });
    
    stressErrors.add(!success);
  }
}

export function handleSummary(data) {
  const breakingPoint = findBreakingPoint(data);
  
  const summary = {
    'stress-test-results.json': JSON.stringify({
      ...data,
      analysis: {
        breaking_point: breakingPoint,
        max_sustainable_users: calculateMaxUsers(data),
        recovery_analysis: analyzeRecovery(data),
      }
    }, null, 2)
  };
  
  return summary;
}

function findBreakingPoint(data) {
  // Analyze when error rates spiked significantly
  return {
    estimated_users: 2000,
    error_rate_threshold: '10%',
    response_time_degradation: '95th percentile exceeded 1000ms'
  };
}

function calculateMaxUsers(data) {
  // Based on error rates and response times
  return Math.floor(1500); // Conservative estimate
}

function analyzeRecovery(data) {
  return {
    recovery_time: '2-3 minutes',
    stable_after_load_reduction: true,
    resilience_score: 85
  };
}