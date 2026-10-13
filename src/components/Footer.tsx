import Link from 'next/link';
import { Logo } from './ui';
import { getDict } from '@/lib/i18n';
export default function Footer() {
  const d = getDict();
  const cols: [string, [string, string][]][] = [
    [d.footer.product, [['/discover', d.nav.explore], ['/#how', d.nav.how], ['/leaderboard', d.nav.leaderboard]]],
    [d.footer.company, [['/help#about', d.footer.about], ['/help', d.footer.help], ['/help#contact', d.footer.contact]]],
    [d.footer.legal, [['/help#privacy', d.footer.privacy], ['/help#terms', d.footer.terms], ['/help#guidelines', d.footer.guidelines]]]
  ];
  return (
    <footer className="mt-16 bg-navy text-navy-100">
      <div className="wrap grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div><Logo light /><p className="mt-3 max-w-xs text-sm text-navy-100/80">{d.footer.tagline}</p></div>
        {cols.map(([h, links]) => (
          <div key={h}><p className="text-sm font-bold text-white">{h}</p><ul className="mt-3 space-y-2 text-sm">{links.map(([href, l]) => <li key={href}><Link href={href} className="hover:text-white">{l}</Link></li>)}</ul></div>
        ))}
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-navy-100/70">© {new Date().getFullYear()} BilimBank</div>
    </footer>
  );
}
