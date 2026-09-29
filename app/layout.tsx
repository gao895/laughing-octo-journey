import type { Metadata, Viewport } from 'next';
import { ToastProvider } from '@/components/ui/Toast';
import { t } from '@/lib/i18n';
import './globals.css';

export const metadata: Metadata = {
  title: { default: `${t.app.name} | ${t.app.tagline}`, template: `%s | ${t.app.name}` },
  description: t.home.sub,
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: { title: t.app.name, description: t.home.sub, type: 'website' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0c0c0e',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-dvh font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
