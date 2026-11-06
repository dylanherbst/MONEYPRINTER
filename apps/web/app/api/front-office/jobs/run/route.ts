import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '../../../../../lib/supabase/client';
import { supabaseConfigured } from '../../../../../lib/workspace-route';
import { bearerMatches, runDueJobs } from '../../../../../lib/front-office/jobs';
import type { Rpc } from '../../../../../lib/front-office/orchestrator';
import { senderFromEnv } from '../../../../../lib/front-office/sms-send';
import { emailSenderFromEnv } from '../../../../../lib/front-office/email';
import { ventraSetterConfig } from '../../../../../lib/front-office/setter/config';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Job runner (tracker 1.4, 1.5): sends due follow-ups, reminders and no-show rescues for Ventra's channel. Call every minute:
//   POST /api/front-office/jobs/run   Authorization: Bearer <FRONT_OFFICE_CRON_SECRET>
// Texts are logged; they are only really sent when FRONT_OFFICE_SEND_LIVE=1.
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const secret = process.env.FRONT_OFFICE_CRON_SECRET ?? '';
  if (secret.length < 32) return reply({ error: 'Job runner is not configured.', configured: false }, 503);
  if (!bearerMatches(req.headers.get('authorization'), secret)) return reply({ error: 'Not allowed.' }, 401);
  const channel = process.env.FRONT_OFFICE_CHANNEL_ID ?? '', key = process.env.FRONT_OFFICE_CHANNEL_KEY ?? '';
  if (!supabaseConfigured() || !UUID.test(channel) || key.length < 32) return reply({ error: 'Front office channel is not configured.', configured: false }, 503);
  const db = createSupabaseClient();
  const rpc: Rpc = async (fn, args) => { const r = await db.rpc(fn, args); if (r.error) throw new Error(r.error.message); return r.data; };
  try {
    const results = await runDueJobs({ rpc, auth: { channel, key }, send: senderFromEnv(), email: emailSenderFromEnv(), config: ventraSetterConfig, now: Date.now() });
    return reply({ ran: results.length, results: results.map(r => ({ kind: r.kind, outcome: r.outcome, note: r.note, sent: r.sent })) });
  } catch {
    return reply({ error: 'Front office storage is unavailable.' }, 503);
  }
}
