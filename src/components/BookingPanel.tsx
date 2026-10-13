'use client';
import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { browserClient } from '@/lib/supabase/client';
import { useApp } from './Providers';
import SlotPicker from './SlotPicker';
import { Button, Field, btn, inputCls } from './ui';
import { credits, dateTime, errorText, fill, skillName } from '@/lib/format';

type T = { id: string; name: string; durations: number[]; skills: { skill_id: number; name_en: string; name_uz: string }[] };
export default function BookingPanel({ teacher, viewer, initialSkill }: { teacher: T; viewer: { signedIn: boolean; onboarded: boolean; balance: number }; initialSkill?: number }) {
  const { d, lang, tz } = useApp();
  const [skill, setSkill] = useState<number>(teacher.skills.find(s => s.skill_id === initialSkill)?.skill_id || teacher.skills[0]?.skill_id);
  const [dur, setDur] = useState(teacher.durations.includes(60) ? 60 : teacher.durations[0]);
  const [slot, setSlot] = useState<string | null>(null), [note, setNote] = useState(''), [agree, setAgree] = useState(false), [err, setErr] = useState(''), [busy, setBusy] = useState(false), [done, setDone] = useState<string | null>(null);
  const cost = Math.round((dur / 60) * 10) / 10;
  if (!teacher.skills.length) return null;
  if (done) return (
    <div className="text-center"><CheckCircle2 size={40} className="mx-auto text-emerald" aria-hidden /><h3 className="mt-3 text-lg font-bold text-navy">{d.profile.bookedTitle}</h3>
      <p className="mt-1 text-sm text-muted">{fill(d.profile.bookedText, { name: teacher.name })}</p><Link href={`/sessions/${done}`} className={btn('primary', 'md', 'mt-5')}>{d.profile.openSession}</Link></div>
  );
  async function book() {
    setErr('');
    if (!slot) return;
    if (!agree) return setErr(d.auth.mustAgree);
    setBusy(true);
    const { data, error } = await browserClient().rpc('book_session', { p_teacher: teacher.id, p_skill: skill, p_start: slot, p_duration: dur, p_note: note.trim() || null });
    setBusy(false);
    if (error) { setErr(errorText(error, d)); if (/slot_/.test(error.message)) setSlot(null); return; }
    fetch('/api/outbox/flush', { method: 'POST' }).catch(() => {});
    setDone(data as string);
  }
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={d.profile.chooseSkill} htmlFor="bk-skill"><select id="bk-skill" className={inputCls} value={skill} onChange={e => setSkill(+e.target.value)}>{teacher.skills.map(s => <option key={s.skill_id} value={s.skill_id}>{skillName(s, lang)}</option>)}</select></Field>
        <Field label={d.profile.duration} htmlFor="bk-dur"><select id="bk-dur" className={inputCls} value={dur} onChange={e => { setDur(+e.target.value); setSlot(null); }}>{teacher.durations.map(m => <option key={m} value={m}>{m} {d.common.minutes} · {credits(m / 60, d, lang)}</option>)}</select></Field>
      </div>
      <SlotPicker teacherId={teacher.id} duration={dur} value={slot} onPick={setSlot} />
      {slot && (
        <div className="space-y-4 rounded-xl border border-line bg-canvas p-4">
          <p className="font-semibold text-navy">{dateTime(slot, tz, lang)} · {dur} {d.common.minutes}</p>
          {!viewer.signedIn ? <Link href={`/auth/sign-in?next=${encodeURIComponent(location.pathname)}`} className={btn('primary', 'md', 'w-full')}>{d.profile.signInToBook}</Link>
            : !viewer.onboarded ? <Link href="/onboarding" className={btn('primary', 'md', 'w-full')}>{d.errors.finish_onboarding}</Link> : (
            <>
              <dl className="grid grid-cols-2 gap-2 text-sm"><dt className="text-muted">{d.profile.cost}</dt><dd className="text-right font-bold tabular">{credits(cost, d, lang)}</dd>
                <dt className="text-muted">{d.profile.balanceAfter}</dt><dd className={`text-right font-bold tabular ${viewer.balance - cost < 0 ? 'text-danger' : ''}`}>{credits(Math.max(0, viewer.balance - cost), d, lang)}</dd></dl>
              <Field label={<>{d.profile.note} <span className="font-normal text-muted">({d.common.optional})</span></>} htmlFor="bk-note"><textarea id="bk-note" rows={2} maxLength={500} className={inputCls} placeholder={d.profile.notePh} value={note} onChange={e => setNote(e.target.value)} /></Field>
              <div className="rounded-xl bg-white p-3 text-xs text-muted ring-1 ring-line"><b className="text-ink">{d.profile.rulesTitle}.</b> {d.profile.rules}</div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-emerald-600" checked={agree} onChange={e => setAgree(e.target.checked)} />{d.profile.agreeRules}</label>
              {err && <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm font-medium text-danger" role="alert">{err}</p>}
              <Button className="w-full" onClick={book} disabled={busy || viewer.balance < cost}>{busy ? d.common.saving : viewer.balance < cost ? d.errors.insufficient_credits : fill(d.profile.bookNow, { c: credits(cost, d, lang) })}</Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
