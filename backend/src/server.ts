import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  initializeDatabase,
  executeQuery,
  getSchema,
  getTableInfo,
  previewTable,
  getTableStats,
  disconnectDatabase,
  isConnected,
  type DatabaseConfig
} from './database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    connected: isConnected(),
    timestamp: new Date().toISOString()
  });
});

// Initialize database connection
app.post('/api/db/connect', async (req, res) => {
  try {
    const config: DatabaseConfig = req.body;

    if (!config.host || !config.database || !config.user) {
      return res.status(400).json({
        error: 'Missing required fields: host, database, user'
      });
    }

    const result = await initializeDatabase(config);
    res.json(result);
  } catch (error: any) {
    console.error('Database connection error:', error);
    res.status(500).json({
      error: error.message || 'Failed to connect to database'
    });
  }
});

// Get database schema
app.get('/api/db/schema', async (req, res) => {
  try {
    if (!isConnected()) {
      return res.status(400).json({ error: 'Database not connected' });
    }

    const schema = await getSchema();
    res.json({ schema });
  } catch (error: any) {
    console.error('Error getting schema:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get table info
app.get('/api/db/table/:tableName', async (req, res) => {
  try {
    if (!isConnected()) {
      return res.status(400).json({ error: 'Database not connected' });
    }

    const { tableName } = req.params;
    const info = await getTableInfo(tableName);
    res.json({ info });
  } catch (error: any) {
    console.error('Error getting table info:', error);
    res.status(500).json({ error: error.message });
  }
});

// Preview table
app.post('/api/db/preview', async (req, res) => {
  try {
    if (!isConnected()) {
      return res.status(400).json({ error: 'Database not connected' });
    }

    const { tableName, limit } = req.body;
    const result = await previewTable(tableName, limit);
    res.json(result);
  } catch (error: any) {
    console.error('Error previewing table:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get table statistics
app.get('/api/db/table/:tableName/stats', async (req, res) => {
  try {
    if (!isConnected()) {
      return res.status(400).json({ error: 'Database not connected' });
    }

    const { tableName } = req.params;
    const stats = await getTableStats(tableName);
    res.json(stats);
  } catch (error: any) {
    console.error('Error getting table stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Execute query with retry mechanism
app.post('/api/db/query', async (req, res) => {
  try {
    if (!isConnected()) {
      return res.status(400).json({ error: 'Database not connected' });
    }

    const { query, limit } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const result = await executeQuery(query, limit || 1000);
    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('Query execution error:', error);

    // Return detailed error for AI to retry
    res.status(400).json({
      success: false,
      error: error.message,
      errorCode: error.code,
      errorDetail: error.detail,
      errorHint: error.hint,
      position: error.position
    });
  }
});

// Disconnect database
app.post('/api/db/disconnect', async (req, res) => {
  try {
    await disconnectDatabase();
    res.json({ success: true, message: 'Database disconnected' });
  } catch (error: any) {
    console.error('Error disconnecting:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Database API available at http://localhost:${PORT}/api/db/`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});
