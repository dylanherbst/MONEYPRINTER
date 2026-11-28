// Shared copy and links for the public pages (from the InsertAgentic website brief, 24 Nov 2026). Features that are not
// verified yet are labelled "In development" rather than advertised as working.
import { site } from '../../lib/aimp/site-config';

/** The app is live once its address is configured; until then the site offers early access instead of sign-up. */
export const APP_READY = Boolean(site.appUrl);

export const CTA = APP_READY ? 'Activate your AI team' : 'Join the early access list';
/** Every primary button on the public pages leads to the sign-up page first. */
export const SIGNUP = '/signup';
/** Where the sign-up page's button goes: the app's existing-business onboarding, or the early access list. */
export const SIGNUP_TARGET = APP_READY
  ? `${site.appUrl}/start/existing`
  : site.earlyAccessUrl || (site.contactEmail ? `mailto:${site.contactEmail}?subject=${encodeURIComponent('InsertAgentic early access')}` : '');
/** Sign in to the app; empty (hidden) until the app is live. */
export const SIGN_IN = APP_READY ? `${site.appUrl}/start/account?mode=login` : '';

/** The agent team, from the InsertAgentic product overview (28 Nov 2026). `soon` shows a "Coming soon" label; `behind` a "Behind the scenes" one. */
export const AGENTS = [
  { title: 'Sales', body: 'Replies to new enquiries from your services and prices, qualifies the customer and offers a time.', soon: false },
  { title: 'Job Manager', body: 'Quotes from your price list, invoices and polite payment reminders, with correct GST.', soon: false },
  { title: 'Business Optimisation', body: 'Checks 18 measures every week and gives up to 8 fixes, each with the reason.', soon: false },
  { title: 'Integrations', body: 'Connects Stripe, Google Calendar, Xero or a spreadsheet with the least access needed, and turns repeated jobs into automations.', soon: false },
  { title: 'Receptionist', body: 'Answers the phone as an AI assistant, takes details and books new customers.', soon: false },
  { title: 'Socials & Marketing', body: 'Plans and drafts posts and campaigns in your own voice.', soon: false },
  { title: 'Growth Manager', body: 'Coordinates the team so agents never give conflicting advice about the same customer or job.', soon: false, behind: true },
];

/** What the team handles today. */
export const ROUTES = [
  { title: 'Answer every enquiry', body: 'Sales drafts a reply from your real services and prices and offers a time.' },
  { title: 'Quote and get paid', body: 'Job Manager drafts quotes, invoices and payment reminders. Customers accept quotes through a link.' },
  { title: 'Find where you’re losing money', body: 'Business Optimisation spots overdue invoices, forgotten quotes and lapsed customers every week.' },
];

/** How it works for the owner. */
export const STEPS = [
  { title: 'A customer enquires', body: 'Sales drafts the reply and offers a time.' },
  { title: 'The job is booked', body: 'Job Manager drafts the quote from your confirmed prices. The customer accepts through a link.' },
  { title: 'The work is done', body: 'Job Manager drafts the invoice and payment reminders. Stripe and Xero stay in sync.' },
  { title: 'Every week', body: 'Business Optimisation finds what’s slipping and hands each fix to the right agent.' },
  { title: 'You approve', body: 'Nothing is sent, booked or charged without your OK.' },
];

/** Plans and the founding offer (prices in AUD). */
export const PLANS = [
  { title: 'Starter', price: 'A$79/month', founding: 'A$49', body: 'Sales, Job Manager and Business Optimisation.' },
  { title: 'Growth', price: 'A$149/month', founding: 'A$99', body: 'Everything in Starter, plus Integrations. Receptionist included when it launches.' },
];
export const OFFER_NOTE = 'Founding price locked for 12 months for the first 25 businesses. 14-day free trial, a reminder before your first charge, cancel in two taps. Prices in AUD.';

export const FAQS = [
  { q: `Who is ${site.name} for?`, a: 'Australian sole traders and small businesses in beauty, fitness, trades, retail and professional services.' },
  { q: 'What does it do today?', a: 'Sales replies to enquiries, Job Manager quotes, invoices and chases payments, Business Optimisation finds where you’re losing money, and Integrations connects Stripe, Google Calendar, Xero or a spreadsheet, Receptionist answers the phone and books new customers, and Socials & Marketing plans and drafts your posts and campaigns.' },
  { q: 'Will it send anything without me?', a: 'No. Every customer message, quote and action is a draft until you approve it, and one switch pauses everything.' },
  { q: 'Will it make up prices or numbers?', a: 'No. Prices come only from your confirmed price list. Anything it can’t measure shows “Not measured yet”.' },
  { q: 'How much does it cost?', a: 'Starter is A$79/month and Growth is A$149/month. The first 25 businesses get A$49 or A$99, locked for 12 months. Every plan starts with a 14-day free trial.' },
  { q: 'Do I need technical skills?', a: 'No. Answer three quick questions and you’ll see your AI team, with a sample of its work, before you pay anything.' },
  { q: `Does ${site.name} guarantee results?`, a: `No. Results depend on your business, customers and offer. ${site.name} helps you respond faster, quote and get paid, and shows you where money is slipping.` },
];

export const FOOTER_NOTE = `${site.name} is an Agentic AI team for Australian sole traders and small businesses. You approve everything before it goes out. Results are not guaranteed.`;
