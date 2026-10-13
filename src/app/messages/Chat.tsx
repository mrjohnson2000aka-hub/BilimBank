'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, MessageCircle, Send, ShieldCheck } from 'lucide-react';
import { browserClient } from '@/lib/supabase/client';
import { useApp } from '@/components/Providers';
import { BlockButton, ReportButton } from '@/components/ProfileActions';
import { Avatar, Button, EmptyState, PageHeader, Skeleton, inputCls } from '@/components/ui';
import { dateTime, errorText, timeOnly } from '@/lib/format';

type Conv = { id: string; user_a: string; user_b: string; last_message_at: string | null };
type Msg = { id: number; conversation_id: string; sender_id: string; body: string; created_at: string; read_at: string | null };
type P = { id: string; username: string; display_name: string; avatar_url: string | null };

export default function Chat({ me, initial }: { me: string; initial: string | null }) {
  const { d, lang, tz, toast } = useApp();
  const sb = browserClient();
  const [convs, setConvs] = useState<Conv[] | null>(null), [people, setPeople] = useState<Record<string, P>>({}), [last, setLast] = useState<Record<string, Msg>>({}), [unread, setUnread] = useState<Record<string, number>>({});
  const [cur, setCur] = useState<string | null>(initial), [msgs, setMsgs] = useState<Msg[]>([]), [text, setText] = useState(''), [sending, setSending] = useState(false), [blocked, setBlocked] = useState<{ mine: boolean } | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const other = (c: Conv) => (c.user_a === me ? c.user_b : c.user_a);

  const loadList = useCallback(async () => {
    const { data: cs } = await sb.from('conversations').select('*').order('last_message_at', { ascending: false, nullsFirst: false });
    const list = (cs || []) as Conv[];
    const ids = list.map(other);
    const [{ data: ps }, { data: ms }] = await Promise.all([
      ids.length ? sb.from('public_profiles').select('id,username,display_name,avatar_url').in('id', ids) : Promise.resolve({ data: [] }),
      list.length ? sb.from('messages').select('*').in('conversation_id', list.map(c => c.id)).order('created_at', { ascending: false }).limit(300) : Promise.resolve({ data: [] })
    ]);
    const L: Record<string, Msg> = {}, U: Record<string, number> = {};
    ((ms || []) as Msg[]).forEach(m => { if (!L[m.conversation_id]) L[m.conversation_id] = m; if (m.sender_id !== me && !m.read_at) U[m.conversation_id] = (U[m.conversation_id] || 0) + 1; });
    setPeople(Object.fromEntries(((ps || []) as P[]).map(p => [p.id, p]))); setLast(L); setUnread(U); setConvs(list);
  }, [sb, me]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadThread = useCallback(async (id: string) => {
    const { data } = await sb.from('messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true }).limit(300);
    setMsgs((data || []) as Msg[]);
    await sb.rpc('mark_conversation_read', { p_conversation: id });
    setUnread(u => ({ ...u, [id]: 0 }));
  }, [sb]);

  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => { if (cur) loadThread(cur); }, [cur, loadThread]);
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight }); }, [msgs]);
  useEffect(() => {
    if (!cur || !convs) return;
    const c = convs.find(x => x.id === cur); if (!c) return;
    sb.from('user_blocks').select('blocker_id').or(`and(blocker_id.eq.${me},blocked_id.eq.${other(c)})`).then(({ data }) => setBlocked(data && data.length ? { mine: true } : null));
  }, [cur, convs]); // eslint-disable-line react-hooks/exhaustive-deps
  // live updates, with a slow poll as a safety net if the realtime connection is unavailable
  useEffect(() => {
    const ch = sb.channel('msgs-' + me).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
      const m = payload.new as Msg;
      setLast(l => ({ ...l, [m.conversation_id]: m }));
      if (m.conversation_id === cur) { setMsgs(x => (x.some(y => y.id === m.id) ? x : [...x, m])); if (m.sender_id !== me) sb.rpc('mark_conversation_read', { p_conversation: m.conversation_id }); }
      else if (m.sender_id !== me) setUnread(u => ({ ...u, [m.conversation_id]: (u[m.conversation_id] || 0) + 1 }));
    }).subscribe();
    const poll = setInterval(() => { if (cur) loadThread(cur); loadList(); }, 15000);
    return () => { sb.removeChannel(ch); clearInterval(poll); };
  }, [cur, me, sb, loadThread, loadList]);

  async function send(e: React.FormEvent) {
    e.preventDefault(); const body = text.trim(); if (!body || !cur) return;
    setSending(true);
    const { data, error } = await sb.from('messages').insert({ conversation_id: cur, sender_id: me, body }).select().single();
    setSending(false);
    if (error) return toast(errorText(error, d), 'err');
    setText(''); setMsgs(x => (x.some(y => y.id === (data as Msg).id) ? x : [...x, data as Msg])); setLast(l => ({ ...l, [cur]: data as Msg }));
    fetch('/api/outbox/flush', { method: 'POST' }).catch(() => {});
  }
  const c = convs?.find(x => x.id === cur), op = c ? people[other(c)] : null;
  return (
    <div className="wrap py-10">
      <PageHeader title={d.messages.title} />
      {convs === null ? <Skeleton className="h-96" /> : convs.length === 0 ? <EmptyState icon={<MessageCircle size={28} />} title={d.messages.empty} /> : (
        <div className="grid h-[70vh] min-h-[460px] overflow-hidden rounded-2xl border border-line bg-white shadow-card md:grid-cols-[300px_1fr]">
          <ul className={`overflow-y-auto border-r border-line ${cur ? 'hidden md:block' : ''}`} aria-label={d.messages.title}>
            {convs.map(x => { const p = people[other(x)], m = last[x.id]; return (
              <li key={x.id}><button onClick={() => setCur(x.id)} aria-current={x.id === cur} className={`flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left hover:bg-canvas ${x.id === cur ? 'bg-emerald-50' : ''}`}>
                <Avatar name={p?.display_name || d.common.deletedUser} url={p?.avatar_url} size={40} />
                <span className="min-w-0 flex-1"><span className="flex justify-between gap-2"><span className="truncate font-semibold text-navy">{p?.display_name || d.common.deletedUser}</span>{m && <span className="flex-none text-xs text-muted">{timeOnly(m.created_at, tz, lang)}</span>}</span>
                  <span className="block truncate text-sm text-muted">{m ? (m.sender_id === me ? `${d.common.you}: ` : '') + m.body : '—'}</span></span>
                {unread[x.id] > 0 && <span className="flex-none rounded-full bg-emerald px-2 text-xs font-bold text-white">{unread[x.id]}</span>}
              </button></li>); })}
          </ul>
          <section className={`flex min-h-0 flex-col ${cur ? '' : 'hidden md:flex'}`}>
            {!c ? <div className="m-auto p-6 text-sm text-muted">{d.messages.select}</div> : (
              <>
                <header className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
                  <button className="rounded-lg p-1 md:hidden" onClick={() => setCur(null)} aria-label={d.messages.back}><ArrowLeft size={20} /></button>
                  <Avatar name={op?.display_name} url={op?.avatar_url} size={34} />
                  {op ? <Link href={`/u/${op.username}`} className="flex-1 font-bold text-navy hover:underline">{op.display_name}</Link> : <span className="flex-1 font-bold text-muted">{d.common.deletedUser}</span>}
                  <ReportButton targetUser={other(c)} label={d.messages.report} /><BlockButton me={me} other={other(c)} initial={!!blocked?.mine} />
                </header>
                <div ref={logRef} className="flex-1 space-y-2 overflow-y-auto bg-canvas px-4 py-4">
                  <p className="mx-auto mb-3 flex max-w-md items-start gap-2 rounded-xl bg-white px-3 py-2 text-xs text-muted ring-1 ring-line"><ShieldCheck size={15} className="mt-0.5 flex-none text-emerald" aria-hidden />{d.messages.safety}</p>
                  {msgs.map(m => (
                    <div key={m.id} className={`flex ${m.sender_id === me ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-[15px] ${m.sender_id === me ? 'bg-navy text-white' : 'bg-white text-ink ring-1 ring-line'}`}>
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        <p className={`mt-0.5 text-right text-[11px] ${m.sender_id === me ? 'text-navy-100' : 'text-muted'}`}>{dateTime(m.created_at, tz, lang, { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}{m.sender_id === me && m.read_at ? ` · ${d.messages.read}` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {blocked?.mine ? <p className="border-t border-line px-4 py-3 text-sm text-muted">{d.messages.blocked}</p> : (
                  <form onSubmit={send} className="flex gap-2 border-t border-line p-3">
                    <label className="flex-1"><span className="sr-only">{d.messages.ph}</span><input className={inputCls} maxLength={1000} value={text} onChange={e => setText(e.target.value)} placeholder={d.messages.ph} /></label>
                    <Button type="submit" disabled={sending || !text.trim()} aria-label={d.messages.send}><Send size={17} aria-hidden /><span className="hidden sm:inline">{d.messages.send}</span></Button>
                  </form>)}
              </>)}
          </section>
        </div>
      )}
    </div>
  );
}
