import type { Metadata } from 'next';
import ProfileForm from './ProfileForm';
import SkillPicker from '@/components/SkillPicker';
import { Card } from '@/components/ui';
import { currentUser } from '@/lib/session';
import { getDict } from '@/lib/i18n';
export const metadata: Metadata = { title: 'Profile settings' };
export const dynamic = 'force-dynamic';
export default async function Page() {
  const d = getDict();
  const { sb, user, profile } = await currentUser();
  const [skills, cats, teach, learn] = await Promise.all([
    sb.from('skills').select('id,slug,name_en,name_uz,category_id,status').order('name_en'), sb.from('skill_categories').select('id,slug,name_en,name_uz').order('sort'),
    sb.from('user_teaching_skills').select('skill_id,level').eq('user_id', user!.id), sb.from('user_learning_skills').select('skill_id,level').eq('user_id', user!.id)
  ]);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-5 sm:p-6"><ProfileForm profile={profile!} /></Card>
      <div className="space-y-6">
        <Card className="p-5 sm:p-6"><h2 className="mb-4 text-lg font-bold text-navy">{d.profile.teaches}</h2><SkillPicker mode="teach" userId={user!.id} skills={skills.data || []} categories={cats.data || []} initial={teach.data || []} /></Card>
        <Card className="p-5 sm:p-6"><h2 className="mb-4 text-lg font-bold text-navy">{d.profile.wantsToLearn}</h2><SkillPicker mode="learn" userId={user!.id} skills={skills.data || []} categories={cats.data || []} initial={learn.data || []} /></Card>
      </div>
    </div>
  );
}
