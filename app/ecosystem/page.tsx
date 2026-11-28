import type { Metadata, Viewport } from 'next';
import { indexable, site, siteUrl } from '../../lib/aimp/site-config';
import { InfoShell } from '../cells/info-shell';
import { EcosystemDiagram } from './ecosystem-diagram';

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
  { name: 'Receptionist', status: 'live', does: 'Answers the phone as an AI assistant, takes details and books new customers into your calendar.', worksWith: ['Sales', 'Integrations'] },
  { name: 'Socials & Marketing', status: 'live', does: 'Plans and drafts posts and campaigns in your own voice. New enquiries go straight to Sales.', worksWith: ['Sales', 'Business Optimisation'] },
  { name: 'Growth Manager', status: 'behind', does: 'Coordinates the whole team so no two agents ever give conflicting advice about the same customer or job.', worksWith: ['Every agent'] },
];

const FLOWS = [
  { title: 'Enquiry to booking', body: 'Sales replies to messages and the Receptionist answers calls. Both hold a time in your calendar.' },
  { title: 'Booking to paid', body: 'Job Manager quotes, invoices and chases payment. Integrations keeps Stripe and Xero in step.' },
  { title: 'Every week', body: 'Business Optimisation finds what’s slipping, such as overdue invoices or lapsed customers, and hands each fix to the right agent.' },
  { title: 'Getting found', body: 'Socials & Marketing drafts posts and campaigns. The enquiries they bring go to Sales.' },
  { title: 'One voice', body: 'Growth Manager keeps every agent working from the same facts, so customers always get one consistent answer.' },
  { title: 'You approve', body: 'Every message, quote and action waits for your OK. One switch pauses everything.' },
];

const BUSINESS = ['Services and prices', 'Customers', 'Jobs and bookings', 'Quotes and invoices', 'Calendar', 'Payment records'];

const TAG: Record<Status, string | null> = { live: null, soon: null, behind: 'Behind the scenes' };

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
        <EcosystemDiagram siteName={site.name} />
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
