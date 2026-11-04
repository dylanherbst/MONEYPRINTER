import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '../../../../lib/supabase/client';
import { uuid } from '../../../../lib/workspace-validation';
import { buildAccountExport, exportFileName } from '../../../../lib/account-export';
export const dynamic = 'force-dynamic';
// Read-only download of the signed-in user's saved drafts. Authorisation is the database launcher_drafts read policy (RLS) using the caller's own lp-access token; no service key, no writes.
export async function GET(req: NextRequest) {
  const headers = { 'Cache-Control': 'no-store, private', 'Vary': 'Cookie', 'X-Content-Type-Options': 'nosniff' };
  const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return reply({ error: 'Account storage is not connected yet.', configured: false }, 503);
  const token = req.cookies.get('lp-access')?.value;
  if (!token) return reply({ error: 'Sign in to download your data.', signedIn: false }, 401);
  try {
    const w = uuid(req.nextUrl.searchParams.get('workspace'));
    const auth = await createSupabaseClient().auth.getUser(token);
    if (auth.error || !auth.data.user) return reply({ error: 'Sign in again.', signedIn: false }, 401);
    const db = createSupabaseClient({ fetch: (url, init) => { const h = new Headers(init?.headers); h.set('Authorization', 'Bearer ' + token); return fetch(url, { ...init, headers: h, cache: 'no-store' }); } });
    const active = await db.rpc('session_active');
    if (active.error) return reply({ error: 'Account storage is unavailable. Please retry.' }, 503);
    if (!active.data) return reply({ error: 'Session revoked. Sign in again.', signedIn: false }, 401);
    const result = await db.from('launcher_drafts').select('kind,data,revision,updated_at').eq('workspace_id', w);
    if (result.error) return reply({ error: 'Unable to load your data. Please retry.' }, 503);
    const exportedAt = new Date().toISOString();
    const body = buildAccountExport(result.data, w, exportedAt);
    // RLS returns nothing to non-members; with no drafts we cannot tell, so confirm membership before returning an empty file.
    if (!body.draftCount) {
      const member = await db.from('memberships').select('user_id').eq('workspace_id', w).eq('user_id', auth.data.user.id).eq('active', true);
      if (member.error) return reply({ error: 'Unable to load your data. Please retry.' }, 503);
      if (!member.data?.length) return reply({ error: 'Workspace access is unavailable.' }, 403);
    }
    return new NextResponse(JSON.stringify(body, null, 2), { status: 200, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="${exportFileName(exportedAt)}"` } });
  } catch (error) {
    return reply({ error: error instanceof Error && /^Choose a valid/.test(error.message) ? error.message : 'Invalid request.' }, 400);
  }
}
