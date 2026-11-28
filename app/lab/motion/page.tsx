import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MotionStudio } from './studio';
import '../../../lib/motion/c05.css';
import './v2-stage.css';
import './studio.css';

// Development-only motion studio. Never served on the production deployment (404), never indexed, not in the
// sitemap or the navigation.
export const metadata: Metadata = { title: 'Motion studio (development only)', robots: { index: false, follow: false } };

export default function MotionLabPage() {
  if (process.env.VERCEL_ENV === 'production') notFound();
  return <MotionStudio />;
}
