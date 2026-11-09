// Glass showcase: the reference "Liquid Glass" card, built on glasscn's GlassCard (liquid-refract) with a thick-glass layer.
// Rendered with glasscn's own tokens and Tailwind preflight, scoped to .glasscn-original. Temporary, for review.
import { LiquidGlassCard } from './liquid-glass-card';
import './glasscn-original.css';

export default function GlassShowcase() {
  return (
    <div className="glasscn-original">
      <main className="gc-stage studio"><LiquidGlassCard /></main>
    </div>
  );
}
