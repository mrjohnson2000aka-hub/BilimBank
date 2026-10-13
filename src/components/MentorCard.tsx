import Link from 'next/link';
import { CalendarClock, Languages } from 'lucide-react';
import { Avatar, Badge, Stars, btn } from './ui';
import type { Dict } from '@/lib/i18n/en';
import { dateTime, fill, skillName, type Lang } from '@/lib/format';

export type MentorRow = { user_id: string; username: string; display_name: string; avatar_url: string | null; bio: string | null; languages: string[]; durations: number[];
  rating: number | null; review_count: number; skill_id: number; skill_slug: string; skill_en: string; skill_uz: string; level: string; next_slot: string };

export default function MentorCard({ m, d, lang, tz, reason }: { m: MentorRow; d: Dict; lang: Lang; tz: string; reason?: React.ReactNode }) {
  const skill = skillName({ name_en: m.skill_en, name_uz: m.skill_uz }, lang);
  return (
    <article className="flex flex-col rounded-2xl border border-line bg-white p-5 shadow-card">
      <div className="flex items-start gap-3">
        <Avatar name={m.display_name} url={m.avatar_url} size={48} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-bold text-navy">{m.display_name}</h3>
          <p className="text-sm text-ink">{skill} <Badge tone="ok" className="ml-1 align-middle">{d.onboarding.levels[m.level as keyof Dict['onboarding']['levels']] || m.level}</Badge></p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
            {m.review_count > 0 ? <><Stars value={m.rating} /> <span className="font-semibold text-ink">{Number(m.rating).toFixed(1)}</span> · {m.review_count === 1 ? d.common.reviews1 : fill(d.common.reviewsN, { n: m.review_count })}</> : <Badge>{d.common.newMentor}</Badge>}
          </p>
        </div>
      </div>
      {reason && <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{reason}</div>}
      {m.bio && <p className="mt-3 line-clamp-2 text-sm text-muted">{m.bio}</p>}
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex items-center gap-2"><CalendarClock size={16} className="flex-none text-emerald" aria-hidden /><dt className="sr-only">{d.discover.nextFree}</dt><dd><span className="text-muted">{d.discover.nextFree}:</span> <span className="font-semibold tabular">{dateTime(m.next_slot, tz, lang)}</span></dd></div>
        <div className="flex items-center gap-2"><Languages size={16} className="flex-none text-emerald" aria-hidden /><dt className="sr-only">{d.profile.languages}</dt><dd className="text-muted">{m.languages.length ? m.languages.join(', ') : '—'} · {m.durations.map(x => `${x} ${d.common.minutes}`).join(' / ')}</dd></div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2 pt-1">
        <Link href={`/u/${m.username}`} className={btn('outline', 'sm', 'flex-1')}>{d.common.viewProfile}</Link>
        <Link href={`/u/${m.username}?skill=${m.skill_id}#book`} className={btn('primary', 'sm', 'flex-1')}>{d.common.viewSlots}</Link>
      </div>
    </article>
  );
}
