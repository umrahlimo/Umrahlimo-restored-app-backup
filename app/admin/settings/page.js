'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import styles from '../admin.module.scss'
import { db } from '../../../lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export default function AdminSettings() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState({
        depositPercentage: 50,
        currency: 'USD',
        taxPercentage: 0,
        serviceFeePercentage: 0,
        cancellationPolicy: {
            fullRefundHours: 24,
            partialRefundHours: 12,
            partialRefundPercentage: 50
        }
    })

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        setLoading(true)
        try {
            const settingsDoc = await getDoc(doc(db, 'settings', 'payment'))
            if (settingsDoc.exists()) {
                setSettings({ ...settings, ...settingsDoc.data(), currency: 'USD' })
            }
        } catch (error) {
            console.error('Error fetching settings:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await setDoc(doc(db, 'settings', 'payment'), {
                ...settings,
                currency: 'USD',
                updatedAt: new Date().toISOString()
            })
            alert('Settings saved successfully!')
        } catch (error) {
            console.error('Error saving settings:', error)
            alert('Failed to save settings')
        } finally {
            setSaving(false)
        }
    }

    const handleChange = (field, value) => {
        setSettings(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleCancellationChange = (field, value) => {
        setSettings(prev => ({
            ...prev,
            cancellationPolicy: {
                ...prev.cancellationPolicy,
                [field]: value
            }
        }))
    }

    if (loading) {
        return (
            <AdminLayout pageTitle="Payment Settings" pageDescription="Configure payment and booking settings">
                <div className={styles.loadingState}>
                    <div className={styles.loadingSpinner}></div>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout
            pageTitle="Payment Settings"
            pageDescription="Configure deposit percentage, fees, and payment policies"
        >
            <div className={styles.settingsContainer}>
                {/* Deposit Settings Card */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                                <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                            </svg>
                            Deposit Configuration
                        </h3>
                        <p>Set the deposit percentage customers must pay upfront</p>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.formGroup}>
                            <label>Deposit Percentage (%)</label>
                            <div className={styles.inputWithHelper}>
                                <input
                                    type="number"
                                    value={settings.depositPercentage}
                                    onChange={(e) => handleChange('depositPercentage', parseFloat(e.target.value) || 0)}
                                    min="0"
                                    max="100"
                                    step="5"
                                />
                                <span className={styles.helperText}>
                                    Customers will pay {settings.depositPercentage}% upfront, remaining {100 - settings.depositPercentage}% to driver
                                </span>
                            </div>
                        </div>

                        <div className={styles.depositPreview}>
                            <h4>Example Calculation</h4>
                            <div className={styles.previewGrid}>
                                <div className={styles.previewItem}>
                                    <span className={styles.previewLabel}>Total Booking</span>
                                    <span className={styles.previewValue}>USD 1,000</span>
                                </div>
                                <div className={styles.previewItem}>
                                    <span className={styles.previewLabel}>Deposit ({settings.depositPercentage}%)</span>
                                    <span className={styles.previewValue} style={{ color: 'var(--admin-primary)' }}>
                                        USD {(1000 * settings.depositPercentage / 100).toFixed(2)}
                                    </span>
                                </div>
                                <div className={styles.previewItem}>
                                    <span className={styles.previewLabel}>Pay to Driver ({100 - settings.depositPercentage}%)</span>
                                    <span className={styles.previewValue} style={{ color: 'var(--admin-gold)' }}>
                                        USD {(1000 * (100 - settings.depositPercentage) / 100).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Currency & Fees Card */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                                <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
                            </svg>
                            Currency & Additional Fees
                        </h3>
                        <p>Configure currency and optional service charges</p>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Currency</label>
                                <select
                                    value={settings.currency}
                                    onChange={(e) => handleChange('currency', e.target.value)}
                                    disabled
                                >
                                    <option value="USD">USD - US Dollar</option>
                                </select>
                                <span className={styles.helperText}>Base currency is fixed to USD for pricing, invoices, and Stripe payments.</span>
                            </div>
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Tax/VAT (%)</label>
                                <input
                                    type="number"
                                    value={settings.taxPercentage}
                                    onChange={(e) => handleChange('taxPercentage', parseFloat(e.target.value) || 0)}
                                    min="0"
                                    max="100"
                                    step="0.5"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Service Fee (%)</label>
                                <input
                                    type="number"
                                    value={settings.serviceFeePercentage}
                                    onChange={(e) => handleChange('serviceFeePercentage', parseFloat(e.target.value) || 0)}
                                    min="0"
                                    max="100"
                                    step="0.5"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cancellation Policy Card */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
                            </svg>
                            Cancellation Policy
                        </h3>
                        <p>Define refund rules based on cancellation timing</p>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Full Refund (Hours Before)</label>
                                <input
                                    type="number"
                                    value={settings.cancellationPolicy.fullRefundHours}
                                    onChange={(e) => handleCancellationChange('fullRefundHours', parseInt(e.target.value) || 0)}
                                    min="0"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Partial Refund (Hours Before)</label>
                                <input
                                    type="number"
                                    value={settings.cancellationPolicy.partialRefundHours}
                                    onChange={(e) => handleCancellationChange('partialRefundHours', parseInt(e.target.value) || 0)}
                                    min="0"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Partial Refund (%)</label>
                                <input
                                    type="number"
                                    value={settings.cancellationPolicy.partialRefundPercentage}
                                    onChange={(e) => handleCancellationChange('partialRefundPercentage', parseInt(e.target.value) || 0)}
                                    min="0"
                                    max="100"
                                />
                            </div>
                        </div>

                        <div className={styles.policyPreview}>
                            <h4>Policy Summary</h4>
                            <ul>
                                <li>✓ 100% refund if cancelled {settings.cancellationPolicy.fullRefundHours}+ hours before pickup</li>
                                <li>⚠ {settings.cancellationPolicy.partialRefundPercentage}% refund if cancelled {settings.cancellationPolicy.partialRefundHours}-{settings.cancellationPolicy.fullRefundHours} hours before pickup</li>
                                <li>✗ No refund if cancelled less than {settings.cancellationPolicy.partialRefundHours} hours before pickup</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className={styles.saveButtonContainer}>
                    <button
                        className={styles.saveBtn}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <div className={styles.btnSpinner}></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z" />
                                </svg>
                                Save Settings
                            </>
                        )}
                    </button>
                </div>
            </div>
        </AdminLayout>
    )
}
