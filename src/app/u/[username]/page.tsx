import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, EmptyState, LinkButton, Stars, btn } from '@/components/ui';
import ProfileHeader, { type PublicProfile, type SkillLevel } from '@/components/ProfileHeader';
import BookingPanel from '@/components/BookingPanel';
import { BlockButton, ReportButton } from '@/components/ProfileActions';
import { currentUser } from '@/lib/session';
import { getDict, getLang, getViewerTz } from '@/lib/i18n';
import { credits, dateOnly, dateTime, displayStatus, skillName } from '@/lib/format';

export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> { return { title: '@' + params.username }; }

export default async function ProfilePage({ params, searchParams }: { params: { username: string }; searchParams: { skill?: string } }) {
  const lang = getLang(), d = getDict(lang);
  const { sb, user, profile: me } = await currentUser();
  const tz = getViewerTz(me?.timezone);
  const { data: p } = await sb.from('public_profiles').select('*').eq('username', params.username.toLowerCase()).maybeSingle();
  if (!p) return <div className="wrap py-16"><EmptyState title={d.profile.notFound} action={<LinkButton href="/discover">{d.nav.explore}</LinkButton>} /></div>;
  const pp = p as PublicProfile;
  const own = user?.id === pp.id;
  const [teach, learn, reviews, acct, blocked] = await Promise.all([
    sb.from('user_teaching_skills').select('skill_id,level,skills(name_en,name_uz,slug)').eq('user_id', pp.id),
    sb.from('user_learning_skills').select('skill_id,level,skills(name_en,name_uz,slug)').eq('user_id', pp.id),
    sb.from('reviews').select('id,rating,body,created_at,booking_id').eq('teacher_id', pp.id).eq('hidden', false).order('created_at', { ascending: false }).limit(10),
    user ? sb.from('credit_accounts').select('available').eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
    user && !own ? sb.from('user_blocks').select('blocked_id').eq('blocker_id', user.id).eq('blocked_id', pp.id).maybeSingle() : Promise.resolve({ data: null })
  ]);
  const t = (teach.data || []) as unknown as SkillLevel[], l = (learn.data || []) as unknown as SkillLevel[];
  let upcoming: { id: string; start_at: string; end_at: string; status: string; skill_id: number }[] = [];
  if (own) { const { data } = await sb.from('bookings').select('id,start_at,end_at,status,skill_id').in('status', ['pending', 'confirmed']).gte('end_at', new Date().toISOString()).order('start_at').limit(5); upcoming = data || []; }
  const skillById = Object.fromEntries(t.map(x => [x.skill_id, x.skills]));
  return (
    <div className="wrap py-10">
      {own && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><span>{d.profile.yourProfile}</span><Link href="/settings/profile" className={btn('outline', 'sm')}>{d.nav.editProfile}</Link></div>}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          <ProfileHeader p={pp} teach={t} learn={l} d={d} lang={lang} tz={tz} />
          {own && (
            <Card className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold text-navy">{d.profile.upcomingOwner}</h2><span className="text-sm font-semibold text-emerald-700">{d.profile.balance}: {credits(acct.data?.available ?? 0, d, lang)}</span></div>
              {upcoming.length ? <ul className="mt-3 divide-y divide-line">{upcoming.map(b => <li key={b.id}><Link href={`/sessions/${b.id}`} className="flex justify-between py-2 text-sm hover:text-emerald-700"><span>{dateTime(b.start_at, tz, lang)}</span><span className="text-muted">{d.status[displayStatus(b) as keyof typeof d.status]}</span></Link></li>)}</ul> : <p className="mt-2 text-sm text-muted">{d.sessions.empty.upcoming}</p>}
            </Card>
          )}
          <Card className="p-5">
            <h2 className="font-bold text-navy">{d.profile.reviews}</h2>
            {(reviews.data || []).length ? <ul className="mt-3 divide-y divide-line">{(reviews.data || []).map(r => <li key={r.id} className="py-3"><div className="flex items-center justify-between"><Stars value={r.rating} /><span className="text-xs text-muted">{dateOnly(r.created_at, tz, lang)}</span></div>{r.body && <p className="mt-1.5 text-sm text-ink">{r.body}</p>}</li>)}</ul> : <p className="mt-2 text-sm text-muted">{d.profile.noReviews}</p>}
          </Card>
          {user && !own && <div className="flex gap-2"><ReportButton targetUser={pp.id} label={d.profile.report} /><BlockButton me={user.id} other={pp.id} initial={!!blocked.data} /></div>}
        </div>
        {!own && t.length > 0 && (
          <aside id="book" className="scroll-mt-20 lg:sticky lg:top-20 lg:self-start">
            <Card className="p-5"><h2 className="mb-4 text-lg font-bold text-navy">{d.profile.bookTitle}</h2>
              <BookingPanel teacher={{ id: pp.id, name: pp.display_name, durations: pp.session_durations, skills: t.map(x => ({ skill_id: x.skill_id, name_en: x.skills?.name_en || '', name_uz: x.skills?.name_uz || '' })) }}
                viewer={{ signedIn: !!user, onboarded: !!me?.onboarded, balance: Number(acct.data?.available ?? 0) }} initialSkill={Number(searchParams.skill) || undefined} />
            </Card>
          </aside>
        )}
      </div>
      {own && upcoming.length === 0 && Object.keys(skillById).length === 0 && null}
    </div>
  );
}
