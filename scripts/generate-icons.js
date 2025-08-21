const fs = require('fs');
const path = require('path');

// Simple SVG icon template
const createIcon = (size) => {
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#EA580C;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#F59E0B;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.1}" />
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.35}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">CS</text>
  </svg>`;
  
  return svg;
};

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons for each size
sizes.forEach(size => {
  const svg = createIcon(size);
  const filename = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`Created ${filename}`);
});

console.log('Icons generated successfully! Note: These are SVG placeholders.');
console.log('For production, convert to PNG format using an image editor or online converter.');