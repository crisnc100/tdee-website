/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable webpack cache in development
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;