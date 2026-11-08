'use client';
// VENTRA Liquid Glass components, ported from docs/design/ventra-ui/components.js (approved 2026-11-08).
// Class names (vg-*) are unchanged so glass.css applies as-is. Spec: docs/design/LIQUID_GLASS_SPEC.md.
import Link from 'next/link';
import { useId, useState } from 'react';
import type { ButtonHTMLAttributes, ComponentPropsWithRef, CSSProperties, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/** Line icons, 24px grid, 1.8 stroke, round caps. */
const PATHS = {
  home: 'M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z',
  leads: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1M16 3.5a4 4 0 0 1 0 7.5M19 14a5 5 0 0 1 3 5v2',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z',
  calendar: 'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 9h16M8 2v4M16 2v4M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  bell: 'M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9zM10 20a2 2 0 0 0 4 0',
  user: 'M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM4 21a8 8 0 0 1 16 0',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  plus: 'M12 5v14M5 12h14',
  chat: 'M4 12a8 8 0 0 1 8-8 8 8 0 0 1 0 16H4l2-2.8A7.9 7.9 0 0 1 4 12zM8.5 12h.01M12 12h.01M15.5 12h.01',
  headset: 'M4 14v-2a8 8 0 0 1 16 0v2M4 14a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2zM20 14a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2zM18 18a4 4 0 0 1-4 3h-2',
  chart: 'M6 20V12M12 20V5M18 20v-9',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  up: 'M12 19V5M6 11l6-6 6 6',
  down: 'M12 5v14M6 13l6 6 6-6',
  check: 'M5 12.5l4.5 4.5L19 7',
  chevron: 'M6 9l6 6 6-6',
  close: 'M6 6l12 12M18 6L6 18',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  alert: 'M12 9v4M12 17h.01M10.3 4l-8 14a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0z',
  // Added for the five app areas (same grid and stroke).
  create: 'M12 3l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L4.8 8.3l5-.7z',
  grow: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  money: 'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 10h18M7 15h4',
  settings: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',
  help: 'M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  book: 'M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H4zM13 7a3 3 0 0 1 3-3h4v15h-3a4 4 0 0 0-4 2',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18',
  rocket: 'M5 19c0-3 2-5 4-5M14 4c4 0 6 2 6 6-3 4-6 6-10 6l-2-2c0-4 2-7 6-10zM9 14l-2 5 5-2',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
  lock: 'M6 11V8a6 6 0 0 1 12 0v3M5 11h14v10H5z',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  back: 'M19 12H5M11 6l-6 6 6 6',
} as const;
export type IconName = keyof typeof PATHS;
export type Tone = 'violet' | 'teal' | 'magenta' | 'indigo';

export function Icon({ name, size, strokeWidth, gradient, className }: { name: IconName; size?: number; strokeWidth?: number; gradient?: Tone; className?: string }) {
  const id = 'vg-ig-' + useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={gradient ? `url(#${id})` : 'currentColor'} strokeWidth={strokeWidth ?? (name === 'more' ? 3.2 : 1.8)} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" width={size} height={size} className={className}>
      {gradient && <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" className={`vg-g-${gradient}-a`} /><stop offset="1" className={`vg-g-${gradient}-b`} /></linearGradient></defs>}
      <path d={PATHS[name] ?? PATHS.more} />
    </svg>
  );
}

/** The VENTRA wordmark. The mark is the approved ribbon V (public/brand/ventra-mark.png); never recoloured. */
export function Wordmark({ href, markOnly, className }: { href?: string; markOnly?: boolean; className?: string }) {
  const body = <>
    <img className="vg-mark" src="/brand/ventra-mark.png" alt="" width={44} height={30} />
    {!markOnly && <span>VENTRA</span>}
  </>;
  return href ? <Link className={cx('vg-wordmark', className)} href={href} aria-label="VENTRA Home">{body}</Link> : <span className={cx('vg-wordmark', className)} aria-label="VENTRA">{body}</span>;
}

type Variant = 'primary' | 'secondary' | 'glass' | 'ghost';
type ButtonProps = { variant?: Variant; size?: 'sm' | 'md' | 'lg'; icon?: IconName; iconRight?: IconName; block?: boolean; href?: string; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>;
const buttonClass = (variant: Variant, size: string | undefined, block: boolean | undefined, className?: string) => cx('vg-btn', 'vg-btn-' + variant, variant === 'glass' && 'vg-bead', size && size !== 'md' && 'vg-btn-' + size, block && 'vg-btn-block', className);
/** primary = violet liquid (at most one per screen); secondary = aqua; glass = default bead; ghost = hairline only. */
export function GlassButton({ variant = 'glass', size, icon, iconRight, block, href, className, children, type, ...rest }: ButtonProps) {
  const inner = <>{icon && <Icon name={icon} />}{children}{iconRight && <Icon name={iconRight} />}</>;
  if (href) return <Link href={href} className={buttonClass(variant, size, block, className)}>{inner}</Link>;
  return <button type={type ?? 'button'} className={buttonClass(variant, size, block, className)} {...rest}>{inner}</button>;
}

type IconButtonProps = { icon: IconName; label: string; dot?: boolean; variant?: 'glass' | 'violet'; size?: 'sm' | 'md'; strokeWidth?: number; href?: string } & Omit<ComponentPropsWithRef<'button'>, 'children'>;
/** label is required: it is the accessible name. */
export function IconButton({ icon, label, dot, variant, size, strokeWidth, href, className, ...rest }: IconButtonProps) {
  const cls = cx('vg-iconbtn', variant === 'violet' ? 'vg-iconbtn-violet' : 'vg-bead', size === 'sm' && 'vg-iconbtn-sm', className);
  const inner = <><Icon name={icon} strokeWidth={strokeWidth} />{dot && <span className="vg-dot" aria-hidden="true" />}</>;
  if (href) return <Link href={href} aria-label={label} className={cls}>{inner}</Link>;
  return <button type="button" aria-label={label} className={cls} {...rest}>{inner}</button>;
}

type CardProps = { as?: 'section' | 'div' | 'article' | 'li' | 'aside'; tight?: boolean; promo?: boolean; cyan?: boolean; className?: string; children: ReactNode; style?: CSSProperties; 'aria-label'?: string; 'aria-labelledby'?: string };
/** A floating glass card. Never put a card inside another card. */
export function GlassCard({ as: Tag = 'section', tight, promo, cyan, className, children, ...rest }: CardProps) {
  return <Tag className={cx('vg-card vg-glass', tight && 'vg-card-tight', promo && 'vg-promo', cyan && 'vg-cyan', className)} {...rest}>{children}</Tag>;
}

/** Card identity. Tone is fixed by meaning: violet bookings · teal conversations · magenta AI Receptionist · indigo analytics. */
export function IconTile({ icon, tone = 'violet', size }: { icon: IconName; tone?: Tone; size?: 'sm' | 'md' }) {
  return <span className={cx('vg-tile vg-bead', 'vg-tone-' + tone, size === 'sm' && 'vg-tile-sm')} aria-hidden="true"><Icon name={icon} strokeWidth={2.4} gradient={tone} /></span>;
}

export type BadgeTone = 'violet' | 'success' | 'warning' | 'danger' | 'neutral';
/** Status. Always a word or icon, never colour alone. */
export function Badge({ tone = 'neutral', icon, trend, children, className }: { tone?: BadgeTone; icon?: IconName; trend?: 'up' | 'down'; children: ReactNode; className?: string }) {
  const name = icon ?? (trend === 'up' ? 'up' : trend === 'down' ? 'down' : undefined);
  return <span className={cx('vg-badge', 'vg-badge-' + tone, className)}>{name && <Icon name={name} strokeWidth={2.4} />}{children}</span>;
}

/** One number and a label. Pass "—" plus a caption when there is no verified data. */
export function StatCard({ icon, tone, label, value, badge, control, caption, href }: { icon: IconName; tone?: Tone; label: string; value: ReactNode; badge?: ReactNode; control?: ReactNode; caption?: ReactNode; href?: string }) {
  return (
    <GlassCard className={cx('vg-stat', href && 'vg-stat-link')}>
      <IconTile icon={icon} tone={tone} />
      <div className="vg-stat-body">
        <div className="vg-stat-label">{href ? <Link href={href} className="vg-stretch">{label}</Link> : label}</div>
        <div className="vg-stat-row"><span className="vg-stat-value">{value}</span>{badge}{control}</div>
        {caption && <div className="vg-stat-caption">{caption}</div>}
      </div>
    </GlassCard>
  );
}

function smooth(xy: [number, number][]) {
  if (!xy.length) return '';
  let d = `M${xy[0][0].toFixed(1)} ${xy[0][1].toFixed(1)}`;
  for (let i = 0; i < xy.length - 1; i++) {
    const p0 = xy[i - 1] ?? xy[i], p1 = xy[i], p2 = xy[i + 1], p3 = xy[i + 2] ?? p2;
    const c = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]];
    d += ' C' + c.map(n => n.toFixed(1)).join(' ');
  }
  return d;
}
export type Metric = { value: string; label: string; delta?: string; trend?: 'up' | 'down' };
/** Trend plus up to three metrics. points run oldest to newest. Label it "Sample data" unless it is real. */
export function AnalyticsCard({ title, points, metrics, note, empty }: { title: string; points: number[]; metrics: Metric[]; note?: string; empty?: ReactNode }) {
  const id = 'vg-ch-' + useId().replace(/:/g, '');
  const w = 640, ht = 170, pad = 12, top = 18;
  const max = Math.max(...points, 1), min = Math.min(...points, 0), span = (max - min) || 1;
  const xy = points.map((v, i): [number, number] => [pad + i * (w - pad * 2) / Math.max(points.length - 1, 1), ht - pad - (v - min) / span * (ht - pad - top)]);
  const line = smooth(xy);
  const area = xy.length ? `${line} L${xy[xy.length - 1][0].toFixed(1)} ${ht} L${xy[0][0].toFixed(1)} ${ht} Z` : '';
  return (
    <GlassCard>
      <div className="vg-card-head"><IconTile icon="chart" tone="indigo" size="sm" /><div><h2 className="vg-card-title">{title}</h2>{note && <span className="vg-sample">{note}</span>}</div></div>
      {points.length > 1 ? (
        <svg className="vg-chart" viewBox={`0 0 ${w} ${ht}`} role="img" aria-label={`${title} trend`}>
          <defs>
            <linearGradient id={id + 'a'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="vg-area-a" /><stop offset="1" className="vg-area-b" /></linearGradient>
            <linearGradient id={id + 'l'} x1="0" y1="0" x2="1" y2="0"><stop offset="0" className="vg-line-a" /><stop offset="1" className="vg-line-b" /></linearGradient>
          </defs>
          <rect className="plot" x={pad} y={4} width={w - pad * 2} height={ht - 4} rx={14} />
          <path d={area} fill={`url(#${id}a)`} /><path className="line" d={line} stroke={`url(#${id}l)`} />
          {xy.map((q, i) => { const last = i === xy.length - 1; return (i === 0 || last || i % 2 === 1) ? <circle key={i} className={last ? 'end' : 'pt'} cx={q[0]} cy={q[1]} r={last ? 9 : 4.5} /> : null; })}
        </svg>
      ) : empty}
      {metrics.length > 0 && <div className="vg-metrics">{metrics.map(m => <div key={m.label} className="vg-metric"><span className="vg-metric-value">{m.value}</span><span className="vg-metric-label">{m.label}</span>{m.delta && <Badge tone={m.trend === 'down' ? 'danger' : 'success'} trend={m.trend ?? 'up'}>{m.delta}</Badge>}</div>)}</div>}
    </GlassCard>
  );
}

export function SearchField({ label = 'Search', action, className, ...rest }: { label?: string; action?: { icon: IconName; label: string; onClick?: () => void; href?: string } } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cx('vg-field vg-bead', className)}>
      <Icon name="search" /><span className="vg-sr-only">{label}</span>
      <input type="search" {...rest} />
      {action && <IconButton icon={action.icon} label={action.label} variant="violet" size="sm" onClick={action.onClick} href={action.href} />}
    </label>
  );
}

export function TextField({ label, hint, state, id, className, multiline, ...rest }: { label?: string; hint?: string; state?: 'valid' | 'invalid'; multiline?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
  const auto = 'vg-f-' + useId().replace(/:/g, '');
  const fid = id ?? auto, hintId = hint ? fid + '-hint' : undefined;
  return (
    <div className={className}>
      {label && <label className="vg-field-label" htmlFor={fid}>{label}</label>}
      <div className={cx('vg-field vg-bead', state === 'valid' && 'vg-field-valid', state === 'invalid' && 'vg-field-invalid', multiline && 'vg-field-multi')}>
        <input id={fid} aria-invalid={state === 'invalid' ? true : undefined} aria-describedby={hintId} {...rest} />
        {state === 'valid' && <span className="vg-field-state" aria-label="Looks good"><Icon name="check" strokeWidth={2.6} /></span>}
        {state === 'invalid' && <span className="vg-field-state" aria-hidden="true"><Icon name="alert" strokeWidth={2.2} /></span>}
      </div>
      {hint && <p id={hintId} className={cx('vg-field-hint', state === 'invalid' && 'is-error')}>{hint}</p>}
    </div>
  );
}

export function SelectPill({ label, options, className, ...rest }: { label: string; options: (string | { value: string; label: string })[] } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className={cx('vg-select vg-bead', className)}>
      <select aria-label={label} {...rest}>{options.map(o => { const v = typeof o === 'string' ? o : o.value; return <option key={v} value={v}>{typeof o === 'string' ? o : o.label}</option>; })}</select>
      <Icon name="chevron" strokeWidth={2.2} />
    </span>
  );
}

/** 2–4 views of one list. Not page navigation. */
export function SegmentedTabs<T extends string>({ items, label, value, onChange, className }: { items: readonly T[]; label: string; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cx('vg-tabs vg-glass', className)} role="tablist" aria-label={label}>
      {items.map(it => <button key={it} type="button" role="tab" className="vg-tab" aria-selected={it === value} onClick={() => onChange(it)}>{it}</button>)}
    </div>
  );
}

/** Immediate settings. Anything that sends real messages or charges money needs a confirm step as well. */
export function Toggle({ label, ariaLabel, checked, defaultChecked, onChange, disabled }: { label?: ReactNode; ariaLabel?: string; checked?: boolean; defaultChecked?: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  const [own, setOwn] = useState(!!defaultChecked);
  const on = checked ?? own;
  const btn = <button type="button" role="switch" aria-checked={on} aria-label={label ? undefined : ariaLabel} disabled={disabled} className="vg-toggle" onClick={() => { setOwn(!on); onChange?.(!on); }} />;
  return label ? <label className="vg-inline">{btn}{label}</label> : btn;
}

export function Checkbox({ label, checked, defaultChecked, onChange }: { label: ReactNode; checked?: boolean; defaultChecked?: boolean; onChange?: (v: boolean) => void }) {
  const [own, setOwn] = useState(!!defaultChecked);
  const on = checked ?? own;
  return <label className="vg-inline"><button type="button" role="checkbox" aria-checked={on} className="vg-check" onClick={() => { setOwn(!on); onChange?.(!on); }}><Icon name="check" strokeWidth={3} /></button>{label}</label>;
}

/** Selected value or quick filter. Not status (Badge) and not view switching (Tabs). */
export function Chip({ icon, className, children, ...rest }: { icon?: IconName; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={cx('vg-chip vg-bead', className)} {...rest}><span>{children}</span>{icon && <Icon name={icon} />}</button>;
}

/** One featured next step per screen. Never for data. */
export function PromoCard({ title, text, action, eyebrow }: { title: string; text?: string; eyebrow?: string; action?: { label: string; icon?: IconName; href?: string; onClick?: () => void } }) {
  return (
    <GlassCard promo>
      <span className="vg-promo-glow" aria-hidden="true" />
      {eyebrow && <p className="vg-t-overline vg-eyebrow">{eyebrow}</p>}
      <h2 className="vg-promo-title">{title}</h2>
      {text && <p className="vg-promo-text">{text}</p>}
      {action && <GlassButton icon={action.icon} href={action.href} onClick={action.onClick}>{action.label}</GlassButton>}
    </GlassCard>
  );
}

/** A tappable row inside a card: icon tile, title, note, chevron. */
export function ListRow({ href, icon, tone, title, note, badge, onClick }: { href?: string; icon?: IconName; tone?: Tone; title: ReactNode; note?: ReactNode; badge?: ReactNode; onClick?: () => void }) {
  const inner = <>{icon && <IconTile icon={icon} tone={tone} size="sm" />}<span className="vg-row-text"><strong>{title}</strong>{note && <small>{note}</small>}</span>{badge}{(href || onClick) && <Icon name="arrow" className="vg-row-go" />}</>;
  if (href) return <Link className="vg-row" href={href}>{inner}</Link>;
  if (onClick) return <button type="button" className="vg-row" onClick={onClick}>{inner}</button>;
  return <div className="vg-row">{inner}</div>;
}

/** Section heading above a group of cards: text on the sheet, with an optional ghost link. */
export function SectionHead({ title, id, action }: { title: string; id?: string; action?: { label: string; href: string } }) {
  return <div className="vg-section-head"><h2 id={id}>{title}</h2>{action && <Link className="vg-btn vg-btn-ghost vg-btn-sm" href={action.href}>{action.label}</Link>}</div>;
}

/** Page title (the one h1 per screen) and an optional line under it. */
export function PageHead({ title, sub, eyebrow, action }: { title: string; sub?: ReactNode; eyebrow?: string; action?: ReactNode }) {
  return <div className="vg-page-head"><div>{eyebrow && <p className="vg-t-overline vg-eyebrow">{eyebrow}</p>}<h1 className="vg-t-h1">{title}</h1>{sub && <p className="vg-page-sub">{sub}</p>}</div>{action}</div>;
}
