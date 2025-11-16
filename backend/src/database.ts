import pg from 'pg';
const { Pool } = pg;

let pool: pg.Pool | null = null;

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface QueryResult {
  columns: string[];
  rows: any[];
  rowCount: number;
}

export async function initializeDatabase(config: DatabaseConfig) {
  if (pool) {
    await pool.end();
  }

  pool = new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  // Test connection
  const client = await pool.connect();
  await client.query('SELECT NOW()');
  client.release();

  return { success: true, message: 'Database connected successfully' };
}

export async function executeQuery(query: string, limit: number = 1000): Promise<QueryResult> {
  if (!pool) {
    throw new Error('Database not initialized. Please configure database connection first.');
  }

  // Security: Only allow SELECT queries
  const trimmedQuery = query.trim().toUpperCase();
  if (!trimmedQuery.startsWith('SELECT') &&
      !trimmedQuery.startsWith('WITH') &&
      !trimmedQuery.startsWith('EXPLAIN')) {
    throw new Error('Only SELECT, WITH, and EXPLAIN queries are allowed');
  }

  // Add LIMIT if not present and if it's a SELECT query (to prevent massive data transfer)
  let finalQuery = query;
  if (trimmedQuery.startsWith('SELECT') && !trimmedQuery.includes('LIMIT')) {
    finalQuery += ` LIMIT ${limit}`;
  }

  const result = await pool.query(finalQuery);

  const columns = result.fields.map(field => field.name);

  return {
    columns,
    rows: result.rows,
    rowCount: result.rowCount || 0
  };
}

export async function getSchema(): Promise<string> {
  if (!pool) {
    throw new Error('Database not initialized');
  }

  // Get all tables and their columns
  const query = `
    SELECT
      t.table_name,
      array_agg(
        c.column_name || ' ' || c.data_type ||
        CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END
        ORDER BY c.ordinal_position
      ) as columns
    FROM information_schema.tables t
    JOIN information_schema.columns c
      ON t.table_name = c.table_name
      AND t.table_schema = c.table_schema
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
    GROUP BY t.table_name
    ORDER BY t.table_name;
  `;

  const result = await pool.query(query);

  let schema = 'Database Schema:\n\n';
  for (const row of result.rows) {
    schema += `Table: ${row.table_name}\n`;
    schema += `Columns:\n`;
    for (const col of row.columns) {
      schema += `  - ${col}\n`;
    }
    schema += '\n';
  }

  return schema;
}

export async function getTableInfo(tableName: string): Promise<string> {
  if (!pool) {
    throw new Error('Database not initialized');
  }

  // Validate table name to prevent SQL injection
  const tableNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  if (!tableNameRegex.test(tableName)) {
    throw new Error('Invalid table name');
  }

  const query = `
    SELECT
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
    ORDER BY ordinal_position;
  `;

  const result = await pool.query(query, [tableName]);

  if (result.rows.length === 0) {
    throw new Error(`Table "${tableName}" not found`);
  }

  let info = `Table: ${tableName}\nColumns:\n`;
  for (const row of result.rows) {
    info += `  - ${row.column_name} (${row.data_type})`;
    if (row.is_nullable === 'NO') info += ' NOT NULL';
    if (row.column_default) info += ` DEFAULT ${row.column_default}`;
    info += '\n';
  }

  return info;
}

export async function previewTable(tableName: string, limit: number = 3): Promise<QueryResult> {
  if (!pool) {
    throw new Error('Database not initialized');
  }

  // Validate table name
  const tableNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  if (!tableNameRegex.test(tableName)) {
    throw new Error('Invalid table name');
  }

  const query = `SELECT * FROM ${tableName} LIMIT ${Math.min(limit, 10)}`;
  const result = await pool.query(query);

  return {
    columns: result.fields.map(field => field.name),
    rows: result.rows,
    rowCount: result.rowCount || 0
  };
}

export async function getTableStats(tableName: string): Promise<any> {
  if (!pool) {
    throw new Error('Database not initialized');
  }

  // Validate table name
  const tableNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  if (!tableNameRegex.test(tableName)) {
    throw new Error('Invalid table name');
  }

  const countQuery = `SELECT COUNT(*) as total_rows FROM ${tableName}`;
  const countResult = await pool.query(countQuery);

  return {
    table_name: tableName,
    total_rows: parseInt(countResult.rows[0].total_rows)
  };
}

export async function disconnectDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export function isConnected(): boolean {
  return pool !== null;
}
