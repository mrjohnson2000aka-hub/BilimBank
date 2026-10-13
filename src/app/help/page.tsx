import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui';
import { getDict, getLang } from '@/lib/i18n';
import { helpContent } from '@/lib/help-content';
import { env } from '@/lib/env';
import { fill } from '@/lib/format';
export const metadata: Metadata = { title: 'Help center' };
export default function Help() {
  const lang = getLang(), d = getDict(lang), secs = helpContent[lang];
  const names = d.help.sections as Record<string, string>;
  return (
    <div className="wrap py-10">
      <PageHeader title={d.help.title} text={d.help.text} />
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="lg:sticky lg:top-20 lg:self-start" aria-label={d.help.title}><ul className="flex flex-wrap gap-1 lg:flex-col">{[...secs.map(s => s.id), 'contact'].map(id => <li key={id}><a href={`#${id}`} className="block rounded-lg px-3 py-2 text-sm font-semibold text-muted hover:bg-white hover:text-navy">{names[id]}</a></li>)}</ul></nav>
        <div className="space-y-6">
          {secs.map(s => <section key={s.id} id={s.id} className="scroll-mt-20 rounded-2xl border border-line bg-white p-6 shadow-card"><h2 className="text-xl font-bold text-navy">{names[s.id]}</h2>{s.body.map((p, i) => <p key={i} className="mt-3 max-w-3xl text-ink">{p}</p>)}</section>)}
          <section id="contact" className="scroll-mt-20 rounded-2xl border border-line bg-white p-6 shadow-card"><h2 className="text-xl font-bold text-navy">{names.contact}</h2>
            <p className="mt-3 text-ink">{env.contactEmail ? fill(d.help.contactText, { email: env.contactEmail }) : d.help.contactNone}</p></section>
        </div>
      </div>
    </div>
  );
}
