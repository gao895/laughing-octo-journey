import { Component, StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import HomePage from '@/app/page';
import LoginPage from '@/app/login/page';
import SignupPage from '@/app/signup/page';
import ExplorePage from '@/app/explore/page';
import DashboardPage from '@/app/dashboard/page';
import NewGalleryPage from '@/app/dashboard/new/page';
import NotFound from '@/app/not-found';
import { GalleryEditor } from '@/components/dashboard/editor/GalleryEditor';
import { OwnerPreview } from '@/components/gallery/OwnerPreview';
import { PublicGallery } from '@/components/gallery/PublicGallery';
import { ToastProvider } from '@/components/ui/Toast';
import { isValidSlug } from '@/lib/gallery/slug';
import { t } from '@/lib/i18n';
import { MemoryRouter, useMemoryRouter } from './router';

/** Mirrors the App Router file structure in app/. */
function Routes() {
  const path = useMemoryRouter().href.split('?')[0]!;
  const parts = path.split('/').filter(Boolean);
  const [a, b, c, d] = parts;

  if (parts.length === 0) return <HomePage />;
  if (path === '/login') return <LoginPage />;
  if (path === '/signup') return <SignupPage />;
  if (path === '/explore') return <ExplorePage />;
  if (path === '/dashboard') return <DashboardPage />;
  if (path === '/dashboard/new') return <NewGalleryPage />;
  if (a === 'dashboard' && b === 'gallery' && c && d === 'edit')
    return <GalleryEditor key={c} galleryId={c} />;
  if (a === 'dashboard' && b === 'gallery' && c && d === 'preview')
    return <OwnerPreview key={c} galleryId={c} />;
  if (a === 'gallery' && b && parts.length === 2) {
    return <PublicGallery key={b} slug={isValidSlug(b) ? b : ''} />;
  }
  return <NotFound />;
}

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg">{t.errors.generic}</p>
        <button
          type="button"
          className="text-gold underline"
          onClick={() => this.setState({ failed: false })}
        >
          {t.common.back}
        </button>
      </main>
    );
  }
}

// A bare #g-<slug> token in the link opens that exhibition directly.
const token = window.location.hash.slice(1);
const initial = /^g-[a-z0-9-]+$/.test(token) ? `/gallery/${token.slice(2)}` : '/';

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <MemoryRouter initial={initial}>
      <ErrorBoundary>
        <ToastProvider>
          <Routes />
        </ToastProvider>
      </ErrorBoundary>
    </MemoryRouter>
  </StrictMode>,
);
