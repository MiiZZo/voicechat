/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  typescript: {
    // Игнорировать ошибки TypeScript при сборке
    ignoreBuildErrors: true,
  },
  eslint: {
    // Игнорировать ошибки ESLint при сборке
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
