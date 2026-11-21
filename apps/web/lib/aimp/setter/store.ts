// In-memory repository. Same methods a database adapter will implement (supabase/migrations/*_ai_sales_setter.sql). Every read and
// write is keyed by workspaceId; a conversation id from another workspace simply is not found.
import type { AgentConfig, AuditEvent, ConversionEvent, CrmLead, DmConversation, DmMessage, InstagramConnection, OutboundAttempt } from './types.ts';

export interface SetterStore {
  connectionByAccount(igAccountId: string): InstagramConnection | null;
  connectionFor(workspaceId: string): InstagramConnection | null;
  /** One Instagram account belongs to one workspace. Refuses a second owner. */
  saveConnection(c: InstagramConnection): { ok: true } | { ok: false; reason: 'owned_by_other_workspace' };
  config(workspaceId: string): AgentConfig | null;
  saveConfig(c: AgentConfig): void;
  /** True the first time an event id is seen for this account; false for a duplicate delivery. */
  claimEvent(igAccountId: string, eventId: string): boolean;
  conversation(workspaceId: string, id: string): DmConversation | null;
  conversationFor(workspaceId: string, igAccountId: string, igsid: string): DmConversation | null;
  conversations(workspaceId: string): DmConversation[];
  saveConversation(c: DmConversation): void;
  messages(workspaceId: string, conversationId: string): DmMessage[];
  message(workspaceId: string, id: string): DmMessage | null;
  saveMessage(m: DmMessage): void;
  lead(workspaceId: string, conversationId: string): CrmLead | null;
  leads(workspaceId: string): CrmLead[];
  saveLead(l: CrmLead): void;
  isOptedOut(workspaceId: string, igsid: string): boolean;
  optOut(workspaceId: string, igsid: string): void;
  attempt(workspaceId: string, key: string): OutboundAttempt | null;
  saveAttempt(a: OutboundAttempt): void;
  attempts(workspaceId: string): OutboundAttempt[];
  addConversion(e: ConversionEvent): void;
  conversions(workspaceId: string): ConversionEvent[];
  audit(e: AuditEvent): void;
  audits(workspaceId: string): AuditEvent[];
  killSwitch(workspaceId: string): boolean;
  setKillSwitch(workspaceId: string, on: boolean): void;
}

export function createMemorySetterStore(limits = { eventsPerAccount: 5000, auditsPerWorkspace: 500 }): SetterStore {
  const conns = new Map<string, InstagramConnection>();
  const configs = new Map<string, AgentConfig>();
  const events = new Map<string, Set<string>>();
  const convs = new Map<string, DmConversation>();
  const msgs = new Map<string, DmMessage>();
  const leads = new Map<string, CrmLead>();
  const optouts = new Set<string>();
  const attempts = new Map<string, OutboundAttempt>();
  const conversions: ConversionEvent[] = [];
  const audits: AuditEvent[] = [];
  const kill = new Set<string>();
  const k = (...p: string[]) => p.join('|');
  const clone = <T>(v: T): T => structuredClone(v);
  return {
    connectionByAccount: (id) => { const c = conns.get(id); return c ? clone(c) : null; },
    connectionFor: (ws) => { for (const c of conns.values()) if (c.workspaceId === ws) return clone(c); return null; },
    saveConnection(c) {
      const cur = conns.get(c.igAccountId);
      if (cur && cur.workspaceId !== c.workspaceId && cur.status === 'active') return { ok: false, reason: 'owned_by_other_workspace' };
      conns.set(c.igAccountId, clone(c));
      return { ok: true };
    },
    config: (ws) => { const c = configs.get(ws); return c ? clone(c) : null; },
    saveConfig: (c) => { configs.set(c.workspaceId, clone(c)); },
    claimEvent(acct, id) {
      const s = events.get(acct) ?? new Set<string>();
      if (s.has(id)) return false;
      if (s.size >= limits.eventsPerAccount) s.delete(s.values().next().value as string);
      s.add(id); events.set(acct, s);
      return true;
    },
    conversation: (ws, id) => { const c = convs.get(k(ws, id)); return c ? clone(c) : null; },
    conversationFor: (ws, acct, igsid) => { for (const c of convs.values()) if (c.workspaceId === ws && c.igAccountId === acct && c.igsid === igsid) return clone(c); return null; },
    conversations: (ws) => [...convs.values()].filter((c) => c.workspaceId === ws).map(clone).sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt)),
    saveConversation: (c) => { convs.set(k(c.workspaceId, c.id), clone(c)); },
    messages: (ws, cid) => [...msgs.values()].filter((m) => m.workspaceId === ws && m.conversationId === cid).map(clone).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    message: (ws, id) => { const m = msgs.get(k(ws, id)); return m ? clone(m) : null; },
    saveMessage: (m) => { msgs.set(k(m.workspaceId, m.id), clone(m)); },
    lead: (ws, cid) => { const l = leads.get(k(ws, cid)); return l ? clone(l) : null; },
    leads: (ws) => [...leads.values()].filter((l) => l.workspaceId === ws).map(clone),
    saveLead: (l) => { leads.set(k(l.workspaceId, l.conversationId), clone(l)); },
    isOptedOut: (ws, igsid) => optouts.has(k(ws, igsid)),
    optOut: (ws, igsid) => { optouts.add(k(ws, igsid)); },
    attempt: (ws, key) => { const a = attempts.get(k(ws, key)); return a ? clone(a) : null; },
    saveAttempt: (a) => { attempts.set(k(a.workspaceId, a.idempotencyKey), clone(a)); },
    attempts: (ws) => [...attempts.values()].filter((a) => a.workspaceId === ws).map(clone),
    addConversion: (e) => { conversions.push(clone(e)); },
    conversions: (ws) => conversions.filter((e) => e.workspaceId === ws).map(clone),
    audit: (e) => { audits.push(clone(e)); const mine = audits.filter((a) => a.workspaceId === e.workspaceId); if (mine.length > limits.auditsPerWorkspace) audits.splice(audits.indexOf(mine[0]!), 1); },
    audits: (ws) => audits.filter((a) => a.workspaceId === ws).map(clone),
    killSwitch: (ws) => kill.has(ws),
    setKillSwitch: (ws, on) => { if (on) kill.add(ws); else kill.delete(ws); },
  };
}
