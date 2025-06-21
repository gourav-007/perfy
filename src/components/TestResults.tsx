import React, { useState } from 'react';
import { Calendar, Download, Eye, Trash2, TrendingUp, Clock, Users, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const testResults = [
  {
    id: 1,
    name: 'API Load Test - JSONPlaceholder',
    date: '2024-01-15 14:30:00',
    duration: '5m 23s',
    status: 'completed',
    virtualUsers: 1000,
    totalRequests: 15430,
    avgResponseTime: 245,
    throughput: 89.2,
    errorRate: 1.2,
    peakMemory: '2.1 GB',
  },
  {
    id: 2,
    name: 'Stress Test - Custom API',
    date: '2024-01-15 12:15:00',
    duration: '10m 45s',
    status: 'completed',
    virtualUsers: 2000,
    totalRequests: 32150,
    avgResponseTime: 387,
    throughput: 67.4,
    errorRate: 3.8,
    peakMemory: '4.2 GB',
  },
  {
    id: 3,
    name: 'Spike Test - HTTPBin',
    date: '2024-01-15 09:45:00',
    duration: '3m 12s',
    status: 'failed',
    virtualUsers: 500,
    totalRequests: 8920,
    avgResponseTime: 156,
    throughput: 124.8,
    errorRate: 12.4,
    peakMemory: '1.8 GB',
  },
];

const responseTimeData = [
  { percentile: 'p50', time: 185 },
  { percentile: 'p75', time: 245 },
  { percentile: 'p90', time: 324 },
  { percentile: 'p95', time: 456 },
  { percentile: 'p99', time: 678 },
];

const errorDistribution = [
  { name: 'Success', value: 87.6, color: '#10B981' },
  { name: '4xx Errors', value: 8.2, color: '#F59E0B' },
  { name: '5xx Errors', value: 3.1, color: '#EF4444' },
  { name: 'Timeouts', value: 1.1, color: '#8B5CF6' },
];

export function TestResults() {
  const [selectedTest, setSelectedTest] = useState<number | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-900/20';
      case 'failed': return 'text-red-400 bg-red-900/20';
      case 'running': return 'text-blue-400 bg-blue-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const downloadReport = (testId: number) => {
    // In a real app, this would generate and download a report
    alert(`Downloading report for test ${testId}`);
  };

  const deleteTest = (testId: number) => {
    // In a real app, this would delete the test result
    if (confirm('Are you sure you want to delete this test result?')) {
      alert(`Test ${testId} deleted`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Test Results</h2>
            <p className="text-gray-400">View and analyze your performance test results</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>Last 30 days</span>
            </div>
          </div>
        </div>

        {/* Test Results Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="pb-3 text-gray-300 font-medium">Test Name</th>
                <th className="pb-3 text-gray-300 font-medium">Date</th>
                <th className="pb-3 text-gray-300 font-medium">Status</th>
                <th className="pb-3 text-gray-300 font-medium">Users</th>
                <th className="pb-3 text-gray-300 font-medium">Avg Response</th>
                <th className="pb-3 text-gray-300 font-medium">Error Rate</th>
                <th className="pb-3 text-gray-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {testResults.map((test) => (
                <tr key={test.id} className="border-b border-gray-700/50">
                  <td className="py-4">
                    <div>
                      <p className="font-medium text-white">{test.name}</p>
                      <p className="text-sm text-gray-400">{test.duration}</p>
                    </div>
                  </td>
                  <td className="py-4 text-gray-300">{test.date}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                      {test.status}
                    </span>
                  </td>
                  <td className="py-4 text-gray-300">{test.virtualUsers.toLocaleString()}</td>
                  <td className="py-4 text-gray-300">{test.avgResponseTime}ms</td>
                  <td className="py-4">
                    <span className={`font-medium ${test.errorRate > 5 ? 'text-red-400' : test.errorRate > 2 ? 'text-orange-400' : 'text-green-400'}`}>
                      {test.errorRate}%
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedTest(selectedTest === test.id ? null : test.id)}
                        className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => downloadReport(test.id)}
                        className="p-1 text-green-400 hover:text-green-300 transition-colors"
                        title="Download Report"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTest(test.id)}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Results */}
      {selectedTest && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-6">Test Details - {testResults.find(t => t.id === selectedTest)?.name}</h3>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Requests</p>
                  <p className="text-2xl font-bold">15,430</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Throughput</p>
                  <p className="text-2xl font-bold">89.2 req/s</p>
                </div>
                <Clock className="w-8 h-8 text-green-400" />
              </div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Peak Users</p>
                  <p className="text-2xl font-bold">1,000</p>
                </div>
                <Users className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Error Rate</p>
                  <p className="text-2xl font-bold">1.2%</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-400" />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-700 rounded-lg p-6">
              <h4 className="text-lg font-semibold mb-4">Response Time Percentiles</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={responseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="percentile" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="time" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-700 rounded-lg p-6">
              <h4 className="text-lg font-semibold mb-4">Error Distribution</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={errorDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {errorDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center mt-4 space-x-4">
                {errorDistribution.map((entry, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                    <span className="text-sm text-gray-300">{entry.name}: {entry.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}