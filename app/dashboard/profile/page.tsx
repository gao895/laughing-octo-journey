import type { Metadata } from 'next';
import { SiteHeader } from '@/components/ui/SiteHeader';
import { ProfileSettings } from '@/components/profile/ProfileSettings';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t.profile.title };

export default function ProfilePage() {
  return (
    <>
      <SiteHeader />
      <ProfileSettings />
    </>
  );
}
