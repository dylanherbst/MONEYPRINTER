import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '../../../../lib/supabase/client';
import { uuid } from '../../../../lib/workspace-validation';
import { shapeMembers } from '../../../../lib/team-members';
export const dynamic = 'force-dynamic';
// Read-only. Authorisation is the database member_read policy on memberships; no service key, no writes.
export async function GET(req: NextRequest) {
  const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store, private', 'Vary': 'Cookie', 'X-Content-Type-Options': 'nosniff' } });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return reply({ error: 'Account storage is not connected yet.', configured: false }, 503);
  const token = req.cookies.get('lp-access')?.value;
  if (!token) return reply({ error: 'Sign in to see your team.', signedIn: false }, 401);
  try {
    const w = uuid(req.nextUrl.searchParams.get('workspace'));
    const auth = await createSupabaseClient().auth.getUser(token);
    if (auth.error || !auth.data.user) return reply({ error: 'Sign in again.', signedIn: false }, 401);
    const db = createSupabaseClient({ fetch: (url, init) => { const headers = new Headers(init?.headers); headers.set('Authorization', 'Bearer ' + token); return fetch(url, { ...init, headers, cache: 'no-store' }); } });
    const active = await db.rpc('session_active');
    if (active.error) return reply({ error: 'Account storage is unavailable. Please retry.' }, 503);
    if (!active.data) return reply({ error: 'Session revoked. Sign in again.', signedIn: false }, 401);
    const result = await db.from('memberships').select('user_id,role,active').eq('workspace_id', w).eq('active', true);
    if (result.error) return reply({ error: 'Unable to load the team. Please retry.' }, 503);
    const members = shapeMembers(result.data, auth.data.user.id);
    // RLS returns nothing to non-members; treat that as no access rather than an empty team.
    if (!members.some(m => m.isYou)) return reply({ error: 'Workspace access is unavailable.' }, 403);
    return reply({ signedIn: true, members });
  } catch (error) {
    return reply({ error: error instanceof Error && /^Choose a valid/.test(error.message) ? error.message : 'Invalid request.' }, 400);
  }
}
