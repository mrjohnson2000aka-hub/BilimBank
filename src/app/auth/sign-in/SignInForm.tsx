'use client';
import Link from 'next/link';
import { useState } from 'react';
import AuthShell from '@/components/AuthShell';
import GoogleButton from '@/components/GoogleButton';
import { Button, Field, inputCls } from '@/components/ui';
import { useApp } from '@/components/Providers';
import { browserClient } from '@/lib/supabase/client';

export default function SignInForm({ google, next }: { google: boolean; next: string }) {
  const { d } = useApp();
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setBusy(true);
    const { error } = await browserClient().auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) return setErr(/confirm/i.test(error.message) ? d.auth.emailNotConfirmed : d.auth.invalidLogin);
    location.href = next;
  }
  return (
    <AuthShell title={d.auth.signInTitle} text={d.auth.signInText}>
      {google && <><GoogleButton label={d.auth.google} next={next} /><div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />{d.auth.or}<span className="h-px flex-1 bg-line" /></div></>}
      <form onSubmit={submit} className="space-y-4">
        <Field label={d.auth.email} htmlFor="email"><input id="email" type="email" required autoComplete="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} /></Field>
        <Field label={<span className="flex justify-between">{d.auth.password}<Link href="/auth/forgot-password" className="text-xs font-semibold text-emerald-700">{d.auth.forgot}</Link></span>} htmlFor="password">
          <input id="password" type="password" required autoComplete="current-password" className={inputCls} value={password} onChange={e => setPassword(e.target.value)} />
        </Field>
        {err && <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm font-medium text-danger" role="alert">{err}</p>}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? d.common.loading : d.common.signIn}</Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">{d.auth.noAccount} <Link href="/auth/sign-up" className="font-semibold text-emerald-700">{d.common.join}</Link></p>
    </AuthShell>
  );
}
