import type { AgentConfig, AuditEvent, CrmLead, DmConversation } from '../../../../lib/aimp/setter/types';
import type { setterMetrics } from '../../../../lib/aimp/setter/analytics';

export interface SetterMessageView { id: string; direction: 'in' | 'out'; author: string; text: string; status: string; error: string | null; notes: string[]; intent: string | null; confidence: number | null }
export interface SetterView {
  config: AgentConfig;
  killSwitch: boolean;
  conversations: (DmConversation & { lead: CrmLead | null; messages: SetterMessageView[] })[];
  metrics: ReturnType<typeof setterMetrics>;
  audit: AuditEvent[];
}
