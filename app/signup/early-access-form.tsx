'use client';
import { useState } from 'react';
import type { FormEvent } from 'react';

// One email field, no separate button: press Enter or the arrow inside the field to join.
export function EarlyAccessForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setState('sending');
    setError('');
    try {
      const res = await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: data.get('email'), company: data.get('company') }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && json.ok) return setState('done');
      setError(json.error || 'Something went wrong. Please try again.');
      setState('error');
    } catch {
      setError('Something went wrong. Please try again.');
      setState('error');
    }
  }

  if (state === 'done') {
    return <p className="cells-ea-done" role="status">You&apos;re on the list. We&apos;ll email you when your spot opens.</p>;
  }

  return (
    <form className="cells-ea" onSubmit={onSubmit} noValidate>
      <label className="cells-ea-label" htmlFor="ea-email">Your email</label>
      <div className="cells-ea-field">
        <input
          id="ea-email" name="email" type="email" inputMode="email" autoComplete="email" required
          placeholder="you@yourbusiness.com.au" aria-describedby="ea-error"
          aria-invalid={state === 'error' || undefined}
        />
        <button type="submit" aria-label="Join the early access list" disabled={state === 'sending'}>
          <span aria-hidden="true">{state === 'sending' ? '…' : '→'}</span>
        </button>
      </div>
      <input className="cells-ea-hp" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <p id="ea-error" className="cells-ea-error" role="alert">{error}</p>
    </form>
  );
}
