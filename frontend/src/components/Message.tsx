import React from 'react';
import { MessageRenderer } from './MessageRenderer';
import type { Message as MessageType } from '../types';

interface MessageProps {
  message: MessageType;
}

export const Message: React.FC<MessageProps> = ({ message }) => {
  if (message.role === 'tool') {
    // Don't display tool messages to the user
    return null;
  }

  if (message.role === 'system') {
    // Don't display system messages to the user
    return null;
  }

  const isUser = message.role === 'user';

  return (
    <div
      className={`flex w-full mb-4 ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
        }`}
      >
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0">
            {isUser ? (
              <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white font-semibold">
                U
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">
                AI
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {message.content && (
              <MessageRenderer content={message.content} role={message.role} />
            )}
            {message.toolCalls && message.toolCalls.length > 0 && (
              <div className="mt-2 text-sm opacity-75">
                <div className="italic">Using tools:</div>
                <ul className="list-disc list-inside mt-1">
                  {message.toolCalls.map((tc, idx) => (
                    <li key={idx}>{tc.function.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
