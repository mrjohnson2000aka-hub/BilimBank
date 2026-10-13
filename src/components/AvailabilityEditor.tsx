'use client';
import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { browserClient } from '@/lib/supabase/client';
import { useApp } from './Providers';
import { Button, Field, inputCls } from './ui';
import { HALF_HOURS, weekdayNames } from '@/lib/weekdays';
import { TIMEZONES, dateTime, errorText, fill } from '@/lib/format';

type Rule = { id: number; weekday: number | null; on_date: string | null; start_time: string; end_time: string };
type Exc = { id: number; starts_on: string; ends_on: string; note: string | null };
type Prefs = { timezone: string; session_durations: number[]; min_notice_hours: number; horizon_days: number; buffer_minutes: number };
const hhmm = (t: string) => t.slice(0, 5);

export default function AvailabilityEditor({ userId, prefs: initialPrefs, compact = false }: { userId: string; prefs: Prefs; compact?: boolean }) {
  const { d, lang, toast } = useApp();
  const sb = browserClient();
  const [rules, setRules] = useState<Rule[]>([]), [exc, setExc] = useState<Exc[]>([]), [prefs, setPrefs] = useState(initialPrefs), [preview, setPreview] = useState<string[] | null>(null);
  const [nd, setNd] = useState({ date: '', start: '10:00', end: '12:00' }), [ne, setNe] = useState({ from: '', to: '', note: '' }), [savingPrefs, setSavingPrefs] = useState(false);
  const days = weekdayNames(lang);
  const load = useCallback(async () => {
    const [r, e] = await Promise.all([sb.from('availability_rules').select('*').eq('user_id', userId).order('start_time'), sb.from('availability_exceptions').select('*').eq('user_id', userId).order('starts_on')]);
    setRules((r.data || []) as Rule[]); setExc((e.data || []) as Exc[]);
  }, [sb, userId]);
  const loadPreview = useCallback(async () => {
    const from = new Date(), to = new Date(Date.now() + 14 * 864e5);
    const { data } = await sb.rpc('open_slots', { p_teacher: userId, p_from: from.toISOString(), p_to: to.toISOString(), p_duration: prefs.session_durations[0] || 60 });
    setPreview(((data || []) as string[]).slice(0, 12));
  }, [sb, userId, prefs.session_durations]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!compact) loadPreview(); }, [loadPreview, rules, exc, compact]);
  const fail = (e: unknown) => toast(errorText(e, d), 'err');
  async function addRule(weekday: number | null, on_date: string | null, start = '17:00', end = '19:00') {
    if (end <= start) return toast(d.errors.slot_unavailable, 'err');
    const { data, error } = await sb.from('availability_rules').insert({ user_id: userId, weekday, on_date, start_time: start, end_time: end }).select().single();
    if (error) return fail(error); setRules(r => [...r, data as Rule]);
  }
  async function updateRule(r: Rule, k: 'start_time' | 'end_time', v: string) {
    const next = { ...r, [k]: v };
    if (hhmm(next.end_time) <= hhmm(next.start_time)) return;
    const { error } = await sb.from('availability_rules').update({ [k]: v }).eq('id', r.id);
    if (error) return fail(error); setRules(rs => rs.map(x => (x.id === r.id ? next : x)));
  }
  async function delRule(id: number) { const { error } = await sb.from('availability_rules').delete().eq('id', id); if (error) return fail(error); setRules(r => r.filter(x => x.id !== id)); }
  async function addExc() {
    if (!ne.from) return; const { data, error } = await sb.from('availability_exceptions').insert({ user_id: userId, starts_on: ne.from, ends_on: ne.to || ne.from, note: ne.note || null }).select().single();
    if (error) return fail(error); setExc(x => [...x, data as Exc]); setNe({ from: '', to: '', note: '' });
  }
  async function delExc(id: number) { const { error } = await sb.from('availability_exceptions').delete().eq('id', id); if (error) return fail(error); setExc(x => x.filter(e => e.id !== id)); }
  async function savePrefs() {
    if (!prefs.session_durations.length) return toast(d.errors.slot_unavailable, 'err');
    setSavingPrefs(true); const { error } = await sb.from('profiles').update(prefs).eq('id', userId); setSavingPrefs(false);
    if (error) return fail(error); toast(d.common.saved); loadPreview();
  }
  const TimeSel = ({ v, on, label }: { v: string; on: (x: string) => void; label: string }) => <select aria-label={label} value={hhmm(v)} onChange={e => on(e.target.value)} className="rounded-lg border border-line bg-white px-2 py-1.5 text-sm tabular">{HALF_HOURS.map(h => <option key={h}>{h}</option>)}<option value="23:59">24:00</option></select>;
  return (
    <div className="space-y-8">
      <section>
        <h3 className="font-bold text-navy">{d.settings.weekly}</h3>
        <p className="text-sm text-muted">{fill(d.settings.weeklyText, { tz: prefs.timezone })}</p>
        <div className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
          {days.map((name, wd) => { const list = rules.filter(r => r.weekday === wd); return (
            <div key={wd} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start">
              <div className="w-32 flex-none pt-1.5 text-sm font-semibold text-ink">{name}</div>
              <div className="flex flex-1 flex-col gap-2">
                {list.map(r => (
                  <div key={r.id} className="flex flex-wrap items-center gap-2">
                    <TimeSel v={r.start_time} on={v => updateRule(r, 'start_time', v)} label={`${name} ${d.settings.from}`} /><span className="text-muted">–</span>
                    <TimeSel v={r.end_time} on={v => updateRule(r, 'end_time', v)} label={`${name} ${d.settings.to}`} />
                    <button onClick={() => delRule(r.id)} className="rounded-lg p-1.5 text-muted hover:bg-danger-50 hover:text-danger" aria-label={d.common.remove}><Trash2 size={16} /></button>
                  </div>
                ))}
                <button onClick={() => addRule(wd, null)} className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline"><Plus size={15} aria-hidden />{d.settings.addRange}</button>
              </div>
            </div>); })}
        </div>
      </section>
      {!compact && (
        <>
          <section>
            <h3 className="font-bold text-navy">{d.settings.specific}</h3><p className="text-sm text-muted">{d.settings.specificText}</p>
            <ul className="mt-3 space-y-2">{rules.filter(r => r.on_date).map(r => <li key={r.id} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-line"><span className="font-semibold tabular">{r.on_date}</span><span className="tabular">{hhmm(r.start_time)}–{hhmm(r.end_time)}</span><button onClick={() => delRule(r.id)} className="ml-auto text-muted hover:text-danger" aria-label={d.common.remove}><Trash2 size={16} /></button></li>)}</ul>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <Field label={d.settings.date} htmlFor="nd-date"><input id="nd-date" type="date" className={inputCls} value={nd.date} onChange={e => setNd({ ...nd, date: e.target.value })} /></Field>
              <TimeSel v={nd.start} on={v => setNd({ ...nd, start: v })} label={d.settings.from} /><TimeSel v={nd.end} on={v => setNd({ ...nd, end: v })} label={d.settings.to} />
              <Button variant="outline" size="sm" onClick={() => nd.date && addRule(null, nd.date, nd.start, nd.end)}>{d.common.add}</Button>
            </div>
          </section>
          <section>
            <h3 className="font-bold text-navy">{d.settings.exceptions}</h3><p className="text-sm text-muted">{d.settings.exceptionsText}</p>
            <ul className="mt-3 space-y-2">{exc.map(x => <li key={x.id} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-line"><span className="font-semibold tabular">{x.starts_on}{x.ends_on !== x.starts_on ? ` → ${x.ends_on}` : ''}</span><span className="text-muted">{x.note}</span><button onClick={() => delExc(x.id)} className="ml-auto text-muted hover:text-danger" aria-label={d.common.remove}><Trash2 size={16} /></button></li>)}</ul>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <Field label={d.settings.from} htmlFor="ex-from"><input id="ex-from" type="date" className={inputCls} value={ne.from} onChange={e => setNe({ ...ne, from: e.target.value })} /></Field>
              <Field label={d.settings.to} htmlFor="ex-to"><input id="ex-to" type="date" className={inputCls} value={ne.to} onChange={e => setNe({ ...ne, to: e.target.value })} /></Field>
              <Field label={d.common.optional} htmlFor="ex-note"><input id="ex-note" className={inputCls} placeholder={d.settings.notePh} value={ne.note} maxLength={120} onChange={e => setNe({ ...ne, note: e.target.value })} /></Field>
              <Button variant="outline" size="sm" onClick={addExc}>{d.common.add}</Button>
            </div>
          </section>
        </>
      )}
      <section className="grid gap-4 rounded-2xl border border-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={d.settings.durations} htmlFor="dur-60">
          <div className="flex gap-3">{[30, 60, 90].map(m => <label key={m} className="flex items-center gap-1.5 text-sm"><input id={`dur-${m}`} type="checkbox" className="h-4 w-4 accent-emerald-600" checked={prefs.session_durations.includes(m)} onChange={e => setPrefs(p => ({ ...p, session_durations: e.target.checked ? [...p.session_durations, m].sort((a, b) => a - b) : p.session_durations.filter(x => x !== m) }))} />{m} {d.common.minutes}</label>)}</div>
        </Field>
        <Field label={d.settings.timezone} htmlFor="tz"><select id="tz" className={inputCls} value={prefs.timezone} onChange={e => setPrefs({ ...prefs, timezone: e.target.value })}>{(TIMEZONES.includes(prefs.timezone) ? TIMEZONES : [prefs.timezone, ...TIMEZONES]).map(z => <option key={z}>{z}</option>)}</select></Field>
        <Field label={d.settings.notice} htmlFor="notice"><select id="notice" className={inputCls} value={prefs.min_notice_hours} onChange={e => setPrefs({ ...prefs, min_notice_hours: +e.target.value })}>{[1, 2, 6, 12, 24, 48].map(n => <option key={n} value={n}>{fill(d.settings.noticeHours, { n })}</option>)}</select></Field>
        {!compact && <Field label={d.settings.horizon} htmlFor="horizon"><select id="horizon" className={inputCls} value={prefs.horizon_days} onChange={e => setPrefs({ ...prefs, horizon_days: +e.target.value })}>{[7, 14, 21, 30, 60].map(n => <option key={n} value={n}>{fill(d.settings.horizonDays, { n })}</option>)}</select></Field>}
        {!compact && <Field label={d.settings.buffer} htmlFor="buffer"><select id="buffer" className={inputCls} value={prefs.buffer_minutes} onChange={e => setPrefs({ ...prefs, buffer_minutes: +e.target.value })}>{[0, 10, 15, 30].map(n => <option key={n} value={n}>{fill(d.settings.bufferMin, { n })}</option>)}</select></Field>}
        <div className="flex items-end"><Button onClick={savePrefs} disabled={savingPrefs}>{savingPrefs ? d.common.saving : d.common.save}</Button></div>
      </section>
      {!compact && <section>
        <h3 className="font-bold text-navy">{d.settings.preview}</h3>
        {preview === null ? <p className="text-sm text-muted">{d.common.loading}</p> : preview.length ? <ul className="mt-2 flex flex-wrap gap-2">{preview.map(s => <li key={s} className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-sm font-semibold text-emerald-700 tabular">{dateTime(s, prefs.timezone, lang)}</li>)}</ul> : <p className="mt-1 text-sm text-muted">{d.settings.previewEmpty}</p>}
      </section>}
    </div>
  );
}
