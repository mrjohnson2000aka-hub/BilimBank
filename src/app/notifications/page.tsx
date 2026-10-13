import type { Metadata } from 'next';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { EmptyState, PageHeader } from '@/components/ui';
import MarkAllRead from './MarkAllRead';
import { currentUser } from '@/lib/session';
import { getDict, getLang, getViewerTz } from '@/lib/i18n';
import { dateTime } from '@/lib/format';
export const metadata: Metadata = { title: 'Notifications' };
export const dynamic = 'force-dynamic';
export default async function Notifications() {
  const lang = getLang(), d = getDict(lang);
  const { sb, profile } = await currentUser();
  const tz = getViewerTz(profile?.timezone);
  const { data } = await sb.from('notifications').select('*').order('created_at', { ascending: false }).limit(100);
  const rows = data || [];
  const link = (n: { kind: string; booking_id: string | null; data: Record<string, string> }) => n.booking_id ? `/sessions/${n.booking_id}` : n.kind === 'new_message' ? `/messages?c=${n.data?.conversation || ''}` : n.kind === 'credit_adjusted' ? '/wallet' : '/sessions';
  return (
    <div className="wrap max-w-3xl py-10">
      <PageHeader title={d.notifications.title} action={rows.some(r => !r.read_at) ? <MarkAllRead label={d.notifications.markAll} /> : undefined} />
      {rows.length === 0 ? <EmptyState icon={<Bell size={28} />} title={d.notifications.empty} /> : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-card">
          {rows.map(n => <li key={n.id}><Link href={link(n)} className={`flex items-start gap-3 px-5 py-4 hover:bg-canvas ${n.read_at ? '' : 'bg-emerald-50/50'}`}>
            <span className={`mt-1.5 h-2 w-2 flex-none rounded-full ${n.read_at ? 'bg-transparent' : 'bg-emerald'}`} aria-hidden />
            <span className="flex-1"><span className={`block text-sm ${n.read_at ? 'text-ink' : 'font-bold text-navy'}`}>{d.notifications.kinds[n.kind] || n.kind}{n.kind === 'credit_adjusted' && n.data?.amount ? ` (${Number(n.data.amount) > 0 ? '+' : ''}${n.data.amount})` : ''}</span>
              <span className="text-xs text-muted">{dateTime(n.created_at, tz, lang)}</span></span></Link></li>)}
        </ul>
      )}
    </div>
  );
}
