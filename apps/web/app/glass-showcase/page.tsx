// Glass showcase: the glasscn GlassCard (installed with `npx shadcn add @glasscn/glass-card`) in its `liquid` variant,
// on the VENTRA ambient background so the glass has light and colour to work with. Uses VENTRA Glass tokens (.vg-app).
import { GlassCard } from '@/components/ui/glasscn/glass-card';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function GlassShowcase() {
  return (
    <div className="vg-app">
      <div className="vg-ambient" aria-hidden="true" />
      <main className="relative z-[1] grid min-h-dvh place-items-center p-6">
        <GlassCard glassVariant="liquid" className="w-full max-w-sm rounded-3xl">
          <CardHeader>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">glasscn · liquid</p>
            <CardTitle className="font-display text-2xl font-semibold">Glass card</CardTitle>
            <CardDescription className="text-muted-foreground">The glasscn GlassCard with glassVariant=&quot;liquid&quot;, installed from the shadcn registry.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Bookings, conversations and your AI team will sit on cards like this one.</CardContent>
        </GlassCard>
      </main>
    </div>
  );
}
