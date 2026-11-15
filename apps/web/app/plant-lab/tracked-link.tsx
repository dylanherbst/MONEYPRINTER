'use client';
import type { ReactNode } from 'react';
import { track } from '../../lib/aimp/analytics';

/** A plain link that also records a CTA click. Works without JavaScript (it is still a normal <a>). */
export function TrackedLink({ href, className, event, label, children }: { href: string; className?: string; event: Record<string, string>; label?: string; children: ReactNode }) {
  return <a href={href} className={className} aria-label={label} onClick={() => track('cta_click', { href, ...event })}>{children}</a>;
}
