import { currentUser } from '@/lib/session';
import { getDict, getLang } from '@/lib/i18n';
import NavClient from './NavClient';

export default async function Header() {
  const lang = getLang(), d = getDict(lang);
  const { sb, user, profile } = await currentUser();
  let unread = 0, balance: number | null = null, msgs = 0;
  if (user && profile) {
    const [n, a] = await Promise.all([
      sb.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null),
      sb.from('credit_accounts').select('available').eq('user_id', user.id).maybeSingle()
    ]);
    unread = n.count || 0; balance = a.data ? Number(a.data.available) : null;
    const { count } = await sb.from('messages').select('id', { count: 'exact', head: true }).is('read_at', null).neq('sender_id', user.id);
    msgs = count || 0;
  }
  return <NavClient lang={lang} d={d} user={user ? { id: user.id, name: profile?.display_name || '', avatar: profile?.avatar_url || null, username: profile?.username || '', admin: profile?.role === 'admin' && profile.status === 'active', onboarded: !!profile?.onboarded } : null} unread={unread} msgs={msgs} balance={balance} />;
}
