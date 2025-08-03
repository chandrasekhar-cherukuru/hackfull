/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
  },
  env: {
    API_BASE_URL: 'http://localhost:3036/api',  // <--- updated port
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
