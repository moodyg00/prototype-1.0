export type ToolDefinition = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type ToolCall = {
  id: string;
  name: string;
  args: Record<string, unknown>;
};

/** Provider-neutral chat message for the IDE agent tool loop. */
export type ChatMessage =
  | { role: 'user'; content: string }
  | {
      role: 'assistant';
      content: string;
      toolCalls?: ToolCall[];
    }
  | { role: 'tool'; content: string; toolCallId: string };

export type ChatResult = {
  content: string;
  reasoningContent?: string;
  toolCalls: ToolCall[];
  totalTokens: number;
};

export type ReasoningEffort = 'low' | 'medium' | 'high';
