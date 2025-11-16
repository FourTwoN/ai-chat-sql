import initSqlJs, { type Database } from 'sql.js';

export interface QueryResult {
  columns: string[];
  values: any[][];
  rowCount?: number;
}

export type DatabaseType = 'sqlite' | 'postgresql';

export interface PostgresConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

interface DatabaseState {
  type: DatabaseType;
  sqliteDb?: Database;
  postgresConnected?: boolean;
  backendUrl: string;
}

const state: DatabaseState = {
  type: 'sqlite',
  backendUrl: 'http://localhost:3001'
};

// SQLite functions
export async function initSQLiteDatabase() {
  if (state.sqliteDb) return state.sqliteDb;

  const SQL = await initSqlJs({
    locateFile: (file) => `https://sql.js.org/dist/${file}`
  });

  const response = await fetch('/chinook.db');
  const buffer = await response.arrayBuffer();
  state.sqliteDb = new SQL.Database(new Uint8Array(buffer));
  state.type = 'sqlite';

  return state.sqliteDb;
}

// PostgreSQL functions
export async function initPostgresDatabase(config: PostgresConfig) {
  const response = await fetch(`${state.backendUrl}/api/db/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to connect to database');
  }

  state.postgresConnected = true;
  state.type = 'postgresql';

  return await response.json();
}

export async function disconnectPostgres() {
  if (!state.postgresConnected) return;

  await fetch(`${state.backendUrl}/api/db/disconnect`, {
    method: 'POST'
  });

  state.postgresConnected = false;
}

// Unified database functions
export function getDatabaseType(): DatabaseType {
  return state.type;
}

export function isPostgresConnected(): boolean {
  return state.postgresConnected || false;
}

export async function executeQuery(query: string, params: any[] = [], limit?: number): Promise<QueryResult> {
  if (state.type === 'postgresql' && state.postgresConnected) {
    return executePostgresQuery(query, limit);
  } else if (state.type === 'sqlite' && state.sqliteDb) {
    return executeSQLiteQuery(query, params);
  } else {
    throw new Error('Database not initialized');
  }
}

async function executePostgresQuery(query: string, limit?: number): Promise<QueryResult> {
  const response = await fetch(`${state.backendUrl}/api/db/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit })
  });

  const data = await response.json();

  if (!data.success) {
    // Return detailed error for retry mechanism
    throw {
      message: data.error,
      code: data.errorCode,
      detail: data.errorDetail,
      hint: data.errorHint,
      position: data.position
    };
  }

  // Convert PostgreSQL rows to array format
  const values = data.rows.map((row: any) =>
    data.columns.map((col: string) => row[col])
  );

  return {
    columns: data.columns,
    values: values,
    rowCount: data.rowCount
  };
}

function executeSQLiteQuery(query: string, params: any[] = []): QueryResult {
  if (!state.sqliteDb) {
    throw new Error('SQLite database not initialized');
  }

  const trimmedQuery = query.trim().toUpperCase();
  if (!trimmedQuery.startsWith('SELECT') && !trimmedQuery.startsWith('PRAGMA')) {
    throw new Error('Only SELECT and PRAGMA queries are allowed');
  }

  const results = state.sqliteDb.exec(query, params);

  if (results.length === 0) {
    return { columns: [], values: [], rowCount: 0 };
  }

  return {
    columns: results[0].columns,
    values: results[0].values,
    rowCount: results[0].values.length
  };
}

export async function getSchema(): Promise<string> {
  if (state.type === 'postgresql' && state.postgresConnected) {
    const response = await fetch(`${state.backendUrl}/api/db/schema`);
    const data = await response.json();
    return data.schema;
  } else if (state.type === 'sqlite' && state.sqliteDb) {
    return getSQLiteSchema();
  } else {
    throw new Error('Database not initialized');
  }
}

function getSQLiteSchema(): string {
  if (!state.sqliteDb) {
    throw new Error('SQLite database not initialized');
  }

  const query = `
    SELECT
      m.name as table_name,
      sql as schema_sql
    FROM sqlite_master m
    WHERE m.type = 'table'
      AND m.name NOT LIKE 'sqlite_%'
    ORDER BY m.name;
  `;

  const results = state.sqliteDb.exec(query);

  if (results.length === 0) {
    return 'No tables found';
  }

  return results[0].values
    .map(row => `-- Table: ${row[0]}\n${row[1]}`)
    .join('\n\n');
}

export async function getTableInfo(tableName: string): Promise<string> {
  if (state.type === 'postgresql' && state.postgresConnected) {
    const response = await fetch(`${state.backendUrl}/api/db/table/${tableName}`);
    const data = await response.json();
    return data.info;
  } else if (state.type === 'sqlite' && state.sqliteDb) {
    return getSQLiteTableInfo(tableName);
  } else {
    throw new Error('Database not initialized');
  }
}

function getSQLiteTableInfo(tableName: string): string {
  if (!state.sqliteDb) {
    throw new Error('SQLite database not initialized');
  }

  const query = `PRAGMA table_info('${tableName}');`;
  const results = state.sqliteDb.exec(query);

  if (results.length === 0) {
    throw new Error(`Table "${tableName}" not found`);
  }

  let info = `Table: ${tableName}\nColumns:\n`;
  results[0].values.forEach(row => {
    info += `  - ${row[1]} (${row[2]})${row[3] ? ' NOT NULL' : ''}${row[5] ? ' PRIMARY KEY' : ''}\n`;
  });

  return info;
}

export async function previewTable(tableName: string, limit: number = 3): Promise<QueryResult> {
  if (state.type === 'postgresql' && state.postgresConnected) {
    const response = await fetch(`${state.backendUrl}/api/db/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableName, limit })
    });
    const data = await response.json();

    // Convert to unified format
    const values = data.rows.map((row: any) =>
      data.columns.map((col: string) => row[col])
    );

    return {
      columns: data.columns,
      values: values,
      rowCount: data.rowCount
    };
  } else if (state.type === 'sqlite' && state.sqliteDb) {
    const query = `SELECT * FROM ${tableName} LIMIT ${limit}`;
    return executeSQLiteQuery(query);
  } else {
    throw new Error('Database not initialized');
  }
}

export async function getTableStats(tableName: string): Promise<any> {
  if (state.type === 'postgresql' && state.postgresConnected) {
    const response = await fetch(`${state.backendUrl}/api/db/table/${tableName}/stats`);
    return await response.json();
  } else if (state.type === 'sqlite' && state.sqliteDb) {
    const query = `SELECT COUNT(*) as total_rows FROM ${tableName}`;
    const result = executeSQLiteQuery(query);
    return {
      table_name: tableName,
      total_rows: result.values[0][0]
    };
  } else {
    throw new Error('Database not initialized');
  }
}

export function setBackendUrl(url: string) {
  state.backendUrl = url;
}
