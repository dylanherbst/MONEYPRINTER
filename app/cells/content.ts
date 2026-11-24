// Shared copy for the home page's Learn more and FAQ pages (from the 22 Nov 2026 website copy brief, trimmed to what
// the product does today). The home page itself stays minimal and links here.
import { site } from '../../lib/aimp/site-config';
import { startRoutes } from '../start/flow';

export const START = startRoutes.welcome;
/** The sign-up page: one line and one button. Every Find my side business button on the public pages leads here. */
export const SIGNUP = '/signup';
/** The account form the sign-up page's button opens. */
export const CREATE_ACCOUNT = startRoutes.account;
export const SIGN_IN = `${startRoutes.account}?mode=login`;
export const CTA = 'Find my side business';

export const ROUTES = [
  { title: 'I have no idea what to sell', body: 'Explore ideas from your interests, experience and real market research.' },
  { title: 'I have a skill or something to teach', body: 'Turn what you know into a focused product or service people can buy.' },
  { title: 'I already run a business', body: 'Find the gaps in your market and a new offer to test with the customers you have.' },
];
export const LEAN_TEST = [
  'A researched idea, not a guess',
  'One focused offer, for one kind of buyer, at one price',
  'A simple page to send people to',
  'Free posts first; ads only once something gets a response',
];
export const OUTPUTS = [
  { title: 'Opportunity brief', body: 'The problem, who has it and the sources behind it.' },
  { title: 'Offer draft', body: 'What buyers get, who it is for and a price to test.' },
  { title: 'Brand and product', body: 'A name, a look and the first product, made for the offer.' },
  { title: 'Shop page', body: 'A page to sell from, with checkout into your own Stripe account.' },
  { title: 'Launch posts', body: 'A first set of posts, checked before you approve them.' },
];
export const FAQS = [
  { q: 'Do I need to know how to code?', a: `No. ${site.name} guides you through setup in plain language, with AI helping you make the pieces you need.` },
  { q: 'What if I have no business idea?', a: 'That’s a good place to start. Tell us what interests you, what you know and how much time and money you have, and we help you explore customer problems and possible offers.' },
  { q: 'Does this guarantee I’ll make money?', a: `No. No platform can guarantee sales. ${site.name} helps you research, test and market an idea more methodically. Results depend on demand, your offer, how you run it and other things.` },
  { q: 'Do I have to pay for advertising?', a: 'No. You can start with a small test and free posts. Paid ads are optional and may make sense later, depending on your goals and budget.' },
  { q: 'How do you know people want the idea?', a: 'We use market signals, competitor research and customer feedback to guide each decision. Signals are not proof of a sale, which is why we suggest testing the offer before spending more.' },
  { q: 'What happens after I sign up?', a: 'You choose your starting point, answer a few simple questions and see your first ideas. We guide you to the next step from there.' },
];

