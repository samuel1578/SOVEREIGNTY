// D10 — security headers (SRS SEC-11). The CSP is report-only first: statically prerendered pages can't
// carry per-request nonces, so scripts need 'unsafe-inline' until routes move to a nonce-based policy.
// TODO(backend): add the real R2 public endpoint, Supabase project URL and analytics origin.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://js.stripe.com https://app.cal.com",
  "style-src 'self' 'unsafe-inline'",
  // images.unsplash.com: placeholder home photos (lib/home-media.ts) until the owner's own images are on R2.
  "img-src 'self' data: blob: https://*.r2.cloudflarestorage.com https://images.unsplash.com https://images.pexels.com",
  "font-src 'self'",
  "media-src 'self' blob: https://*.r2.cloudflarestorage.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://app.cal.com https://*.r2.cloudflarestorage.com",
  "frame-src https://app.cal.com https://cal.com https://js.stripe.com https://checkout.stripe.com",
  "frame-ancestors 'none'",
  "form-action 'self' https://checkout.stripe.com",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join('; ')

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  // D7 — 'use cache' + cacheTag for public reads.
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'Content-Security-Policy-Report-Only', value: csp },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com"), usb=(), interest-cohort=()' },
      ],
    }]
  },
  // F-028 — next/image optimisation on. TODO(backend): R2 — add images.remotePatterns for cover art.
  images: { formats: ['image/avif', 'image/webp'], remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' }, { protocol: 'https', hostname: 'images.pexels.com', pathname: '/**' }] },
}

export default nextConfig
