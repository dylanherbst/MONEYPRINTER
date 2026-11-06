// Minimal Anthropic Messages API client with tool use, over fetch. Key and model come from server env only:
// ANTHROPIC_API_KEY and FRONT_OFFICE_MODEL (the exact model id; no default, so nothing runs on a guessed model).
export type TextBlock = { type: 'text'; text: string };
export type ToolUseBlock = { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> };
export type ToolResultBlock = { type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean };
export type Block = TextBlock | ToolUseBlock | ToolResultBlock;
export type LlmMessage = { role: 'user' | 'assistant'; content: string | Block[] };
export type ToolSpec = { name: string; description: string; input_schema: Record<string, unknown> };
export type LlmRequest = { system: string; messages: LlmMessage[]; tools: ToolSpec[]; maxTokens?: number };
export type LlmResponse = { content: Block[]; stopReason: string };
export type Llm = (req: LlmRequest) => Promise<LlmResponse>;

export type AnthropicConfig = { apiKey: string; model: string };
export function anthropicConfigFromEnv(env: Record<string, string | undefined> = process.env): AnthropicConfig | null {
  const apiKey = env.ANTHROPIC_API_KEY?.trim(), model = env.FRONT_OFFICE_MODEL?.trim();
  return apiKey && model ? { apiKey, model } : null;
}

export function anthropicLlm(config: AnthropicConfig, fetchImpl: typeof fetch = fetch, timeoutMs = 12_000): Llm {
  return async (req) => {
    const res = await fetchImpl('https://api.anthropic.com/v1/messages', {
      method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(timeoutMs),
      headers: { 'x-api-key': config.apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: config.model, max_tokens: req.maxTokens ?? 600, system: req.system, messages: req.messages, tools: req.tools }),
    });
    const body = await res.json().catch(() => ({})) as { content?: Block[]; stop_reason?: string };
    if (!res.ok || !Array.isArray(body.content)) throw new Error(`AI provider error (${res.status}).`);
    return { content: body.content, stopReason: body.stop_reason ?? 'end_turn' };
  };
}
