// One customer record and one activity feed (task A-9): normalisation, read-side dedupe, the browser CRM import plan,
// activity mapping, and the two read routes over a fake Supabase.
import test from 'node:test';
import assert from 'node:assert/strict';
import { USER, W, call, configuredEnv, installFakeSupabase, setEnv } from './helpers/route-harness.ts';
// Dynamic imports: the harness's extension resolver must be registered before these modules link.
const { collapseDuplicates, contactFromRow, contactKeys, normaliseEmail, normalisePhone, parseContactsQuery, planLocalImport } = await import('../lib/front-office/crm.ts');
const { activityDigest, activityFromRow, describeActivity, parseActivityQuery } = await import('../lib/front-office/activity.ts');
const { parseActivityEvent, parseContact } = await import('../lib/front-office/contracts.ts');

const contacts = await import('../app/api/front-office/contacts/route.ts');
const activity = await import('../app/api/front-office/activity/route.ts');
const W2 = '99999999-9999-4999-8999-999999999999';
const cid = (n: number) => `aaaaaaaa-aaaa-4aaa-8aaa-${String(n).padStart(12, '0')}`;
const row = (n: number, extra: Record<string, unknown> = {}) => ({
  id: cid(n), workspace_id: W, name: null, phone: null, email: null, web_visitor: null, instagram_id: null, messenger_id: null,
  state: 'new', source: 'inbound', opted_out_at: null, answers: {}, created_at: `2026-11-0${n}T01:00:00.123456+00:00`, updated_at: `2026-11-0${n}T01:00:00+00:00`, ...extra,
});

test('phones: Australian local formats and E.164 give one key; junk is refused', () => {
  for (const p of ['+61412345678', '0412 345 678', '0412-345-678', '(04) 1234 5678', '61412345678', '0061 412 345 678', '+61 (0) 412 345 678', '+610412345678', '412345678', ' +61 412 345 678 '])
    assert.equal(normalisePhone(p), '+61412345678', p);
  assert.equal(normalisePhone('(02) 9876 5432'), '+61298765432');
  assert.equal(normalisePhone('1300 123 456'), '+611300123456');
  assert.equal(normalisePhone('+1 415 555 0100'), '+14155550100');
  assert.equal(normalisePhone('0044 20 7946 0958'), '+442079460958');
  for (const bad of ['', '12', 'call me', '+61 412 345 678 ext 2', '04123', '+0412345678', '++61412345678', '1'.repeat(50), null, 412345678]) assert.equal(normalisePhone(bad), null, String(bad));
});

test('emails: trimmed and lower case; invalid is null', () => {
  assert.equal(normaliseEmail('  Sam.Lee@Example.COM '), 'sam.lee@example.com');
  for (const bad of ['', 'sam', 'sam@', '@x.com', 'a b@x.com', 'x'.repeat(250) + '@x.com', undefined]) assert.equal(normaliseEmail(bad), null);
  assert.deepEqual(contactKeys({ phone: '0412 345 678', email: 'SAM@x.com', webVisitor: 'v'.repeat(20) }), ['phone:+61412345678', 'email:sam@x.com', 'visitor:' + 'v'.repeat(20)]);
});

test('contact rows map to the shared contract; bad rows are dropped', () => {
  const c = contactFromRow(row(1, { email: 'Sam@X.com', phone: '+61412345678', answers: { goal: 'strength', n: 3, deep: { x: 1 } }, opted_out_at: '2026-11-02T00:00:00+00:00' }));
  assert.ok(c);
  assert.equal(c.email, 'sam@x.com');
  assert.deepEqual(c.answers, { goal: 'strength', n: '3' }, 'only plain values; nested objects are not passed on');
  assert.equal(c.optedOut, true);
  assert.equal(parseContact(c).ok, true, 'what the route returns passes the UI validator');
  assert.equal(contactFromRow(row(1, { state: 'hacked' })), null);
  assert.equal(contactFromRow(row(1, { phone: '0412345678' })), null, 'a stored phone that is not E.164 is not shown half-formed');
  assert.equal(contactFromRow(row(1)), null, 'a contact with no way to reach them is not valid');
});

test('read-side dedupe: one person shown once, oldest record kept, opt-out wins, workspaces never mix', () => {
  const a = contactFromRow(row(1, { phone: '+61412345678', name: 'Sam' }))!;
  const b = contactFromRow(row(2, { email: 'sam@x.com', phone: null, web_visitor: 'visitor_abcdefghijkl', answers: { goal: 'fit' } }))!;
  const legacy = contactFromRow(row(3, { email: 'SAM@X.COM', phone: '+61412345678', opted_out_at: '2026-11-04T00:00:00+00:00' }))!;
  const other = contactFromRow(row(4, { phone: '+61412345678', workspace_id: W2 }))!;
  const out = collapseDuplicates([legacy, b, a, other]);
  assert.equal(out.length, 2, 'Sam across SMS, chat and email is one person; the other business keeps its own record');
  const sam = out.find(c => c.workspaceId === W)!;
  assert.equal(sam.id, a.id, 'the oldest record is kept');
  assert.equal(sam.email, 'sam@x.com'); assert.equal(sam.webVisitor, 'visitor_abcdefghijkl'); assert.equal(sam.answers.goal, 'fit');
  assert.equal(sam.optedOut, true, 'opted out on any record means opted out');
  assert.equal(out.find(c => c.workspaceId === W2)!.id, other.id);
  assert.equal(collapseDuplicates([b, a]).length, 2, 'without a shared phone or email nothing is guessed');
});

test('browser CRM import plan: matches by normalised phone then email, de-duplicates itself, writes nothing', () => {
  const existing = [{ id: cid(1), phone: '+61412345678', email: null }, { id: cid(2), phone: null, email: 'jo@x.com' }];
  const plan = planLocalImport([
    { id: 'l1', name: 'Sam', phone: '0412 345 678', email: '' },
    { id: 'l2', name: 'Jo', phone: '', email: ' JO@x.com' },
    { id: 'l3', name: ' Alex ', phone: '0499 000 111', email: 'alex@x.com', consentStatus: 'opted_out' },
    { id: 'l4', name: 'Alex again', phone: '', email: 'ALEX@x.com' },
    { id: 'l5', name: 'Nobody', phone: 'n/a', email: 'nope' },
  ], existing);
  assert.deepEqual(plan, [
    { action: 'match', localId: 'l1', contactId: cid(1), matchedOn: 'phone' },
    { action: 'match', localId: 'l2', contactId: cid(2), matchedOn: 'email' },
    { action: 'create', localId: 'l3', name: 'Alex', phone: '+61499000111', email: 'alex@x.com', optedOut: true },
    { action: 'same-as', localId: 'l4', sameAsLocalId: 'l3' },
    { action: 'skip', localId: 'l5', reason: 'No usable phone or email.' },
  ]);
});

test('contacts query: validated; phone and email searches are normalised; injection-shaped input refused', () => {
  const p = (s: string) => parseContactsQuery(new URLSearchParams(s));
  assert.deepEqual(p(''), { state: null, search: null, limit: 50, before: null });
  assert.deepEqual(p('q=0412 345 678').search, { column: 'phone', value: '+61412345678' });
  assert.deepEqual(p('q=Sam@X.com').search, { column: 'email', value: 'sam@x.com' });
  assert.deepEqual(p("q=O'Brien").search, { column: 'name', value: "O'Brien" });
  assert.equal(p('state=booked&limit=200').limit, 200);
  for (const bad of ['state=nope', 'limit=0', 'limit=201', 'limit=1.5', 'q=a,b', 'q=x)or(1', 'q=%25', 'q=bad@', 'before=2026-11-01T00:00:00Z', 'beforeId=' + cid(1), 'before=yesterday&beforeId=' + cid(1), 'before=2026-11-01T00:00:00Z&beforeId=nope'])
    assert.throws(() => p(bad), Error, bad);
});

test('activity rows map to the contract; unknown kinds dropped; lines say only what is stored', () => {
  const e = activityFromRow({ id: '42', contact_id: cid(1), kind: 'state', from_state: 'qualified', to_state: 'booked', agent: 'setter', detail: 'Booked', created_at: '2026-11-09T01:02:03+00:00' });
  assert.ok(e); assert.equal(e.id, 42); assert.equal(parseActivityEvent(e).ok, true);
  assert.equal(describeActivity(e), 'Moved qualified to booked by the Setter agent: Booked');
  assert.equal(activityFromRow({ id: 1, contact_id: cid(1), kind: 'evil', created_at: '2026-11-09T00:00:00Z' }), null);
  assert.equal(activityFromRow({ id: 0, contact_id: cid(1), kind: 'call', created_at: '2026-11-09T00:00:00Z' }), null);
  assert.equal(activityFromRow({ id: 2, contact_id: cid(1), kind: 'call', agent: 'robot', created_at: '2026-11-09T00:00:00Z' })?.agent, null);
  const lines = activityDigest([e, activityFromRow({ id: 41, contact_id: cid(1), kind: 'inbound', detail: 'sms', created_at: '2026-11-09T01:00:00Z' })!]);
  assert.deepEqual(lines, ['2026-11-09 01:00 UTC Message received (sms)', '2026-11-09 01:02 UTC Moved qualified to booked by the Setter agent: Booked']);
  assert.deepEqual(parseActivityQuery(new URLSearchParams('contact=' + cid(1).toUpperCase() + '&before=10&limit=5')), { contact: cid(1), limit: 5, before: 10 });
  for (const bad of ['contact=x', 'before=0', 'before=-1', 'before=1e3', 'limit=999']) assert.throws(() => parseActivityQuery(new URLSearchParams(bad)), Error, bad);
});

test('GET /api/front-office/contacts: 401 / 400 / 403 / 503, member gets Contact[] newest first with a cursor, read only', async () => {
  const restore = setEnv(configuredEnv);
  try {
    assert.equal((await call(contacts.GET, '/api/front-office/contacts?workspace=' + W, { cookie: null })).status, 401);
    let fake = installFakeSupabase();
    try {
      assert.equal((await call(contacts.GET, '/api/front-office/contacts')).status, 400);
      assert.equal((await call(contacts.GET, `/api/front-office/contacts?workspace=${W}&state=nope`)).status, 400);
      assert.equal(fake.calls.some(c => c.path === '/rest/v1/fo_contacts'), false);
    } finally { fake.restore(); }
    fake = installFakeSupabase({ tables: { memberships: [], fo_contacts: [row(1, { phone: '+61412345678' })] } });
    try {
      const r = await call(contacts.GET, '/api/front-office/contacts?workspace=' + W);
      assert.equal(r.status, 403); assert.equal(r.body.code, 'no_workspace_access'); assert.ok(!r.text.includes('+614'));
    } finally { fake.restore(); }
    fake = installFakeSupabase({ tables: { memberships: [{ user_id: USER }], fo_contacts: 'error' } });
    try { assert.equal((await call(contacts.GET, '/api/front-office/contacts?workspace=' + W)).status, 503); } finally { fake.restore(); }
    const rows = [row(3, { phone: '+61412345678' }), row(2, { email: 'jo@x.com' }), row(1, { email: 'al@x.com' }), row(1, { id: cid(9), workspace_id: W2, email: 'leak@x.com' })];
    fake = installFakeSupabase({ tables: { memberships: [{ user_id: USER }], fo_contacts: rows } });
    try {
      const r = await call(contacts.GET, `/api/front-office/contacts?workspace=${W}&limit=2&q=0412%20345%20678&state=new`);
      assert.equal(r.status, 200);
      assert.equal(r.headers.get('cache-control'), 'no-store, private');
      assert.deepEqual(r.body.items.map((c: { id: string }) => c.id), [cid(3), cid(2)]);
      assert.ok(r.body.items.every((c: unknown) => parseContact(c).ok));
      assert.deepEqual(r.body.next, { before: rows[1].created_at, beforeId: cid(2) });
      const q = fake.calls.find(c => c.path === '/rest/v1/fo_contacts')!;
      const s = new URLSearchParams(q.search);
      assert.equal(s.get('workspace_id'), 'eq.' + W, 'always filtered on the workspace, on top of RLS');
      assert.equal(s.get('phone'), 'eq.+61412345678', 'phone search is normalised to E.164');
      assert.equal(s.get('state'), 'eq.new');
      assert.equal(s.get('limit'), '3');
      assert.ok(fake.calls.filter(c => c.path.startsWith('/rest/v1/fo_')).every(c => c.method === 'GET'), 'read only');
      const page2 = await call(contacts.GET, `/api/front-office/contacts?workspace=${W}&before=${encodeURIComponent(rows[1].created_at)}&beforeId=${cid(2)}&q=Jo`);
      assert.equal(page2.status, 200);
      const s2 = new URLSearchParams(fake.calls.filter(c => c.path === '/rest/v1/fo_contacts').at(-1)!.search);
      assert.equal(s2.get('or'), `(created_at.lt."${rows[1].created_at}",and(created_at.eq."${rows[1].created_at}",id.lt.${cid(2)}))`);
      assert.equal(s2.get('name'), 'ilike.*Jo*');
      assert.ok(!page2.text.includes('leak@x.com'), 'a row of another workspace is never returned even if storage sent one');
      assert.equal(page2.body.next, null);
    } finally { fake.restore(); }
  } finally { restore(); }
});

test('GET /api/front-office/activity: one feed newest first, paged by id, per contact or whole workspace', async () => {
  const restore = setEnv(configuredEnv);
  const ev = (id: number, kind = 'inbound') => ({ id, contact_id: cid(1), kind, from_state: null, to_state: null, agent: null, detail: 'sms', created_at: '2026-11-09T01:00:00+00:00' });
  try {
    assert.equal((await call(activity.GET, '/api/front-office/activity?workspace=' + W, { cookie: null })).status, 401);
    let fake = installFakeSupabase({ tables: { memberships: [] } });
    try {
      assert.equal((await call(activity.GET, '/api/front-office/activity?workspace=' + W)).status, 403);
      assert.equal((await call(activity.GET, `/api/front-office/activity?workspace=${W}&contact=nope`)).status, 400);
      assert.equal((await call(activity.GET, `/api/front-office/activity?workspace=${W}&before=abc`)).status, 400);
    } finally { fake.restore(); }
    fake = installFakeSupabase({ tables: { memberships: [{ user_id: USER }], fo_events: 'error' } });
    try { assert.equal((await call(activity.GET, '/api/front-office/activity?workspace=' + W)).status, 503); } finally { fake.restore(); }
    fake = installFakeSupabase({ tables: { memberships: [{ user_id: USER }], fo_events: [ev(9, 'call'), ev(8, 'bogus'), ev(7)] } });
    try {
      const r = await call(activity.GET, `/api/front-office/activity?workspace=${W}&contact=${cid(1)}&limit=2&before=10`);
      assert.equal(r.status, 200);
      assert.deepEqual(r.body.items.map((e: { id: number }) => e.id), [9], 'a row the contract does not know is dropped');
      assert.ok(r.body.items.every((e: unknown) => parseActivityEvent(e).ok));
      assert.equal(r.body.next, 8, 'the cursor follows the raw rows, so paging never stops early');
      const s = new URLSearchParams(fake.calls.find(c => c.path === '/rest/v1/fo_events')!.search);
      assert.equal(s.get('workspace_id'), 'eq.' + W);
      assert.equal(s.get('contact_id'), 'eq.' + cid(1));
      assert.equal(s.get('id'), 'lt.10');
      assert.equal(s.get('order'), 'id.desc');
      assert.equal(s.get('limit'), '3');
      const all = await call(activity.GET, '/api/front-office/activity?workspace=' + W);
      assert.equal(all.body.items.length, 2); assert.equal(all.body.next, null);
      assert.ok(fake.calls.filter(c => c.path.startsWith('/rest/v1/fo_')).every(c => c.method === 'GET'), 'read only');
    } finally { fake.restore(); }
  } finally { restore(); }
});
