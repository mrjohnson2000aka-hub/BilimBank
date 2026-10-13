import type { SupabaseClient } from '@supabase/supabase-js';
import { env, serverEnv } from './env';
import en from './i18n/en';
import uz from './i18n/uz';
import { credits, dateTime, fill, skillName, timeOnly } from './format';

type Lang = 'en' | 'uz';
const T = {
  en: {
    booking_request: ['New session request: {skill}', '{other} would like to learn {skill} with you.', 'Confirm or decline'],
    booking_confirmed: ['Confirmed: {skill} on {date}', 'Your session is confirmed.', 'Open session'],
    booking_declined: ['Request declined: {skill}', '{other} could not take this session. Your {credits} are back in your wallet.', 'Find another mentor'],
    booking_cancelled: ['Cancelled: {skill} on {date}', '{other} cancelled this session.', 'View details'],
    booking_expired: ['Request expired: {skill}', 'The request was not answered in time, so your {credits} were returned.', 'Find another mentor'],
    reminder: ['Reminder: {skill} starts in {hours} h', 'Your session with {other} starts soon.', 'Open session'],
    confirm_completion: ['Did your {skill} session take place?', 'Please confirm the session with {other}. Credits move to the teacher only after both of you confirm.', 'Confirm now'],
    credit_earned: ['You earned {credits}', 'Both of you confirmed the {skill} session with {other}.', 'Open wallet'],
    credit_refunded: ['{credits} returned to you', 'The credits held for {skill} with {other} are back in your wallet.', 'Open wallet'],
    review_request: ['How was {skill} with {other}?', 'Your review helps other students choose a mentor.', 'Leave a review'],
    no_show_reported: ['A no-show was reported for {skill}', '{other} reported that you did not attend. Please respond from the session page.', 'Respond'],
    dispute_resolved: ['Decision on your {skill} session', 'An administrator reviewed the session and made a decision. Details are on the session page.', 'Open session'],
    new_message: ['New message from {other}', '{other} sent you a message on BilimBank.', 'Read message'],
    labels: { when: 'When', length: 'Length', credits: 'Credits', status: 'Status', with: 'With', join: 'Google Meet link', footer: 'You receive this email because you have a BilimBank account. Manage notifications in Account settings.' }
  },
  uz: {
    booking_request: ['Yangi dars soʻrovi: {skill}', '{other} siz bilan {skill} oʻrganmoqchi.', 'Tasdiqlash yoki rad etish'],
    booking_confirmed: ['Tasdiqlandi: {skill}, {date}', 'Darsingiz tasdiqlandi.', 'Darsni ochish'],
    booking_declined: ['Soʻrov rad etildi: {skill}', '{other} bu darsni ola olmadi. {credits} hamyoningizga qaytdi.', 'Boshqa mentor topish'],
    booking_cancelled: ['Bekor qilindi: {skill}, {date}', '{other} bu darsni bekor qildi.', 'Batafsil'],
    booking_expired: ['Soʻrov muddati oʻtdi: {skill}', 'Soʻrovga vaqtida javob berilmadi, {credits} qaytarildi.', 'Boshqa mentor topish'],
    reminder: ['Eslatma: {skill} {hours} soatdan keyin', '{other} bilan darsingiz tez orada boshlanadi.', 'Darsni ochish'],
    confirm_completion: ['{skill} darsi boʻlib oʻtdimi?', '{other} bilan darsni tasdiqlang. Kreditlar faqat ikkalangiz tasdiqlagach oʻqituvchiga oʻtadi.', 'Hozir tasdiqlash'],
    credit_earned: ['Siz {credits} topdingiz', 'Ikkalangiz {other} bilan {skill} darsini tasdiqladingiz.', 'Hamyonni ochish'],
    credit_refunded: ['{credits} sizga qaytarildi', '{other} bilan {skill} uchun band qilingan kreditlar hamyoningizga qaytdi.', 'Hamyonni ochish'],
    review_request: ['{other} bilan {skill} qanday oʻtdi?', 'Fikringiz boshqa oʻquvchilarga mentor tanlashda yordam beradi.', 'Fikr qoldirish'],
    no_show_reported: ['{skill} boʻyicha kelmaganlik haqida xabar', '{other} siz darsga kelmaganingizni bildirdi. Dars sahifasidan javob bering.', 'Javob berish'],
    dispute_resolved: ['{skill} darsi boʻyicha qaror', 'Admin darsni koʻrib chiqdi va qaror qabul qildi. Tafsilotlar dars sahifasida.', 'Darsni ochish'],
    new_message: ['{other}dan yangi xabar', '{other} sizga BilimBankda xabar yubordi.', 'Xabarni oʻqish'],
    labels: { when: 'Vaqt', length: 'Davomiyligi', credits: 'Kredit', status: 'Holat', with: 'Kim bilan', join: 'Google Meet havolasi', footer: 'Bu xat sizda BilimBank hisobi borligi uchun yuborildi. Bildirishnomalarni Hisob sozlamalarida boshqaring.' }
  }
};
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

export async function sendDueEmails(admin: SupabaseClient, limit = 25) {
  const s = serverEnv(); const now = new Date().toISOString();
  const { data: due } = await admin.from('email_outbox').select('*').eq('status', 'queued').lte('send_after', now).order('id').limit(limit);
  const out = { sent: 0, skipped: 0, failed: 0 };
  for (const e of due || []) {
    // claim the row: only one runner can move attempts from n to n+1
    const { data: claimed } = await admin.from('email_outbox').update({ attempts: e.attempts + 1 }).eq('id', e.id).eq('attempts', e.attempts).eq('status', 'queued').select('id');
    if (!claimed?.length) continue;
    const mark = (status: string, err?: string) => admin.from('email_outbox').update({ status, last_error: err || null, sent_at: status === 'sent' ? new Date().toISOString() : null }).eq('id', e.id);
    try {
      if (!s.resendKey || !s.emailFrom) { await mark('skipped', 'email provider not configured'); out.skipped++; continue; }
      const { data: p } = await admin.from('profiles').select('display_name,preferred_lang,timezone,email_prefs,status').eq('id', e.user_id).single();
      if (!p || p.status === 'deleted') { await mark('skipped', 'recipient unavailable'); out.skipped++; continue; }
      const prefs = (p.email_prefs || {}) as Record<string, boolean>;
      if ((e.template === 'reminder' && prefs.reminders === false) || (!e.essential && prefs.messages === false)) { await mark('skipped', 'turned off by recipient'); out.skipped++; continue; }
      const { data: u } = await admin.auth.admin.getUserById(e.user_id);
      const to = u?.user?.email; if (!to) { await mark('skipped', 'no email'); out.skipped++; continue; }
      const msg = await compose(admin, e.template, e.dedupe_key, e.data || {}, e.user_id, p as { display_name: string; preferred_lang: Lang; timezone: string });
      if (!msg) { await mark('skipped', 'no longer relevant'); out.skipped++; continue; }
      const r = await fetch(`${process.env.RESEND_API_BASE || 'https://api.resend.com'}/emails`, { method: 'POST', headers: { Authorization: `Bearer ${s.resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: s.emailFrom, to: [to], subject: msg.subject, html: msg.html, text: msg.text }) });
      if (!r.ok) throw new Error(`Resend ${r.status}: ${(await r.text()).slice(0, 200)}`);
      await mark('sent'); out.sent++;
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      if (e.attempts + 1 >= 5) await admin.from('email_outbox').update({ status: 'failed', last_error: m }).eq('id', e.id);
      else await admin.from('email_outbox').update({ last_error: m, send_after: new Date(Date.now() + 5 * 60000 * (e.attempts + 1)).toISOString() }).eq('id', e.id);
      out.failed++;
    }
  }
  return out;
}

async function compose(admin: SupabaseClient, template: string, key: string, data: Record<string, unknown>, uid: string, p: { display_name: string; preferred_lang: Lang; timezone: string }) {
  const lang: Lang = p.preferred_lang === 'uz' ? 'uz' : 'en', d = lang === 'uz' ? uz : en, t = T[lang], tz = p.timezone || 'Asia/Tashkent';
  const tpl = (t as unknown as Record<string, string[]>)[template]; if (!tpl) return null;
  let bookingId = key.match(UUID)?.[0] || null, url = `${env.siteUrl}/sessions`, other = '';
  if (template === 'no_show_reported') { const { data: ds } = await admin.from('disputes').select('booking_id').eq('id', Number(key.split(':')[1])).maybeSingle(); bookingId = ds?.booking_id || null; }
  if (template === 'new_message') {
    const { data: c } = await admin.from('conversations').select('user_a,user_b').eq('id', data.conversation).maybeSingle();
    if (!c) return null; const oid = c.user_a === uid ? c.user_b : c.user_a;
    const { data: o } = await admin.from('profiles').select('display_name').eq('id', oid).maybeSingle(); other = o?.display_name || '';
    url = `${env.siteUrl}/messages?c=${data.conversation}`; bookingId = null;
    const v = { other }; const [subject, line, cta] = tpl.map(x => fill(x, v));
    return wrap(subject, [line], [], url, cta, t.labels.footer); // the message text itself is never put in the email
  }
  if (!bookingId) return null;
  const { data: b } = await admin.from('bookings').select('*, skills(name_en,name_uz)').eq('id', bookingId).maybeSingle();
  if (!b) return null;
  const isLearner = b.learner_id === uid, oid = isLearner ? b.teacher_id : b.learner_id;
  if (template === 'reminder' && b.status !== 'confirmed') return null;
  if (template === 'confirm_completion' && (b.status !== 'confirmed' || (isLearner ? b.learner_done_at : b.teacher_done_at))) return null;
  if (template === 'review_request') { const { data: r } = await admin.from('reviews').select('id').eq('booking_id', b.id).maybeSingle(); if (r || b.status !== 'completed') return null; }
  const { data: o } = await admin.from('profiles').select('display_name').eq('id', oid).maybeSingle(); other = o?.display_name || '';
  const { data: priv } = await admin.from('booking_private').select('meet_url').eq('booking_id', b.id).maybeSingle();
  url = template === 'credit_earned' || template === 'credit_refunded' ? `${env.siteUrl}/wallet` : `${env.siteUrl}/sessions/${b.id}`;
  const skill = skillName(b.skills, lang), date = dateTime(b.start_at, tz, lang);
  const v = { skill, other, date, credits: credits(b.credits, d, lang), hours: String(data.hours ?? '') };
  const [subject, line, cta] = tpl.map(x => fill(x, v));
  const st = b.status === 'confirmed' ? d.status.confirmed : d.status[b.status as keyof typeof d.status] || b.status;
  const rows: [string, string][] = [[t.labels.with, other], [t.labels.when, `${date}–${timeOnly(b.end_at, tz, lang)} (${tz})`], [t.labels.length, `${b.duration_min} ${d.common.minutes}`], [t.labels.credits, credits(b.credits, d, lang)], [t.labels.status, st]];
  if (priv?.meet_url && ['booking_confirmed', 'reminder'].includes(template)) rows.push([t.labels.join, priv.meet_url]);
  return wrap(subject, [line], rows, url, cta, t.labels.footer);
}

function wrap(subject: string, lines: string[], rows: [string, string][], url: string, cta: string, footer: string) {
  const html = `<!doctype html><html><body style="margin:0;background:#F7F9FC;font-family:Arial,Helvetica,sans-serif;color:#172033">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" style="max-width:560px;background:#fff;border:1px solid #E2E8F0;border-radius:16px" cellpadding="0" cellspacing="0">
<tr><td style="background:#142B4A;border-radius:16px 16px 0 0;padding:18px 24px;color:#fff;font-weight:bold;font-size:18px">Bilim<span style="color:#18A875">Bank</span></td></tr>
<tr><td style="padding:24px"><h1 style="margin:0 0 12px;font-size:20px;color:#142B4A">${esc(subject)}</h1>${lines.map(l => `<p style="margin:0 0 14px;line-height:1.5">${esc(l)}</p>`).join('')}
${rows.length ? `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:6px 0 18px;font-size:14px">${rows.map(([k, v]) => `<tr><td style="padding:6px 0;color:#5A6578;width:40%">${esc(k)}</td><td style="padding:6px 0;font-weight:bold">${/^https:\/\//.test(v) ? `<a href="${esc(v)}" style="color:#0D7350">${esc(v)}</a>` : esc(v)}</td></tr>`).join('')}</table>` : ''}
<a href="${esc(url)}" style="display:inline-block;background:#12865D;color:#fff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:10px">${esc(cta)}</a></td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #E2E8F0;font-size:12px;color:#5A6578">${esc(footer)}</td></tr></table></td></tr></table></body></html>`;
  const text = [subject, '', ...lines, '', ...rows.map(([k, v]) => `${k}: ${v}`), '', `${cta}: ${url}`, '', footer].join('\n');
  return { subject, html, text };
}
