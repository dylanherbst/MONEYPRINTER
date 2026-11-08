import { NextRequest, NextResponse } from 'next/server';
import { workspaceLimits } from '../../../../lib/rate-limit';
import { sameOrigin } from '../../../../lib/request-security';
import { readBoundedRequestBody } from '../../../../lib/request-body';
import { isPlainObject, isSameOriginJson } from '../../../../lib/api-errors';
import { apiReply, isResponse, openWorkspace, preflight, privateHeaders } from '../../../../lib/workspace-route';
import { checkedAgentSettings, templateSettings, templates } from '../../../../lib/front-office/settings';
import type { TemplateId } from '../../../../lib/front-office/settings';
export const dynamic = 'force-dynamic';

// The AI Setter and Receptionist settings for one business (workspace owners only: fo_get/save_agent_settings).
//   GET  /api/front-office/settings?workspace=<id>[&template=gym]   saved settings, or the template to start from
//   POST /api/front-office/settings?workspace=<id>  {settings, revision}   save (revision 0 = first save)
export async function GET(req: NextRequest) {
  const pre = preflight(req, { signedOut: 'Sign in to edit your AI team.' });
  if (isResponse(pre)) return pre;
  const ws = await openWorkspace(req, pre.token, workspaceLimits.settings);
  if (isResponse(ws)) return ws;
  const r = await ws.db.rpc('fo_get_agent_settings', { w: ws.workspace });
  if (r.error) return /Owner access/.test(r.error.message) ? apiReply('no_workspace_access', 'Only the workspace owner can edit the AI team.') : apiReply('storage_unavailable', 'Unable to load settings. Check that the database is up to date.');
  const saved = r.data as { data: unknown; revision: number; updatedAt: string } | null;
  const t = req.nextUrl.searchParams.get('template');
  const template: TemplateId = templates.includes(t as TemplateId) ? t as TemplateId : 'gym';
  if (!saved) return NextResponse.json({ settings: templateSettings(template), revision: 0, saved: false }, { headers: privateHeaders });
  let settings;
  try { settings = checkedAgentSettings(saved.data); } catch { settings = saved.data; }
  return NextResponse.json({ settings, revision: saved.revision, updatedAt: saved.updatedAt, saved: true }, { headers: privateHeaders });
}

export async function POST(req: NextRequest) {
  if (!isSameOriginJson(req.headers, (o, h) => sameOrigin(o, h, req.nextUrl.protocol, process.env.LAUNCHPAD_APP_ORIGIN))) return apiReply('forbidden_origin', 'Use same-origin JSON.');
  const pre = preflight(req, { signedOut: 'Sign in to edit your AI team.' });
  if (isResponse(pre)) return pre;
  const ws = await openWorkspace(req, pre.token, workspaceLimits.settings);
  if (isResponse(ws)) return ws;
  let input: unknown;
  try { input = JSON.parse(await readBoundedRequestBody(req, 40_000)); } catch { return apiReply('invalid_request', 'Invalid request.'); }
  if (!isPlainObject(input) || !Number.isInteger(input.revision) || (input.revision as number) < 0) return apiReply('invalid_request', 'Invalid request.');
  let settings;
  try { settings = checkedAgentSettings(input.settings); } catch (e) { return apiReply('invalid_request', e instanceof Error ? e.message : 'Check the settings.'); }
  const r = await ws.db.rpc('fo_save_agent_settings', { w: ws.workspace, payload: settings, expected_revision: input.revision });
  if (r.error) {
    if (/Owner access/.test(r.error.message)) return apiReply('no_workspace_access', 'Only the workspace owner can edit the AI team.');
    if (/changed elsewhere/.test(r.error.message)) return apiReply('conflict', 'Settings were changed elsewhere. Reload and try again.');
    return apiReply('storage_unavailable', 'Unable to save settings.');
  }
  return NextResponse.json({ settings, revision: r.data as number, saved: true }, { headers: privateHeaders });
}
