'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AlertTriangle, MessageCircle, Video } from 'lucide-react';
import { browserClient } from '@/lib/supabase/client';
import { useApp } from '@/components/Providers';
import { ConfirmDialog, Dialog } from '@/components/ConfirmDialog';
import SlotPicker from '@/components/SlotPicker';
import { Button, Card, Field, btn, inputCls } from '@/components/ui';
import { displayStatus, errorText, fill, type Booking } from '@/lib/format';

type Meet = { meet_url: string | null; meet_source: string; meet_error: string | null; session_notes: string | null } | null;
type Dispute = { id: number; kind: string; opened_by: string; accused_id: string | null; reason: string; status: string; respond_by: string | null } | null;

const flush = () => fetch('/api/outbox/flush', { method: 'POST' }).catch(() => {});

export default function SessionActions({ booking: b, me, other, meet, dispute, reviewed, calendar, googleReady, cancelHours, noShowHours, conversationId }: {
  booking: Booking; me: string; other: { name: string }; meet: Meet; dispute: Dispute; reviewed: boolean; calendar: { connected: boolean } | null; googleReady: boolean;
  cancelHours: number; noShowHours: number; conversationId: string | null }) {
  const { d, toast } = useApp();
  const router = useRouter(), sb = browserClient();
  const [mounted, setMounted] = useState(false), [now, setNow] = useState(Date.now()), [busy, setBusy] = useState(false), [dlg, setDlg] = useState<string | null>(null);
  const [reason, setReason] = useState(''), [kind, setKind] = useState('quality'), [paste, setPaste] = useState(''), [notes, setNotes] = useState(meet?.session_notes || '');
  const [rv, setRv] = useState({ rating: 0, preparation: 0, clarity: 0, helpfulness: 0, body: '' }), [newSlot, setNewSlot] = useState<string | null>(null);
  useEffect(() => { setMounted(true); setNow(Date.now()); const h = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(h); }, []);
  const isTeacher = b.teacher_id === me, st = displayStatus(b, now);
  const start = Date.parse(b.start_at), started = now >= start, myDone = isTeacher ? b.teacher_done_at : b.learner_done_at;
  const canCancel = (b.status === 'pending' || (b.status === 'confirmed' && now < start - cancelHours * 36e5)) && !started;
  const run = async (fn: () => PromiseLike<{ error: { message: string } | null }>, ok?: string, after?: () => Promise<unknown>) => {
    setBusy(true);
    const { error } = await fn();
    if (!error && after) await after();
    setBusy(false); setDlg(null);
    if (error) return toast(errorText(error, d), 'err');
    if (ok) toast(ok);
    flush(); router.refresh();
  };
  const left = start - now, dd = Math.floor(left / 864e5), hh = Math.floor((left % 864e5) / 36e5), mm = Math.max(0, Math.floor((left % 36e5) / 6e4));
  const countdown = dd > 0 ? fill(d.sessions.countdownDays, { d: dd, h: hh }) : hh > 0 ? fill(d.sessions.countdownHours, { h: hh, m: mm }) : fill(d.sessions.countdownMin, { m: mm });
  const Star = ({ k }: { k: keyof typeof rv }) => (
    <div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-ink">{k === 'rating' ? d.sessions.overall : d.sessions[k as 'preparation']}</span>
      <div className="flex" role="radiogroup" aria-label={String(k)}>{[1, 2, 3, 4, 5].map(i => <button key={i} type="button" role="radio" aria-checked={rv[k] === i} aria-label={`${i}`} onClick={() => setRv({ ...rv, [k]: i })} className={`px-0.5 text-2xl leading-none ${Number(rv[k]) >= i ? 'text-emerald' : 'text-line'}`}>★</button>)}</div></div>
  );

  return (
    <div className="space-y-6">
      {/* status line + primary actions */}
      <Card className="p-5">
        {mounted && (st === 'upcoming' || st === 'pending') && <p className="text-sm font-semibold text-emerald-700">{fill(d.sessions.startsIn, { t: countdown })}</p>}
        {st === 'in_progress' && <p className="text-sm font-semibold text-emerald-700">{d.sessions.started}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {b.status === 'pending' && isTeacher && <>
            <Button disabled={busy} onClick={() => run(() => sb.rpc('respond_booking', { p_booking: b.id, p_accept: true }), d.status.confirmed, () => fetch(`/api/bookings/${b.id}/meet`, { method: 'POST' }))}>{d.sessions.confirm}</Button>
            <Button variant="outline" disabled={busy} onClick={() => setDlg('decline')}>{d.sessions.decline}</Button></>}
          {(st === 'upcoming' || st === 'in_progress') && meet?.meet_url && <a href={meet.meet_url} target="_blank" rel="noopener noreferrer" className={btn('primary')}><Video size={17} aria-hidden />{d.sessions.join}</a>}
          {b.status === 'confirmed' && started && !myDone && <Button disabled={busy} onClick={() => setDlg('done')}>{d.sessions.confirmDone}</Button>}
          {b.status === 'confirmed' && now >= start + 10 * 6e4 && !myDone && <Button variant="outline" disabled={busy} onClick={() => setDlg('noshow')}>{d.sessions.reportNoShow}</Button>}
          {!isTeacher && ['pending', 'confirmed'].includes(b.status) && canCancel && <Button variant="outline" onClick={() => setDlg('resched')}>{d.sessions.reschedule}</Button>}
          {canCancel && <Button variant="danger" onClick={() => setDlg('cancel')}>{d.sessions.cancel}</Button>}
          {((b.status === 'confirmed' && started) || b.status === 'completed') && !dispute && <Button variant="ghost" onClick={() => setDlg('dispute')}>{d.sessions.openDispute}</Button>}
          {conversationId && <Link href={`/messages?c=${conversationId}`} className={btn('ghost')}><MessageCircle size={17} aria-hidden />{d.sessions.message}</Link>}
        </div>
        {b.status === 'confirmed' && started && myDone && <p className="mt-3 text-sm text-muted">{fill(d.sessions.waitingOther, { name: other.name })}</p>}
        {b.status === 'confirmed' && !started && <p className="mt-3 text-xs text-muted">{fill(d.sessions.cancelDeadline, { h: cancelHours })}</p>}
      </Card>

      {/* dispute status */}
      {dispute && (
        <Card className="border-warn/40 p-5">
          <p className="flex items-center gap-2 font-bold text-warn"><AlertTriangle size={18} aria-hidden />{dispute.accused_id === me && dispute.status === 'awaiting_response' ? fill(d.sessions.respondTitle, { name: other.name }) : d.sessions.underReview}</p>
          <p className="mt-2 text-sm text-ink">“{dispute.reason}”</p>
          {dispute.accused_id === me && dispute.status === 'awaiting_response' && (
            <div className="mt-4 space-y-3"><p className="text-sm text-muted">{d.sessions.respondText}</p>
              <textarea rows={3} maxLength={1500} className={inputCls} placeholder={d.sessions.responsePh} aria-label={d.sessions.responsePh} value={reason} onChange={e => setReason(e.target.value)} />
              <div className="flex gap-2"><Button variant="outline" disabled={busy} onClick={() => run(() => sb.rpc('respond_dispute', { p_dispute: dispute.id, p_agree: true, p_text: reason || null }))}>{d.sessions.agree}</Button>
                <Button disabled={busy} onClick={() => run(() => sb.rpc('respond_dispute', { p_dispute: dispute.id, p_agree: false, p_text: reason || null }))}>{d.sessions.disagree}</Button></div></div>
          )}
        </Card>
      )}

      {/* meeting link */}
      {['confirmed', 'disputed'].includes(b.status) && (
        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-bold text-navy"><Video size={18} className="text-emerald" aria-hidden />{d.sessions.meetTitle}</h2>
          {meet?.meet_url ? <p className="mt-2 text-sm text-ink">{d.sessions.meetReady} <a href={meet.meet_url} target="_blank" rel="noopener noreferrer" className="break-all font-semibold text-emerald-700 underline">{meet.meet_url}</a></p>
            : !isTeacher ? <p className="mt-2 text-sm text-muted">{d.sessions.meetWaiting}</p> : (
              <div className="mt-3 space-y-3">
                {meet?.meet_error && <p className="text-sm text-danger">{fill(d.sessions.meetFailed, { e: meet.meet_error })}</p>}
                {googleReady && calendar?.connected ? <Button disabled={busy} onClick={async () => { setBusy(true); const r = await fetch(`/api/bookings/${b.id}/meet`, { method: 'POST' }); setBusy(false); if (!r.ok) toast((await r.json().catch(() => ({}))).error || d.common.somethingWrong, 'err'); flush(); router.refresh(); }}>{d.sessions.meetCreate}</Button>
                  : <p className="text-sm text-muted">{googleReady ? <>{d.sessions.meetConnectHint} <Link href="/settings/account" className="font-semibold text-emerald-700">{d.settings.connect}</Link></> : d.sessions.meetNotSetUp}</p>}
                <div className="flex flex-col gap-2 sm:flex-row"><label className="flex-1"><span className="sr-only">{d.sessions.meetPaste}</span><input className={inputCls} placeholder={d.sessions.meetPastePh} value={paste} onChange={e => setPaste(e.target.value.trim())} /></label>
                  <Button variant="outline" disabled={busy || !paste} onClick={() => run(() => sb.rpc('set_meet_link', { p_booking: b.id, p_url: paste }), d.common.saved)}>{d.sessions.meetSave}</Button></div>
              </div>)}
        </Card>
      )}

      {/* review */}
      {!isTeacher && b.status === 'completed' && (
        <Card className="p-5">
          <h2 className="font-bold text-navy">{d.sessions.reviewTitle}</h2>
          {reviewed ? <p className="mt-2 text-sm text-muted">{d.sessions.reviewed}</p> : (
            <div className="mt-3 space-y-2.5">
              <Star k="rating" /><Star k="preparation" /><Star k="clarity" /><Star k="helpfulness" />
              <textarea rows={3} maxLength={600} className={inputCls} placeholder={d.sessions.reviewPh} aria-label={d.sessions.reviewPh} value={rv.body} onChange={e => setRv({ ...rv, body: e.target.value })} />
              <Button disabled={busy || !rv.rating} onClick={() => run(() => sb.rpc('submit_review', { p_booking: b.id, p_rating: rv.rating, p_preparation: rv.preparation || null, p_clarity: rv.clarity || null, p_helpfulness: rv.helpfulness || null, p_body: rv.body || null }), d.sessions.reviewed)}>{d.sessions.submitReview}</Button>
            </div>)}
        </Card>
      )}

      {/* shared notes */}
      {!['cancelled', 'declined', 'expired', 'void'].includes(b.status) && (
        <Card className="p-5">
          <Field label={d.sessions.notes} htmlFor="notes"><textarea id="notes" rows={4} maxLength={2000} className={inputCls} placeholder={d.sessions.notesPh} value={notes} onChange={e => setNotes(e.target.value)} /></Field>
          <Button variant="outline" size="sm" className="mt-3" disabled={busy} onClick={() => run(() => sb.rpc('save_session_notes', { p_booking: b.id, p_notes: notes }), d.common.saved)}>{d.sessions.saveNotes}</Button>
        </Card>
      )}

      {/* dialogs */}
      <ConfirmDialog open={dlg === 'decline'} onClose={() => setDlg(null)} title={d.sessions.decline} confirmLabel={d.sessions.decline} danger busy={busy}
        onConfirm={() => run(() => sb.rpc('respond_booking', { p_booking: b.id, p_accept: false }), d.status.declined)} />
      <ConfirmDialog open={dlg === 'cancel'} onClose={() => setDlg(null)} title={d.sessions.cancelTitle} text={isTeacher ? d.sessions.cancelTeacher : d.sessions.cancelLearner} confirmLabel={d.sessions.cancel} danger busy={busy}
        onConfirm={() => run(() => sb.rpc('cancel_booking', { p_booking: b.id, p_reason: reason || null }), d.status.cancelled, () => fetch(`/api/bookings/${b.id}/meet`, { method: 'DELETE' }))}>
        <textarea rows={2} maxLength={300} className={inputCls} placeholder={d.sessions.reasonPh} aria-label={d.sessions.reasonPh} value={reason} onChange={e => setReason(e.target.value)} />
      </ConfirmDialog>
      <ConfirmDialog open={dlg === 'done'} onClose={() => setDlg(null)} title={d.sessions.doneTitle} text={d.sessions.doneText} confirmLabel={d.sessions.confirmDone} busy={busy}
        onConfirm={() => run(() => sb.rpc('confirm_completion', { p_booking: b.id }), d.common.saved)} />
      <ConfirmDialog open={dlg === 'noshow'} onClose={() => setDlg(null)} title={d.sessions.noShowTitle} text={fill(d.sessions.noShowText, { name: other.name, h: noShowHours })} confirmLabel={d.sessions.reportNoShow} danger busy={busy}
        onConfirm={() => run(() => sb.rpc('report_no_show', { p_booking: b.id, p_reason: reason }), d.sessions.reported)}>
        <textarea rows={3} maxLength={1500} className={inputCls} placeholder={d.sessions.noShowPh} aria-label={d.sessions.noShowPh} value={reason} onChange={e => setReason(e.target.value)} />
      </ConfirmDialog>
      <ConfirmDialog open={dlg === 'dispute'} onClose={() => setDlg(null)} title={d.sessions.disputeTitle} text={d.sessions.disputeText} confirmLabel={d.sessions.openDispute} busy={busy}
        onConfirm={() => reason.trim().length >= 3 ? run(() => sb.rpc('open_dispute', { p_booking: b.id, p_kind: kind, p_reason: reason.trim() }), d.sessions.reported) : toast(d.errors.reason_required, 'err')}>
        <div className="space-y-2"><select className={inputCls} value={kind} onChange={e => setKind(e.target.value)} aria-label={d.admin.outcome}>{Object.entries(d.sessions.disputeKinds).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <textarea rows={3} maxLength={1500} className={inputCls} placeholder={d.sessions.reportPh} aria-label={d.sessions.reportPh} value={reason} onChange={e => setReason(e.target.value)} /></div>
      </ConfirmDialog>
      <Dialog open={dlg === 'resched'} onClose={() => setDlg(null)} title={d.sessions.rescheduleTitle} wide>
        <p className="mb-3 text-sm text-muted">{fill(d.sessions.rescheduleText, { name: other.name })}</p>
        <SlotPicker teacherId={b.teacher_id} duration={b.duration_min} value={newSlot} onPick={setNewSlot} />
        <div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => setDlg(null)}>{d.common.cancel}</Button>
          <Button disabled={!newSlot || busy} onClick={async () => { setBusy(true); const { data, error } = await sb.rpc('reschedule_booking', { p_booking: b.id, p_new_start: newSlot }); setBusy(false); setDlg(null);
            if (error) return toast(errorText(error, d), 'err'); fetch(`/api/bookings/${b.id}/meet`, { method: 'DELETE' }).catch(() => {}); flush(); router.push(`/sessions/${data}`); router.refresh(); }}>{d.common.confirm}</Button></div>
      </Dialog>
    </div>
  );
}
