import type { MetadataRoute } from 'next';
import { MARK_BG } from '@/components/brand/gaugeMark';

// Install metadata only. No service worker is registered: public/sw.js is a
// kill-switch for an old one and must stay that way.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TDEE Calculator',
    short_name: 'TDEE Calculator',
    description: 'Estimate your total daily energy expenditure and daily calorie needs.',
    start_url: '/',
    display: 'standalone',
    background_color: MARK_BG,
    theme_color: MARK_BG,
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png', purpose: 'any' },
      { src: '/icon', sizes: '32x32', type: 'image/png', purpose: 'any' },
    ],
  };
}
