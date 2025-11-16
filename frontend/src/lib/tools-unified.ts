import type { Tool } from '../types';
import {
  executeQuery,
  getSchema,
  getTableInfo,
  previewTable,
  getTableStats,
  getDatabaseType
} from './database-unified';

export const TOOLS: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'get_database_schema',
      description: 'Get the complete database schema including all tables and their structure. This is automatically called at the start, but you can use it again if needed.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_table_info',
      description: 'Get detailed information about a specific table including column names, types, and constraints.',
      parameters: {
        type: 'object',
        properties: {
          table_name: {
            type: 'string',
            description: 'The name of the table to get information about'
          }
        },
        required: ['table_name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_table_stats',
      description: 'Get statistics about a table, including total row count. Use this to understand the size of the data before querying.',
      parameters: {
        type: 'object',
        properties: {
          table_name: {
            type: 'string',
            description: 'The name of the table to get statistics for'
          }
        },
        required: ['table_name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'preview_table',
      description: 'Preview the first few rows of a table to understand the data structure and sample values. Very useful before writing complex queries.',
      parameters: {
        type: 'object',
        properties: {
          table_name: {
            type: 'string',
            description: 'The name of the table to preview'
          },
          limit: {
            type: 'number',
            description: 'Number of rows to preview (default: 3, max: 10)',
            default: 3
          }
        },
        required: ['table_name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'execute_sql_query',
      description: 'Execute a SQL SELECT query and return the results. Only SELECT queries are allowed. IMPORTANT: For tables with many rows (>1000), always use LIMIT to avoid context overflow. The system will automatically limit to 1000 rows max.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The SQL SELECT query to execute'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of rows to return (default: 100, max: 1000). For large tables, use smaller limits.',
            default: 100
          }
        },
        required: ['query']
      }
    }
  }
];

export async function executeTool(toolName: string, args: any): Promise<any> {
  try {
    switch (toolName) {
      case 'get_database_schema':
        const schema = await getSchema();
        return { schema };

      case 'get_table_info':
        const info = await getTableInfo(args.table_name);
        return { info };

      case 'get_table_stats':
        const stats = await getTableStats(args.table_name);
        return stats;

      case 'preview_table': {
        const limit = Math.min(args.limit || 3, 10);
        const result = await previewTable(args.table_name, limit);
        return {
          table_name: args.table_name,
          columns: result.columns,
          rows: result.values,
          row_count: result.rowCount || result.values.length
        };
      }

      case 'execute_sql_query': {
        const limit = Math.min(args.limit || 100, 1000);
        let query = args.query.trim();

        // Warn if query doesn't have a LIMIT for large tables
        const dbType = getDatabaseType();

        // Add LIMIT if not present and it's a simple SELECT
        const upperQuery = query.toUpperCase();
        if (!upperQuery.includes('LIMIT') && upperQuery.startsWith('SELECT')) {
          query += ` LIMIT ${limit}`;
        }

        const result = await executeQuery(query, [], limit);

        // Check if result is too large and warn
        const resultSize = result.values.length;
        const estimatedTokens = resultSize * result.columns.length * 10; // rough estimate

        let warning = undefined;
        if (estimatedTokens > 50000) {
          warning = `⚠️ Large result set (${resultSize} rows). Consider using a smaller LIMIT to avoid context overflow.`;
        }

        return {
          columns: result.columns,
          rows: result.values,
          row_count: resultSize,
          query: query,
          warning
        };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error: any) {
    // Return detailed error information for retry mechanism
    return {
      error: true,
      error_message: error.message || 'An error occurred while executing the tool',
      error_code: error.code,
      error_detail: error.detail,
      error_hint: error.hint,
      error_position: error.position,
      tool_name: toolName,
      tool_args: args
    };
  }
}
