import { NextRequest, NextResponse } from 'next/server';
import { readBoundedRequestBody, RequestBodyTooLarge } from '../../../../lib/request-body';
import { createOrderLedger, orderFromEvent, verifyStripeSignature } from '../../../../lib/stripe-webhook';
export const dynamic = 'force-dynamic';
// TEST MODE ONLY. Orders are held in this server process (idempotent by event id) until the owner approves a persistent store.
const ledger = createOrderLedger();
export async function POST(req: NextRequest) {
  const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return reply({ error: 'Webhook is not connected: no signing secret is configured.', configured: false }, 503);
  try {
    const raw = await readBoundedRequestBody(req, 64_000);
    try { verifyStripeSignature(raw, req.headers.get('stripe-signature'), secret); } catch { return reply({ error: 'Invalid signature.' }, 400); }
    const order = orderFromEvent(JSON.parse(raw));
    if (!order) return reply({ received: true, ignored: true });
    const result = ledger.record(order);
    return reply({ received: true, duplicate: result.duplicate, paid: result.order.paid });
  } catch (error) {
    if (error instanceof RequestBodyTooLarge) return reply({ error: 'Request too large.' }, 413);
    return reply({ error: error instanceof Error && /^(Live-mode|Invalid)/.test(error.message) ? error.message : 'Event could not be processed.' }, 400);
  }
}
