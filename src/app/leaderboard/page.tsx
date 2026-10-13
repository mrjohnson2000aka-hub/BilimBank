import type { Metadata } from 'next';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { Avatar, EmptyState, PageHeader, Stars } from '@/components/ui';
import { currentUser } from '@/lib/session';
import { getDict, getLang } from '@/lib/i18n';
import { credits } from '@/lib/format';
export const metadata: Metadata = { title: 'Leaderboard' };
export const dynamic = 'force-dynamic';
type Row = { username: string; display_name: string; avatar_url: string | null; earned: number; sessions: number; rating: number | null };
export default async function Leaderboard() {
  const lang = getLang(), d = getDict(lang);
  const { sb } = await currentUser();
  const [{ data }, { data: st }] = await Promise.all([sb.rpc('leaderboard', { p_limit: 50 }), sb.from('platform_settings').select('leaderboard_enabled').maybeSingle()]);
  const rows = (data || []) as Row[];
  return (
    <div className="wrap max-w-3xl py-10">
      <PageHeader title={d.leaderboard.title} text={d.leaderboard.text} />
      {st && !st.leaderboard_enabled ? <EmptyState title={d.leaderboard.disabled} /> : rows.length === 0 ? <EmptyState icon={<Trophy size={28} />} title={d.leaderboard.empty} /> : (
        <ol className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-card">
          {rows.map((r, i) => (
            <li key={r.username} className="flex items-center gap-4 px-4 py-3 sm:px-5">
              <span className={`w-6 text-center text-lg font-extrabold tabular ${i < 3 ? 'text-emerald-700' : 'text-muted'}`}>{i + 1}</span>
              <Avatar name={r.display_name} url={r.avatar_url} size={40} />
              <div className="min-w-0 flex-1"><Link href={`/u/${r.username}`} className="block truncate font-bold text-navy hover:underline">{r.display_name}</Link>
                <p className="text-xs text-muted">{r.sessions} {d.leaderboard.sessions.toLowerCase()}{r.rating ? <> · <Stars value={r.rating} size={11} /> {Number(r.rating).toFixed(1)}</> : null}</p></div>
              <span className="text-right font-extrabold text-emerald-700 tabular">{credits(r.earned, d, lang)}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-4 text-xs text-muted">{d.leaderboard.hide}</p>
    </div>
  );
}
