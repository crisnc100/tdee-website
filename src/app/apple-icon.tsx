import { ImageResponse } from 'next/og';
import { gaugeMarkDataUri } from '@/components/brand/gaugeMark';

// iOS rounds the corners itself, so the tile is square and full-bleed, with
// extra margin around the dial.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    <img src={gaugeMarkDataUri({ pad: 4, rounded: false })} width={size.width} height={size.height} alt="" />,
    size
  );
}
