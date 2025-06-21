import React, { useState } from 'react';
import { Save, Play, Trash2, Plus } from 'lucide-react';

const apiEndpoints = [
  { value: 'jsonplaceholder', label: 'JSONPlaceholder', url: 'https://jsonplaceholder.typicode.com' },
  { value: 'httpbin', label: 'HTTPBin', url: 'https://httpbin.org' },
  { value: 'reqres', label: 'ReqRes', url: 'https://reqres.in/api' },
  { value: 'custom', label: 'Custom API', url: '' },
];

const testTypes = [
  { value: 'load', label: 'Load Test', description: 'Normal expected load' },
  { value: 'stress', label: 'Stress Test', description: 'Beyond normal capacity' },
  { value: 'spike', label: 'Spike Test', description: 'Sudden increase in load' },
  { value: 'volume', label: 'Volume Test', description: 'Large amounts of data' },
];

interface TestConfig {
  vus: number;
  duration: string;
}

interface TestConfigurationProps {
  onStartTest: () => void;
  // BEFORE: Using 'any'
  // setConfiguration: (config: any) => void;
  // AFTER: Use the specific type
  setConfiguration: (config: TestConfig) => void;
}



export function TestConfiguration() {
  const [config, setConfig] = useState({
    name: 'API Load Test',
    endpoint: 'jsonplaceholder',
    customUrl: '',
    testType: 'load',
    virtualUsers: 1000,
    duration: '5m',
    rampUpTime: '2m',
    thinkTime: '1s',
    requestsPerSecond: 100,
    headers: [{ key: 'Content-Type', value: 'application/json' }],
    scenarios: [
      { name: 'Get Posts', method: 'GET', path: '/posts', weight: 70 },
      { name: 'Get Users', method: 'GET', path: '/users', weight: 30 },
    ],
  });

  const handleConfigChange = (field: string, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const addHeader = () => {
    setConfig(prev => ({
      ...prev,
      headers: [...prev.headers, { key: '', value: '' }]
    }));
  };

  const updateHeader = (index: number, field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      headers: prev.headers.map((header, i) => 
        i === index ? { ...header, [field]: value } : header
      )
    }));
  };

  const removeHeader = (index: number) => {
    setConfig(prev => ({
      ...prev,
      headers: prev.headers.filter((_, i) => i !== index)
    }));
  };

  const addScenario = () => {
    setConfig(prev => ({
      ...prev,
      scenarios: [...prev.scenarios, { name: '', method: 'GET', path: '', weight: 50 }]
    }));
  };

  const updateScenario = (index: number, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      scenarios: prev.scenarios.map((scenario, i) => 
        i === index ? { ...scenario, [field]: value } : scenario
      )
    }));
  };

  const removeScenario = (index: number) => {
    setConfig(prev => ({
      ...prev,
      scenarios: prev.scenarios.filter((_, i) => i !== index)
    }));
  };

  const saveConfiguration = () => {
    // In a real app, this would save to a backend
    console.log('Saving configuration:', config);
    alert('Configuration saved successfully!');
  };

  const runTest = () => {
    // In a real app, this would trigger the test execution
    console.log('Running test with configuration:', config);
    alert('Test started! Check the Dashboard for real-time metrics.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Test Configuration</h2>
            <p className="text-gray-400">Configure your performance test parameters</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={saveConfiguration}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
            <button
              onClick={runTest}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Run Test</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Configuration</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Test Name</label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => handleConfigChange('name', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">API Endpoint</label>
              <select
                value={config.endpoint}
                onChange={(e) => handleConfigChange('endpoint', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {apiEndpoints.map((endpoint) => (
                  <option key={endpoint.value} value={endpoint.value}>
                    {endpoint.label}
                  </option>
                ))}
              </select>
            </div>

            {config.endpoint === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Custom URL</label>
                <input
                  type="url"
                  value={config.customUrl}
                  onChange={(e) => handleConfigChange('customUrl', e.target.value)}
                  placeholder="https://api.example.com"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Test Type</label>
              <select
                value={config.testType}
                onChange={(e) => handleConfigChange('testType', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {testTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Load Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Load Configuration</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Virtual Users</label>
                <input
                  type="number"
                  value={config.virtualUsers}
                  onChange={(e) => handleConfigChange('virtualUsers', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
                <input
                  type="text"
                  value={config.duration}
                  onChange={(e) => handleConfigChange('duration', e.target.value)}
                  placeholder="5m"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Ramp-up Time</label>
                <input
                  type="text"
                  value={config.rampUpTime}
                  onChange={(e) => handleConfigChange('rampUpTime', e.target.value)}
                  placeholder="2m"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Think Time</label>
                <input
                  type="text"
                  value={config.thinkTime}
                  onChange={(e) => handleConfigChange('thinkTime', e.target.value)}
                  placeholder="1s"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Target RPS</label>
              <input
                type="number"
                value={config.requestsPerSecond}
                onChange={(e) => handleConfigChange('requestsPerSecond', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Headers Configuration */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">HTTP Headers</h3>
            <button
              onClick={addHeader}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Header</span>
            </button>
          </div>
          
          <div className="space-y-2">
            {config.headers.map((header, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={header.key}
                  onChange={(e) => updateHeader(index, 'key', e.target.value)}
                  placeholder="Header name"
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={header.value}
                  onChange={(e) => updateHeader(index, 'value', e.target.value)}
                  placeholder="Header value"
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => removeHeader(index)}
                  className="p-2 text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Scenarios Configuration */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Test Scenarios</h3>
            <button
              onClick={addScenario}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Scenario</span>
            </button>
          </div>
          
          <div className="space-y-4">
            {config.scenarios.map((scenario, index) => (
              <div key={index} className="p-4 bg-gray-700 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input
                    type="text"
                    value={scenario.name}
                    onChange={(e) => updateScenario(index, 'name', e.target.value)}
                    placeholder="Scenario name"
                    className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={scenario.method}
                    onChange={(e) => updateScenario(index, 'method', e.target.value)}
                    className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                  <input
                    type="text"
                    value={scenario.path}
                    onChange={(e) => updateScenario(index, 'path', e.target.value)}
                    placeholder="/api/endpoint"
                    className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={scenario.weight}
                      onChange={(e) => updateScenario(index, 'weight', parseInt(e.target.value))}
                      placeholder="Weight %"
                      className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-400 text-sm">%</span>
                    <button
                      onClick={() => removeScenario(index)}
                      className="p-1 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}