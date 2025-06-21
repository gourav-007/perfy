import React, { useState, useEffect } from 'react';
import { Server, Database, Activity, HardDrive, Cpu, MemoryStick, Wifi, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const services = [
  { name: 'k6 Load Testing Engine', status: 'running', uptime: '2d 14h 32m', port: 6565 },
  { name: 'InfluxDB Metrics Store', status: 'running', uptime: '2d 14h 28m', port: 8086 },
  { name: 'Grafana Dashboard', status: 'running', uptime: '2d 14h 25m', port: 3000 },
  { name: 'Docker Engine', status: 'running', uptime: '7d 3h 15m', port: 2376 },
  { name: 'Test API Gateway', status: 'warning', uptime: '1d 2h 45m', port: 8080 },
];

const systemMetrics = {
  cpu: { usage: 45, cores: 8, model: 'Intel Core i7-12700K' },
  memory: { used: 12.4, total: 32, unit: 'GB' },
  disk: { used: 256, total: 1000, unit: 'GB' },
  network: { in: 145.2, out: 89.7, unit: 'MB/s' },
};

export function SystemStatus() {
  const [metrics, setMetrics] = useState(systemMetrics);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpu: { ...prev.cpu, usage: Math.max(20, Math.min(80, prev.cpu.usage + (Math.random() - 0.5) * 10)) },
        memory: { ...prev.memory, used: Math.max(8, Math.min(28, prev.memory.used + (Math.random() - 0.5) * 2)) },
        network: {
          ...prev.network,
          in: Math.max(50, Math.min(200, prev.network.in + (Math.random() - 0.5) * 30)),
          out: Math.max(20, Math.min(150, prev.network.out + (Math.random() - 0.5) * 20)),
        },
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const refreshStatus = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-orange-400" />;
      case 'stopped':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-green-400 bg-green-900/20';
      case 'warning':
        return 'text-orange-400 bg-orange-900/20';
      case 'stopped':
        return 'text-red-400 bg-red-900/20';
      default:
        return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage > 80) return 'bg-red-500';
    if (percentage > 60) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">System Status</h2>
            <p className="text-gray-400">Monitor system health and service status</p>
          </div>
          <button
            onClick={refreshStatus}
            disabled={isRefreshing}
            className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors ${isRefreshing ? 'animate-pulse' : ''}`}
          >
            <Activity className="w-4 h-4" />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-blue-400" />
              <span className="font-medium">CPU Usage</span>
            </div>
            <span className="text-sm text-gray-400">{metrics.cpu.cores} cores</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-2xl font-bold">{metrics.cpu.usage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(metrics.cpu.usage)}`}
                style={{ width: `${metrics.cpu.usage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400">{metrics.cpu.model}</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <MemoryStick className="w-5 h-5 text-green-400" />
              <span className="font-medium">Memory</span>
            </div>
            <span className="text-sm text-gray-400">{metrics.memory.total} GB</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-2xl font-bold">{metrics.memory.used.toFixed(1)} GB</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getUsageColor((metrics.memory.used / metrics.memory.total) * 100)}`}
                style={{ width: `${(metrics.memory.used / metrics.memory.total) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400">{((metrics.memory.used / metrics.memory.total) * 100).toFixed(1)}% used</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-5 h-5 text-purple-400" />
              <span className="font-medium">Disk Usage</span>
            </div>
            <span className="text-sm text-gray-400">{metrics.disk.total} GB</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-2xl font-bold">{metrics.disk.used} GB</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getUsageColor((metrics.disk.used / metrics.disk.total) * 100)}`}
                style={{ width: `${(metrics.disk.used / metrics.disk.total) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400">{((metrics.disk.used / metrics.disk.total) * 100).toFixed(1)}% used</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Wifi className="w-5 h-5 text-orange-400" />
              <span className="font-medium">Network</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">In:</span>
              <span className="font-medium">{metrics.network.in.toFixed(1)} MB/s</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Out:</span>
              <span className="font-medium">{metrics.network.out.toFixed(1)} MB/s</span>
            </div>
            <div className="pt-2">
              <div className="text-lg font-bold">
                {(metrics.network.in + metrics.network.out).toFixed(1)} MB/s
              </div>
              <p className="text-xs text-gray-400">Total throughput</p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Status */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-6">Service Status</h3>
        <div className="space-y-4">
          {services.map((service, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-4">
                {getStatusIcon(service.status)}
                <div>
                  <h4 className="font-medium text-white">{service.name}</h4>
                  <p className="text-sm text-gray-400">Port: {service.port} • Uptime: {service.uptime}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                  {service.status}
                </span>
                <div className="flex space-x-2">
                  <button className="text-gray-400 hover:text-white transition-colors">
                    <Server className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Docker Containers */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-6">Docker Containers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">k6-engine</h4>
              <span className="text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded-full">running</span>
            </div>
            <div className="text-sm text-gray-400 space-y-1">
              <p>Image: grafana/k6:latest</p>
              <p>CPU: 12.5% • Memory: 256MB</p>
              <p>Created: 2 days ago</p>
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">influxdb</h4>
              <span className="text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded-full">running</span>
            </div>
            <div className="text-sm text-gray-400 space-y-1">
              <p>Image: influxdb:2.7</p>
              <p>CPU: 8.3% • Memory: 512MB</p>
              <p>Created: 2 days ago</p>
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">grafana</h4>
              <span className="text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded-full">running</span>
            </div>
            <div className="text-sm text-gray-400 space-y-1">
              <p>Image: grafana/grafana:latest</p>
              <p>CPU: 5.2% • Memory: 384MB</p>
              <p>Created: 2 days ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}