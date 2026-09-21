// app/robots.js — Next.js App Router robots
// Auto-served at /robots.txt after deploy

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/dashboard/',
          '/api/',
          '/checkout/',
          '/login',
          '/signup',
          '/forgot-password',
          '/customer/',
        ],
      },
    ],
    sitemap: 'https://www.umrahlimo.com/sitemap.xml',
  }
}
