'use client';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthDivider, GlassButton, GlassField, GlassIcon, GlassSurface, OnboardingHeader, OnboardingLayout } from '../../design-system/aimp-glass';
import { site } from '../../../lib/aimp/site-config';
import {
  NETWORK_FAILURE, PASSWORD_MAX, PASSWORD_MIN, authRequestBody, flowStepNumber, flowTotal, interpretAuthResponse, startRoutes, validateCredentials,
} from '../flow';
import type { AuthMode, AuthOutcome, CredentialErrors } from '../flow';

// Sign-up and sign-in against the real auth endpoint: POST /api/workspace with { action, email, password }.
// The endpoint only accepts same-origin JSON and sets httpOnly session cookies itself; nothing is stored here.
export function AccountForm({ initialMode }: { initialMode: AuthMode }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  // Preview/demo default (14 Nov, owner request): pre-filled so a phone tester can tap through without typing.
  // Harmless either way -- if accounts aren't connected on this preview, submitting just shows "not connected"
  // and offers Continue without an account, same as leaving these blank.
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('PreviewDemo2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<CredentialErrors>({});
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<AuthOutcome | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  const signup = mode === 'signup';

  function switchMode(next: AuthMode) {
    setMode(next);
    setErrors({});
    setOutcome(null);
    emailRef.current?.focus();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setOutcome(null);
    const checked = validateCredentials(email, password, mode);
    if (!checked.ok) {
      setErrors(checked.errors);
      (checked.errors.email ? emailRef : passwordRef).current?.focus();
      return;
    }
    setErrors({});
    setBusy(true);
    let result: AuthOutcome;
    try {
      const res = await fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        body: authRequestBody(mode, checked.email, checked.password),
      });
      let body: unknown = null;
      try { body = await res.json(); } catch { body = null; }
      result = interpretAuthResponse(res.status, body, mode);
    } catch {
      result = NETWORK_FAILURE;
    }
    if (result.kind === 'signed-in') {
      router.push(startRoutes.tour);
      return; // stay busy until the next screen replaces this one
    }
    setBusy(false);
    setOutcome(result);
    if (result.kind === 'confirm-email') { setMode('login'); setPassword(''); }
    queueMicrotask(() => noticeRef.current?.focus());
  }

  return (
    <OnboardingLayout
      align="end"
      header={
        <OnboardingHeader
          backHref={startRoutes.welcome}
          step={flowStepNumber('account')}
          totalSteps={flowTotal}
          skipHref={startRoutes.tour}
          skipLabel="Skip creating an account for now"
        />
      }
    >
      <div className="plg-stack" data-gap="2">
        <h1 className="plg-title">{signup ? `Join ${site.name}` : 'Welcome back'}</h1>
        <p className="plg-lede">
          {signup ? 'Create an account to keep your work in one place. You can also skip this and decide later.' : 'Sign in with the email and password you used before.'}
        </p>
      </div>

      {outcome ? (
        <GlassSurface tone="raised" padding="compact" className="start-notice" role={outcome.kind === 'confirm-email' ? 'status' : 'alert'}>
          <div ref={noticeRef} tabIndex={-1} className="start-notice-body" data-kind={outcome.kind}>
            <GlassIcon name={outcome.kind === 'confirm-email' ? 'mail' : outcome.kind === 'not-connected' ? 'info' : 'warn'} />
            <div className="plg-stack" data-gap="2">
              <p>{outcome.message}</p>
              {outcome.kind === 'not-connected' ? <p><Link className="plg-link" data-target="large" href={startRoutes.tour}>Continue without an account</Link></p> : null}
            </div>
          </div>
        </GlassSurface>
      ) : null}

      <form className="plg-stack start-form" data-gap="3" onSubmit={submit} noValidate>
        <GlassField
          ref={emailRef}
          label="Email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete={signup ? 'email' : 'username'}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          maxLength={254}
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((x) => ({ ...x, email: undefined })); }}
          icon={<GlassIcon name="mail" />}
          error={errors.email}
        />
        <GlassField
          ref={passwordRef}
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete={signup ? 'new-password' : 'current-password'}
          required
          minLength={PASSWORD_MIN}
          maxLength={PASSWORD_MAX}
          value={password}
          onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((x) => ({ ...x, password: undefined })); }}
          icon={<GlassIcon name="lock" />}
          hint={signup ? `At least ${PASSWORD_MIN} characters. A few random words work well.` : undefined}
          error={errors.password}
          trailing={
            <GlassButton
              variant="icon"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((v) => !v)}
              icon={<GlassIcon name={showPassword ? 'eyeOff' : 'eye'} />}
            />
          }
        />
        <GlassButton
          variant="primary"
          type="submit"
          loading={busy}
          loadingLabel={signup ? 'Creating your account…' : 'Signing you in…'}
          icon={<GlassIcon name="spark" size={22} tone="deep" />}
          className="start-submit"
        >
          {signup ? 'Create account' : 'Sign in'}
        </GlassButton>
      </form>

      <p className="plg-note start-switch">
        {signup ? 'Already have an account?' : 'New here?'}{' '}
        <button type="button" className="plg-link" data-target="large" onClick={() => switchMode(signup ? 'login' : 'signup')}>
          {signup ? 'Sign in' : 'Create an account'}
        </button>
      </p>

      <div className="plg-stack" data-gap="3">
        <AuthDivider>Other ways to sign in</AuthDivider>
        <div className="start-providers">
          <GlassButton variant="secondary" disabled icon={<GlassIcon name="google" />} note="Coming soon">Google</GlassButton>
          <GlassButton variant="secondary" disabled icon={<GlassIcon name="apple" />} note="Coming soon">Apple</GlassButton>
        </div>
        {/* Owner request 14 Nov: an obvious way past sign-in. Nothing is created; answers stay on this device. */}
        <GlassButton variant="secondary" type="button" onClick={() => router.push(startRoutes.tour)}>Continue without an account</GlassButton>
      </div>
    </OnboardingLayout>
  );
}
