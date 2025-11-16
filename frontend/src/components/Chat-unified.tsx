import React, { useState, useRef, useEffect } from 'react';
import { Message as MessageComponent } from './Message-unified';
import type { Message } from '../types';
import { sendChatRequest, createSystemPromptWithSchema } from '../lib/openrouter-unified';
import { TOOLS, executeTool } from '../lib/tools-unified';
import {
  initSQLiteDatabase,
  initPostgresDatabase,
  getSchema,
  getDatabaseType,
  isPostgresConnected,
  setBackendUrl,
  type PostgresConfig
} from '../lib/database-unified';

interface ChatProps {
  apiKey: string;
  model: string;
  databaseType: 'sqlite' | 'postgresql';
  postgresConfig?: PostgresConfig;
  backendUrl?: string;
}

export const Chat: React.FC<ChatProps> = ({
  apiKey,
  model,
  databaseType,
  postgresConfig,
  backendUrl
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbSchema, setDbSchema] = useState<string>('');
  const [toolResults, setToolResults] = useState<Map<string, any>>(new Map());
  const [querySuggestions] = useState<string[]>([
    "What tables are in the database?",
    "Show me a summary of the data",
    "What are the most common values?",
    "Create a chart showing the distribution",
    "Show me statistics for this data"
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initialize database on mount or when config changes
  useEffect(() => {
    const initDb = async () => {
      try {
        setDbInitialized(false);
        setError(null);

        if (databaseType === 'postgresql') {
          if (!postgresConfig) {
            setError('PostgreSQL configuration is required');
            return;
          }

          if (backendUrl) {
            setBackendUrl(backendUrl);
          }

          await initPostgresDatabase(postgresConfig);
        } else {
          await initSQLiteDatabase();
        }

        // Get schema immediately after initialization
        const schema = await getSchema();
        setDbSchema(schema);

        // Initialize messages with system prompt that includes schema
        const systemPrompt = createSystemPromptWithSchema(schema, databaseType);
        setMessages([{
          role: 'system',
          content: systemPrompt
        }]);

        setDbInitialized(true);
        console.log(`${databaseType} database initialized successfully`);
      } catch (error: any) {
        console.error('Failed to initialize database:', error);
        setError(error.message || 'Failed to initialize database');
      }
    };

    initDb();
  }, [databaseType, postgresConfig, backendUrl]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !dbInitialized) return;

    await sendMessage(input.trim());
    setInput('');
  };

  const sendMessage = async (messageText: string) => {
    const userMessage: Message = {
      role: 'user',
      content: messageText
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      await processConversation([...messages, userMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const processConversation = async (currentMessages: Message[]) => {
    let conversationMessages = [...currentMessages];
    let continueLoop = true;
    let iterationCount = 0;
    const MAX_ITERATIONS = 15;
    const newToolResults = new Map(toolResults);

    while (continueLoop && iterationCount < MAX_ITERATIONS) {
      iterationCount++;

      // Call OpenRouter API
      const response = await sendChatRequest(
        conversationMessages,
        TOOLS,
        { apiKey, model }
      );

      const assistantMessage = response.choices[0]?.message;
      if (!assistantMessage) {
        throw new Error('No response from AI');
      }

      const newMessage: Message = {
        role: 'assistant',
        content: assistantMessage.content || '',
        toolCalls: assistantMessage.tool_calls?.map((tc: any) => ({
          id: tc.id,
          type: tc.type,
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments
          }
        }))
      };

      conversationMessages.push(newMessage);
      setMessages([...conversationMessages]);

      // Check if the assistant wants to use tools
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        let hasErrors = false;
        const errorToolCalls: any[] = [];

        for (const toolCall of assistantMessage.tool_calls) {
          const toolName = toolCall.function.name;
          let args;

          try {
            args = JSON.parse(toolCall.function.arguments);
          } catch (error) {
            args = {};
          }

          console.log(`Executing tool: ${toolName}`, args);

          // Execute the tool
          const toolResult = await executeTool(toolName, args);

          // Store tool result for visualization
          newToolResults.set(toolCall.id, toolResult);

          // Check if tool returned an error
          if (toolResult.error) {
            hasErrors = true;
            errorToolCalls.push({
              toolCall,
              result: toolResult
            });
          }

          // Create tool result message
          const toolMessage: Message = {
            role: 'tool',
            content: JSON.stringify(toolResult, null, 2),
            toolCallId: toolCall.id,
            name: toolName
          };

          conversationMessages.push(toolMessage);
        }

        // Update tool results state
        setToolResults(new Map(newToolResults));

        // If there were errors in query execution, add a helpful message
        if (hasErrors && errorToolCalls.length > 0) {
          const errorSummary = errorToolCalls.map(({ toolCall, result }) => {
            const args = JSON.parse(toolCall.function.arguments);
            return `
Tool: ${toolCall.function.name}
Query: ${args.query || 'N/A'}
Error: ${result.error_message}
${result.error_hint ? `Hint: ${result.error_hint}` : ''}
${result.error_detail ? `Detail: ${result.error_detail}` : ''}
`.trim();
          }).join('\n\n');

          const retryMessage: Message = {
            role: 'user',
            content: `The previous query had errors. Please analyze the errors below and create a corrected query:\n\n${errorSummary}\n\nPlease fix the query and try again. Consider the database schema and error details.`
          };

          conversationMessages.push(retryMessage);
        }

        // Update messages and continue loop
        setMessages([...conversationMessages]);
      } else {
        continueLoop = false;
      }

      // Safety check for finish reason
      if (response.choices[0]?.finish_reason === 'stop') {
        continueLoop = false;
      }
    }

    if (iterationCount >= MAX_ITERATIONS) {
      console.warn('Maximum iteration count reached');
      setError('Maximum conversation iterations reached. The query might be too complex.');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {!dbInitialized && !error && (
          <div className="text-center text-gray-500 py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <div>Connecting to {databaseType === 'postgresql' ? 'PostgreSQL' : 'SQLite'} database...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <strong className="font-semibold">Error:</strong>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {dbInitialized && messages.filter(m => m.role !== 'system').length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="max-w-3xl mx-auto">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Welcome to AI Database Chat!
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Connected to {databaseType === 'postgresql' ? 'your PostgreSQL database' : 'Chinook demo database'}
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-blue-200 dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">
                  💡 Try these questions:
                </p>
                <div className="grid gap-3">
                  {querySuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(suggestion)}
                      className="text-left px-4 py-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 group"
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-blue-600 group-hover:text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Interactive Charts</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Data Export</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Auto Retry</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {messages
          .filter(m => m.role !== 'system')
          .map((message, index) => (
            <MessageComponent
              key={index}
              message={message}
              toolResults={toolResults}
            />
          ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 rounded-lg px-6 py-4 border border-gray-200 dark:border-gray-700 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-semibold shadow-lg">
                  AI
                </div>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={dbInitialized ? "Ask about your database..." : "Loading database..."}
            disabled={isLoading || !dbInitialized}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
          <button
            type="submit"
            disabled={isLoading || !dbInitialized || !input.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Thinking...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Send</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
