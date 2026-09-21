import Script from 'next/script'

export const metadata = {
  title: 'Umrah Taxi Service Routes and Travel Guide - UmrahLimo',
  description:
    'Explore Umrah taxi route guides including Jeddah Airport to Makkah Hotel transfer, Makkah to Madinah routes, and Nusuk-compliant travel planning with UmrahLimo.',
  keywords: [
    'Umrah taxi route guide',
    'Jeddah Airport to Makkah Hotel (Arrival)',
    'Makkah Hotel to Madina Hotel',
    'Nusuk compliant Umrah transport'
  ]
}

export default function Blog1Layout({ children }) {
  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-4MSXXT9GMF"
        strategy="afterInteractive"
      />
      <Script id="gtag-init-blog1" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-4MSXXT9GMF');
        `}
      </Script>
      {children}
    </>
  )
}