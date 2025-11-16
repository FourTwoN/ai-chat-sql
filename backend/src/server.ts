import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;


app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", "http://localhost:3001"],
      },
    },
  })
);

// Enable CORS for all origins (for testing)
app.use(cors({
  origin: true, // Allow all origins
  credentials: true
}));

// Middleware
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

// Function to calculate analytics from log file
function calculateAnalytics(logFile: string): string | null {
  try {
    if (!fs.existsSync(logFile)) return null;

    const content = fs.readFileSync(logFile, 'utf-8');
    const lines = content.split('\n');
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalTokens = 0;
    let totalReasoningTokens = 0;
    let responseCount = 0;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('- response_from_ai')) {
        // Find the JSON block
        let jsonStart = -1;
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].includes('```json')) {
            jsonStart = j + 1;
            break;
          }
        }
        if (jsonStart !== -1) {
          let jsonEnd = -1;
          for (let j = jsonStart; j < lines.length; j++) {
            if (lines[j].includes('```')) {
              jsonEnd = j;
              break;
            }
          }
          if (jsonEnd !== -1) {
            const jsonStr = lines.slice(jsonStart, jsonEnd).join('\n');
            try {
              const data = JSON.parse(jsonStr);
              if (data.usage) {
                totalPromptTokens += data.usage.prompt_tokens || 0;
                totalCompletionTokens += data.usage.completion_tokens || 0;
                totalTokens += data.usage.total_tokens || 0;
                if (data.usage.completion_tokens_details?.reasoning_tokens) {
                  totalReasoningTokens += data.usage.completion_tokens_details.reasoning_tokens;
                }
                responseCount++;
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    }

    if (responseCount === 0) return null;

    return `- **Total responses from AI:** ${responseCount}\n- **Total prompt tokens:** ${totalPromptTokens}\n- **Total completion tokens:** ${totalCompletionTokens}\n- **Total reasoning tokens:** ${totalReasoningTokens}\n- **Total tokens:** ${totalTokens}`;
  } catch (error) {
    console.error('Analytics calculation error:', error);
    return null;
  }
}

// Log endpoint for debugging
app.post('/api/logs', (req, res) => {
  try {
    const { conversationId, event, data } = req.body;
    const logDir = path.join(__dirname, '../../LOGS');
    const logFile = path.join(logDir, `${conversationId}.md`);

    // Ensure directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    let content = `## ${new Date().toISOString()} - ${event}\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n\n`;

    if (event === 'start') {
      content = `# Conversación ${conversationId}\n\nIniciada: ${new Date().toISOString()}\n\n` + content;
    }

    fs.appendFileSync(logFile, content);

    // If it's a response_from_ai, calculate and append analytics
    if (event === 'response_from_ai' && data.usage) {
      const analytics = calculateAnalytics(logFile);
      if (analytics) {
        // Remove previous analytics if exists
        let fileContent = fs.readFileSync(logFile, 'utf-8');
        fileContent = fileContent.replace(/\n## Analytics[\s\S]*$/, '');
        fileContent += '\n## Analytics\n\n' + analytics + '\n';
        fs.writeFileSync(logFile, fileContent);
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Log error:', error);
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
