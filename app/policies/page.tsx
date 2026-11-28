import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { indexable, site, siteUrl } from '../../lib/aimp/site-config';
import { InfoShell } from '../cells/info-shell';

// Terms of use, privacy policy and disclaimers in one plain-English page (InsertAgentic, 24 Nov 2026), adapted from the
// earlier policies. Not legal advice: the owner should have it reviewed by an Australian lawyer, and the legal
// operator, ABN and contact email must be set (NEXT_PUBLIC_LEGAL_ENTITY, NEXT_PUBLIC_LEGAL_ABN, NEXT_PUBLIC_CONTACT_EMAIL)
// before the site goes public.
export const metadata: Metadata = {
  title: `Policies · ${site.name}`,
  description: `${site.name} terms of use, privacy policy and disclaimers: results are not guaranteed, and nothing we provide is financial, legal or tax advice.`,
  alternates: siteUrl() ? { canonical: siteUrl('/policies') } : undefined,
  robots: indexable ? undefined : { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: '#ffffff' };

const UPDATED = '28 November 2026';
const L = site.legal;
const WHO = L.entityName ? `${L.entityName}${L.abn ? ` (ABN ${L.abn})` : ''}` : `the operator of ${site.name} [business name and ABN to be added]`;
const Mail = () => (site.contactEmail ? <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> : <>[contact email to be added]</>);

const SECTIONS: { id: string; title: string; body: ReactNode }[] = [
  {
    id: 'summary', title: 'The short version',
    body: (
      <ul>
        <li><b>No guarantee of results.</b> {site.name} does not promise any sales, bookings, leads, revenue or profit.</li>
        <li><b>No financial advice.</b> Nothing on this site or in the app is financial, investment, legal or tax advice.</li>
        <li><b>You stay in charge.</b> Nothing is sent, booked or charged until you approve it, and one switch pauses everything.</li>
        <li><b>It is your business.</b> You are responsible for what is said and sold in your name and for following the law.</li>
        <li><b>Your accounts stay yours.</b> You connect them through secure authorisation and can disconnect them at any time. We never ask for passwords or keys in chat.</li>
      </ul>
    ),
  },
  {
    id: 'no-guarantee', title: 'No guarantee of results',
    body: (
      <>
        <p>{site.name} is software that helps you reply to enquiries, quote, invoice, chase payments and find where your business may be losing money. We do not guarantee, promise or imply any particular number of leads, bookings, sales or amount of revenue, or any improvement at all.</p>
        <p>Results depend on many things outside our control, including your market, your offer and prices, competition, the platforms you connect, their rules and the wider economy. Figures from connected tools are only as accurate as those tools, and anything we can&apos;t measure is shown as &ldquo;Not measured yet&rdquo;.</p>
      </>
    ),
  },
  {
    id: 'no-advice', title: 'Not financial, legal or tax advice',
    body: (
      <>
        <p>Everything on this website and in the app is general information only. It does not take into account your objectives, financial situation or needs.</p>
        <p>{site.name} is not a financial adviser, accountant, tax agent or law firm, and does not hold an Australian Financial Services Licence. Nothing we provide is financial product advice, investment advice, legal advice or tax advice, and you should not treat it as a recommendation to make any financial decision, including pricing or spending decisions.</p>
        <p>Before you make decisions about money, tax, contracts or your legal obligations, speak with a qualified, licensed professional.</p>
      </>
    ),
  },
  {
    id: 'ai', title: 'AI agents and AI-generated content',
    body: (
      <>
        <p>{site.name} uses artificial intelligence to draft replies, quotes, invoices and reminders, suggest improvements, draft posts and campaigns, and answer calls. AI can be wrong, out of date or incomplete, and can misunderstand a customer.</p>
        <p>Nothing your AI team prepares is sent, booked or charged until you approve that exact version. You are responsible for checking the business information your AI team uses (such as services, prices and hours) and for reviewing content before you approve it. Your AI team must not be used to give medical, legal or financial advice to your customers.</p>
      </>
    ),
  },
  {
    id: 'your-business', title: 'Your business and your responsibilities',
    body: (
      <>
        <p>Messages, quotes, invoices and reminders (and, when available, posts and calls) handled by {site.name} are made on behalf of your business. You are responsible for your products and services, your prices, the claims made about them, and dealing with your customers.</p>
        <p>Your obligations can include the Australian Consumer Law (including rules against misleading claims), the Spam Act (you must have consent before sending marketing messages, and include a way to unsubscribe), privacy law for your customers&apos; information, call recording laws, and the rules of every platform you connect.</p>
        <p>You must be at least 18 years old and authorised to act for the business you connect.</p>
      </>
    ),
  },
  {
    id: 'connections', title: 'Connected accounts',
    body: (
      <>
        <p>You connect accounts such as Stripe, Google Calendar, Xero or a spreadsheet social media accounts or a phone number through each provider&apos;s own authorisation screen or upload. We ask for the least access needed. We store the access they grant securely, use it only for the tasks you allow, and stop using it as soon as you disconnect or the provider revokes it.</p>
        <p>Each provider&apos;s terms and policies apply, and providers can limit, review or withdraw access. Some features depend on provider approval and may not be available in your region or account.</p>
      </>
    ),
  },
  {
    id: 'advertising', title: 'Payments and spending',
    body: (
      <p>{site.name} never takes payments from your customers or holds your money. Customers pay you through your own payment provider, and nothing is shown as paid without a record. Any future advertising features will be optional, billed by the advertising platform to you, and start only after your approval within limits you set.</p>
    ),
  },
  {
    id: 'calls', title: 'Calls and recordings',
    body: (
      <p>The AI Receptionist tells callers they are speaking with an AI assistant. Calls will only be recorded or transcribed where you have enabled it and where it is lawful, with callers told at the start of the call. You are responsible for meeting recording and privacy laws that apply to your business.</p>
    ),
  },
  {
    id: 'payments', title: 'Subscriptions and refunds',
    body: (
      <>
        <p>Plans are priced in AUD and start with a 14-day free trial. We remind you before your first charge. The price, what it includes and how often you are charged are shown before you pay. Payments are processed by Stripe. Subscriptions renew automatically until you cancel; you can cancel at any time and keep access until the end of the period you have paid for.</p>
        <p>Paid plans are not refundable for change of mind or unused time, except where the law requires it. Nothing in these terms excludes, restricts or changes your rights under the Australian Consumer Law, including remedies for a major failure of our service.</p>
      </>
    ),
  },
  {
    id: 'acceptable-use', title: 'Acceptable use',
    body: (
      <>
        <p>You must not use {site.name} to do anything that is illegal, harmful, misleading or deceptive, or that breaks a platform&apos;s rules. That includes:</p>
        <ul>
          <li>spam, or messaging people who have not contacted you or agreed to hear from you;</li>
          <li>scraping personal information or buying contact lists;</li>
          <li>false claims, fake reviews or testimonials, or income promises;</li>
          <li>impersonating someone else, or hate, harassment, adult content or unsafe products.</li>
        </ul>
        <p>We may pause an agent, disconnect an account or close a workspace that breaks these rules or puts others at risk.</p>
      </>
    ),
  },
  {
    id: 'ip', title: 'Your content and ours',
    body: (
      <>
        <p>You own your business information and the content created for your business, subject to the rights of others and the terms of the AI and platform providers involved. You give us permission to host, store and process it so we can run the service for you.</p>
        <p>{site.name}, its name, logo, software and website belong to us. You may not copy or resell the service itself.</p>
      </>
    ),
  },
  {
    id: 'privacy', title: 'Privacy policy',
    body: (
      <>
        <p>We handle personal information in line with the Australian Privacy Principles.</p>
        <p><b>What we collect.</b> Your name, email and business details; the information you give your AI team; the accounts you connect and the data they provide (such as enquiries and messages, jobs, quotes, invoices and payment records, and calendar availability); payment and subscription status (card details are handled by Stripe, not stored by us); messages you send us; and basic technical and usage information.</p>
        <p><b>Your customers&apos; information.</b> When your customers message, comment, call or book, or when you import a customer list, we process their information on your behalf to provide the service. You are responsible for having a lawful basis and any consent needed, and for your own privacy notice.</p>
        <p><b>Why.</b> To run and improve {site.name}, carry out the tasks you allow, keep accounts secure, send you service messages and meet legal obligations. We do not sell personal information.</p>
        <p><b>Who we share it with.</b> Service providers who help us run {site.name}, such as hosting, database, AI model, email, payment, phone and social media providers, only as needed for their service. Some of them store or process information outside Australia, including in the United States.</p>
        <p><b>Keeping it safe.</b> We take reasonable steps to protect personal information, encrypt account access tokens, and keep information only as long as we need it. When you disconnect an account or close your workspace, we stop using its data and delete it within a reasonable time unless the law requires us to keep it.</p>
        <p><b>Access, correction, deletion and complaints.</b> Email <Mail /> to see, correct or delete the personal information we hold about you. If you are not satisfied with our response, you can contact the Office of the Australian Information Commissioner at <a href="https://www.oaic.gov.au" rel="noopener">oaic.gov.au</a>.</p>
      </>
    ),
  },
  {
    id: 'cookies', title: 'Cookies and analytics',
    body: (
      <p>We use cookies and similar technology that are needed to keep you signed in and to make the site work. We may also use analytics to understand how the site is used and, if we advertise, tools that measure whether ads lead to sign-ups. You can block cookies in your browser, but parts of {site.name} may not work without them.</p>
    ),
  },
  {
    id: 'liability', title: 'Our responsibility to you',
    body: (
      <>
        <p>We work to keep {site.name} available and accurate, but it is provided as it is and may sometimes be unavailable, change or contain errors.</p>
        <p>To the extent the law allows, we are not liable for lost revenue, lost profit, lost data, missed calls or bookings, business losses or indirect losses arising from your use of {site.name}, from AI-generated content or actions, or from third-party services. Where our liability cannot be excluded but can be limited, it is limited to supplying the service again or paying the cost of having it supplied again.</p>
        <p>Nothing in these terms excludes any right or guarantee you have under the Australian Consumer Law that cannot be excluded.</p>
      </>
    ),
  },
  {
    id: 'changes', title: 'Changes, ending and the law that applies',
    body: (
      <>
        <p>We may update these policies. When we make an important change we will tell you by email or in the app before it applies. You can disconnect your accounts and close your workspace at any time.</p>
        <p>These terms are governed by the laws of {L.state}, Australia, and you and we submit to the courts of that state.</p>
      </>
    ),
  },
  {
    id: 'contact', title: 'Contact us',
    body: <p>{site.name} is run by {WHO}. For questions about these policies, privacy requests or complaints, email <Mail />.</p>,
  },
];

export default function PoliciesPage() {
  return (
    <InfoShell current="/policies">
      <section className="cells-sec cells-intro cells-policy" data-chapter="" aria-labelledby="policies-h1">
        <p className="cells-label">Policies</p>
        <h1 id="policies-h1">Terms, privacy and disclaimers</h1>
        <p className="cells-body">Last updated {UPDATED}. By using {site.name} you agree to these terms. Please read them, especially the sections on results and advice.</p>
        <nav aria-label="On this page" className="cells-toc">
          {SECTIONS.map((s) => <a key={s.id} href={`#${s.id}`}>{s.title}</a>)}
        </nav>
      </section>
      {SECTIONS.map((s) => (
        <section key={s.id} id={s.id} className="cells-sec cells-policy" data-chapter="" aria-labelledby={`${s.id}-h`}>
          <h2 id={`${s.id}-h`}>{s.title}</h2>
          {s.body}
        </section>
      ))}
    </InfoShell>
  );
}
