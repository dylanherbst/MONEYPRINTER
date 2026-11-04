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
export default function VentraHome(){
 const {profile,ready,error}=useWorkspace();const established=profile?.stage==='existing';
 const [offerReady,setOfferReady]=useState(false);const [auditDate,setAuditDate]=useState('');const [localError,setLocalError]=useState('');const [category,setCategory]=useState<ServiceCategory>('All Services');
 useEffect(()=>{function read(){try{setOfferReady(profile?!!restoreLocalOffers(localStorage.getItem(offerStorageKey(profile.id)),profile)?.length:false);setAuditDate(restoreAudit(localStorage.getItem(auditKey))?.updatedAt||'');setLocalError('');}catch{setOfferReady(false);setAuditDate('');setLocalError('Some local drafts cannot be read. Review original tools; no data was changed.');}}read();window.addEventListener('storage',read);window.addEventListener('ventra:updated',read);return()=>{window.removeEventListener('storage',read);window.removeEventListener('ventra:updated',read);};},[profile]);
 const recommendations=filterServices(category).slice(0,4);
 const steps=[{title:'Set up your business',note:profile?`${routes.find(r=>r.id===routeOf(profile))?.title} · saved in this browser`:'Tell us about your goals and what you do.',href:'/onboarding',done:!!profile},{title:profile?.primary==='education'?'Create your first course or offer':'Create your first offer',note:offerReady?'Local offer saved · not published':'Services, products or course drafts.',href:profile?.primary==='education'?'/business?tab=delivery':'/business?tab=offers',done:offerReady},{title:'Review your connections',note:'Not connected · optional provider setup.',href:'/settings?section=integrations',done:false},{title:'Choose your growth direction',note:auditDate?'Manual audit saved in this browser':'Write an evidence-led 30-day plan.',href:'/insights?tab=audit',done:!!auditDate}];
 return <div className="v-dashboard">
 <h1 className="v-sr-only">{established?'Your business overview':'Your business starts here'}</h1>
 {(!ready||error||localError)&&<GlassCard className="v-home-feedback"><p role={error||localError?'alert':'status'}>{error||localError||'Restoring saved workspace…'}</p>{(error||localError)&&<Link href="/tools">Review original setup</Link>}</GlassCard>}
 <div className="v-home-top"><section className="v-hero v-glass" aria-labelledby="audit-feature-title"><div className="v-hero-copy"><span className="v-overline">FEATURED</span><h2 id="audit-feature-title">AI Growth Audit</h2><p>Find your next opportunity.<br/>Build a clearer growth plan.</p><Link className="v-button v-hero-cta" href="/services/growth-audit">Get Started <OutlineIcon name="arrow"/></Link><small>Manual review today · AI analysis unavailable</small></div><div className="v-growth-art" aria-hidden="true"><i/><i/><i/></div></section>
 <section className="v-kpis" aria-label="Business performance — no verified provider data">{[{title:'Total Revenue',icon:'chart',href:'/insights?tab=performance',note:'No verified payment data'},{title:'New Clients',icon:'people',href:'/customers',note:'No verified acquisition data'},{title:'Bookings',icon:'calendar',href:'/sales?tab=appointments',note:'Calendar not connected'},{title:'Conversion Rate',icon:'bolt',href:'/insights?tab=performance',note:'No verified baseline'}].map(k=><Link className="v-kpi v-glass" key={k.title} href={k.href}><span className="v-icon-tile"><OutlineIcon name={k.icon}/></span><span><span className="v-kpi-title">{k.title}</span><strong aria-label="Unavailable">—</strong><small>{k.note}</small></span></Link>)}</section></div>
 {profile&&<GlassCard className="v-home-today"><TodayPanel profile={profile}/></GlassCard>}
 {profile&&<GlassCard className="v-home-search"><DraftSearch profileId={profile.id}/></GlassCard>}
 <CategoryChips value={category} onChange={setCategory}/>
 <section className="v-home-recommendations" aria-labelledby="recommended-title"><div className="v-section-heading"><h2 id="recommended-title">Recommended for you</h2><Link href="/services">View all <OutlineIcon name="arrow"/></Link></div><div className="v-services" aria-live="polite">{recommendations.map(s=><ServiceTile key={s.href} service={s}/>)}</div></section>
 <GlassCard className="v-home-setup"><h2>Get started with Ventra</h2><ol className="v-checklist">{steps.map((step,i)=><li key={step.href}><Link href={step.href}><span className="v-step-number">{step.done?<OutlineIcon name="check"/>:i+1}</span><span><strong>{step.title}</strong><small>{step.note}</small></span><OutlineIcon name="arrow"/></Link></li>)}</ol>{!profile&&<Link className="v-text-link" href="/onboarding">Set up your workspace <OutlineIcon name="arrow"/></Link>}</GlassCard>
 <GlassCard className="v-home-activity"><div className="v-section-heading"><h2>Recent activity</h2><Link href="/tools">Local tools <OutlineIcon name="arrow"/></Link></div>{auditDate?<Link className="v-activity-row" href="/insights?tab=audit"><span className="v-icon-tile"><OutlineIcon name="edit"/></span><span><strong>Manual audit saved locally</strong><time dateTime={auditDate}>{new Date(auditDate).toLocaleString('en-AU')}</time></span><OutlineIcon name="arrow"/></Link>:<div className="v-empty"><p>No verified activity feed yet. Your drafts stay in this browser; live calls, bookings and payments are not connected.</p><Link href="/settings?section=integrations">Review connections <OutlineIcon name="arrow"/></Link></div>}</GlassCard>
 <GlassCard className="v-home-chart"><h2>Business growth</h2><div className="v-chart-empty"><OutlineIcon name="trend"/><strong>No verified performance data yet</strong><p>A trend needs connected data and a real baseline.</p><Link className="v-text-link" href="/settings?section=integrations">Review data requirements <OutlineIcon name="arrow"/></Link></div></GlassCard>
 </div>;
}
