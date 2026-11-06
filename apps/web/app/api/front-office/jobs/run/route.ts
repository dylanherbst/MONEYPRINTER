import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '../../../../../lib/supabase/client';
import { supabaseConfigured } from '../../../../../lib/workspace-route';
import { runDueJobs, runnerAuthorized, runnerChannels, runnerSecrets } from '../../../../../lib/front-office/jobs';
import type { Rpc } from '../../../../../lib/front-office/orchestrator';
import { senderFromEnv } from '../../../../../lib/front-office/sms-send';
import { emailSenderFromEnv } from '../../../../../lib/front-office/email';
import { ventraSetterConfig } from '../../../../../lib/front-office/setter/config';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Job runner (tracker 1.4, 1.5): sends due follow-ups, reminders and no-show rescues on every configured channel
// (FRONT_OFFICE_CHANNEL_* for SMS, FRONT_OFFICE_CHAT_CHANNEL_* for website chat, FRONT_OFFICE_EMAIL_CHANNEL_* for email).
//   GET  /api/front-office/jobs/run   called every minute by Vercel Cron (vercel.json), Authorization: Bearer <CRON_SECRET>
//   POST /api/front-office/jobs/run   for any other scheduler,       Authorization: Bearer <FRONT_OFFICE_CRON_SECRET>
// Either secret is accepted on either method. Texts are logged; they are only really sent when FRONT_OFFICE_SEND_LIVE=1.
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

async function run(req: NextRequest) {
  const secrets = runnerSecrets(process.env);
  if (!secrets.length) return reply({ error: 'Job runner is not configured.', configured: false }, 503);
  if (!runnerAuthorized(req.headers.get('authorization'), secrets)) return reply({ error: 'Not allowed.' }, 401);
  const channels = runnerChannels(process.env);
  if (!supabaseConfigured() || !channels.length) return reply({ error: 'Front office channel is not configured.', configured: false }, 503);
  const db = createSupabaseClient();
  const rpc: Rpc = async (fn, args) => { const r = await db.rpc(fn, args); if (r.error) throw new Error(r.error.message); return r.data; };
  const send = senderFromEnv(), email = emailSenderFromEnv(), now = Date.now();
  const results: { channel: string; kind: string; outcome: string; note: string; sent: boolean }[] = [];
  let failed = 0;
  for (const c of channels) {
    try {
      for (const r of await runDueJobs({ rpc, auth: c.auth, send, email, config: ventraSetterConfig, now })) results.push({ channel: c.name, kind: r.kind, outcome: r.outcome, note: r.note, sent: r.sent });
    } catch { failed++; }
  }
  if (failed === channels.length) return reply({ error: 'Front office storage is unavailable.' }, 503);
  return reply({ ran: results.length, channels: channels.length, failedChannels: failed, results });
}

export async function GET(req: NextRequest) { return run(req); }
export async function POST(req: NextRequest) { return run(req); }
