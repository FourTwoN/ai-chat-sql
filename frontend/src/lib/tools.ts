import type { Tool } from '../types';
import { executeQuery, getSchema, getTableInfo, previewTable } from './database';

export const TOOLS: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'get_database_schema',
      description: 'Get the complete database schema including all tables and their structure. Use this to understand the database structure before writing queries.',
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
      description: 'Execute a SQL SELECT query and return the results. Only SELECT queries are allowed. Use this after understanding the schema and previewing data.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The SQL SELECT query to execute'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of rows to return (default: 100, max: 1000)',
            default: 100
          }
        },
        required: ['query']
      }
    }
  }
];

export function executeTool(toolName: string, args: any): any {
  try {
    switch (toolName) {
      case 'get_database_schema':
        return { schema: getSchema() };

      case 'get_table_info':
        return { info: getTableInfo(args.table_name) };

      case 'preview_table': {
        const limit = Math.min(args.limit || 3, 10);
        const result = previewTable(args.table_name, limit);
        return {
          table_name: args.table_name,
          columns: result.columns,
          rows: result.values,
          row_count: result.values.length
        };
      }

      case 'execute_sql_query': {
        const limit = Math.min(args.limit || 100, 1000);
        let query = args.query.trim();

        // Add LIMIT if not present
        if (!query.toUpperCase().includes('LIMIT')) {
          query += ` LIMIT ${limit}`;
        }

        const result = executeQuery(query);
        return {
          columns: result.columns,
          rows: result.values,
          row_count: result.values.length,
          query: query
        };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error: any) {
    return {
      error: error.message || 'An error occurred while executing the tool'
    };
  }
}
