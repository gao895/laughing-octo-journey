'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Artwork, ArtworkUpdate } from '@/types/artwork';
import type {
  Gallery,
  GalleryStatus,
  GalleryUpdate,
  LayoutMode,
  LightingPreset,
  TemplateId,
} from '@/types/gallery';
import { Button, ButtonLink, buttonClass } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TextArea, TextField } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/Toast';
import { BgmPlayer } from '@/components/gallery/BgmPlayer';
import type { CameraFocus } from '@/components/gallery/types';
import { getRepository } from '@/lib/data';
import { logDev, toFriendlyMessage } from '@/lib/errors';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useClientValue } from '@/lib/hooks/useClientValue';
import {
  nudgePlacement,
  resolvePlacements,
  type ArtworkPlacement,
  type NudgeAction,
  viewpointFor,
} from '@/lib/gallery/layout';
import {
  AUDIO_ACCEPT,
  DESCRIPTION_MAX,
  TITLE_MAX,
  validateAudioFile,
} from '@/lib/gallery/validation';
import { copyText, galleryUrl } from '@/lib/share';
import { isTouchDevice, isWebGLAvailable } from '@/lib/webgl';
import { t } from '@/lib/i18n';
import { ArtworkUploader, type PreparedFile } from '../ArtworkUploader';
import { LAYOUT_OPTIONS } from '../GalleryWizard';
import { OptionCards } from '../OptionCards';
import { TemplatePicker } from '../TemplatePicker';
import { ArtworkListItem } from './ArtworkListItem';
import { NudgeToolbar } from './NudgeToolbar';

const GalleryScene = dynamic(
  () => import('@/components/gallery/GalleryScene').then((m) => m.GalleryScene),
  {
    ssr: false,
    loading: () => <Spinner label={t.viewer.preparing} />,
  },
);

type Tab = 'basic' | 'artworks' | 'venue' | 'lighting' | 'bgm' | 'publish';
const TABS: Tab[] = ['basic', 'artworks', 'venue', 'lighting', 'bgm', 'publish'];

const LIGHTING_OPTIONS = (['standard', 'bright', 'soft'] as const).map((value) => ({
  value,
  label: t.editor.lightingOptions[value].label,
  body: t.editor.lightingOptions[value].body,
}));

function placementToFields(p: ArtworkPlacement): ArtworkUpdate {
  return {
    position_x: p.x,
    position_y: p.y,
    position_z: p.z,
    rotation_y: p.rotationY,
    scale: p.scale,
  };
}

const CLEARED_POSITION: ArtworkUpdate = {
  position_x: null,
  position_y: null,
  position_z: null,
  rotation_y: null,
  scale: null,
};

export function GalleryEditor({ galleryId }: { galleryId: string }) {
  const { user } = useCurrentUser({ required: true });
  const router = useRouter();
  const toast = useToast();
  const webgl = useClientValue(isWebGLAvailable, true);
  const touch = useClientValue(isTouchDevice, false);

  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [galleryPatch, setGalleryPatch] = useState<GalleryUpdate>({});
  const [artworkPatches, setArtworkPatches] = useState<Record<string, ArtworkUpdate>>({});
  const [tab, setTab] = useState<Tab>('artworks');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<CameraFocus | null>(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<TemplateId | null>(null);
  const [artworkToDelete, setArtworkToDelete] = useState<Artwork | null>(null);
  const focusKey = useRef(0);

  const dirty = Object.keys(galleryPatch).length > 0 || Object.keys(artworkPatches).length > 0;

  // ------------------------------------------------------------ load
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getRepository()
      .getGalleryForOwner(galleryId)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setLoadState('missing');
          return;
        }
        setGallery(data.gallery);
        setArtworks(data.artworks);
        setLoadState('ready');
      })
      .catch((e) => {
        logDev('editor load', e);
        if (!cancelled) setLoadState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [user, galleryId]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const layout = useMemo(
    () => (gallery ? resolvePlacements(artworks, gallery.layout_mode) : null),
    [artworks, gallery],
  );

  // ------------------------------------------------------------ local edits
  const editGallery = useCallback((patch: GalleryUpdate) => {
    setGallery((g) => (g ? { ...g, ...patch } : g));
    setGalleryPatch((p) => ({ ...p, ...patch }));
  }, []);

  const editArtworks = useCallback((updates: Record<string, ArtworkUpdate>) => {
    setArtworks((list) => list.map((a) => (updates[a.id] ? { ...a, ...updates[a.id] } : a)));
    setArtworkPatches((p) => {
      const next = { ...p };
      for (const [id, patch] of Object.entries(updates)) next[id] = { ...next[id], ...patch };
      return next;
    });
  }, []);

  const save = useCallback(async (): Promise<boolean> => {
    if (!gallery) return false;
    if (!dirty) return true;
    setSaving(true);
    try {
      const repo = getRepository();
      if (Object.keys(galleryPatch).length > 0) {
        const updated = await repo.updateGallery(gallery.id, galleryPatch);
        setGallery((g) => (g ? { ...g, ...updated } : updated));
      }
      const updates = Object.entries(artworkPatches).map(([id, patch]) => ({ id, patch }));
      if (updates.length) await repo.updateArtworks(updates);
      setGalleryPatch({});
      setArtworkPatches({});
      toast(t.common.saved, 'success');
      return true;
    } catch (e) {
      logDev('save', e);
      toast(toFriendlyMessage(e, t.errors.save), 'error');
      return false;
    } finally {
      setSaving(false);
    }
  }, [gallery, dirty, galleryPatch, artworkPatches, toast]);

  // ------------------------------------------------------------ artworks
  async function addArtworks(files: PreparedFile[]) {
    if (!gallery) return;
    const repo = getRepository();
    let order = artworks.reduce((max, a) => Math.max(max, a.order_index), -1) + 1;
    for (const file of files) {
      try {
        const artwork = await repo.addArtwork(gallery, file.image, {
          title: file.image.suggestedTitle,
          description: '',
          order_index: order++,
        });
        setArtworks((list) => [...list, artwork]);
      } catch (e) {
        logDev('addArtwork', e);
        toast(toFriendlyMessage(e, t.errors.upload), 'error');
      }
    }
  }

  async function deleteArtwork() {
    if (!artworkToDelete) return;
    setBusy(true);
    try {
      await getRepository().deleteArtwork(artworkToDelete);
      setArtworks((list) => list.filter((a) => a.id !== artworkToDelete.id));
      setArtworkPatches((p) => {
        const next = { ...p };
        delete next[artworkToDelete.id];
        return next;
      });
      if (selectedId === artworkToDelete.id) setSelectedId(null);
      setArtworkToDelete(null);
    } catch (e) {
      logDev('deleteArtwork', e);
      toast(toFriendlyMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  }

  function moveArtwork(index: number, dir: -1 | 1) {
    const other = artworks[index + dir];
    const current = artworks[index];
    if (!other || !current) return;
    const reordered = [...artworks];
    reordered[index] = other;
    reordered[index + dir] = current;
    const updates: Record<string, ArtworkUpdate> = {};
    reordered.forEach((a, i) => {
      if (a.order_index !== i) updates[a.id] = { order_index: i };
    });
    setArtworks(reordered.map((a, i) => ({ ...a, order_index: i })));
    setArtworkPatches((p) => {
      const next = { ...p };
      for (const [id, patch] of Object.entries(updates)) next[id] = { ...next[id], ...patch };
      return next;
    });
  }

  function selectArtwork(id: string) {
    setSelectedId(id);
    const p = layout?.placements.find((x) => x.id === id);
    if (p && layout) {
      focusKey.current += 1;
      setFocus({ ...viewpointFor(p, layout), key: focusKey.current });
    }
  }

  function nudge(action: NudgeAction) {
    if (!gallery || !layout || !selectedId) return;
    const updates: Record<string, ArtworkUpdate> = {};
    // First manual adjustment: freeze the current automatic layout so nothing else moves.
    if (gallery.layout_mode !== 'manual') {
      for (const p of layout.placements) updates[p.id] = placementToFields(p);
      editGallery({ layout_mode: 'manual' });
    }
    const current = layout.placements.find((p) => p.id === selectedId);
    const art = artworks.find((a) => a.id === selectedId);
    if (!current || !art) return;
    updates[selectedId] = placementToFields(nudgePlacement(current, action, art, layout));
    editArtworks(updates);
  }

  function relayout(mode: LayoutMode) {
    if (!gallery) return;
    editGallery({ layout_mode: mode });
    if (mode !== 'manual') {
      const updates: Record<string, ArtworkUpdate> = {};
      for (const a of artworks) if (a.position_x != null) updates[a.id] = CLEARED_POSITION;
      if (Object.keys(updates).length) editArtworks(updates);
    } else if (layout) {
      const updates: Record<string, ArtworkUpdate> = {};
      for (const p of layout.placements) updates[p.id] = placementToFields(p);
      editArtworks(updates);
    }
  }

  // ------------------------------------------------------------ venue / publish
  async function applyTemplate() {
    if (!gallery || !pendingTemplate) return;
    editGallery({ template: pendingTemplate });
    // 会場を変更すると作品の配置を自動調整します。
    if (gallery.layout_mode === 'manual') relayout('auto');
    setPendingTemplate(null);
    toast(t.editor.relayoutDone, 'success');
  }

  async function setStatus(status: GalleryStatus) {
    if (!gallery) return;
    setBusy(true);
    try {
      const repo = getRepository();
      const patch = { ...galleryPatch, status };
      const updated = await repo.updateGallery(gallery.id, patch);
      const updates = Object.entries(artworkPatches).map(([id, p]) => ({ id, patch: p }));
      if (updates.length) await repo.updateArtworks(updates);
      setGallery(updated);
      setGalleryPatch({});
      setArtworkPatches({});
      if (status === 'published') {
        setTab('publish');
        toast(t.editor.publishedMessage, 'success');
      } else {
        toast(t.common.saved, 'success');
      }
    } catch (e) {
      logDev('setStatus', e);
      toast(toFriendlyMessage(e, t.errors.save), 'error');
    } finally {
      setBusy(false);
    }
  }

  async function uploadBgm(file: File | undefined) {
    if (!file || !gallery) return;
    const check = validateAudioFile(file);
    if (!check.ok) {
      toast(check.message, 'error');
      return;
    }
    setBusy(true);
    try {
      const url = await getRepository().uploadBgm(gallery, file);
      editGallery({ bgm_url: url });
    } catch (e) {
      logDev('uploadBgm', e);
      toast(toFriendlyMessage(e, t.errors.upload), 'error');
    } finally {
      setBusy(false);
    }
  }

  async function openPreview() {
    if (await save()) router.push(`/dashboard/gallery/${galleryId}/preview`);
  }

  async function copyShareUrl() {
    if (!gallery) return;
    const ok = await copyText(galleryUrl(gallery.slug));
    toast(ok ? t.common.copied : t.errors.copy, ok ? 'success' : 'error');
  }

  // ------------------------------------------------------------ render
  if (!user || loadState === 'loading') return <Spinner label={t.common.loading} />;
  if (loadState !== 'ready' || !gallery || !layout) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-6 text-center">
        <p>{loadState === 'missing' ? t.errors.forbidden : t.errors.generic}</p>
        <ButtonLink href="/dashboard" variant="secondary">
          {t.common.back}
        </ButtonLink>
      </div>
    );
  }

  const selectedArtwork = artworks.find((a) => a.id === selectedId) ?? null;
  const published = gallery.status === 'published';

  return (
    <div className="flex h-dvh flex-col">
      {/* Top bar */}
      <header className="bg-ink flex h-14 shrink-0 items-center gap-2 border-b border-white/5 px-3 sm:px-4">
        <Link href="/dashboard" className={buttonClass('ghost', 'sm')} aria-label={t.common.back}>
          ← <span className="hidden sm:inline">{t.common.back}</span>
        </Link>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="truncate text-sm font-medium sm:text-base">{gallery.title}</h1>
          <StatusBadge status={gallery.status} />
          {dirty && (
            <span className="text-gold hidden text-xs md:inline">● {t.editor.unsaved}</span>
          )}
        </div>
        <Button
          size="sm"
          variant={dirty ? 'primary' : 'secondary'}
          onClick={save}
          loading={saving}
          disabled={!dirty}
        >
          {t.common.save}
        </Button>
        <Button size="sm" variant="secondary" onClick={openPreview} disabled={saving}>
          {t.common.preview}
        </Button>
        {!published && (
          <Button
            size="sm"
            onClick={() => setStatus('published')}
            loading={busy}
            className="hidden sm:inline-flex"
          >
            {t.common.publish}
          </Button>
        )}
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row-reverse">
        {/* 3D preview (right on desktop, top on phones) */}
        <section
          className="relative h-[42dvh] shrink-0 bg-black lg:h-auto lg:flex-1"
          aria-label={t.common.preview}
        >
          {webgl ? (
            <GalleryScene
              gallery={gallery}
              authorName={user.displayName}
              artworks={artworks}
              layout={layout}
              selectedId={selectedId}
              onSelectArtwork={(a) => {
                selectArtwork(a.id);
                setTab('artworks');
              }}
              focus={focus}
              lowRes={touch || artworks.length > 16}
            />
          ) : (
            <p className="text-mist flex h-full items-center justify-center p-6 text-center text-sm">
              {t.viewer.noWebgl}
            </p>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-3">
            {selectedArtwork ? (
              <NudgeToolbar
                title={selectedArtwork.title}
                onNudge={nudge}
                onDeselect={() => setSelectedId(null)}
              />
            ) : (
              artworks.length > 0 && (
                <p className="rounded-full bg-black/60 px-4 py-2 text-xs text-white/90 backdrop-blur">
                  {t.editor.selectHint}
                </p>
              )
            )}
          </div>
        </section>

        {/* Settings (left on desktop) */}
        <aside className="bg-ink flex min-h-0 flex-1 flex-col border-white/5 lg:w-[400px] lg:flex-none lg:border-r">
          <nav
            className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/5 px-2 py-2"
            aria-label="menu"
          >
            {TABS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-current={tab === id ? 'page' : undefined}
                className={`min-h-10 shrink-0 rounded-lg px-3 text-sm transition ${
                  tab === id
                    ? 'bg-gold/15 text-gold'
                    : 'text-mist hover:text-paper hover:bg-white/5'
                }`}
              >
                {t.editor.menu[id]}
              </button>
            ))}
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-24 lg:pb-6">
            {tab === 'basic' && (
              <div className="flex flex-col gap-5">
                <TextField
                  label={t.editor.galleryTitle}
                  value={gallery.title}
                  maxLength={TITLE_MAX}
                  onChange={(e) => editGallery({ title: e.target.value })}
                />
                <TextArea
                  label={t.editor.galleryDescription}
                  placeholder={t.editor.galleryDescriptionPlaceholder}
                  value={gallery.description}
                  maxLength={DESCRIPTION_MAX}
                  rows={5}
                  onChange={(e) => editGallery({ description: e.target.value })}
                />
              </div>
            )}

            {tab === 'artworks' && (
              <div className="flex flex-col gap-5">
                <ArtworkUploader onPrepared={addArtworks} compact={artworks.length > 0} />
                <section className="flex flex-col gap-3">
                  <h2 className="text-sm font-medium">{t.wizard.step4Title}</h2>
                  <OptionCards
                    options={LAYOUT_OPTIONS}
                    value={gallery.layout_mode}
                    onChange={relayout}
                  />
                  {gallery.layout_mode === 'manual' && (
                    <Button variant="secondary" size="sm" onClick={() => relayout('auto')}>
                      {t.editor.relayout}
                    </Button>
                  )}
                </section>
                {artworks.length === 0 ? (
                  <p className="text-mist py-6 text-center text-sm">{t.editor.noArtworks}</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {artworks.map((a, i) => (
                      <ArtworkListItem
                        key={a.id}
                        artwork={a}
                        index={i}
                        total={artworks.length}
                        selected={a.id === selectedId}
                        onChange={(patch) => editArtworks({ [a.id]: patch })}
                        onSelect={() => selectArtwork(a.id)}
                        onMove={(dir) => moveArtwork(i, dir)}
                        onDelete={() => setArtworkToDelete(a)}
                      />
                    ))}
                  </ul>
                )}
              </div>
            )}

            {tab === 'venue' && (
              <div className="flex flex-col gap-4">
                <p className="text-mist text-sm">{t.editor.changeVenue}</p>
                <TemplatePicker
                  value={gallery.template}
                  onChange={(id) => id !== gallery.template && setPendingTemplate(id)}
                  columns="sm:grid-cols-2"
                />
              </div>
            )}

            {tab === 'lighting' && (
              <OptionCards
                options={LIGHTING_OPTIONS}
                value={gallery.lighting}
                onChange={(lighting: LightingPreset) => editGallery({ lighting })}
              />
            )}

            {tab === 'bgm' && (
              <div className="flex flex-col gap-4">
                <p className="text-mist text-sm leading-relaxed">{t.editor.bgmHelp}</p>
                {gallery.bgm_url && (
                  <div className="border-line bg-coal flex flex-wrap items-center gap-3 rounded-xl border p-3">
                    <span className="text-sm">♪ {t.editor.bgmCurrent}</span>
                    <BgmPlayer url={gallery.bgm_url} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => editGallery({ bgm_url: null })}
                    >
                      {t.editor.bgmRemove}
                    </Button>
                  </div>
                )}
                <label className={buttonClass('secondary', 'md', 'cursor-pointer')}>
                  {t.editor.bgmUpload}
                  <input
                    type="file"
                    accept={AUDIO_ACCEPT}
                    className="sr-only"
                    disabled={busy}
                    onChange={(e) => {
                      void uploadBgm(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            )}

            {tab === 'publish' && (
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <StatusBadge status={gallery.status} />
                  <p className="text-mist text-sm">{t.editor.publishHelp}</p>
                </div>
                {published ? (
                  <>
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-medium">{t.editor.shareUrl}</span>
                      <input
                        readOnly
                        value={galleryUrl(gallery.slug)}
                        onFocus={(e) => e.currentTarget.select()}
                        className="border-line bg-coal w-full rounded-xl border px-3 py-3 text-sm"
                        aria-label={t.editor.shareUrl}
                        data-testid="share-url"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={copyShareUrl}>{t.common.copyUrl}</Button>
                        <ButtonLink
                          href={`/gallery/${gallery.slug}`}
                          variant="secondary"
                          target="_blank"
                        >
                          {t.editor.openPublicPage}
                        </ButtonLink>
                      </div>
                    </div>
                    <Button variant="ghost" onClick={() => setStatus('draft')} loading={busy}>
                      {t.common.unpublish}
                    </Button>
                  </>
                ) : (
                  <Button size="lg" onClick={() => setStatus('published')} loading={busy}>
                    {t.common.publish}
                  </Button>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={Boolean(pendingTemplate)}
        title={t.editor.changeVenueConfirmTitle}
        body={t.editor.changeVenueConfirmBody}
        onConfirm={applyTemplate}
        onCancel={() => setPendingTemplate(null)}
      />
      <ConfirmDialog
        open={Boolean(artworkToDelete)}
        title={t.editor.deleteArtworkConfirm}
        body={artworkToDelete?.title}
        confirmLabel={t.common.delete}
        danger
        loading={busy}
        onConfirm={deleteArtwork}
        onCancel={() => setArtworkToDelete(null)}
      />
    </div>
  );
}
