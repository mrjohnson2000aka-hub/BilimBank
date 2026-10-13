import type { Dict } from './i18n/en';
export type Lang = 'en' | 'uz';
export const fill = (s: string, v?: Record<string, string | number | null | undefined>) => s.replace(/\{(\w+)\}/g, (_, k) => (v && v[k] != null ? String(v[k]) : ''));
export const num = (n: number | string | null | undefined) => { const x = Math.round(Number(n || 0) * 10) / 10; return Number.isInteger(x) ? String(x) : x.toFixed(1); };
export function credits(n: number | string, d: Dict, lang: Lang) {
  const x = num(n);
  return lang === 'en' ? `${x} ${x === '1' ? d.common.credit : d.common.credits}` : `${x} ${d.common.credits}`;
}
// Dates are built from numeric parts plus our own month/weekday names, so the server and every browser print exactly the same text.
const WD = { en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], uz: ['Du', 'Se', 'Chor', 'Pay', 'Ju', 'Sha', 'Yak'] };
const MO = { en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], uz: ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'] };
export const WEEKDAYS_LONG = { en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], uz: ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'] };
export const WEEKDAYS_SHORT = WD;
const fmtCache = new Map<string, Intl.DateTimeFormat>();
function parts(dt: Date, tz: string) {
  let f = fmtCache.get(tz);
  if (!f) { f = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }); fmtCache.set(tz, f); }
  const p = Object.fromEntries(f.formatToParts(dt).map(x => [x.type, x.value]));
  return { y: p.year, m: Number(p.month), d: Number(p.day), wd: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(p.weekday), H: p.hour === '24' ? '00' : p.hour, M: p.minute };
}
type Opt = { weekday?: unknown; day?: unknown; month?: unknown; year?: unknown; hour?: unknown; minute?: unknown };
export function dateTime(iso: string | Date, tz: string, lang: Lang, o: Opt = { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) {
  const p = parts(new Date(iso), tz);
  let date = o.day ? `${p.d} ${MO[lang][p.m - 1]}${o.year ? ' ' + p.y : ''}` : '';
  if (o.weekday) date = `${WD[lang][p.wd]} ${date}`.trim();
  return [date, o.hour ? `${p.H}:${p.M}` : ''].filter(Boolean).join(', ');
}
export const dateOnly = (iso: string | Date, tz: string, lang: Lang) => dateTime(iso, tz, lang, { day: 'numeric', month: 'short', year: 'numeric' });
export const timeOnly = (iso: string | Date, tz: string, lang: Lang) => dateTime(iso, tz, lang, { hour: '2-digit', minute: '2-digit' });
export const dayLabel = (iso: string | Date, tz: string, lang: Lang) => dateTime(iso, tz, lang, { weekday: 'short', day: 'numeric', month: 'short' });
export function range(start: string, end: string, tz: string, lang: Lang) { return `${dateTime(start, tz, lang)}–${timeOnly(end, tz, lang)}`; }
export function skillName(s: { name_en?: string; name_uz?: string } | null | undefined, lang: Lang) { return s ? (lang === 'uz' ? s.name_uz || s.name_en : s.name_en) || '' : ''; }
export const initials = (n?: string | null) => (n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || '?';

export type Booking = { id: string; learner_id: string; teacher_id: string; skill_id: number; start_at: string; end_at: string; duration_min: number; credits: number; status: string;
  learner_done_at: string | null; teacher_done_at: string | null; respond_by: string; note: string | null; created_at: string; cancel_reason?: string | null };
/** What the person sees: stored status refined by the clock. */
export function displayStatus(b: Pick<Booking, 'status' | 'start_at' | 'end_at'>, now = Date.now()) {
  if (b.status === 'confirmed') {
    const s = Date.parse(b.start_at), e = Date.parse(b.end_at);
    return now < s ? 'upcoming' : now < e ? 'in_progress' : 'awaiting';
  }
  return b.status;
}
export const statusTone = (s: string) => ({ pending: 'warn', upcoming: 'info', confirmed: 'info', in_progress: 'ok', awaiting: 'warn', completed: 'ok', disputed: 'danger', no_show_learner: 'danger', no_show_teacher: 'danger' } as Record<string, string>)[s] || 'mute';
export function errorText(e: unknown, d: Dict) {
  const m = typeof e === 'string' ? e : (e as { message?: string })?.message || '';
  const hit = Object.keys(d.errors).find(k => m.includes(k));
  if (hit) return d.errors[hit];
  if (/duplicate key|unique/i.test(m)) return d.errors.duplicate;
  if (/fetch|network/i.test(m)) return d.errors.network;
  return d.common.somethingWrong;
}
export const TIMEZONES = ['Asia/Tashkent', 'Asia/Samarkand', 'Asia/Almaty', 'Asia/Bishkek', 'Asia/Dushanbe', 'Asia/Ashgabat', 'Asia/Baku', 'Asia/Tbilisi', 'Europe/Moscow', 'Europe/Istanbul',
  'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Asia/Dubai', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Seoul', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Singapore', 'Australia/Sydney',
  'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'America/Toronto', 'UTC'];
