'use client';
import { useState } from 'react';
import { Ban, Flag } from 'lucide-react';
import { browserClient } from '@/lib/supabase/client';
import { useApp } from './Providers';
import { Dialog } from './ConfirmDialog';
import { Button, Field, inputCls } from './ui';
import { errorText } from '@/lib/format';

export function ReportButton({ targetUser, bookingId, label }: { targetUser?: string; bookingId?: string; label?: string }) {
  const { d, toast } = useApp();
  const [open, setOpen] = useState(false), [reason, setReason] = useState('other'), [text, setText] = useState(''), [busy, setBusy] = useState(false);
  async function send() {
    setBusy(true);
    const { data: u } = await browserClient().auth.getUser();
    const { error } = await browserClient().from('reports').insert({ reporter_id: u.user?.id, target_user_id: targetUser || null, booking_id: bookingId || null, reason, details: text.trim() || null });
    setBusy(false);
    if (error) return toast(errorText(error, d), 'err');
    setOpen(false); setText(''); toast(d.sessions.reported);
  }
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}><Flag size={15} aria-hidden />{label || d.sessions.report}</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={d.sessions.reportTitle}>
        <div className="space-y-3">
          <Field label={d.admin.reason.split(' (')[0]} htmlFor="rp-reason"><select id="rp-reason" className={inputCls} value={reason} onChange={e => setReason(e.target.value)}>{Object.entries(d.sessions.reportReasons).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
          <textarea rows={4} maxLength={1500} className={inputCls} placeholder={d.sessions.reportPh} aria-label={d.sessions.reportPh} value={text} onChange={e => setText(e.target.value)} />
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>{d.common.cancel}</Button><Button onClick={send} disabled={busy}>{d.sessions.sendReport}</Button></div>
        </div>
      </Dialog>
    </>
  );
}
export function BlockButton({ me, other, initial }: { me: string; other: string; initial: boolean }) {
  const { d, toast } = useApp();
  const [blocked, setBlocked] = useState(initial);
  async function toggle() {
    const sb = browserClient();
    const { error } = blocked ? await sb.from('user_blocks').delete().eq('blocker_id', me).eq('blocked_id', other) : await sb.from('user_blocks').insert({ blocker_id: me, blocked_id: other });
    if (error) return toast(errorText(error, d), 'err');
    setBlocked(!blocked);
  }
  return <Button variant="ghost" size="sm" onClick={toggle}><Ban size={15} aria-hidden />{blocked ? d.profile.unblock : d.profile.block}</Button>;
}
