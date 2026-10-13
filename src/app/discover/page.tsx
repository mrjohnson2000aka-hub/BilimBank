import type { Metadata } from 'next';
import Link from 'next/link';
import { SearchX, SlidersHorizontal, Sparkles } from 'lucide-react';
import { EmptyState, PageHeader, btn, inputCls } from '@/components/ui';
import MentorCard, { type MentorRow } from '@/components/MentorCard';
import { currentUser } from '@/lib/session';
import { getDict, getLang, getViewerTz } from '@/lib/i18n';
import { fill, skillName, type Lang } from '@/lib/format';
import type { Dict } from '@/lib/i18n/en';

export const metadata: Metadata = { title: 'Explore skills' };
export const dynamic = 'force-dynamic';
type SP = Record<string, string | undefined>;
const TOD: Record<string, [number, number]> = { morning: [6, 12], afternoon: [12, 17], evening: [17, 23] };

export default async function Discover({ searchParams: sp }: { searchParams: SP }) {
  const lang = getLang(), d = getDict(lang);
  const { sb, user, profile } = await currentUser();
  const tz = getViewerTz(profile?.timezone);
  const tod = sp.time && TOD[sp.time];
  const args = { p_query: sp.q || null, p_category: sp.category || null, p_language: sp.lang || null, p_level: sp.level || null, p_min_rating: sp.rating ? Number(sp.rating) : null,
    p_duration: [30, 60, 90].includes(Number(sp.duration)) ? Number(sp.duration) : 60, p_days: [7, 14, 30].includes(Number(sp.days)) ? Number(sp.days) : 7,
    p_date: sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : null, p_from_hour: tod ? tod[0] : null, p_to_hour: tod ? tod[1] : null, p_tz: tz, p_limit: 60 };
  const [{ data: rows, error }, { data: cats }, matches] = await Promise.all([
    sb.rpc('search_mentors', args), sb.from('skill_categories').select('slug,name_en,name_uz').eq('active', true).order('sort'),
    user && profile?.onboarded ? sb.rpc('best_matches', { p_limit: 6 }) : Promise.resolve({ data: null })
  ]);
  const list = (rows || []) as MentorRow[];
  const filtered = Object.entries(sp).some(([k, v]) => v && k !== 'skill');
  const best = (matches.data || []) as Match[];
  const langs = Array.from(new Set(['English', 'Uzbek', 'Russian'].concat(list.flatMap(m => m.languages))));
  const sel = (name: string, value: string | undefined, opts: [string, string][], label: string) => (
    <label className="block text-sm"><span className="mb-1 block font-semibold text-ink">{label}</span>
      <select name={name} defaultValue={value || ''} className={inputCls}>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
  );
  return (
    <div className="wrap py-10">
      <PageHeader title={d.discover.title} text={d.discover.subtitle} />
      <form method="get" className="rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5" role="search">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex-1"><span className="sr-only">{d.common.search}</span><input name="q" defaultValue={sp.q || ''} placeholder={d.discover.searchPh} className={inputCls} /></label>
          <button className={btn('primary', 'md')}>{d.discover.apply}</button>
        </div>
        <details className="group mt-3" open={filtered}>
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-navy"><SlidersHorizontal size={15} aria-hidden />{d.discover.filters}</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {sel('category', sp.category, [['', d.discover.anyCategory], ...(cats || []).map(c => [c.slug, skillName(c, lang)] as [string, string])], d.discover.category)}
            {sel('lang', sp.lang, [['', d.discover.anyLanguage], ...langs.map(l => [l, l] as [string, string])], d.discover.language)}
            {sel('level', sp.level, [['', d.discover.anyLevel], ...(['beginner', 'intermediate', 'advanced', 'expert'] as const).map(l => [l, d.onboarding.levels[l]] as [string, string])], d.discover.level)}
            {sel('rating', sp.rating, [['', d.discover.anyRating], ['4.5', '4.5+'], ['4', '4+'], ['3', '3+']], d.discover.minRating)}
            {sel('duration', sp.duration, [['60', `60 ${d.common.minutes}`], ['30', `30 ${d.common.minutes}`], ['90', `90 ${d.common.minutes}`]], d.discover.duration)}
            {sel('days', sp.days, [['7', d.discover.next7], ['14', d.discover.next14], ['30', d.discover.next30]], d.discover.when)}
            <label className="block text-sm"><span className="mb-1 block font-semibold text-ink">{d.discover.onDate}</span><input type="date" name="date" defaultValue={sp.date || ''} className={inputCls} /></label>
            {sel('time', sp.time, [['', d.discover.anyTime], ['morning', d.discover.morning], ['afternoon', d.discover.afternoon], ['evening', d.discover.evening]], d.discover.timeOfDay)}
          </div>
          <Link href="/discover" className="mt-3 inline-block text-sm font-semibold text-muted hover:text-navy">{d.discover.reset}</Link>
        </details>
      </form>

      {!filtered && (
        <section id="matches" className="mt-10 scroll-mt-20">
          <h2 className="flex items-center gap-2 text-xl font-bold text-navy"><Sparkles size={20} className="text-emerald" aria-hidden />{d.discover.bestTitle}</h2>
          <p className="mt-1 text-sm text-muted">{d.discover.bestText}</p>
          <div className="mt-4">{!user ? <p className="rounded-xl bg-white p-4 text-sm text-muted ring-1 ring-line"><Link href="/auth/sign-in?next=/discover" className="font-semibold text-emerald-700">{d.common.signIn}</Link> · {d.discover.signInForMatches}</p>
            : best.length ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{best.map(m => <MatchCard key={m.user_id} m={m} d={d} lang={lang} />)}</div>
              : <p className="rounded-xl bg-white p-4 text-sm text-muted ring-1 ring-line">{d.discover.bestEmpty}</p>}</div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-bold text-navy">{list.length === 1 ? d.discover.results1 : fill(d.discover.results, { n: list.length })}</h2>
        <p className="text-xs text-muted">{fill(d.profile.timesIn, { tz })}</p>
        <div className="mt-4">
          {error ? <EmptyState title={d.common.somethingWrong} /> : list.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{list.map(m => <MentorCard key={m.user_id + m.skill_id} m={m} d={d} lang={lang} tz={tz} />)}</div>
            : <EmptyState icon={<SearchX size={28} />} title={d.discover.noResults} text={d.discover.noResultsText} action={<Link href="/discover" className={btn('outline', 'sm')}>{d.discover.reset}</Link>} />}
        </div>
      </section>
    </div>
  );
}

type Match = { user_id: string; username: string; display_name: string; avatar_url: string | null; rating: number | null; review_count: number; they_teach_you_want: { en: string; uz: string }[]; they_want_you_teach: { en: string; uz: string }[]; overlap_hours: number; shared_languages: string[]; past_sessions: number; next_slot: string | null };
function MatchCard({ m, d, lang }: { m: Match; d: Dict; lang: Lang }) {
  const nm = (x: { en: string; uz: string }[]) => x.map(s => (lang === 'uz' ? s.uz : s.en)).join(', ');
  const reason = m.they_want_you_teach.length ? fill(d.discover.reasonBoth, { mine: nm(m.they_want_you_teach), name: m.display_name, theirs: nm(m.they_teach_you_want) }) : fill(d.discover.reasonTeach, { name: m.display_name, theirs: nm(m.they_teach_you_want) });
  return (
    <article className="flex flex-col rounded-2xl border border-emerald/40 bg-white p-5 shadow-card">
      <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 font-bold text-emerald-700" aria-hidden>{m.display_name.slice(0, 1).toUpperCase()}</span>
        <div className="min-w-0"><h3 className="truncate font-bold text-navy">{m.display_name}</h3><p className="text-xs text-muted">{m.review_count ? `★ ${Number(m.rating).toFixed(1)} · ${m.review_count === 1 ? d.common.reviews1 : fill(d.common.reviewsN, { n: m.review_count })}` : d.common.newMentor}</p></div></div>
      <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{reason}</p>
      <ul className="mt-3 space-y-1 text-xs text-muted">
        {m.overlap_hours > 0 && <li>• {fill(d.discover.overlapH, { n: m.overlap_hours * 1 })}</li>}
        {m.shared_languages.length > 0 && <li>• {fill(d.discover.sharedLang, { langs: m.shared_languages.join(', ') })}</li>}
        {m.past_sessions > 0 && <li>• {fill(d.discover.past, { n: m.past_sessions })}</li>}
      </ul>
      <div className="mt-auto flex gap-2 pt-4"><Link href={`/u/${m.username}`} className={btn('outline', 'sm', 'flex-1')}>{d.common.viewProfile}</Link>{m.next_slot && <Link href={`/u/${m.username}#book`} className={btn('primary', 'sm', 'flex-1')}>{d.common.viewSlots}</Link>}</div>
    </article>
  );
}
