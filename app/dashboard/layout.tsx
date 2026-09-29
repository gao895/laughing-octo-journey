import type { Metadata } from 'next';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t.dashboard.title, robots: { index: false } };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
