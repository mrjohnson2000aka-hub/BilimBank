'use client';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import en from '@/lib/i18n/en';
import uz from '@/lib/i18n/uz';
import type { Dict } from '@/lib/i18n/en';
import type { Lang } from '@/lib/format';

type Ctx = { lang: Lang; d: Dict; tz: string; toast: (msg: string, tone?: 'ok' | 'err') => void };
const C = createContext<Ctx>({ lang: 'en', d: en, tz: 'Asia/Tashkent', toast: () => {} });
export const useApp = () => useContext(C);

export function Providers({ lang, tz, children }: { lang: Lang; tz: string; children: ReactNode }) {
  const [t, setT] = useState<{ msg: string; tone: 'ok' | 'err'; id: number } | null>(null);
  const toast = useCallback((msg: string, tone: 'ok' | 'err' = 'ok') => setT({ msg, tone, id: Date.now() }), []);
  useEffect(() => { if (!t) return; const h = setTimeout(() => setT(null), 4200); return () => clearTimeout(h); }, [t]);
  useEffect(() => {
    // remember the browser time zone for visitors who are not signed in
    try { const z = Intl.DateTimeFormat().resolvedOptions().timeZone; if (z && !document.cookie.includes('tz=')) document.cookie = `tz=${encodeURIComponent(z)};path=/;max-age=31536000;samesite=lax`; } catch { /* ignore */ }
  }, []);
  return (
    <C.Provider value={{ lang, d: lang === 'uz' ? uz : en, tz, toast }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4">
        {t && <div key={t.id} className={`pointer-events-auto max-w-md rounded-xl px-4 py-3 text-sm font-semibold shadow-pop ${t.tone === 'err' ? 'bg-danger text-white' : 'bg-navy text-white'}`}>{t.msg}</div>}
      </div>
    </C.Provider>
  );
}
