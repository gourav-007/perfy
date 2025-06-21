import React, { useState, useEffect, useCallback } from 'react';
import { Play, Square, Users, Clock, TrendingUp, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface TestMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  activeUsers: number;
}

interface ChartDataPoint {
  time: string;
  responseTime: number;
  throughput: number;
  errors: number;
}

interface K6Metric {
  // Define the structure of your metric objects
  // This is an example, adjust it to match your actual data
  type: string;
  data: {
    time: string;
    value: number;
    tags: Record<string, string>;
  };
}

export function TestDashboard() {
  // ... (state declarations remain the same) ...

  // 2. Wrap your functions in useCallback to memoize them
  const checkApiHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        setApiConnected(true);
        setError(null);
        return true;
      } else {
        setApiConnected(false);
        setError(`API returned status: ${response.status}`);
        return false;
      }
    } catch (err) {
      setApiConnected(false);
      setError('Cannot connect to API. Make sure the API server is running on port 8080.');
      console.error('API health check failed:', err);
      return false;
    }
  }, []);

  // Fix the 'any' type and wrap in useCallback
  const processInfluxMetrics = useCallback((influxMetrics: K6Metric[]): TestMetrics => {
    const responseTimeMetrics = influxMetrics.filter(m => m._measurement === 'http_req_duration');
    const throughputMetrics = influxMetrics.filter(m => m._measurement === 'http_reqs');
    const errorMetrics = influxMetrics.filter(m => m._measurement === 'http_req_failed');
    const userMetrics = influxMetrics.filter(m => m._measurement === 'vus');

    return {
      responseTime: responseTimeMetrics.length > 0 ? Math.round(responseTimeMetrics[responseTimeMetrics.length - 1].data.value) : 0,
      throughput: throughputMetrics.length > 0 ? Math.round(throughputMetrics[throughputMetrics.length - 1].data.value) : 0,
      errorRate: errorMetrics.length > 0 ? (errorMetrics[errorMetrics.length - 1].data.value * 100) : 0,
      activeUsers: userMetrics.length > 0 ? Math.round(userMetrics[userMetrics.length - 1].data.value) : 0,
    };
  }, []);

  const fetchMetrics = useCallback(async () => {
    if (!apiConnected) {
      return;
    }
    try {
      const response = await fetch('/api/metrics/summary');
      if (response.ok) {
        const data = await response.json();
        setLastUpdate(new Date().toLocaleTimeString());

        if (data.metrics && data.metrics.length > 0) {
          const processedMetrics = processInfluxMetrics(data.metrics);
          setMetrics(processedMetrics);

          const newDataPoint = {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            responseTime: processedMetrics.responseTime,
            throughput: processedMetrics.throughput,
            errors: Math.round(processedMetrics.errorRate),
          };
          setChartData(prev => [...prev.slice(-19), newDataPoint]);
        }
      } else {
        setError(`Failed to fetch metrics: ${response.status}`);
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
      setError('Failed to fetch metrics from API');
    }
  }, [apiConnected, processInfluxMetrics]);

  const checkTestStatus = useCallback(async () => {
    if (!apiConnected) {
      return;
    }
    try {
      const response = await fetch('/api/tests');
      if (response.ok) {
        const data = await response.json();
        // Fix the 'any' type in the find callback
        const runningTest = data.tests?.find((test: { status: string }) => test.status === 'running');
        setIsRunning(!!runningTest);
        setTestStatus(runningTest ? 'running' : 'idle');
      }
    } catch (err) {
      console.error('Failed to check test status:', err);
    }
  }, [apiConnected]);

  // 3. Correct the useEffect hook
  useEffect(() => {
    // Initial API health check
    checkApiHealth().then((connected) => {
      if (connected) {
        fetchMetrics();
        checkTestStatus();
      }
    }); // <-- FIX: The misplaced array is removed from here

    // Set up polling intervals
    const healthInterval = setInterval(checkApiHealth, 10000);
    const metricsInterval = setInterval(fetchMetrics, 5000);
    const statusInterval = setInterval(checkTestStatus, 3000);

    return () => {
      clearInterval(healthInterval);
      clearInterval(metricsInterval);
      clearInterval(statusInterval);
    };
    // Add the memoized functions to the dependency array to satisfy the linter
  }, [checkApiHealth, fetchMetrics, checkTestStatus]);

    // Set up polling intervals
    const healthInterval = setInterval(checkApiHealth, 10000); // Every 10 seconds
    const metricsInterval = setInterval(() => {
      if (apiConnected) {
        fetchMetrics();
      }
    }, 5000); // Every 5 seconds
    const statusInterval = setInterval(() => {
      if (apiConnected) {
        checkTestStatus();
      }
    }, 3000); // Every 3 seconds

    return () => {
      clearInterval(healthInterval);
      clearInterval(metricsInterval);
      clearInterval(statusInterval);
    };
  }, [apiConnected]);

  const startTest = async () => {
    if (!apiConnected) {
      setError('Cannot start test: API not connected');
      return;
    }

    try {
      setError(null);
      const response = await fetch('/api/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Dashboard Load Test',
          endpoint: 'jsonplaceholder',
          testType: 'load',
          virtualUsers: 100,
          duration: '2m',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Start the test
        const startResponse = await fetch(`/api/tests/${data.id}/start`, {
          method: 'POST',
        });

        if (startResponse.ok) {
          setIsRunning(true);
          setTestStatus('running');

          // Trigger k6 test execution
          const k6Response = await fetch('/api/run-k6-test', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              script: 'dashboard-test.js',
              config: {
                vus: 100,
                duration: '2m',
              },
            }),
          });

          if (k6Response.ok) {
            console.log('k6 test started successfully');
          } else {
            setError('Failed to start k6 test execution');
          }
        }
      }
    } catch (err) {
      console.error('Failed to start test:', err);
      setError('Failed to start test');
    }
  };

  const stopTest = async () => {
    try {
      setError(null);
      setIsRunning(false);
      setTestStatus('stopping');

      // Reset to idle after a moment
      setTimeout(() => setTestStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to stop test:', err);
      setError('Failed to stop test');
    }
  };

  return (
    <div className="space-y-6">
      {/* API Connection Status */}
      <div className={`bg-gray-800 rounded-lg p-4 border-l-4 ${apiConnected ? 'border-green-500' : 'border-red-500'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {apiConnected ? (
              <Wifi className="w-5 h-5 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-400" />
            )}
            <div>
              <h3 className={`font-medium ${apiConnected ? 'text-green-400' : 'text-red-400'}`}>
                API Connection: {apiConnected ? 'Connected' : 'Disconnected'}
              </h3>
              <p className="text-sm text-gray-400">
                {apiConnected ? `Last update: ${lastUpdate}` : 'Make sure API server is running on port 8080'}
              </p>
            </div>
          </div>
          <button
            onClick={checkApiHealth}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Test Control</h2>
            <p className="text-gray-400">Manage your performance tests with real k6 integration</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={startTest}
              disabled={isRunning || !apiConnected}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Start Real Test</span>
            </button>
            <button
              onClick={stopTest}
              disabled={!isRunning}
              className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              <Square className="w-4 h-4" />
              <span>Stop Test</span>
            </button>
          </div>
        </div>

        {/* Status Display */}
        {isRunning && (
          <div className="mt-4 p-4 bg-green-900/20 border border-green-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-medium">k6 Test Running</span>
            </div>
            <p className="text-gray-400 mt-1">Real performance test is active - data flowing to InfluxDB</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 font-medium">Error</span>
            </div>
            <p className="text-gray-400 mt-1">{error}</p>
          </div>
        )}

        {testStatus === 'idle' && !isRunning && apiConnected && (
          <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 font-medium">Ready to Test</span>
            </div>
            <p className="text-gray-400 mt-1">Click "Start Real Test" to run k6 load test and see live metrics</p>
          </div>
        )}

        {!apiConnected && (
          <div className="mt-4 p-4 bg-orange-900/20 border border-orange-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span className="text-orange-400 font-medium">API Not Available</span>
            </div>
            <p className="text-gray-400 mt-1">
              Make sure the API server is running. Try: <code className="bg-gray-700 px-2 py-1 rounded">docker-compose up -d test-api</code>
            </p>
          </div>
        )}
      </div>

      {/* Real-time Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Response Time</p>
              <p className="text-2xl font-bold">{metrics.responseTime}ms</p>
            </div>
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-400">
              {isRunning ? 'Live from k6' : apiConnected ? 'Last test result' : 'No data'}
            </span>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Throughput</p>
              <p className="text-2xl font-bold">{metrics.throughput} req/s</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-400">
              {isRunning ? 'Live from k6' : apiConnected ? 'Last test result' : 'No data'}
            </span>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Error Rate</p>
              <p className="text-2xl font-bold">{metrics.errorRate.toFixed(2)}%</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-400" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-400">
              {isRunning ? 'Live from k6' : apiConnected ? 'Last test result' : 'No data'}
            </span>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Users</p>
              <p className="text-2xl font-bold">{metrics.activeUsers}</p>
            </div>
            <Users className="w-8 h-8 text-purple-400" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-400">
              {isRunning ? 'Live VUs' : apiConnected ? 'Last test VUs' : 'No data'}
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            Response Time Trend {isRunning && <span className="text-green-400 text-sm">(Live)</span>}
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="responseTime"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No data available</p>
                <p className="text-sm">Run a test to see metrics</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            Throughput & Errors {isRunning && <span className="text-green-400 text-sm">(Live)</span>}
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="throughput"
                  stackId="1"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="errors"
                  stackId="2"
                  stroke="#EF4444"
                  fill="#EF4444"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No data available</p>
                <p className="text-sm">Run a test to see metrics</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Source Info */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Data Sources</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-blue-400 mb-2">k6 Load Testing</h4>
            <p className="text-sm text-gray-300">Real performance tests executed via Docker</p>
            <p className="text-xs text-gray-400 mt-1">Status: {isRunning ? 'Running' : 'Idle'}</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-green-400 mb-2">InfluxDB Metrics</h4>
            <p className="text-sm text-gray-300">Time-series data storage for test results</p>
            <p className="text-xs text-gray-400 mt-1">Bucket: k6-metrics</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-purple-400 mb-2">Live Dashboard</h4>
            <p className="text-sm text-gray-300">Real-time visualization of test metrics</p>
            <p className="text-xs text-gray-400 mt-1">
              API: {apiConnected ? 'Connected' : 'Disconnected'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {!apiConnected && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Troubleshooting</h3>
          <div className="space-y-3">
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-orange-400 mb-2">API Not Connected</h4>
              <p className="text-sm text-gray-300 mb-3">Try these steps to fix the connection:</p>
              <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                <li>Make sure Docker is running</li>
                <li>Run: <code className="bg-gray-600 px-2 py-1 rounded">docker-compose up -d test-api</code></li>
                <li>Check API health: <code className="bg-gray-600 px-2 py-1 rounded">curl http://localhost:8080/api/health</code></li>
                <li>Check container status: <code className="bg-gray-600 px-2 py-1 rounded">docker-compose ps</code></li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}