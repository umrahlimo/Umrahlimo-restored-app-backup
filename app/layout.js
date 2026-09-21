import 'bootstrap/dist/css/bootstrap.min.css'
import './globals.css'
import Script from 'next/script'
import { AuthProvider } from '../context/AuthContext'
import { LanguageProvider } from '../context/LanguageContext'
import { CurrencyProvider } from '../context/CurrencyContext'
import TawkTo from './components/TawkTo/TawkTo'
import WhatsAppFloat from './components/WhatsAppFloat/WhatsAppFloat'
import { buildLocalBusinessSchema, buildOrganizationSchema } from '../lib/seo/schemas'

// Force dynamic rendering to avoid Firebase initialization during build
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Umrah Taxi | Jeddah Airport to Makkah Hotel Transfer - UmrahLimo',
  description: 'Book reliable Umrah taxi with UmrahLimo. Pay deposit now, rest to driver on arrival. Luxury Jeddah airport to Makkah transfers, Makkah-Madinah, Nusuk compliant. Instant online booking.',
  keywords: [
    'Umrah taxi',
    'Jeddah airport to Makkah taxi',
    'Makkah to Madinah taxi',
    'Pay deposit rest on arrival',
    'Umrah transport',
    'Hajj transport',
    'airport transfer Saudi Arabia',
    'luxury chauffeur service',
    'Jeddah Airport to Jeddah Hotel or ViceVersa',
    'Jeddah Airport to Makkah Hotel (Arrival)',
    'Makkah Hotel to Jeddah Airport (Departure)',
    'Jeddah Airport to Madina Hotel (Arrival)',
    'Madina Hotel to Jeddah Airport (Departure)',
    'Madina Airport to Madina Hotel or ViceVersa',
    'Makkah or Madinah Mazarats (Standard)',
    'Makkah Mazarat with Masjid Aisha',
    'Makkah Mazarat with Masjid Jurana',
    'Makkah Hotel to Taif Mazarats & Return',
    'Makkah Hotel to Madina Hotel',
    'Madina Hotel to Makkah Hotel',
    'Makkah Hotel to Via Badar Madina Hotel',
    'Madina Hotel to Via Badar Makkah Hotel',
    'Madina Hotel to Badr Mazarats & Return',
    'Madina Hotel to Wadi Jin',
    'Makkah Hotel to Makkah Train Station or ViceVersa',
    'Madina Hotel to Madina Train Station or ViceVersa',
    'Madina Hotel to Madina Train Station Via Meeqat',
    'Taif Airport to Makkah Hotel (Arrival)',
    'Makkah Hotel to Taif Airport (Departure)',
    'Riyadh to Makkah or ViceVersa'
  ],
  alternates: {
    canonical: 'https://www.umrahlimo.com',
    languages: {
      'en': 'https://www.umrahlimo.com',
      'ur': 'https://www.umrahlimo.com',
      'ar': 'https://www.umrahlimo.com',
      'x-default': 'https://www.umrahlimo.com',
    },
  },
}

export default function RootLayout({ children }) {
  const localBusinessSchema = buildLocalBusinessSchema()
  const organizationSchema = buildOrganizationSchema()

  return (
    <html lang="en">
      <head>
        {/* Schema.org — LocalBusiness + AggregateRating: server-rendered so Google sees it in raw HTML */}
        <script
          id="schema-local-business"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        {/* Schema.org — Organization: global brand entity */}
        <script
          id="schema-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body>
        <LanguageProvider>
          <CurrencyProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </CurrencyProvider>
        </LanguageProvider>
        <TawkTo />
        <WhatsAppFloat />
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
          strategy="lazyOnload"
        />
        {/* Google Ads Tag - fires on every page */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18135545857"
          strategy="afterInteractive"
        />
        <Script id="gtag-init-ads" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18135545857');
          `}
        </Script>
        {/* TikTok Pixel - fires on every page */}
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
              ttq.load('D7SDVDJC77U4TIUPSIF0');
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>
        {/* Meta Pixel - fires on every page */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1553050382866898');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1553050382866898&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </body>
    </html>
  )
}