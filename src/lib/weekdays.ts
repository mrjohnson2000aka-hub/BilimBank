import { WEEKDAYS_LONG, WEEKDAYS_SHORT } from './format';
export function weekdayNames(lang: 'en' | 'uz', style: 'long' | 'short' = 'long') { return (style === 'long' ? WEEKDAYS_LONG : WEEKDAYS_SHORT)[lang]; }
export const HALF_HOURS = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);
