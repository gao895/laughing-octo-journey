import type { Metadata } from 'next';
import { SiteHeader } from '@/components/ui/SiteHeader';
import { ExploreList } from '@/components/dashboard/ExploreList';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t.explore.title };

export default function ExplorePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="mb-8 text-2xl font-semibold">{t.explore.title}</h1>
        <ExploreList />
      </main>
    </>
  );
}
