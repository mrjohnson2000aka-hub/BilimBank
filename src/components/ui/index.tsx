import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { initials } from '@/lib/format';

const base = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap';
const variants = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700',
  navy: 'bg-navy text-white hover:bg-navy-600',
  outline: 'border border-line bg-white text-ink hover:border-navy-100 hover:bg-navy-50',
  ghost: 'text-ink hover:bg-navy-50',
  danger: 'border border-danger/30 bg-white text-danger hover:bg-danger-50'
};
const sizes = { sm: 'h-9 px-3 text-sm', md: 'h-11 px-4 text-[15px]', lg: 'h-12 px-6 text-base' };
type V = keyof typeof variants; type S = keyof typeof sizes;
export const btn = (v: V = 'primary', s: S = 'md', x = '') => `${base} ${variants[v]} ${sizes[s]} ${x}`;
export function Button({ variant = 'primary', size = 'md', className = '', ...p }: ComponentProps<'button'> & { variant?: V; size?: S }) {
  return <button {...p} className={btn(variant, size, className)} />;
}
export function LinkButton({ variant = 'primary', size = 'md', className = '', ...p }: ComponentProps<typeof Link> & { variant?: V; size?: S }) {
  return <Link {...p} className={btn(variant, size, className)} />;
}
export function Card({ className = '', ...p }: ComponentProps<'div'>) { return <div {...p} className={`rounded-2xl border border-line bg-white shadow-card ${className}`} />; }
const tones: Record<string, string> = { ok: 'bg-emerald-50 text-emerald-700', warn: 'bg-warn-50 text-warn', danger: 'bg-danger-50 text-danger', info: 'bg-info-50 text-info', mute: 'bg-navy-50 text-muted', navy: 'bg-navy text-white' };
export function Badge({ tone = 'mute', children, className = '' }: { tone?: string; children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${tones[tone] || tones.mute} ${className}`}>{children}</span>;
}
export function Avatar({ name, url, size = 40, className = '' }: { name?: string | null; url?: string | null; size?: number; className?: string }) {
  const s = { width: size, height: size, fontSize: Math.round(size * 0.38) };
  // eslint-disable-next-line @next/next/no-img-element
  if (url) return <img src={url} alt="" style={s} className={`flex-none rounded-full object-cover ${className}`} />;
  return <span aria-hidden style={s} className={`flex flex-none items-center justify-center rounded-full bg-emerald-50 font-bold text-emerald-700 ${className}`}>{initials(name)}</span>;
}
export function Field({ label, hint, error, htmlFor, children, className = '' }: { label: ReactNode; hint?: ReactNode; error?: string | null; htmlFor?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p className="text-xs font-medium text-danger" role="alert">{error}</p>}
    </div>
  );
}
export const inputCls = 'w-full rounded-xl border border-line bg-white px-3 py-2.5 text-[15px] text-ink placeholder:text-muted/70 focus:border-emerald focus:outline-none focus:ring-2 focus:ring-emerald/20 disabled:bg-canvas';
export function Skeleton({ className = '' }: { className?: string }) { return <div className={`animate-pulse rounded-xl bg-navy-50 ${className}`} />; }
export function EmptyState({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-white px-6 py-10 text-center">
      {icon && <div className="mb-3 text-emerald">{icon}</div>}
      <p className="font-semibold text-ink">{title}</p>
      {text && <p className="mt-1 max-w-md text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
export function Stars({ value, size = 14 }: { value: number | null | undefined; size?: number }) {
  const v = Math.round(Number(value || 0));
  return <span className="inline-flex" aria-label={`${value ?? 0} / 5`}>{[1, 2, 3, 4, 5].map(i => <svg key={i} width={size} height={size} viewBox="0 0 20 20" className={i <= v ? 'fill-emerald' : 'fill-line'}><path d="M10 1.8l2.5 5.3 5.8.7-4.3 4 1.1 5.7L10 14.7l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z" /></svg>)}</span>;
}
export function PageHeader({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{title}</h1>{text && <p className="mt-1 max-w-2xl text-muted">{text}</p>}</div>
      {action}
    </div>
  );
}
export function Logo({ size = 32, word = true, light = false }: { size?: number; word?: boolean; light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
        <rect width="40" height="40" rx="11" fill="#142B4A" />
        <path d="M11 15.5a9.5 9.5 0 0 1 16.2-4.6" fill="none" stroke="#18A875" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M27.4 7.6l.2 3.9-3.9.3" fill="none" stroke="#18A875" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M29 24.5a9.5 9.5 0 0 1-16.2 4.6" fill="none" stroke="#E6F7F0" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M12.6 32.4l-.2-3.9 3.9-.3" fill="none" stroke="#E6F7F0" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 16.2c-1.9-1.2-4.2-1.5-6.2-1v9.6c2-.5 4.3-.2 6.2 1 1.9-1.2 4.2-1.5 6.2-1v-9.6c-2-.5-4.3-.2-6.2 1z" fill="#fff" />
        <path d="M20 16.2v9.6" stroke="#142B4A" strokeWidth="1.2" />
      </svg>
      {word && <span className={`text-[19px] font-extrabold tracking-tight ${light ? 'text-white' : 'text-navy'}`}>Bilim<span className="text-emerald">Bank</span></span>}
    </span>
  );
}
