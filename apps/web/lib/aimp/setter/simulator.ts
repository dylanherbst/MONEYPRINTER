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

/** Mock business for the test lab: a typical dropshipping store selling one hero product. Every fact here is sample data. */
export function sampleConfig(workspaceId: string, now: Date): AgentConfig {
  return {
    ...defaultConfig(workspaceId, now),
    businessName: 'Glow Haven', idealCustomer: 'people who want a cosy, aesthetic bedroom or a gift for someone who does',
    brandVoice: 'warm, casual, short, like a friend texting', qualifyingQuestion: 'Is it for your own room or a gift?',
    offers: [
      { id: 'offer-lamp', name: 'Sunset Lamp', priceMinor: 3900, currency: 'AUD', description: 'A projector lamp that casts a warm sunset glow on your wall, with 4 colour modes and a USB cable.', ctaUrl: 'https://glowhaven.example.com/sunset-lamp', ctaKind: 'checkout' },
      { id: 'offer-bundle', name: 'Sunset Lamp 2-pack', priceMinor: 6900, currency: 'AUD', description: 'Two Sunset Lamps, handy for gifting.', ctaUrl: 'https://glowhaven.example.com/sunset-lamp-2-pack', ctaKind: 'checkout' },
    ],
    knowledge: [
      { id: 'faq-shipping', question: 'How long does shipping take? When will it arrive? Delivery time?', answer: 'Orders ship within 1 to 2 business days and usually arrive in 7 to 12 business days. You get a tracking link by email once it ships.' },
      { id: 'faq-free-shipping', question: 'Is shipping free? Shipping cost?', answer: 'Shipping is free anywhere in Australia.' },
      { id: 'faq-returns', question: 'Can I return it? Returns policy? Refund if I do not like it?', answer: 'Yep, you have 30 days from delivery to return it unused for a full refund. Just message us and we will sort it.' },
      { id: 'faq-power', question: 'How is it powered? Does it need batteries? USB plug?', answer: 'It runs off USB, so any phone charger or laptop port works. No batteries needed.' },
      { id: 'faq-colours', question: 'What colours or modes does it have?', answer: 'It has 4 modes: sunset, sunset red, rainbow and sun. You can rotate the head to move the glow around.' },
    ],
    refundPolicy: '30-day returns on unused items, full refund. Damaged on arrival: we replace it free.',
    prohibitedClaims: ['improves sleep', 'cures', 'medical', 'only a few left'],
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
