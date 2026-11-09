'use client';
// UI lab · test 2: the "3D liquid glass" slab from the owner's reference image, next to nothing else.
// Variant A = clear slab with the glossy black "Start project" pill; variant B = iridescent slab. Light/dark background toggle.
import { useState } from 'react';
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
      <main className="lab-stage">
        <div className="lab-plate">
          <i className="lab-bolt tl" /><i className="lab-bolt tr" /><i className="lab-bolt bl" /><i className="lab-bolt br" />
          <Slab iri />
          <p className="lab-caption">UI lab · test 2: thick clear glass slab with a bright rim, inner bevel, prismatic edge and a coloured light spill, matched to your reference.</p>
          <button type="button" className="lab-toggle" onClick={() => setDark(!dark)}>{dark ? 'Light background' : 'Dark background'}</button>
        </div>
      </main>
    </div>
  );
}
