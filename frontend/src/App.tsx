import { useState, useEffect } from 'react';
import { Chat } from './components/Chat';
import { Settings } from './components/Settings';

const STORAGE_KEY_API_KEY = 'openrouter_api_key';
const STORAGE_KEY_MODEL = 'openrouter_model';
const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet';

function App() {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [showSettings, setShowSettings] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem(STORAGE_KEY_API_KEY);
    const savedModel = localStorage.getItem(STORAGE_KEY_MODEL);

    if (savedApiKey) {
      setApiKey(savedApiKey);
      setIsConfigured(true);
    } else {
      setShowSettings(true);
    }

    if (savedModel) {
      setModel(savedModel);
    }
  }, []);

  const handleApiKeyChange = (newApiKey: string) => {
    setApiKey(newApiKey);
    localStorage.setItem(STORAGE_KEY_API_KEY, newApiKey);
    setIsConfigured(true);
  };

  const handleModelChange = (newModel: string) => {
    setModel(newModel);
    localStorage.setItem(STORAGE_KEY_MODEL, newModel);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                AI Database Chat
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ask questions about your data in natural language
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isConfigured && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {model.split('/').pop()}
                </span>
              </div>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
            <Chat apiKey={apiKey} model={model} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to AI Database Chat
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Please configure your OpenRouter API key to get started
              </p>
              <button
                onClick={() => setShowSettings(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Open Settings
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div>
            Powered by{' '}
            <a
              href="https://openrouter.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              OpenRouter
            </a>{' '}
            • Database: Chinook (Music Store)
          </div>
          <div>
            Supports Markdown, LaTeX, Mermaid diagrams, and interactive charts
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      {showSettings && (
        <Settings
          apiKey={apiKey}
          model={model}
          onApiKeyChange={handleApiKeyChange}
          onModelChange={handleModelChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default App;
