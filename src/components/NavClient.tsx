'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, Menu, MessageCircle, X, Wallet, Settings, User, Shield, LifeBuoy, LogOut, CalendarDays, Compass, Trophy } from 'lucide-react';
import { Avatar, Logo, btn } from './ui';
import type { Dict } from '@/lib/i18n/en';
import { num, type Lang } from '@/lib/format';
import { browserClient } from '@/lib/supabase/client';

type U = { id: string; name: string; avatar: string | null; username: string; admin: boolean; onboarded: boolean } | null;

export default function NavClient({ lang, d, user, unread, msgs, balance }: { lang: Lang; d: Dict; user: U; unread: number; msgs: number; balance: number | null }) {
  const [open, setOpen] = useState(false), [menu, setMenu] = useState(false), [count, setCount] = useState(unread);
  const path = usePathname(), router = useRouter(), menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => setCount(unread), [unread]);
  useEffect(() => { setOpen(false); setMenu(false); }, [path]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);
  useEffect(() => {
    if (!user) return;
    const sb = browserClient();
    const ch = sb.channel('notif-' + user.id).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => setCount(c => c + 1)).subscribe();
    return () => { sb.removeChannel(ch); };
  }, [user]);
  async function setLang(l: Lang) {
    document.cookie = `lang=${l};path=/;max-age=31536000;samesite=lax`;
    if (user) await browserClient().from('profiles').update({ preferred_lang: l }).eq('id', user.id);
    router.refresh();
  }
  async function signOut() { await browserClient().auth.signOut(); router.push('/'); router.refresh(); }
  const active = (p: string) => (path === p || path.startsWith(p + '/') ? 'text-navy bg-navy-50' : 'text-muted hover:text-navy');
  const LangSwitch = (
    <div className="flex rounded-lg border border-line p-0.5 text-xs font-bold" role="group" aria-label="Language">
      {(['en', 'uz'] as Lang[]).map(l => <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l} className={`rounded-md px-2 py-1 ${lang === l ? 'bg-navy text-white' : 'text-muted hover:text-navy'}`}>{l.toUpperCase()}</button>)}
    </div>
  );
  const publicLinks: [string, string][] = [['/#how', d.nav.how], ['/discover', d.nav.explore], ['/leaderboard', d.nav.community]];
  const appLinks: [string, string, typeof Compass, number][] = [['/discover', d.nav.discover, Compass, 0], ['/sessions', d.nav.sessions, CalendarDays, 0], ['/messages', d.nav.messages, MessageCircle, msgs]];
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="wrap flex h-16 items-center gap-4">
        <Link href="/" aria-label="BilimBank home" className="flex-none"><Logo /></Link>
        <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label="Main">
          {(user ? appLinks.map(x => [x[0], x[1]] as [string, string]) : publicLinks).map(([href, label]) => (
            <Link key={href} href={href} className={`rounded-lg px-3 py-2 text-sm font-semibold ${active(href)}`}>{label}{user && href === '/messages' && msgs > 0 && <span className="ml-1.5 rounded-full bg-emerald px-1.5 text-[11px] text-white">{msgs}</span>}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block">{LangSwitch}</div>
          {user ? (
            <>
              {balance != null && <Link href="/wallet" className="hidden items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-sm font-bold text-emerald-700 sm:flex"><Wallet size={15} aria-hidden /><span className="tabular">{num(balance)}</span><span className="sr-only">{d.common.credits}</span></Link>}
              <Link href="/notifications" className="relative rounded-lg p-2 text-muted hover:bg-navy-50 hover:text-navy" aria-label={d.nav.notifications}>
                <Bell size={20} />{count > 0 && <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-danger px-1 text-center text-[11px] font-bold leading-[18px] text-white">{count > 99 ? '99+' : count}</span>}
              </Link>
              <div className="relative hidden md:block" ref={menuRef}>
                <button onClick={() => setMenu(m => !m)} className="flex items-center gap-1 rounded-lg p-1 hover:bg-navy-50" aria-expanded={menu} aria-haspopup="menu"><Avatar name={user.name} url={user.avatar} size={32} /><ChevronDown size={16} className="text-muted" /></button>
                {menu && <AccountMenu d={d} user={user} signOut={signOut} />}
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/auth/sign-in" className={btn('ghost', 'sm')}>{d.common.signIn}</Link>
              <Link href="/auth/sign-up" className={btn('primary', 'sm')}>{d.common.join}</Link>
            </div>
          )}
          <button className="rounded-lg p-2 text-navy md:hidden" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label={d.nav.menu}>{open ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </div>
      {open && (
        <div className="border-t border-line bg-white md:hidden">
          <div className="wrap space-y-1 py-3">
            {(user ? appLinks.map(x => [x[0], x[1]] as [string, string]) : publicLinks).map(([href, label]) => <Link key={href} href={href} className="block rounded-lg px-3 py-2.5 font-semibold text-ink hover:bg-navy-50">{label}</Link>)}
            {user && <AccountLinks d={d} user={user} />}
            <div className="flex items-center justify-between px-3 pt-2">{LangSwitch}
              {user ? <button onClick={signOut} className="text-sm font-semibold text-danger">{d.common.signOut}</button>
                : <div className="flex gap-2"><Link href="/auth/sign-in" className={btn('outline', 'sm')}>{d.common.signIn}</Link><Link href="/auth/sign-up" className={btn('primary', 'sm')}>{d.common.join}</Link></div>}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
function AccountLinks({ d, user }: { d: Dict; user: NonNullable<U> }) {
  const items: [string, string, typeof User][] = [[`/u/${user.username}`, d.nav.profile, User], ['/wallet', d.nav.wallet, Wallet], ['/leaderboard', d.nav.leaderboard, Trophy], ['/settings/profile', d.nav.settings, Settings], ['/help', d.nav.help, LifeBuoy]];
  if (user.admin) items.push(['/admin', d.nav.admin, Shield]);
  return <>{items.map(([href, label, I]) => <Link key={href} href={href} role="menuitem" className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-ink hover:bg-navy-50"><I size={17} className="text-muted" aria-hidden />{label}</Link>)}</>;
}
function AccountMenu({ d, user, signOut }: { d: Dict; user: NonNullable<U>; signOut: () => void }) {
  return (
    <div role="menu" className="absolute right-0 mt-2 w-60 rounded-2xl border border-line bg-white p-2 shadow-pop">
      <div className="border-b border-line px-3 pb-2 pt-1"><p className="truncate text-sm font-bold text-navy">{user.name || user.username}</p><p className="truncate text-xs text-muted">@{user.username}</p></div>
      <div className="py-1"><AccountLinks d={d} user={user} /></div>
      <button onClick={signOut} role="menuitem" className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-danger hover:bg-danger-50"><LogOut size={17} aria-hidden />{d.common.signOut}</button>
    </div>
  );
}
