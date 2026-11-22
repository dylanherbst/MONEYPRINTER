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

/** Mock business for the test lab: a typical dropshipping store selling one hero product. Every fact about Glow Haven is SAMPLE
 *  data. The FAQs were shaped by real competitor research (docs/aimp/research/sunset-lamp-competitors.md): what buyers ask, what
 *  reviews complain about (heat, flimsy builds, remotes), and how to answer the "Kmart has one cheaper" objection honestly. */
export function sampleConfig(workspaceId: string, now: Date): AgentConfig {
  const k = (id: string, question: string, answer: string) => ({ id, question, answer });
  return {
    ...defaultConfig(workspaceId, now),
    businessName: 'Glow Haven', idealCustomer: 'people who want a cosy, aesthetic bedroom, content creators, or someone buying a gift',
    brandVoice: 'warm, casual, short, like a friend texting', qualifyingQuestion: 'Is it for your own room or a gift?',
    offers: [
      { id: 'offer-lamp', name: 'Sunset Lamp', priceMinor: 3900, currency: 'AUD', description: 'A projector lamp with 16 colours plus the classic sunset glow, a remote with an auto-off timer, and a 180 degree rotating head.', ctaUrl: 'https://glowhaven.example.com/sunset-lamp', ctaKind: 'checkout' },
      { id: 'offer-bundle', name: 'Sunset Lamp 2-pack', priceMinor: 6900, currency: 'AUD', description: 'Two Sunset Lamps, handy for gifting or a bigger glow.', ctaUrl: 'https://glowhaven.example.com/sunset-lamp-2-pack', ctaKind: 'checkout' },
    ],
    knowledge: [
      k('faq-shipping', 'How long does shipping take? When will it arrive? Delivery time? How long to get here?', 'Orders ship within 1 to 2 business days and usually land in 7 to 12 business days. You get a tracking link by email as soon as it ships.'),
      k('faq-free-shipping', 'Is shipping free? Shipping cost? Postage?', 'Shipping is free anywhere in Australia.'),
      k('faq-returns', 'Can I return it? Returns policy? Refund if I do not like it? Money back?', 'Yep, you have 30 days from delivery to send it back unused for a full refund. Just message us and we sort it.'),
      k('faq-warranty', 'Warranty? What if it breaks or stops working? Faulty? Arrived broken or damaged?', "It comes with a 12 month warranty. If it stops working or arrives damaged, send us a quick photo or video and we'll replace it free."),
      k('faq-power', 'How is it powered? Does it need batteries? USB plug? Cable length? Power adapter?', "It runs off USB with a 1.8 m cable, so any phone charger or laptop port works. The wall plug isn't included but any USB phone plug does the job."),
      k('faq-colours', 'What colours or modes does it have? Rainbow? Can you change the colour?', 'You get 16 colours plus the classic sunset glow, and the head rotates 180 degrees so you can move the glow up the wall or onto the ceiling.'),
      k('faq-remote', 'Does it come with a remote? App? Timer? Auto off? Dimmable brightness?', "Yep, it comes with a small remote for colours, brightness and a 30 or 60 minute auto-off timer, so you can fall asleep with it on. There's no app, which keeps setup simple."),
      k('faq-heat', 'Does it get hot? Safe to leave on overnight? Overheating?', "The head gets warm after a while like most LED lamps, but not too hot to touch. It's fine for a few hours at a time, and the auto-off timer means you don't need to leave it on all night."),
      k('faq-size', 'How big is the sunset on the wall? Projection size? Size of the lamp? How tall?', "The lamp is about 26 cm tall. The glow gets bigger the further it is from the wall, roughly 1 to 2 metres away gives that big sunset circle."),
      k('faq-room', 'Does it work in daylight? Bright room? Best time to use?', 'It looks best in a dim room or in the evening. In full daylight the glow is pretty faint.'),
      k('faq-photos', 'Good for photos? TikTok? Content? Selfies? Golden hour?', "It's great for golden-hour style photos and videos. Point it at a plain wall and stand in the glow."),
      k('faq-power-use', 'Does it use much electricity? Power usage? Running cost?', 'Barely any, it uses about the same power as charging a phone.'),
      k('faq-compare', 'Why is it more than Kmart? Cheaper on Amazon? Is it worth it? Too expensive? Better than Kmart?', "Fair question! The budget ones are a fine pick if you just want the basic orange glow. Ours adds 16 colours, the remote with a timer, the rotating head, a 12 month warranty and free shipping, so it comes down to whether you want those extras."),
      k('faq-gift', 'Is it a good gift? Gift wrap? Can I send it to someone else?', "It's one of our most popular gifts. You can put their address at checkout and add a note, we don't put prices in the box."),
      k('faq-sleep', 'Does it help you sleep? Is it light therapy? Health benefits?', "It's a decor light for a cosy vibe, not a health device, so I can't promise anything like that."),
    ],
    refundPolicy: '30-day returns on unused items for a full refund. Faulty or damaged: replaced free within the 12 month warranty.',
    prohibitedClaims: ['improves sleep', 'helps you sleep', 'cures', 'treats', 'therapy', 'only a few left', 'selling out'],
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
    ws, store, setter, sender, appSecret, igAccountId, agentName: (opts.agent ?? ruleAgent).name, metered: !!(opts.agent ?? ruleAgent).metered,
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
