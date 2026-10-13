'use client';
import { useState } from 'react';
import AuthShell from '@/components/AuthShell';
import { Button, Field, inputCls } from '@/components/ui';
import { useApp } from '@/components/Providers';
import { browserClient } from '@/lib/supabase/client';
export default function Page() {
  const { d, toast } = useApp();
  const [pw, setPw] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    if (pw.length < 8) return setErr(d.auth.weakPassword);
    setBusy(true); const { error } = await browserClient().auth.updateUser({ password: pw }); setBusy(false);
    if (error) return setErr(error.message);
    toast(d.auth.passwordUpdated); location.href = '/sessions';
  }
  return (
    <AuthShell title={d.auth.resetTitle}>
      <form onSubmit={submit} className="space-y-4">
        <Field label={d.auth.newPassword} htmlFor="pw" hint={d.auth.passwordHint} error={err}><input id="pw" type="password" autoComplete="new-password" className={inputCls} value={pw} onChange={e => setPw(e.target.value)} /></Field>
        <Button type="submit" className="w-full" disabled={busy}>{d.auth.updatePassword}</Button>
      </form>
    </AuthShell>
  );
}
