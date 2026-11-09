'use client';
// Glass showcase (temporary, for comparison): glasscn's own Glass Card docs demo, unmodified, in the `liquid` and
// `clear` variant (its most transparent glass) on white. Rendered with glasscn's own tokens and Tailwind preflight
// (scoped to .glasscn-original) so it should match https://glasscn-components.vercel.app/components/glass-card.
import { useState } from 'react';
import { CardDemo } from './card-demo';
import './glasscn-original.css';

export default function GlassShowcase() {
  const [dark, setDark] = useState(false);
  return (
    <div className={'glasscn-original' + (dark ? ' dark' : '')}>
      <main className="gc-stage">
        <CardDemo variant="clear" />
        <button type="button" onClick={() => setDark(!dark)} className="mt-6 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-black shadow">{dark ? 'Light theme' : 'Dark theme'}</button>
      </main>
    </div>
  );
}
