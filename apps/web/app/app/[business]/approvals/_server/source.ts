// Where this page gets its automation service: the automation demo (fixtures, in memory), the same source the Overview and the
// Dashboard read their approvals from. The /start runtime carries no automation store of its own; when one is added, return it here.
// Returning null makes the page say "Not available in the demo yet".
import { demoAutomation } from '../../../../../lib/aimp/automation/demo';
import type { AutomationService } from '../../../../../lib/aimp/automation/service';

export function automationSource(): (() => AutomationService) | null {
  return () => demoAutomation().automation;
}
