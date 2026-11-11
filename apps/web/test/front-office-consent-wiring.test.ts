// A-45: the app uses the per-channel consent records of A-38 (migration 202611110004). A follow-up on the customer's
// own SMS/email conversation is a reply (their inbound message is the evidence); moving them to another channel needs an
// explicit grant for it (fo_contact_context contact.consent); an opt-out always wins. STOP by SMS or email also closes
// the consent record, and a failure to do so never changes the opt-out. Scripted RPCs and PGlite with every real
// migration: no network, nothing sent, no live provider.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import './helpers/route-harness.ts';
import type { SetterContext } from '../lib/front-office/setter/actions.ts';

const { checkFollowUp, createSetterExecutor } = await import('../lib/front-office/setter/actions.ts');
const { handleInbound, handleInboundSms } = await import('../lib/front-office/orchestrator.ts');
const { metaRoute } = await import('../lib/front-office/jobs.ts');
const { ventraSetterConfig } = await import('../lib/front-office/setter/config.ts');

const CID = '33333333-3333-4333-8333-333333333333';
const base = (over: Partial<SetterContext['contact']> = {}, inbound = true): SetterContext => ({
  contact: { id: CID, name: 'Sam', phone: '+61411111111', email: null, state: 'qualifying', optedOut: false, answers: {}, ...over },
  messages: inbound ? [{ direction: 'inbound', body: 'Hi', agent: null, at: '2026-11-10T01:00:00Z' }] : [],
  appointment: null, handoffs: [],
});

test('follow-up consent: website chat to SMS needs a grant; a missing consent field (older database) is no consent', () => {
  const none = checkFollowUp(base(), 'web-chat');
  assert.equal(none.ok, false);
  assert.match(!none.ok ? none.why : '', /No recorded consent for texts/);
  assert.equal(checkFollowUp(base({ consent: { sms: false, email: false } }), 'web-chat').ok, false);
  assert.equal(checkFollowUp(base({ consent: { sms: false, email: true } }), 'web-chat').ok, false, 'email consent without an address does not help');
  assert.deepEqual(checkFollowUp(base({ consent: { sms: true, email: false } }), 'web-chat'), { ok: true, channel: 'sms', consent: 'The contact gave recorded consent to be contacted by text.' });
  assert.equal(checkFollowUp(base(), 'instagram').ok, false, 'Instagram to SMS needs a grant');
  assert.equal(checkFollowUp(base(), 'messenger').ok, false);
  // SMS conversation, email follow-up: another channel, so an email grant is needed.
  assert.equal(checkFollowUp(base({ phone: null, email: 'sam@example.com' }), 'sms').ok, false);
  assert.deepEqual(checkFollowUp(base({ phone: null, email: 'sam@example.com', consent: { sms: false, email: true } }), 'sms'), { ok: true, channel: 'email', consent: 'The contact gave recorded consent to be contacted by email.' });
});

test('follow-up consent: replying on the channel the customer used is still allowed without a grant', () => {
  assert.deepEqual(checkFollowUp(base(), 'sms'), { ok: true, channel: 'sms', consent: 'The contact messaged the business first (2026-11-10T01:00:00Z).' });
  assert.deepEqual(checkFollowUp(base({ phone: null, email: 'sam@example.com' }), 'email'), { ok: true, channel: 'email', consent: 'The contact messaged the business first (2026-11-10T01:00:00Z).' });
  // No channel given (older callers): the follow-up channel is taken as the conversation's, exactly as before A-45.
  assert.equal(checkFollowUp(base()).ok, true);
  // No inbound message and no grant: no consent at all.
  assert.deepEqual(checkFollowUp(base({}, false), 'sms'), { ok: false, why: 'No recorded consent: the contact has not messaged the business.' });
  // An explicit grant is consent even before the contact has messaged.
  assert.equal(checkFollowUp(base({ consent: { sms: true, email: false } }, false), 'web-chat').ok, true);
});

test('follow-up consent: an opt-out overrides any grant', () => {
  const both = { sms: true, email: true };
  for (const via of ['sms', 'email', 'web-chat', 'instagram'] as const) {
    assert.deepEqual(checkFollowUp(base({ optedOut: true, email: 'sam@example.com', consent: both }), via), { ok: false, why: 'The contact opted out.' });
  }
  assert.deepEqual(metaRoute({ recipient: 'ig-1', optedOut: false, lastInbound: null }, { name: null, phone: '+61411111111', email: null, state: 'new', optedOut: true, consent: both }, Date.now(), true), { via: 'owner', reason: 'The contact opted out.' });
});

test('performFollowUp from website chat: no grant schedules nothing; a grant schedules follow-up 1 by text', async () => {
  for (const consent of [undefined, { sms: true, email: false }]) {
    const calls: string[] = [];
    const rpc = async (fn: string) => { calls.push(fn); if (fn === 'fo_contact_context') return base(consent ? { consent } : {}); return null; };
    const exec = createSetterExecutor({ rpc, auth: { channel: 'ch', key: 'k' }, calendar: null, config: ventraSetterConfig, now: Date.parse('2026-11-10T02:00:00Z'), send: async () => ({ sent: false, sid: null }), channel: 'web-chat' });
    const r = await exec({ product: 'setter', contactId: CID, pendingActionId: 'p1', payload: { kind: 'follow_up', channel: 'sms', body: 'Hi Sam', promptVersion: 'setter/follow-up@1', step: 1 } } as Parameters<typeof exec>[0]);
    if (consent) { assert.equal(r.ok, true); assert.ok(calls.includes('fo_schedule_job')); }
    else { assert.equal(r.ok, false); assert.match(r.note ?? '', /No follow-up: No recorded consent for texts/); assert.ok(!calls.includes('fo_schedule_job')); }
  }
});

test('Meta out-of-window reroute reads contact.consent: SMS with a grant, owner task without one or with an older database', () => {
  const w = { recipient: 'ig-1', optedOut: false, lastInbound: '2026-11-01T00:00:00Z' };
  const c = { name: null, phone: '+61411111111', email: 'sam@example.com', state: 'qualifying', optedOut: false };
  const now = Date.parse('2026-11-10T00:00:00Z');
  assert.deepEqual(metaRoute(w, { ...c, consent: { sms: true, email: false } }, now, true), { via: 'sms' });
  assert.deepEqual(metaRoute(w, { ...c, consent: { sms: false, email: true } }, now, true), { via: 'email' });
  assert.equal(metaRoute(w, c, now, true).via, 'owner');
  assert.equal(metaRoute(w, { ...c, consent: { sms: false, email: false } }, now, true).via, 'owner');
});

// --- STOP closes the consent record ------------------------------------------------------------------------------------

const MSG = { from: '+61411111111', to: '+61400000101', body: 'STOP', messageSid: 'SM00000000000000000000000000000001' };
const scripted = (opts: { optedOut: boolean; withdrawFails?: boolean }) => {
  const calls: { fn: string; args: Record<string, unknown> }[] = [];
  const rpc = async (fn: string, args: Record<string, unknown>) => {
    calls.push({ fn, args });
    if (fn === 'fo_ingest_sms' || fn === 'fo_ingest') return { contact: 'c1', state: 'qualifying', created: false, duplicate: false, optedOut: opts.optedOut };
    if (fn === 'fo_withdraw_consent' && opts.withdrawFails) throw new Error('function public.fo_withdraw_consent does not exist');
    return null;
  };
  return { calls, rpc };
};

test('STOP by SMS: opts out, confirms and withdraws SMS consent with an inbound STOP source', async () => {
  const s = scripted({ optedOut: true });
  const r = await handleInboundSms(s.rpc, { channel: 'ch', key: 'k' }, MSG, {}, { withdrawConsent: true });
  assert.equal(r.optedOut, true); assert.match(r.reply ?? '', /unsubscribed/);
  assert.deepEqual(s.calls.map(c => c.fn), ['fo_ingest_sms', 'fo_log_outbound', 'fo_withdraw_consent']);
  assert.equal(s.calls[0].args.opt_out, true);
  assert.deepEqual(s.calls[2].args, { channel: 'ch', channel_key: 'k', contact: 'c1', consent_channel: 'sms', source: 'inbound STOP (sms)', withdrawn: null });
});

test('STOP by email withdraws email consent; web chat, a normal message or no option never calls withdraw', async () => {
  const e = scripted({ optedOut: true });
  await handleInbound(e.rpc, { channel: 'ch', key: 'k' }, { via: 'email', sender: 'sam@example.com', body: 'Subject: Re\n\nunsubscribe', checkText: 'STOP', messageId: 'm1' }, {}, { withdrawConsent: true });
  const w = e.calls.find(c => c.fn === 'fo_withdraw_consent');
  assert.equal(w?.args.consent_channel, 'email'); assert.equal(w?.args.source, 'inbound STOP (email)');
  const chat = scripted({ optedOut: true });
  await handleInbound(chat.rpc, { channel: 'ch', key: 'k' }, { via: 'web-chat', sender: 'v1', body: 'STOP', messageId: 'w1' }, {}, { withdrawConsent: true });
  assert.ok(!chat.calls.some(c => c.fn === 'fo_withdraw_consent'), 'website chat has no SMS/email consent to withdraw');
  const hi = scripted({ optedOut: false });
  await handleInboundSms(hi.rpc, { channel: 'ch', key: 'k' }, { ...MSG, body: 'Hi' }, {}, { withdrawConsent: true });
  assert.ok(!hi.calls.some(c => c.fn === 'fo_withdraw_consent'));
  const off = scripted({ optedOut: true });
  await handleInboundSms(off.rpc, { channel: 'ch', key: 'k' }, MSG);
  assert.ok(!off.calls.some(c => c.fn === 'fo_withdraw_consent'));
});

test('a failing withdraw never breaks or changes the opt-out', async () => {
  const ok = scripted({ optedOut: true });
  const expected = await handleInboundSms(ok.rpc, { channel: 'ch', key: 'k' }, MSG, {}, { withdrawConsent: true });
  const bad = scripted({ optedOut: true, withdrawFails: true });
  const warn = console.warn; const warned: unknown[] = []; console.warn = (...a: unknown[]) => { warned.push(a); };
  try {
    const r = await handleInboundSms(bad.rpc, { channel: 'ch', key: 'k' }, MSG, {}, { withdrawConsent: true });
    assert.deepEqual(r, expected, 'same result, same opt-out confirmation');
    assert.deepEqual(bad.calls.map(c => c.fn), ['fo_ingest_sms', 'fo_log_outbound', 'fo_withdraw_consent']);
  } finally { console.warn = warn; }
  assert.equal(warned.length, 1, 'the failure is logged once');
});

// --- Real SQL: grant, STOP through the orchestrator, context and history ------------------------------------------------

const MIGRATIONS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../supabase/migrations');

test('PGlite: a granted SMS consent is closed by an inbound STOP; the contact is opted out and the history keeps the source', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role;
      create schema auth; create table auth.users(id uuid primary key);
      create table auth.sessions(id uuid primary key,user_id uuid,not_after timestamptz);
      create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
      create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
      grant usage on schema public,auth to authenticated,anon,service_role;
      grant execute on function auth.uid(),auth.jwt() to authenticated,anon,service_role;`);
    for (const f of (await readdir(MIGRATIONS_DIR)).filter(f => f.endsWith('.sql')).sort()) await db.exec(await readFile(path.join(MIGRATIONS_DIR, f), 'utf8'));
    const owner = '11111111-1111-4111-8111-111111111111', sess = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    await db.query('insert into auth.users values ($1)', [owner]);
    await db.query('insert into auth.sessions(id,user_id) values ($1,$2)', [sess, owner]);
    await db.query("select set_config('request.jwt.claims',$1,false)", [JSON.stringify({ sub: owner, session_id: sess })]);
    await db.exec('set role authenticated');
    const one = async <T>(sql: string, p: unknown[] = []) => (await db.query<{ r: T }>(sql, p)).rows[0]?.r as T;
    const w = await one<string>("select public.create_workspace('Iron Gym') as r");
    const KEY = 'a'.repeat(40);
    const ch = await one<string>("select public.fo_create_channel($1,'sms',$2,$3) as r", [w, MSG.to, KEY]);
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claims','',false)");
    await db.exec('set role anon'); // webhooks use the channel key, no user session
    const rpc = async (fn: string, args: Record<string, unknown>) => {
      const keys = Object.keys(args);
      return one<unknown>(`select public.${fn}(${keys.map((k, n) => `${k} => $${n + 1}`).join(', ')}) as r`, keys.map(k => args[k]));
    };
    const auth = { channel: ch, key: KEY };
    const first = await handleInboundSms(rpc, auth, { ...MSG, body: 'Hi', messageSid: 'SM00000000000000000000000000000010' }, {}, { withdrawConsent: true });
    await rpc('fo_grant_consent', { channel: ch, channel_key: KEY, contact: first.contact, consent_channel: 'sms', source: 'Website form, SMS box', given_at: null });
    const before = await rpc('fo_contact_context', { channel: ch, channel_key: KEY, contact: first.contact }) as SetterContext;
    assert.deepEqual(before.contact.consent, { sms: true, email: false });
    assert.equal(checkFollowUp(before, 'web-chat').ok, true, 'the recorded grant allows a text follow-up from another channel');
    const stop = await handleInboundSms(rpc, auth, { ...MSG, messageSid: 'SM00000000000000000000000000000011' }, {}, { withdrawConsent: true });
    assert.equal(stop.optedOut, true); assert.match(stop.reply ?? '', /unsubscribed/);
    const after = await rpc('fo_contact_context', { channel: ch, channel_key: KEY, contact: first.contact }) as SetterContext;
    assert.equal(after.contact.optedOut, true);
    assert.deepEqual(after.contact.consent, { sms: false, email: false });
    assert.deepEqual(checkFollowUp(after, 'web-chat'), { ok: false, why: 'The contact opted out.' });
    await db.exec('reset role');
    const rows = (await db.query<{ withdrawn_source: string | null; granted_source: string }>('select granted_source, withdrawn_source from public.fo_contact_consents where contact_id = $1', [first.contact])).rows;
    assert.deepEqual(rows, [{ granted_source: 'Website form, SMS box', withdrawn_source: 'inbound STOP (sms)' }]);
  } finally { await db.close(); }
});
