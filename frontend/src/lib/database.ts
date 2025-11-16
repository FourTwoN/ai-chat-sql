import initSqlJs, { type Database } from 'sql.js';

let SQL: any = null;
let db: Database | null = null;

export async function initDatabase() {
  if (db) return db;

  // Initialize sql.js
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: (file) => `https://sql.js.org/dist/${file}`
    });
  }

  // Load the Chinook database
  const response = await fetch('/chinook.db');
  const buffer = await response.arrayBuffer();
  db = new SQL.Database(new Uint8Array(buffer));

  return db;
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export interface QueryResult {
  columns: string[];
  values: any[][];
}

export function executeQuery(query: string, params: any[] = []): QueryResult {
  const database = getDatabase();

  // Security: Only allow SELECT queries
  const trimmedQuery = query.trim().toUpperCase();
  if (!trimmedQuery.startsWith('SELECT') && !trimmedQuery.startsWith('PRAGMA')) {
    throw new Error('Only SELECT and PRAGMA queries are allowed');
  }

  const results = database.exec(query, params);

  if (results.length === 0) {
    return { columns: [], values: [] };
  }

  return {
    columns: results[0].columns,
    values: results[0].values
  };
}

export function getSchema(): string {
  const query = `
    SELECT
      m.name as table_name,
      sql as schema_sql
    FROM sqlite_master m
    WHERE m.type = 'table'
      AND m.name NOT LIKE 'sqlite_%'
    ORDER BY m.name;
  `;

  const result = executeQuery(query);

  return result.values
    .map(row => `-- Table: ${row[0]}\n${row[1]}`)
    .join('\n\n');
}

export function getTableInfo(tableName: string): string {
  const query = `PRAGMA table_info('${tableName}');`;
  const result = executeQuery(query);

  let info = `Table: ${tableName}\nColumns:\n`;
  result.values.forEach(row => {
    info += `  - ${row[1]} (${row[2]})${row[3] ? ' NOT NULL' : ''}${row[5] ? ' PRIMARY KEY' : ''}\n`;
  });

  return info;
}

export function previewTable(tableName: string, limit: number = 3): QueryResult {
  const query = `SELECT * FROM ${tableName} LIMIT ${limit};`;
  return executeQuery(query);
}
