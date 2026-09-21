/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disabled to prevent Firestore listener double-mount issues in dev
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      // Canonical domain redirect
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'umrahlimocustomer.vercel.app',
          },
        ],
        destination: 'https://umrahlimo.com/:path*',
        permanent: true,
      },
      // blog1 → blog (301 so old links/SEO pass cleanly)
      {
        source: '/blog1',
        destination: '/blog',
        permanent: true,
      },

      // ─── Legacy short /transfer slugs → new static SEO pages ───────────────
      {
        source: '/transfer/jed-to-makkah',
        destination: '/transfer/jeddah-airport-to-makkah',
        permanent: true,
      },
      {
        source: '/transfer/jed-to-madinah',
        destination: '/transfer/jeddah-airport-to-madinah',
        permanent: true,
      },
      {
        source: '/transfer/med-to-madinah',
        destination: '/transfer/madinah-airport-to-madinah',
        permanent: true,
      },
      {
        source: '/transfer/makkah-to-jed',
        destination: '/transfer/makkah-to-jeddah-airport',
        permanent: true,
      },
      {
        source: '/transfer/med-to-makkah',
        destination: '/transfer/madinah-to-makkah',
        permanent: true,
      },
      // Non-Umrah legacy short links still go to search
      {
        source: '/transfer/jed-to-corniche',
        destination: '/search?from=Jeddah+Airport&to=Jeddah+Corniche',
        permanent: true,
      },
      {
        source: '/transfer/isb-to-f7-markaz',
        destination: '/search?from=Islamabad+Airport&to=F-7+Markaz',
        permanent: true,
      },
      {
        source: '/transfer/tif-to-makkah',
        destination: '/search?from=Taif+Airport&to=Makkah+Hotel',
        permanent: true,
      },
      {
        source: '/transfer/ruh-to-makkah',
        destination: '/search?from=Riyadh&to=Makkah+Hotel',
        permanent: true,
      },

      // ---- 404 Fixes from umrahlimo_404_redirects.js ----
      // Footer / nav links (appear on every page)
      { source: '/contact', destination: '/inquiry', permanent: true },
      { source: '/help', destination: '/faq', permanent: true },
      { source: '/support', destination: '/inquiry', permanent: true },
      { source: '/travel-tips', destination: '/blog', permanent: false }, // INTERIM
      { source: '/manage-booking', destination: '/customer/login', permanent: true },
      { source: '/supplier/login', destination: '/login', permanent: false }, // INTERIM
      { source: '/partners/login', destination: '/login', permanent: false }, // INTERIM
      { source: '/partners', destination: '/inquiry', permanent: false }, // INTERIM
      { source: '/join-as-operator', destination: '/inquiry', permanent: false }, // INTERIM

      // City hub links (homepage "Top Cities")
      { source: '/city/makkah', destination: '/popular-routes', permanent: false },
      { source: '/city/madinah', destination: '/popular-routes', permanent: false },
      { source: '/city/jeddah', destination: '/popular-routes', permanent: false },
      { source: '/city/riyadh', destination: '/popular-routes', permanent: false },
      { source: '/city/taif', destination: '/popular-routes', permanent: false },
      { source: '/city/islamabad', destination: '/popular-routes', permanent: false },
      { source: '/city/lahore', destination: '/popular-routes', permanent: false },
      { source: '/city/karachi', destination: '/popular-routes', permanent: false },

      // Airport code links (homepage "Top Airports")
      { source: '/airport/jed', destination: '/airport-guides/jed', permanent: true },
      { source: '/airport/med', destination: '/airport-guides/med', permanent: true },
      { source: '/airport/lhr', destination: '/airport-guides/lhr', permanent: true },
      { source: '/airport/ruh', destination: '/airport-guides', permanent: false },
      { source: '/airport/isb', destination: '/airport-guides', permanent: false },
      { source: '/airport/khi', destination: '/airport-guides', permanent: false },
      { source: '/airport/lhe', destination: '/airport-guides', permanent: false },
      { source: '/airport/tif', destination: '/airport-guides', permanent: false },

      // Missing airport guide pages (interim redirects until built)
      { source: '/airport-guides/isb', destination: '/airport-guides', permanent: false },
      { source: '/airport-guides/khi', destination: '/airport-guides', permanent: false },
      { source: '/airport-guides/lhe', destination: '/airport-guides', permanent: false },
      { source: '/airport-guides/ruh', destination: '/airport-guides', permanent: false },
    ]
  },
}

module.exports = nextConfig