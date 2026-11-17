import type { Metadata } from 'next';
import { AppIntro, AppLayout, GlassButton, GlassCard, GlassNotice, GlassState } from '../../../design-system/aimp-glass';
import { availability, checkBusiness } from '../../../start/_server/runtime';
import { UnknownBusiness } from '../overview-view';
import { BriefForm } from './brief-form';
import { loadHome } from './_server/load-home';

export const metadata: Metadata = { title: 'Home' };
export const dynamic = 'force-dynamic';

// Home (rework brief 02): What's ready? What needs me? What happened? Then three preset actions. Same in-memory DEMO runtime as the rest
// of the workspace. Every line comes from real records (orders, delivery, approvals, Inbox); nothing is made up.
export default async function HomePage({ params }: { params: Promise<{ business: string }> }) {
  const { business } = await params;
  const a = availability();
  if (!a.available) {
    return (
      <AppLayout width="regular">
        <AppIntro title="This page is not switched on here" />
        <GlassNotice tone="warn" title="Demo storage is off on this site"><p>{a.reason}</p></GlassNotice>
      </AppLayout>
    );
  }
  if (!checkBusiness(business)) return <UnknownBusiness />;
  let r;
  try { r = await loadHome(business); } catch {
    return (
      <AppLayout width="regular">
        <AppIntro title="Home" />
        <GlassState kind="error" title="We could not load Home" action={<GlassButton href={`/app/${business}/home`}>Try again</GlassButton>}><p>Nothing was changed.</p></GlassState>
      </AppLayout>
    );
  }
  if (!r.found) return <UnknownBusiness />;
  const { home } = r;
  const row = (x: { text: string; href: string | null }, i: number) => <li key={i}>{x.href ? <a href={x.href}>{x.text}</a> : x.text}</li>;
  return (
    <AppLayout width="regular">
      <AppIntro title={home.headline}><p>Next: {home.next.title}</p></AppIntro>
      {home.next.href ? <GlassButton href={home.next.href}>{home.next.action}</GlassButton> : null}

      <GlassCard title="What needs me" data-testid="home-needs">
        {home.needsMe.length ? <ul>{home.needsMe.map(row)}</ul> : <p>Nothing needs you right now.</p>}
      </GlassCard>
      <GlassCard title="What is ready" data-testid="home-ready">
        {home.ready.length ? <ul>{home.ready.map(row)}</ul> : <p>Nothing is finished yet.</p>}
      </GlassCard>
      <GlassCard title="What happened" data-testid="home-happened">
        {home.happened.length ? <ul>{home.happened.map(row)}</ul> : <p>No activity yet. When something happens, it shows here.</p>}
      </GlassCard>

      <GlassCard title="Quick actions" data-testid="home-actions">
        <GlassButton href={`/app/${business}/marketing`}>Draft a launch campaign</GlassButton>
        <GlassButton variant="secondary" href={`/app/${business}/inbox`}>Review replies</GlassButton>
        <GlassButton variant="secondary" href={`/app/${business}/gaps`}>Find competitor gaps</GlassButton>
      </GlassCard>

      <GlassCard title={home.weeklyBrief.title} data-testid="home-brief">
        <ul>{home.weeklyBrief.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
        <BriefForm business={business} />
      </GlassCard>
    </AppLayout>
  );
}
