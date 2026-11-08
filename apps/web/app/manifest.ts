import type { MetadataRoute } from 'next';

// Installable app (Add to Home Screen). Opens the app Home, not the marketing site.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/app',
    name: 'VENTRA',
    short_name: 'VENTRA',
    description: 'Your AI front office: replies, books and follows up, so you can run the business.',
    start_url: '/app',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#15121c',
    theme_color: '#c3b4bb',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/brand/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
