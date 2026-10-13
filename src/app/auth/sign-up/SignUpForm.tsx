'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MailCheck } from 'lucide-react';
import AuthShell from '@/components/AuthShell';
import GoogleButton from '@/components/GoogleButton';
import { Button, Field, inputCls } from '@/components/ui';
import { useApp } from '@/components/Providers';
import { browserClient } from '@/lib/supabase/client';
import { TIMEZONES, fill } from '@/lib/format';

export default function SignUpForm({ google }: { google: boolean }) {
  const { d, lang } = useApp();
  const [f, setF] = useState({ name: '', email: '', password: '', country: '', tz: 'Asia/Tashkent', lang: lang as string, agree: false });
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false), [sent, setSent] = useState(false);
  useEffect(() => { try { const z = Intl.DateTimeFormat().resolvedOptions().timeZone; if (z) setF(x => ({ ...x, tz: z })); } catch { /* keep default */ } }, []);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF(x => ({ ...x, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    if (!f.agree) return setErr(d.auth.mustAgree);
    if (f.password.length < 8) return setErr(d.auth.weakPassword);
    setBusy(true);
    const { data, error } = await browserClient().auth.signUp({ email: f.email.trim(), password: f.password,
      options: { emailRedirectTo: `${location.origin}/auth/callback?next=/onboarding`, data: { full_name: f.name.trim(), timezone: f.tz, lang: f.lang, country: f.country.trim(), terms: true } } });
    setBusy(false);
    if (error) return setErr(/registered|exists/i.test(error.message) ? d.auth.emailTaken : /password/i.test(error.message) ? d.auth.weakPassword : error.message);
    if (data.user && data.user.identities && data.user.identities.length === 0) return setErr(d.auth.emailTaken);
    document.cookie = `lang=${f.lang};path=/;max-age=31536000;samesite=lax`;
    if (data.session) { location.href = '/onboarding'; return; }
    setSent(true);
  }
  if (sent) return <AuthShell title={d.auth.checkEmailTitle}><div className="flex gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700"><MailCheck className="flex-none" aria-hidden /><p>{fill(d.auth.checkEmailText, { email: f.email })}</p></div></AuthShell>;
  const tzs = TIMEZONES.includes(f.tz) ? TIMEZONES : [f.tz, ...TIMEZONES];
  return (
    <AuthShell title={d.auth.signUpTitle} text={d.auth.signUpText}>
      {google && <><GoogleButton label={d.auth.google} next="/onboarding" /><div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />{d.auth.or}<span className="h-px flex-1 bg-line" /></div></>}
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label={d.auth.fullName} htmlFor="name"><input id="name" required maxLength={60} autoComplete="name" className={inputCls} value={f.name} onChange={set('name')} /></Field>
        <Field label={d.auth.email} htmlFor="email"><input id="email" type="email" required autoComplete="email" className={inputCls} value={f.email} onChange={set('email')} /></Field>
        <Field label={d.auth.password} htmlFor="password" hint={d.auth.passwordHint}><input id="password" type="password" required minLength={8} autoComplete="new-password" className={inputCls} value={f.password} onChange={set('password')} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={d.auth.country} htmlFor="country"><input id="country" maxLength={60} autoComplete="country-name" className={inputCls} value={f.country} onChange={set('country')} placeholder="Uzbekistan" /></Field>
          <Field label={d.auth.language} htmlFor="lang"><select id="lang" className={inputCls} value={f.lang} onChange={set('lang')}><option value="en">English</option><option value="uz">Oʻzbekcha</option></select></Field>
        </div>
        <Field label={d.auth.timezone} htmlFor="tz"><select id="tz" className={inputCls} value={f.tz} onChange={set('tz')}>{tzs.map(z => <option key={z}>{z}</option>)}</select></Field>
        <label className="flex items-start gap-2.5 text-sm text-ink"><input type="checkbox" className="mt-1 h-4 w-4 accent-emerald-600" checked={f.agree} onChange={set('agree')} />
          <span>{d.auth.agreePrefix} <Link className="font-semibold text-emerald-700 underline" href="/help#terms" target="_blank">{d.auth.terms}</Link>, <Link className="font-semibold text-emerald-700 underline" href="/help#privacy" target="_blank">{d.auth.privacy}</Link> {d.auth.and} <Link className="font-semibold text-emerald-700 underline" href="/help#guidelines" target="_blank">{d.auth.guidelines}</Link>.</span></label>
        {err && <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm font-medium text-danger" role="alert">{err}</p>}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? d.common.loading : d.auth.createAccount}</Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">{d.auth.haveAccount} <Link href="/auth/sign-in" className="font-semibold text-emerald-700">{d.common.signIn}</Link></p>
    </AuthShell>
  );
}
