'use client';
// UI lab · test 1: one box with the current VENTRA Glass effect (glasscn "liquid" card over the brand glows).
import { useState } from 'react';
import { GlassCard, GlassButton } from '../design-system/liquid-glass/components';

export default function GlassLab() {
  const [dark, setDark] = useState(false);
  return (
    <div className={'vg-app' + (dark ? ' dark' : '')} data-theme={dark ? 'dark' : 'light'}>
      <div className="vg-ambient" aria-hidden="true" />
      <main className="relative z-[1] grid min-h-dvh place-items-center p-6">
        <GlassCard glass="liquid" className="w-full max-w-[340px] text-center">
          <p className="vg-eyebrow">UI lab · test 1</p>
          <h1 className="font-display text-2xl font-semibold">Current glass</h1>
          <p className="mt-1 text-sm text-muted-foreground">glasscn liquid card, the one used across the app today.</p>
          <div className="mt-5 flex justify-center"><GlassButton size="sm" onClick={() => setDark(!dark)}>{dark ? 'Light background' : 'Dark background'}</GlassButton></div>
        </GlassCard>
      </main>
    </div>
  );
}
