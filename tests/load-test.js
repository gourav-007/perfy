// C:/Users/goura/Downloads/SDETProjects/Perfy/tests/load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// --- Configuration via Environment Variables ---
// Default values for a full load test. These can be overridden by __ENV variables
// when running k6 (e.g., k6 run -e VUS=50 -e DURATION=30s script.js)
const VUS = parseInt(__ENV.VUS || '1000'); // Default to 1000 VUs
const DURATION = __ENV.DURATION || '5m'; // Default to 5 minutes at peak VUs
const BASE_URL = __ENV.BASE_URL || 'https://jsonplaceholder.typicode.com'; // Default API base URL

// --- Custom Metrics ---
// Tracks the rate of failed checks (e.g., status not 200/201, response time too high).
// This is distinct from http_req_failed which only tracks HTTP status code errors.
let customCheckErrorRate = new Rate('custom_check_errors');
// Tracks the rate of responses that meet a specific performance threshold (e.g., < 500ms).
let responseTimeUnder500msRate = new Rate('response_time_under_500ms_rate');
// Counts the total number of API requests made by the script.
let totalApiRequests = new Counter('total_api_requests');
// Records the duration of all responses. Trend metrics automatically calculate min, max, avg, and percentiles.
let responseDurationTrend = new Trend('response_duration_overall');

// --- Test Configuration ---
export let options = {
  // Define stages based on environment variables for flexibility.
  // This creates a ramp-up, steady-state, and ramp-down pattern.
  stages: [
    { duration: '1m', target: Math.floor(VUS * 0.1) }, // Ramp-up to 10% of target VUs
    { duration: '1m', target: Math.floor(VUS * 0.5) }, // Ramp-up to 50% of target VUs
    { duration: '1m', target: VUS },                   // Ramp-up to 100% of target VUs
    { duration: DURATION, target: VUS },               // Stay at peak VUs for the defined DURATION
    { duration: '1m', target: 0 },                     // Ramp-down to 0 users
  ],
  // Define performance thresholds. If any threshold is breached, the test will fail.
  thresholds: {
    // Built-in HTTP request duration percentiles.
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95th percentile < 500ms, 99th percentile < 1000ms
    // Built-in HTTP request failed rate (based on HTTP status codes like 4xx/5xx).
    http_req_failed: ['rate<0.05'],                 // HTTP error rate should be less than 5%
    // Custom check error rate (based on `check` results).
    custom_check_errors: ['rate<0.1'],              // Custom check error rate should be less than 10%
    // Custom response time rate (e.g., at least 95% of responses under 500ms).
    response_time_under_500ms_rate: ['rate>0.95'],  // At least 95% of responses should be under 500ms
    // Ensure all custom metrics are recorded and meet basic criteria.
    'total_api_requests': ['count>0'], // Ensure at least one request is made
    'response_duration_overall': ['p(95)<500'], // Example threshold for the custom trend's 95th percentile
  },
  // k6 Cloud integration (optional). Replace projectID with your actual k6 Cloud Project ID.
  ext: {
    loadimpact: {
      projectID: 3596718,
      name: "JSONPlaceholder API Load Test"
    }
  }
};

// --- Test Data ---
// Define different API scenarios with their relative weights.
// This allows for a realistic distribution of traffic.
const scenarios = [
  { name: 'Get Posts', endpoint: '/posts', weight: 40 },
  { name: 'Get Users', endpoint: '/users', weight: 20 },
  { name: 'Get Comments', endpoint: '/comments', weight: 15 },
  { name: 'Get Albums', endpoint: '/albums', weight: 10 },
  { name: 'Get Photos', endpoint: '/photos', weight: 10 },
  { name: 'Create Post', endpoint: '/posts', method: 'POST', weight: 5 },
];

/**
 * Selects a random scenario from the predefined list based on their weights.
 * @returns {object} A scenario object (e.g., { name: 'Get Posts', endpoint: '/posts', weight: 40 }).
 */
function getRandomScenario() {
  const totalWeight = scenarios.reduce((sum, scenario) => sum + scenario.weight, 0);
  let random = Math.random() * totalWeight;

  for (let scenario of scenarios) {
    random -= scenario.weight;
    if (random <= 0) {
      return scenario;
    }
  }
  // Fallback in case of floating point inaccuracies, though should rarely be reached
  return scenarios[scenarios.length - 1];
}

// --- Main Test Function (executed by each VU) ---
export default function () {
  const scenario = getRandomScenario(); // Get a random scenario for this iteration
  let response;

  // Common request parameters, including headers and tags for metric filtering.
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'k6-load-test/1.0',
    },
    // Tags allow you to filter metrics in k6 results and visualization tools like Grafana.
    tags: {
      name: scenario.name, // Name of the specific scenario (e.g., 'Get Posts')
      endpoint: scenario.endpoint, // The API endpoint being hit
      scenario_type: scenario.method || 'GET', // Type of request (GET or POST)
    },
  };

  // Execute the selected scenario based on its HTTP method.
  if (scenario.method === 'POST') {
    const payload = JSON.stringify({
      title: 'Load Test Post from k6',
      body: 'This is a test post created during load testing by k6.',
      userId: Math.floor(Math.random() * 10) + 1, // Random user ID between 1 and 10
    });
    response = http.post(`${BASE_URL}${scenario.endpoint}`, payload, params);
  } else {
    // Handle GET requests with optional query parameters for more realistic traffic patterns.
    let url = `${BASE_URL}${scenario.endpoint}`;
    if (scenario.endpoint === '/posts' && Math.random() < 0.3) { // 30% chance to get a specific post
      url += `/${Math.floor(Math.random() * 100) + 1}`; // Post IDs from 1 to 100
    } else if (scenario.endpoint === '/users' && Math.random() < 0.2) { // 20% chance to get a specific user
      url += `/${Math.floor(Math.random() * 10) + 1}`; // User IDs from 1 to 10
    }
    response = http.get(url, params);
  }

  // --- Validate Response and Record Metrics ---
  // Perform checks on the response. Failed checks contribute to the 'checks' metric and can be used for custom error rates.
  const checkResult = check(response, {
    'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
    'response has content': (r) => r.body && r.body.length > 0, // Ensure body exists before checking length
  });

  // Record custom metrics based on the response and check results.
  totalApiRequests.add(1); // Increment total API requests counter
  customCheckErrorRate.add(!checkResult); // Add 1 if any check failed, 0 otherwise
  responseTimeUnder500msRate.add(response.timings.duration < 500); // Add 1 if duration < 500ms, 0 otherwise
  responseDurationTrend.add(response.timings.duration); // Add response duration to the trend metric

  // Log errors for debugging purposes (useful during script development or for unexpected responses).
  if (response.status !== 200 && response.status !== 201) {
    console.error(`Request failed: ${scenario.name} - Status: ${response.status} - URL: ${response.url} - Body: ${response.body ? response.body.substring(0, 200) : '[No Body]'}`);
  }

  // Simulate user think time between requests to mimic realistic user behavior.
  sleep(Math.random() * 2 + 1); // Random sleep between 1 and 3 seconds
}

// --- Custom Text Summary Function (for console output) ---
/**
 * Generates a formatted text summary of k6 test results for console output.
 * @param {object} data - The k6 summary data object.
 * @param {object} [options] - Options for formatting.
 * @param {string} [options.indent=' '] - Indentation string for the summary.
 * @param {boolean} [options.enableColors=true] - Whether to enable console colors in the output.
 * @returns {string} The formatted summary string.
 */
function textSummary(data, options = {}) {
  const indent = options.indent || '';
  const colors = options.enableColors !== false; // Default to true

  // Helper functions for colored console output
  const color = (text, code) => colors ? `\x1b[${code}m${text}\x1b[0m` : text;
  const green = (text) => color(text, 32);
  const red = (text) => color(text, 31);
  const yellow = (text) => color(text, 33);
  const blue = (text) => color(text, 34);
  const bold = (text) => color(text, 1);

  let summary = `${indent}${bold('--- k6 Test Summary ---')}\n\n`;

  // Determine overall test status based on defined thresholds
  const httpFailedRate = data.metrics.http_req_failed.rate;
  const customErrorRate = data.metrics.custom_check_errors.rate;
  const overallSuccess = httpFailedRate < 0.05 && customErrorRate < 0.1; // Check against thresholds
  summary += `${indent}Overall Test Status: ${overallSuccess ? green('PASSED') : red('FAILED')}\n\n`;

  summary += `${indent}${bold('Performance Metrics:')}\n`;
  summary += `${indent}  • Total Requests: ${blue(data.metrics.http_reqs.count)}\n`;
  summary += `${indent}  • Request Rate: ${blue(data.metrics.http_reqs.rate.toFixed(2))} req/s\n`;
  summary += `${indent}  • Average Response Time: ${blue(data.metrics.http_req_duration.avg.toFixed(2))}ms\n`;
  summary += `${indent}  • 95th Percentile (HTTP): ${blue(data.metrics.http_req_duration['p(95)'].toFixed(2))}ms\n`;
  summary += `${indent}  • 99th Percentile (HTTP): ${blue(data.metrics.http_req_duration['p(99)'].toFixed(2))}ms\n`;
  summary += `${indent}  • Custom Trend P95: ${blue(data.metrics.response_duration_overall['p(95)'].toFixed(2))}ms\n`; // Display custom trend P95

  // Error Rates
  summary += `${indent}  • HTTP Error Rate: ${red((httpFailedRate * 100).toFixed(2))}% (Threshold: <5%)\n`;
  summary += `${indent}  • Custom Check Error Rate: ${red((customErrorRate * 100).toFixed(2))}% (Threshold: <10%)\n`;

  // Custom Rates
  const responseTimeUnder500ms = data.metrics.response_time_under_500ms_rate.rate;
  summary += `${indent}  • Responses < 500ms Rate: ${green((responseTimeUnder500ms * 100).toFixed(2))}% (Threshold: >95%)\n`;

  // Checks Summary
  const checksPassed = data.metrics.checks.passes;
  const checksFailed = data.metrics.checks.fails;
  const totalChecks = checksPassed + checksFailed;
  const checksRate = totalChecks > 0 ? (checksPassed / totalChecks * 100).toFixed(2) : 'N/A';
  summary += `${indent}  • Checks Passed: ${yellow(checksRate)}% (${checksPassed}/${totalChecks})\n`;

  summary += `\n${indent}${bold('--- End of Summary ---')}\n`;

  return summary;
}

// --- Handle Summary Function (k6 built-in lifecycle hook) ---
/**
 * This function is called by k6 after the test run completes.
 * It's used to export the test results to various formats (e.g., JSON file, console output).
 * @param {object} data - The full k6 summary data object containing all test metrics and results.
 * @returns {object} An object defining the output files and console output.
 */
export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data, null, 2), // Export the full summary data to a JSON file
    stdout: textSummary(data, { indent: ' ', enableColors: true }), // Print the custom formatted text summary to the console
  };
}