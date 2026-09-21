'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import styles from '../admin.module.scss'

export default function AdminLayout({ children, pageTitle, pageDescription }) {
    const router = useRouter()
    const pathname = usePathname()
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

    useEffect(() => {
        // Restore sidebar state
        const saved = localStorage.getItem('adminSidebarCollapsed')
        if (saved === 'true') setSidebarCollapsed(true)
    }, [])

    const toggleSidebar = () => {
        setSidebarCollapsed(prev => {
            const next = !prev
            localStorage.setItem('adminSidebarCollapsed', String(next))
            return next
        })
    }

    useEffect(() => {
        // Check authentication
        const adminAuth = localStorage.getItem('adminAuth')
        if (adminAuth) {
            try {
                const auth = JSON.parse(adminAuth)
                if (auth.isAuthenticated) {
                    setIsAuthenticated(true)
                } else {
                    router.push('/admin')
                }
            } catch (e) {
                router.push('/admin')
            }
        } else {
            router.push('/admin')
        }
        setLoading(false)
    }, [router])

    const handleLogout = () => {
        localStorage.removeItem('adminAuth')
        router.push('/admin')
    }

    if (loading) {
        return (
            <div className={`${styles.adminLayout} ${styles.adminTheme}`}>
                <div className={styles.loadingState}>
                    <div className={styles.loadingSpinner}></div>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    const navItems = [
        {
            href: '/admin/dashboard',
            label: 'Dashboard',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                </svg>
            )
        },
        {
            href: '/admin/dispatch',
            label: 'Dispatch Panel',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
                </svg>
            )
        },
        {
            href: '/admin/reports',
            label: 'Reports & Analytics',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                </svg>
            )
        },
        {
            href: '/admin/receipts',
            label: 'Receipts',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 4H3v2h18V4zm-2 4H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2v-8a2 2 0 00-2-2zm-1 10H6v-2h12v2zm0-4H6v-2h12v2z" />
                </svg>
            )
        },
        {
            href: '/admin/prices',
            label: 'Vehicle Prices',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
                </svg>
            )
        },
        {
            href: '/admin/banners',
            label: 'Banner Carousel',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                </svg>
            )
        },
        {
            href: '/admin/blog',
            label: 'Blog Management',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 3h12a4 4 0 014 4v14H8a4 4 0 00-4 4V3zm4 4v2h8V7H8zm0 4v2h8v-2H8zm0 4v2h5v-2H8z" />
                </svg>
            )
        },
        {
            href: '/admin/settings',
            label: 'Payment Settings',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                </svg>
            )
        }
    ]

    return (
        <div className={`${styles.adminLayout} ${styles.adminTheme}`}>
            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.sidebarLogo}>
                        <Image
                            src="/logo.png"
                            alt="UmrahLimo"
                            width={40}
                            height={40}
                            unoptimized
                            style={{ objectFit: 'contain' }}
                            onError={(e) => {
                                e.target.style.display = 'none'
                            }}
                        />
                        {!sidebarCollapsed && <h2>Admin</h2>}
                    </div>
                    <button className={styles.collapseBtn} onClick={toggleSidebar} title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                            style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}>
                            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                        </svg>
                    </button>
                </div>

                <nav className={styles.sidebarNav}>
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
                            title={sidebarCollapsed ? item.label : ''}
                        >
                            {item.icon}
                            {!sidebarCollapsed && <span>{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <button className={`${styles.navItem} ${styles.logout}`} onClick={handleLogout} title={sidebarCollapsed ? 'Logout' : ''}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                        </svg>
                        {!sidebarCollapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`${styles.mainContent} ${sidebarCollapsed ? styles.mainContentExpanded : ''}`}>
                <header className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button className={styles.collapseBtn} onClick={toggleSidebar} style={{ display: 'none' }}
                            id="mobileMenuBtn">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                            </svg>
                        </button>
                        <div className={styles.headerTitle}>
                            <h1>{pageTitle || 'Dashboard'}</h1>
                            {pageDescription && <p>{pageDescription}</p>}
                        </div>
                    </div>
                    <div className={styles.headerActions}>
                        <button className={styles.headerBtn} onClick={handleLogout}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </header>

                <div className={styles.pageContent}>
                    {children}
                </div>
            </main>
        </div>
    )
}
