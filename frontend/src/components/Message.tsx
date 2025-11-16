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
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`${isUser ? 'max-w-2xl' : 'max-w-4xl w-full'}`}>
        {/* User Message */}
        {isUser ? (
          <div className="bg-blue-600 text-white rounded-2xl px-5 py-3 shadow-md">
            <div className="prose prose-invert max-w-none">
              <MessageRenderer content={message.content} role={message.role} />
            </div>
          </div>
        ) : (
          /* AI Message */
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
            {/* Message Content */}
            {message.content && (
              <div className="px-6 py-4">
                <div className="prose dark:prose-invert max-w-none">
                  <MessageRenderer content={message.content} role={message.role} />
                </div>
              </div>
            )}

            {/* Tool calls indicator */}
            {message.toolCalls && message.toolCalls.length > 0 && (
              <div className="px-6 pb-2 flex flex-wrap gap-2">
                {message.toolCalls.map((tc, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {tc.function.name.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}

            {/* Query Results */}
            {queryResults && (
              <div className="px-6 pb-6">
                {/* Visualization */}
                {shouldVisualize && (
                  <div className="mb-4">
                    <DataVisualization
                      data={queryResults.rows.map((row: any[], index) => {
                        const obj: any = { _index: index };
                        queryResults.columns.forEach((col, colIndex) => {
                          obj[col] = row[colIndex];
                        });
                        return obj;
                      })}
                      columns={queryResults.columns}
                      title="Query Results"
                    />
                  </div>
                )}

                {/* Data Table */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {queryResults.rowCount} {queryResults.rowCount === 1 ? 'row' : 'rows'}
                    </div>
                    <ExportButton
                      data={{
                        columns: queryResults.columns,
                        rows: queryResults.rows.map((row: any[]) => {
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

                  <div className="overflow-x-auto max-h-96">
                    <table className="min-w-full">
                      <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                        <tr>
                          {queryResults.columns.map((col, idx) => (
                            <th
                              key={idx}
                              className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b-2 border-gray-200 dark:border-gray-700"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800">
                        {queryResults.rows.map((row: any[], rowIdx) => (
                          <tr
                            key={rowIdx}
                            className="border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            {row.map((cell, cellIdx) => (
                              <td
                                key={cellIdx}
                                className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100"
                              >
                                {cell === null ? (
                                  <span className="text-gray-400 italic text-xs">null</span>
                                ) : typeof cell === 'boolean' ? (
                                  <span className={`font-medium ${cell ? 'text-green-600' : 'text-red-600'}`}>
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
                    <details className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                      <summary className="cursor-pointer text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        View SQL Query
                      </summary>
                      <pre className="mt-3 p-3 bg-gray-800 dark:bg-gray-950 rounded-lg text-green-400 text-xs overflow-x-auto font-mono">
                        {queryResults.query}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
