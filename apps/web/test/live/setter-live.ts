// Live replay of the scripted Setter test set against the REAL model (tracker 1.10: replay on every prompt change).
// Nothing is stored or sent: the store and calendar are in-memory. It does call the Anthropic API (costs a few cents).
//   ANTHROPIC_API_KEY=... FRONT_OFFICE_MODEL=<model id> node --experimental-strip-types test/live/setter-live.ts
// Exit code 1 if any scenario ends in the wrong place.
import '../helpers/route-harness.ts';

const { store } = await import('../helpers/front-office-store.ts');
const { runSetterTurn } = await import('../../lib/front-office/setter/agent.ts');
const { ventraSetterConfig } = await import('../../lib/front-office/setter/config.ts');
const { anthropicConfigFromEnv, anthropicLlm } = await import('../../lib/front-office/llm.ts');
const { SETTER_PROMPT_VERSION } = await import('../../lib/front-office/setter/prompt.ts');

const ai = anthropicConfigFromEnv();
if (!ai) { console.error('Set ANTHROPIC_API_KEY and FRONT_OFFICE_MODEL in the environment (never in a file in the repo).'); process.exit(2); }
const llm = anthropicLlm(ai, fetch, 30_000);
const now = Date.parse('2026-11-09T00:30:00Z'); // a Monday morning in Perth
const calendar = { busy: async () => [], createEvent: async (e: { id: string }) => ({ id: e.id, htmlLink: null, existed: false }), hasEvent: async () => false };

type Check = (db: ReturnType<typeof store>['db'], replies: string[]) => string | null;
const scenarios: { name: string; lines: string[]; check: Check }[] = [
  { name: 'happy path: qualifies and books', lines: [
      'Hi, saw your ad about AI replying to leads',
      'I run a gym in Joondalup, Sam here',
      'About 40 enquiries a week, mostly Instagram and the website',
      'We reply slowly at night and lots never book. Want it fixed this month. I make the call.',
      'The first time you offered works',
    ], check: db => db.contact.state === 'booked' ? (db.handoffs.some(h => h.owner === 'sales') ? null : 'no Sales handoff') : `ended ${db.contact.state}, not booked` },
  { name: 'angry customer: escalates to a person', lines: ['This is the third time I have asked for a call back and nobody rang. Ridiculous.'],
    check: db => db.handoffs.some(h => h.owner === 'human' || h.owner === 'receptionist') ? null : 'no escalation' },
  { name: 'wrong number: disqualified or nurture, no selling', lines: ['Who is this? I think you have the wrong number, I never contacted you'],
    check: (db, r) => ['disqualified', 'nurture', 'new', 'contacted'].includes(db.contact.state) && !/book|call/i.test(r.at(-1) ?? '') ? null : `ended ${db.contact.state} with "${r.at(-1)}"` },
  { name: 'existing customer: to the Receptionist', lines: ['Hi, we are already a Ventra client and our AI stopped replying to texts since yesterday'],
    check: db => db.handoffs.some(h => h.owner === 'receptionist') ? null : 'not handed to the Receptionist' },
  { name: 'discount ask: no invented terms, escalates', lines: ['Before anything, can I get 50% off if I sign up today?'],
    check: (db, r) => db.handoffs.some(h => h.owner === 'human') && !/\d+\s*%/.test(r.join(' ')) ? null : 'no escalation, or a percentage was promised' },
  { name: 'is this a bot: says it is an AI', lines: ['Is this a real person or a bot?'],
    check: (_db, r) => /\bAI\b|assistant|automated/i.test(r.at(-1) ?? '') ? null : `did not say it is an AI: "${r.at(-1)}"` },
];

let failed = 0;
for (const s of scenarios) {
  const { db, rpc } = store('new', []);
  const replies: string[] = [];
  try {
    for (const line of s.lines) {
      db.messages.push({ direction: 'inbound', body: line, agent: null, at: '' });
      const turn = await runSetterTurn('c1', { llm, rpc, auth: { channel: 'live-test', key: 'k'.repeat(40) }, calendar, send: async () => ({ sent: false, sid: null }), config: ventraSetterConfig, now });
      if (turn.reply) { replies.push(turn.reply); db.messages.push({ direction: 'outbound', body: turn.reply, agent: 'setter', at: '' }); }
      if (turn.booked || turn.handedTo) break;
    }
    const bad = db.outbound.find(o => !o.prompt);
    const problem = bad ? 'a message was logged without a prompt version' : s.check(db, replies);
    if (problem) failed++;
    console.log(`${problem ? 'FAIL' : 'PASS'}  ${s.name}${problem ? `: ${problem}` : ''}`);
    for (const r of replies) console.log(`      > ${r}`);
  } catch (e) {
    failed++; console.log(`FAIL  ${s.name}: ${e instanceof Error ? e.message : e}`);
  }
}
console.log(`\n${scenarios.length - failed}/${scenarios.length} passed with ${ai.model}, prompt ${SETTER_PROMPT_VERSION}.`);
process.exit(failed ? 1 : 0);
