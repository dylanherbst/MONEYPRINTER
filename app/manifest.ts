import type { MetadataRoute } from 'next';
import { site } from '../lib/aimp/site-config';

// Add to Home Screen for the public website. Icons are the logo mark on the site's pearl background; the maskable one
// keeps the mark inside the safe area so Android can crop it to any shape.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: site.name,
    short_name: site.name,
    description: site.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f7f5fb',
    theme_color: '#e3dbf6',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/brand/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
