// Website measurement (website plan §03 measurement plan, dev requirement 11).
// No vendor yet: events go to window.dataLayer and a DOM event so any analytics tool can be attached later.
export type SiteEvent =
  | 'hero_view' | 'cta_click' | 'story_stage_view' | 'model_select' | 'recommend_request'
  | 'preview_start' | 'preview_complete' | 'launch_view' | 'signup_click' | 'plan_select' | 'skip_animation';

type Props = Record<string, string | number | boolean>;
declare global { interface Window { dataLayer?: Array<Record<string, unknown>> } }

export function track(event: SiteEvent, props: Props = {}): void {
  if (typeof window === 'undefined') return;
  const payload = { event, ...props, ts: Date.now(), viewport: window.innerWidth < 768 ? 'mobile' : 'desktop' };
  (window.dataLayer ??= []).push(payload);
  window.dispatchEvent(new CustomEvent('aimp:track', { detail: payload }));
}
