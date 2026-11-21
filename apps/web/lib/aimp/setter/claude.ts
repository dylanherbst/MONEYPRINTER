// Real AI agent for the setter: Claude via the Anthropic Messages API. The model only PROPOSES a structured decision; validateDecision
// and the policy gate decide what (if anything) is sent. Injected fetch, so tests never call the network. Needs ANTHROPIC_API_KEY.
import { buildPrompt, type AgentInput, type SetterAgent } from './agent.ts';
import type { FetchLike } from './sender.ts';

export const DEFAULT_SETTER_MODEL = 'claude-haiku-5-5';

type Msg = { role: 'user' | 'assistant'; content: string };

/** Conversation as alternating user/assistant turns, starting and ending with the person (merges back-to-back turns). */
export function toMessages(i: AgentInput): Msg[] {
  const turns: Msg[] = [...i.history.slice(-20).map((m) => ({ role: m.direction === 'in' ? 'user' as const : 'assistant' as const, content: m.text })), { role: 'user', content: i.latest }];
  const out: Msg[] = [];
  for (const t of turns) {
    if (!t.content.trim()) continue;
    const last = out[out.length - 1];
    if (last && last.role === t.role) last.content += `\n${t.content}`;
    else out.push({ ...t });
  }
  while (out[0]?.role === 'assistant') out.shift();
  return out;
}

export function claudeAgent(deps: { apiKey: string; fetch: FetchLike; model?: string; maxTokens?: number }): SetterAgent {
  const model = deps.model && /^[a-z0-9.-]{3,80}$/.test(deps.model) ? deps.model : DEFAULT_SETTER_MODEL;
  return {
    name: model,
    async decide(i) {
      const { system } = buildPrompt(i);
      const res = await deps.fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': deps.apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model, max_tokens: deps.maxTokens ?? 2000, system, messages: toMessages(i) }),
      });
      const j = (await res.json().catch(() => ({}))) as { content?: { type?: string; text?: string }[]; error?: { message?: string } };
      if (res.status < 200 || res.status >= 300) throw new Error(`model_http_${res.status}`);
      const text = (j.content ?? []).filter((c) => c.type === 'text' && typeof c.text === 'string').map((c) => c.text).join('\n').trim();
      if (!text) throw new Error('model_empty');
      return text;
    },
  };
}
