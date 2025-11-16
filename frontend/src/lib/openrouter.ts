import type { Message, OpenRouterMessage, Tool } from '../types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
}

export async function sendChatRequest(
  messages: Message[],
  tools: Tool[],
  config: OpenRouterConfig
): Promise<any> {
  if (!config.apiKey) {
    throw new Error('OpenRouter API key is required');
  }

  // Convert messages to OpenRouter format
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
    temperature: 0.1, // Low temperature for more deterministic SQL generation
  };

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

// System prompt for the AI assistant
export const SYSTEM_PROMPT = `You are an expert data analyst assistant with access to a SQLite database. Your role is to help users analyze their data by:

1. Understanding the database schema using available tools
2. Previewing table data to understand structure and values
3. Writing efficient SQL queries to answer user questions
4. Presenting results in a clear, insightful way with visualizations when appropriate

IMPORTANT GUIDELINES:
- ALWAYS start by using get_database_schema to understand the available tables
- Use preview_table to see sample data before writing complex queries
- Write clear, efficient SQL queries
- Only use SELECT statements (no modifications allowed)
- Present results with context and insights
- Suggest visualizations when data would benefit from charts or graphs
- Be conversational and helpful

VISUALIZATION CAPABILITIES:
You can suggest visualizations by describing them in your response. Supported formats:
- **Tables**: Markdown tables for structured data
- **Charts**: Bar charts, line charts, pie charts, area charts
- **Mermaid diagrams**: For relationships, flows, ERDs, etc.

When presenting data, think about what format would be most helpful to the user.

The database is a music store (Chinook) with information about artists, albums, tracks, customers, invoices, and employees.`;
