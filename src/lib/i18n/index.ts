import { cookies, headers } from 'next/headers';
import en, { type Dict } from './en';
import uz from './uz';
export type Lang = 'en' | 'uz';
export type { Dict };
export function getLang(): Lang {
  const c = cookies().get('lang')?.value;
  if (c === 'uz' || c === 'en') return c;
  return /^uz/i.test(headers().get('accept-language') || '') ? 'uz' : 'en';
}
export function getDict(lang: Lang = getLang()): Dict { return lang === 'uz' ? uz : en; }
export function getViewerTz(profileTz?: string | null): string {
  const tz = profileTz || cookies().get('tz')?.value || 'Asia/Tashkent';
  try { new Intl.DateTimeFormat('en', { timeZone: tz }); return tz; } catch { return 'Asia/Tashkent'; }
}
export { en, uz };
