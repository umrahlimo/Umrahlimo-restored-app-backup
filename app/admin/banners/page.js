'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import AdminLayout from '../components/AdminLayout'
import styles from '../admin.module.scss'
import { db } from '../../../lib/firebase'
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore'

export default function BannerManagement() {
    const [banners, setBanners] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingBanner, setEditingBanner] = useState(null)
    const [saving, setSaving] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        imageUrl: '',
        linkUrl: '',
        order: 0,
        isActive: true
    })

    useEffect(() => {
        fetchBanners()
    }, [])

    const fetchBanners = async () => {
        setLoading(true)
        try {
            const q = query(collection(db, 'admin_banners'), orderBy('order', 'asc'))
            const snapshot = await getDocs(q)
            const bannersList = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }))
            setBanners(bannersList)
        } catch (error) {
            console.error('Error fetching banners:', error)
            // Try without ordering if index doesn't exist
            try {
                const snapshot = await getDocs(collection(db, 'admin_banners'))
                const bannersList = snapshot.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id
                }))
                setBanners(bannersList.sort((a, b) => (a.order || 0) - (b.order || 0)))
            } catch (e) {
                console.error('Error fetching banners:', e)
            }
        } finally {
            setLoading(false)
        }
    }

    const openAddModal = () => {
        setEditingBanner(null)
        setFormData({
            title: '',
            description: '',
            imageUrl: '',
            linkUrl: '',
            order: banners.length,
            isActive: true
        })
        setModalOpen(true)
    }

    const openEditModal = (banner) => {
        setEditingBanner(banner)
        setFormData({
            title: banner.title || '',
            description: banner.description || '',
            imageUrl: banner.imageUrl || '',
            linkUrl: banner.linkUrl || '',
            order: banner.order || 0,
            isActive: banner.isActive !== false
        })
        setModalOpen(true)
    }

    const handleSave = async () => {
        if (!formData.imageUrl) {
            alert('Please provide an image URL')
            return
        }

        setSaving(true)
        try {
            if (editingBanner) {
                // Update existing banner
                const bannerRef = doc(db, 'admin_banners', editingBanner.id)
                await updateDoc(bannerRef, {
                    ...formData,
                    updatedAt: serverTimestamp()
                })

                setBanners(prev => prev.map(b =>
                    b.id === editingBanner.id ? { ...b, ...formData } : b
                ))
            } else {
                // Add new banner
                const docRef = await addDoc(collection(db, 'admin_banners'), {
                    ...formData,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                })

                setBanners(prev => [...prev, { id: docRef.id, ...formData }])
            }

            setModalOpen(false)
            alert(editingBanner ? 'Banner updated!' : 'Banner added!')
        } catch (error) {
            console.error('Error saving banner:', error)
            alert('Failed to save banner')
        } finally {
            setSaving(false)
        }
    }

    const handleToggleActive = async (banner) => {
        try {
            const bannerRef = doc(db, 'admin_banners', banner.id)
            await updateDoc(bannerRef, {
                isActive: !banner.isActive,
                updatedAt: serverTimestamp()
            })

            setBanners(prev => prev.map(b =>
                b.id === banner.id ? { ...b, isActive: !b.isActive } : b
            ))
        } catch (error) {
            console.error('Error toggling banner:', error)
        }
    }

    const handleDelete = async (bannerId) => {
        try {
            await deleteDoc(doc(db, 'admin_banners', bannerId))
            setBanners(prev => prev.filter(b => b.id !== bannerId))
            setDeleteConfirm(null)
            alert('Banner deleted!')
        } catch (error) {
            console.error('Error deleting banner:', error)
            alert('Failed to delete banner')
        }
    }

    const moveOrder = async (banner, direction) => {
        const currentIndex = banners.findIndex(b => b.id === banner.id)
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

        if (newIndex < 0 || newIndex >= banners.length) return

        const newBanners = [...banners]
        const [removed] = newBanners.splice(currentIndex, 1)
        newBanners.splice(newIndex, 0, removed)

        // Update order values
        const updates = newBanners.map(async (b, index) => {
            const bannerRef = doc(db, 'admin_banners', b.id)
            await updateDoc(bannerRef, { order: index })
            return { ...b, order: index }
        })

        const updatedBanners = await Promise.all(updates)
        setBanners(updatedBanners)
    }

    return (
        <AdminLayout
            pageTitle="Banner Carousel"
            pageDescription="Manage landing page banner carousel"
        >
            {/* Table */}
            <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                    <h3 className={styles.tableTitle}>All Banners ({banners.length})</h3>
                    <div className={styles.tableActions}>
                        <button className={styles.addBtn} onClick={openAddModal}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                            </svg>
                            Add Banner
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.loadingSpinner}></div>
                    </div>
                ) : banners.length === 0 ? (
                    <div className={styles.emptyState}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                        </svg>
                        <h3>No Banners Yet</h3>
                        <p>Add your first banner to display on the landing page</p>
                        <button className={styles.addBtn} onClick={openAddModal}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                            </svg>
                            Add Banner
                        </button>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Order</th>
                                <th>Preview</th>
                                <th>Title</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {banners.map((banner, index) => (
                                <tr key={banner.id}>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <button
                                                className={styles.actionBtn}
                                                onClick={() => moveOrder(banner, 'up')}
                                                disabled={index === 0}
                                                style={{ opacity: index === 0 ? 0.3 : 1 }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
                                                </svg>
                                            </button>
                                            <button
                                                className={styles.actionBtn}
                                                onClick={() => moveOrder(banner, 'down')}
                                                disabled={index === banners.length - 1}
                                                style={{ opacity: index === banners.length - 1 ? 0.3 : 1 }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                    <td>
                                        <Image
                                            src={banner.imageUrl}
                                            alt={banner.title || 'Banner'}
                                            width={120}
                                            height={70}
                                            unoptimized
                                            style={{ borderRadius: '8px', objectFit: 'cover' }}
                                            onError={(e) => {
                                                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><rect fill="%23333" width="100" height="60"/><text fill="%23666" font-size="8" x="50" y="35" text-anchor="middle">Error</text></svg>'
                                            }}
                                        />
                                    </td>
                                    <td>
                                        <div className={styles.vehicleDetails}>
                                            <h4>{banner.title || 'Untitled'}</h4>
                                            <span>{banner.description || 'No description'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span
                                            className={`${styles.statusBadge} ${banner.isActive !== false ? styles.active : styles.inactive}`}
                                            onClick={() => handleToggleActive(banner)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {banner.isActive !== false ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.actionBtns}>
                                            <button
                                                className={styles.actionBtn}
                                                onClick={() => openEditModal(banner)}
                                                title="Edit"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                                </svg>
                                            </button>
                                            <button
                                                className={`${styles.actionBtn} ${styles.delete}`}
                                                onClick={() => setDeleteConfirm(banner.id)}
                                                title="Delete"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add/Edit Modal */}
            {modalOpen && (
                <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>{editingBanner ? 'Edit Banner' : 'Add New Banner'}</h3>
                            <button className={styles.closeBtn} onClick={() => setModalOpen(false)}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                </svg>
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            {/* Image Preview */}
                            <div className={styles.bannerPreview}>
                                {formData.imageUrl ? (
                                    <Image
                                        src={formData.imageUrl}
                                        alt="Preview"
                                        fill
                                        unoptimized
                                        style={{ objectFit: 'cover' }}
                                        onError={(e) => {
                                            e.target.style.display = 'none'
                                        }}
                                    />
                                ) : (
                                    <div className={styles.bannerPlaceholder}>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                                        </svg>
                                        <p>Enter image URL below</p>
                                    </div>
                                )}
                            </div>

                            <div className={styles.formGroup}>
                                <label>Image URL *</label>
                                <input
                                    type="url"
                                    value={formData.imageUrl}
                                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                    placeholder="https://example.com/banner.jpg"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Banner title (optional)"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Short description (optional)"
                                    rows={3}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Link URL (optional)</label>
                                <input
                                    type="url"
                                    value={formData.linkUrl}
                                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                                    placeholder="https://example.com/page"
                                />
                            </div>

                            <div className={styles.toggleGroup}>
                                <div>
                                    <label>Active</label>
                                    <span>Show this banner on landing page</span>
                                </div>
                                <div
                                    className={`${styles.toggle} ${formData.isActive ? styles.active : ''}`}
                                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                ></div>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setModalOpen(false)}>
                                Cancel
                            </button>
                            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : (editingBanner ? 'Update Banner' : 'Add Banner')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className={styles.modalOverlay} onClick={() => setDeleteConfirm(null)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className={styles.modalHeader}>
                            <h3>Delete Banner</h3>
                            <button className={styles.closeBtn} onClick={() => setDeleteConfirm(null)}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                </svg>
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <p style={{ color: 'var(--admin-text-secondary)' }}>
                                Are you sure you want to delete this banner? This action cannot be undone.
                            </p>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setDeleteConfirm(null)}>
                                Cancel
                            </button>
                            <button
                                className={styles.saveBtn}
                                onClick={() => handleDelete(deleteConfirm)}
                                style={{ background: 'var(--admin-error)' }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}
