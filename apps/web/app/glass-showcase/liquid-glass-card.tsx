'use client';
// "Liquid Glass" card from the owner's reference: glasscn GlassCard (liquid-refract, real refraction in Chromium) with a
// thick-glass layer (.lg-thick) on its surface: bright top rim, inner bevel line, thicker lower edge and a soft lift shadow.
import { ChevronDown } from 'lucide-react';
import { GlassCard } from '@/components/ui/glasscn/glass-card';
import { LiquidGlass } from '@/components/ui/glasscn/liquid-glass';

export function LiquidGlassCard() {
  return (
    <div className="lg-wrap">
      <GlassCard glassVariant="liquid-refract" liquidProps={{ className: 'lg-thick', refraction: 22, bezel: 0.22, blur: 1, saturation: 1.15 }} className="gap-0 py-0">
        <div className="lg-body">
          <div className="lg-head">
            <div>
              <h2 className="lg-title">Liquid Glass</h2>
              <p className="lg-sub">Secondary</p>
            </div>
            <LiquidGlass className="lg-icon"><button type="button" aria-label="Show options" className="lg-icon-btn"><ChevronDown className="size-5" strokeWidth={2.4} /></button></LiquidGlass>
          </div>
          <label className="lg-field">
            <span className="sr-only">Text field</span>
            <select defaultValue="" aria-label="Text field"><option value="" disabled>Text field</option><option>Option one</option><option>Option two</option></select>
            <ChevronDown className="size-5 lg-field-chev" strokeWidth={2.2} aria-hidden="true" />
          </label>
        </div>
      </GlassCard>
    </div>
  );
}
