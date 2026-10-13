import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays, List } from 'lucide-react';
import { Avatar, Badge, EmptyState, LinkButton, PageHeader } from '@/components/ui';
import { currentUser } from '@/lib/session';
import { getDict, getLang, getViewerTz } from '@/lib/i18n';
import { credits, dateTime, displayStatus, fill, skillName, statusTone, timeOnly } from '@/lib/format';
import { TAB_OF, needsAction, peopleById, type BookingRow } from '@/lib/bookings';
import { weekdayNames } from '@/lib/weekdays';

export const metadata: Metadata = { title: 'My sessions' };
export const dynamic = 'force-dynamic';
const TABS = ['upcoming', 'pending', 'awaiting', 'completed', 'cancelled'] as const;

export default async function Sessions({ searchParams: sp }: { searchParams: { tab?: string; view?: string; week?: string } }) {
  const lang = getLang(), d = getDict(lang);
  const { sb, user, profile } = await currentUser();
  const tz = getViewerTz(profile?.timezone);
  await sb.rpc('sweep');
  const { data } = await sb.from('bookings').select('*, skills(name_en,name_uz,slug)').order('start_at', { ascending: true }).limit(500);
  const all = (data || []) as BookingRow[];
  const people = await peopleById(sb, all.flatMap(b => [b.learner_id, b.teacher_id]));
  const me = user!.id;
  const tab = (TABS as readonly string[]).includes(sp.tab || '') ? sp.tab! : 'upcoming';
  const view = sp.view === 'calendar' ? 'calendar' : 'list';
  const counts = Object.fromEntries(TABS.map(t => [t, all.filter(b => TAB_OF[displayStatus(b)] === t && needsAction(b, me)).length]));
  let list = all.filter(b => TAB_OF[displayStatus(b)] === tab);
  if (tab === 'completed' || tab === 'cancelled') list = list.reverse();
  const href = (o: Record<string, string>) => '/sessions?' + new URLSearchParams({ tab, view, ...o }).toString();

  const Row = ({ b }: { b: BookingRow }) => {
    const other = people[b.learner_id === me ? b.teacher_id : b.learner_id], st = displayStatus(b), act = needsAction(b, me);
    return (
      <li><Link href={`/sessions/${b.id}`} className={`flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-card transition-colors hover:border-emerald sm:flex-row sm:items-center ${act ? 'border-emerald/60' : 'border-line'}`}>
        <Avatar name={other?.display_name || d.common.deletedUser} url={other?.avatar_url} size={44} />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-navy">{skillName(b.skills, lang)}</p>
          <p className="text-sm text-muted">{fill(b.learner_id === me ? d.sessions.youLearn : d.sessions.youTeach, { name: other?.display_name || d.common.deletedUser })}</p>
        </div>
        <div className="text-sm sm:text-right"><p className="font-semibold tabular text-ink">{dateTime(b.start_at, tz, lang)}</p><p className="text-muted">{b.duration_min} {d.common.minutes} · {credits(b.credits, d, lang)}</p></div>
        <div className="flex flex-wrap gap-1.5 sm:w-44 sm:justify-end"><Badge tone={statusTone(st)}>{d.status[st as keyof typeof d.status]}</Badge>{act && <Badge tone="navy">{d.sessions.needsYou}</Badge>}</div>
      </Link></li>
    );
  };

  // week view
  const off = Number(sp.week) || 0;
  const now = new Date(); const dow = (now.getDay() + 6) % 7;
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow + off * 7);
  const days = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i));
  const dayKey = (x: Date | string) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(x));
  const localKey = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  const live = all.filter(b => !['cancelled', 'declined', 'expired', 'void'].includes(b.status));
  const names = weekdayNames(lang, 'short');

  return (
    <div className="wrap py-10">
      <PageHeader title={d.sessions.title} action={<div className="flex rounded-xl border border-line bg-white p-1 text-sm font-semibold">
        <Link href={href({ view: 'list' })} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 ${view === 'list' ? 'bg-navy text-white' : 'text-muted'}`}><List size={15} aria-hidden />{d.sessions.list}</Link>
        <Link href={href({ view: 'calendar' })} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 ${view === 'calendar' ? 'bg-navy text-white' : 'text-muted'}`}><CalendarDays size={15} aria-hidden />{d.sessions.calendar}</Link></div>} />
      {view === 'list' ? (
        <>
          <nav className="-mx-4 mb-5 flex gap-1 overflow-x-auto px-4" aria-label={d.sessions.title}>
            {TABS.map(t => <Link key={t} href={href({ tab: t })} aria-current={t === tab ? 'page' : undefined} className={`flex-none rounded-xl px-3.5 py-2 text-sm font-semibold ${t === tab ? 'bg-navy text-white' : 'bg-white text-muted ring-1 ring-line hover:text-navy'}`}>{d.sessions.tabs[t]}{counts[t] > 0 && <span className="ml-1.5 rounded-full bg-emerald px-1.5 text-xs text-white">{counts[t]}</span>}</Link>)}
          </nav>
          {list.length ? <ul className="space-y-3">{list.map(b => <Row key={b.id} b={b} />)}</ul> : <EmptyState title={d.sessions.empty[tab as keyof typeof d.sessions.empty]} action={tab === 'upcoming' ? <LinkButton href="/discover">{d.nav.explore}</LinkButton> : undefined} />}
        </>
      ) : (
        <div>
          <div className="mb-3 flex items-center justify-between text-sm font-semibold"><Link href={href({ week: String(off - 1) })} className="text-emerald-700">← {d.sessions.prevWeek}</Link><Link href={href({ week: '0' })} className="text-navy">{d.sessions.thisWeek}</Link><Link href={href({ week: String(off + 1) })} className="text-emerald-700">{d.sessions.nextWeek} →</Link></div>
          <div className="grid gap-2 md:grid-cols-7">
            {days.map((day, i) => { const items = live.filter(b => dayKey(b.start_at) === localKey(day)); return (
              <div key={i} className={`min-h-[120px] rounded-xl border bg-white p-2 ${localKey(day) === localKey(now) ? 'border-emerald' : 'border-line'}`}>
                <p className="mb-2 text-xs font-bold text-muted">{names[i]} {day.getDate()}</p>
                <ul className="space-y-1.5">{items.map(b => <li key={b.id}><Link href={`/sessions/${b.id}`} className="block rounded-lg bg-emerald-50 px-2 py-1.5 text-xs hover:bg-emerald-100"><span className="font-bold tabular text-emerald-700">{timeOnly(b.start_at, tz, lang)}</span><span className="block truncate text-ink">{skillName(b.skills, lang)}</span></Link></li>)}</ul>
              </div>); })}
          </div>
          {live.filter(b => days.some(x => localKey(x) === dayKey(b.start_at))).length === 0 && <p className="mt-4 text-sm text-muted">{d.sessions.noWeek}</p>}
        </div>
      )}
    </div>
  );
}
