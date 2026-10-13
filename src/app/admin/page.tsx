import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AdminConsole from './AdminConsole';
import { currentUser } from '@/lib/session';
import { integrationStatus } from '@/lib/env';
export const metadata: Metadata = { title: 'Administration', robots: { index: false } };
export const dynamic = 'force-dynamic';
export default async function Admin() {
  const { user, profile } = await currentUser();
  // ordinary users get a plain 404: the page does not reveal that it exists
  if (!user || profile?.role !== 'admin' || profile.status !== 'active') notFound();
  return <AdminConsole me={user.id} integrations={integrationStatus()} />;
}
