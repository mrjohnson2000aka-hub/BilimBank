import '@fontsource-variable/manrope';
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/Providers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SetupNeeded from '@/components/SetupNeeded';
import { getDict, getLang, getViewerTz } from '@/lib/i18n';
import { isConfigured, env } from '@/lib/env';
import { currentUser } from '@/lib/session';

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: { default: 'BilimBank: learn for free by teaching what you are good at', template: '%s · BilimBank' },
  description: 'A student-to-student skill exchange. Teach an hour, earn a credit, learn an hour. English and Uzbek.',
  openGraph: { title: 'BilimBank', description: 'Learn for free by teaching what you are good at.', type: 'website' }
};
export const viewport: Viewport = { themeColor: '#142B4A', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = getLang();
  if (!isConfigured()) return <html lang={lang}><body><SetupNeeded /></body></html>;
  const { sb, profile } = await currentUser();
  const tz = getViewerTz(profile?.timezone);
  const { data: settings } = await sb.from('platform_settings').select('announcement').maybeSingle();
  const d = getDict(lang);
  return (
    <html lang={lang}>
      <body className="flex min-h-screen flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">Skip to content</a>
        <Providers lang={lang} tz={tz}>
          <Header />
          {settings?.announcement && <div className="bg-emerald-50 py-2 text-center text-sm font-semibold text-emerald-700"><div className="wrap">{settings.announcement}</div></div>}
          {profile?.status === 'suspended' && <div className="bg-danger-50 py-2 text-center text-sm font-semibold text-danger"><div className="wrap">{d.errors.account_suspended}</div></div>}
          <main id="main" className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
