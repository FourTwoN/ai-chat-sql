import type { Message, OpenRouterMessage, Tool } from '../types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
}

export async function sendChatRequest(
  messages: Message[],
  tools: Tool[],
  config: OpenRouterConfig,
  conversationId?: string,
  backendUrl?: string
): Promise<any> {
  if (!config.apiKey) {
    throw new Error('OpenRouter API key is required');
  }

  const openRouterMessages: OpenRouterMessage[] = messages.map(msg => {
    const formatted: OpenRouterMessage = {
      role: msg.role,
      content: msg.content || ''
    };

    if (msg.toolCalls) {
      formatted.tool_calls = msg.toolCalls.map(tc => ({
        id: tc.id,
        type: tc.type,
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments
        }
      }));
    }

    if (msg.toolCallId) {
      formatted.tool_call_id = msg.toolCallId;
      formatted.name = msg.name;
    }

    return formatted;
  });

  const requestBody = {
    model: config.model,
    messages: openRouterMessages,
    tools: tools,
    tool_choice: 'auto',
    temperature: 0.1,
  };

  // Log request
  if (conversationId && backendUrl) {
    await fetch(`${backendUrl}/api/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId,
        event: 'request_to_ai',
        data: { requestBody, messages: openRouterMessages, tools }
      })
    }).catch(err => console.error('Log error:', err));
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'AI Database Chat'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message ||
      `OpenRouter API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  // Log response
  if (conversationId && backendUrl) {
    await fetch(`${backendUrl}/api/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId,
        event: 'response_from_ai',
        data
      })
    }).catch(err => console.error('Log error:', err));
  }

  return data;
}

export async function getAvailableModels(apiKey: string): Promise<any[]> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching models:', error);
    return [];
  }
}

export function createSystemPromptWithSchema(schema: string, dbType: 'sqlite' | 'postgresql'): string {
  return `You are an expert data analyst assistant with access to a ${dbType === 'postgresql' ? 'PostgreSQL' : 'SQLite'} database.

CRITICAL INSTRUCTIONS FOR QUERY RETRIES:
- If a query fails with an error, you MUST analyze the error message and correct the query
- Common errors to watch for:
  * Syntax errors: Check SQL syntax for ${dbType === 'postgresql' ? 'PostgreSQL' : 'SQLite'}
  * Column not found: Verify column names from the schema
  * Table not found: Check table names from the schema
  * Type mismatches: Ensure correct data types
- When you receive an error, create a corrected version of the query and try again
- You can retry up to 2 times before asking the user for clarification

DATABASE SCHEMA:
${schema}

IMPORTANT - CONTEXT MANAGEMENT:
- The database may contain thousands of rows
- ALWAYS use LIMIT clause when querying large tables
- For exploratory queries, start with LIMIT 10 or LIMIT 100
- Use get_table_stats to check table size before querying
- If a result warning indicates context overflow, reduce the LIMIT

DATA FORMAT OPTIMIZATION:
- Query results are provided in TOON format (Token-Oriented Object Notation) for maximum token efficiency
- TOON uses tabular format for uniform data: field headers followed by comma-separated values
- Example: users[3]{id,name,role}: 1,Alice,admin  2,Bob,user  3,Charlie,moderator
- Parse TOON data by reading the header format: arrayName[length]{fields} followed by data rows

YOUR ROLE:
1. Understand the database schema (already provided above)
2. Preview table data when needed to understand structure and values
3. Write efficient SQL queries to answer user questions
4. Present results in a clear, insightful way with visualizations when appropriate
5. If a query fails, analyze the error and retry with corrections

VISUALIZATION CAPABILITIES:
When presenting data that would benefit from visualization, use these formats in your response:

**For Charts**, describe the visualization and I will render it automatically:
- For trend data: "Here's a line chart showing sales over time"
- For comparisons: "Here's a bar chart comparing revenue by category"
- For proportions: "Here's a pie chart showing market share"
- For distributions: "Here's an area chart showing the distribution"

The system will automatically detect suitable data and render interactive charts.

**For Tables**: Use markdown tables:
\`\`\`
| Column1 | Column2 | Column3 |
|---------|---------|---------|
| Value1  | Value2  | Value3  |
\`\`\`

**For Diagrams**: Use Mermaid syntax for relationships, flows, ERDs:
\`\`\`mermaid
graph LR
    A[Start] --> B[Process]
    B --> C[End]
\`\`\`

QUERY BEST PRACTICES:
- Always start with smaller LIMIT values for exploration
- Use aggregate functions (COUNT, SUM, AVG) to summarize large datasets
- Combine multiple related queries into a single query when possible
- Use meaningful column aliases for clarity
- For ${dbType === 'postgresql' ? 'PostgreSQL' : 'SQLite'}, follow the appropriate SQL syntax

Be conversational, helpful, and proactive in suggesting insights from the data!`;
}

export const SYSTEM_PROMPT_SQLITE = createSystemPromptWithSchema('', 'sqlite');
export const SYSTEM_PROMPT_POSTGRES = createSystemPromptWithSchema('', 'postgresql');
