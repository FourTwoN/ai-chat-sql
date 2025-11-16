import React, { useMemo } from 'react';
import { MessageRenderer } from './MessageRenderer';
import { DataVisualization } from './DataVisualization';
import { ExportButton } from './ExportButton';
import type { Message as MessageType } from '../types';

interface MessageProps {
  message: MessageType;
  toolResults?: Map<string, any>;
}

export const Message: React.FC<MessageProps> = ({ message, toolResults }) => {
  if (message.role === 'tool') {
    return null;
  }

  if (message.role === 'system') {
    return null;
  }

  const isUser = message.role === 'user';

  // Extract data from tool results if this is an assistant message
  const queryResults = useMemo(() => {
    if (message.role !== 'assistant' || !message.toolCalls || !toolResults) {
      return null;
    }

    // Find execute_sql_query tool calls
    for (const toolCall of message.toolCalls) {
      if (toolCall.function.name === 'execute_sql_query') {
        const result = toolResults.get(toolCall.id);
        if (result && result.columns && result.rows) {
          return {
            columns: result.columns,
            rows: result.rows,
            rowCount: result.row_count,
            query: result.query
          };
        }
      }
    }

    return null;
  }, [message, toolResults]);

  // Determine if data should be visualized
  const shouldVisualize = useMemo(() => {
    if (!queryResults) return false;

    // Visualize if:
    // - More than 2 rows
    // - Has numeric columns
    // - Not too many rows (< 100 for performance)
    const hasNumericData = queryResults.rows.some((row: any[]) =>
      row.some(cell => typeof cell === 'number')
    );

    return queryResults.rows.length > 2 &&
           queryResults.rows.length < 100 &&
           hasNumericData;
  }, [queryResults]);

  return (
    <div
      className={`flex w-full mb-4 ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`${isUser ? 'max-w-[80%]' : 'w-full max-w-[95%]'} rounded-lg ${
          isUser
            ? 'bg-blue-600 text-white px-4 py-3'
            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {isUser ? (
              <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white font-semibold text-sm">
                U
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                AI
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Main message content */}
            {message.content && (
              <div className={isUser ? '' : 'px-2 py-3'}>
                <MessageRenderer content={message.content} role={message.role} />
              </div>
            )}

            {/* Tool calls indicator */}
            {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
              <div className="mt-2 px-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex flex-wrap gap-2">
                  {message.toolCalls.map((tc, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-xs"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {tc.function.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Query Results Visualization */}
            {!isUser && queryResults && (
              <div className="mt-4">
                {/* Data visualization */}
                {shouldVisualize && (
                  <DataVisualization
                    data={queryResults.rows.map((row: any[], index) => {
                      const obj: any = { _index: index };
                      queryResults.columns.forEach((col, colIndex) => {
                        obj[col] = row[colIndex];
                      });
                      return obj;
                    })}
                    columns={queryResults.columns}
                    title="Query Results Visualization"
                  />
                )}

                {/* Data table with export */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Data Table ({queryResults.rowCount} rows)
                    </h4>
                    <ExportButton
                      data={{
                        columns: queryResults.columns,
                        rows: queryResults.rows.map((row: any[], index) => {
                          const obj: any = {};
                          queryResults.columns.forEach((col, colIndex) => {
                            obj[col] = row[colIndex];
                          });
                          return obj;
                        })
                      }}
                      filename="query_results"
                    />
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                      <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                        <tr>
                          {queryResults.columns.map((col, idx) => (
                            <th
                              key={idx}
                              className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {queryResults.rows.map((row: any[], rowIdx) => (
                          <tr
                            key={rowIdx}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            {row.map((cell, cellIdx) => (
                              <td
                                key={cellIdx}
                                className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap"
                              >
                                {cell === null ? (
                                  <span className="text-gray-400 italic">null</span>
                                ) : typeof cell === 'boolean' ? (
                                  <span className={cell ? 'text-green-600' : 'text-red-600'}>
                                    {cell.toString()}
                                  </span>
                                ) : (
                                  String(cell)
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Query info */}
                  {queryResults.query && (
                    <details className="mt-3 text-xs">
                      <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                        View SQL Query
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-gray-800 dark:text-gray-200 overflow-x-auto">
                        {queryResults.query}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
