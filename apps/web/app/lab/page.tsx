'use client';
// UI lab · test 3: the container card as a realistic liquid-glass sheet (matched to the owner's "Liquid Glass UI Kit" image),
// holding the colourful slab from test 2. Light/dark background toggle.
import { useState } from 'react';
import { LiquidGlass } from '@/components/ui/glasscn/liquid-glass';
import './lab.css';

function Slab({ iri, children }: { iri?: boolean; children?: React.ReactNode }) {
  return (
    <div className={'slab' + (iri ? ' iri' : '')}>
      <div className="slab-body" />
      <div className="slab-bevel" aria-hidden="true" />
      <div className="slab-prism" aria-hidden="true" />
      <div className="slab-shine" aria-hidden="true" />
      <div className="slab-content">{children}</div>
    </div>
  );
}

export default function GlassLab() {
  const [dark, setDark] = useState(false);
  return (
    <div className={'vg-app' + (dark ? ' dark' : '')} data-theme={dark ? 'dark' : 'light'}>
      <main className="lab-stage wall">
        <div className="sheet-wrap">
          <div className="sheet-shadow" aria-hidden="true" />
          <div className="sheet-caustic" aria-hidden="true" />
          <div className="sheet-caustic side" aria-hidden="true" />
          {/* glasscn LiquidGlass: real SVG refraction at the edge in Chromium, blur fallback in Safari/Firefox */}
          <LiquidGlass className="sheet" refraction={34} bezel={0.16} blur={1.5} saturation={1.35}>
            <div className="sheet-edge" aria-hidden="true" />
            <div className="sheet-rim" aria-hidden="true" />
            <div className="sheet-rim inner" aria-hidden="true" />
            <div className="sheet-gloss" aria-hidden="true" />
            <div className="sheet-content">
              <h1 className="sheet-title">Liquid Glass</h1>
              <Slab iri />
              <button type="button" className="lab-toggle" onClick={() => setDark(!dark)}>{dark ? 'Light background' : 'Dark background'}</button>
            </div>
          </LiquidGlass>
        </div>
      </main>
    </div>
  );
}
