'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { getRepository } from '@/lib/data';
import { toFriendlyMessage, logDev } from '@/lib/errors';
import { validateEmail, validatePassword, DISPLAY_NAME_MAX } from '@/lib/gallery/validation';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { safeNextPath } from '@/lib/visitor';
import { t } from '@/lib/i18n';

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isSignup = mode === 'signup';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const emailCheck = validateEmail(email);
    if (!emailCheck.ok) return setError(emailCheck.message);
    if (isSignup) {
      const pw = validatePassword(password);
      if (!pw.ok) return setError(pw.message);
    } else if (!password) {
      return setError(t.errors.login);
    }

    setLoading(true);
    try {
      const repo = getRepository();
      if (isSignup) {
        const { needsEmailConfirmation } = await repo.signUp(email, password, displayName);
        if (needsEmailConfirmation) {
          setInfo(t.auth.checkEmail);
          return;
        }
      } else {
        await repo.signIn(email, password);
      }
      router.replace(next);
      router.refresh();
    } catch (err) {
      logDev('auth', err);
      setError(toFriendlyMessage(err, isSignup ? t.errors.generic : t.errors.login));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="mb-8 text-center text-2xl font-semibold">
        {isSignup ? t.auth.signupTitle : t.auth.loginTitle}
      </h1>
      {info ? (
        <p
          className="border-gold/30 bg-gold/5 rounded-xl border p-4 text-sm leading-relaxed"
          role="status"
        >
          {info}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
          {isSignup && (
            <TextField
              label={t.auth.displayName}
              placeholder={t.auth.displayNamePlaceholder}
              value={displayName}
              maxLength={DISPLAY_NAME_MAX}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="nickname"
            />
          )}
          <TextField
            label={t.auth.email}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label={t.auth.password}
            type="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            hint={isSignup ? t.auth.passwordHint : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" loading={loading}>
            {isSignup ? t.auth.signupButton : t.auth.loginButton}
          </Button>
          {!isSupabaseConfigured() && (
            <p className="text-mist text-center text-xs">{t.auth.demoHint}</p>
          )}
        </form>
      )}
      <p className="mt-8 text-center text-sm">
        <Link
          href={`${isSignup ? '/login' : '/signup'}?next=${encodeURIComponent(next)}`}
          className="text-gold underline-offset-4 hover:underline"
        >
          {isSignup ? t.auth.toLogin : t.auth.toSignup}
        </Link>
      </p>
      {/* Future: social logins (Google etc.) can be added here via supabase.auth.signInWithOAuth. */}
    </div>
  );
}
