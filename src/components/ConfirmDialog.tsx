'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from './ui';
import { useApp } from './Providers';
export function Dialog({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('input,textarea,select,button')?.focus();
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    return () => { document.removeEventListener('keydown', k); prev?.focus(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 p-0 sm:items-center sm:p-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-pop sm:rounded-2xl sm:p-6 ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}>
        <h2 className="mb-3 text-lg font-bold text-navy">{title}</h2>
        {children}
      </div>
    </div>
  );
}
export function ConfirmDialog({ open, onClose, onConfirm, title, text, confirmLabel, danger, busy, children }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; text?: string; confirmLabel: string; danger?: boolean; busy?: boolean; children?: ReactNode }) {
  const { d } = useApp();
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      {text && <p className="mb-4 text-sm text-muted">{text}</p>}
      {children}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={onClose}>{d.common.cancel}</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy}>{busy ? d.common.saving : confirmLabel}</Button>
      </div>
    </Dialog>
  );
}
