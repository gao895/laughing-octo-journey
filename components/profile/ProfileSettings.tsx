'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';
import type { AppUser } from '@/types/profile';
import { Avatar } from '@/components/ui/Avatar';
import { Button, ButtonLink } from '@/components/ui/Button';
import { TextArea, TextField } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { getRepository } from '@/lib/data';
import { logDev, toFriendlyMessage } from '@/lib/errors';
import { announceUserUpdated, useCurrentUser } from '@/lib/hooks/useCurrentUser';
import {
  BIO_MAX,
  DISPLAY_NAME_MAX,
  IMAGE_ACCEPT,
  validateImageFile,
} from '@/lib/gallery/validation';
import { prepareAvatar } from '@/lib/image/optimize';
import { t } from '@/lib/i18n';

/** プロフィール設定: icon, display name and bio of the signed-in creator. */
export function ProfileSettings() {
  const { user } = useCurrentUser({ required: true });
  if (!user) return <Spinner label={t.common.loading} />;
  // Keyed by id so the form starts from the loaded values.
  return <ProfileForm key={user.id} user={user} />;
}

function ProfileForm({ user }: { user: AppUser }) {
  const toast = useToast();
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl);
  const [nameError, setNameError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const dirty =
    displayName !== user.displayName || bio !== user.bio || avatarUrl !== user.avatarUrl;

  async function chooseAvatar(file: File | undefined) {
    if (!file) return;
    const check = validateImageFile(file);
    if (!check.ok) {
      toast(check.message, 'error');
      return;
    }
    setUploading(true);
    try {
      const icon = await prepareAvatar(file);
      setAvatarUrl(await getRepository().uploadAvatar(icon));
    } catch (e) {
      logDev('avatar', e);
      toast(toFriendlyMessage(e, t.errors.upload), 'error');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) {
      setNameError(t.errors.displayNameRequired);
      return;
    }
    setNameError(null);
    setSaving(true);
    try {
      await getRepository().updateProfile({ displayName, bio, avatarUrl });
      announceUserUpdated();
      toast(t.profile.saved, 'success');
    } catch (err) {
      logDev('updateProfile', err);
      toast(toFriendlyMessage(err, t.errors.save), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await getRepository().signOut();
    announceUserUpdated();
    router.push('/');
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t.profile.title}</h1>
        <ButtonLink href="/dashboard" variant="ghost" size="sm">
          {t.common.back}
        </ButtonLink>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-7" noValidate>
        <section className="flex items-center gap-5" aria-labelledby="avatar-label">
          <Avatar url={avatarUrl} name={displayName || user.displayName} size="lg" />
          <div className="flex flex-col gap-2">
            <span id="avatar-label" className="text-sm font-medium">
              {t.profile.avatar}
            </span>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                loading={uploading}
                onClick={() => fileInput.current?.click()}
              >
                {t.profile.avatarChoose}
              </Button>
              {avatarUrl && (
                <Button variant="ghost" size="sm" onClick={() => setAvatarUrl(null)}>
                  {t.profile.avatarRemove}
                </Button>
              )}
            </div>
            <p className="text-mist text-xs">{t.profile.avatarHelp}</p>
            <input
              ref={fileInput}
              id="avatar-file"
              type="file"
              accept={IMAGE_ACCEPT}
              className="sr-only"
              tabIndex={-1}
              data-testid="avatar-file-input"
              onChange={(e) => void chooseAvatar(e.target.files?.[0])}
            />
          </div>
        </section>

        <TextField
          id="profile-display-name"
          label={t.profile.displayName}
          value={displayName}
          maxLength={DISPLAY_NAME_MAX}
          onChange={(e) => setDisplayName(e.target.value)}
          hint={t.profile.displayNameHelp}
          error={nameError}
          autoComplete="nickname"
          required
        />

        <div className="flex flex-col gap-1">
          <TextArea
            id="profile-bio"
            label={t.profile.bio}
            placeholder={t.profile.bioPlaceholder}
            value={bio}
            maxLength={BIO_MAX}
            rows={5}
            onChange={(e) => setBio(e.target.value)}
            hint={t.profile.bioHelp}
          />
          <p className="text-mist self-end text-xs tabular-nums">
            {t.profile.count(Array.from(bio).length, BIO_MAX)}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-6">
          <Button variant="ghost" onClick={logout}>
            {t.common.logout}
          </Button>
          <Button type="submit" size="lg" loading={saving} disabled={!dirty || uploading}>
            {t.common.save}
          </Button>
        </div>
      </form>
    </main>
  );
}
