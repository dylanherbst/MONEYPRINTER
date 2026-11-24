// Shared copy and links for the public pages (from the VentraAI website brief, 24 Nov 2026). Features that are not
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
  : site.earlyAccessUrl || (site.contactEmail ? `mailto:${site.contactEmail}?subject=${encodeURIComponent('VentraAI early access')}` : '');
/** Sign in to the app; empty (hidden) until the app is live. */
export const SIGN_IN = APP_READY ? `${site.appUrl}/start/account?mode=login` : '';

/** The four agents and the Growth Manager. `ready: false` shows an "In development" label. */
export const AGENTS = [
  { title: 'Sales Agent', body: 'Lead qualification and eligible follow-ups.', ready: true },
  { title: 'Social Media Agent', body: 'Content plans, captions and publishing.', ready: true },
  { title: 'Marketing Agent', body: 'Competitor research, ad creatives and campaign insights.', ready: true },
  { title: 'AI Receptionist', body: 'Call handling, lead capture and booking support.', ready: false },
  { title: 'Growth Manager', body: 'Shared activity, approvals and performance summaries.', ready: true },
];

export const ROUTES = [
  { title: 'Get more customers', body: 'Qualify enquiries, follow up where permitted and guide prospects towards bookings or purchases.', ready: true },
  { title: 'Stay visible online', body: 'Plan social content, create branded posts and prepare campaigns for the right audience.', ready: true },
  { title: 'Never miss an opportunity', body: 'Answer eligible inbound calls, capture customer details and route enquiries to your team.', ready: false },
];

export const STEPS = [
  'Connect your business and confirm your details.',
  'Link supported socials, ad account and phone or booking tools.',
  'Review your AI team’s growth plan and permissions.',
  'Track activity, leads, bookings and improvements.',
];

export const FAQS = [
  { q: `Who is ${site.name} for?`, a: 'Existing solo operators and small businesses, including beauty salons, personal trainers, tradies, coaches and other service businesses.' },
  { q: 'What do the AI agents do?', a: 'Sales handles eligible enquiries and follow-ups; Social Media creates and schedules content; Marketing prepares campaigns; Receptionist answers connected inbound calls and supports booking or handoff. The Receptionist is still in development.' },
  { q: 'Do I need technical experience?', a: 'No coding is required. Confirm your business information, connect supported accounts and choose what your AI team is allowed to do.' },
  { q: 'Can I use my existing accounts and phone number?', a: 'Yes, where supported. Connect your existing business socials and ad account through secure authorisation. Phone forwarding or a supported number and booking integration may be needed.' },
  { q: 'Will AI publish content or spend money without permission?', a: 'You control approval settings and spending limits. Advertising spend and sensitive actions require the configured authorisation. Paid advertising is optional and billed separately.' },
  { q: `Does ${site.name} guarantee sales or bookings?`, a: `No. Results depend on your business, market, offer and connected tools. ${site.name} helps you manage growth activities and track their outcomes.` },
];

export const FOOTER_NOTE = `${site.name} helps existing businesses manage sales, marketing, social media and customer calls. Results are not guaranteed. Features depend on connected accounts, permissions and provider availability.`;
