import type { Metadata, Viewport } from 'next';
import { indexable, site, siteUrl } from '../../lib/aimp/site-config';
import { InfoShell } from '../cells/info-shell';

// The ecosystem: every agent, what it does, who it hands work to, and how it all sits on the client's own business
// data. Source: InsertAgentic product overview (28 Nov 2026).
export const metadata: Metadata = {
  title: `Ecosystem · ${site.name}`,
  description: `How the seven ${site.name} AI employees connect to each other and to your business, with you approving every step.`,
  alternates: siteUrl() ? { canonical: siteUrl('/ecosystem') } : undefined,
  robots: indexable ? undefined : { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: '#ffffff' };

type Status = 'live' | 'soon' | 'behind';
const AGENTS: { name: string; does: string; worksWith: string[]; status: Status }[] = [
  { name: 'Sales', status: 'live', does: 'Replies to new enquiries from your services and prices, qualifies the customer and holds a time in your calendar.', worksWith: ['Job Manager', 'Integrations', 'Business Optimisation'] },
  { name: 'Job Manager', status: 'live', does: 'Quotes from your price list, invoices when the work is done and sends polite payment reminders, with correct GST.', worksWith: ['Sales', 'Integrations', 'Business Optimisation'] },
  { name: 'Business Optimisation', status: 'live', does: 'Reads 18 measures every week and gives up to 8 fixes, each with the reason, then hands each fix to the right agent.', worksWith: ['Every agent'] },
  { name: 'Integrations', status: 'live', does: 'Connects Stripe, Google Calendar, Xero or a spreadsheet with the least access needed, and turns repeated jobs into automations.', worksWith: ['Stripe', 'Google Calendar', 'Xero', 'Spreadsheets'] },
  { name: 'Receptionist', status: 'soon', does: 'Answers the phone as an AI assistant, takes details and books new customers into your calendar.', worksWith: ['Sales', 'Integrations'] },
  { name: 'Socials & Marketing', status: 'soon', does: 'Plans and drafts posts and campaigns in your own voice. New enquiries go straight to Sales.', worksWith: ['Sales', 'Business Optimisation'] },
  { name: 'Growth Manager', status: 'behind', does: 'Coordinates the whole team so no two agents ever give conflicting advice about the same customer or job.', worksWith: ['Every agent'] },
];

const FLOWS = [
  { title: 'Enquiry to booking', body: 'Sales replies and holds a time. When the Receptionist launches, phone calls join the same flow.' },
  { title: 'Booking to paid', body: 'Job Manager quotes, invoices and chases payment. Integrations keeps Stripe and Xero in step.' },
  { title: 'Every week', body: 'Business Optimisation finds what’s slipping, such as overdue invoices or lapsed customers, and hands each fix to the right agent.' },
  { title: 'Getting found', body: 'Socials & Marketing (coming soon) drafts posts and campaigns. The enquiries they bring go to Sales.' },
  { title: 'One voice', body: 'Growth Manager keeps every agent working from the same facts, so customers always get one consistent answer.' },
  { title: 'You approve', body: 'Every message, quote and action waits for your OK. One switch pauses everything.' },
];

const BUSINESS = ['Services and prices', 'Customers', 'Jobs and bookings', 'Quotes and invoices', 'Calendar', 'Payment records'];

const TAG: Record<Status, string | null> = { live: null, soon: 'Coming soon', behind: 'Behind the scenes' };

// Agent positions around the hub in the desktop diagram (viewBox 760 x 560).
const NODES: { name: string; x: number; y: number; status: Status }[] = [
  { name: 'Sales', x: 380, y: 70, status: 'live' },
  { name: 'Job Manager', x: 640, y: 175, status: 'live' },
  { name: 'Integrations', x: 640, y: 385, status: 'live' },
  { name: 'Business Optimisation', x: 380, y: 490, status: 'live' },
  { name: 'Socials & Marketing', x: 120, y: 385, status: 'soon' },
  { name: 'Receptionist', x: 120, y: 175, status: 'soon' },
];

function EcosystemDiagram() {
  const cx = 380;
  const cy = 280;
  return (
    <figure className="eco-figure">
      <svg className="eco-svg" viewBox="0 0 760 560" role="img" aria-labelledby="eco-svg-title eco-svg-desc">
        <title id="eco-svg-title">{`${site.name} ecosystem`}</title>
        <desc id="eco-svg-desc">Your business sits at the centre. Growth Manager surrounds it and keeps six agents in sync: Sales, Job Manager, Integrations, Business Optimisation, and coming soon, Socials and Marketing and Receptionist.</desc>
        {NODES.map((n) => (
          <line key={`l-${n.name}`} x1={cx} y1={cy} x2={n.x} y2={n.y} className={n.status === 'soon' ? 'eco-link eco-link-soon' : 'eco-link'} />
        ))}
        <circle cx={cx} cy={cy} r="150" className="eco-ring" />
        <text x={cx + 160} y={cy - 4} className="eco-ring-label">Growth Manager</text>
        <text x={cx + 160} y={cy + 16} className="eco-ring-sub">keeps everyone in sync</text>
        <circle cx={cx} cy={cy} r="104" className="eco-hub" />
        <text x={cx} y={cy - 18} className="eco-hub-title" textAnchor="middle">Your business</text>
        <text x={cx} y={cy + 12} className="eco-hub-sub" textAnchor="middle">Services, prices, customers,</text>
        <text x={cx} y={cy + 34} className="eco-hub-sub" textAnchor="middle">jobs, calendar and payments</text>
        {NODES.map((n) => (
          <g key={n.name}>
            <rect x={n.x - 96} y={n.y - 28} width="192" height="56" rx="28" className={n.status === 'soon' ? 'eco-node eco-node-soon' : 'eco-node'} />
            <text x={n.x} y={n.status === 'soon' ? n.y - 2 : n.y + 6} className="eco-node-name" textAnchor="middle">{n.name}</text>
            {n.status === 'soon' && <text x={n.x} y={n.y + 16} className="eco-node-soon-label" textAnchor="middle">Coming soon</text>}
          </g>
        ))}
      </svg>
      <figcaption className="cells-note">Every agent reads from and writes back to your business. Nothing reaches a customer until you approve it.</figcaption>
    </figure>
  );
}

export default function EcosystemPage() {
  return (
    <InfoShell closing="Seven AI employees. One team behind your business." current="/ecosystem">
      <section className="cells-sec cells-intro" data-chapter="" aria-labelledby="eco-h1">
        <p className="cells-label">Ecosystem</p>
        <h1 id="eco-h1">Seven AI employees. One connected team.</h1>
        <p className="cells-body">Every agent works from the same picture of your business. They hand work to each other, so nothing falls between the cracks, and nothing reaches a customer until you approve it.</p>
      </section>

      <section className="cells-sec" data-chapter="" aria-labelledby="eco-h-map">
        <p className="cells-label">How it fits together</p>
        <h2 id="eco-h-map">Your business at the centre.</h2>
        <EcosystemDiagram />
        {/* Small screens: the same picture as a simple stack. */}
        <div className="eco-stack" aria-hidden="true">
          <div className="eco-stack-hub"><b>Your business</b><span>{BUSINESS.map((b, i) => (i ? b.toLowerCase() : b)).join(', ')}</span></div>
          <div className="eco-stack-ring">Growth Manager keeps everyone in sync</div>
          <ul>
            {NODES.map((n) => <li key={n.name} className={n.status === 'soon' ? 'is-soon' : undefined}>{n.name}{n.status === 'soon' && <em>Coming soon</em>}</li>)}
          </ul>
        </div>
      </section>

      <section className="cells-sec" data-chapter="" aria-labelledby="eco-h-flows">
        <p className="cells-label">How work moves</p>
        <h2 id="eco-h-flows">From first enquiry to money in the bank.</h2>
        <ol className="cells-check">
          {FLOWS.map((f) => <li key={f.title}><span><b>{f.title}.</b> {f.body}</span></li>)}
        </ol>
      </section>

      <section className="cells-sec" data-chapter="" aria-labelledby="eco-h-team">
        <p className="cells-label">The team</p>
        <h2 id="eco-h-team">Who does what, and who they work with.</h2>
        <ul className="cells-cards cells-cards-3">
          {AGENTS.map((a) => (
            <li key={a.name} className="cells-card">
              <b>{a.name}</b>
              {TAG[a.status] && <em className="cells-tag">{TAG[a.status]}</em>}
              <span>{a.does}</span>
              <span className="eco-with">Works with: {a.worksWith.join(', ')}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="cells-sec" data-chapter="" aria-labelledby="eco-h-data">
        <p className="cells-label">Your business</p>
        <h2 id="eco-h-data">One source of truth.</h2>
        <p className="cells-body">Every agent uses the same facts you’ve confirmed, so prices are never made up and anything not measured shows “Not measured yet”.</p>
        <ul className="eco-chips">
          {BUSINESS.map((b) => <li key={b}>{b}</li>)}
        </ul>
      </section>
    </InfoShell>
  );
}
