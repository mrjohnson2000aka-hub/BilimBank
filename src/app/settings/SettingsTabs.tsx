'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
export default function SettingsTabs({ tabs }: { tabs: [string, string][] }) {
  const path = usePathname();
  return <nav className="-mx-4 mt-5 flex gap-1 overflow-x-auto px-4">{tabs.map(([h, l]) => <Link key={h} href={h} aria-current={path === h ? 'page' : undefined} className={`flex-none rounded-xl px-3.5 py-2 text-sm font-semibold ${path === h ? 'bg-navy text-white' : 'bg-white text-muted ring-1 ring-line hover:text-navy'}`}>{l}</Link>)}</nav>;
}
