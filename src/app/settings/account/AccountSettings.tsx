'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CalendarCheck, Download, Trash2 } from 'lucide-react';
import { Button, Card, Field, btn, inputCls } from '@/components/ui';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useApp } from '@/components/Providers';
import { browserClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/supabase/server';
import { errorText, fill } from '@/lib/format';

export default function AccountSettings({ profile, email, calendar, googleReady, googleResult }: { profile: Profile; email: string; calendar: { connected: boolean; email?: string }; googleReady: boolean; googleResult: string | null }) {
  const { d, toast } = useApp();
  const router = useRouter(), sb = browserClient();
  const [prefs, setPrefs] = useState({ messages: true, reminders: true, calendar_invite: true, ...profile.email_prefs });
  const [lang, setLang] = useState(profile.preferred_lang), [del, setDel] = useState(false), [confirmText, setConfirmText] = useState(''), [busy, setBusy] = useState(false);
  async function savePrefs(next: typeof prefs) {
    setPrefs(next);
    const { error } = await sb.from('profiles').update({ email_prefs: next }).eq('id', profile.id);
    if (error) toast(errorText(error, d), 'err'); else toast(d.common.saved);
  }
  async function saveLang(l: 'en' | 'uz') {
    setLang(l); document.cookie = `lang=${l};path=/;max-age=31536000;samesite=lax`;
    await sb.from('profiles').update({ preferred_lang: l }).eq('id', profile.id); router.refresh();
  }
  async function remove() {
    setBusy(true); const r = await fetch('/api/account/delete', { method: 'POST' }); setBusy(false);
    if (!r.ok) { const j = await r.json().catch(() => ({})); return toast(j.error === 'open_sessions' ? d.settings.deleteBlocked : d.common.somethingWrong, 'err'); }
    await sb.auth.signOut(); location.href = '/';
  }
  const Toggle = ({ k, label }: { k: keyof typeof prefs; label: string }) => <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" className="h-4 w-4 accent-emerald-600" checked={!!prefs[k]} onChange={e => savePrefs({ ...prefs, [k]: e.target.checked })} />{label}</label>;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="space-y-4 p-5 sm:p-6">
        <h2 className="text-lg font-bold text-navy">{d.settings.emailPrefs}</h2>
        <p className="text-sm text-muted">{email} · {d.settings.prefEssential}</p>
        <Toggle k="messages" label={d.settings.prefMessages} /><Toggle k="reminders" label={d.settings.prefReminders} /><Toggle k="calendar_invite" label={d.settings.prefCalendar} />
        <Field label={d.settings.language} htmlFor="lang"><select id="lang" className={inputCls} value={lang} onChange={e => saveLang(e.target.value as 'en' | 'uz')}><option value="en">English</option><option value="uz">Oʻzbekcha</option></select></Field>
      </Card>
      <Card className="space-y-3 p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-navy"><CalendarCheck size={20} className="text-emerald" aria-hidden />{d.settings.calendar}</h2>
        <p className="text-sm text-muted">{d.settings.calendarText}</p>
        {googleResult === 'error' && <p className="text-sm text-danger">{d.common.somethingWrong}</p>}
        {!googleReady ? <p className="rounded-xl bg-canvas p-3 text-sm text-muted">{d.settings.calendarUnavailable}</p>
          : calendar.connected ? <div className="flex flex-wrap items-center gap-3"><span className="text-sm font-semibold text-emerald-700">{fill(d.settings.connected, { email: calendar.email || '' })}</span>
              <Button variant="outline" size="sm" onClick={async () => { await fetch('/api/google/disconnect', { method: 'POST' }); router.refresh(); }}>{d.settings.disconnect}</Button></div>
            : <a href="/api/google/connect" className={btn('navy', 'md')}>{d.settings.connect}</a>}
      </Card>
      <Card className="space-y-3 p-5 sm:p-6">
        <h2 className="text-lg font-bold text-navy">{d.settings.data}</h2>
        <a href="/api/account/export" className={btn('outline', 'md')}><Download size={17} aria-hidden />{d.settings.export}</a>
      </Card>
      <Card className="space-y-3 border-danger/30 p-5 sm:p-6">
        <h2 className="text-lg font-bold text-danger">{d.settings.deleteTitle}</h2>
        <p className="text-sm text-muted">{d.settings.deleteText}</p>
        <Button variant="danger" onClick={() => setDel(true)}><Trash2 size={17} aria-hidden />{d.settings.deleteBtn}</Button>
      </Card>
      <ConfirmDialog open={del} onClose={() => setDel(false)} title={d.settings.deleteTitle} text={d.settings.deleteText} confirmLabel={d.settings.deleteBtn} danger busy={busy} onConfirm={() => confirmText === 'DELETE' ? remove() : toast(d.settings.deleteConfirm, 'err')}>
        <Field label={d.settings.deleteConfirm} htmlFor="del"><input id="del" className={inputCls} value={confirmText} onChange={e => setConfirmText(e.target.value)} autoComplete="off" /></Field>
      </ConfirmDialog>
    </div>
  );
}
