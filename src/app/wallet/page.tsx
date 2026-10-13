import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, EmptyState, PageHeader } from '@/components/ui';
import { currentUser } from '@/lib/session';
import { getDict, getLang, getViewerTz } from '@/lib/i18n';
import { credits, dateTime, num, skillName } from '@/lib/format';
export const metadata: Metadata = { title: 'Wallet' };
export const dynamic = 'force-dynamic';
type L = { id: number; type: string; amount: number; held_change: number; available_after: number; created_at: string; note: string | null; booking_id: string | null; bookings: { start_at: string; skills: { name_en: string; name_uz: string } | null } | null };
export default async function Wallet() {
  const lang = getLang(), d = getDict(lang);
  const { sb, user, profile } = await currentUser();
  const tz = getViewerTz(profile?.timezone);
  const [{ data: a }, { data: ledger }, { data: held }] = await Promise.all([
    sb.from('credit_accounts').select('*').eq('user_id', user!.id).maybeSingle(),
    sb.from('credit_ledger').select('id,type,amount,held_change,available_after,created_at,note,booking_id,bookings(start_at,skills(name_en,name_uz))').eq('user_id', user!.id).order('id', { ascending: false }).limit(200),
    sb.from('bookings').select('id,start_at,credits,status,skills(name_en,name_uz)').eq('learner_id', user!.id).in('status', ['pending', 'confirmed', 'disputed']).order('start_at')
  ]);
  const rows = (ledger || []) as unknown as L[];
  const tiles: [string, number, string][] = [[d.wallet.available, a?.available ?? 0, 'text-emerald-700'], [d.wallet.held, a?.held ?? 0, 'text-warn'], [d.wallet.earned, a?.earned ?? 0, 'text-navy'], [d.wallet.spent, a?.spent ?? 0, 'text-navy']];
  return (
    <div className="wrap py-10">
      <PageHeader title={d.wallet.title} text={d.wallet.explain} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{tiles.map(([l, v, c]) => <Card key={l} className="p-5"><p className="text-sm font-semibold text-muted">{l}</p><p className={`mt-1 text-3xl font-extrabold tabular ${c}`}>{num(v)}</p></Card>)}</div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="min-w-0">
          <h2 className="mb-3 text-lg font-bold text-navy">{d.wallet.history}</h2>
          {rows.length === 0 ? <EmptyState title={d.wallet.empty} /> : (
            <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-card">
              <table className="w-full text-sm">
                <thead className="bg-canvas text-left text-xs text-muted"><tr><th className="px-4 py-3 font-semibold">{d.wallet.date}</th><th className="px-4 py-3 font-semibold">{d.wallet.type}</th><th className="px-4 py-3 font-semibold">{d.wallet.session}</th><th className="px-4 py-3 text-right font-semibold">{d.wallet.amount}</th><th className="px-4 py-3 text-right font-semibold">{d.wallet.balance}</th></tr></thead>
                <tbody className="divide-y divide-line">{rows.map(r => {
                  const amt = r.type === 'hold' || r.type === 'hold_capture' ? -Math.abs(r.held_change || r.amount) : Number(r.amount);
                  const shown = r.type === 'hold_capture' ? -Math.abs(Number(r.held_change)) : r.type === 'hold' ? Number(r.amount) : amt;
                  return (
                    <tr key={r.id}><td className="whitespace-nowrap px-4 py-3 text-muted tabular">{dateTime(r.created_at, tz, lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-4 py-3 font-semibold text-ink">{d.wallet.types[r.type as keyof typeof d.wallet.types]}{r.type === 'admin_adjustment' && r.note ? <span className="block text-xs font-normal text-muted">{r.note}</span> : null}</td>
                      <td className="px-4 py-3">{r.booking_id ? <Link href={`/sessions/${r.booking_id}`} className="text-emerald-700 hover:underline">{skillName(r.bookings?.skills, lang)}</Link> : '—'}</td>
                      <td className={`whitespace-nowrap px-4 py-3 text-right font-bold tabular ${shown > 0 ? 'text-emerald-700' : shown < 0 ? 'text-ink' : 'text-muted'}`}>{r.type === 'hold_capture' ? `(${num(Math.abs(shown))})` : `${shown > 0 ? '+' : shown < 0 ? '−' : ''}${num(Math.abs(shown))}`}</td>
                      <td className="px-4 py-3 text-right text-muted tabular">{num(r.available_after)}</td></tr>);
                })}</tbody>
              </table>
            </div>
          )}
        </section>
        <aside><h2 className="mb-3 text-lg font-bold text-navy">{d.wallet.heldTitle}</h2>
          <Card className="p-4">{(held || []).length ? <ul className="divide-y divide-line">{(held || []).map(h => <li key={h.id}><Link href={`/sessions/${h.id}`} className="flex justify-between gap-2 py-2.5 text-sm"><span><span className="block font-semibold text-ink">{skillName(h.skills as unknown as { name_en: string; name_uz: string }, lang)}</span><span className="text-muted">{dateTime(h.start_at, tz, lang)}</span></span><span className="font-bold text-warn tabular">{credits(h.credits, d, lang)}</span></Link></li>)}</ul> : <p className="text-sm text-muted">{d.wallet.noneHeld}</p>}</Card>
        </aside>
      </div>
    </div>
  );
}
