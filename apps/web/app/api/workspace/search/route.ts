import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '../../../../lib/supabase/client';
import { uuid } from '../../../../lib/workspace-validation';
import { byteLength, responseByteCaps } from '../../../../lib/byte-size';
import { parseQuery, searchDrafts } from '../../../../lib/draft-search';
export const dynamic = 'force-dynamic';
// Read-only search of the signed-in user's saved drafts. Authorisation is the launcher_drafts read policy (RLS) under the caller's own lp-access token; no service key, no writes. Only short snippets are returned, never whole drafts.
export async function GET(req: NextRequest) {
  const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store, private', 'Vary': 'Cookie', 'X-Content-Type-Options': 'nosniff' } });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return reply({ error: 'Account storage is not connected yet.', configured: false }, 503);
  const token = req.cookies.get('lp-access')?.value;
  if (!token) return reply({ error: 'Sign in to search your account.', signedIn: false }, 401);
  let terms: string[];
  try { terms = parseQuery(req.nextUrl.searchParams.get('q')); } catch (error) { return reply({ error: error instanceof Error ? error.message : 'Invalid search.' }, 400); }
  try {
    const w = uuid(req.nextUrl.searchParams.get('workspace'));
    const auth = await createSupabaseClient().auth.getUser(token);
    if (auth.error || !auth.data.user) return reply({ error: 'Sign in again.', signedIn: false }, 401);
    const db = createSupabaseClient({ fetch: (url, init) => { const h = new Headers(init?.headers); h.set('Authorization', 'Bearer ' + token); return fetch(url, { ...init, headers: h, cache: 'no-store' }); } });
    const active = await db.rpc('session_active');
    if (active.error) return reply({ error: 'Account storage is unavailable. Please retry.' }, 503);
    if (!active.data) return reply({ error: 'Session revoked. Sign in again.', signedIn: false }, 401);
    const result = await db.from('launcher_drafts').select('kind,data').eq('workspace_id', w).limit(500);
    if (result.error) return reply({ error: 'Unable to search your data. Please retry.' }, 503);
    const rows = Array.isArray(result.data) ? result.data : [];
    if (!rows.length) {
      const member = await db.from('memberships').select('user_id').eq('workspace_id', w).eq('user_id', auth.data.user.id).eq('active', true);
      if (member.error) return reply({ error: 'Unable to search your data. Please retry.' }, 503);
      if (!member.data?.length) return reply({ error: 'Workspace access is unavailable.' }, 403);
    }
    const out = { signedIn: true, hits: searchDrafts(rows.map(r => ({ kind: String((r as { kind: unknown }).kind), data: (r as { data: unknown }).data })), terms, 'account') };
    if (byteLength(JSON.stringify(out)) > responseByteCaps.search) return reply({ error: 'Too many results. Try a more specific search.' }, 413);
    return reply(out);
  } catch (error) {
    return reply({ error: error instanceof Error && /^Choose a valid/.test(error.message) ? error.message : 'Invalid request.' }, 400);
  }
}
