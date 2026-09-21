'use client'

import Link from 'next/link'
import Logo from '../Logo/Logo'
import { PORTAL_FOOTER_COLUMNS } from '../../../lib/airportPortalData'
import homeStyles from '../../page.module.css'
import { useTranslation } from '../../../hooks/useTranslation'

const COLUMN_TITLE_KEYS = ['footerQuickLinks', 'footerSupport', 'footerMyAccount', 'footerPortals']

export default function PortalFooter() {
  const t = useTranslation()

  return (
    <footer id="contact" className={homeStyles.footer}>
      <div className={homeStyles.container}>
        <div className={homeStyles.footerTop}>
          <div className={homeStyles.footerBrandArea}>
            <Link href="/" aria-label="UmrahLimo home">
              <Logo className={homeStyles.footerLogo} />
            </Link>
            <p className={homeStyles.footerTagline}>
              {t('footerTagline')}
            </p>
          </div>
          <span className={homeStyles.footerSslBadge}>SSL</span>
        </div>

        <div className={homeStyles.footerGrid}>
          {PORTAL_FOOTER_COLUMNS.map((column, idx) => (
            <div key={column.title}>
              <h4 className={homeStyles.footerColumnTitle}>{t(COLUMN_TITLE_KEYS[idx])}</h4>
              <ul className={homeStyles.footerLinks}>
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.href}-${link.label}`}>
                    <Link href={link.href} className={homeStyles.footerLink}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={homeStyles.footerBottom}>
          <p>{t('footerCopyright')}</p>
        </div>
      </div>
    </footer>
  )
}
