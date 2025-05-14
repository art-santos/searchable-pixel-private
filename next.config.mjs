/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Set to false for testing
  experimental: {
    // swcPlugins: [["plugin-image-trace", {}]],
  },
  images: {
    // ... existing image config ...
  }
};

export default nextConfig; 