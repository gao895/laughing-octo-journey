'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { GallerySummary } from '@/types/gallery';
import { Avatar } from '@/components/ui/Avatar';
import { Button, ButtonLink } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { getRepository } from '@/lib/data';
import { createSampleGallery } from '@/lib/demo/createSampleGallery';
import { logDev, toFriendlyMessage } from '@/lib/errors';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { hasSeenOnboarding, markOnboardingSeen } from '@/lib/visitor';
import { t } from '@/lib/i18n';
import { GalleryCard } from './GalleryCard';
import { Onboarding } from './Onboarding';

type Item = GallerySummary & { visit_count: number };

export function DashboardHome() {
  const { user } = useCurrentUser({ required: true });
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<GallerySummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [creatingSample, setCreatingSample] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getRepository()
      .listMyGalleries()
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch((e) => {
        logDev('dashboard', e);
        if (!cancelled) setError(toFriendlyMessage(e));
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // First visit only: shown to new users who have no exhibitions yet.
  const showOnboarding = Boolean(
    user && items && items.length === 0 && !onboardingDismissed && !hasSeenOnboarding(user.id),
  );

  function closeOnboarding() {
    if (user) markOnboardingSeen(user.id);
    setOnboardingDismissed(true);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await getRepository().deleteGallery(toDelete.id);
      setItems((prev) => prev?.filter((g) => g.id !== toDelete.id) ?? null);
      setToDelete(null);
    } catch (e) {
      logDev('deleteGallery', e);
      toast(toFriendlyMessage(e), 'error');
    } finally {
      setDeleting(false);
    }
  }

  async function addSample() {
    setCreatingSample(true);
    try {
      const gallery = await createSampleGallery(getRepository());
      router.push(`/dashboard/gallery/${gallery.id}/edit`);
    } catch (e) {
      logDev('sample', e);
      toast(toFriendlyMessage(e), 'error');
      setCreatingSample(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {!isSupabaseConfigured() && (
        <p className="border-gold/20 bg-gold/5 text-gold/90 mb-6 rounded-xl border px-4 py-3 text-xs leading-relaxed">
          {t.common.demoNotice}
        </p>
      )}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t.dashboard.title}</h1>
          {user && (
            <div className="text-mist mt-2 flex items-center gap-2 text-sm">
              <Avatar url={user.avatarUrl} name={user.displayName} size="xs" />
              <span>{user.displayName}</span>
              <span aria-hidden>・</span>
              <Link
                href="/dashboard/profile"
                className="text-gold underline-offset-4 hover:underline"
              >
                {t.profile.edit}
              </Link>
            </div>
          )}
        </div>
        {items && items.length > 0 && (
          <ButtonLink href="/dashboard/new">{t.dashboard.newGallery}</ButtonLink>
        )}
      </div>

      {error ? (
        <p className="text-red-200">{error}</p>
      ) : !items ? (
        <Spinner label={t.common.loading} />
      ) : items.length === 0 ? (
        <EmptyState
          title={t.dashboard.emptyTitle}
          action={
            <div className="flex flex-col items-center gap-3">
              <ButtonLink href="/dashboard/new" size="lg">
                {t.dashboard.emptyAction}
              </ButtonLink>
              <Button variant="ghost" size="sm" onClick={addSample} loading={creatingSample}>
                {t.dashboard.sampleCreate}
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((g) => (
            <GalleryCard key={g.id} gallery={g} onDelete={setToDelete} />
          ))}
        </div>
      )}

      {/* Floating create button for phones */}
      {items && items.length > 0 && (
        <ButtonLink
          href="/dashboard/new"
          className="fixed right-5 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-30 rounded-full shadow-xl sm:hidden"
          aria-label={t.dashboard.newGallery}
        >
          ＋
        </ButtonLink>
      )}

      <Onboarding
        open={showOnboarding}
        onClose={closeOnboarding}
        onStart={() => {
          closeOnboarding();
          router.push('/dashboard/new');
        }}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title={toDelete ? `「${toDelete.title}」` : ''}
        body={t.dashboard.deleteConfirm}
        confirmLabel={t.common.delete}
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </main>
  );
}
