import Link from 'next/link';
import { ArrowLeftRight, BookOpen, Clock, Coins, GraduationCap, HeartHandshake, MessageCircle, ShieldCheck, Sparkles, UserPlus, Users } from 'lucide-react';
import { Avatar, Badge, Card, EmptyState, LinkButton, Stars } from '@/components/ui';
import MentorCard, { type MentorRow } from '@/components/MentorCard';
import { currentUser } from '@/lib/session';
import { getDict, getLang, getViewerTz } from '@/lib/i18n';
import { WEEKDAYS_SHORT, fill, num, skillName, dateOnly } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const lang = getLang(), d = getDict(lang);
  const { sb, user, profile } = await currentUser();
  const tz = getViewerTz(profile?.timezone);
  const [{ data: stats }, { data: mentors }, { data: reviews }, { data: cats }] = await Promise.all([
    sb.rpc('public_stats'),
    sb.rpc('search_mentors', { p_days: 7, p_tz: tz, p_limit: 12 }),
    sb.from('reviews').select('rating, body, teacher_id, created_at').eq('hidden', false).gte('rating', 4).not('body', 'is', null).order('created_at', { ascending: false }).limit(3),
    sb.from('skill_categories').select('slug,name_en,name_uz').eq('active', true).order('sort')
  ]);
  const s = (stats || {}) as { active_users?: number; completed_hours?: number; completed_sessions?: number; avg_rating?: number | null; popular_skills?: { slug: string; name_en: string; name_uz: string; teachers: number }[]; recent?: { name_en: string; name_uz: string; duration_min: number; end_at: string }[] };
  const featured = ((mentors || []) as MentorRow[]).filter(m => m.review_count > 0).sort((a, b) => Number(b.rating) - Number(a.rating)).concat(((mentors || []) as MentorRow[]).filter(m => m.review_count === 0)).slice(0, 3);
  const testimonials = (reviews || []) as { rating: number; body: string; teacher_id: string }[];
  let tNames: Record<string, string> = {};
  if (testimonials.length) { const { data } = await sb.from('public_profiles').select('id,display_name').in('id', testimonials.map(r => r.teacher_id)); tNames = Object.fromEntries((data || []).map(p => [p.id, p.display_name])); }
  const popular = s.popular_skills?.length ? s.popular_skills : [];
  const stepIcons = [UserPlus, BookOpen, Coins, GraduationCap];
  const joinHref = user ? '/discover' : '/auth/sign-up';

  return (
    <>
      {/* hero */}
      <section className="overflow-hidden bg-white">
        <div className="wrap grid items-center gap-12 py-14 lg:grid-cols-[1.1fr_.9fr] lg:py-20">
          <div>
            <Badge tone="ok" className="mb-5 px-3 py-1 text-sm"><Sparkles size={14} aria-hidden /> {d.home.oneCredit}</Badge>
            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-navy sm:text-5xl lg:text-[56px]">{d.home.heroTitle}</h1>
            <p className="mt-5 max-w-xl text-lg text-muted">{d.home.heroText}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href={joinHref} size="lg">{d.home.ctaPrimary}</LinkButton>
              <LinkButton href="/discover" size="lg" variant="outline">{d.home.ctaSecondary}</LinkButton>
            </div>
          </div>
          <HeroVisual d={d} lang={lang} />
        </div>
      </section>

      {/* how it works */}
      <section id="how" className="wrap scroll-mt-20 py-16">
        <h2 className="text-3xl font-extrabold tracking-tight text-navy">{d.home.howTitle}</h2>
        <p className="mt-2 text-muted">{d.home.howText}</p>
        <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {d.home.steps.map(([title, text], i) => { const I = stepIcons[i]; return (
            <li key={title} className="relative rounded-2xl border border-line bg-white p-6 shadow-card">
              <div className="mb-4 flex items-center justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><I size={22} aria-hidden /></span><span className="text-sm font-bold text-muted">0{i + 1}</span></div>
              <h3 className="font-bold text-navy">{title}</h3><p className="mt-1.5 text-sm text-muted">{text}</p>
            </li>); })}
        </ol>
      </section>

      {/* stats from real records */}
      <section className="bg-navy text-white">
        <div className="wrap grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {[[s.active_users ?? 0, d.home.statActive, d.home.statActiveDef], [num(s.completed_hours ?? 0), d.home.statHours, d.home.statHoursDef], [s.completed_sessions ?? 0, d.home.statSessions, ''],
            [s.avg_rating ? Number(s.avg_rating).toFixed(1) + ' / 5' : '—', d.home.statRating, s.avg_rating ? '' : d.home.statRatingPending]].map(([n, l, def]) => (
            <div key={String(l)}><p className="text-4xl font-extrabold tabular">{n}</p><p className="mt-1 font-semibold">{l}</p>{def && <p className="text-sm text-navy-100/75">{def}</p>}</div>
          ))}
        </div>
      </section>

      {/* popular skills */}
      <section className="wrap py-16">
        <h2 className="text-3xl font-extrabold tracking-tight text-navy">{d.home.popularTitle}</h2>
        <p className="mt-2 text-muted">{d.home.popularText}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {popular.map(p => <Link key={p.slug} href={`/skills/${p.slug}`} className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy shadow-card hover:border-emerald">{skillName(p, lang)} <span className="ml-1 text-muted">· {(p.teachers === 1 ? d.skills.teachers1 : fill(d.skills.teachersN, { n: p.teachers }))}</span></Link>)}
          {(cats || []).map(c => <Link key={c.slug} href={`/discover?category=${c.slug}`} className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:border-emerald">{skillName(c, lang)}</Link>)}
        </div>
      </section>

      {/* featured mentors (real, with open times) */}
      <section className="bg-white py-16">
        <div className="wrap">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-3xl font-extrabold tracking-tight text-navy">{d.home.featuredTitle}</h2><p className="mt-2 text-muted">{d.home.featuredText}</p></div><LinkButton href="/discover" variant="outline">{d.common.seeAll}</LinkButton></div>
          <div className="mt-8">
            {featured.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{featured.map(m => <MentorCard key={m.user_id} m={m} d={d} lang={lang} tz={tz} />)}</div>
              : <EmptyState icon={<Users size={28} />} title={d.home.featuredEmpty} action={<LinkButton href={joinHref}>{d.common.join}</LinkButton>} />}
          </div>
        </div>
      </section>

      {/* matching */}
      <section className="wrap grid items-center gap-10 py-16 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-navy">{d.home.matchTitle}</h2>
          <p className="mt-3 text-muted">{d.home.matchText}</p>
          <LinkButton href={user ? '/discover#matches' : '/auth/sign-up'} className="mt-6">{d.home.matchCta}</LinkButton>
        </div>
        <Card className="p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">{d.common.example}</p>
          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
            <div className="rounded-xl bg-navy-50 p-4"><p className="text-xs text-muted">{d.profile.teaches}</p><p className="mt-1 font-bold text-navy">English</p></div>
            <ArrowLeftRight className="text-emerald" aria-hidden />
            <div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs text-muted">{d.profile.wantsToLearn}</p><p className="mt-1 font-bold text-emerald-700">English</p></div>
          </div>
          <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{fill(d.discover.reasonBoth, { mine: 'English', name: d.home.exampleName, theirs: 'Python' })}</p>
        </Card>
      </section>

      {/* testimonials only from real published reviews */}
      {testimonials.length > 0 && (
        <section className="bg-white py-16"><div className="wrap">
          <h2 className="text-3xl font-extrabold tracking-tight text-navy">{d.home.testimonialsTitle}</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">{testimonials.map((r, i) => (
            <figure key={i} className="rounded-2xl border border-line bg-canvas p-6"><Stars value={r.rating} /><blockquote className="mt-3 text-ink">“{r.body}”</blockquote><figcaption className="mt-3 text-sm text-muted">{fill(d.home.testimonialFrom, { name: tNames[r.teacher_id] || '' })}</figcaption></figure>
          ))}</div>
        </div></section>
      )}

      {(s.recent?.length ?? 0) > 0 && (
        <section className="wrap py-10"><h2 className="text-lg font-bold text-navy">{d.home.recentTitle}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">{s.recent!.map((r, i) => <li key={i} className="rounded-lg bg-white px-3 py-2 text-sm text-ink shadow-card"><Clock size={14} className="mr-1 inline text-emerald" aria-hidden />{fill(d.home.recentItem, { skill: skillName(r, lang), min: r.duration_min })} · <span className="text-muted">{dateOnly(r.end_at, tz, lang)}</span></li>)}</ul>
        </section>
      )}

      {/* FAQ + safety */}
      <section className="wrap grid gap-12 py-16 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-navy">{d.home.faqTitle}</h2>
          <div className="mt-6 divide-y divide-line rounded-2xl border border-line bg-white">
            {d.home.faq.map(([q, a]) => <details key={q} className="group p-5"><summary className="cursor-pointer list-none font-semibold text-navy marker:hidden">{q}<span className="float-right text-emerald group-open:rotate-45">+</span></summary><p className="mt-2 text-sm text-muted">{a}</p></details>)}
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-navy">{d.home.safetyTitle}</h2>
          <ul className="mt-6 space-y-4">{d.home.safety.map(([h, t], i) => { const I = [HeartHandshake, MessageCircle, Users, ShieldCheck][i]; return <li key={h} className="flex gap-4 rounded-2xl border border-line bg-white p-5"><I className="mt-0.5 flex-none text-emerald" aria-hidden /><div><p className="font-semibold text-navy">{h}</p><p className="mt-1 text-sm text-muted">{t}</p></div></li>; })}</ul>
          <Link href="/help#guidelines" className="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:underline">{d.footer.guidelines} →</Link>
        </div>
      </section>

      <section className="wrap pb-4">
        <div className="rounded-3xl bg-navy px-6 py-12 text-center text-white sm:px-12">
          <h2 className="text-3xl font-extrabold tracking-tight">{d.home.finalTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-navy-100">{d.home.finalText}</p>
          <LinkButton href={joinHref} size="lg" className="mt-7">{d.home.ctaPrimary}</LinkButton>
        </div>
      </section>
    </>
  );
}

function HeroVisual({ d, lang }: { d: ReturnType<typeof getDict>; lang: 'en' | 'uz' }) {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-label={d.home.exampleLabel}>
      <div className="absolute -left-6 -top-6 h-40 w-40 rounded-full bg-emerald-50" aria-hidden />
      <Card className="relative p-5">
        <div className="flex items-center justify-between"><Badge>{d.home.exampleLabel}</Badge><Badge tone="ok">{d.common.newMentor}</Badge></div>
        <div className="mt-4 flex items-center gap-3"><Avatar name="S M" size={52} /><div><p className="font-bold text-navy">{d.home.exampleName}</p><p className="text-sm text-muted">{d.home.exampleBio}</p></div></div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">{[[1, '17:00'], [3, '18:00'], [5, '10:00']].map(([w, h]) => `${WEEKDAYS_SHORT[lang][w as number]} ${h}`).map(x => <span key={x} className="rounded-lg border border-emerald/40 bg-emerald-50 py-2 font-semibold text-emerald-700">{x}</span>)}</div>
      </Card>
      <div className="relative -mt-3 ml-8 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-pop">
        <div className="text-center"><Avatar name="A" size={40} className="mx-auto" /><p className="mt-2 text-xs font-semibold text-navy">{d.home.exchangeA}</p></div>
        <ArrowLeftRight className="text-emerald" aria-hidden />
        <div className="text-center"><Avatar name="B" size={40} className="mx-auto" /><p className="mt-2 text-xs font-semibold text-navy">{d.home.exchangeB}</p></div>
      </div>
      <div className="relative -mt-2 mr-6 flex items-center gap-3 justify-self-end rounded-2xl bg-navy px-4 py-3 text-white shadow-pop sm:absolute sm:-right-4 sm:-top-6 sm:mt-0">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald text-lg font-extrabold">1</span>
        <div><p className="text-sm font-bold">{d.home.oneCredit}</p><p className="text-xs text-navy-100">30 min = 0.5 · 90 min = 1.5</p></div>
      </div>
    </div>
  );
}
