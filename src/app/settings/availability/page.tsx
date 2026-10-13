import type { Metadata } from 'next';
import AvailabilityEditor from '@/components/AvailabilityEditor';
import { currentUser } from '@/lib/session';
export const metadata: Metadata = { title: 'Availability' };
export const dynamic = 'force-dynamic';
export default async function Page() {
  const { profile: p } = await currentUser();
  return <AvailabilityEditor userId={p!.id} prefs={{ timezone: p!.timezone, session_durations: p!.session_durations, min_notice_hours: p!.min_notice_hours, horizon_days: p!.horizon_days, buffer_minutes: p!.buffer_minutes }} />;
}
