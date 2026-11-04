'use client';
import { ManualAudit } from '../../ui/ventra-insights';
import { ConnectionBadges } from '../../ui/connection-badges';

// Isolated test page: the real manual growth audit editor and the real account sync panel.
export default function GrowthAuditTest() {
  return <main>
    <h1>Growth audit test</h1>
    <p><span className="v-status" data-testid="page-mode">LIVE · Real audit logic and browser storage</span> Manual review only. No AI analysis, nothing is sent.</p>
    <ConnectionBadges />
    <ManualAudit />
  </main>;
}
