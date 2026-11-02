import { ImageResponse } from 'next/og';
import { gaugeMarkDataUri } from '@/components/brand/gaugeMark';

// PNG fallback for browsers that do not take the SVG favicon (icon.svg).
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <img src={gaugeMarkDataUri()} width={size.width} height={size.height} alt="" />,
    size
  );
}
