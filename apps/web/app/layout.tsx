import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'AIMoneyPrinter',
  description: 'Find a side hustle, build it, and get your first customers. By Ventra.',
  // Added to the Home Screen on an iPhone it opens full screen like an app (the manifest covers Android and newer iOS).
  appleWebApp: { capable: true, title: 'AIMoneyPrinter', statusBarStyle: 'default' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
