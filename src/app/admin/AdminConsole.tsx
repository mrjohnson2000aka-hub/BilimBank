'use client';
import { useCallback, useEffect, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { browserClient } from '@/lib/supabase/client';
import { useApp } from '@/components/Providers';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Badge, Button, Card, Field, Skeleton, inputCls } from '@/components/ui';
import { dateTime, displayStatus, errorText, num, skillName, statusTone } from '@/lib/format';

type Integr = { email: boolean; google: boolean; service: boolean; cron: boolean };
const TABS = ['overview', 'people', 'sessions', 'queue', 'skills', 'settings', 'audit'] as const;
type Tab = (typeof TABS)[number];
function csv(name: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const body = [keys.join(','), ...rows.map(r => keys.map(k => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + body], { type: 'text/csv' })); a.download = name; a.click();
}
const iso = (x: Date) => x.toISOString().slice(0, 10);

export default function AdminConsole({ me, integrations }: { me: string; integrations: Integr }) {
  const { d } = useApp();
  const [tab, setTab] = useState<Tab>('overview');
  return (
    <div className="wrap py-10">
      <h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{d.admin.title}</h1>
      <p className="mt-1 text-sm text-muted">{d.admin.only}</p>
      <nav className="-mx-4 mt-5 flex gap-1 overflow-x-auto px-4" role="tablist">
        {TABS.map(t => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`flex-none rounded-xl px-3.5 py-2 text-sm font-semibold ${tab === t ? 'bg-navy text-white' : 'bg-white text-muted ring-1 ring-line hover:text-navy'}`}>{d.admin.tabs[t]}</button>)}
      </nav>
      <div className="mt-6">
        {tab === 'overview' && <Overview integrations={integrations} />}
        {tab === 'people' && <People me={me} />}
        {tab === 'sessions' && <Sessions />}
        {tab === 'queue' && <Queue />}
        {tab === 'skills' && <Skills />}
        {tab === 'settings' && <SettingsTab />}
        {tab === 'audit' && <Audit />}
      </div>
    </div>
  );
}

/* ---------- overview ---------- */
type OV = { users: number; onboarded: number; active_users: number; suspended: number; new_users: number; bookings: number; by_status: Record<string, number>; hours: number; credits: Record<string, number>; avg_rating: number | null;
  daily: { day: string; signups: number; booked: number; completed: number }[]; top_teach: { name: string; n: number }[]; top_learn: { name: string; n: number }[]; open_disputes: number; open_reports: number; open_flags: number; email_failed: number };
function Overview({ integrations }: { integrations: Integr }) {
  const { d } = useApp(); const sb = browserClient();
  const [from, setFrom] = useState(iso(new Date(Date.now() - 29 * 864e5))), [to, setTo] = useState(iso(new Date())), [ov, setOv] = useState<OV | null>(null), [err, setErr] = useState('');
  const load = useCallback(async () => { setOv(null); const { data, error } = await sb.rpc('admin_overview', { p_from: from, p_to: to }); if (error) setErr(errorText(error, d)); else setOv(data as OV); }, [sb, from, to, d]);
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const s = ov?.by_status || {}, closed = (s.completed || 0) + (s.cancelled || 0) + (s.expired || 0) + (s.no_show_learner || 0) + (s.no_show_teacher || 0) + (s.void || 0);
  const pct = (n: number) => (closed ? Math.round((n / closed) * 100) + '%' : '—');
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <Field label={d.admin.from} htmlFor="ov-from"><input id="ov-from" type="date" className={inputCls} value={from} onChange={e => setFrom(e.target.value)} /></Field>
        <Field label={d.admin.to} htmlFor="ov-to"><input id="ov-to" type="date" className={inputCls} value={to} onChange={e => setTo(e.target.value)} /></Field>
        <Button onClick={load}><RefreshCw size={16} aria-hidden />{d.admin.apply}</Button>
        {ov && <Button variant="outline" onClick={() => csv(`bilimbank-daily-${from}-${to}.csv`, ov.daily)}><Download size={16} aria-hidden />{d.admin.exportCsv}</Button>}
      </div>
      {err && <p className="text-danger">{err}</p>}
      {!ov ? <Skeleton className="h-64" /> : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[[d.admin.users, ov.users], [d.admin.active, ov.active_users], [d.admin.newUsers, ov.new_users], [d.admin.bookings, ov.bookings], [d.admin.confirmed, s.confirmed || 0], [d.admin.completed, s.completed || 0], [d.admin.cancelled, (s.cancelled || 0) + (s.declined || 0) + (s.expired || 0)], [d.admin.hours, num(ov.hours)],
              [d.admin.avgRating, ov.avg_rating ? Number(ov.avg_rating).toFixed(2) : '—'], [d.admin.completion, pct(s.completed || 0)], [d.admin.noShowRate, pct((s.no_show_learner || 0) + (s.no_show_teacher || 0))], [d.admin.disputeRate, ov.bookings ? Math.round(((s.disputed || 0) / ov.bookings) * 100) + '%' : '—']].map(([l, v]) => (
              <Card key={String(l)} className="p-4"><p className="text-xs font-semibold text-muted">{l}</p><p className="mt-1 text-2xl font-extrabold text-navy tabular">{v}</p></Card>))}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <MiniBars title={d.admin.signups} rows={ov.daily.map(x => [x.day, x.signups])} />
            <MiniBars title={d.admin.booked} rows={ov.daily.map(x => [x.day, x.booked])} />
            <MiniBars title={d.admin.completed} rows={ov.daily.map(x => [x.day, x.completed])} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-5"><h3 className="font-bold text-navy">{d.admin.issued}</h3><dl className="mt-3 space-y-1.5 text-sm">{[[d.admin.starter, ov.credits.starter_grant], [d.admin.rewards, ov.credits.teaching_reward], [d.admin.adjustments, ov.credits.admin_adjustment], [d.wallet.types.no_show_penalty, ov.credits.no_show_penalty]].map(([l, v]) => <div key={String(l)} className="flex justify-between"><dt className="text-muted">{l}</dt><dd className="font-bold tabular">{num(Number(v || 0))}</dd></div>)}</dl></Card>
            <TopList title={d.admin.topTeach} rows={ov.top_teach} /><TopList title={d.admin.topLearn} rows={ov.top_learn} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5"><h3 className="font-bold text-navy">{d.admin.openItems}</h3><dl className="mt-3 grid grid-cols-2 gap-2 text-sm">{[[d.admin.disputes, ov.open_disputes], [d.admin.reports, ov.open_reports], [d.admin.flags, ov.open_flags], [d.admin.emailFailed, ov.email_failed]].map(([l, v]) => <div key={String(l)} className="rounded-xl bg-canvas p-3"><dt className="text-muted">{l}</dt><dd className="text-xl font-extrabold tabular text-navy">{v}</dd></div>)}</dl></Card>
            <Card className="p-5"><h3 className="font-bold text-navy">{d.admin.integrations}</h3><ul className="mt-3 space-y-2 text-sm">{[[d.admin.emailOk, integrations.email], [d.admin.googleOk, integrations.google], [d.admin.serviceOk, integrations.service], [d.admin.cronOk, integrations.cron]].map(([l, ok]) => <li key={String(l)} className="flex justify-between"><span>{l}</span><Badge tone={ok ? 'ok' : 'warn'}>{ok ? d.admin.on : d.admin.off}</Badge></li>)}</ul></Card>
          </div>
        </>
      )}
    </div>
  );
}
function MiniBars({ title, rows }: { title: string; rows: [string, number][] }) {
  const max = Math.max(1, ...rows.map(r => r[1])), total = rows.reduce((s, r) => s + r[1], 0);
  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between"><h3 className="font-bold text-navy">{title}</h3><span className="text-sm font-bold text-ink tabular">{total}</span></div>
      <div className="mt-4 flex h-28 items-end gap-[2px] border-b border-line" role="img" aria-label={`${title}: ${total}`}>
        {rows.map(([day, v]) => <div key={day} className="group relative flex h-full flex-1 items-end"><div className="w-full rounded-t bg-navy transition-colors group-hover:bg-emerald" style={{ height: `${(v / max) * 100}%`, minHeight: v ? 3 : 0 }} />
          <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11px] text-white group-hover:block">{day}: {v}</span></div>)}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-muted tabular"><span>{rows[0]?.[0]}</span><span>{rows[rows.length - 1]?.[0]}</span></div>
    </Card>
  );
}
function TopList({ title, rows }: { title: string; rows: { name: string; n: number }[] }) {
  const max = Math.max(1, ...rows.map(r => r.n));
  return <Card className="p-5"><h3 className="font-bold text-navy">{title}</h3><ul className="mt-3 space-y-2">{rows.map(r => <li key={r.name} className="text-sm"><div className="flex justify-between"><span>{r.name}</span><span className="font-bold tabular">{r.n}</span></div><div className="mt-1 h-1.5 rounded-full bg-navy-50"><div className="h-1.5 rounded-full bg-emerald" style={{ width: `${(r.n / max) * 100}%` }} /></div></li>)}</ul></Card>;
}

/* ---------- people ---------- */
type Person = { id: string; username: string; display_name: string; role: string; status: string; is_minor: boolean; onboarded: boolean; created_at: string; last_active_at: string; school: string | null };
function People({ me }: { me: string }) {
  const { d, toast, tz, lang } = useApp(); const sb = browserClient();
  const [rows, setRows] = useState<Person[] | null>(null), [bal, setBal] = useState<Record<string, { available: number; held: number; earned: number }>>({}), [q, setQ] = useState('');
  const [act, setAct] = useState<{ kind: 'status' | 'role' | 'adjust'; p: Person } | null>(null), [reason, setReason] = useState(''), [amount, setAmount] = useState(''), [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const [{ data: ps }, { data: as }] = await Promise.all([sb.from('profiles').select('id,username,display_name,role,status,is_minor,onboarded,created_at,last_active_at,school').order('created_at', { ascending: false }).limit(1000), sb.from('credit_accounts').select('user_id,available,held,earned').limit(1000)]);
    setRows((ps || []) as Person[]); setBal(Object.fromEntries((as || []).map(a => [a.user_id, a])));
  }, [sb]);
  useEffect(() => { load(); }, [load]);
  const list = (rows || []).filter(p => !q || (p.display_name + ' ' + p.username).toLowerCase().includes(q.toLowerCase()));
  async function apply() {
    if (!act) return; setBusy(true);
    const r = act.kind === 'status' ? await sb.rpc('admin_set_user_status', { p_user: act.p.id, p_status: act.p.status === 'active' ? 'suspended' : 'active', p_reason: reason })
      : act.kind === 'role' ? await sb.rpc('admin_set_role', { p_user: act.p.id, p_role: act.p.role === 'admin' ? 'student' : 'admin', p_reason: reason })
        : await sb.rpc('admin_adjust_credits', { p_user: act.p.id, p_amount: Number(amount), p_reason: reason });
    setBusy(false);
    if (r.error) return toast(errorText(r.error, d), 'err');
    toast(d.common.saved); setAct(null); setReason(''); setAmount(''); load();
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2"><input className={`${inputCls} max-w-sm`} placeholder={d.admin.searchPeople} aria-label={d.admin.searchPeople} value={q} onChange={e => setQ(e.target.value)} />
        <Button variant="outline" onClick={() => csv('bilimbank-participants.csv', list.map(p => ({ ...p, ...bal[p.id] })))}><Download size={16} aria-hidden />{d.admin.exportCsv}</Button></div>
      {!rows ? <Skeleton className="h-64" /> : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-card"><table className="w-full text-sm">
          <thead className="bg-canvas text-left text-xs text-muted"><tr>{[d.admin.name, d.admin.status, d.admin.role, d.admin.balance, d.admin.joined, ''].map((h, i) => <th key={i} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">{list.map(p => (
            <tr key={p.id}><td className="px-4 py-3"><a href={`/u/${p.username}`} className="font-semibold text-navy hover:underline">{p.display_name || '—'}</a><span className="block text-xs text-muted">@{p.username}{p.is_minor ? ' · <18' : ''}{!p.onboarded ? ' · setup' : ''}</span></td>
              <td className="px-4 py-3"><Badge tone={p.status === 'active' ? 'ok' : 'danger'}>{p.status}</Badge></td><td className="px-4 py-3">{p.role}</td>
              <td className="px-4 py-3 tabular">{num(bal[p.id]?.available ?? 0)} <span className="text-xs text-muted">({num(bal[p.id]?.held ?? 0)} / +{num(bal[p.id]?.earned ?? 0)})</span></td>
              <td className="whitespace-nowrap px-4 py-3 text-muted">{dateTime(p.created_at, tz, lang, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right">{p.id !== me && <><Button size="sm" variant="ghost" onClick={() => setAct({ kind: 'adjust', p })}>{d.admin.adjust}</Button>
                <Button size="sm" variant="ghost" onClick={() => setAct({ kind: 'status', p })}>{p.status === 'active' ? d.admin.suspend : d.admin.reinstate}</Button>
                <Button size="sm" variant="ghost" onClick={() => setAct({ kind: 'role', p })}>{p.role === 'admin' ? d.admin.makeStudent : d.admin.makeAdmin}</Button></>}</td></tr>))}</tbody></table></div>
      )}
      <ConfirmDialog open={!!act} onClose={() => setAct(null)} title={d.admin.confirmAction} confirmLabel={d.common.confirm} danger={act?.kind !== 'adjust'} busy={busy} onConfirm={apply}
        text={act ? `${act.p.display_name} (@${act.p.username}): ${act.kind === 'adjust' ? d.admin.adjust : act.kind === 'status' ? (act.p.status === 'active' ? d.admin.suspend : d.admin.reinstate) : act.p.role === 'admin' ? d.admin.makeStudent : d.admin.makeAdmin}` : ''}>
        <div className="space-y-3">{act?.kind === 'adjust' && <Field label={d.admin.amount} htmlFor="adj-amt"><input id="adj-amt" type="number" step="0.5" className={inputCls} value={amount} onChange={e => setAmount(e.target.value)} /></Field>}
          <Field label={d.admin.reason} htmlFor="adj-reason"><input id="adj-reason" className={inputCls} maxLength={200} value={reason} onChange={e => setReason(e.target.value)} /></Field></div>
      </ConfirmDialog>
    </div>
  );
}

/* ---------- sessions ---------- */
type B = { id: string; learner_id: string; teacher_id: string; start_at: string; end_at: string; duration_min: number; credits: number; status: string; created_at: string; learner_done_at: string | null; teacher_done_at: string | null; skills: { name_en: string; name_uz: string } | null };
function Sessions() {
  const { d, toast, tz, lang } = useApp(); const sb = browserClient();
  const [rows, setRows] = useState<B[] | null>(null), [names, setNames] = useState<Record<string, string>>({}), [status, setStatus] = useState(''), [q, setQ] = useState(''), [open, setOpen] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ ledger: Record<string, unknown>[]; disputes: Record<string, unknown>[] } | null>(null), [res, setRes] = useState<{ id: string; outcome: string; note: string } | null>(null), [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    let qq = sb.from('bookings').select('id,learner_id,teacher_id,start_at,end_at,duration_min,credits,status,created_at,learner_done_at,teacher_done_at,skills(name_en,name_uz)').order('start_at', { ascending: false }).limit(500);
    if (status) qq = qq.eq('status', status);
    const { data } = await qq; const list = (data || []) as unknown as B[]; setRows(list);
    const ids = Array.from(new Set(list.flatMap(b => [b.learner_id, b.teacher_id])));
    if (ids.length) { const { data: ps } = await sb.from('profiles').select('id,display_name').in('id', ids); setNames(Object.fromEntries((ps || []).map(p => [p.id, p.display_name]))); }
  }, [sb, status]);
  useEffect(() => { load(); }, [load]);
  async function expand(id: string) {
    if (open === id) return setOpen(null);
    setOpen(id); setDetail(null);
    const [l, ds] = await Promise.all([sb.from('credit_ledger').select('created_at,user_id,type,amount,held_change,note').eq('booking_id', id).order('id'), sb.from('disputes').select('*').eq('booking_id', id).order('created_at')]);
    setDetail({ ledger: l.data || [], disputes: ds.data || [] });
  }
  async function resolve() {
    if (!res) return; setBusy(true);
    const { error } = await sb.rpc('admin_resolve_booking', { p_booking: res.id, p_outcome: res.outcome, p_note: res.note });
    setBusy(false); if (error) return toast(errorText(error, d), 'err');
    toast(d.common.saved); setRes(null); fetch('/api/outbox/flush', { method: 'POST' }).catch(() => {}); load(); setOpen(null);
  }
  const list = (rows || []).filter(b => !q || `${names[b.learner_id]} ${names[b.teacher_id]} ${b.skills?.name_en}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input className={`${inputCls} max-w-xs`} placeholder={d.common.search} aria-label={d.common.search} value={q} onChange={e => setQ(e.target.value)} />
        <select className={`${inputCls} max-w-[220px]`} value={status} onChange={e => setStatus(e.target.value)} aria-label={d.admin.statusFilter}><option value="">{d.admin.any}</option>{['pending', 'confirmed', 'disputed', 'completed', 'cancelled', 'declined', 'expired', 'no_show_learner', 'no_show_teacher', 'void'].map(s => <option key={s} value={s}>{d.status[s as keyof typeof d.status]}</option>)}</select>
        <Button variant="outline" onClick={() => csv('bilimbank-sessions.csv', list.map(b => ({ id: b.id, start: b.start_at, skill: b.skills?.name_en, learner: names[b.learner_id], teacher: names[b.teacher_id], minutes: b.duration_min, credits: b.credits, status: b.status })))}><Download size={16} aria-hidden />{d.admin.exportCsv}</Button>
      </div>
      {!rows ? <Skeleton className="h-64" /> : (
        <ul className="space-y-2">{list.map(b => { const st = displayStatus(b); const canResolve = ['disputed', 'confirmed', 'pending'].includes(b.status); return (
          <li key={b.id} className="rounded-2xl border border-line bg-white shadow-card">
            <button onClick={() => expand(b.id)} className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left" aria-expanded={open === b.id}>
              <span className="w-40 font-semibold tabular text-ink">{dateTime(b.start_at, tz, lang)}</span><span className="flex-1">{skillName(b.skills, lang)} · <span className="text-muted">{names[b.learner_id] || '—'} → {names[b.teacher_id] || '—'}</span></span>
              <span className="tabular text-sm">{num(b.credits)}</span><Badge tone={statusTone(st)}>{d.status[st as keyof typeof d.status]}</Badge></button>
            {open === b.id && <div className="space-y-3 border-t border-line px-4 py-3 text-sm">
              {!detail ? <Skeleton className="h-16" /> : <>
                <p className="text-xs text-muted">{d.sessions.learner}: {b.learner_done_at ? '✓' : '—'} · {d.sessions.teacher}: {b.teacher_done_at ? '✓' : '—'}</p>
                {detail.disputes.map((x, i) => <div key={i} className="rounded-xl bg-warn-50 p-3"><p className="font-semibold text-warn">{String(x.kind)} · {String(x.status)}</p><p>“{String(x.reason)}”</p>{x.response ? <p className="mt-1 text-muted">↳ “{String(x.response)}” ({x.respondent_agrees ? d.sessions.agree : d.sessions.disagree})</p> : null}</div>)}
                <div><p className="font-semibold text-navy">{d.admin.ledger}</p><ul className="mt-1 space-y-0.5 text-xs tabular">{detail.ledger.map((l, i) => <li key={i}>{dateTime(String(l.created_at), tz, lang)} · {names[String(l.user_id)] || ''} · {d.wallet.types[l.type as keyof typeof d.wallet.types]} · {num(Number(l.amount))} / {num(Number(l.held_change))}</li>)}</ul></div>
                {canResolve && <Button size="sm" onClick={() => setRes({ id: b.id, outcome: b.status === 'pending' ? 'void' : 'completed', note: '' })}>{d.admin.resolve}</Button>}
              </>}
            </div>}
          </li>); })}</ul>
      )}
      <ConfirmDialog open={!!res} onClose={() => setRes(null)} title={d.admin.resolve} confirmLabel={d.admin.resolve} busy={busy} onConfirm={resolve}>
        {res && <div className="space-y-3"><Field label={d.admin.outcome} htmlFor="res-o"><select id="res-o" className={inputCls} value={res.outcome} onChange={e => setRes({ ...res, outcome: e.target.value })}>{Object.entries(d.admin.outcomes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
          <Field label={d.admin.reason} htmlFor="res-n"><textarea id="res-n" rows={3} className={inputCls} value={res.note} onChange={e => setRes({ ...res, note: e.target.value })} /></Field></div>}
      </ConfirmDialog>
    </div>
  );
}

/* ---------- review queue ---------- */
function Queue() {
  const { d, toast, tz, lang } = useApp(); const sb = browserClient();
  const [data, setData] = useState<{ reports: Record<string, unknown>[]; flags: Record<string, unknown>[]; reviews: Record<string, unknown>[]; names: Record<string, string> } | null>(null);
  const load = useCallback(async () => {
    const [r, f, v] = await Promise.all([sb.from('reports').select('*').neq('status', 'closed').order('created_at', { ascending: false }).limit(100), sb.from('abuse_flags').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(100), sb.from('reviews').select('*').order('created_at', { ascending: false }).limit(30)]);
    const ids = Array.from(new Set([...(r.data || []).flatMap(x => [x.reporter_id, x.target_user_id]), ...(f.data || []).flatMap(x => [x.user_a, x.user_b]), ...(v.data || []).flatMap(x => [x.reviewer_id, x.teacher_id])].filter(Boolean)));
    const { data: ps } = ids.length ? await sb.from('profiles').select('id,display_name').in('id', ids) : { data: [] };
    setData({ reports: r.data || [], flags: f.data || [], reviews: v.data || [], names: Object.fromEntries((ps || []).map(p => [p.id, p.display_name])) });
  }, [sb]);
  useEffect(() => { load(); }, [load]);
  async function review(kind: string, id: number, status: string) { const { error } = await sb.rpc('admin_review', { p_kind: kind, p_id: id, p_status: status, p_note: null }); if (error) return toast(errorText(error, d), 'err'); toast(d.common.saved); load(); }
  if (!data) return <Skeleton className="h-64" />;
  const n = (id: unknown) => data.names[String(id)] || '—';
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section><h2 className="mb-3 font-bold text-navy">{d.admin.reports}</h2>{data.reports.length === 0 ? <p className="text-sm text-muted">{d.common.none}</p> : <ul className="space-y-2">{data.reports.map(r => (
        <li key={String(r.id)} className="rounded-2xl border border-line bg-white p-4 text-sm shadow-card"><div className="flex justify-between"><b>{d.sessions.reportReasons[r.reason as keyof typeof d.sessions.reportReasons]}</b><span className="text-xs text-muted">{dateTime(String(r.created_at), tz, lang)}</span></div>
          <p className="mt-1 text-muted">{n(r.reporter_id)} → {n(r.target_user_id)}{r.booking_id ? ` · #${String(r.booking_id).slice(0, 8)}` : ''}</p>{r.details ? <p className="mt-2">“{String(r.details)}”</p> : null}
          <div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={() => review('report', Number(r.id), 'reviewing')}>{d.admin.reviewing}</Button><Button size="sm" onClick={() => review('report', Number(r.id), 'closed')}>{d.admin.closed}</Button></div></li>))}</ul>}</section>
      <section><h2 className="mb-3 font-bold text-navy">{d.admin.flags}</h2>{data.flags.length === 0 ? <p className="text-sm text-muted">{d.common.none}</p> : <ul className="space-y-2">{data.flags.map(f => (
        <li key={String(f.id)} className="rounded-2xl border border-line bg-white p-4 text-sm shadow-card"><b>{n(f.user_a)} ↔ {n(f.user_b)}</b><p className="text-muted">{String(f.kind)} · {JSON.stringify(f.details)}</p>
          <div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={() => review('flag', Number(f.id), 'dismissed')}>{d.admin.dismiss}</Button><Button size="sm" onClick={() => review('flag', Number(f.id), 'actioned')}>{d.admin.actioned}</Button></div></li>))}</ul>}</section>
      <section className="lg:col-span-2"><h2 className="mb-3 font-bold text-navy">{d.admin.recentReviews}</h2><ul className="space-y-2">{data.reviews.map(v => (
        <li key={String(v.id)} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-4 text-sm shadow-card"><span className="font-bold text-emerald-700">{'★'.repeat(Number(v.rating))}</span><span className="flex-1">{n(v.reviewer_id)} → {n(v.teacher_id)}{v.body ? `: “${String(v.body)}”` : ''}</span>
          {v.hidden ? <Badge tone="warn">hidden</Badge> : null}<Button size="sm" variant="outline" onClick={() => review('review', Number(v.id), v.hidden ? 'visible' : 'hidden')}>{v.hidden ? d.admin.showReview : d.admin.hideReview}</Button></li>))}</ul></section>
    </div>
  );
}

/* ---------- skills ---------- */
function Skills() {
  const { d, toast, lang } = useApp(); const sb = browserClient();
  const [skills, setSkills] = useState<{ id: number; name_en: string; name_uz: string; category_id: number; status: string }[] | null>(null), [cats, setCats] = useState<{ id: number; name_en: string; name_uz: string }[]>([]);
  const [nw, setNw] = useState({ en: '', uz: '', cat: 0 }), [edit, setEdit] = useState<Record<number, { en: string; uz: string; merge: string }>>({});
  const load = useCallback(async () => { const [s, c] = await Promise.all([sb.from('skills').select('id,name_en,name_uz,category_id,status').order('name_en'), sb.from('skill_categories').select('id,name_en,name_uz').order('sort')]); setSkills(s.data || []); setCats(c.data || []); }, [sb]);
  useEffect(() => { load(); }, [load]);
  async function save(id: number | null, en: string | null, uz: string | null, cat: number | null, status: string | null, merge: number | null = null) {
    const { error } = await sb.rpc('admin_save_skill', { p_id: id, p_name_en: en, p_name_uz: uz, p_category: cat, p_status: status, p_merge_into: merge });
    if (error) return toast(errorText(error, d), 'err'); toast(d.common.saved); load();
  }
  if (!skills) return <Skeleton className="h-64" />;
  const suggested = skills.filter(s => s.status === 'suggested'), active = skills.filter(s => s.status === 'active');
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section><h2 className="mb-3 font-bold text-navy">{d.admin.suggested}</h2>{suggested.length === 0 ? <p className="text-sm text-muted">{d.common.none}</p> : <ul className="space-y-2">{suggested.map(s => { const e = edit[s.id] || { en: s.name_en, uz: s.name_uz, merge: '' }; return (
        <li key={s.id} className="space-y-2 rounded-2xl border border-line bg-white p-4 shadow-card">
          <div className="grid gap-2 sm:grid-cols-2"><input className={inputCls} aria-label={d.admin.nameEn} value={e.en} onChange={x => setEdit({ ...edit, [s.id]: { ...e, en: x.target.value } })} /><input className={inputCls} aria-label={d.admin.nameUz} value={e.uz} onChange={x => setEdit({ ...edit, [s.id]: { ...e, uz: x.target.value } })} /></div>
          <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => save(s.id, e.en, e.uz, null, 'active')}>{d.admin.approve}</Button><Button size="sm" variant="outline" onClick={() => save(s.id, null, null, null, 'disabled')}>{d.admin.disable}</Button>
            <select className="rounded-lg border border-line px-2 text-sm" aria-label={d.admin.mergeInto} value={e.merge} onChange={x => setEdit({ ...edit, [s.id]: { ...e, merge: x.target.value } })}><option value="">{d.admin.mergeInto}</option>{active.map(a => <option key={a.id} value={a.id}>{skillName(a, lang)}</option>)}</select>
            {e.merge && <Button size="sm" variant="outline" onClick={() => save(s.id, null, null, null, null, Number(e.merge))}>{d.common.confirm}</Button>}</div></li>); })}</ul>}</section>
      <section><h2 className="mb-3 font-bold text-navy">{d.admin.addSkill}</h2>
        <Card className="space-y-3 p-4"><input className={inputCls} placeholder={d.admin.nameEn} aria-label={d.admin.nameEn} value={nw.en} onChange={e => setNw({ ...nw, en: e.target.value })} /><input className={inputCls} placeholder={d.admin.nameUz} aria-label={d.admin.nameUz} value={nw.uz} onChange={e => setNw({ ...nw, uz: e.target.value })} />
          <select className={inputCls} aria-label={d.skills.category} value={nw.cat} onChange={e => setNw({ ...nw, cat: +e.target.value })}><option value={0}>{d.skills.category}</option>{cats.map(c => <option key={c.id} value={c.id}>{skillName(c, lang)}</option>)}</select>
          <Button disabled={!nw.en || !nw.uz || !nw.cat} onClick={() => { save(null, nw.en, nw.uz, nw.cat, 'active'); setNw({ en: '', uz: '', cat: 0 }); }}>{d.common.add}</Button></Card>
        <h2 className="mb-3 mt-6 font-bold text-navy">{d.nav.explore} ({active.length})</h2>
        <ul className="max-h-96 space-y-1 overflow-y-auto rounded-2xl border border-line bg-white p-2">{active.map(s => <li key={s.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-canvas"><span>{s.name_en} · <span className="text-muted">{s.name_uz}</span></span><button className="text-xs font-semibold text-danger" onClick={() => save(s.id, null, null, null, 'disabled')}>{d.admin.disable}</button></li>)}</ul></section>
    </div>
  );
}

/* ---------- settings ---------- */
function SettingsTab() {
  const { d, toast } = useApp(); const sb = browserClient();
  const [s, setS] = useState<Record<string, unknown> | null>(null), [busy, setBusy] = useState(false), [confirm, setConfirm] = useState(false);
  useEffect(() => { sb.from('platform_settings').select('*').single().then(({ data }) => setS(data)); }, [sb]);
  if (!s) return <Skeleton className="h-64" />;
  const numKeys = ['starter_credits', 'weekly_earning_cap', 'pair_weekly_cap', 'reciprocal_flag_threshold', 'cancel_deadline_hours', 'response_window_hours', 'noshow_penalty', 'noshow_response_hours'];
  async function save() {
    setBusy(true);
    const p: Record<string, unknown> = Object.fromEntries(numKeys.map(k => [k, Number(s![k])]));
    p.durations = String(s!.durations).split(',').map(x => Number(x.trim())).filter(Boolean); p.reminder_hours = String(s!.reminder_hours).split(',').map(x => Number(x.trim())).filter(Boolean);
    p.leaderboard_enabled = !!s!.leaderboard_enabled; p.announcement = s!.announcement || '';
    const { error } = await sb.rpc('admin_update_settings', { p }); setBusy(false); setConfirm(false);
    if (error) return toast(errorText(error, d), 'err'); toast(d.admin.settingsSaved);
  }
  return (
    <Card className="max-w-3xl p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {numKeys.map(k => <Field key={k} label={d.admin.s[k]} htmlFor={`s-${k}`}><input id={`s-${k}`} type="number" step="0.5" className={inputCls} value={String(s[k] ?? '')} onChange={e => setS({ ...s, [k]: e.target.value })} /></Field>)}
        <Field label={d.admin.s.durations} htmlFor="s-dur"><input id="s-dur" className={inputCls} value={String(s.durations)} onChange={e => setS({ ...s, durations: e.target.value })} /></Field>
        <Field label={d.admin.s.reminder_hours} htmlFor="s-rem"><input id="s-rem" className={inputCls} value={String(s.reminder_hours)} onChange={e => setS({ ...s, reminder_hours: e.target.value })} /></Field>
      </div>
      <label className="mt-4 flex items-center gap-2.5 text-sm"><input type="checkbox" className="h-4 w-4 accent-emerald-600" checked={!!s.leaderboard_enabled} onChange={e => setS({ ...s, leaderboard_enabled: e.target.checked })} />{d.admin.s.leaderboard_enabled}</label>
      <Field label={d.admin.s.announcement} htmlFor="s-ann" className="mt-4"><input id="s-ann" className={inputCls} maxLength={200} value={String(s.announcement || '')} onChange={e => setS({ ...s, announcement: e.target.value })} /></Field>
      <Button className="mt-5" onClick={() => setConfirm(true)}>{d.common.save}</Button>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} title={d.admin.confirmAction} text={d.admin.only} confirmLabel={d.common.save} busy={busy} onConfirm={save} />
    </Card>
  );
}

/* ---------- audit ---------- */
function Audit() {
  const { tz, lang, d } = useApp(); const sb = browserClient();
  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null), [names, setNames] = useState<Record<string, string>>({});
  useEffect(() => { (async () => { const { data } = await sb.from('admin_audit_logs').select('*').order('id', { ascending: false }).limit(200); setRows(data || []);
    const ids = Array.from(new Set((data || []).map(r => r.admin_id).filter(Boolean))); if (ids.length) { const { data: ps } = await sb.from('profiles').select('id,display_name').in('id', ids); setNames(Object.fromEntries((ps || []).map(p => [p.id, p.display_name]))); } })(); }, [sb]);
  if (!rows) return <Skeleton className="h-64" />;
  return rows.length === 0 ? <p className="text-sm text-muted">{d.common.none}</p> : (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-card"><table className="w-full text-sm"><tbody className="divide-y divide-line">{rows.map(r => (
      <tr key={String(r.id)}><td className="whitespace-nowrap px-4 py-2.5 text-muted tabular">{dateTime(String(r.created_at), tz, lang)}</td><td className="px-4 py-2.5 font-semibold">{names[String(r.admin_id)] || '—'}</td><td className="px-4 py-2.5">{String(r.action)}</td><td className="px-4 py-2.5 text-xs text-muted">{String(r.target_type)} {String(r.target_id).slice(0, 12)} · {JSON.stringify(r.details).slice(0, 160)}</td></tr>))}</tbody></table></div>
  );
}
