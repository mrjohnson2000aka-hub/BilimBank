import type { ReactNode } from 'react';
export default function AuthShell({ title, text, children }: { title: string; text?: string; children: ReactNode }) {
  return (
    <div className="wrap flex justify-center py-12 sm:py-16">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-navy">{title}</h1>
        {text && <p className="mt-1.5 text-sm text-muted">{text}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
