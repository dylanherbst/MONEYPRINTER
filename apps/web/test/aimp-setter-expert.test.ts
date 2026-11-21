// The test-lab mock store (Glow Haven, Sunset Lamp): the rule agent answers the questions buyers actually ask, from the store's facts.
import assert from 'node:assert/strict';
import test from 'node:test';
import { createSandbox } from '../lib/aimp/setter/index.ts';

const T0 = new Date('2026-11-22T10:00:00Z');
async function ask(text: string) {
  const sb = createSandbox({ now: () => T0 });
  sb.store.saveConfig({ ...sb.store.config(sb.ws)!, mode: 'auto' });
  const r = await sb.inbound(text, '5001');
  return { result: r.results[0], reply: sb.sender.sent[0]?.text ?? '' };
}

test('answers real buyer questions from the facts, sounding like a person', async () => {
  const cases: [string, RegExp][] = [
    ['how much is the sunset lamp?', /\$39.*glowhaven\.example\.com\/sunset-lamp/],
    ['do you have a 2 pack? want to buy two', /\$69.*2-pack/],
    ['how long does shipping take to perth?', /7 to 12 business days/],
    ['does it get hot? can I leave it on overnight', /warm/],
    ['does it come with a remote or an app?', /remote/],
    ['kmart has one way cheaper, why is yours more?', /budget ones are a fine pick/],
    ['will it help me sleep?', /decor light/],
    ['what if it arrives broken', /12 month warranty/],
    ['is it good for tiktok photos', /golden-hour/],
  ];
  for (const [q, want] of cases) {
    const { result, reply } = await ask(q);
    assert.equal(result, 'sent', q);
    assert.match(reply, want, q);
    assert.doesNotMatch(reply, /\b(AI|assistant|Thank you for reaching out)\b/, q);
  }
});

test('order problems go to a person, not the bot', async () => {
  assert.equal((await ask('my order never arrived, this is a scam')).result, 'handoff');
});
