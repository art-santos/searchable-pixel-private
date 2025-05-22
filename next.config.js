/** @type {import('next').NextConfig} */
const nextConfig = {
  // Re-enable type-checking by removing the temporary workaround.
  typescript: {
    ignoreBuildErrors: false,
  },
  // Enable React Strict Mode to highlight potential problems.
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      }
    ]
  },
}

module.exports = nextConfig 