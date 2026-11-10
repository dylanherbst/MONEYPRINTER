// Lab sandbox (migration 202611110001, task A-25) against the real migrations in PGlite with Supabase-like roles:
// the sandbox is marked and isolated, cannot hold real customer data by accident, a lab booking is readable through
// the CRM read path, reset touches only the sandbox, and named scenarios save and load (rows and lab state).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import './helpers/route-harness.ts';

const lab = await import('../lib/supabase/lab-sandbox.ts');
const { CONTACT_COLUMNS, contactFromRow } = await import('../lib/front-office/crm.ts');
const { ACTIVITY_COLUMNS, activityFromRow } = await import('../lib/front-office/activity.ts');
const { parseBooking } = await import('../lib/front-office/contracts.ts');
const { bookingEventId } = await import('../lib/front-office/booking.ts');

const SECRET = 's'.repeat(48), BIZ_KEY = 'b'.repeat(40);
const BIZ_SMS = '+61800000030', SAM = '+61412345678', JO = '+61498765432';
const migrations = ['202610160001_s01.sql', '202611060001_front_office.sql', '202611060002_front_office_appointments.sql', '202611060003_front_office_setter.sql',
  '202611060004_front_office_chat_email.sql', '202611060005_front_office_meta.sql', '202611080001_front_office_receptionist.sql',
  '202611100001_front_office_modes.sql', '202611100002_front_office_connections.sql', '202611110001_front_office_lab.sql'];

async function setup() {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth; create table auth.users(id uuid primary key);
    create table auth.sessions(id uuid primary key,user_id uuid,not_after timestamptz);
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
    grant usage on schema public,auth to authenticated,anon,service_role;
    grant execute on function auth.uid(),auth.jwt() to authenticated,anon,service_role;`);
  for (const f of migrations) await db.exec(await readFile(`../../supabase/migrations/${f}`, 'utf8'));
  const owner = '11111111-1111-4111-8111-111111111111', stranger = '33333333-3333-4333-8333-333333333333';
  const so = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', sx = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  await db.query('insert into auth.users values ($1),($2)', [owner, stranger]);
  await db.query('insert into auth.sessions(id,user_id) values ($1,$2),($3,$4)', [so, owner, sx, stranger]);
  const as = async (id: string | null, session?: string) => {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claims',$1,false)", [id ? JSON.stringify({ sub: id, session_id: session }) : '']);
    await db.exec(id ? 'set role authenticated' : 'set role anon');
  };
  const one = async <T = unknown>(sql: string, params: unknown[] = []) => (await db.query<{ r: T }>(sql, params)).rows[0]?.r as T;
  const rows = async <T = unknown>(sql: string, params: unknown[] = []) => (await db.query<{ r: T }>(sql, params)).rows.map(x => x.r);
  // The same call shape as a Supabase client's rpc(): named arguments, data back, an error thrown.
  const rpc: import('../lib/supabase/lab-sandbox.ts').LabRpc = async (fn, args) => {
    const keys = Object.keys(args);
    const values = keys.map(k => { const v = args[k]; return v !== null && typeof v === 'object' ? JSON.stringify(v) : v; });
    return (await db.query<{ r: unknown }>(`select public.${fn}(${keys.map((k, i) => `${k} => $${i + 1}`).join(', ')}) as r`, values)).rows[0]?.r;
  };
  await as(owner, so);
  const biz = await one<string>("select public.create_workspace('Iron Gym') as r");
  const bizSms = await one<string>("select public.fo_create_channel($1,'sms',$2,$3) as r", [biz, BIZ_SMS, BIZ_KEY]);
  return { db, as, one, rows, rpc, owner, so, stranger, sx, biz, bizSms };
}

type Env = Awaited<ReturnType<typeof setup>>;

/** A lab conversation through the real RPCs with the lab channel key: inbound SMS, qualified, booked. */
async function labBooking(env: Env, sandbox: { channels: { sms: { id: string; address: string } } }, key: string, phone: string, start: string) {
  const sms = sandbox.channels.sms;
  const msg = `SMlab${phone.slice(-8)}${start.slice(11, 13)}0001`;
  const a = await env.one<{ contact: string; created: boolean }>('select public.fo_ingest_sms($1,$2,$3,$4,$5,$6,false,false) as r', [sms.id, key, phone, sms.address, 'Hi, can I book a trial?', msg]);
  await env.one('select public.fo_set_state($1,$2,$3,$4,$5,$6) as r', [sms.id, key, a.contact, 'qualifying', 'setter', 'Lab']);
  await env.one('select public.fo_save_answers($1,$2,$3,$4,$5,$6) as r', [sms.id, key, a.contact, JSON.stringify({ goal: 'strength' }), 'Sam', 'sam@example.com']);
  await env.one('select public.fo_set_state($1,$2,$3,$4,$5,$6) as r', [sms.id, key, a.contact, 'qualified', 'setter', 'Lab']);
  const ends = new Date(Date.parse(start) + 30 * 60_000).toISOString();
  const b = await env.one<{ appointment: string; state: string }>('select public.fo_book($1,$2,$3,$4,$5,$6,$7) as r', [sms.id, key, a.contact, start, ends, 'google', bookingEventId(a.contact, Date.parse(start))]);
  assert.equal(b.state, 'booked');
  return { contact: a.contact, appointment: b.appointment };
}

test('the sandbox is marked, owned by one user, invisible to everyone else, and guarded against real data', async () => {
  const env = await setup();
  const { db, as, one, rows, rpc, owner, so, stranger, sx, biz } = env;
  const key = lab.labChannelKey(SECRET, owner);
  assert.equal(key, lab.labChannelKey(SECRET, owner), 'the same user always derives the same key');
  assert.notEqual(key, lab.labChannelKey(SECRET, stranger));
  assert.throws(() => lab.labChannelKey('short', owner), /not configured/);

  await as(null);
  await assert.rejects(rpc('fo_lab_ensure_sandbox', { channel_key: key }), /permission denied/, 'anonymous callers cannot make a sandbox');
  await as(owner, so);
  const sb = await lab.ensureLabSandbox(rpc, key);
  assert.equal(sb.created, true);
  assert.equal(sb.channels.sms.address, `lab:sms:${sb.workspaceId}`);
  assert.equal(sb.channels.voice.address, `lab:voice:${sb.workspaceId}`);
  const again = await lab.ensureLabSandbox(rpc, key);
  assert.deepEqual({ ...again, created: true }, sb, 'one sandbox per user, same channels');
  assert.equal(again.created, false);
  assert.equal(await one('select kind as r from public.workspaces where id = $1', [sb.workspaceId]), 'lab');
  assert.equal(await one('select kind as r from public.workspaces where id = $1', [biz]), 'business');
  assert.deepEqual(await rows("select role as r from public.memberships where workspace_id = $1", [sb.workspaceId]), ['owner']);

  // Lab data goes in through the real RPCs with the lab key.
  const booked = await labBooking(env, sb, key, SAM, '2026-11-12T01:00:00.000Z');

  // Another user: their own, different sandbox; nothing of the owner's is visible or resettable.
  await as(stranger, sx);
  const theirs = await lab.ensureLabSandbox(rpc, lab.labChannelKey(SECRET, stranger));
  assert.notEqual(theirs.workspaceId, sb.workspaceId);
  assert.equal(await one<number>('select count(*)::int as r from public.workspaces where id = $1', [sb.workspaceId]), 0);
  assert.equal(await one<number>('select count(*)::int as r from public.fo_contacts where workspace_id = $1', [sb.workspaceId]), 0);
  assert.equal(await one<number>('select count(*)::int as r from public.fo_appointments where id = $1', [booked.appointment]), 0);
  assert.equal(await one<number>('select count(*)::int as r from public.fo_lab_sandboxes', []), 1, 'only their own sandbox row');
  await assert.rejects(lab.resetLabSandbox(rpc, sb.workspaceId), /Lab sandbox not found/);
  await assert.rejects(lab.listLabScenarios(rpc, sb.workspaceId, 'setter'), /Lab sandbox not found/);
  await assert.rejects(lab.saveLabScenario(rpc, sb.workspaceId, { product: 'setter', name: 'Steal', state: {}, expectedRevision: 0 }), /Lab sandbox not found/);
  await assert.rejects(rows('select to_jsonb(s) as r from public.fo_lab_scenarios s'), /permission denied/, 'scenarios are read only through the functions');
  // Their lab key does not open the owner's lab channel.
  await as(null);
  await assert.rejects(one('select public.fo_ingest_sms($1,$2,$3,$4,$5,$6,false,false) as r', [sb.channels.sms.id, lab.labChannelKey(SECRET, stranger), JO, sb.channels.sms.address, 'hi', 'SMx000000000001']), /Channel not recognised/);

  // Guards, even for the database superuser.
  await db.exec('reset role');
  await assert.rejects(db.query("insert into public.memberships values ($1,$2,'staff',true)", [sb.workspaceId, stranger]), /no other members/);
  await assert.rejects(db.query("insert into public.memberships values ($1,$2,'owner',true)", [sb.workspaceId, stranger]), /no other members/);
  await assert.rejects(db.query("update public.workspaces set kind = 'business' where id = $1", [sb.workspaceId]), /kind cannot change/);
  await assert.rejects(db.query("update public.workspaces set kind = 'lab' where id = $1", [biz]), /kind cannot change/);
  await assert.rejects(db.query("insert into public.fo_connections(workspace_id, kind, external_id) values ($1,'sms','+61400000099')", [sb.workspaceId]), /cannot be connected/);
  await assert.rejects(db.query("insert into public.fo_contacts(workspace_id, phone, source) values ($1,'+61400000098','import')", [sb.workspaceId]), /cannot be imported/);
  await assert.rejects(db.query("insert into public.fo_lab_sandboxes(workspace_id, owner_id) values ($1,$2)", [biz, stranger]), /Only a lab workspace/);
  await as(owner, so);
  await assert.rejects(one("select public.fo_create_channel($1,'sms',$2,$3) as r", [sb.workspaceId, '+61800000099', 'x'.repeat(40)]), /only has lab channels/, 'no real number on a sandbox');
  await assert.rejects(one("select public.fo_create_channel($1,'sms',$2,$3) as r", [biz, `lab:sms:${theirs.workspaceId}`, 'x'.repeat(40)]), /reserved for the lab/, 'a business cannot take a lab address');
  // A real-looking email never lands on a sandbox contact; a test address does.
  await as(null);
  await assert.rejects(one('select public.fo_save_answers($1,$2,$3,$4,$5,$6) as r', [sb.channels.sms.id, key, booked.contact, '{}', null, 'sam@gmail.com']), /test email addresses/);
  await one('select public.fo_save_answers($1,$2,$3,$4,$5,$6) as r', [sb.channels.sms.id, key, booked.contact, '{}', null, 'sam.lab@ventra.test']);
  // A business keeps real emails.
  const bizSam = await one<{ contact: string }>('select public.fo_ingest_sms($1,$2,$3,$4,$5,$6,false,false) as r', [env.bizSms, BIZ_KEY, SAM, BIZ_SMS, 'hello', 'SMbiz00000000001']);
  await one('select public.fo_save_answers($1,$2,$3,$4,$5,$6) as r', [env.bizSms, BIZ_KEY, bizSam.contact, '{}', null, 'sam@gmail.com']);
  // Input validation before the database.
  await as(owner, so);
  await assert.rejects(lab.ensureLabSandbox(rpc, 'short'), /32 to 200/);
  await assert.rejects(lab.resetLabSandbox(rpc, 'not-a-uuid'), /not valid/);
  await assert.rejects(lab.saveLabScenario(rpc, sb.workspaceId, { product: 'setter', name: '../etc', state: {}, expectedRevision: 0 }), /Scenario name/);
  await assert.rejects(lab.saveLabScenario(rpc, sb.workspaceId, { product: 'sales' as never, name: 'x', state: {}, expectedRevision: 0 }), /Unknown lab/);
  await assert.rejects(lab.saveLabScenario(rpc, sb.workspaceId, { product: 'setter', name: 'Big', state: { s: 'x'.repeat(600_000) }, expectedRevision: 0 }), /too large/);
});

test('a lab booking, contact and action log are readable through the CRM read path of the sandbox', async () => {
  const env = await setup();
  const { as, one, rows, rpc, owner, so } = env;
  await as(owner, so);
  const key = lab.labChannelKey(SECRET, owner);
  const sb = await lab.ensureLabSandbox(rpc, key);
  await as(null);
  const start = '2026-11-12T01:00:00.000Z';
  const booked = await labBooking(env, sb, key, SAM, start);
  // Owner approval mode in the sandbox: a held action lands in the real approval queue.
  await as(owner, so);
  await one('select public.fo_save_agent_settings($1,$2,0) as r', [sb.workspaceId, JSON.stringify({ template: 'custom', businessName: 'Lab sandbox' })]);
  assert.deepEqual(await lab.setLabModes(rpc, sb.workspaceId, { setter: 'owner_approval', receptionist: 'enquiry_only' }), { setter: 'owner_approval', receptionist: 'enquiry_only', revision: 1 });
  await as(null);
  const held = await one<{ created: boolean }>('select public.fo_request_action($1,$2,$3,$4,$5,$6,$7,$8,$9) as r', [sb.channels.sms.id, key, 'setter', booked.contact, null,
    JSON.stringify({ kind: 'book', start: '2026-11-13T01:00:00.000Z', end: '2026-11-13T01:30:00.000Z', timeZone: 'Australia/Perth' }), 'Book Sam Friday 9am', 'lab:book:00000001', 60]);
  assert.equal(held.created, true);

  // Read exactly as the contacts, activity and bookings reads do, under the owner's RLS.
  await as(owner, so);
  const contacts = (await rows<Record<string, unknown>>(`select to_jsonb(c) as r from (select ${CONTACT_COLUMNS} from public.fo_contacts where workspace_id = $1 order by created_at desc, id desc) c`, [sb.workspaceId]))
    .map(r => contactFromRow(r as never));
  assert.equal(contacts.length, 1);
  assert.equal(contacts[0]!.id, booked.contact);
  assert.equal(contacts[0]!.phone, SAM);
  assert.equal(contacts[0]!.email, 'sam@example.com');
  assert.equal(contacts[0]!.state, 'booked');
  const bookings = await rows<Record<string, string>>('select to_jsonb(a) as r from public.fo_appointments a where workspace_id = $1', [sb.workspaceId]);
  assert.equal(bookings.length, 1);
  const parsed = parseBooking({ id: bookings[0].id, contactId: bookings[0].contact_id, startsAt: new Date(bookings[0].starts_at).toISOString(), endsAt: new Date(bookings[0].ends_at).toISOString(),
    provider: bookings[0].provider, status: bookings[0].status, createdAt: new Date(bookings[0].created_at).toISOString() });
  assert.ok(parsed.ok, JSON.stringify(parsed));
  assert.equal(parsed.ok && parsed.value.startsAt, start);
  assert.equal(parsed.ok && parsed.value.contactId, booked.contact);
  const feed = (await rows<Record<string, unknown>>(`select to_jsonb(e) as r from (select ${ACTIVITY_COLUMNS} from public.fo_events where workspace_id = $1 order by id desc) e`, [sb.workspaceId]))
    .map(r => activityFromRow(r as never));
  assert.ok(feed.every(e => e !== null), 'every lab event maps to the activity contract');
  assert.ok(feed.some(e => e!.kind === 'state' && e!.detail?.startsWith('Booked ')), 'the booking is in the activity feed');
  assert.ok(feed.some(e => e!.kind === 'created'));
  const queue = await one<unknown[]>("select coalesce(jsonb_agg(to_jsonb(a)), '[]') as r from public.fo_list_actions($1, 'pending', 10) a", [sb.workspaceId]);
  assert.equal(queue.length, 1, 'the held lab action is in the sandbox approval queue');
  // Not in the owner's business workspace.
  assert.equal(await one<number>('select count(*)::int as r from public.fo_contacts where workspace_id = $1', [env.biz]), 0);
});

test('reset clears only the sandbox; named scenarios save and load the lab state and the CRM rows', async () => {
  const env = await setup();
  const { as, one, rows, rpc, owner, so, biz } = env;
  // A real business conversation and booking of the same owner, which must survive every lab reset.
  await as(null);
  const real = await one<{ contact: string }>('select public.fo_ingest_sms($1,$2,$3,$4,$5,$6,false,false) as r', [env.bizSms, BIZ_KEY, SAM, BIZ_SMS, 'Real customer', 'SMbiz00000000002']);
  await one('select public.fo_set_state($1,$2,$3,$4,$5,$6) as r', [env.bizSms, BIZ_KEY, real.contact, 'qualifying', 'setter', 'x']);
  await one('select public.fo_set_state($1,$2,$3,$4,$5,$6) as r', [env.bizSms, BIZ_KEY, real.contact, 'qualified', 'setter', 'x']);
  await one('select public.fo_book($1,$2,$3,$4,$5,$6,$7) as r', [env.bizSms, BIZ_KEY, real.contact, '2026-11-12T02:00:00Z', '2026-11-12T02:30:00Z', 'google', bookingEventId(real.contact, Date.parse('2026-11-12T02:00:00Z'))]);
  await one('select public.fo_schedule_job($1,$2,$3,$4,1,$5,null) as r', [env.bizSms, BIZ_KEY, real.contact, 'follow-up', '2026-11-13T00:00:00Z']);
  const bizCounts = async () => {
    await as(owner, so);
    return {
      contacts: await one<number>('select count(*)::int as r from public.fo_contacts where workspace_id = $1', [biz]),
      messages: await one<number>('select count(*)::int as r from public.fo_messages where workspace_id = $1', [biz]),
      events: await one<number>('select count(*)::int as r from public.fo_events where workspace_id = $1', [biz]),
      appointments: await one<number>('select count(*)::int as r from public.fo_appointments where workspace_id = $1', [biz]),
      jobs: await one<number>('select count(*)::int as r from public.fo_jobs where workspace_id = $1', [biz]),
    };
  };
  const before = await bizCounts();
  assert.deepEqual([before.contacts, before.messages, before.appointments, before.jobs], [1, 1, 1, 1]);
  assert.ok(before.events >= 4);

  await as(owner, so);
  const key = lab.labChannelKey(SECRET, owner);
  const sb = await lab.ensureLabSandbox(rpc, key);
  await as(null);
  const first = await labBooking(env, sb, key, SAM, '2026-11-12T01:00:00.000Z');
  await one('select public.fo_schedule_job($1,$2,$3,$4,1,$5,$6) as r', [sb.channels.sms.id, key, first.contact, 'reminder-24h', '2026-11-11T01:00:00Z', first.appointment]);

  // The owner of the business cannot "reset" it through the lab.
  await as(owner, so);
  await assert.rejects(lab.resetLabSandbox(rpc, biz), /Lab sandbox not found/);
  await assert.rejects(lab.loadLabScenario(rpc, biz, 'setter', 'Anything'), /Lab sandbox not found/);

  // Save the scenario: the lab state plus the rows as they are now.
  const sandboxRows = async () => ({
    contacts: await rows<string>('select id::text as r from public.fo_contacts where workspace_id = $1 order by id', [sb.workspaceId]),
    appointments: await rows<string>('select id::text as r from public.fo_appointments where workspace_id = $1 order by id', [sb.workspaceId]),
    events: await rows<number>('select id::int as r from public.fo_events where workspace_id = $1 order by id', [sb.workspaceId]),
    messages: await rows<string>('select body as r from public.fo_messages where workspace_id = $1 order by created_at, id', [sb.workspaceId]),
    jobs: await rows<string>('select kind as r from public.fo_jobs where workspace_id = $1 order by id', [sb.workspaceId]),
  });
  const saved = await sandboxRows();
  assert.equal(saved.contacts.length, 1);
  assert.equal(saved.appointments.length, 1);
  const state = { v: 1, mode: 'owner_approval', phone: SAM, turns: [{ n: 1, customer: 'Hi, can I book a trial?' }] };
  const s1 = await lab.saveLabScenario(rpc, sb.workspaceId, { product: 'setter', name: 'Booked lead', state, expectedRevision: 0 });
  assert.equal(s1.revision, 1);
  assert.equal(s1.contacts, 1);
  assert.equal(s1.appointments, 1);
  await assert.rejects(lab.saveLabScenario(rpc, sb.workspaceId, { product: 'setter', name: 'Booked lead', state, expectedRevision: 0 }), /already exists/);
  // The same name in the other lab is a separate scenario.
  await lab.saveLabScenario(rpc, sb.workspaceId, { product: 'receptionist', name: 'Booked lead', state: { v: 1 }, expectedRevision: 0 });

  // Reset: only sandbox rows go.
  const cleared = await lab.resetLabSandbox(rpc, sb.workspaceId);
  assert.equal(cleared.contacts, 1);
  assert.equal(cleared.appointments, 1);
  assert.equal(cleared.jobs, 1);
  assert.deepEqual(await sandboxRows(), { contacts: [], appointments: [], events: [], messages: [], jobs: [] });
  assert.deepEqual(await bizCounts(), before, "the business's rows survive the reset");
  assert.equal(await one<number>('select count(*)::int as r from public.fo_list_channels($1)', [sb.workspaceId]), 2, 'channels stay');

  // A different conversation in the meantime.
  await as(null);
  await labBooking(env, sb, key, JO, '2026-11-14T01:00:00.000Z');
  await as(owner, so);
  assert.equal((await sandboxRows()).contacts.length, 1);

  // Load: back to exactly the saved rows (same ids, same event ids and order) and the saved lab state.
  const loaded = await lab.loadLabScenario(rpc, sb.workspaceId, 'setter', 'Booked lead');
  assert.deepEqual(loaded.state, state);
  assert.equal(loaded.restored.contacts, 1);
  assert.equal(loaded.restored.appointments, 1);
  assert.equal(loaded.cleared.contacts, 1, "Jo's conversation was cleared first");
  assert.deepEqual(await sandboxRows(), saved);
  const restoredContact = contactFromRow((await rows<Record<string, unknown>>(`select to_jsonb(c) as r from (select ${CONTACT_COLUMNS} from public.fo_contacts where workspace_id = $1) c`, [sb.workspaceId]))[0] as never);
  assert.equal(restoredContact!.state, 'booked');
  assert.equal(restoredContact!.phone, SAM);
  assert.deepEqual(await bizCounts(), before, 'loading never touches the business');
  // The lab keeps working on top of a loaded scenario (the identity sequence is ahead of restored event ids).
  await as(null);
  await one('select public.fo_ingest_sms($1,$2,$3,$4,$5,$6,false,false) as r', [sb.channels.sms.id, key, SAM, sb.channels.sms.address, 'Thanks!', 'SMlab00000000099']);
  await as(owner, so);
  const events = (await sandboxRows()).events;
  assert.ok(events[events.length - 1] > saved.events[saved.events.length - 1]);
  // Loading twice is the same as loading once.
  await lab.loadLabScenario(rpc, sb.workspaceId, 'setter', 'Booked lead');
  assert.deepEqual(await sandboxRows(), saved);

  // List, revision conflicts, delete.
  const list = await lab.listLabScenarios(rpc, sb.workspaceId, 'setter');
  assert.deepEqual(list.map(s => [s.name, s.revision, s.contacts, s.appointments]), [['Booked lead', 1, 1, 1]]);
  const s2 = await lab.saveLabScenario(rpc, sb.workspaceId, { product: 'setter', name: 'Booked lead', state: { ...state, note: 'v2' }, expectedRevision: 1 });
  assert.equal(s2.revision, 2);
  await assert.rejects(lab.saveLabScenario(rpc, sb.workspaceId, { product: 'setter', name: 'Booked lead', state, expectedRevision: 1 }), /changed elsewhere/);
  await assert.rejects(lab.deleteLabScenario(rpc, sb.workspaceId, 'setter', 'Booked lead', 1), /changed or removed/);
  await lab.deleteLabScenario(rpc, sb.workspaceId, 'setter', 'Booked lead', 2);
  assert.deepEqual(await lab.listLabScenarios(rpc, sb.workspaceId, 'setter'), []);
  assert.equal((await lab.listLabScenarios(rpc, sb.workspaceId, 'receptionist')).length, 1);
  await assert.rejects(lab.loadLabScenario(rpc, sb.workspaceId, 'setter', 'Booked lead'), /Scenario not found/);
});

test('rpcFromClient passes data through and only shows the lab messages, never raw database errors', async () => {
  const ok = lab.rpcFromClient({ rpc: async () => ({ data: { x: 1 }, error: null }) });
  assert.deepEqual(await ok('fo_lab_reset', {}), { x: 1 });
  const known = lab.rpcFromClient({ rpc: async () => ({ data: null, error: { message: 'Lab sandbox not found.' } }) });
  await assert.rejects(known('fo_lab_reset', {}), (e: Error) => e instanceof lab.LabSandboxError && e.message === 'Lab sandbox not found.');
  const raw = lab.rpcFromClient({ rpc: async () => ({ data: null, error: { message: 'duplicate key value violates unique constraint "fo_lab_scenarios_pkey"' } }) });
  await assert.rejects(raw('fo_lab_reset', {}), (e: Error) => e.message === 'The lab sandbox is unavailable. Please retry.');
});
