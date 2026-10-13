'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { Avatar, Button, Field, inputCls } from '@/components/ui';
import { useApp } from '@/components/Providers';
import { browserClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/supabase/server';
import { errorText } from '@/lib/format';

export default function ProfileForm({ profile }: { profile: Profile }) {
  const { d, toast } = useApp();
  const router = useRouter(), sb = browserClient(), file = useRef<HTMLInputElement>(null);
  const [f, setF] = useState({ display_name: profile.display_name, username: profile.username, bio: profile.bio || '', school: profile.school || '', education_level: profile.education_level || '', country: profile.country || '',
    languages: profile.languages.join(', '), show_school: profile.show_school, show_on_leaderboard: profile.show_on_leaderboard, avatar_url: profile.avatar_url });
  const [busy, setBusy] = useState(false), [err, setErr] = useState('');
  async function save(extra?: Partial<typeof f>) {
    const v = { ...f, ...extra }; setErr('');
    if (!v.display_name.trim()) return setErr(d.onboarding.needName);
    if (!/^[a-z0-9_]{3,24}$/.test(v.username)) return setErr(d.onboarding.needUsername);
    setBusy(true);
    const { error } = await sb.from('profiles').update({ display_name: v.display_name.trim(), username: v.username, bio: v.bio.trim() || null, school: v.school.trim() || null, education_level: v.education_level.trim() || null,
      country: v.country.trim() || null, languages: v.languages.split(',').map(x => x.trim()).filter(Boolean).slice(0, 8), show_school: profile.is_minor ? false : v.show_school, show_on_leaderboard: v.show_on_leaderboard, avatar_url: v.avatar_url }).eq('id', profile.id);
    setBusy(false);
    if (error) return setErr(/username/.test(error.message) ? d.onboarding.usernameTaken : errorText(error, d));
    toast(d.common.saved); router.refresh();
  }
  async function upload(file: File) {
    if (file.size > 2 * 1024 * 1024 || !/image\/(png|jpeg|webp)/.test(file.type)) return setErr(d.onboarding.avatarHint);
    setBusy(true);
    const path = `${profile.id}/avatar-${Date.now()}.${file.type.split('/')[1]}`;
    const { error } = await sb.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
    setBusy(false);
    if (error) return setErr(errorText(error, d));
    const url = sb.storage.from('avatars').getPublicUrl(path).data.publicUrl;
    setF(x => ({ ...x, avatar_url: url })); save({ avatar_url: url });
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4"><Avatar name={f.display_name} url={f.avatar_url} size={72} />
        <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
        <Button variant="outline" size="sm" onClick={() => file.current?.click()} disabled={busy}><Upload size={15} aria-hidden />{d.onboarding.upload}</Button>
        {f.avatar_url && <Button variant="ghost" size="sm" onClick={() => { setF(x => ({ ...x, avatar_url: null })); save({ avatar_url: null }); }}>{d.settings.avatarRemove}</Button>}</div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={d.onboarding.displayName} htmlFor="dn"><input id="dn" className={inputCls} maxLength={60} value={f.display_name} onChange={e => setF({ ...f, display_name: e.target.value })} /></Field>
        <Field label={d.onboarding.username} htmlFor="un" hint={d.onboarding.usernameHint}><input id="un" className={inputCls} maxLength={24} value={f.username} onChange={e => setF({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} /></Field>
        <Field label={d.onboarding.school} htmlFor="sc"><input id="sc" className={inputCls} maxLength={100} value={f.school} onChange={e => setF({ ...f, school: e.target.value })} /></Field>
        <Field label={d.onboarding.level} htmlFor="lv"><input id="lv" className={inputCls} maxLength={60} value={f.education_level} onChange={e => setF({ ...f, education_level: e.target.value })} /></Field>
        <Field label={d.auth.country} htmlFor="co"><input id="co" className={inputCls} maxLength={60} value={f.country} onChange={e => setF({ ...f, country: e.target.value })} /></Field>
        <Field label={d.onboarding.languages} htmlFor="la" hint={d.onboarding.languagesHint}><input id="la" className={inputCls} value={f.languages} onChange={e => setF({ ...f, languages: e.target.value })} /></Field>
      </div>
      <Field label={d.onboarding.bio} htmlFor="bio"><textarea id="bio" rows={4} maxLength={600} className={inputCls} placeholder={d.onboarding.bioPh} value={f.bio} onChange={e => setF({ ...f, bio: e.target.value })} /></Field>
      <fieldset className="space-y-2"><legend className="mb-1 text-sm font-semibold text-ink">{d.settings.privacy}</legend>
        <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" className="h-4 w-4 accent-emerald-600" disabled={profile.is_minor} checked={f.show_school && !profile.is_minor} onChange={e => setF({ ...f, show_school: e.target.checked })} />{d.settings.showSchool}{profile.is_minor && <span className="text-muted">({d.onboarding.showSchoolMinor})</span>}</label>
        <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" className="h-4 w-4 accent-emerald-600" checked={f.show_on_leaderboard} onChange={e => setF({ ...f, show_on_leaderboard: e.target.checked })} />{d.settings.showLeaderboard}</label>
      </fieldset>
      {err && <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm font-medium text-danger" role="alert">{err}</p>}
      <Button onClick={() => save()} disabled={busy}>{busy ? d.common.saving : d.common.save}</Button>
    </div>
  );
}
