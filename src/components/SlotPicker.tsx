'use client';
import { useEffect, useMemo, useState } from 'react';
import { browserClient } from '@/lib/supabase/client';
import { useApp } from './Providers';
import { Skeleton } from './ui';
import { dayLabel, fill, timeOnly } from '@/lib/format';

export default function SlotPicker({ teacherId, duration, value, onPick }: { teacherId: string; duration: number; value: string | null; onPick: (s: string) => void }) {
  const { d, lang, tz } = useApp();
  const [slots, setSlots] = useState<string[] | null>(null), [day, setDay] = useState<string | null>(null);
  useEffect(() => {
    let live = true; setSlots(null);
    browserClient().rpc('open_slots', { p_teacher: teacherId, p_from: new Date().toISOString(), p_to: new Date(Date.now() + 30 * 864e5).toISOString(), p_duration: duration })
      .then(({ data }) => { if (live) setSlots((data || []) as string[]); });
    return () => { live = false; };
  }, [teacherId, duration]);
  const key = (s: string) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(s));
  const byDay = useMemo(() => { const m = new Map<string, string[]>(); (slots || []).forEach(s => { const k = key(s); m.set(k, [...(m.get(k) || []), s]); }); return m; }, [slots]); // eslint-disable-line react-hooks/exhaustive-deps
  const days = Array.from(byDay.keys());
  useEffect(() => { if (days.length && (!day || !byDay.has(day))) setDay(days[0]); }, [days.join(), day]); // eslint-disable-line react-hooks/exhaustive-deps
  if (slots === null) return <div className="space-y-2"><Skeleton className="h-12" /><Skeleton className="h-24" /></div>;
  if (!slots.length) return <p className="rounded-xl bg-canvas p-4 text-sm text-muted">{d.profile.noSlotsAtAll}</p>;
  return (
    <div>
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2" role="tablist" aria-label={d.profile.pickDay}>
        {days.map(k => { const first = byDay.get(k)![0]; return (
          <button key={k} role="tab" aria-selected={day === k} onClick={() => setDay(k)} className={`flex-none rounded-xl px-3 py-2 text-sm font-semibold ${day === k ? 'bg-navy text-white' : 'bg-canvas text-ink ring-1 ring-line hover:ring-navy-100'}`}>
            {dayLabel(first, tz, lang)}<span className={`ml-1.5 text-xs ${day === k ? 'text-navy-100' : 'text-muted'}`}>{byDay.get(k)!.length}</span></button>); })}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {(day && byDay.get(day) || []).map(s => <button key={s} onClick={() => onPick(s)} aria-pressed={value === s} className={`rounded-xl py-2.5 text-sm font-bold tabular ${value === s ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>{timeOnly(s, tz, lang)}</button>)}
      </div>
      <p className="mt-2 text-xs text-muted">{fill(d.profile.timesIn, { tz })}</p>
    </div>
  );
}
