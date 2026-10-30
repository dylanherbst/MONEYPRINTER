'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { GlassButton, GlassCard, GlassInput, OutlineIcon } from '../design-system/primitives';
import { activePage, createOptions, pages, searchPages } from '../../lib/ventra-navigation';
import { WorkspaceProvider } from './ventra-context';
import '../design-system/tokens.css';
import '../design-system/workspace.css';
import '../design-system/refresh.css';
function Wordmark(){return <Link className="v-wordmark" href="/" aria-label="Ventra Home">VENTRA<small>GROW · AUTOMATE · SCALE</small></Link>;}
export default function VentraShell({children}:{children:ReactNode}){return <Suspense fallback={<p>Loading your workspace…</p>}><ShellContent>{children}</ShellContent></Suspense>;}
function ShellContent({children}:{children:ReactNode}){
 const pathname=usePathname();const params=useSearchParams();const tab=params.get('tab');const section=params.get('section');const [menu,setMenu]=useState(false);const [account,setAccount]=useState(false);const [notifications,setNotifications]=useState(false);const [query,setQuery]=useState('');
 const dialog=useRef<HTMLDialogElement>(null);const trigger=useRef<HTMLElement|null>(null);const menuButton=useRef<HTMLButtonElement>(null);const background=useRef<HTMLDivElement>(null);const accountButton=useRef<HTMLButtonElement>(null);const menuPanel=useRef<HTMLElement>(null);const accountPanel=useRef<HTMLElement>(null);
 useEffect(()=>{setMenu(false);setAccount(false);setQuery('');},[pathname,tab]);
 useEffect(()=>{
  if(!menu&&!account)return;
  const close=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();if(account){setAccount(false);accountButton.current?.focus();}else{setMenu(false);menuButton.current?.focus();}}};
  const outside=(e:PointerEvent)=>{const t=e.target as Node;if(menu&&!menuPanel.current?.contains(t)&&!menuButton.current?.contains(t))setMenu(false);if(account&&!accountPanel.current?.contains(t)&&!accountButton.current?.contains(t))setAccount(false);};
  const blur=(e:FocusEvent)=>{const t=e.target as Node;if(menu&&!menuPanel.current?.contains(t)&&!menuButton.current?.contains(t))setMenu(false);if(account&&!accountPanel.current?.contains(t)&&!accountButton.current?.contains(t))setAccount(false);};
  window.addEventListener('keydown',close);window.addEventListener('pointerdown',outside);window.addEventListener('focusin',blur);
  return()=>{window.removeEventListener('keydown',close);window.removeEventListener('pointerdown',outside);window.removeEventListener('focusin',blur);};
 },[menu,account]);
 useEffect(()=>{if(menu)menuPanel.current?.querySelector<HTMLElement>('a')?.focus();if(account)accountPanel.current?.querySelector<HTMLElement>('a')?.focus();},[menu,account]);
 function openCreate(event:React.MouseEvent<HTMLButtonElement>){trigger.current=event.currentTarget;dialog.current?.showModal();background.current?.setAttribute('inert','');}
 function closeCreate(){dialog.current?.close();background.current?.removeAttribute('inert');trigger.current?.focus();}
 function nav(href:string,title:string,icon:string){return <Link key={href} href={href} aria-current={(href==='/settings?section=help'?pathname==='/settings'&&section==='help':href==='/settings'?pathname==='/settings'&&section!=='help':activePage(pathname,tab,href))?'page':undefined} onClick={()=>setMenu(false)}><OutlineIcon name={icon}/><span>{title}</span></Link>;}
 function searchField(className:string){return <div className={className}><label className="v-search"><OutlineIcon name="search"/><span className="v-sr-only">Search pages</span><GlassInput type="search" placeholder="Search services, tools or guidance…" value={query} onChange={e=>setQuery(e.target.value)}/></label></div>;}
 const results=searchPages(query);
 return <WorkspaceProvider><div className={'ventra-app'+(pathname.startsWith('/services/')?' v-detail-shell':'')}><div className="v-shell-background" ref={background}>
 <a className="v-skip" href="#ventra-main" onClick={e=>{e.preventDefault();document.getElementById('ventra-main')?.focus();}}>Skip to main content</a>
 <aside className="v-sidebar"><Wordmark/><nav aria-label="Main navigation">{pages.map(p=>nav(p.href,p.title,p.icon))}</nav><nav className="v-nav-secondary" aria-label="Settings and help">{nav('/settings','Settings','settings')}{nav('/settings?section=help','Help','help')}</nav><div className="v-sidebar-foot"><span className="v-status">Browser-local workspace</span><p>No external services verified.</p><Link href="/tools">Original tools & demo <OutlineIcon name="arrow"/></Link></div></aside>
 <div className="v-main-wrap"><header className="v-header"><GlassButton variant="icon" className="v-menu-toggle" ref={menuButton} aria-label={menu?'Close navigation':'Open navigation'} aria-expanded={menu} aria-controls="v-mobile-menu" onClick={()=>{setAccount(false);setMenu(!menu);}}><OutlineIcon name={menu?'close':'menu'}/></GlassButton><div className="v-mobile-brand"><Wordmark/></div>
 {searchField('v-desktop-search')}
 <GlassButton variant="icon" aria-label="Notifications" aria-expanded={notifications} onClick={()=>setNotifications(!notifications)}><OutlineIcon name="bell"/></GlassButton>
 <GlassButton className="v-header-create" variant="secondary" onClick={openCreate}><OutlineIcon name="plus"/>Create</GlassButton>
 <GlassButton variant="icon" ref={accountButton} aria-label="Account menu" aria-expanded={account} aria-controls="v-account-menu" onClick={()=>{setMenu(false);setAccount(!account);}}><OutlineIcon name="account"/></GlassButton>{searchField('v-mobile-search')}</header>
 {menu&&<nav ref={menuPanel} onClick={e=>{if((e.target as HTMLElement).closest('a'))setMenu(false);}} className="v-mobile-menu v-glass" id="v-mobile-menu" aria-label="Additional navigation">{pages.map(p=>nav(p.href,p.title,p.icon))}<Link href="/settings">Settings & help</Link>{['profile','integrations','billing','team','help'].map(x=><Link key={x} href={'/settings?section='+x}>{x}</Link>)}<Link href="/inbox">Inbox · unavailable</Link><Link href="/tools">Original local tools</Link></nav>}
 {account&&<nav ref={accountPanel} onClick={e=>{if((e.target as HTMLElement).closest('a'))setAccount(false);}} className="v-account-menu v-glass" id="v-account-menu" aria-label="Account and support">{['Business Profile','Integrations','Billing','Team','Help'].map((name,i)=><Link key={name} href={'/settings?section='+['profile','integrations','billing','team','help'][i]} onClick={()=>setAccount(false)}>{name}</Link>)}<Link href="/workspace">Account workspace</Link></nav>}
 {notifications&&<GlassCard><h2>No notification feed connected</h2><p>Live calls, bookings and payment alerts are unavailable.</p><GlassButton onClick={()=>setNotifications(false)}>Close notifications</GlassButton></GlassCard>}
 {query.trim()&&<GlassCard className="v-search-results"><h2>Pages</h2><p role="status">{results.length} matching {results.length===1?'page':'pages'}</p>{results.map(p=><Link key={p.href} href={p.href} onClick={()=>setQuery('')}>{p.title}<span>{p.description}</span><OutlineIcon name="arrow"/></Link>)}{!results.length&&<p>No matching pages. No external search or AI request was made.</p>}<GlassButton onClick={()=>setQuery('')}>Clear search</GlassButton></GlassCard>}
 <main id="ventra-main" className="v-main v-workspace-main" tabIndex={-1}>{children}</main>
 <footer className="v-footer">Local drafts, not live operations. Save before leaving. Nothing here publishes, sends messages or collects payments. <Link href="/tools">Original tools</Link></footer></div>
 <nav className="v-dock v-glass" aria-label="Mobile main navigation">{nav('/','Home','home')}{nav('/services','Services','grid')}<button className="v-create-dock" aria-current={pathname==='/create'?'page':undefined} onClick={openCreate} aria-haspopup="dialog"><OutlineIcon name="plus"/><span>Create</span></button>{nav('/customers','Clients','people')}{nav('/settings','Account','account')}</nav>
 </div><dialog className="v-create-dialog v-glass" ref={dialog} aria-labelledby="v-create-title" onCancel={e=>{e.preventDefault();closeCreate();}} onKeyDown={e=>{if(e.key!=='Tab')return;const focusables=[...e.currentTarget.querySelectorAll<HTMLElement>('a[href],button:not(:disabled)')];const first=focusables[0],last=focusables.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}>
 <div className="v-section-heading"><h2 id="v-create-title">What would you like to create?</h2><GlassButton variant="icon" aria-label="Close Create" onClick={closeCreate}><OutlineIcon name="close"/></GlassButton></div><p>Start a local draft. AI generation and public publishing are not connected.</p><div className="v-create-options">{createOptions.map(o=><Link key={o.title} href={o.href} onClick={closeCreate}><strong>{o.title}</strong><span>{o.detail}</span><OutlineIcon name="arrow"/></Link>)}</div></dialog>
 </div></WorkspaceProvider>;
}
