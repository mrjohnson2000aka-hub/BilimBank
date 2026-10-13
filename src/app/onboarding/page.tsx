import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { currentUser } from '@/lib/session';
import OnboardingFlow from './OnboardingFlow';
export const metadata: Metadata = { title: 'Set up your profile' };
export const dynamic = 'force-dynamic';
export default async function Page() {
  const { sb, user, profile } = await currentUser();
  if (!user || !profile) redirect('/auth/sign-in?next=/onboarding');
  if (profile.onboarded) redirect('/discover');
  const [skills, cats, teach, learn, priv] = await Promise.all([
    sb.from('skills').select('id,slug,name_en,name_uz,category_id,status').order('name_en'),
    sb.from('skill_categories').select('id,slug,name_en,name_uz').order('sort'),
    sb.from('user_teaching_skills').select('skill_id,level').eq('user_id', user.id),
    sb.from('user_learning_skills').select('skill_id,level').eq('user_id', user.id),
    sb.from('profile_private').select('birth_date').eq('id', user.id).maybeSingle()
  ]);
  return <OnboardingFlow profile={profile} skills={skills.data || []} categories={cats.data || []} teach={teach.data || []} learn={learn.data || []}
    birth={priv.data?.birth_date || ''} agreedAtSignup={!!user.user_metadata?.terms} />;
}
