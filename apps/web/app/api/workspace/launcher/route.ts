import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '../../../../lib/supabase/client';
import { sameOrigin } from '../../../../lib/request-security';
import { readBoundedRequestBody, RequestBodyTooLarge } from '../../../../lib/request-body';
import { checkedDraftRaw, checkedKind, launcherDraftByteLimit } from '../../../../lib/launcher-drafts';
import { uuid } from '../../../../lib/workspace-validation';
export const dynamic = 'force-dynamic';
async function handle(req: NextRequest) {
  const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store, private' } });
  if (req.method === 'POST' && (!sameOrigin(req.headers.get('origin'), req.headers.get('host'), req.nextUrl.protocol, process.env.LAUNCHPAD_APP_ORIGIN) || !req.headers.get('content-type')?.startsWith('application/json'))) return reply({ error: 'Use same-origin JSON.' }, 403);
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return reply({ error: 'Account storage is not configured. Browser drafts are unchanged.', configured: false }, 503);
  const token = req.cookies.get('lp-access')?.value;
  if (!token) return reply({ error: 'Sign in to use account storage.' }, 401);
  try {
    const auth = await createSupabaseClient().auth.getUser(token);
    if (auth.error || !auth.data.user) return reply({ error: 'Sign in again.' }, 401);
    const db = createSupabaseClient({ fetch: (url, init) => { const headers = new Headers(init?.headers); headers.set('Authorization', 'Bearer ' + token); return fetch(url, { ...init, headers, cache: 'no-store' }); } });
    const active = await db.rpc('session_active');
    if (active.error) return reply({ error: 'Account storage is unavailable. Please retry.' }, 503);
    if (!active.data) return reply({ error: 'Session revoked. Sign in again.' }, 401);
    if (req.method === 'GET') {
      const w = uuid(req.nextUrl.searchParams.get('workspace'));
      const kind = checkedKind(req.nextUrl.searchParams.get('kind'));
      const result = await db.from('launcher_drafts').select('data,revision,updated_at').eq('workspace_id', w).eq('kind', kind).maybeSingle();
      return result.error ? reply({ error: 'Unable to load the account draft. Check that the database is up to date.' }, 503) : reply({ draft: result.data });
    }
    const input = JSON.parse(await readBoundedRequestBody(req, launcherDraftByteLimit + 4096));
    const w = uuid(input.workspace), kind = checkedKind(input.kind);
    if (!Number.isSafeInteger(input.revision) || input.revision < 0) return reply({ error: 'Refresh before saving.' }, 400);
    if (input.action === 'delete') {
      const result = await db.rpc('delete_launcher_draft', { w, draft_kind: kind, expected_revision: input.revision });
      return result.error ? reply({ error: 'Delete not committed. Check owner access and refresh the revision.' }, 409) : reply({ deleted: true });
    }
    if (input.action !== 'save') return reply({ error: 'Unknown action.' }, 400);
    const payload = checkedDraftRaw(JSON.stringify(input.draft));
    const result = await db.rpc('save_launcher_draft', { w, draft_kind: kind, payload, expected_revision: input.revision });
    return result.error ? reply({ error: 'Save not committed. Check owner access and refresh the revision; your local draft is unchanged.' }, 409) : reply({ saved: true, revision: result.data });
  } catch (error) {
    if (error instanceof RequestBodyTooLarge) return reply({ error: 'Request too large.' }, 413);
    return reply({ error: error instanceof Error && /^(Unknown launcher|Draft |Choose a valid)/.test(error.message) ? error.message : 'Invalid request. Review the fields.' }, 400);
  }
}
export const GET = handle;
export const POST = handle;
