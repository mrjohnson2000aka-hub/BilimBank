import type { Metadata } from 'next';
import Chat from './Chat';
import { currentUser } from '@/lib/session';
export const metadata: Metadata = { title: 'Messages' };
export const dynamic = 'force-dynamic';
export default async function Messages({ searchParams }: { searchParams: { c?: string } }) {
  const { user } = await currentUser();
  return <Chat me={user!.id} initial={searchParams.c || null} />;
}
