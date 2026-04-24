/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    staleTimes: { dynamic: 0 },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.blob.core.windows.net' },
    ],
  },
}

module.exports = nextConfig
