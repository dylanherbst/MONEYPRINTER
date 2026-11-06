// Scripted Setter test set (tracker 1.10): happy path, angry customer, wrong number, existing customer, discount ask,
// plus the guardrails. The model is scripted, so these check that every case ends in the right state with the right
// records; scripts/... live replay against the real model is listed in docs/agents/OWNER_TODO.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import './helpers/route-harness.ts';

const { runSetterTurn, transcript } = await import('../lib/front-office/setter/agent.ts');
const { ventraSetterConfig, checkedSetterConfig, fillTemplate } = await import('../lib/front-office/setter/config.ts');
const { SETTER_PROMPT_VERSION, setterSystemPrompt } = await import('../lib/front-office/setter/prompt.ts');
const { runDueJobs, markNoShow, gapBefore, bearerMatches } = await import('../lib/front-office/jobs.ts');
const { canTransition } = await import('../lib/front-office/state.ts');
const { anthropicLlm, anthropicConfigFromEnv } = await import('../lib/front-office/llm.ts');
type Llm = import('../lib/front-office/llm.ts').Llm;
type Block = import('../lib/front-office/llm.ts').Block;

const NOW = Date.parse('2026-11-09T00:30:00Z'); // Monday 8:30 am Perth
const auth = { channel: 'ch', key: 'k'.repeat(40) };

/** In-memory stand-in for the fo_* RPCs with the same rules (state machine, opt-out, one pending ladder). */
function store(state = 'new', messages: { direction: 'inbound' | 'outbound'; body: string }[] = [{ direction: 'inbound', body: 'Hi, saw your ad' }]) {
  const db = {
    contact: { id: 'c1', name: null as string | null, phone: '+61411111111', email: null as string | null, state, optedOut: false, answers: {} as Record<string, string> },
    messages: messages.map(m => ({ ...m, agent: null, at: '' })),
    appointment: null as null | { id: string; starts: string; ends: string; status: string },
    handoffs: [] as Record<string, unknown>[], outbound: [] as { message: string; prompt: string }[],
    jobs: [] as { id: string; contact: string; kind: string; step: number; appointment: string | null; due: string; status: string }[],
    states: [state] as string[],
  };
  const rpc = async (fn: string, a: Record<string, unknown>): Promise<unknown> => {
    switch (fn) {
      case 'fo_contact_context': return structuredClone({ contact: db.contact, messages: db.messages, appointment: db.appointment, handoffs: db.handoffs });
      case 'fo_save_answers': Object.assign(db.contact.answers, a.new_answers); if (a.contact_name) db.contact.name = a.contact_name as string; if (a.contact_email) db.contact.email = a.contact_email as string; return { ...db.contact.answers };
      case 'fo_set_state':
        if (!canTransition(db.contact.state as never, a.new_state as never)) throw new Error(`Contact cannot move from ${db.contact.state} to ${a.new_state}.`);
        db.contact.state = a.new_state as string; db.states.push(db.contact.state); return db.contact.state;
      case 'fo_record_handoff': db.handoffs.push(a.handoff as Record<string, unknown>); return 'h' + db.handoffs.length;
      case 'fo_log_outbound':
        if (db.contact.optedOut) throw new Error('Contact opted out.');
        if (!a.prompt) throw new Error('prompt version required');
        db.outbound.push({ message: a.message as string, prompt: a.prompt as string }); return 'm';
      case 'fo_schedule_job':
        if (a.job_kind === 'follow-up' || a.job_kind === 'no-show-rescue') for (const j of db.jobs) if (j.kind === a.job_kind && j.status === 'pending') j.status = 'cancelled';
        db.jobs.push({ id: 'j' + db.jobs.length, contact: a.contact as string, kind: a.job_kind as string, step: a.job_step as number, appointment: a.appointment as string | null, due: a.due as string, status: 'pending' }); return 'j';
      case 'fo_booking_for_event': return null;
      case 'fo_book':
        if (!canTransition(db.contact.state as never, 'booked')) throw new Error('cannot book');
        db.contact.state = 'booked'; db.states.push('booked');
        db.appointment = { id: 'appt-1', starts: a.starts as string, ends: a.ends as string, status: 'booked' };
        return { appointment: 'appt-1', state: 'booked', duplicate: false };
      case 'fo_claim_jobs': { const due = db.jobs.filter(j => j.status === 'pending' && Date.parse(j.due) <= (a.__now as number ?? Infinity)); due.forEach(j => { j.status = 'running'; }); return due.map(j => ({ ...j })); }
      case 'fo_finish_job': { const j = db.jobs.find(x => x.id === a.job); if (j) j.status = a.outcome as string; return null; }
      default: throw new Error('unknown rpc ' + fn);
    }
  };
  return { db, rpc };
}
/** A model that plays back a script: each step is the assistant content for one round. */
function scripted(steps: Block[][]): { llm: Llm; seen: string[] } {
  const seen: string[] = []; let i = 0;
  const llm: Llm = async (req) => {
    const last = req.messages.at(-1);
    seen.push(typeof last?.content === 'string' ? last.content : JSON.stringify(last?.content));
    const content = steps[Math.min(i++, steps.length - 1)];
    return { content, stopReason: content.some(b => b.type === 'tool_use') ? 'tool_use' : 'end_turn' };
  };
  return { llm, seen };
}
const tool = (name: string, input: Record<string, unknown>, id = name): Block => ({ type: 'tool_use', id, name, input });
const say = (text: string): Block => ({ type: 'text', text });
const calendar = { busy: async () => [], createEvent: async (e: { id: string }) => ({ id: e.id, htmlLink: null, existed: false }), hasEvent: async () => false };
const deps = (llm: Llm, rpc: (fn: string, a: Record<string, unknown>) => Promise<unknown>) => ({ llm, rpc, auth, calendar, send: async () => ({ sent: false, sid: null }), config: ventraSetterConfig, now: NOW });

test('config and prompt: Ventra defaults are valid; the prompt carries the rules and the questions', () => {
  assert.doesNotThrow(() => checkedSetterConfig(ventraSetterConfig));
  assert.throws(() => checkedSetterConfig({ ...ventraSetterConfig, questions: ventraSetterConfig.questions.slice(0, 2) }), /3 to 5/);
  const p = setterSystemPrompt(ventraSetterConfig, 'Mon 9 Nov, 8:30 am');
  for (const must of ['AI assistant', 'Never invent a time', 'escalate_human', 'handoff_receptionist', 'lead_flow', 'under 300 characters']) assert.ok(p.includes(must), must);
  assert.equal(fillTemplate('Hi {name}, {meeting} at {time}', { name: 'Sam Lee', meeting: 'call', time: '4 pm' }), 'Hi Sam, call at 4 pm');
  assert.equal(fillTemplate('Hi {name}!', { name: null }), 'Hi there!');
});
test('transcript: alternating turns, a user turn first and last', () => {
  const t = transcript([{ direction: 'outbound', body: 'Hi from Ventra', agent: 'setter', at: '' }, { direction: 'inbound', body: 'hey', agent: null, at: '' }, { direction: 'inbound', body: 'who is this', agent: null, at: '' }]);
  assert.deepEqual(t.map(m => m.role), ['user', 'assistant', 'user']);
  assert.equal(t[2].content, 'hey\nwho is this');
});
test('scenario happy path: qualify, offer real times, book; Sales gets the handoff; reminders scheduled; no follow-up', async () => {
  const { db, rpc } = store();
  const answers = { business: 'Gym in Joondalup', lead_flow: '40 a week from Instagram', problem: 'Slow replies at night', timing: 'This month' };
  const { llm } = scripted([
    [tool('save_answers', { answers, name: 'Sam Lee' }), tool('set_stage', { stage: 'qualified', reason: 'Good fit' }, 's2')],
    [tool('offer_times', {})],
    [tool('book_time', { start: '2026-11-10T01:00:00.000Z' })],
    [say('should not be used')],
  ]);
  const turn = await runSetterTurn('c1', deps(llm, rpc));
  assert.equal(turn.booked, true); assert.equal(turn.state, 'booked');
  assert.deepEqual(db.states, ['new', 'qualifying', 'qualified', 'booked'], 'passes through qualifying');
  assert.match(turn.reply ?? '', /booked with Ventra for Tue, 10 Nov, 9:00 am/);
  assert.equal(db.handoffs.length, 1); assert.equal(db.handoffs[0].owner, 'sales'); assert.deepEqual(db.handoffs[0].answers, answers);
  assert.deepEqual(db.jobs.map(j => [j.kind, j.due]), [['reminder-24h', '2026-11-09T01:00:00.000Z'], ['reminder-2h', '2026-11-09T23:00:00.000Z']], 'both reminders, no follow-up ladder');
  assert.equal(db.outbound.length, 1); assert.equal(db.outbound[0].prompt, 'setter/booking-confirmation@1');
});
test('scenario angry customer: no selling, a person is asked to follow up', async () => {
  const { db, rpc } = store('contacted', [{ direction: 'inbound', body: 'Stop wasting my time, your last guy never called back!!' }]);
  const { llm } = scripted([[tool('escalate_human', { intent: 'complaint about no callback', summary: 'Upset nobody called back' })], [say('Sorry about that. A person from Ventra will call you today.')]]);
  const turn = await runSetterTurn('c1', deps(llm, rpc));
  assert.equal(turn.handedTo, 'human'); assert.equal(db.handoffs[0].owner, 'human');
  assert.equal(db.outbound[0].prompt, SETTER_PROMPT_VERSION);
  assert.equal(db.jobs.length, 0, 'no automatic nudges after a hand to a person');
});
test('scenario wrong number: disqualified, polite, no follow-ups', async () => {
  const { db, rpc } = store('new', [{ direction: 'inbound', body: 'Who is this? Wrong number' }]);
  const { llm } = scripted([[tool('set_stage', { stage: 'disqualified', reason: 'Wrong number' })], [say('Sorry for the mix-up. We will not message again.')]]);
  const turn = await runSetterTurn('c1', deps(llm, rpc));
  assert.equal(turn.state, 'disqualified'); assert.equal(db.jobs.length, 0);
});
test('scenario existing customer on the sales line: handed to the Receptionist', async () => {
  const { db, rpc } = store('new', [{ direction: 'inbound', body: 'I am already a client, my AI stopped replying' }]);
  const { llm } = scripted([[tool('handoff_receptionist', { intent: 'support: AI not replying', summary: 'Existing client reports an outage' })], [say('Thanks, passing this to our support team now.')]]);
  const turn = await runSetterTurn('c1', deps(llm, rpc));
  assert.equal(turn.handedTo, 'receptionist'); assert.equal(db.handoffs[0].from, 'setter');
});
test('scenario discount ask: never invents terms, escalates', async () => {
  const { rpc } = store('qualifying', [{ direction: 'inbound', body: 'Can I get 50% off if I sign today?' }]);
  const { llm } = scripted([[tool('escalate_human', { intent: 'discount request', summary: 'Asked for 50% off' })], [say('A person from Ventra will come back to you on pricing.')]]);
  const turn = await runSetterTurn('c1', deps(llm, rpc));
  assert.equal(turn.handedTo, 'human'); assert.doesNotMatch(turn.reply ?? '', /\d+%/);
});
test('guardrails: no qualified without answers, no booking of an invented time, opted-out and customers get no turn, follow-up starts after a reply', async () => {
  let s = store();
  let r = scripted([[tool('set_stage', { stage: 'qualified', reason: 'x' }), tool('book_time', { start: '2026-11-09T03:17:00.000Z' }, 'b')], [say('What kind of business do you run?')]]);
  let turn = await runSetterTurn('c1', deps(r.llm, s.rpc));
  assert.equal(turn.booked, false); assert.equal(s.db.contact.state, 'new');
  assert.equal(turn.reply, 'What kind of business do you run?');
  assert.deepEqual(s.db.jobs.map(j => [j.kind, j.step, j.due]), [['follow-up', 1, new Date(NOW + 5 * 60_000).toISOString()]]);
  s = store(); s.db.contact.optedOut = true;
  r = scripted([[say('hello')]]);
  turn = await runSetterTurn('c1', deps(r.llm, s.rpc));
  assert.equal(turn.reply, null); assert.equal(r.seen.length, 0, 'model never called');
  s = store('customer');
  turn = await runSetterTurn('c1', deps(scripted([[say('hi')]]).llm, s.rpc));
  assert.equal(turn.reply, null, 'customers belong to the Receptionist');
});
test('jobs: ladder steps and stops; reminders only while booked; rescue only for no-shows; failures recorded', async () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(gapBefore), [300_000, 3_300_000, 82_800_000, 172_800_000, 345_600_000, 2_592_000_000]);
  const s = store('qualifying');
  const claimAll = async (fn: string, a: Record<string, unknown>) => s.rpc(fn, fn === 'fo_claim_jobs' ? { ...a, __now: Infinity } : a);
  s.db.jobs.push({ id: 'f1', contact: 'c1', kind: 'follow-up', step: 1, appointment: null, due: new Date(NOW).toISOString(), status: 'pending' });
  const sent: string[] = [];
  let out = await runDueJobs({ rpc: claimAll, auth, send: async (_to, b) => { sent.push(b); return { sent: true, sid: 'x' }; }, config: ventraSetterConfig, now: NOW });
  assert.equal(out[0].outcome, 'done'); assert.equal(sent.length, 1); assert.match(sent[0], /^Hi there, just checking/);
  assert.equal(s.db.outbound[0].prompt, 'setter/follow-up@1');
  assert.deepEqual(s.db.jobs.filter(j => j.status === 'pending').map(j => j.step), [2]);
  s.db.contact.state = 'booked';
  out = await runDueJobs({ rpc: claimAll, auth, send: async () => ({ sent: true, sid: 'x' }), config: ventraSetterConfig, now: NOW });
  assert.equal(out[0].outcome, 'cancelled', 'booked contacts get no ladder');
  s.db.appointment = { id: 'appt-1', starts: '2026-11-10T02:00:00Z', ends: '2026-11-10T02:30:00Z', status: 'booked' };
  s.db.jobs.push({ id: 'r1', contact: 'c1', kind: 'reminder-24h', step: 1, appointment: 'appt-1', due: '2026-11-09T02:00:00Z', status: 'pending' });
  s.db.jobs.push({ id: 'r2', contact: 'c1', kind: 'reminder-2h', step: 1, appointment: 'appt-old', due: '2026-11-10T00:00:00Z', status: 'pending' });
  out = await runDueJobs({ rpc: claimAll, auth, send: async (_t, b) => { sent.push(b); return { sent: false, sid: null }; }, config: ventraSetterConfig, now: NOW });
  assert.deepEqual(out.map(o => o.outcome), ['done', 'cancelled']);
  assert.match(sent.at(-1) ?? '', /tomorrow at Tue, 10 Nov, 10:00 am/); assert.equal(out[0].note, 'Logged (live sending off)');
  await markNoShow(s.rpc, auth, 'c1', NOW);
  assert.equal(s.db.contact.state, 'no-show');
  out = await runDueJobs({ rpc: claimAll, auth, send: async () => ({ sent: true, sid: 'x' }), config: ventraSetterConfig, now: NOW });
  assert.equal(out[0].kind, 'no-show-rescue'); assert.equal(out[0].outcome, 'done');
  s.db.contact.optedOut = true;
  s.db.jobs.push({ id: 'f9', contact: 'c1', kind: 'follow-up', step: 1, appointment: null, due: new Date(NOW).toISOString(), status: 'pending' });
  out = await runDueJobs({ rpc: claimAll, auth, send: async () => ({ sent: true, sid: 'x' }), config: ventraSetterConfig, now: NOW });
  assert.ok(out.every(o => o.outcome === 'cancelled'), 'opted out: nothing sent');
  assert.equal(bearerMatches('Bearer ' + 's'.repeat(32), 's'.repeat(32)), true);
  assert.equal(bearerMatches('Bearer nope', 's'.repeat(32)), false);
  assert.equal(bearerMatches(null, 's'.repeat(32)), false);
});
test('anthropic client: needs key and model; sends the documented request; errors carry no key', async () => {
  assert.equal(anthropicConfigFromEnv({ ANTHROPIC_API_KEY: 'k' }), null, 'no guessed model');
  let seen: { url: string; headers: Record<string, string>; body: Record<string, unknown> } | null = null;
  const llm = anthropicLlm({ apiKey: 'sk-test', model: 'model-x' }, (async (u: RequestInfo | URL, init?: RequestInit) => {
    seen = { url: String(u), headers: init?.headers as Record<string, string>, body: JSON.parse(String(init?.body)) };
    return new Response(JSON.stringify({ content: [{ type: 'text', text: 'Hi' }], stop_reason: 'end_turn' }), { status: 200 });
  }) as typeof fetch);
  const r = await llm({ system: 's', messages: [{ role: 'user', content: 'hi' }], tools: [] });
  assert.equal(r.stopReason, 'end_turn');
  assert.equal(seen!.url, 'https://api.anthropic.com/v1/messages'); assert.equal(seen!.headers['anthropic-version'], '2023-06-01'); assert.equal(seen!.body.model, 'model-x');
  const bad = anthropicLlm({ apiKey: 'sk-secret', model: 'm' }, (async () => new Response('{}', { status: 401 })) as typeof fetch);
  await assert.rejects(bad({ system: 's', messages: [], tools: [] }), (e: Error) => /401/.test(e.message) && !/sk-secret/.test(e.message));
});
