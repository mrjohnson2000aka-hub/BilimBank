'use client';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { Check, Upload } from 'lucide-react';
import { Avatar, Button, Field, inputCls } from '@/components/ui';
import { useApp } from '@/components/Providers';
import SkillPicker, { type Category, type Skill } from '@/components/SkillPicker';
import AvailabilityEditor from '@/components/AvailabilityEditor';
import ProfileHeader, { type PublicProfile } from '@/components/ProfileHeader';
import { browserClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/supabase/server';
import { errorText, fill } from '@/lib/format';

const ageOf = (b: string) => { const x = new Date(b), n = new Date(); let a = n.getFullYear() - x.getFullYear(); if (n < new Date(n.getFullYear(), x.getMonth(), x.getDate())) a--; return a; };

export default function OnboardingFlow({ profile, skills, categories, teach, learn, birth, agreedAtSignup }: { profile: Profile; skills: Skill[]; categories: Category[]; teach: { skill_id: number; level: string }[]; learn: { skill_id: number; level: string }[]; birth: string; agreedAtSignup: boolean }) {
  const { d, lang, tz, toast } = useApp();
  const router = useRouter(), sb = browserClient();
  const [step, setStep] = useState(0), [busy, setBusy] = useState(false), [err, setErr] = useState('');
  const [p, setP] = useState({ display_name: profile.display_name, username: profile.username, school: profile.school || '', education_level: profile.education_level || '', show_school: profile.show_school, bio: profile.bio || '', languages: (profile.languages || []).join(', '), avatar_url: profile.avatar_url });
  const [dob, setDob] = useState(birth), [agree, setAgree] = useState(agreedAtSignup);
  const [preview, setPreview] = useState<{ pp: PublicProfile; teach: never[]; learn: never[] } | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const minor = dob ? ageOf(dob) < 18 : false;

  async function saveStep(fields: Record<string, unknown>) {
    const { error } = await sb.from('profiles').update(fields).eq('id', profile.id);
    if (error) { setErr(/username/.test(error.message) && /duplicate|unique/.test(error.message) ? d.onboarding.usernameTaken : errorText(error, d)); return false; }
    return true;
  }
  async function next() {
    setErr(''); setBusy(true);
    try {
      if (step === 0) {
        if (!p.display_name.trim()) return setErr(d.onboarding.needName);
        if (!/^[a-z0-9_]{3,24}$/.test(p.username)) return setErr(d.onboarding.needUsername);
        if (!dob) return setErr(d.onboarding.needBirth);
        if (ageOf(dob) < 13) return setErr(fill(d.onboarding.tooYoung, { age: 13 }));
        if (!(await saveStep({ display_name: p.display_name.trim(), username: p.username, school: p.school.trim() || null, education_level: p.education_level.trim() || null, show_school: minor ? false : p.show_school }))) return;
      }
      if (step === 3 && !(await saveStep({ bio: p.bio.trim() || null, languages: p.languages.split(',').map(x => x.trim()).filter(Boolean).slice(0, 8) }))) return;
      if (step === 4) await loadPreview();
      setStep(s => s + 1); window.scrollTo(0, 0);
    } finally { setBusy(false); }
  }
  async function loadPreview() {
    const [t, l] = await Promise.all([sb.from('user_teaching_skills').select('skill_id,level,skills(name_en,name_uz,slug)').eq('user_id', profile.id), sb.from('user_learning_skills').select('skill_id,level,skills(name_en,name_uz,slug)').eq('user_id', profile.id)]);
    setPreview({ pp: { id: profile.id, username: p.username, display_name: p.display_name, avatar_url: p.avatar_url, bio: p.bio, school: p.show_school && !minor ? p.school : null, education_level: p.education_level || null, country: profile.country, timezone: profile.timezone, languages: p.languages.split(',').map(x => x.trim()).filter(Boolean), session_durations: profile.session_durations, created_at: profile.created_at, rating: null, review_count: 0, completed_sessions: 0, hours_taught: 0, hours_learned: 0 }, teach: (t.data || []) as never[], learn: (l.data || []) as never[] });
  }
  async function upload(f: File) {
    if (f.size > 2 * 1024 * 1024 || !/image\/(png|jpeg|webp)/.test(f.type)) return setErr(d.onboarding.avatarHint);
    setBusy(true);
    const path = `${profile.id}/avatar-${Date.now()}.${f.type.split('/')[1]}`;
    const { error } = await sb.storage.from('avatars').upload(path, f, { upsert: true, contentType: f.type });
    if (error) { setBusy(false); return setErr(errorText(error, d)); }
    const url = sb.storage.from('avatars').getPublicUrl(path).data.publicUrl;
    await saveStep({ avatar_url: url }); setP(x => ({ ...x, avatar_url: url })); setBusy(false);
  }
  async function finish() {
    setErr('');
    if (!agree) return setErr(d.auth.mustAgree);
    setBusy(true);
    const { error } = await sb.rpc('complete_onboarding', { p_birth_date: dob, p_accept_terms: true });
    setBusy(false);
    if (error) return setErr(errorText(error, d));
    toast(d.onboarding.welcome); router.push('/discover'); router.refresh();
  }
  const titles = [[d.onboarding.s1Title, d.onboarding.s1Text], [d.onboarding.s2Title, d.onboarding.s2Text], [d.onboarding.s3Title, d.onboarding.s3Text], [d.onboarding.s4Title, d.onboarding.s4Text], [d.onboarding.s5Title, d.onboarding.s5Text], [d.onboarding.s6Title, d.onboarding.s6Text]];
  return (
    <div className="wrap max-w-3xl py-10">
      <p className="text-sm font-semibold text-emerald-700">{fill(d.onboarding.stepOf, { n: step + 1 })}</p>
      <ol className="mt-3 grid grid-cols-6 gap-1.5" aria-label={d.onboarding.title}>
        {d.onboarding.stepNames.map((n, i) => <li key={n} className="min-w-0"><div className={`h-1.5 rounded-full ${i <= step ? 'bg-emerald' : 'bg-line'}`} /><span className={`mt-1.5 hidden truncate text-xs sm:block ${i === step ? 'font-bold text-navy' : 'text-muted'}`}>{i < step && <Check size={11} className="mr-0.5 inline" aria-hidden />}{n}</span></li>)}
      </ol>
      <h1 className="mt-8 text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{titles[step][0]}</h1>
      <p className="mt-1.5 text-muted">{titles[step][1]}</p>
      <div className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
        {step === 0 && (
          <div className="space-y-5">
            <div className="flex items-center gap-4"><Avatar name={p.display_name} url={p.avatar_url} size={72} />
              <div><input ref={file} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
                <Button variant="outline" size="sm" onClick={() => file.current?.click()} disabled={busy}><Upload size={15} aria-hidden />{d.onboarding.upload}</Button><p className="mt-1 text-xs text-muted">{d.onboarding.avatarHint}</p></div></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={d.onboarding.displayName} htmlFor="dn"><input id="dn" className={inputCls} maxLength={60} value={p.display_name} onChange={e => setP({ ...p, display_name: e.target.value })} /></Field>
              <Field label={d.onboarding.username} htmlFor="un" hint={d.onboarding.usernameHint}><input id="un" className={inputCls} maxLength={24} value={p.username} onChange={e => setP({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} /></Field>
              <Field label={<>{d.onboarding.school} <span className="font-normal text-muted">({d.common.optional})</span></>} htmlFor="sc"><input id="sc" className={inputCls} maxLength={100} value={p.school} onChange={e => setP({ ...p, school: e.target.value })} /></Field>
              <Field label={<>{d.onboarding.level} <span className="font-normal text-muted">({d.common.optional})</span></>} htmlFor="lv"><input id="lv" className={inputCls} maxLength={60} value={p.education_level} onChange={e => setP({ ...p, education_level: e.target.value })} /></Field>
              <Field label={d.onboarding.birthDate} htmlFor="dob" hint={d.onboarding.birthHint}><input id="dob" type="date" className={inputCls} value={dob} max={new Date().toISOString().slice(0, 10)} onChange={e => setDob(e.target.value)} /></Field>
            </div>
            <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" className="h-4 w-4 accent-emerald-600" disabled={minor} checked={p.show_school && !minor} onChange={e => setP({ ...p, show_school: e.target.checked })} />{d.onboarding.showSchool}{minor && <span className="text-muted">({d.onboarding.showSchoolMinor})</span>}</label>
          </div>
        )}
        {step === 1 && <SkillPicker mode="teach" userId={profile.id} skills={skills} categories={categories} initial={teach} />}
        {step === 2 && <SkillPicker mode="learn" userId={profile.id} skills={skills} categories={categories} initial={learn} />}
        {step === 3 && (
          <div className="space-y-4">
            <Field label={d.onboarding.bio} htmlFor="bio"><textarea id="bio" rows={4} maxLength={600} className={inputCls} placeholder={d.onboarding.bioPh} value={p.bio} onChange={e => setP({ ...p, bio: e.target.value })} /></Field>
            <Field label={d.onboarding.languages} htmlFor="langs" hint={d.onboarding.languagesHint}><input id="langs" className={inputCls} value={p.languages} onChange={e => setP({ ...p, languages: e.target.value })} /></Field>
          </div>
        )}
        {step === 4 && <AvailabilityEditor compact userId={profile.id} prefs={{ timezone: profile.timezone, session_durations: profile.session_durations, min_notice_hours: profile.min_notice_hours, horizon_days: profile.horizon_days, buffer_minutes: profile.buffer_minutes }} />}
        {step === 5 && preview && (
          <div className="space-y-5">
            <ProfileHeader p={preview.pp} teach={preview.teach} learn={preview.learn} d={d} lang={lang} tz={tz} />
            <label className="flex items-start gap-2.5 text-sm"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-emerald-600" checked={agree} onChange={e => setAgree(e.target.checked)} />{d.onboarding.agree}</label>
          </div>
        )}
        {err && <p className="mt-4 rounded-lg bg-danger-50 px-3 py-2 text-sm font-medium text-danger" role="alert">{err}</p>}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => { setErr(''); setStep(s => Math.max(0, s - 1)); }} disabled={step === 0 || busy}>{d.common.back}</Button>
        <div className="flex items-center gap-3">
          {(step === 3 || step === 4) && <button className="text-sm font-semibold text-muted hover:text-navy" onClick={async () => { if (step === 4) await loadPreview(); setStep(s => s + 1); }}>{d.common.skip}</button>}
          {step < 5 ? <Button onClick={next} disabled={busy}>{busy ? d.common.saving : d.common.next}</Button> : <Button onClick={finish} disabled={busy} size="lg">{busy ? d.common.saving : d.onboarding.finish}</Button>}
        </div>
      </div>
      {step >= 3 && <p className="mt-4 text-center text-xs text-muted">{d.onboarding.laterHint}</p>}
    </div>
  );
}
