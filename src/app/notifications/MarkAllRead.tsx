'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { browserClient } from '@/lib/supabase/client';
export default function MarkAllRead({ label }: { label: string }) {
  const router = useRouter();
  return <Button variant="outline" size="sm" onClick={async () => { await browserClient().rpc('mark_notifications_read'); router.refresh(); }}>{label}</Button>;
}
