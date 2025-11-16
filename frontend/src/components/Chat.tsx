import React, { useState, useRef, useEffect } from 'react';
import { Message as MessageComponent } from './Message';
import type { Message } from '../types';
import { sendChatRequest, SYSTEM_PROMPT } from '../lib/openrouter';
import { TOOLS, executeTool } from '../lib/tools';
import { initDatabase } from '../lib/database';

interface ChatProps {
  apiKey: string;
  model: string;
}

export const Chat: React.FC<ChatProps> = ({ apiKey, model }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: SYSTEM_PROMPT
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbInitialized, setDbInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initialize database on mount
  useEffect(() => {
    initDatabase()
      .then(() => {
        setDbInitialized(true);
        console.log('Database initialized successfully');
      })
      .catch((error) => {
        console.error('Failed to initialize database:', error);
        setError('Failed to load database. Please refresh the page.');
      });
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !dbInitialized) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
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
    const MAX_ITERATIONS = 10; // Prevent infinite loops

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

      // Convert to our Message format
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
        // Execute each tool call
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
          const toolResult = executeTool(toolName, args);

          // Add tool result message
          const toolMessage: Message = {
            role: 'tool',
            content: JSON.stringify(toolResult, null, 2),
            toolCallId: toolCall.id,
            name: toolName
          };

          conversationMessages.push(toolMessage);
        }

        // Update messages with tool results and continue the loop
        setMessages([...conversationMessages]);
      } else {
        // No more tool calls, end the loop
        continueLoop = false;
      }

      // Safety check for finish reason
      if (response.choices[0]?.finish_reason === 'stop') {
        continueLoop = false;
      }
    }

    if (iterationCount >= MAX_ITERATIONS) {
      console.warn('Maximum iteration count reached');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {!dbInitialized && (
          <div className="text-center text-gray-500 py-8">
            Loading database...
          </div>
        )}

        {dbInitialized && messages.filter(m => m.role !== 'system').length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <h2 className="text-2xl font-bold mb-4">Welcome to AI Database Chat!</h2>
            <p className="mb-4">
              I can help you analyze the Chinook music store database using natural language.
            </p>
            <div className="text-left max-w-2xl mx-auto space-y-2">
              <p className="font-semibold">Try asking:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>"What tables are in the database?"</li>
                <li>"Show me the top 10 best-selling tracks"</li>
                <li>"Which artist has the most albums?"</li>
                <li>"What are the total sales by country?"</li>
                <li>"Create a chart showing sales by genre"</li>
              </ul>
            </div>
          </div>
        )}

        {messages
          .filter(m => m.role !== 'system')
          .map((message, index) => (
            <MessageComponent key={index} message={message} />
          ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">
                  AI
                </div>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={dbInitialized ? "Ask about the database..." : "Loading database..."}
            disabled={isLoading || !dbInitialized}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !dbInitialized || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Thinking...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};
