// A-30: POST /api/front-office/settings and the knowledge base. A save whose settings omit `knowledge` keeps the stored
// knowledge; a save that includes `knowledge` replaces it (empty lists or null clear it). Runs against a fake Supabase
// (global fetch) that mimics fo_get_agent_settings / fo_save_agent_settings. No live Supabase, nothing sent.
import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE, USER, W, configuredEnv, makeRequest, setEnv } from './helpers/route-harness.ts';

const route = await import('../app/api/front-office/settings/route.ts');
const { templateSettings, emptyKnowledge } = await import('../lib/front-office/settings.ts');
type KnowledgeBase = import('../lib/front-office/settings.ts').KnowledgeBase;

const ORIGIN = { origin: BASE, 'content-type': 'application/json' };
const STORED: KnowledgeBase = {
  services: [{ id: 'pt', name: 'Personal training', description: 'One on one', priceAud: 80, priceUnit: 'per session', durationMinutes: 60 }],
  offers: [{ id: 'trial', name: 'Free week', details: 'First week free', priceAud: 0, validUntil: '2099-12-31' }],
  policies: [{ id: 'cancel', topic: 'Cancellation', text: '24 hours notice please.' }],
  objections: [{ id: 'price', triggers: ['too expensive'], response: 'We have a free week to try first.', escalate: false }],
};

function world(saved: { data: unknown; revision: number } | null) {
  const db = { saved, payloads: [] as Record<string, unknown>[], rpc: [] as string[] };
  const real = globalThis.fetch;
  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    if (url.host !== '127.0.0.1:54321') throw new Error('unexpected host ' + url.host);
    if (url.pathname === '/auth/v1/user') return json(200, { id: USER, aud: 'authenticated', role: 'authenticated', email: 'a@example.com', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' });
    if (!url.pathname.startsWith('/rest/v1/rpc/')) return json(404, {});
    const fn = url.pathname.slice('/rest/v1/rpc/'.length);
    const a = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>;
    db.rpc.push(fn);
    switch (fn) {
      case 'session_active': return json(200, true);
      case 'fo_get_agent_settings':
        if (a.w !== W) return json(400, { message: 'Owner access required.', code: 'P0001' });
        return json(200, db.saved ? { ...db.saved, updatedAt: '2026-11-10T00:00:00.000Z' } : null);
      case 'fo_save_agent_settings': {
        if (a.w !== W) return json(400, { message: 'Owner access required.', code: 'P0001' });
        if ((db.saved?.revision ?? 0) !== a.expected_revision) return json(400, { message: 'Settings changed elsewhere.', code: 'P0001' });
        db.payloads.push(a.payload as Record<string, unknown>);
        db.saved = { data: a.payload, revision: (db.saved?.revision ?? 0) + 1 };
        return json(200, db.saved.revision);
      }
      default: return json(404, { message: 'no such rpc' });
    }
  }) as typeof fetch;
  return { db, restore: () => { globalThis.fetch = real; } };
}

async function save(settings: unknown, revision: number) {
  const res = await route.POST(makeRequest(`/api/front-office/settings?workspace=${W}`, { method: 'POST', headers: ORIGIN, body: JSON.stringify({ settings, revision }) }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { status: res.status, body: await res.json() as Record<string, any> };
}
const base = () => ({ ...templateSettings('gym'), businessName: 'Harbour Gym' });
const storedSettings = () => ({ ...base(), knowledge: STORED });
const withoutKnowledge = (over: Record<string, unknown> = {}) => { const { knowledge: _k, ...rest } = { ...base(), ...over }; void _k; return rest; };

test('A-30: a save that omits knowledge keeps the stored knowledge base unchanged', async () => {
  const env = setEnv(configuredEnv), w = world({ data: storedSettings(), revision: 3 });
  try {
    const r = await save(withoutKnowledge({ greeting: 'Hi there, thanks for calling.' }), 3);
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.deepEqual(r.body.settings.knowledge, STORED);
    assert.equal(r.body.settings.greeting, 'Hi there, thanks for calling.');
    assert.deepEqual((w.db.saved!.data as { knowledge: unknown }).knowledge, STORED, 'stored row keeps the knowledge');
    assert.equal(w.db.saved!.revision, 4);
  } finally { w.restore(); env(); }
});

test('A-30: a save that includes knowledge replaces it', async () => {
  const env = setEnv(configuredEnv), w = world({ data: storedSettings(), revision: 1 });
  try {
    const next: KnowledgeBase = { ...emptyKnowledge(), policies: [{ id: 'parking', topic: 'Parking', text: 'Free parking out the back.' }] };
    const r = await save({ ...base(), knowledge: next }, 1);
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.deepEqual(r.body.settings.knowledge, next);
    assert.deepEqual((w.db.saved!.data as { knowledge: unknown }).knowledge, next);
  } finally { w.restore(); env(); }
});

test('A-30: explicit empty knowledge (or null) clears it', async () => {
  for (const knowledge of [emptyKnowledge(), null]) {
    const env = setEnv(configuredEnv), w = world({ data: storedSettings(), revision: 2 });
    try {
      const r = await save({ ...base(), knowledge }, 2);
      assert.equal(r.status, 200, JSON.stringify(r.body));
      assert.deepEqual((w.db.saved!.data as { knowledge: unknown }).knowledge, emptyKnowledge());
    } finally { w.restore(); env(); }
  }
});

test('A-30: first save without knowledge stores empty lists (nothing invented)', async () => {
  const env = setEnv(configuredEnv), w = world(null);
  try {
    const r = await save(withoutKnowledge(), 0);
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.deepEqual(r.body.settings.knowledge, emptyKnowledge());
  } finally { w.restore(); env(); }
});

test('A-30: a save that includes knowledge does not read the stored row first', async () => {
  const env = setEnv(configuredEnv), w = world({ data: storedSettings(), revision: 1 });
  try {
    const r = await save({ ...base(), knowledge: STORED }, 1);
    assert.equal(r.status, 200);
    assert.ok(!w.db.rpc.includes('fo_get_agent_settings'));
  } finally { w.restore(); env(); }
});

test('A-30: Setter and Receptionist read the one stored knowledge base (no copy), also after a save that omits it', async () => {
  const { checkedAgentSettings, setterConfigFor } = await import('../lib/front-office/settings.ts');
  const { setterSystemPrompt } = await import('../lib/front-office/setter/prompt.ts');
  const { faqLookup } = await import('../lib/front-office/receptionist/agent.ts');
  const env = setEnv(configuredEnv), w = world({ data: storedSettings(), revision: 1 });
  try {
    assert.equal((await save(withoutKnowledge({ greeting: 'Hello!' }), 1)).status, 200);
    const st = checkedAgentSettings(w.db.saved!.data);
    assert.equal(setterConfigFor(st).knowledge, st.knowledge, 'Setter config carries the stored object itself');
    const now = Date.parse('2026-11-11T02:00:00Z');
    assert.match(setterSystemPrompt(setterConfigFor(st), 'Wednesday', 'sms', now), /Personal training: \$80 per session/);
    const hit = faqLookup('how much is personal training?', st, now);
    assert.ok(hit.hit && hit.result.includes('80'), hit.result);
    // Change the stored knowledge: both agents follow it, neither keeps an old copy.
    st.knowledge.services[0]!.priceAud = 95;
    assert.match(setterSystemPrompt(setterConfigFor(st), 'Wednesday', 'sms', now), /\$95 per session/);
    assert.ok(faqLookup('how much is personal training?', st, now).result.includes('95'));
  } finally { w.restore(); env(); }
});

test('A-30: a stale revision without knowledge is still a conflict, and nothing is written', async () => {
  const env = setEnv(configuredEnv), w = world({ data: storedSettings(), revision: 5 });
  try {
    const r = await save(withoutKnowledge(), 4);
    assert.equal(r.status, 409, JSON.stringify(r.body));
    assert.equal(w.db.payloads.length, 0);
  } finally { w.restore(); env(); }
});
