import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckSquare, Clock } from 'lucide-react';
import { Avatar, Badge, Card, EmptyState, LinkButton } from '@/components/ui';
import SessionActions from './SessionActions';
import { ReportButton } from '@/components/ProfileActions';
import { currentUser } from '@/lib/session';
import { getDict, getLang, getViewerTz } from '@/lib/i18n';
import { credits, dateTime, displayStatus, fill, skillName, statusTone, timeOnly } from '@/lib/format';
import { peopleById, type BookingRow } from '@/lib/bookings';
import { integrationStatus } from '@/lib/env';

export const metadata: Metadata = { title: 'Session' };
export const dynamic = 'force-dynamic';

export default async function SessionPage({ params }: { params: { id: string } }) {
  const lang = getLang(), d = getDict(lang);
  const { sb, user, profile } = await currentUser();
  const tz = getViewerTz(profile?.timezone);
  await sb.rpc('sweep');
  const { data: b } = await sb.from('bookings').select('*, skills(name_en,name_uz,slug)').eq('id', params.id).maybeSingle();
  if (!b) return <div className="wrap py-16"><EmptyState title={d.sessions.notFound} action={<LinkButton href="/sessions">{d.sessions.title}</LinkButton>} /></div>;
  const bk = b as BookingRow;
  const me = user!.id, iAmTeacher = bk.teacher_id === me;
  const [people, priv, disputes, review, cal, settings, conv] = await Promise.all([
    peopleById(sb, [bk.learner_id, bk.teacher_id]),
    sb.from('booking_private').select('meet_url,meet_source,meet_error,session_notes').eq('booking_id', bk.id).maybeSingle(),
    sb.from('disputes').select('*').eq('booking_id', bk.id).order('created_at', { ascending: false }),
    sb.from('reviews').select('rating').eq('booking_id', bk.id).maybeSingle(),
    iAmTeacher ? sb.rpc('calendar_status') : Promise.resolve({ data: null }),
    sb.from('platform_settings').select('cancel_deadline_hours,noshow_response_hours').maybeSingle(),
    sb.from('conversations').select('id').or(`and(user_a.eq.${[bk.learner_id, bk.teacher_id].sort()[0]},user_b.eq.${[bk.learner_id, bk.teacher_id].sort()[1]})`).maybeSingle()
  ]);
  const st = displayStatus(bk);
  const other = people[iAmTeacher ? bk.learner_id : bk.teacher_id];
  const teacher = people[bk.teacher_id], learner = people[bk.learner_id];
  const openDispute = (disputes.data || []).find(x => x.status !== 'resolved');
  return (
    <div className="wrap max-w-5xl py-10">
      <Link href="/sessions" className="text-sm font-semibold text-emerald-700">← {d.sessions.title}</Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{skillName(bk.skills, lang)}</h1>
          <p className="mt-1 text-muted">{fill(iAmTeacher ? d.sessions.youTeach : d.sessions.youLearn, { name: other?.display_name || d.common.deletedUser })}</p></div>
        <Badge tone={statusTone(st)} className="px-3 py-1 text-sm">{d.status[st as keyof typeof d.status]}</Badge>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <Card className="p-5">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div><dt className="text-xs font-semibold text-muted">{d.sessions.when}</dt><dd className="mt-0.5 font-bold text-navy tabular">{dateTime(bk.start_at, tz, lang)}–{timeOnly(bk.end_at, tz, lang)}</dd><dd className="text-xs text-muted">{fill(d.sessions.yourTime, { tz })}</dd></div>
              <div><dt className="text-xs font-semibold text-muted">{d.sessions.length} · {d.sessions.cost}</dt><dd className="mt-0.5 font-bold text-navy tabular">{bk.duration_min} {d.common.minutes} · {credits(bk.credits, d, lang)}</dd>
                {['pending', 'confirmed', 'disputed'].includes(bk.status) && !iAmTeacher && <dd className="text-xs text-muted">{fill(d.sessions.held, { c: credits(bk.credits, d, lang) })}</dd>}</div>
              {bk.status === 'pending' && <div className="sm:col-span-2"><dt className="text-xs font-semibold text-muted"><Clock size={12} className="mr-1 inline" aria-hidden />{fill(d.sessions.respondBy, { date: dateTime(bk.respond_by, tz, lang) })}</dt></div>}
              {bk.note && <div className="sm:col-span-2"><dt className="text-xs font-semibold text-muted">{d.sessions.requestNote}</dt><dd className="mt-0.5 whitespace-pre-line text-ink">{bk.note}</dd></div>}
            </dl>
          </Card>
          <SessionActions booking={bk} me={me} other={other ? { name: other.display_name } : { name: d.common.deletedUser }} meet={priv.data || null}
            dispute={openDispute || null} reviewed={!!review.data} calendar={(cal.data as { connected: boolean } | null) || null} googleReady={integrationStatus().google}
            cancelHours={settings.data?.cancel_deadline_hours ?? 2} noShowHours={settings.data?.noshow_response_hours ?? 48} conversationId={conv.data?.id || null} />
        </div>
        <aside className="space-y-4">
          <Card className="p-5">
            {[[d.sessions.teacher, teacher], [d.sessions.learner, learner]].map(([label, p]) => { const x = p as typeof teacher; return (
              <div key={label as string} className="flex items-center gap-3 py-2"><Avatar name={x?.display_name || d.common.deletedUser} url={x?.avatar_url} size={40} />
                <div className="min-w-0"><p className="text-xs text-muted">{label as string}</p>{x ? <Link href={`/u/${x.username}`} className="font-bold text-navy hover:underline">{x.display_name}</Link> : <span className="font-bold text-muted">{d.common.deletedUser}</span>}</div></div>); })}
          </Card>
          <Card className="p-5"><h2 className="flex items-center gap-2 font-bold text-navy"><CheckSquare size={18} className="text-emerald" aria-hidden />{d.sessions.prepTitle}</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink">{d.sessions.prep.map(x => <li key={x} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-emerald" />{x}</li>)}</ul></Card>
          <ReportButton targetUser={other?.id} bookingId={bk.id} />
        </aside>
      </div>
    </div>
  );
}
