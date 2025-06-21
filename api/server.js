const express = require('express');
const cors = require('cors');
const { InfluxDB } = require('@influxdata/influxdb-client');
const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// InfluxDB configuration
const influxDB = new InfluxDB({
  url: process.env.INFLUXDB_URL || 'http://influxdb:8086',
  token: process.env.INFLUXDB_TOKEN || 'my-super-secret-auth-token',
});

const org = process.env.INFLUXDB_ORG || 'performance-testing';
const bucket = process.env.INFLUXDB_BUCKET || 'k6-metrics';

// Store running tests
let runningTests = new Map();

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Performance Testing API',
    version: '1.0.0',
    endpoints: [
      'GET /api/health',
      'GET /api/metrics/summary',
      'GET /api/tests',
      'POST /api/tests',
      'POST /api/tests/:id/start',
      'POST /api/run-k6-test'
    ]
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    influxdb: process.env.INFLUXDB_URL || 'http://influxdb:8086',
    org: org,
    bucket: bucket,
    runningTests: runningTests.size,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test InfluxDB connection
app.get('/api/influx/test', async (req, res) => {
  try {
    const queryApi = influxDB.getQueryApi(org);
    const query = `from(bucket: "${bucket}") |> range(start: -1h) |> limit(n: 1)`;

    const results = [];
    await queryApi.queryRows(query, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        results.push(o);
      },
      error(error) {
        console.error('InfluxDB test error:', error);
        res.status(500).json({ error: 'InfluxDB connection failed', details: error.message });
      },
      complete() {
        res.json({
          status: 'InfluxDB connection successful',
          sampleDataCount: results.length,
          timestamp: new Date().toISOString()
        });
      },
    });
  } catch (error) {
    console.error('InfluxDB test error:', error);
    res.status(500).json({ error: 'InfluxDB connection failed', details: error.message });
  }
});

// Get metrics from InfluxDB
app.get('/api/metrics/summary', async (req, res) => {
  try {
    console.log('Fetching metrics from InfluxDB...');
    const queryApi = influxDB.getQueryApi(org);

    const query = `
      from(bucket: "${bucket}")
        |> range(start: -10m)
        |> filter(fn: (r) => r["_measurement"] == "http_req_duration" or r["_measurement"] == "http_reqs" or r["_measurement"] == "http_req_failed" or r["_measurement"] == "vus")
        |> aggregateWindow(every: 10s, fn: mean, createEmpty: false)
        |> yield(name: "mean")
    `;

    const results = [];
    await queryApi.queryRows(query, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        results.push(o);
      },
      error(error) {
        console.error('Query error:', error);
        res.status(500).json({ error: 'Failed to fetch metrics', details: error.message });
      },
      complete() {
        console.log(`Found ${results.length} metric records`);
        res.json({
          metrics: results,
          count: results.length,
          timestamp: new Date().toISOString(),
          query: query
        });
      },
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get all tests
app.get('/api/tests', async (req, res) => {
  try {
    console.log('Fetching tests...');
    const tests = Array.from(runningTests.values()).map(test => ({
      id: test.id,
      name: test.name,
      status: test.status,
      created_at: test.created_at,
      config: test.config
    }));

    // Add some mock completed tests if no real tests
    if (tests.length === 0) {
      tests.push({
        id: 1,
        name: 'Sample Load Test',
        status: 'completed',
        created_at: new Date().toISOString(),
        config: {
          endpoint: 'jsonplaceholder',
          virtualUsers: 100,
          duration: '2m'
        }
      });
    }

    res.json({ tests, count: tests.length });
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Create new test
app.post('/api/tests', async (req, res) => {
  try {
    console.log('Creating new test:', req.body);
    const testConfig = req.body;
    const testId = Date.now();

    const test = {
      id: testId,
      name: testConfig.name || 'Load Test',
      status: 'created',
      created_at: new Date().toISOString(),
      config: testConfig
    };

    runningTests.set(testId, test);

    console.log('Test created with ID:', testId);

    res.json({
      id: testId,
      status: 'created',
      message: 'Test configuration saved and ready for execution'
    });
  } catch (error) {
    console.error('Error creating test:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Start test
app.post('/api/tests/:id/start', async (req, res) => {
  try {
    const testId = parseInt(req.params.id);
    console.log(`Starting test ${testId}`);

    const test = runningTests.get(testId);

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    test.status = 'running';
    test.started_at = new Date().toISOString();

    res.json({
      id: testId,
      status: 'running',
      message: 'Test execution started'
    });
  } catch (error) {
    console.error('Error starting test:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Run k6 test
app.post('/api/run-k6-test', async (req, res) => {
  try {
    const { script, config } = req.body;
    const scriptName = script || 'dashboard-test.js';

    console.log(`Running k6 test: ${scriptName}`);
    console.log('Config:', config);

    // Run k6 test using Docker
    const k6Process = spawn('docker-compose', [
      'run', '--rm', 'k6', 'run', `/scripts/${scriptName}`
    ], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    k6Process.stdout.on('data', (data) => {
      output += data.toString();
      console.log('k6 stdout:', data.toString());
    });

    k6Process.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.log('k6 stderr:', data.toString());
    });

    k6Process.on('close', (code) => {
      console.log(`k6 process exited with code ${code}`);
      if (code === 0) {
        console.log('k6 test completed successfully');
      } else {
        console.error('k6 test failed');
      }
    });

    // Don't wait for the process to complete, return immediately
    res.json({
      status: 'started',
      message: 'k6 test execution started',
      script: scriptName,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error running k6 test:', error);
    res.status(500).json({ error: 'Failed to start k6 test', details: error.message });
  }
});

// Stop test
app.post('/api/tests/:id/stop', async (req, res) => {
  try {
    const testId = parseInt(req.params.id);
    console.log(`Stopping test ${testId}`);

    const test = runningTests.get(testId);

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    test.status = 'stopped';
    test.stopped_at = new Date().toISOString();

    res.json({
      id: testId,
      status: 'stopped',
      message: 'Test execution stopped'
    });
  } catch (error) {
    console.error('Error stopping test:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Catch-all route for debugging
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl,
    availableRoutes: [
      'GET /',
      'GET /api/health',
      'GET /api/metrics/summary',
      'GET /api/tests',
      'POST /api/tests',
      'POST /api/tests/:id/start',
      'POST /api/run-k6-test'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Performance Test API running on port ${port}`);
  console.log(`📊 InfluxDB URL: ${process.env.INFLUXDB_URL || 'http://influxdb:8086'}`);
  console.log(`🏢 Organization: ${org}`);
  console.log(`🪣 Bucket: ${bucket}`);
  console.log(`🌐 Available at: http://localhost:${port}`);
  console.log(`❤️ Health check: http://localhost:${port}/api/health`);
});