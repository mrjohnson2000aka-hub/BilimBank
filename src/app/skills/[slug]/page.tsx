import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Users } from 'lucide-react';
import { EmptyState, LinkButton, PageHeader } from '@/components/ui';
import MentorCard, { type MentorRow } from '@/components/MentorCard';
import { currentUser } from '@/lib/session';
import { getDict, getLang, getViewerTz } from '@/lib/i18n';
import { fill, skillName } from '@/lib/format';
export const dynamic = 'force-dynamic';
export default async function SkillPage({ params }: { params: { slug: string } }) {
  const lang = getLang(), d = getDict(lang);
  const { sb, user, profile } = await currentUser();
  const tz = getViewerTz(profile?.timezone);
  const { data: s } = await sb.from('skills').select('id,slug,name_en,name_uz,status,skill_categories(slug,name_en,name_uz)').eq('slug', params.slug).maybeSingle();
  if (!s || s.status === 'disabled') notFound();
  const [{ data: rows }, t, l] = await Promise.all([
    sb.rpc('search_mentors', { p_query: s.name_en, p_days: 30, p_tz: tz, p_limit: 30 }),
    sb.from('user_teaching_skills').select('user_id', { count: 'exact', head: true }).eq('skill_id', s.id),
    sb.from('user_learning_skills').select('user_id', { count: 'exact', head: true }).eq('skill_id', s.id)
  ]);
  const list = ((rows || []) as MentorRow[]).filter(m => m.skill_id === s.id);
  const cat = s.skill_categories as unknown as { slug: string; name_en: string; name_uz: string } | null;
  return (
    <div className="wrap py-10">
      {cat && <Link href={`/discover?category=${cat.slug}`} className="text-sm font-semibold text-emerald-700">{skillName(cat, lang)}</Link>}
      <PageHeader title={skillName(s, lang)} text={`${(t.count === 1 ? d.skills.teachers1 : fill(d.skills.teachersN, { n: t.count || 0 }))} · ${fill(d.skills.learnersN, { n: l.count || 0 })}`} action={<LinkButton href={user ? '/settings/profile' : '/auth/sign-up'} variant="outline">{d.skills.teachThis}</LinkButton>} />
      {list.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{list.map(m => <MentorCard key={m.user_id} m={m} d={d} lang={lang} tz={tz} />)}</div>
        : <EmptyState icon={<Users size={28} />} title={d.skills.noMentors} action={<LinkButton href="/discover">{d.nav.explore}</LinkButton>} />}
    </div>
  );
}
