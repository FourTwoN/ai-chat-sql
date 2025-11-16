import React, { useState } from 'react';

interface SettingsProps {
  apiKey: string;
  model: string;
  onApiKeyChange: (apiKey: string) => void;
  onModelChange: (model: string) => void;
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  apiKey,
  model,
  onApiKeyChange,
  onModelChange,
  onClose
}) => {
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localModel, setLocalModel] = useState(model);
  const [showApiKey, setShowApiKey] = useState(false);

  // Popular models for quick selection
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
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

              {/* Custom model input */}
              <input
                type="text"
                value={localModel}
                onChange={(e) => setLocalModel(e.target.value)}
                placeholder="anthropic/claude-3.5-sonnet"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white mb-3"
              />

              {/* Popular models */}
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

            {/* Save button */}
            <div className="flex gap-3 pt-4">
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
    </div>
  );
};
