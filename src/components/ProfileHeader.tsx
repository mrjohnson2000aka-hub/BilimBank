import { Clock, GraduationCap, Languages, Star, Video } from 'lucide-react';
import { Avatar, Badge, Stars } from './ui';
import type { Dict } from '@/lib/i18n/en';
import { dateOnly, fill, num, skillName, type Lang } from '@/lib/format';

export type PublicProfile = { id: string; username: string; display_name: string; avatar_url: string | null; bio: string | null; school: string | null; education_level: string | null;
  country: string | null; timezone: string; languages: string[]; session_durations: number[]; created_at: string; rating: number | null; review_count: number; completed_sessions: number; hours_taught: number; hours_learned: number };
export type SkillLevel = { skill_id: number; level: string; skills: { name_en: string; name_uz: string; slug: string } | null };

export default function ProfileHeader({ p, teach, learn, d, lang, tz }: { p: PublicProfile; teach: SkillLevel[]; learn: SkillLevel[]; d: Dict; lang: Lang; tz: string }) {
  const lv = (l: string) => d.onboarding.levels[l as keyof Dict['onboarding']['levels']] || l;
  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <Avatar name={p.display_name} url={p.avatar_url} size={88} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-navy">{p.display_name}</h1>
          <p className="text-sm text-muted">@{p.username}{p.country ? ` · ${p.country}` : ''}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {p.review_count > 0 ? <span className="flex items-center gap-1.5"><Stars value={p.rating} /><b>{Number(p.rating).toFixed(1)}</b><span className="text-muted">({p.review_count === 1 ? d.common.reviews1 : fill(d.common.reviewsN, { n: p.review_count })})</span></span> : <Badge>{d.common.newMentor}</Badge>}
            {(p.school || p.education_level) && <span className="flex items-center gap-1.5 text-muted"><GraduationCap size={15} aria-hidden />{[p.school, p.education_level].filter(Boolean).join(' · ')}</span>}
            <span className="flex items-center gap-1.5 text-muted"><Video size={15} aria-hidden />{d.profile.online}</span>
          </div>
          {p.bio && <p className="mt-3 max-w-2xl whitespace-pre-line text-ink">{p.bio}</p>}
        </div>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[[Star, d.profile.completed, p.completed_sessions], [Clock, d.profile.hoursTaught, num(p.hours_taught)], [Clock, d.profile.hoursLearned, num(p.hours_learned)], [Languages, d.profile.languages, p.languages.join(', ') || '—']].map(([I, l, v], i) => {
          const Icon = I as typeof Star; return <div key={i} className="rounded-xl bg-canvas p-3"><dt className="flex items-center gap-1.5 text-xs font-semibold text-muted"><Icon size={13} aria-hidden />{l as string}</dt><dd className="mt-1 truncate font-bold text-navy tabular">{v as string}</dd></div>;
        })}
      </dl>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section><h2 className="text-sm font-bold uppercase tracking-wider text-muted">{d.profile.teaches}</h2>
          <ul className="mt-2 flex flex-wrap gap-2">{teach.length ? teach.map(t => <li key={t.skill_id} className="rounded-xl bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">{skillName(t.skills, lang)} <span className="font-medium text-emerald-700/80">· {lv(t.level)}</span></li>) : <li className="text-sm text-muted">{d.common.none}</li>}</ul></section>
        <section><h2 className="text-sm font-bold uppercase tracking-wider text-muted">{d.profile.wantsToLearn}</h2>
          <ul className="mt-2 flex flex-wrap gap-2">{learn.length ? learn.map(t => <li key={t.skill_id} className="rounded-xl bg-navy-50 px-3 py-1.5 text-sm font-semibold text-navy">{skillName(t.skills, lang)}</li>) : <li className="text-sm text-muted">{d.common.none}</li>}</ul></section>
      </div>
      <p className="mt-6 text-xs text-muted">{fill(d.profile.memberSince, { date: dateOnly(p.created_at, tz, lang) })}</p>
    </div>
  );
}
