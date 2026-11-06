import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '../../../../lib/supabase/client';
import { readBoundedRequestBody, RequestBodyTooLarge } from '../../../../lib/request-body';
import { createRateLimiter } from '../../../../lib/rate-limit';
import { supabaseConfigured } from '../../../../lib/workspace-route';
import { sameOrigin } from '../../../../lib/request-security';
import { handleInbound } from '../../../../lib/front-office/orchestrator';
import type { Rpc } from '../../../../lib/front-office/orchestrator';
import { anthropicConfigFromEnv, anthropicLlm } from '../../../../lib/front-office/llm';
import { googleCalendar, googleConfigFromEnv } from '../../../../lib/front-office/calendar/google';
import { senderFromEnv } from '../../../../lib/front-office/sms-send';
import { runSetterTurn } from '../../../../lib/front-office/setter/agent';
import { ventraSetterConfig } from '../../../../lib/front-office/setter/config';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Website chat (tracker 1.8). The widget keeps a random visitor id in the browser and posts each message here.
// Channel: FRONT_OFFICE_CHAT_CHANNEL_ID / FRONT_OFFICE_CHAT_CHANNEL_KEY (server env; never sent to the browser).
// Other sites embedding the widget: FRONT_OFFICE_CHAT_ORIGINS (comma-separated origins). The AI answers only when
// FRONT_OFFICE_CHAT_LIVE=1 (owner approval); otherwise messages are recorded and a person follows up.
const VISITOR = /^[A-Za-z0-9_-]{16,64}$/, UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const perVisitor = createRateLimiter(20, 60_000), global = createRateLimiter(1200, 60_000);

function allowedOrigin(req: NextRequest): string | null {
  const origin = req.headers.get('origin');
  if (!origin) return null;
  if (sameOrigin(origin, req.headers.get('host'), req.nextUrl.protocol, process.env.LAUNCHPAD_APP_ORIGIN)) return origin;
  const list = (process.env.FRONT_OFFICE_CHAT_ORIGINS ?? '').split(',').map(x => x.trim().replace(/\/$/, '')).filter(Boolean);
  return list.includes(origin) ? origin : null;
}
function reply(req: NextRequest, body: unknown, status = 200, extra: Record<string, string> = {}) {
  const origin = allowedOrigin(req);
  const cors: Record<string, string> = origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {};
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', ...cors, ...extra } });
}
function channelEnv() {
  const channel = process.env.FRONT_OFFICE_CHAT_CHANNEL_ID ?? '', key = process.env.FRONT_OFFICE_CHAT_CHANNEL_KEY ?? '';
  return supabaseConfigured() && UUID.test(channel) && key.length >= 32 ? { channel, key } : null;
}
function rpcClient(): Rpc {
  const db = createSupabaseClient();
  return async (fn, args) => { const r = await db.rpc(fn, args); if (r.error) throw new Error(r.error.message); return r.data; };
}

export async function OPTIONS(req: NextRequest) {
  if (!allowedOrigin(req)) return new NextResponse(null, { status: 403 });
  return new NextResponse(null, { status: 204, headers: { 'Access-Control-Allow-Origin': allowedOrigin(req) as string, 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '600', Vary: 'Origin' } });
}

export async function GET(req: NextRequest) {
  if (!allowedOrigin(req) && req.headers.get('origin')) return reply(req, { error: 'Not allowed.' }, 403);
  const auth = channelEnv();
  if (!auth) return reply(req, { error: 'Chat is not connected yet.', configured: false }, 503);
  const visitor = req.nextUrl.searchParams.get('visitor') ?? '';
  if (!VISITOR.test(visitor)) return reply(req, { error: 'Invalid visitor.' }, 400);
  try { return reply(req, { messages: await rpcClient()('fo_chat_history', { channel: auth.channel, channel_key: auth.key, visitor }) }); }
  catch { return reply(req, { error: 'Chat is unavailable. Please try again.' }, 503); }
}

export async function POST(req: NextRequest) {
  if (!allowedOrigin(req)) return reply(req, { error: 'Not allowed.' }, 403);
  if (!/^application\/json/i.test(req.headers.get('content-type') ?? '')) return reply(req, { error: 'Use JSON.' }, 415);
  const flood = global('chat');
  if (!flood.allowed) return reply(req, { error: 'Busy. Try again shortly.' }, 429, { 'Retry-After': String(flood.retryAfterSeconds) });
  const auth = channelEnv();
  if (!auth) return reply(req, { error: 'Chat is not connected yet.', configured: false }, 503);
  let input: { visitor?: unknown; message?: unknown; id?: unknown };
  try { input = JSON.parse(await readBoundedRequestBody(req, 8_000)); } catch (e) { return reply(req, { error: 'Invalid request.' }, e instanceof RequestBodyTooLarge ? 413 : 400); }
  const visitor = typeof input.visitor === 'string' ? input.visitor : '', message = typeof input.message === 'string' ? input.message.trim() : '', id = typeof input.id === 'string' ? input.id : '';
  if (!VISITOR.test(visitor) || !message || message.length > 2000 || !/^[A-Za-z0-9_-]{8,64}$/.test(id)) return reply(req, { error: 'Invalid message.' }, 400);
  const limit = perVisitor(visitor);
  if (!limit.allowed) return reply(req, { error: 'Too many messages. Wait a moment.' }, 429, { 'Retry-After': String(limit.retryAfterSeconds) });
  const rpc = rpcClient();
  try {
    let contact: string | null = null;
    const result = await handleInbound(rpc, auth, { via: 'web-chat', sender: visitor, body: message, messageId: 'chat-' + visitor.slice(0, 16) + '-' + id }, { setter: c => { contact = c; } });
    if (result.reply || !contact) return reply(req, { reply: result.reply, live: true });
    const ai = anthropicConfigFromEnv(), gcal = googleConfigFromEnv();
    if (process.env.FRONT_OFFICE_CHAT_LIVE !== '1' || !ai) return reply(req, { reply: null, live: false, note: 'Thanks, your message is with the team. We will reply soon.' });
    const turn = await runSetterTurn(contact, { llm: anthropicLlm(ai, fetch, 20_000), rpc, auth, calendar: gcal ? googleCalendar(gcal) : null, send: senderFromEnv(), config: ventraSetterConfig, now: Date.now(), channel: 'web-chat' });
    return reply(req, { reply: turn.reply, live: true, booked: turn.booked });
  } catch {
    return reply(req, { error: 'Chat is unavailable. Please try again.' }, 503);
  }
}
