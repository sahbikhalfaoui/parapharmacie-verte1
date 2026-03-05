/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  // Critical: exclude Node.js-only packages from webpack bundling
  serverExternalPackages: [
    'mongoose',
    'bcryptjs',
    'jsonwebtoken',
    'cloudinary',
    'google-auth-library',
    'multer-storage-cloudinary',
  ],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com",
              "style-src 'self' 'unsafe-inline' https://accounts.google.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' http://localhost:* https://accounts.google.com https://oauth2.googleapis.com https://maps.app.goo.gl https://www.google.com",
              "frame-src 'self' https://accounts.google.com https://www.google.com",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig

