'use client';
// Home in the approved Liquid Glass look (docs/design/reference/home-approved.png). Answers "what happened?" and
// "what do I do next?". Read-only: live numbers come from the shared useLiveSummary hook (GET only); everything else is
// read from what this browser has saved. Numbers are never invented: no verified data means "—" and a caption.
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { offerStorageKey, restoreLocalOffers } from '../../lib/local-offers';
import { auditKey, restoreAudit } from '../../lib/ventra-workspace';
import { opportunityKey, restoreSavedAudit } from '../../lib/growth-opportunity';
import { filterServices, serviceCategories, type ServiceCategory } from '../../lib/ventra-navigation';
import { routeOf, routes } from '../../lib/onboarding';
import { primaryAction } from './home-progress';
import { useWorkspace } from './ventra-context';
import { TodayPanel } from './today-view';
import { OverviewStats, useOverview } from './overview-dashboard';
import { AccountActivity } from './account-activity';
import { Legacy } from './ventra-shell';
import { LiveNotice } from './live-notice';
import { liveCaption, liveValue, useLiveSummary } from './live-summary';
import { AnalyticsCard, Badge, Chip, GlassCard, Icon, ListRow, PageHead, PromoCard, SectionHead, StatCard } from '../design-system/liquid-glass/components';
import type { IconName } from '../design-system/liquid-glass/components';

const serviceIcon = (icon: string): IconName => ({ chart: 'chart', bolt: 'sparkle', people: 'leads', edit: 'create', calendar: 'calendar', grid: 'globe', box: 'book', phone: 'phone' } as Record<string, IconName>)[icon] ?? 'arrow';

export default function VentraHome() {
  const { profile, ready, error } = useWorkspace(); const established = profile?.stage==='existing';
  const [offerReady, setOfferReady] = useState(false); const [auditDate, setAuditDate] = useState(''); const [localError, setLocalError] = useState(''); const [auditDone, setAuditDone] = useState(false); const [category, setCategory] = useState<ServiceCategory>('All Services');
  useEffect(() => {
    function read() { try { setOfferReady(profile ? !!restoreLocalOffers(localStorage.getItem(offerStorageKey(profile.id)), profile)?.length : false); setAuditDate(restoreAudit(localStorage.getItem(auditKey))?.updatedAt || ''); setAuditDone(restoreSavedAudit(localStorage.getItem(opportunityKey))?.step === 6); setLocalError(''); } catch { setOfferReady(false); setAuditDate(''); setLocalError('Some local drafts cannot be read. Review original tools; no data was changed.'); } }
    read(); window.addEventListener('storage', read); window.addEventListener('ventra:updated', read);
    return () => { window.removeEventListener('storage', read); window.removeEventListener('ventra:updated', read); };
  }, [profile]);
  const overview = useOverview(profile);
  const live = useLiveSummary();
  const recommendations = filterServices(category).slice(0, 4);
  const route = profile ? routeOf(profile) : null;
  const next = primaryAction(route);
  const steps = [
    { title: 'Set up your business', note: profile ? `${routes.find(r => r.id === route)?.title} · saved in this browser` : 'Tell us about your goals and what you do.', href: '/onboarding', done: !!profile },
    { title: profile?.primary === 'education' ? 'Create your first course or offer' : 'Create your first offer', note: offerReady ? 'Offer saved · not published' : 'Services, products or course drafts.', href: profile?.primary === 'education' ? '/business?tab=delivery' : '/business?tab=offers', done: offerReady },
    { title: 'Teach your AI team about you', note: 'FAQs, hours and booking rules for the Setter and Receptionist.', href: '/customers/ai-team', done: false },
    { title: 'Run your free Growth Audit', note: auditDone || auditDate ? 'Audit saved in this browser' : 'Find where enquiries and bookings are slipping.', href: '/grow/audit', done: auditDone || !!auditDate },
  ];
  const doneCount = steps.filter(s => s.done).length;
  const s = live.phase === 'live' ? live.summary : null;
  const trend = s && s.leads.total > 0 ? s.enquiriesByDay.map(d => d.count) : [];
  const showRate = s && s.bookings.attended30d + s.bookings.noShow30d > 0 ? Math.round(100 * s.bookings.attended30d / (s.bookings.attended30d + s.bookings.noShow30d)) + '%' : '—';
  const name = profile?.name?.trim();

  return <div className="vg-stack vg-home">
    <PageHead title={name ? `Welcome back, ${name}` : 'Welcome to Ventra'} sub={profile ? (established ? 'Your business at a glance.' : 'Your next steps, from what you have saved.') : 'Set up your business and Home becomes personal to you.'} />
    {(!ready || error || localError) && <GlassCard tight><p className="vg-notice" role={error || localError ? 'alert' : 'status'}><Icon name="alert" />{error || localError || 'Restoring saved workspace…'}</p></GlassCard>}

    <PromoCard eyebrow="Next step" title={!profile ? 'Set up your business' : !(auditDone || auditDate) ? 'Run your free Growth Audit' : next.label} text={!profile ? next.note : !(auditDone || auditDate) ? 'Answer a few questions and see where enquiries, calls and bookings are slipping, with every assumption shown.' : next.note} action={{ label: !profile ? 'Start setup' : !(auditDone || auditDate) ? 'Start the audit' : 'Continue', icon: 'arrow', href: !profile ? '/onboarding' : !(auditDone || auditDate) ? '/grow/audit' : next.href }} />

    <section className="vg-grid vg-grid-2 vg-stats-3" aria-label="Today">
      <StatCard icon="calendar" tone="violet" label="Bookings today" value={liveValue(live, x => x.bookings.today)} caption={s ? `${s.bookings.next7Days} in the next 7 days` : liveCaption(live)} href="/customers?tab=appointments" />
      <StatCard icon="chat" tone="teal" label="Current conversations" value={liveValue(live, x => x.conversations.active)} caption={s ? 'People who messaged in the last 7 days' : liveCaption(live)} href="/customers" />
      <StatCard icon="headset" tone="magenta" label="AI Receptionist tasks" value={liveValue(live, x => x.calls.needsOwner)} badge={s && s.calls.needsOwner > 0 ? <Badge tone="violet" icon="sparkle">Needs you</Badge> : undefined} caption={s ? `${s.calls.last7Days} calls answered this week` : liveCaption(live)} href="/customers/ai-team" />
      {s && s.approvals.queued > 0 && <StatCard icon="sparkle" tone="violet" label="Replies waiting for approval" value={String(s.approvals.queued)} badge={<Badge tone="warning" icon="alert">Needs reply</Badge>} caption="Your AI drafted these; nothing is sent until you approve." href="/customers" />}
    </section>
    <LiveNotice live={live} />

    <div className="vg-grid vg-grid-2">
      <AnalyticsCard title="Enquiries" note={s ? 'Live · last 14 days' : undefined} points={trend}
        metrics={[{ value: s ? String(s.leads.newThisWeek) : '—', label: 'New this week' }, { value: s ? String(s.bookings.next7Days) : '—', label: 'Next 7 days' }, { value: showRate, label: 'Show-up' }]}
        empty={<div className="vg-chart-empty v-chart-empty"><Icon name="chart" /><strong>No verified performance data yet</strong><p>{s ? 'The trend starts with your first enquiry.' : 'A trend needs connected data and a real baseline.'}</p></div>} />

      <GlassCard aria-labelledby="getting-started">
        <div className="vg-card-head"><div><h2 className="vg-card-title" id="getting-started">Get started with Ventra</h2><span className="vg-sample">{doneCount} of {steps.length} done</span></div></div>
        <div className="vg-progress" aria-hidden="true"><span style={{ width: `${(doneCount / steps.length) * 100}%` }} /></div>
        <ol className="vg-steps">{steps.map((step, i) => <li key={step.href}><Link className="vg-row" href={step.href}><span className={'vg-step-num vg-bead' + (step.done ? ' vg-step-done' : '')}>{step.done ? <Icon name="check" strokeWidth={3} /> : i + 1}</span><span className="vg-row-text"><strong>{step.title}</strong><small>{step.note}</small></span><Icon name="arrow" className="vg-row-go" /></Link></li>)}</ol>
      </GlassCard>
    </div>

    <SectionHead title="Recommended for you" id="recommended-title" action={{ label: 'View all', href: '/services' }} />
    <div className="vg-chips" role="group" aria-label="Filter recommendations">{serviceCategories.map(c => <Chip key={c} aria-pressed={c === category} className={c === category ? 'is-on' : ''} onClick={() => setCategory(c)}>{c === 'All Services' ? 'All' : c}</Chip>)}</div>
    <GlassCard aria-labelledby="recommended-title"><div className="vg-rows" aria-live="polite">{recommendations.map(r => <ListRow key={r.href} href={r.href} icon={serviceIcon(r.icon)} tone={r.category === 'Clients' ? 'teal' : r.category === 'Sales' ? 'violet' : 'indigo'} title={r.title} note={r.title === 'Growth Audit' ? 'Manual review today · AI analysis unavailable' : `${r.description} · ${r.status}`} />)}{!recommendations.length && <p className="vg-muted">Nothing in this group yet.</p>}</div></GlassCard>

    {profile && <GlassCard aria-label="Today's tasks"><Legacy><TodayPanel profile={profile} limit={3} /></Legacy></GlassCard>}

    <SectionHead title="Business overview" />
    <Legacy><section className="v-draft-overview" aria-label="Business overview, local draft"><span className="v-status">From data saved in this browser</span><OverviewStats o={overview} noProfile={!profile} kpi sectionClass="v-kpis" /></section></Legacy>

    <GlassCard aria-labelledby="recent-work"><div className="vg-card-head"><div><h2 className="vg-card-title" id="recent-work">Recent saved work</h2></div></div><Legacy><AccountActivity /></Legacy>{auditDate && <ListRow href="/insights?tab=audit" icon="create" title="Manual audit saved in this browser" note={new Date(auditDate).toLocaleString('en-AU')} />}</GlassCard>
  </div>;
}
