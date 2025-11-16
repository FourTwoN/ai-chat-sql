import { useState, useEffect } from 'react';
import { Chat } from './components/Chat-unified';
import { Settings, type DatabaseSettings } from './components/Settings-unified';
import type { AIProvider } from './types';

const STORAGE_KEY_PROVIDER = 'ai_provider';
const STORAGE_KEY_API_KEY = 'openrouter_api_key';
const STORAGE_KEY_MODEL = 'openrouter_model';
const STORAGE_KEY_DB_SETTINGS = 'database_settings';
const DEFAULT_PROVIDER: AIProvider = 'openrouter';
const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet';

function App() {
  const [provider, setProvider] = useState<AIProvider>(DEFAULT_PROVIDER);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [showSettings, setShowSettings] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [databaseSettings, setDatabaseSettings] = useState<DatabaseSettings>({
    type: 'sqlite'
  });
  const [backendStatus, setBackendStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedProvider = localStorage.getItem(STORAGE_KEY_PROVIDER) as AIProvider;
    const savedApiKey = localStorage.getItem(STORAGE_KEY_API_KEY);
    const savedModel = localStorage.getItem(STORAGE_KEY_MODEL);
    const savedDbSettings = localStorage.getItem(STORAGE_KEY_DB_SETTINGS);

    if (savedProvider) {
      setProvider(savedProvider);
    }

    if (savedApiKey) {
      setApiKey(savedApiKey);
      setIsConfigured(true);
    } else {
      setShowSettings(true);
    }

    if (savedModel) {
      setModel(savedModel);
    }

    if (savedDbSettings) {
      try {
        setDatabaseSettings(JSON.parse(savedDbSettings));
      } catch (error) {
        console.error('Failed to parse database settings:', error);
      }
    }
  }, []);

  // Check backend status when database type is postgresql
  useEffect(() => {
    const checkBackend = async () => {
      if (databaseSettings.type !== 'postgresql') {
        setBackendStatus('unknown');
        return;
      }

      const url = databaseSettings.backendUrl || 'http://localhost:3001';
      try {
        const response = await fetch(`${url}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });

        if (response.ok) {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      } catch (error) {
        setBackendStatus('offline');
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [databaseSettings]);

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    localStorage.setItem(STORAGE_KEY_PROVIDER, newProvider);
  };

  const handleApiKeyChange = (newApiKey: string) => {
    setApiKey(newApiKey);
    localStorage.setItem(STORAGE_KEY_API_KEY, newApiKey);
    setIsConfigured(true);
  };

  const handleModelChange = (newModel: string) => {
    setModel(newModel);
    localStorage.setItem(STORAGE_KEY_MODEL, newModel);
  };

  const handleDatabaseChange = (newSettings: DatabaseSettings) => {
    setDatabaseSettings(newSettings);
    localStorage.setItem(STORAGE_KEY_DB_SETTINGS, JSON.stringify(newSettings));
  };

  const getDatabaseDisplayName = () => {
    if (databaseSettings.type === 'postgresql') {
      return databaseSettings.postgresConfig?.database || 'PostgreSQL';
    }
    return 'Chinook (Demo)';
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Database Chat
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Natural language database queries with interactive visualizations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isConfigured && (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {model.split('/').pop()}
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    {getDatabaseDisplayName()}
                  </span>
                </div>
                {databaseSettings.type === 'postgresql' && (
                  <div className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg border ${
                    backendStatus === 'online'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : backendStatus === 'offline'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      backendStatus === 'online' ? 'bg-green-500' :
                      backendStatus === 'offline' ? 'bg-red-500' : 'bg-gray-400'
                    }`}></div>
                    <span className={`text-xs font-medium ${
                      backendStatus === 'online' ? 'text-green-700 dark:text-green-300' :
                      backendStatus === 'offline' ? 'text-red-700 dark:text-red-300' :
                      'text-gray-600 dark:text-gray-400'
                    }`}>
                      Backend {backendStatus}
                    </span>
                  </div>
                )}
              </>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-700 dark:hover:to-gray-800 rounded-lg transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
              title="Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {isConfigured ? (
          <div className="h-full max-w-7xl mx-auto">
            {databaseSettings.type === 'postgresql' && backendStatus === 'offline' && (
              <div className="m-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 text-yellow-800 dark:text-yellow-300">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="font-semibold">Backend Server Offline</p>
                    <p className="text-sm mt-1">
                      The backend server is not responding. Make sure it's running on <code className="px-1 bg-yellow-100 dark:bg-yellow-900 rounded">{databaseSettings.backendUrl || 'http://localhost:3001'}</code>
                    </p>
                    <p className="text-sm mt-2">
                      Run: <code className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 rounded font-mono">cd backend && npm run dev</code>
                    </p>
                  </div>
                </div>
              </div>
            )}
            <Chat
              provider={provider}
              apiKey={apiKey}
              model={model}
              databaseType={databaseSettings.type}
              postgresConfig={databaseSettings.postgresConfig}
              backendUrl={databaseSettings.backendUrl}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                Welcome to AI Database Chat
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Configure your OpenRouter API key and database connection to get started
              </p>
              <button
                onClick={() => setShowSettings(true)}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-medium"
              >
                Open Settings
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span>
              Powered by{' '}
              <a
                href="https://openrouter.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                OpenRouter
              </a>
            </span>
            <span>•</span>
            <span>Database: {getDatabaseDisplayName()}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Interactive Charts
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Export to CSV/JSON/Excel
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Auto Query Retry
            </span>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      {showSettings && (
        <Settings
          provider={provider}
          apiKey={apiKey}
          model={model}
          databaseSettings={databaseSettings}
          onProviderChange={handleProviderChange}
          onApiKeyChange={handleApiKeyChange}
          onModelChange={handleModelChange}
          onDatabaseChange={handleDatabaseChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default App;
