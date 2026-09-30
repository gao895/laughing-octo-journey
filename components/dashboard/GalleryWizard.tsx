'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Gallery, LayoutMode, TemplateId } from '@/types/gallery';
import { Button, ButtonLink } from '@/components/ui/Button';
import { TextField, TextArea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { getRepository } from '@/lib/data';
import { logDev, toFriendlyMessage } from '@/lib/errors';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import {
  DESCRIPTION_MAX,
  DISPLAY_NAME_MAX,
  TITLE_MAX,
  validateGalleryTitle,
} from '@/lib/gallery/validation';
import { t } from '@/lib/i18n';
import { AiTitleButton } from './AiTitleButton';
import { ArtworkUploader, type PreparedFile } from './ArtworkUploader';
import { OptionCards } from './OptionCards';
import { TemplatePicker } from './TemplatePicker';

interface PendingArtwork extends PreparedFile {
  key: string;
  previewUrl: string;
  title: string;
  description: string;
}

const TOTAL_STEPS = 5;

export const LAYOUT_OPTIONS = (['auto', 'even', 'large', 'manual'] as const).map((value) => ({
  value,
  label: t.layoutModes[value].label,
  body: t.layoutModes[value].body,
  badge: value === 'auto' ? 'おすすめ' : undefined,
}));

/** Beginner-friendly, step-by-step exhibition creation. */
export function GalleryWizard() {
  const { user } = useCurrentUser({ required: true });
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  // null = untouched: the account's display name is used.
  const [artistName, setArtistName] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [template, setTemplate] = useState<TemplateId>('white-museum');
  const [pending, setPending] = useState<PendingArtwork[]>([]);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('auto');
  const [creating, setCreating] = useState<{ done: number; total: number } | null>(null);
  const [created, setCreated] = useState<Gallery | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  // Revoke preview URLs when leaving the wizard.
  const pendingRef = useRef(pending);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);
  useEffect(() => () => pendingRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl)), []);

  useEffect(() => {
    heading.current?.focus();
  }, [step]);

  function goNextFromTitle() {
    const check = validateGalleryTitle(title);
    if (!check.ok) {
      setTitleError(check.message);
      return;
    }
    setTitleError(null);
    setStep(2);
  }

  function addPrepared(files: PreparedFile[]) {
    setPending((prev) => [
      ...prev,
      ...files.map((f) => ({
        ...f,
        key: crypto.randomUUID(),
        previewUrl: URL.createObjectURL(f.image.thumbnail),
        title: f.image.suggestedTitle,
        description: '',
      })),
    ]);
  }

  function updatePending(key: string, patch: Partial<PendingArtwork>) {
    setPending((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  }

  function removePending(key: string) {
    setPending((prev) => {
      const target = prev.find((p) => p.key === key);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.key !== key);
    });
  }

  async function create() {
    const repo = getRepository();
    setCreating({ done: 0, total: pending.length });
    try {
      const gallery = await repo.createGallery({
        title,
        artist_name: artistName ?? undefined,
        template,
        layout_mode: layoutMode,
      });
      let failed = 0;
      for (const [i, item] of pending.entries()) {
        try {
          await repo.addArtwork(gallery, item.image, {
            title: item.title,
            description: item.description,
            order_index: i,
          });
        } catch (e) {
          failed++;
          logDev('wizard upload', e);
        }
        setCreating({ done: i + 1, total: pending.length });
      }
      if (failed > 0) toast(t.errors.upload, 'error');
      setCreated(gallery);
      setStep(5);
    } catch (e) {
      logDev('wizard create', e);
      toast(toFriendlyMessage(e, t.errors.save), 'error');
    } finally {
      setCreating(null);
    }
  }

  if (!user) return null;

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-3xl flex-col px-4 py-8 sm:px-6">
      {/* Progress */}
      <div className="mb-8">
        <div className="text-mist mb-2 flex items-center justify-between text-xs">
          <span>{t.wizard.stepLabel(step, TOTAL_STEPS)}</span>
          {step < 5 && (
            <Link href="/dashboard" className="hover:text-paper">
              {t.common.cancel}
            </Link>
          )}
        </div>
        <div className="flex gap-1.5" aria-hidden>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${i < step ? 'bg-gold' : 'bg-white/10'}`}
            />
          ))}
        </div>
      </div>

      <div key={step} className="animate-fade-in flex flex-1 flex-col">
        {step === 1 && (
          <form
            className="flex flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault();
              goNextFromTitle();
            }}
          >
            <h1 ref={heading} tabIndex={-1} className="text-2xl font-semibold focus:outline-none">
              {t.wizard.step1Title}
            </h1>
            <TextField
              label={t.wizard.step1Title}
              placeholder={t.wizard.step1Placeholder}
              value={title}
              maxLength={TITLE_MAX}
              onChange={(e) => setTitle(e.target.value)}
              error={titleError}
              hint={t.wizard.step1Help}
              autoFocus
            />
            <TextField
              label={t.wizard.artistLabel}
              value={artistName ?? user.displayName}
              maxLength={DISPLAY_NAME_MAX}
              onChange={(e) => setArtistName(e.target.value)}
              hint={t.wizard.artistHelp}
              autoComplete="nickname"
            />
            <div className="mt-auto flex justify-end">
              <Button type="submit" size="lg">
                {t.common.next}
              </Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6">
            <h1 ref={heading} tabIndex={-1} className="text-2xl font-semibold focus:outline-none">
              {t.wizard.step2Title}
            </h1>
            <TemplatePicker value={template} onChange={setTemplate} />
            <StepNav onBack={() => setStep(1)} onNext={() => setStep(3)} />
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 ref={heading} tabIndex={-1} className="text-2xl font-semibold focus:outline-none">
                {t.wizard.step3Title}
              </h1>
              <p className="text-mist mt-2 text-sm">{t.wizard.step3Help}</p>
            </div>
            <ArtworkUploader onPrepared={addPrepared} compact={pending.length > 0} />
            {pending.length > 0 && (
              <ul className="flex flex-col gap-4">
                {pending.map((item, i) => (
                  <li
                    key={item.key}
                    className="border-line bg-coal flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row"
                  >
                    <div className="flex shrink-0 items-start gap-3 sm:flex-col">
                      {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                      <img
                        src={item.previewUrl}
                        alt=""
                        className="h-24 w-24 rounded-lg object-cover sm:h-32 sm:w-32"
                      />
                      <span className="text-mist text-xs">
                        #{i + 1}
                        {item.image.video && ` ・ ▶ ${t.uploader.videoBadge}`}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-3">
                      <TextField
                        label={t.uploader.title}
                        value={item.title}
                        maxLength={TITLE_MAX}
                        onChange={(e) => updatePending(item.key, { title: e.target.value })}
                      />
                      <AiTitleButton
                        imageUrl={item.previewUrl}
                        onTitle={(v) => updatePending(item.key, { title: v })}
                      />
                      <TextArea
                        label={t.uploader.description}
                        placeholder={t.uploader.descriptionPlaceholder}
                        value={item.description}
                        maxLength={DESCRIPTION_MAX}
                        onChange={(e) => updatePending(item.key, { description: e.target.value })}
                      />
                      <div>
                        <Button variant="ghost" size="sm" onClick={() => removePending(item.key)}>
                          {t.uploader.remove}
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <StepNav onBack={() => setStep(2)} onNext={() => setStep(4)} />
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-6">
            <h1 ref={heading} tabIndex={-1} className="text-2xl font-semibold focus:outline-none">
              {t.wizard.step4Title}
            </h1>
            <OptionCards options={LAYOUT_OPTIONS} value={layoutMode} onChange={setLayoutMode} />
            {creating && (
              <p className="text-mist text-sm" role="status">
                {t.wizard.creating} {creating.total > 0 && `${creating.done} / ${creating.total}`}
              </p>
            )}
            <StepNav
              onBack={() => setStep(3)}
              onNext={create}
              nextLabel={t.home.create}
              loading={Boolean(creating)}
            />
          </div>
        )}

        {step === 5 && created && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 py-10 text-center">
            <span className="text-5xl" aria-hidden>
              🎉
            </span>
            <h1 ref={heading} tabIndex={-1} className="text-3xl font-semibold focus:outline-none">
              {t.wizard.step5Title}
            </h1>
            <p className="text-mist">「{created.title}」</p>
            <p className="text-mist max-w-md text-sm">{t.wizard.step5Body}</p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <ButtonLink href={`/dashboard/gallery/${created.id}/preview`} size="lg">
                {t.wizard.viewGallery}
              </ButtonLink>
              <ButtonLink
                href={`/dashboard/gallery/${created.id}/edit`}
                size="lg"
                variant="secondary"
              >
                {t.wizard.toEdit}
              </ButtonLink>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function StepNav({
  onBack,
  onNext,
  nextLabel = t.common.next,
  loading = false,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  loading?: boolean;
}) {
  return (
    <div className="from-ink via-ink sticky bottom-0 mt-auto flex justify-between gap-3 bg-gradient-to-t to-transparent pt-6 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <Button variant="ghost" size="lg" onClick={onBack} disabled={loading}>
        {t.common.back}
      </Button>
      <Button size="lg" onClick={onNext} loading={loading}>
        {nextLabel}
      </Button>
    </div>
  );
}
