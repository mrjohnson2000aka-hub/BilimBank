import type { Metadata } from 'next';
import AccountSettings from './AccountSettings';
import { currentUser } from '@/lib/session';
import { integrationStatus } from '@/lib/env';
export const metadata: Metadata = { title: 'Account and privacy' };
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams: { google?: string } }) {
  const { sb, user, profile } = await currentUser();
  const { data: cal } = await sb.rpc('calendar_status');
  return <AccountSettings profile={profile!} email={user!.email || ''} calendar={(cal || { connected: false }) as { connected: boolean; email?: string }} googleReady={integrationStatus().google} googleResult={searchParams.google || null} />;
}
