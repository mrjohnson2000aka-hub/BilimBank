'use client';
import { useState } from 'react';
import AuthShell from '@/components/AuthShell';
import { Button, Field, inputCls } from '@/components/ui';
import { useApp } from '@/components/Providers';
import { browserClient } from '@/lib/supabase/client';
export default function Page() {
  const { d } = useApp();
  const [email, setEmail] = useState(''), [done, setDone] = useState(false), [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    await browserClient().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/auth/callback?next=/auth/reset-password` });
    setBusy(false); setDone(true); // same message either way, so nobody can test which emails exist
  }
  return (
    <AuthShell title={d.auth.forgotTitle} text={d.auth.forgotText}>
      {done ? <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700" role="status">{d.auth.linkSent}</p> : (
        <form onSubmit={submit} className="space-y-4">
          <Field label={d.auth.email} htmlFor="email"><input id="email" type="email" required autoComplete="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} /></Field>
          <Button type="submit" className="w-full" disabled={busy}>{d.auth.sendLink}</Button>
        </form>
      )}
    </AuthShell>
  );
}
