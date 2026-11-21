// Sandbox: the real pipeline with a fake Instagram connection, signed simulated webhooks and a fake sender. Nothing reaches Meta.
import { randomBytes } from 'node:crypto';
import { ruleAgent, type SetterAgent } from './agent.ts';
import { seal } from './crypto.ts';
import { createSetter, defaultConfig } from './pipeline.ts';
import { createFakeSender } from './sender.ts';
import { createMemorySetterStore, type SetterStore } from './store.ts';
import type { AgentConfig } from './types.ts';
import { signForTest, simulatedPayload } from './webhook.ts';

export const SIM_ACCOUNT = '17841400000000001';

export function sampleConfig(workspaceId: string, now: Date): AgentConfig {
  return {
    ...defaultConfig(workspaceId, now),
    businessName: 'Calm Kitchen', idealCustomer: 'busy parents who want easy weeknight dinners', qualifyingQuestion: 'How many people are you usually cooking for?',
    offers: [{ id: 'offer-plan', name: 'Weeknight Dinner Plan', priceMinor: 1900, currency: 'AUD', description: 'A 4-week printable meal plan with shopping lists.', ctaUrl: 'https://shop.example.com/dinner-plan', ctaKind: 'checkout' }],
    knowledge: [
      { id: 'faq-format', question: 'What format is the plan in? Is it a PDF download?', answer: 'It is a PDF you download straight after paying. Print it or use it on a tablet.' },
      { id: 'faq-diet', question: 'Is it vegetarian or gluten free friendly?', answer: 'Every week has vegetarian options. It is not a gluten-free plan.' },
    ],
    refundPolicy: 'Digital downloads are not refundable once downloaded. Message us if something is wrong with your file.',
    bookingUrl: '', minConfidence: 0.6, discloseAi: false,
  };
}

export function createSandbox(opts: { workspaceId?: string; store?: SetterStore; agent?: SetterAgent; now?: () => Date; failTimes?: number } = {}) {
  const ws = opts.workspaceId ?? 'sandbox-ws';
  const store = opts.store ?? createMemorySetterStore();
  const now = opts.now ?? (() => new Date());
  const appSecret = 'sandbox-app-secret';
  const keyHex = randomBytes(32).toString('hex');
  const sender = createFakeSender({ failTimes: opts.failTimes });
  const setter = createSetter({ store, agent: opts.agent ?? ruleAgent, sender, appSecret, tokenKeyHex: keyHex, clickSecret: 'sandbox-click', now, sleep: async () => {} });
  const account = `1784140000${Math.floor(Math.random() * 1e7).toString().padStart(7, '0')}`;
  store.saveConnection({
    workspaceId: ws, igAccountId: opts.workspaceId ? account : SIM_ACCOUNT, username: 'sandbox_shop', tokenSealed: seal(Buffer.from(keyHex, 'hex'), 'SANDBOX-TOKEN'),
    tokenExpiresAt: new Date(now().getTime() + 50 * 864e5).toISOString(), scopes: ['instagram_business_basic', 'instagram_business_manage_messages'],
    status: 'active', threadOwnershipConfirmed: true, connectedAt: now().toISOString(),
  });
  if (!store.config(ws)) store.saveConfig(sampleConfig(ws, now()));
  const igAccountId = store.connectionFor(ws)!.igAccountId;
  let mid = 0;
  return {
    ws, store, setter, sender, appSecret, igAccountId,
    /** A person messages the business. Returns what the pipeline did. */
    async inbound(text: string, igsid = '900000000000001', id?: string) {
      const raw = simulatedPayload(igAccountId, [{ from: igsid, text, mid: id ?? `sim-in-${++mid}-${Date.now()}`, ts: now().getTime() }]);
      return setter.receive(raw, signForTest(raw, appSecret));
    },
    rawSigned(text: string, igsid: string, id: string) {
      const raw = simulatedPayload(igAccountId, [{ from: igsid, text, mid: id, ts: now().getTime() }]);
      return { raw, sig: signForTest(raw, appSecret) };
    },
  };
}
