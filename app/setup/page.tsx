import type { Metadata } from 'next';
import { SiteHeader } from '@/components/ui/SiteHeader';
import { SetupCheck } from '@/components/setup/SetupCheck';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t.setup.title, robots: { index: false } };

export default function SetupPage() {
  return (
    <>
      <SiteHeader />
      <SetupCheck />
    </>
  );
}
