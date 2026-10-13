'use client';
import { useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { browserClient } from '@/lib/supabase/client';
import { useApp } from './Providers';
import { inputCls } from './ui';
import { errorText, fill, skillName } from '@/lib/format';

export type Skill = { id: number; slug: string; name_en: string; name_uz: string; category_id: number; status: string };
export type Category = { id: number; slug: string; name_en: string; name_uz: string };
type Sel = { skill_id: number; level: string };
const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const;

export default function SkillPicker({ mode, userId, skills: initialSkills, categories, initial }: { mode: 'teach' | 'learn'; userId: string; skills: Skill[]; categories: Category[]; initial: Sel[] }) {
  const { d, lang, toast } = useApp();
  const [skills, setSkills] = useState(initialSkills), [sel, setSel] = useState<Sel[]>(initial), [q, setQ] = useState(''), [cat, setCat] = useState<number | null>(null), [busy, setBusy] = useState(false);
  const table = mode === 'teach' ? 'user_teaching_skills' : 'user_learning_skills';
  const byId = useMemo(() => Object.fromEntries(skills.map(s => [s.id, s])), [skills]);
  const shown = skills.filter(s => s.status !== 'disabled' && !sel.some(x => x.skill_id === s.id) && (cat == null || s.category_id === cat)
    && (!q || s.name_en.toLowerCase().includes(q.toLowerCase()) || s.name_uz.toLowerCase().includes(q.toLowerCase()))).slice(0, 24);
  const sb = browserClient();
  async function add(id: number) {
    const level = mode === 'teach' ? 'intermediate' : 'beginner';
    const { error } = await sb.from(table).insert({ user_id: userId, skill_id: id, level });
    if (error) return toast(errorText(error, d), 'err');
    setSel(s => [...s, { skill_id: id, level }]); setQ('');
  }
  async function remove(id: number) {
    const { error } = await sb.from(table).delete().eq('user_id', userId).eq('skill_id', id);
    if (error) return toast(errorText(error, d), 'err');
    setSel(s => s.filter(x => x.skill_id !== id));
  }
  async function level(id: number, lv: string) {
    const { error } = await sb.from(table).update({ level: lv }).eq('user_id', userId).eq('skill_id', id);
    if (error) return toast(errorText(error, d), 'err');
    setSel(s => s.map(x => (x.skill_id === id ? { ...x, level: lv } : x)));
  }
  async function suggest() {
    setBusy(true);
    const { data, error } = await sb.rpc('suggest_skill', { p_name: q.trim(), p_category: cat });
    setBusy(false);
    if (error) return toast(errorText(error, d), 'err');
    const id = data as number;
    if (!byId[id]) { const { data: s } = await sb.from('skills').select('id,slug,name_en,name_uz,category_id,status').eq('id', id).single(); if (s) setSkills(x => [...x, s as Skill]); }
    await add(id);
  }
  return (
    <div className="space-y-4">
      {sel.length > 0 && (
        <ul className="space-y-2">
          {sel.map(x => (
            <li key={x.skill_id} className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald/40 bg-emerald-50 px-3 py-2">
              <span className="flex-1 font-semibold text-navy">{skillName(byId[x.skill_id], lang)}</span>
              <label className="sr-only" htmlFor={`lv-${mode}-${x.skill_id}`}>{d.onboarding.yourLevel}</label>
              <select id={`lv-${mode}-${x.skill_id}`} value={x.level} onChange={e => level(x.skill_id, e.target.value)} className="rounded-lg border border-line bg-white px-2 py-1 text-sm">
                {LEVELS.map(l => <option key={l} value={l}>{d.onboarding.levels[l]}</option>)}
              </select>
              <button onClick={() => remove(x.skill_id)} className="rounded-lg p-1 text-muted hover:bg-white hover:text-danger" aria-label={`${d.common.remove} ${skillName(byId[x.skill_id], lang)}`}><X size={16} /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative"><Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder={d.onboarding.searchSkills} aria-label={d.onboarding.searchSkills} className={`${inputCls} pl-10`} /></div>
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setCat(null)} className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${cat == null ? 'bg-navy text-white' : 'bg-white text-muted ring-1 ring-line'}`}>{d.discover.anyCategory}</button>
        {categories.map(c => <button key={c.id} onClick={() => setCat(c.id)} className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${cat === c.id ? 'bg-navy text-white' : 'bg-white text-muted ring-1 ring-line'}`}>{skillName(c, lang)}</button>)}
      </div>
      <div className="flex flex-wrap gap-2">
        {shown.map(s => <button key={s.id} onClick={() => add(s.id)} className="inline-flex items-center gap-1 rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:border-emerald hover:text-emerald-700"><Plus size={14} aria-hidden />{skillName(s, lang)}</button>)}
        {q.trim().length >= 2 && !skills.some(s => s.name_en.toLowerCase() === q.trim().toLowerCase() || s.name_uz.toLowerCase() === q.trim().toLowerCase()) && (
          <button onClick={suggest} disabled={busy} className="inline-flex items-center gap-1 rounded-xl border border-dashed border-emerald bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700"><Plus size={14} aria-hidden />{fill(d.onboarding.suggest, { name: q.trim() })}</button>
        )}
      </div>
      {q.trim().length >= 2 && <p className="text-xs text-muted">{d.onboarding.suggestHint}</p>}
    </div>
  );
}
