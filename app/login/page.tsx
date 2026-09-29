import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth/AuthForm';
import { SiteHeader } from '@/components/ui/SiteHeader';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t.auth.loginTitle };

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main className="flex min-h-[calc(100dvh-4rem)] items-center px-4 py-12">
        <Suspense>
          <AuthForm mode="login" />
        </Suspense>
      </main>
    </>
  );
}
