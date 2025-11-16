# 🚀 AI Database Chat - Complete Version

A powerful AI-powered database chat interface with support for both SQLite and PostgreSQL databases. Features interactive visualizations, data export, automatic query retry, and more!

## ✨ Features

### Core Features
- 🤖 **Natural Language Queries**: Ask questions about your database in plain English
- 📊 **Interactive Visualizations**: Automatic chart generation with Recharts (bar, line, pie, area, radar charts)
- 📤 **Data Export**: Export results to CSV, JSON, or Excel
- 🔄 **Auto Retry with Error Correction**: Automatically fixes and retries failed queries
- 🗄️ **Dual Database Support**: Works with SQLite (demo) and PostgreSQL (custom databases)
- 🎨 **Beautiful UI**: Modern, responsive interface with dark mode support
- ⚡ **Real-time Results**: Fast query execution with progress indicators

### Advanced Features
- **Automatic Schema Detection**: Schema is fetched and sent to AI upfront
- **Smart Data Limits**: Prevents context overflow with large datasets (10k+ rows)
- **Query Suggestions**: Context-aware query recommendations
- **Tool Visualization**: See which tools the AI is using
- **Backend Health Monitoring**: Real-time backend connection status

## 🏗️ Architecture

```
ai-chat-sql/
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat-unified.tsx              # Main chat component
│   │   │   ├── Message-unified.tsx           # Message display with visualizations
│   │   │   ├── Settings-unified.tsx          # Settings with DB config
│   │   │   ├── DataVisualization.tsx         # Chart components
│   │   │   ├── ExportButton.tsx              # Export functionality
│   │   │   └── MessageRenderer.tsx           # Markdown/Mermaid renderer
│   │   ├── lib/
│   │   │   ├── database-unified.ts           # Unified DB interface
│   │   │   ├── tools-unified.ts              # Tool execution with retry
│   │   │   ├── openrouter-unified.ts         # AI integration
│   │   │   └── export.ts                     # Export utilities
│   │   └── App-unified.tsx                   # Main app component
│   └── package.json
└── backend/           # Express + PostgreSQL backend
    ├── src/
    │   ├── server.ts                          # Express server
    │   └── database.ts                        # PostgreSQL connection
    └── package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- OpenRouter API key ([get one here](https://openrouter.ai/keys))
- (Optional) PostgreSQL database

### 1. Install Dependencies

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies (if using PostgreSQL)
cd ../backend
npm install
```

### 2. Configure OpenRouter API Key

1. Start the frontend:
```bash
cd frontend
npm run dev
```

2. Open http://localhost:5173
3. Click on the Settings icon
4. Enter your OpenRouter API key
5. Select your preferred AI model

### 3. Choose Database Mode

#### Option A: SQLite Demo Database (Default)
- No configuration needed
- Uses the Chinook music store database
- Perfect for testing and demos

#### Option B: PostgreSQL Custom Database

**Step 1: Start PostgreSQL**

Using Docker Compose (recommended):
```bash
# From project root
docker-compose up -d
```

Or use your existing PostgreSQL instance.

**Step 2: Configure Backend**

```bash
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

**Step 3: Start Backend Server**

```bash
cd backend
npm run dev
# Backend will run on http://localhost:3001
```

**Step 4: Configure Frontend**

1. Open the app Settings
2. Go to "Database Connection" tab
3. Select "PostgreSQL"
4. Enter your database credentials:
   - Host: `localhost` (or `host.docker.internal` for Docker)
   - Port: `5432`
   - Database: Your database name
   - Username: Your username
   - Password: Your password
   - Backend URL: `http://localhost:3001`
5. Click "Save Settings"

## 📖 Usage Examples

### Example Queries

```
For SQLite (Chinook):
- "What tables are in the database?"
- "Show me the top 10 best-selling tracks"
- "Which artist has the most albums?"
- "Create a chart showing sales by country"
- "What are the total sales by genre?"

For Custom PostgreSQL:
- "What tables exist in this database?"
- "Show me the schema of the users table"
- "How many records are in the orders table?"
- "Show me the top 10 products by revenue"
- "Create a visualization of monthly sales trends"
```

### Data Export

1. Run a query
2. Click the "Export" button above the results
3. Choose format: CSV, JSON, or Excel
4. File downloads automatically

### Visualizations

The system automatically creates visualizations when:
- Data has 3+ rows
- Data contains numeric values
- Result set is < 100 rows (for performance)

Supported chart types:
- **Bar Chart**: Comparisons between categories
- **Line Chart**: Trends over time
- **Pie Chart**: Proportions (2 columns, ≤10 rows)
- **Area Chart**: Trends with emphasis on volume
- **Radar Chart**: Multi-dimensional comparisons

## 🔧 Configuration

### Frontend Configuration

Stored in `localStorage`:
- `openrouter_api_key`: Your API key
- `openrouter_model`: Selected AI model
- `database_settings`: Database configuration

### Backend Configuration

Edit `backend/.env`:
```env
PORT=3001
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=mydatabase
POSTGRES_USER=postgres
POSTGRES_PASSWORD=yourpassword
```

### Docker PostgreSQL

Edit `docker-compose.yml` to change:
- Database name
- Username/password
- Port mapping
- Add initialization scripts

## 🛡️ Security Features

- **Query Restrictions**: Only SELECT, WITH, and EXPLAIN queries allowed
- **Automatic LIMIT**: Queries are limited to 1000 rows max
- **SQL Injection Protection**: Parameterized queries for table names
- **Connection Pooling**: Efficient database connection management
- **Error Sanitization**: Detailed errors for AI, safe errors for users

## 🐛 Troubleshooting

### Backend Connection Issues

**Problem**: "Backend Server Offline"

**Solutions**:
1. Make sure backend is running: `cd backend && npm run dev`
2. Check backend URL in settings (should be `http://localhost:3001`)
3. Verify PostgreSQL is running: `docker-compose ps`
4. Check backend logs for errors

### PostgreSQL Connection Issues

**Problem**: "Failed to connect to database"

**Solutions**:
1. Verify credentials in `.env`
2. Check PostgreSQL is running: `docker-compose ps` or `pg_isready`
3. For Docker users on Mac/Windows, use `host.docker.internal` as host
4. Check firewall settings
5. Verify database exists: `psql -U postgres -l`

### Query Errors

**Problem**: "Column not found" or "Table not found"

**Solution**: The AI will automatically retry with corrections. If it fails:
1. Check the schema: "Show me the database schema"
2. Verify table/column names
3. The retry system will attempt to fix the query up to 2 times

### Large Dataset Issues

**Problem**: "Context overflow" warning

**Solutions**:
1. Use smaller LIMIT values: "Show me 10 rows from..."
2. Use aggregate functions: "Count the number of..."
3. Check table size first: "How many rows in the users table?"

## 🔄 Migration from Old Version

To migrate from the original version:

1. **Update imports** in `src/main.tsx`:
```typescript
import App from './App-unified'
```

2. **No data migration needed** - settings are preserved in localStorage

3. **Backend is optional** - you can still use SQLite without the backend

## 📊 Performance Tips

1. **Use LIMIT for large tables**: Always limit results for tables with 1000+ rows
2. **Aggregate when possible**: Use COUNT, SUM, AVG instead of fetching all rows
3. **Check table size first**: Use "How many rows..." before querying
4. **Use indexes**: Ensure your PostgreSQL database has proper indexes
5. **Close idle connections**: The backend automatically manages connection pooling

## 🎯 Roadmap

- [x] Interactive visualizations with Recharts
- [x] PostgreSQL support
- [x] Data export (CSV, JSON, Excel)
- [x] Automatic query retry
- [x] Context-aware data limits
- [ ] MCP (Model Context Protocol) integration
- [ ] Advanced query suggestions
- [ ] Query history and bookmarks
- [ ] Multi-database support
- [ ] Custom visualization templates

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes!

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai) - AI model access
- [Recharts](https://recharts.org) - Beautiful charts
- [sql.js](https://sql.js.org) - SQLite in the browser
- [Chinook Database](https://github.com/lerocha/chinook-database) - Demo dataset

## 💡 Tips & Tricks

### Best Practices

1. **Start with schema exploration**: "What tables exist?" before querying
2. **Preview before querying**: "Show me 5 sample rows from users"
3. **Use table stats**: "How many rows are in orders?" to understand data size
4. **Aggregate large datasets**: Use COUNT, SUM, AVG for 10k+ row tables
5. **Export for analysis**: Download results for further analysis in Excel/Python

### Advanced Queries

```sql
-- Complex aggregations
"Show me monthly revenue with year-over-year comparison"

-- Multiple joins
"Show me customers with their total orders and average order value"

-- Window functions (PostgreSQL)
"Show me running total of sales by date"

-- CTEs (Common Table Expressions)
"Create a query using WITH to find top customers by region"
```

### Visualization Tips

- For time series: Ensure date column is properly formatted
- For comparisons: Limit to 10-15 categories for readability
- For proportions: Use pie charts only with 2-10 categories
- For trends: Line/area charts work best with 10+ data points

## 🆘 Support

For issues or questions:
1. Check this README
2. Review error messages carefully
3. Check browser console for detailed errors
4. Verify database connection and credentials
5. Test with SQLite first, then move to PostgreSQL

---

Made with ❤️ using React, TypeScript, PostgreSQL, and AI
