import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { site } from '../../lib/aimp/site-config';
import { InfoShell } from '../cells/info-shell';

// Terms of use, privacy, earnings and advice disclaimers in one plain-English page (22 Nov 2026).
// Not legal advice: the owner should have it reviewed by an Australian lawyer before relying on it.
export const metadata: Metadata = {
  title: `Policies · ${site.name}: ${site.descriptor}`,
  description: `${site.name} terms of use, privacy policy and disclaimers: no guarantee of income or results, and no financial, legal or tax advice.`,
  alternates: { canonical: `https://${site.domain}/policies` },
};
export const viewport: Viewport = { themeColor: '#ffffff' };

const UPDATED = '22 November 2026';
const L = site.legal;
const WHO = L.entityName ? `${L.entityName}${L.abn ? ` (ABN ${L.abn})` : ''}` : `the operator of ${site.name} [business name and ABN to be added]`;
const EMAIL = L.contactEmail || '[contact email to be added]';
const Mail = () => (L.contactEmail ? <a href={`mailto:${L.contactEmail}`}>{L.contactEmail}</a> : <>{EMAIL}</>);

const SECTIONS: { id: string; title: string; body: ReactNode }[] = [
  {
    id: 'summary', title: 'The short version',
    body: (
      <ul>
        <li><b>No guarantee of income.</b> {site.name} does not promise that you will make any money, sales or profit.</li>
        <li><b>No financial advice.</b> Nothing on this site or in the app is financial, investment, legal or tax advice.</li>
        <li><b>You approve everything.</b> AI drafts research, products, pages and posts. You check them and decide what goes live.</li>
        <li><b>It is your business.</b> You are the seller to your customers and are responsible for following the law.</li>
        <li><b>Your money goes to your own Stripe account.</b> We do not hold your customers&apos; payments.</li>
      </ul>
    ),
  },
  {
    id: 'no-guarantee', title: 'No guarantee of income or results',
    body: (
      <>
        <p>{site.name} is a tool that helps you research, build and market a small business. We do not guarantee, promise or imply that you will earn any particular amount, or any money at all.</p>
        <p>Most new businesses earn little or nothing at first, and many never make a profit. Results depend on many things outside our control, including demand, competition, your offer, your pricing, the time and money you put in, platform rules and the wider economy.</p>
        <p>Any figures on this website, such as market statistics, are general information about other businesses or surveys. They are not typical results, not results of {site.name} customers, and not a prediction of what you will earn. Examples and sample products are illustrations only.</p>
        <p>Only spend money you can afford to lose, and do not rely on {site.name} for your income.</p>
      </>
    ),
  },
  {
    id: 'no-advice', title: 'Not financial, legal or tax advice',
    body: (
      <>
        <p>Everything on this website and in the app is general information only. It does not take into account your objectives, financial situation or needs.</p>
        <p>{site.name} is not a financial adviser, accountant, tax agent or law firm, and does not hold an Australian Financial Services Licence. Nothing we provide is financial product advice, investment advice, legal advice or tax advice, and you should not treat it as a recommendation to make any financial decision.</p>
        <p>Before you make decisions about money, tax (including GST and income tax), business structure, contracts or legal obligations, speak with a qualified, licensed professional.</p>
      </>
    ),
  },
  {
    id: 'ai', title: 'AI-generated content',
    body: (
      <>
        <p>{site.name} uses artificial intelligence to draft ideas, research summaries, products, brand material, web pages and marketing posts. AI can be wrong, out of date, incomplete or similar to existing material.</p>
        <p>You must review everything before you use or publish it. You are responsible for checking that it is accurate, that any claims are true and can be backed up, and that it does not copy someone else&apos;s work. Market &quot;signals&quot; and research are not proof that anyone will buy.</p>
      </>
    ),
  },
  {
    id: 'your-business', title: 'Your business and your responsibilities',
    body: (
      <>
        <p>When you sell through a shop made with {site.name}, you are the seller. Your customers buy from you, not from us. You are responsible for your products, your prices, delivering what you promise, handling customer questions, refunds and complaints, and meeting your legal obligations.</p>
        <p>Those obligations can include the Australian Consumer Law (including consumer guarantees and rules against misleading claims), privacy law for your customers&apos; information, spam and marketing rules, platform and advertising policies, and registering for and paying taxes such as GST where required.</p>
        <p>You must be at least 18 years old and able to enter into a binding agreement to use {site.name}.</p>
      </>
    ),
  },
  {
    id: 'payments', title: 'Payments, subscriptions and refunds',
    body: (
      <>
        <p><b>Your sales.</b> Payments from your customers are processed by Stripe and paid into your own Stripe account. Stripe&apos;s terms and fees apply. {site.name} does not hold or control those funds, and is not responsible for Stripe&apos;s decisions about your account, such as verification, holds or payouts.</p>
        <p><b>Our plans.</b> If you choose a paid {site.name} plan, the price, what it includes and how often you are charged are shown before you pay. Subscriptions renew automatically until you cancel. You can cancel at any time and keep access until the end of the period you have paid for.</p>
        <p><b>Refunds.</b> Paid plans are not refundable for change of mind or for unused time, except where the law requires it. Nothing in these terms excludes, restricts or changes your rights under the Australian Consumer Law, including refunds or remedies for a major failure of our service.</p>
      </>
    ),
  },
  {
    id: 'acceptable-use', title: 'Acceptable use',
    body: (
      <>
        <p>You must not use {site.name} to create, sell or promote anything that is illegal, harmful, misleading or deceptive, or that infringes anyone else&apos;s rights. That includes:</p>
        <ul>
          <li>get-rich-quick schemes, false income claims or fake testimonials;</li>
          <li>financial, medical or legal products or advice you are not licensed or qualified to give;</li>
          <li>copied content, counterfeit goods or anything that breaches copyright or trade marks;</li>
          <li>spam, scams, hate, harassment, adult content or unsafe products.</li>
        </ul>
        <p>We may remove content, pause a shop or close an account that breaks these rules or puts others at risk.</p>
      </>
    ),
  },
  {
    id: 'ip', title: 'Your content and ours',
    body: (
      <>
        <p>You own the content you create with {site.name}, including the products and pages made for your business, subject to the rights of others and the terms of the AI and platform providers involved. You give us permission to host, store, display and process it so we can run the service for you.</p>
        <p>{site.name}, its name, logo, software and website belong to us. You may not copy or resell the service itself.</p>
      </>
    ),
  },
  {
    id: 'third-parties', title: 'Other services we connect to',
    body: (
      <p>{site.name} works with other companies, such as Stripe for payments, social media platforms for posting, AI model providers, email delivery and hosting providers. Their own terms and privacy policies apply when you use them. Connected features depend on each provider&apos;s availability and on the permissions you give, and providers can change or withdraw their services. We are not responsible for services we do not control.</p>
    ),
  },
  {
    id: 'privacy', title: 'Privacy policy',
    body: (
      <>
        <p>We handle personal information in line with the Australian Privacy Principles.</p>
        <p><b>What we collect.</b> Your name and email when you sign up; the answers you give about your goals, time, budget and skills; the content you create; information about your shop and orders; payment and subscription status (card details are handled by Stripe, not stored by us); messages you send us; and basic technical and usage information such as your device, browser and pages visited.</p>
        <p><b>Why.</b> To run and improve {site.name}, create the material you ask for, process payments, deliver orders, keep accounts secure, send you service messages, and meet legal obligations. We will only send you marketing emails if you agree, and you can unsubscribe at any time.</p>
        <p><b>Who we share it with.</b> Service providers who help us run {site.name}, such as hosting, database, payment, email and AI providers, only as needed for them to provide their service. Some of these providers store or process information outside Australia, including in the United States. We do not sell your personal information.</p>
        <p><b>Your customers.</b> When customers buy from your shop, you are responsible for their personal information and for having your own privacy notice. We process it on your behalf to run your shop.</p>
        <p><b>Keeping it safe.</b> We take reasonable steps to protect personal information from misuse, loss and unauthorised access, and keep it only as long as we need it.</p>
        <p><b>Access, correction and complaints.</b> You can ask to see or correct the personal information we hold about you, or ask us to delete your account, by emailing <Mail />. If you have a privacy complaint, contact us first; if you are not satisfied with our response you can contact the Office of the Australian Information Commissioner at <a href="https://www.oaic.gov.au" rel="noopener">oaic.gov.au</a>.</p>
      </>
    ),
  },
  {
    id: 'cookies', title: 'Cookies and analytics',
    body: (
      <p>We use cookies and similar technology that are needed to keep you signed in and to make the site work. We may also use analytics to understand how the site is used, and, if we advertise, advertising tools that measure whether ads lead to sign-ups. You can block cookies in your browser, but parts of {site.name} may not work without them.</p>
    ),
  },
  {
    id: 'liability', title: 'Our responsibility to you',
    body: (
      <>
        <p>We work to keep {site.name} available and accurate, but it is provided as it is and may sometimes be unavailable, change or contain errors.</p>
        <p>To the extent the law allows, we are not liable for any lost income, lost profit, lost data, business losses or indirect losses arising from your use of {site.name}, from AI-generated content, or from third-party services. Where our liability cannot be excluded but can be limited, it is limited to supplying the service again or paying the cost of having it supplied again.</p>
        <p>Nothing in these terms excludes any right or guarantee you have under the Australian Consumer Law that cannot be excluded.</p>
      </>
    ),
  },
  {
    id: 'changes', title: 'Changes, ending and the law that applies',
    body: (
      <>
        <p>We may update these policies. When we make an important change we will tell you by email or in the app before it applies. You can stop using {site.name} and close your account at any time.</p>
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
        <p className="cells-body">Last updated {UPDATED}. By using {site.name} you agree to these terms. Please read them, especially the sections on income and advice.</p>
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
