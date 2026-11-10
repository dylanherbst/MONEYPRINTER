// One customer record and one activity feed (task A-9) against the real migrations in PGlite with Supabase-like roles:
// the same person over SMS, a call and email stays one contact per workspace; nothing is merged silently; one business
// can never read another's contacts or activity; the feed pages newest first without gaps or repeats.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import './helpers/route-harness.ts';

const { normalisePhone, normaliseEmail, contactFromRow, collapseDuplicates } = await import('../lib/front-office/crm.ts');
const { activityFromRow, nextActivityCursor, ACTIVITY_COLUMNS } = await import('../lib/front-office/activity.ts');
const { CONTACT_COLUMNS } = await import('../lib/front-office/crm.ts');

const KEY = 'k'.repeat(40), OTHER_KEY = 'o'.repeat(40);
const SMS = '+61800000010', VOICE = '+61800000011', OTHER_SMS = '+61800000020';
const migrations = ['202610160001_s01.sql', '202611060001_front_office.sql', '202611060002_front_office_appointments.sql', '202611060003_front_office_setter.sql',
  '202611060004_front_office_chat_email.sql', '202611060005_front_office_meta.sql', '202611080001_front_office_receptionist.sql'];

async function setup() {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated;
    create schema auth; create table auth.users(id uuid primary key);
    create table auth.sessions(id uuid primary key,user_id uuid,not_after timestamptz);
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
    grant usage on schema public,auth to authenticated,anon;
    grant execute on function auth.uid(),auth.jwt() to authenticated,anon;`);
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
  await as(owner, so);
  const w = await one<string>("select public.create_workspace('Iron Gym') as r");
  const ch = {
    sms: await one<string>("select public.fo_create_channel($1,'sms',$2,$3) as r", [w, SMS, KEY]),
    voice: await one<string>("select public.fo_create_channel($1,'voice',$2,$3) as r", [w, VOICE, KEY]),
    email: await one<string>("select public.fo_create_channel($1,'email','hello@iron.example',$2) as r", [w, KEY]),
    chat: await one<string>("select public.fo_create_channel($1,'web-chat','iron.example',$2) as r", [w, KEY]),
  };
  await as(stranger, sx);
  const w2 = await one<string>("select public.create_workspace('Other Gym') as r");
  const sms2 = await one<string>("select public.fo_create_channel($1,'sms',$2,$3) as r", [w2, OTHER_SMS, OTHER_KEY]);
  return { db, as, one, rows, w, w2, ch, sms2, owner, so, stranger, sx };
}

test('one person across SMS, calls, email and chat stays one record per workspace; no silent merge; isolation holds', async () => {
  const { as, one, rows, w, w2, ch, sms2, owner, so, stranger, sx } = await setup();
  const SAM = normalisePhone('0412 345 678')!;
  assert.equal(SAM, '+61412345678');
  // Webhooks have no user session: they run as anon with the channel key.
  await as(null);
  const a = await one<{ contact: string; created: boolean }>('select public.fo_ingest_sms($1,$2,$3,$4,$5,$6,false,false) as r', [ch.sms, KEY, SAM, SMS, 'Hi, how much?', 'SM00000000000001']);
  assert.equal(a.created, true);
  const again = await one<{ contact: string; created: boolean }>('select public.fo_ingest_sms($1,$2,$3,$4,$5,$6,false,false) as r', [ch.sms, KEY, SAM, SMS, 'Still keen', 'SM00000000000002']);
  assert.equal(again.contact, a.contact); assert.equal(again.created, false);
  const call = await one<{ contact: string }>('select public.fo_voice_turn($1,$2,$3,$4,1,$5) as r', [ch.voice, KEY, 'call_00000001', SAM, 'Can I book?']);
  assert.equal(call.contact, a.contact, 'a call from the same mobile is the same person');
  // A withheld number: the caller says it in a local format; normalised first, it lands on the same record.
  const given = await one<string>('select public.fo_voice_contact($1,$2,$3,$4,$5) as r', [ch.voice, KEY, 'call_00000002', normalisePhone('+61 (0) 412 345 678'), 'Sam']);
  assert.equal(given, a.contact);
  const e1 = await one<{ contact: string }>('select public.fo_ingest($1,$2,$3,$4,$5,false,false) as r', [ch.email, KEY, 'Sam@Example.COM', 'Hello', 'em-00000001']);
  const e2 = await one<{ contact: string }>('select public.fo_ingest($1,$2,$3,$4,$5,false,false) as r', [ch.email, KEY, normaliseEmail(' sam@example.com '), 'Again', 'em-00000002']);
  assert.equal(e2.contact, e1.contact, 'email is matched case-insensitively');
  const visitor = await one<{ contact: string }>('select public.fo_ingest($1,$2,$3,$4,$5,false,false) as r', [ch.chat, KEY, 'visitor_0123456789abcdef', 'hey', 'chat-00000001']);
  // The chat visitor gives the email and mobile already on other records: kept off this record (no silent merge).
  const saved = await one<{ skipped: string[] }>('select public.fo_save_details($1,$2,$3,$4,$5,$6,$7) as r', [ch.chat, KEY, visitor.contact, '{}', 'Sam', 'SAM@example.com', SAM]);
  assert.deepEqual([...saved.skipped].sort(), ['email', 'phone']);
  // Another business may know the same person separately.
  const other = await one<{ contact: string }>('select public.fo_ingest_sms($1,$2,$3,$4,$5,$6,false,false) as r', [sms2, OTHER_KEY, SAM, OTHER_SMS, 'Hi other gym', 'SM00000000000003']);
  assert.notEqual(other.contact, a.contact);
  // Anonymous callers read nothing directly.
  await assert.rejects(rows('select to_jsonb(c) as r from public.fo_contacts c'), /permission denied/);
  await assert.rejects(rows('select to_jsonb(e) as r from public.fo_events e'), /permission denied/);

  // The owner reads through RLS exactly what the contacts route asks for.
  await as(owner, so);
  const mine = (await rows<Record<string, unknown>>(`select to_jsonb(c) as r from (select ${CONTACT_COLUMNS} from public.fo_contacts where workspace_id = $1 order by created_at desc, id desc) c`, [w]))
    .map(r => contactFromRow(r as never));
  assert.equal(mine.length, 3, 'SMS+calls, email and the chat visitor');
  assert.ok(mine.every(c => c !== null), 'every stored row maps to the contract');
  assert.equal(mine.filter(c => c!.phone === SAM).length, 1);
  assert.equal(mine.filter(c => c!.email === 'sam@example.com').length, 1);
  assert.equal(collapseDuplicates(mine.map(c => c!)).length, 3, 'nothing to collapse: the database already holds one row per phone and email');
  assert.equal(await one<number>('select count(*)::int as r from public.fo_contacts where phone = $1', [SAM]), 1, "the other business's Sam is invisible");
  assert.equal(await one<number>('select count(*)::int as r from public.fo_contacts where workspace_id = $1', [w2]), 0);
  assert.equal(await one<number>('select count(*)::int as r from public.fo_events where workspace_id = $1', [w2]), 0);
  assert.equal(await one<number>('select count(*)::int as r from public.fo_events where contact_id = $1', [other.contact]), 0, 'asking for a foreign contact id returns nothing, like an unknown id');

  // And the other business sees only its own.
  await as(stranger, sx);
  assert.equal(await one<number>('select count(*)::int as r from public.fo_contacts where workspace_id = $1', [w]), 0);
  assert.equal(await one<number>('select count(*)::int as r from public.fo_events where workspace_id = $1', [w]), 0);
  assert.equal(await one<number>('select count(*)::int as r from public.fo_contacts', []), 1);
});

test('activity feed: every channel in one history, newest first, keyset pages with no gaps or repeats', async () => {
  const { as, one, rows, w, ch, owner, so } = await setup();
  const SAM = '+61412345678';
  await as(null);
  const a = await one<{ contact: string }>('select public.fo_ingest_sms($1,$2,$3,$4,$5,$6,false,false) as r', [ch.sms, KEY, SAM, SMS, 'Hi', 'SM00000000000011']);
  await one('select public.fo_set_state($1,$2,$3,$4,$5,$6) as r', [ch.sms, KEY, a.contact, 'qualifying', 'setter', 'Asked about prices']);
  await one('select public.fo_voice_turn($1,$2,$3,$4,1,$5) as r', [ch.voice, KEY, 'call_00000011', SAM, 'Calling back']);
  await one('select public.fo_voice_end($1,$2,$3,$4,$5,$6,$7) as r', [ch.voice, KEY, 'call_00000011', SAM, 'customer-ended-call', 'Asked for a callback', null]);
  await one('select public.fo_ingest($1,$2,$3,$4,$5,false,false) as r', [ch.email, KEY, 'jo@example.com', 'Hello', 'em-00000011']);
  await as(owner, so);
  const page = async (before: number | null, limit: number) => {
    const raw = await rows<Record<string, unknown>>(`select to_jsonb(e) as r from (select ${ACTIVITY_COLUMNS} from public.fo_events where workspace_id = $1 and ($2::bigint is null or id < $2) order by id desc limit $3) e`, [w, before, limit + 1]);
    return { items: raw.slice(0, limit).map(r => activityFromRow(r as never)!), next: nextActivityCursor(raw as never, limit) };
  };
  const all = (await page(null, 200)).items;
  assert.ok(all.length >= 7, String(all.length));
  assert.ok(all.every(e => e !== null), 'every stored event maps to the contract');
  for (let i = 1; i < all.length; i++) assert.ok(all[i - 1].id > all[i].id, 'newest first');
  const kinds = new Set(all.map(e => e.kind));
  for (const k of ['created', 'inbound', 'state', 'call'] as const) assert.ok(kinds.has(k), k);
  assert.ok(all.some(e => e.detail === 'voice') && all.some(e => e.detail === 'sms') && all.some(e => e.detail === 'email'), 'SMS, call and email in one feed');
  const seen: number[] = [];
  let cursor: number | null = null;
  for (let n = 0; n < 10; n++) {
    const p = await page(cursor, 3);
    seen.push(...p.items.map(e => e.id));
    cursor = p.next;
    if (cursor === null) break;
  }
  assert.deepEqual(seen, all.map(e => e.id), 'pages join up exactly');
  const sams = (await page(null, 200)).items.filter(e => e.contactId === a.contact);
  assert.ok(sams.length >= 5 && sams.every(e => e.contactId === a.contact));
});
