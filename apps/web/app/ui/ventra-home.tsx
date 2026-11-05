'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {offerStorageKey,restoreLocalOffers} from '../../lib/local-offers';
import {auditKey,restoreAudit} from '../../lib/ventra-workspace';
import {filterServices,type ServiceCategory} from '../../lib/ventra-navigation';
import {GlassCard,OutlineIcon} from '../design-system/primitives';
import {CategoryChips,ServiceTile} from './ventra-service-components';
import {useWorkspace} from './ventra-context';
import {routeOf,routes} from '../../lib/onboarding';
import {TodayPanel} from './today-view';
import {DraftSearch} from './draft-search';
import {OverviewAside,OverviewCharts,OverviewStats,useActivity,useOverview} from './overview-dashboard';
import {PrimaryAction,RouteProgress} from './home-progress';
import {AccountActivity} from './account-activity';
import {ExportLink} from '../design-system/export-link';
export default function VentraHome(){
 const {profile,ready,error}=useWorkspace();const established=profile?.stage==='existing';
 const [offerReady,setOfferReady]=useState(false);const [auditDate,setAuditDate]=useState('');const [localError,setLocalError]=useState('');const [category,setCategory]=useState<ServiceCategory>('All Services');
 useEffect(()=>{function read(){try{setOfferReady(profile?!!restoreLocalOffers(localStorage.getItem(offerStorageKey(profile.id)),profile)?.length:false);setAuditDate(restoreAudit(localStorage.getItem(auditKey))?.updatedAt||'');setLocalError('');}catch{setOfferReady(false);setAuditDate('');setLocalError('Some local drafts cannot be read. Review original tools; no data was changed.');}}read();window.addEventListener('storage',read);window.addEventListener('ventra:updated',read);return()=>{window.removeEventListener('storage',read);window.removeEventListener('ventra:updated',read);};},[profile]);
 const overview=useOverview(profile);const activity=useActivity(profile);
 const recommendations=filterServices(category).slice(0,4);
 const steps=[{title:'Set up your business',note:profile?`${routes.find(r=>r.id===routeOf(profile))?.title} · saved in this browser`:'Tell us about your goals and what you do.',href:'/onboarding',done:!!profile},{title:profile?.primary==='education'?'Create your first course or offer':'Create your first offer',note:offerReady?'Local offer saved · not published':'Services, products or course drafts.',href:profile?.primary==='education'?'/business?tab=delivery':'/business?tab=offers',done:offerReady},{title:'Review your connections',note:'Not connected · optional provider setup.',href:'/settings?section=integrations',done:false},{title:'Choose your growth direction',note:auditDate?'Manual audit saved in this browser':'Write an evidence-led 30-day plan.',href:'/insights?tab=audit',done:!!auditDate}];
 return <div className="v-dashboard v-dash">
 <div className="v-page-heading v-dash-head"><div><h1>{profile?.name?.trim()?`Welcome back, ${profile.name.trim()}`:'Welcome to Ventra'}</h1><p>{profile?(established?'Your business at a glance, from what you have saved.':'Your next steps, from what you have saved.'):'Set up your business and Home becomes personal to you.'}</p></div><ExportLink/></div>
 {(!ready||error||localError)&&<GlassCard className="v-home-feedback"><p role={error||localError?'alert':'status'}>{error||localError||'Restoring saved workspace…'}</p>{(error||localError)&&<Link href="/onboarding">Review your business setup</Link>}</GlassCard>}
 <div className="v-dash-main">
 <PrimaryAction profile={profile}/>
 <section className="v-draft-overview" aria-label="Business overview, local draft"><div className="v-section-heading"><h2>Business overview</h2><span className="v-status">Local draft · from data saved in this browser</span></div><OverviewStats o={overview} noProfile={!profile} kpi sectionClass="v-kpis"/></section>
 {profile&&<GlassCard className="v-home-today"><TodayPanel profile={profile} limit={3}/></GlassCard>}
 <RouteProgress profile={profile} overview={overview}/>
 <GlassCard className="v-home-activity"><div className="v-section-heading"><h2>Recent saved work</h2></div><AccountActivity/>{auditDate&&<Link className="v-activity-row" href="/insights?tab=audit"><span className="v-icon-tile"><OutlineIcon name="edit"/></span><span><strong>Manual audit saved in this browser</strong><time dateTime={auditDate}>{new Date(auditDate).toLocaleString('en-AU')}</time></span><OutlineIcon name="arrow"/></Link>}</GlassCard>
 {profile&&<GlassCard className="v-home-search"><DraftSearch profileId={profile.id}/></GlassCard>}
 <CategoryChips value={category} onChange={setCategory}/>
<section className="v-home-recommendations" aria-labelledby="recommended-title"><div className="v-section-heading"><h2 id="recommended-title">Recommended for you</h2><Link href="/services">View all <OutlineIcon name="arrow"/></Link></div><div className="v-services" aria-live="polite">{recommendations.map(s=><ServiceTile key={s.href} service={s}/>)}</div></section>
 <Link className="v-growth-row v-glass" href="/services/growth-audit"><span className="v-icon-tile"><OutlineIcon name="chart"/></span><span><strong>Growth audit</strong><small>Manual review today · AI analysis unavailable</small></span><OutlineIcon name="arrow"/></Link>
 <GlassCard className="v-home-setup"><h2>Get started with Ventra</h2><ol className="v-checklist">{steps.map((step,i)=><li key={step.href}><Link href={step.href}><span className="v-step-number">{step.done?<OutlineIcon name="check"/>:i+1}</span><span><strong>{step.title}</strong><small>{step.note}</small></span><OutlineIcon name="arrow"/></Link></li>)}</ol>{!profile&&<Link className="v-text-link" href="/onboarding">Set up your workspace <OutlineIcon name="arrow"/></Link>}</GlassCard>
 <section className="v-draft-overview" aria-label="Charts, local draft"><div className="v-section-heading"><h2>Charts</h2><span className="v-status">Local draft · from data saved in this browser</span></div><OverviewCharts o={overview}/></section>
 <GlassCard className="v-home-chart"><h2>Business growth</h2><div className="v-chart-empty"><OutlineIcon name="trend"/><strong>No verified performance data yet</strong><p>A trend needs connected data and a real baseline.</p><Link className="v-text-link" href="/settings?section=integrations">Review data requirements <OutlineIcon name="arrow"/></Link></div></GlassCard>
 </div>
 <aside className="v-dash-aside" aria-label="Highlights"><OverviewAside o={overview} activity={activity}/></aside>
 </div>;
}
