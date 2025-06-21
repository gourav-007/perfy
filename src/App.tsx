import React, { useState } from 'react';
import { TestDashboard } from './components/TestDashboard';
import { TestConfiguration } from './components/TestConfiguration';
import { TestResults } from './components/TestResults';
import { SystemStatus } from './components/SystemStatus';
import { Activity, Settings, BarChart3, Monitor } from 'lucide-react';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: Activity },
  { id: 'configure', label: 'Configure Tests', icon: Settings },
  { id: 'results', label: 'Results', icon: BarChart3 },
  { id: 'system', label: 'System Status', icon: Monitor },
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <TestDashboard />;
      case 'configure':
        return <TestConfiguration />;
      case 'results':
        return <TestResults />;
      case 'system':
        return <SystemStatus />;
      default:
        return <TestDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Activity className="w-8 h-8 text-blue-400" />
              <h1 className="text-xl font-bold">Performance Testing Framework</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300">System Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-400 text-blue-400'
                      : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;