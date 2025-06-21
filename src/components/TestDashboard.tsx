import React, { useState, useEffect, useCallback } from 'react';
import { Play, Square, Users, Clock, TrendingUp, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// --- Interfaces ---

// More accurate interface for k6 metrics from InfluxDB
interface K6Metric {
  _measurement: 'http_req_duration' | 'http_reqs' | 'http_req_failed' | 'vus';
  _field: string;
  _value: number;
  _time: string;
  // Add other common fields if they exist in your InfluxDB data
  tags?: Record<string, string>;
}

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

// --- Component ---

export function TestDashboard() {
  // --- State Declarations ---
  const [metrics, setMetrics] = useState<TestMetrics>({ responseTime: 0, throughput: 0, errorRate: 0, activeUsers: 0 });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testStatus, setTestStatus] = useState('idle');
  const [apiConnected, setApiConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // --- Memoized Callbacks for API Interactions ---

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
  }, []); // No dependencies, as it only checks static API endpoint

  const processInfluxMetrics = useCallback((influxMetrics: K6Metric[]): TestMetrics => {
    // Filter for the latest value of each metric type
    const getLatestValue = (measurement: K6Metric['_measurement']) => {
      const filtered = influxMetrics.filter(m => m._measurement === measurement);
      return filtered.length > 0 ? filtered[filtered.length - 1]._value : 0;
    };

    const responseTime = getLatestValue('http_req_duration');
    const throughput = getLatestValue('http_reqs');
    const errorRate = getLatestValue('http_req_failed');
    const activeUsers = getLatestValue('vus');

    return {
      responseTime: Math.round(responseTime),
      throughput: Math.round(throughput),
      errorRate: errorRate * 100, // Convert rate to percentage
      activeUsers: Math.round(activeUsers),
    };
  }, []); // No dependencies, as it operates on input data

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
            errors: Math.round(processedMetrics.errorRate), // Use rounded error rate for chart
          };
          // Keep only the last 20 data points for the chart
          setChartData(prev => [...prev.slice(-19), newDataPoint]);
        }
      } else {
        setError(`Failed to fetch metrics: ${response.status}`);
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
      setError('Failed to fetch metrics from API');
    }
  }, [apiConnected, processInfluxMetrics]); // Dependencies: apiConnected, processInfluxMetrics

  const checkTestStatus = useCallback(async () => {
    if (!apiConnected) {
      return;
    }
    try {
      const response = await fetch('/api/tests');
      if (response.ok) {
        const data = await response.json();
        // Assuming data.tests is an array of test objects
        const runningTest = data.tests?.find((test: { status: string }) => test.status === 'running');
        setIsRunning(!!runningTest);
        setTestStatus(runningTest ? 'running' : 'idle');
      }
    } catch (err) {
      console.error('Failed to check test status:', err);
    }
  }, [apiConnected]); // Dependencies: apiConnected

  // --- Effects ---

  // Main useEffect for initial checks and polling setup
  useEffect(() => {
    // Initial API health check
    checkApiHealth().then((connected) => {
      if (connected) {
        fetchMetrics();
        checkTestStatus();
      }
    });

    // Set up polling intervals
    const healthInterval = setInterval(checkApiHealth, 10000); // Every 10 seconds
    const metricsInterval = setInterval(fetchMetrics, 5000);   // Every 5 seconds
    const statusInterval = setInterval(checkTestStatus, 3000); // Every 3 seconds

    // Cleanup function to clear intervals when component unmounts
    return () => {
      clearInterval(healthInterval);
      clearInterval(metricsInterval);
      clearInterval(statusInterval);
    };
  }, [checkApiHealth, fetchMetrics, checkTestStatus]); // Dependencies: memoized callback functions

  // --- Handlers ---

  const startTest = async () => {
    try {
      const response = await fetch('/api/tests/start', { method: 'POST' });
      if (response.ok) {
        setIsRunning(true);
        setTestStatus('running');
        setError(null);
      } else {
        setError(`Failed to start test: ${response.status}`);
      }
    } catch (err) {
      console.error('Error starting test:', err);
      setError('Error starting test. Check API server.');
    }
  };

  const stopTest = async () => {
    try {
      const response = await fetch('/api/tests/stop', { method: 'POST' });
      if (response.ok) {
        setIsRunning(false);
        setTestStatus('idle');
        setError(null);
      } else {
        setError(`Failed to stop test: ${response.status}`);
      }
    } catch (err) {
      console.error('Error stopping test:', err);
      setError('Error stopping test. Check API server.');
    }
  };

  // --- Render ---

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">k6 Performance Dashboard</h1>

      {/* API Connection Status */}
      <div className={`p-4 rounded-lg mb-6 text-center font-medium ${apiConnected ? 'bg-green-600' : 'bg-red-600'}`}>
        {apiConnected ? (
          <span className="flex items-center justify-center space-x-2">
            <Wifi className="w-5 h-5" /> <span>API Connected</span>
          </span>
        ) : (
          <span className="flex items-center justify-center space-x-2">
            <WifiOff className="w-5 h-5" /> <span>API Disconnected. {error}</span>
          </span>
        )}
      </div>

      {/* Test Controls */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6 flex justify-center space-x-4">
        <button
          onClick={startTest}
          disabled={isRunning || !apiConnected}
          className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          <Play className="w-5 h-5" />
          <span>Start Test</span>
        </button>
        <button
          onClick={stopTest}
          disabled={!isRunning || !apiConnected}
          className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          <Square className="w-5 h-5" />
          <span>Stop Test</span>
        </button>
      </div>

      {/* Test Status & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-300 mb-2">Test Status</h3>
          <p className={`text-3xl font-bold ${testStatus === 'running' ? 'text-green-400' : 'text-gray-400'}`}>
            {testStatus.toUpperCase()}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-300 mb-2">Active Users</h3>
          <p className="text-3xl font-bold text-blue-400 flex items-center justify-center space-x-2">
            <Users className="w-6 h-6" /> <span>{metrics.activeUsers}</span>
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-300 mb-2">Throughput (req/s)</h3>
          <p className="text-3xl font-bold text-purple-400 flex items-center justify-center space-x-2">
            <TrendingUp className="w-6 h-6" /> <span>{metrics.throughput}</span>
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-300 mb-2">Avg. Response Time (ms)</h3>
          <p className="text-3xl font-bold text-yellow-400 flex items-center justify-center space-x-2">
            <Clock className="w-6 h-6" /> <span>{metrics.responseTime}</span>
          </p>
        </div>
      </div>

      {/* Error Rate */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6 text-center">
        <h3 className="text-lg font-semibold text-gray-300 mb-2">Error Rate (%)</h3>
        <p className={`text-3xl font-bold flex items-center justify-center space-x-2 ${metrics.errorRate > 0 ? 'text-red-400' : 'text-green-400'}`}>
          <AlertTriangle className="w-6 h-6" /> <span>{metrics.errorRate.toFixed(2)}%</span>
        </p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-300 mb-4">Throughput (req/s)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4a4a4a" />
              <XAxis dataKey="time" stroke="#9a9a9a" />
              <YAxis stroke="#9a9a9a" />
              <Tooltip
                contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '5px' }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="throughput" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-300 mb-4">Response Time (ms)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4a4a4a" />
              <XAxis dataKey="time" stroke="#9a9a9a" />
              <YAxis stroke="#9a9a9a" />
              <Tooltip
                contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '5px' }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="responseTime" stroke="#82ca9d" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="text-sm text-gray-500 text-center">Last updated: {lastUpdate}</p>
    </div>
  );
}