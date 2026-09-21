import Script from 'next/script'

export const metadata = {
  title: 'Book Umrah Taxi | Jeddah Airport to Makkah Transfer - UmrahLimo',
  description: 'Book Umrah taxi for Jeddah Airport to Makkah, Makkah to Madinah, and airport transfers. Pay deposit now and pay the remaining amount to the driver on arrival.',
  keywords: [
    'book Umrah taxi',
    'Jeddah Airport to Makkah Hotel (Arrival)',
    'Makkah Hotel to Madina Hotel',
    'Pay Deposit, Rest on Arrival'
  ]
}

export default function BookingLayout({ children }) {
  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=AW-18135545857"
        strategy="afterInteractive"
      />
      <Script id="gtag-ads-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-18135545857');
        `}
      </Script>
      {children}
    </>
  )
}
