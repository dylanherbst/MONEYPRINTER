'use client';
import { useState, useTransition } from 'react';
import { decideAction, sendMessage, startLab } from './actions';
import type { LabResult } from './actions';
import type { LabState } from '../../../lib/front-office/setter/lab';
import type { OperatingMode } from '../../../lib/front-office/contracts';

// Plain functional markup on purpose (no design system): this is a test page, not product UI.
const MODES: { id: OperatingMode; label: string }[] = [
  { id: 'automatic', label: 'Automatic (perform)' },
  { id: 'owner_approval', label: 'Owner approval (held for approval)' },
  { id: 'enquiry_only', label: 'Enquiry only (refused, message taken)' },
];
const json = (v: unknown) => JSON.stringify(v, null, 2);

export default function SetterLab({ initial }: { initial: LabState }) {
  const [state, setState] = useState<LabState>(initial);
  const [mode, setMode] = useState<OperatingMode>(initial.mode);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const apply = (r: LabResult) => { setError(r.error); if (r.state) setState(r.state); };
  const run = (f: () => Promise<LabResult>) => start(async () => { try { apply(await f()); } catch { setError('The lab could not reach the server.'); } });
  const contact = state.tables.contacts[0] ?? null;
  const held = state.pending;

  return <main>
    <h1>Setter Test Lab</h1>
    <p><strong data-testid="page-mode">DEMO</strong> Runs your messages through the real AI Setter pipeline (inbound router, Setter tools, booking, permission check) with an in-memory store and calendar. Nothing is sent, nothing is booked in a real calendar, nothing is written to Supabase. No sign-in; signed-in local Supabase mode is not built.</p>

    <h2>Connection state</h2>
    <ul data-testid="connections">
      <li>Model: <strong>SCRIPTED</strong> (keyword rules). Real model: off in the lab (scripted only).</li>
      <li>Store: <strong>IN-MEMORY</strong> (this page only; reload or New conversation clears it)</li>
      <li>Channel: <strong>LAB</strong> (SMS shape, nothing sent)</li>
      <li>Calendar: <strong>IN-MEMORY</strong></li>
    </ul>

    <fieldset>
      <legend>Settings</legend>
      <p>Operating mode for the Setter:{' '}
        {MODES.map(m => <label key={m.id}><input type="radio" name="mode" value={m.id} checked={mode === m.id} onChange={() => setMode(m.id)} /> {m.label} </label>)}
      </p>
      <p data-testid="gate-note">Booking permission check shown here is the intended wiring; the production Setter does not call it yet (task A-8).</p>
      <button type="button" disabled={pending} onClick={() => { setMessage(''); run(() => startLab(mode)); }}>New conversation</button>
    </fieldset>

    <form onSubmit={e => { e.preventDefault(); const m = message; setMessage(''); run(() => sendMessage(state, m, mode)); }}>
      <label htmlFor="msg">Customer says</label><br />
      <textarea id="msg" rows={3} cols={80} maxLength={1000} value={message} onChange={e => setMessage(e.target.value)} placeholder="Hi, I'm Sam. I run a gym in Fremantle. We get about 40 enquiries a week. We are slow to reply. I want it fixed this week." /><br />
      <button type="submit" disabled={pending || !message.trim()}>{pending ? 'Running…' : 'Send'}</button>
    </form>
    <p>Try: a message with your business, enquiries a week, the problem and timing; then “the first one”. Mention price or a refund to see a hand-off to a person.</p>
    {error && <p role="alert">{error}</p>}

    <h2>Lead (CRM, in memory)</h2>
    <p data-testid="lead">{contact ? <>Contact id <code>{contact.id}</code>, lead status <strong>{contact.state}</strong>{contact.optedOut ? ', opted out' : ''}, name {contact.name ?? 'unknown'}, phone {contact.phone}</> : 'No contact yet.'}</p>

    <h2>Held for owner approval</h2>
    {held.length === 0 ? <p>Nothing in the queue.</p> : <table data-testid="pending">
      <thead><tr><th>Summary</th><th>Status</th><th>Note</th><th>Owner</th></tr></thead>
      <tbody>{held.map(a => <tr key={a.id}>
        <td>{a.summary}</td><td>{a.status}</td><td>{a.note ?? ''}</td>
        <td>{a.status === 'pending' ? <>
          <button type="button" disabled={pending} onClick={() => run(() => decideAction(state, a.id, 'approve'))}>Approve</button>{' '}
          <button type="button" disabled={pending} onClick={() => run(() => decideAction(state, a.id, 'reject'))}>Reject</button>
        </> : 'decided'}</td>
      </tr>)}</tbody>
    </table>}
    {state.decisions.length > 0 && <ul>{state.decisions.map((d, i) => <li key={i}>{d.decision}: <strong>{d.outcome}</strong>{d.note ? ` (${d.note})` : ''}. Writes: {d.writes.map(w => `${w.rpc}: ${w.detail}`).join('; ') || 'none'}</li>)}</ul>}

    <h2>Turns</h2>
    {state.turns.length === 0 && <p>No messages yet.</p>}
    {[...state.turns].reverse().map(t => <section key={t.n} data-testid="turn">
      <h3>Turn {t.n} ({t.model} model)</h3>
      <p><strong>Customer:</strong> {t.customer}</p>
      <p><strong>AI reply:</strong> {t.reply ?? '(no reply)'}</p>
      {t.error && <p role="alert">Turn failed: {t.error}</p>}
      <ul>
        <li>Route: {t.route || 'none'}</li>
        <li>Qualification: lead status <strong>{t.state ?? 'unknown'}</strong>; still needed: {t.missing.join(', ') || 'nothing'}</li>
        <li>Detected: business {t.detected.business ?? 'not yet'}; needs {t.detected.needs ?? 'not yet'}; timing {t.detected.timing ?? 'not yet'}; budget {t.detected.budget}</li>
        <li>Objection handling: {t.objection}</li>
        <li>Recommended offer: {t.offer}</li>
        <li>Handed to: {t.handedTo ?? 'nobody'}</li>
        <li>Booking proposal: {t.booking ? <><strong>{t.booking.decision}</strong> ({t.booking.mode}) for {t.booking.label}. {t.booking.reason}{t.booking.booked !== null ? ` Booked by the pipeline: ${t.booking.booked ? 'yes' : 'no'}.` : ''}{t.booking.pendingId ? ' Held in the queue above.' : ''}</> : 'none'}</li>
      </ul>
      <details><summary>Tool calls ({t.tools.length})</summary><pre>{json(t.tools)}</pre></details>
      <details><summary>CRM writes ({t.writes.length})</summary><ol>{t.writes.map((w, i) => <li key={i}>{w.rpc}: {w.detail}</li>)}</ol></details>
    </section>)}

    <h2>Raw in-memory tables</h2>
    <details><summary>Tables, calendar and would-have-sent</summary><pre>{json({ tables: state.tables, calendar: state.calendar, wouldSend: state.wouldSend })}</pre></details>
  </main>;
}
