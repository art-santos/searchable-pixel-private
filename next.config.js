/** @type {import('next').NextConfig} */
const nextConfig = {
  // Re-enable type-checking by removing the temporary workaround.
  typescript: {
    ignoreBuildErrors: false,
  },
  // Enable React Strict Mode to highlight potential problems.
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.21st.dev',
      },
      {
        protocol: 'https',
        hostname: '21st.dev',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.twblocks.com',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
        pathname: '/api/portraits/**',
      },
      {
        protocol: 'https',
        hostname: 'mraiflxbhhbrtwtuppfb.supabase.co',
        pathname: '/storage/v1/object/public/blog-images/public/**',
      },
      {
        protocol: 'https',
        hostname: 'mraiflxbhhbrtwtuppfb.supabase.co',
        pathname: '/storage/v1/object/public/author-avatars/**',
      },
      {
        protocol: 'https',
        hostname: 'mraiflxbhhbrtwtuppfb.supabase.co',
        pathname: '/storage/v1/object/public/programmatic-images/**',
      },
      {
        protocol: 'https',
        hostname: 'mraiflxbhhbrtwtuppfb.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'logo.clearbit.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
    ],
    domains: ['www.twblocks.com', 'randomuser.me', 'i.pravatar.cc', 'logo.clearbit.com', 'ui-avatars.com'],
  },
}

module.exports = nextConfig 