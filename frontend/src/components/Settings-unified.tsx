import React, { useState } from 'react';
import type { PostgresConfig } from '../lib/database-unified';

export interface DatabaseSettings {
  type: 'sqlite' | 'postgresql';
  postgresConfig?: PostgresConfig;
  backendUrl?: string;
}

interface SettingsProps {
  apiKey: string;
  model: string;
  databaseSettings: DatabaseSettings;
  onApiKeyChange: (apiKey: string) => void;
  onModelChange: (model: string) => void;
  onDatabaseChange: (settings: DatabaseSettings) => void;
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  apiKey,
  model,
  databaseSettings,
  onApiKeyChange,
  onModelChange,
  onDatabaseChange,
  onClose
}) => {
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localModel, setLocalModel] = useState(model);
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'database'>('ai');

  // Database settings
  const [dbType, setDbType] = useState<'sqlite' | 'postgresql'>(databaseSettings.type);
  const [pgHost, setPgHost] = useState(databaseSettings.postgresConfig?.host || 'localhost');
  const [pgPort, setPgPort] = useState(databaseSettings.postgresConfig?.port || 5432);
  const [pgDatabase, setPgDatabase] = useState(databaseSettings.postgresConfig?.database || '');
  const [pgUser, setPgUser] = useState(databaseSettings.postgresConfig?.user || '');
  const [pgPassword, setPgPassword] = useState(databaseSettings.postgresConfig?.password || '');
  const [showPgPassword, setShowPgPassword] = useState(false);
  const [backendUrl, setBackendUrl] = useState(databaseSettings.backendUrl || 'http://localhost:3001');

  const popularModels = [
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
    { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus' },
    { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'openai/gpt-4o', name: 'GPT-4o' },
    { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5' },
    { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B' },
  ];

  const handleSave = () => {
    onApiKeyChange(localApiKey);
    onModelChange(localModel);

    const dbSettings: DatabaseSettings = {
      type: dbType,
      backendUrl: dbType === 'postgresql' ? backendUrl : undefined,
      postgresConfig: dbType === 'postgresql' ? {
        host: pgHost,
        port: pgPort,
        database: pgDatabase,
        user: pgUser,
        password: pgPassword
      } : undefined
    };

    onDatabaseChange(dbSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'ai'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              🤖 AI Configuration
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'database'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              🗄️ Database Connection
            </button>
          </div>

          {/* AI Configuration Tab */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  OpenRouter API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={localApiKey}
                    onChange={(e) => setLocalApiKey(e.target.value)}
                    placeholder="sk-or-..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showApiKey ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Get your API key from{' '}
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    openrouter.ai/keys
                  </a>
                </p>
              </div>

              {/* Model Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Model
                </label>
                <input
                  type="text"
                  value={localModel}
                  onChange={(e) => setLocalModel(e.target.value)}
                  placeholder="anthropic/claude-3.5-sonnet"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white mb-3"
                />

                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Popular models:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {popularModels.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setLocalModel(m.id)}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          localModel === m.id
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  See all available models at{' '}
                  <a
                    href="https://openrouter.ai/models"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    openrouter.ai/models
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* Database Configuration Tab */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              {/* Database Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Database Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setDbType('sqlite')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      dbType === 'sqlite'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-semibold text-gray-900 dark:text-white mb-1">SQLite (Demo)</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Chinook music store database
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setDbType('postgresql')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      dbType === 'postgresql'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-semibold text-gray-900 dark:text-white mb-1">PostgreSQL</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Connect to your own database
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* PostgreSQL Configuration */}
              {dbType === 'postgresql' && (
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    💡 <strong>Tip:</strong> Make sure the backend server is running on port 3001
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Backend URL
                    </label>
                    <input
                      type="text"
                      value={backendUrl}
                      onChange={(e) => setBackendUrl(e.target.value)}
                      placeholder="http://localhost:3001"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Host
                      </label>
                      <input
                        type="text"
                        value={pgHost}
                        onChange={(e) => setPgHost(e.target.value)}
                        placeholder="localhost"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Port
                      </label>
                      <input
                        type="number"
                        value={pgPort}
                        onChange={(e) => setPgPort(parseInt(e.target.value))}
                        placeholder="5432"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Database Name
                    </label>
                    <input
                      type="text"
                      value={pgDatabase}
                      onChange={(e) => setPgDatabase(e.target.value)}
                      placeholder="my_database"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={pgUser}
                      onChange={(e) => setPgUser(e.target.value)}
                      placeholder="postgres"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPgPassword ? 'text' : 'password'}
                        value={pgPassword}
                        onChange={(e) => setPgPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPgPassword(!showPgPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPgPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-300">
                    <strong>Docker users:</strong> Use <code className="px-1 bg-white dark:bg-gray-800 rounded">host.docker.internal</code> as the host if your PostgreSQL is running on the same machine.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Save button */}
          <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSave}
              disabled={!localApiKey || !localModel}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save Settings
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
