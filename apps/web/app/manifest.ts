import type { MetadataRoute } from 'next';
import { site } from '../lib/aimp/site-config';

// Installable app (Add to Home Screen on phones, Install in desktop Chrome and Edge). Opens the app's Welcome screen,
// not the marketing site. Icons are the owner's logo on the site's pearl background; the maskable one keeps the logo
// inside the safe area so Android can crop it to any shape.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/start',
    name: site.name,
    short_name: site.name,
    description: `${site.tagline}: pick an idea and AI drafts your first product, shop and launch content.`,
    start_url: '/start',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f7f5fb',
    theme_color: '#e3dbf6',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/brand/aimp-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/brand/aimp-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/brand/aimp-icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
