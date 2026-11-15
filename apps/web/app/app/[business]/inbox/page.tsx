import type { Metadata } from 'next';
import { AppIntro, AppLayout, GlassBadge, GlassState } from '../../../design-system/aimp-glass';
import { checkBusiness } from '../../../start/_server/runtime';
import { UnknownBusiness } from '../overview-view';
import { teamSummary } from '../../../../lib/aimp/storeops';

export const metadata: Metadata = { title: 'Inbox' };

// The Inbox tab (rework brief 02-04): enquiries, suggested replies, follow-ups and hand-offs. Nothing feeds it yet: the AI Setter is a
// later release, so this page says so plainly instead of showing sample messages. Real enquiries will arrive here first.
export default async function InboxPage({ params }: { params: Promise<{ business: string }> }) {
  const { business } = await params;
  if (!checkBusiness(business)) return <UnknownBusiness />;
  const team = teamSummary({ digitalOnly: true });
  return (
    <AppLayout width="regular">
      <AppIntro title="Inbox" badges={<GlassBadge tone="demo" dot>Not connected yet</GlassBadge>}>
        <p>Questions from buyers will land here, with a suggested reply for you to approve.</p>
      </AppIntro>
      <GlassState kind="empty" title="No enquiries yet" data-testid="inbox-empty">
        <p>When someone asks about your product, you will see their message, a suggested reply, any follow-ups that are due, and whether they reached checkout. Nothing is sent without your approval.</p>
        <p>Automatic answers are a later release. Until then this page stays empty rather than showing made-up messages.</p>
      </GlassState>
      <section aria-label="Your store team" data-testid="store-team">
        <h2>Your store team</h2>
        <p>The jobs a live shop needs covered. Anything that reaches a buyer or moves money waits for your approval.</p>
        <ul>
          {team.map((t) => (
            <li key={t.department}>{t.label}: {t.built ? `${t.built} ready` : 'none ready yet'}{t.next ? `, ${t.next} next` : ''}{t.later ? `, ${t.later} later` : ''}</li>
          ))}
        </ul>
      </section>
    </AppLayout>
  );
}
