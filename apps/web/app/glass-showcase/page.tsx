'use client';
// Glass showcase (temporary, for comparison): glasscn's own Glass Card docs demo, unmodified, in the `liquid` and
// `liquid-refract` variants side by side over a colourful backdrop. Rendered with glasscn's own tokens and Tailwind preflight
// (scoped to .glasscn-original) so it should match https://glasscn-components.vercel.app/components/glass-card.
import { useState } from 'react';
import { CardDemo } from './card-demo';
import './glasscn-original.css';

export default function GlassShowcase() {
  const [dark, setDark] = useState(false);
  return (
    <div className={'glasscn-original' + (dark ? ' dark' : '')}>
      <main className="gc-stage">
        <div className="gc-rings" aria-hidden="true" />
        <div className="gc-grid">
          <section aria-label="liquid"><p className="gc-label">liquid</p><CardDemo variant="liquid" /></section>
          <section aria-label="liquid-refract"><p className="gc-label">liquid-refract</p><CardDemo variant="liquid-refract" /></section>
        </div>
        <button type="button" onClick={() => setDark(!dark)} className="mt-6 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-black shadow">{dark ? 'Light theme' : 'Dark theme'}</button>
      </main>
    </div>
  );
}
