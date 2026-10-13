import SettingsTabs from './SettingsTabs';
import { getDict } from '@/lib/i18n';
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const d = getDict();
  return (
    <div className="wrap py-10">
      <h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{d.nav.settings}</h1>
      <SettingsTabs tabs={[['/settings/profile', d.settings.profileTitle], ['/settings/availability', d.settings.availabilityTitle], ['/settings/account', d.settings.accountTitle]]} />
      <div className="mt-6">{children}</div>
    </div>
  );
}
