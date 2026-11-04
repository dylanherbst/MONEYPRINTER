import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '../../../../lib/supabase/client';
import { uuid } from '../../../../lib/workspace-validation';
import { shapeActivity } from '../../../../lib/account-activity';
export const dynamic = 'force-dynamic';
// Read-only list of what the signed-in user saved to the account (kind, revision, time). Authorisation is the launcher_drafts read policy (RLS) under the caller's own lp-access token; no service key, no writes, draft content is not selected.
export async function GET(req: NextRequest) {
  const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store, private', 'Vary': 'Cookie', 'X-Content-Type-Options': 'nosniff' } });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return reply({ error: 'Account storage is not connected yet.', configured: false }, 503);
  const token = req.cookies.get('lp-access')?.value;
  if (!token) return reply({ error: 'Sign in to see your account activity.', signedIn: false }, 401);
  try {
    const w = uuid(req.nextUrl.searchParams.get('workspace'));
    const auth = await createSupabaseClient().auth.getUser(token);
    if (auth.error || !auth.data.user) return reply({ error: 'Sign in again.', signedIn: false }, 401);
    const db = createSupabaseClient({ fetch: (url, init) => { const h = new Headers(init?.headers); h.set('Authorization', 'Bearer ' + token); return fetch(url, { ...init, headers: h, cache: 'no-store' }); } });
    const active = await db.rpc('session_active');
    if (active.error) return reply({ error: 'Account storage is unavailable. Please retry.' }, 503);
    if (!active.data) return reply({ error: 'Session revoked. Sign in again.', signedIn: false }, 401);
    const result = await db.from('launcher_drafts').select('kind,revision,updated_at').eq('workspace_id', w).limit(500);
    if (result.error) return reply({ error: 'Unable to load your activity. Please retry.' }, 503);
    const entries = shapeActivity(result.data);
    // RLS returns nothing to non-members; with no rows we cannot tell, so confirm membership before reporting an empty list.
    if (!entries.length) {
      const member = await db.from('memberships').select('user_id').eq('workspace_id', w).eq('user_id', auth.data.user.id).eq('active', true);
      if (member.error) return reply({ error: 'Unable to load your activity. Please retry.' }, 503);
      if (!member.data?.length) return reply({ error: 'Workspace access is unavailable.' }, 403);
    }
    return reply({ signedIn: true, entries });
  } catch (error) {
    return reply({ error: error instanceof Error && /^Choose a valid/.test(error.message) ? error.message : 'Invalid request.' }, 400);
  }
}
