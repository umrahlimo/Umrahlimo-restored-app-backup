'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import AdminLayout from '../components/AdminLayout'
import styles from '../admin.module.scss'
import { db, storage } from '../../../lib/firebase'
import { collection, addDoc, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'

const slugify = (text = '') => text
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')

export default function BlogManagementPage() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewImage, setPreviewImage] = useState('')

  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    status: 'draft',
    imageUrl: '',
    imageStoragePath: '',
    publishedAt: null
  })

  const isEditing = useMemo(() => Boolean(editingId), [editingId])

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, 'articles'), orderBy('updatedAt', 'desc'))
      const snapshot = await getDocs(q)
      const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
      setArticles(list)
    } catch (error) {
      console.error('Error fetching articles:', error)
      const snapshot = await getDocs(collection(db, 'articles'))
      const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
      setArticles(list)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setSelectedImage(null)
    setPreviewImage('')
    setForm({
      title: '',
      excerpt: '',
      content: '',
      status: 'draft',
      imageUrl: '',
      imageStoragePath: '',
      publishedAt: null
    })
  }

  const openEdit = (article) => {
    setEditingId(article.id)
    setSelectedImage(null)
    setPreviewImage(article.imageUrl || '')
    setForm({
      title: article.title || '',
      excerpt: article.excerpt || '',
      content: article.content || '',
      status: article.status || 'draft',
      imageUrl: article.imageUrl || '',
      imageStoragePath: article.imageStoragePath || '',
      publishedAt: article.publishedAt || null
    })
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedImage(file)
    const reader = new FileReader()
    reader.onloadend = () => setPreviewImage(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      alert('Title and content are required.')
      return
    }

    setSaving(true)

    try {
      let imageUrl = form.imageUrl || ''
      let imageStoragePath = form.imageStoragePath || ''

      if (selectedImage) {
        if (imageStoragePath) {
          try {
            await deleteObject(ref(storage, imageStoragePath))
          } catch (error) {
            console.warn('Old image cleanup failed:', error)
          }
        }

        const nextStoragePath = `articles/${Date.now()}_${selectedImage.name}`
        const uploadRef = ref(storage, nextStoragePath)
        await uploadBytes(uploadRef, selectedImage)
        imageUrl = await getDownloadURL(uploadRef)
        imageStoragePath = nextStoragePath
      }

      if (!imageUrl) {
        alert('Main picture is required.')
        setSaving(false)
        return
      }

      const slug = slugify(form.title)
      const nextPublishedAt = form.status === 'published'
        ? (form.publishedAt || serverTimestamp())
        : null
      const payload = {
        title: form.title.trim(),
        slug,
        excerpt: form.excerpt.trim(),
        content: form.content.trim(),
        status: form.status,
        imageUrl,
        imageStoragePath,
        updatedAt: serverTimestamp(),
        publishedAt: nextPublishedAt
      }

      if (isEditing) {
        await updateDoc(doc(db, 'articles', editingId), payload)
      } else {
        await addDoc(collection(db, 'articles'), {
          ...payload,
          createdAt: serverTimestamp()
        })
      }

      await fetchArticles()
      resetForm()
      alert(isEditing ? 'Article updated.' : 'Article created.')
    } catch (error) {
      console.error('Error saving article:', error)
      alert('Failed to save article.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (article) => {
    if (!window.confirm('Delete this article?')) return

    try {
      await deleteDoc(doc(db, 'articles', article.id))
      if (article.imageStoragePath) {
        try {
          await deleteObject(ref(storage, article.imageStoragePath))
        } catch (error) {
          console.warn('Image cleanup failed:', error)
        }
      }
      setArticles((prev) => prev.filter((item) => item.id !== article.id))
    } catch (error) {
      console.error('Delete article error:', error)
      alert('Failed to delete article.')
    }
  }

  const togglePublish = async (article) => {
    try {
      const nextStatus = article.status === 'published' ? 'draft' : 'published'
      await updateDoc(doc(db, 'articles', article.id), {
        status: nextStatus,
        publishedAt: nextStatus === 'published' ? serverTimestamp() : null,
        updatedAt: serverTimestamp()
      })

      setArticles((prev) => prev.map((item) => (
        item.id === article.id ? { ...item, status: nextStatus } : item
      )))
    } catch (error) {
      console.error('Toggle publish error:', error)
      alert('Failed to update publish status.')
    }
  }

  return (
    <AdminLayout pageTitle="Blog Management" pageDescription="Add, edit, publish, and delete blog articles">
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>{isEditing ? 'Edit Article' : 'Create New Article'}</h3>
          <div className={styles.tableActions}>
            {isEditing && (
              <button className={styles.actionBtn} onClick={resetForm}>Cancel Edit</button>
            )}
            <button className={styles.addBtn} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : (isEditing ? 'Update Article' : 'Publish Article')}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Article title"
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
          />
          <textarea
            value={form.excerpt}
            onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
            placeholder="Short excerpt for blog listing"
            rows={2}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
          />
          <textarea
            value={form.content}
            onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
            placeholder="Article content"
            rows={8}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
          />

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>

            <input type="file" accept="image/*" onChange={handleImageChange} />
          </div>

          {previewImage && (
            <Image
              src={previewImage}
              alt="Article preview"
              width={220}
              height={130}
              unoptimized
              style={{ borderRadius: '8px', objectFit: 'cover' }}
            />
          )}
        </div>

        {loading ? (
          <div className={styles.loadingState}><div className={styles.loadingSpinner}></div></div>
        ) : articles.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No articles yet</h3>
            <p>Create your first blog article from the form above.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id}>
                  <td>
                    <Image
                      src={article.imageUrl || '/logobg.png'}
                      alt={article.title || 'Article'}
                      width={120}
                      height={70}
                      unoptimized
                      style={{ borderRadius: '8px', objectFit: 'cover' }}
                    />
                  </td>
                  <td>
                    <div className={styles.vehicleDetails}>
                      <h4>{article.title}</h4>
                      <span>{article.excerpt || 'No excerpt'}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${article.status === 'published' ? styles.active : styles.inactive}`}>
                      {article.status || 'draft'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionBtns}>
                      <button className={styles.actionBtn} onClick={() => openEdit(article)}>Edit</button>
                      <button className={styles.actionBtn} onClick={() => togglePublish(article)}>
                        {article.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button className={`${styles.actionBtn} ${styles.delete}`} onClick={() => handleDelete(article)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  )
}
