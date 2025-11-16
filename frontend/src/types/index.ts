export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  name?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required: string[];
    };
  };
}

export interface OpenRouterMessage {
  role: string;
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'area';
  data: any[];
  config?: {
    xKey?: string;
    yKey?: string;
    dataKey?: string;
    nameKey?: string;
    title?: string;
  };
}

export interface VisualizationBlock {
  type: 'text' | 'sql' | 'table' | 'chart' | 'mermaid';
  content: string | ChartData;
  language?: string;
}
