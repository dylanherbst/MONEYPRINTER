'use client';
import { useState } from 'react';
import { inboxAction, saveConfigAction, simulateAction } from './actions';
import type { SetterView } from './view';
import './setter.css';

type Tab = 'inbox' | 'setup' | 'results';
const dollars = (c: number) => (c / 100).toString();

export function SetterClient({ business, initial }: { business: string; initial: SetterView }) {
  const [v, setV] = useState(initial);
  const [tab, setTab] = useState<Tab>('inbox');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState('');
  const [person, setPerson] = useState<'a' | 'b'>('a');
  const [open, setOpen] = useState<string | null>(initial.conversations[0]?.id ?? null);
  const [edit, setEdit] = useState<Record<string, string>>({});
  const [reply, setReply] = useState('');
  const c = v.config;
  const [form, setForm] = useState({
    businessName: c.businessName, idealCustomer: c.idealCustomer, brandVoice: c.brandVoice, qualifyingQuestion: c.qualifyingQuestion, refundPolicy: c.refundPolicy,
    bookingUrl: c.bookingUrl, discloseAi: c.discloseAi, prohibitedClaims: c.prohibitedClaims.join('\n'), mode: c.mode, paused: c.paused, confirmAuto: false,
    offers: c.offers.map((o) => ({ name: o.name, description: o.description, price: dollars(o.priceMinor), ctaUrl: o.ctaUrl })),
    knowledge: c.knowledge.map((k) => ({ question: k.question, answer: k.answer })),
  });
  const run = async <T extends { view: SetterView | null }>(p: Promise<T>, say: (r: T) => string) => {
    setBusy(true); const r = await p; setBusy(false); if (r.view) setV(r.view); setMsg(say(r)); return r;
  };
  const conv = v.conversations.find((x) => x.id === open) ?? null;

  return (
    <div className="st-setter">
      <nav className="st-tabs" aria-label="AI Setter">
        {(['inbox', 'setup', 'results'] as const).map((t) => <button key={t} type="button" aria-pressed={tab === t} onClick={() => setTab(t)}>{t === 'inbox' ? 'Inbox and test' : t === 'setup' ? 'Setup' : 'Results'}</button>)}
      </nav>
      <div className="st-status">
        <span>Mode: <strong>{c.mode === 'auto' ? 'Automatic replies' : c.mode === 'off' ? 'Off' : 'Drafts only'}</strong>{c.paused ? ' (paused)' : ''}</span>
        <span className="st-row">
        <button type="button" disabled={busy} onClick={async () => { await run(inboxAction(business, { kind: 'reset' }), (r) => r.message); setOpen(null); setEdit({}); }}>Reset test messages</button>
        <button type="button" className={v.killSwitch ? 'st-on' : 'st-danger'} disabled={busy} onClick={() => run(inboxAction(business, { kind: 'kill', on: !v.killSwitch }), (r) => r.message)}>{v.killSwitch ? 'Allow sending again' : 'Stop all sending'}</button>
        </span>
      </div>
      {msg ? <p role="status" className="st-msg">{msg}</p> : null}

      {tab === 'inbox' ? (
        <section className="st-grid">
          <div className="st-card">
            <h2>Pretend to be a customer</h2>
            <p className="st-muted">Sends a simulated, signed Instagram message through the real pipeline.</p>
            <div className="st-row"><label><input type="radio" checked={person === 'a'} onChange={() => setPerson('a')} /> Person A</label><label><input type="radio" checked={person === 'b'} onChange={() => setPerson('b')} /> Person B</label></div>
            <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder='e.g. "how much is the lamp?", "how long is shipping?" or "stop"' />
            <button type="button" className="st-primary" disabled={busy || !text.trim()} onClick={async () => { const r = await run(simulateAction(business, text, person), (x) => `Result: ${x.result}`); if (r.view?.conversations[0]) setOpen(r.view.conversations[0].id); setText(''); }}>Send as customer</button>
          </div>
          <div className="st-card">
            <h2>Conversations</h2>
            {v.conversations.length === 0 ? <p className="st-muted">No messages yet.</p> : (
              <ul className="st-convs">{v.conversations.map((x) => (
                <li key={x.id}><button type="button" aria-pressed={open === x.id} onClick={() => setOpen(x.id)}>
                  <span className="st-conv-name">{x.igsid.endsWith('2') ? 'Person B' : 'Person A'}</span>
                  <span className="st-conv-tags"><span className="st-pill">{(x.lead?.stage ?? 'new').replace(/_/g, ' ')}</span>{x.humanTakeover ? <span className="st-pill st-warn">You are replying</span> : null}{x.state === 'awaiting_approval' ? <span className="st-pill st-glow">Needs approval</span> : null}</span>
                </button></li>))}</ul>)}
          </div>
          {conv ? (
            <div className="st-card st-wide">
              <div className="st-row st-between"><h2>Conversation</h2>
                <button type="button" disabled={busy} onClick={() => run(inboxAction(business, { kind: conv.humanTakeover ? 'release' : 'takeover', id: conv.id }), (r) => r.message)}>{conv.humanTakeover ? 'Let the AI reply again' : 'Take over'}</button></div>
              {conv.lead ? <p className="st-muted">Lead: {conv.lead.stage.replace(/_/g, ' ')}. Why: “{conv.lead.reason}”</p> : null}
              <ol className="st-thread">{conv.messages.map((m) => (
                <li key={m.id} className={m.direction === 'in' ? 'st-in' : 'st-out'}>
                  <div className="st-meta">{m.direction === 'in' ? 'Customer' : m.author === 'ai' ? 'AI' : 'You'} · {m.status}{m.intent ? ` · ${m.intent} (${m.confidence})` : ''}</div>
                  {m.status === 'draft' ? (
                    <>
                      <textarea rows={5} aria-label="Draft reply" value={edit[m.id] ?? m.text} onChange={(e) => setEdit({ ...edit, [m.id]: e.target.value })} />
                      <div className="st-row">
                        <button type="button" className="st-primary" disabled={busy} onClick={() => run(inboxAction(business, { kind: 'approve', id: m.id, text: edit[m.id] }), (r) => r.message)}>Approve and send</button>
                        <button type="button" disabled={busy} onClick={() => run(inboxAction(business, { kind: 'reject', id: m.id }), (r) => r.message)}>Discard</button>
                      </div>
                    </>
                  ) : <p>{m.text}</p>}
                  {m.notes.length ? <ul className="st-notes">{m.notes.map((n) => <li key={n}>{n}</li>)}</ul> : null}
                  {m.error ? <p className="st-err">{m.error}</p> : null}
                </li>))}</ol>
              <div className="st-row"><input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write your own reply" aria-label="Your reply" />
                <button type="button" className="st-primary" disabled={busy || !reply.trim()} onClick={async () => { await run(inboxAction(business, { kind: 'reply', id: conv.id, text: reply }), (r) => r.message); setReply(''); }}>Send</button></div>
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === 'setup' ? (
        <section className="st-card st-form">
          <h2>What the AI knows</h2>
          {(['businessName', 'idealCustomer', 'brandVoice', 'qualifyingQuestion', 'bookingUrl'] as const).map((k) => (
            <label key={k}>{({ businessName: 'Business name', idealCustomer: 'Who you help', brandVoice: 'How you sound', qualifyingQuestion: 'One question to qualify people', bookingUrl: 'Booking link (https, optional)' })[k]}
              <input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></label>))}
          <label>Refund policy<textarea rows={2} value={form.refundPolicy} onChange={(e) => setForm({ ...form, refundPolicy: e.target.value })} /></label>
          <label>Things the AI must never say (one per line)<textarea rows={3} value={form.prohibitedClaims} onChange={(e) => setForm({ ...form, prohibitedClaims: e.target.value })} /></label>
          <h3>Offers</h3>
          {form.offers.map((o, i) => (
            <fieldset key={i}><legend>Offer {i + 1}</legend>
              <input placeholder="Name" value={o.name} onChange={(e) => { const x = [...form.offers]; x[i] = { ...o, name: e.target.value }; setForm({ ...form, offers: x }); }} />
              <input placeholder="Price in dollars" inputMode="decimal" value={o.price} onChange={(e) => { const x = [...form.offers]; x[i] = { ...o, price: e.target.value }; setForm({ ...form, offers: x }); }} />
              <input placeholder="Checkout link (https)" value={o.ctaUrl} onChange={(e) => { const x = [...form.offers]; x[i] = { ...o, ctaUrl: e.target.value }; setForm({ ...form, offers: x }); }} />
              <textarea rows={2} placeholder="What it is" value={o.description} onChange={(e) => { const x = [...form.offers]; x[i] = { ...o, description: e.target.value }; setForm({ ...form, offers: x }); }} />
            </fieldset>))}
          <button type="button" onClick={() => setForm({ ...form, offers: [...form.offers, { name: '', description: '', price: '', ctaUrl: '' }] })}>Add offer</button>
          <h3>Questions people ask</h3>
          {form.knowledge.map((k, i) => (
            <fieldset key={i}><legend>FAQ {i + 1}</legend>
              <input placeholder="Question" value={k.question} onChange={(e) => { const x = [...form.knowledge]; x[i] = { ...k, question: e.target.value }; setForm({ ...form, knowledge: x }); }} />
              <textarea rows={2} placeholder="Your answer" value={k.answer} onChange={(e) => { const x = [...form.knowledge]; x[i] = { ...k, answer: e.target.value }; setForm({ ...form, knowledge: x }); }} />
            </fieldset>))}
          <button type="button" onClick={() => setForm({ ...form, knowledge: [...form.knowledge, { question: '', answer: '' }] })}>Add question</button>
          <h3>Replies</h3>
          <label><input type="radio" checked={form.mode === 'draft_only'} onChange={() => setForm({ ...form, mode: 'draft_only' })} /> Drafts only: I approve every reply</label>
          <label><input type="radio" checked={form.mode === 'auto'} onChange={() => setForm({ ...form, mode: 'auto' })} /> Automatic replies when it is allowed</label>
          <label><input type="radio" checked={form.mode === 'off'} onChange={() => setForm({ ...form, mode: 'off' })} /> Off</label>
          {form.mode === 'auto' ? <label><input type="checkbox" checked={form.confirmAuto} onChange={(e) => setForm({ ...form, confirmAuto: e.target.checked })} /> I understand the AI will reply on my behalf, only within 24 hours of a person messaging me, and only with the facts above.</label> : null}
          <label><input type="checkbox" checked={form.discloseAi} onChange={(e) => setForm({ ...form, discloseAi: e.target.checked })} /> Say the first reply is automated. Off by default. Some places (for example California and Germany) may require this by law, so check where your customers are.</label>
          <label><input type="checkbox" checked={form.paused} onChange={(e) => setForm({ ...form, paused: e.target.checked })} /> Pause the AI</label>
          <button type="button" className="st-primary" disabled={busy} onClick={() => run(saveConfigAction(business, form), (r) => r.message)}>Save</button>
        </section>
      ) : null}

      {tab === 'results' ? (
        <section className="st-card">
          <h2>Results</h2>
          <dl className="st-metrics">
            {Object.entries({ Conversations: v.metrics.conversations, 'Qualified leads': v.metrics.qualified, 'Handed to you': v.metrics.handoffs, 'Opted out': v.metrics.optOuts, 'Checkout clicks': v.metrics.checkoutClicks, 'Verified purchases': v.metrics.verifiedPurchases, 'Verified bookings': v.metrics.verifiedBookings, 'Median reply time': v.metrics.medianReplyMs === null ? 'not yet' : `${Math.round(v.metrics.medianReplyMs / 1000)}s`, 'Blocked sends': v.metrics.blockedSends, 'Failed after retries': v.metrics.deadLetters }).map(([k, val]) => <div key={k}><dt>{k}</dt><dd>{String(val)}</dd></div>)}
          </dl>
          <p className="st-muted">Purchases and bookings count only when Stripe or the booking tool confirms them, never because the AI said so.</p>
          <h3>Recent activity</h3>
          <ul className="st-notes">{v.audit.map((a, i) => <li key={i}>{a.kind}: {a.detail}</li>)}</ul>
        </section>
      ) : null}
    </div>
  );
}
