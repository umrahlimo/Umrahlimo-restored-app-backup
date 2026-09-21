'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { collection, getDocs, limit, query, where } from 'firebase/firestore'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'
import { db } from '../../../lib/firebase'
import Script from 'next/script'
import styles from './page.module.css'

export default function BlogArticlePage() {
  const params = useParams()
  const slug = params?.slug
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadArticle = async () => {
      if (!slug) return
      setLoading(true)
      try {
        const articleSnap = await getDocs(
          query(
            collection(db, 'articles'),
            where('slug', '==', slug),
            where('status', '==', 'published'),
            limit(1)
          )
        )

        if (!articleSnap.empty) {
          setArticle({ id: articleSnap.docs[0].id, ...articleSnap.docs[0].data() })
        }
      } catch (error) {
        console.error('Error loading article:', error)
      } finally {
        setLoading(false)
      }
    }

    loadArticle()
  }, [slug])

  return (
    <div className={styles.page}>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-4MSXXT9GMF"
        strategy="afterInteractive"
      />
      <Script id="gtag-init-blog" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-4MSXXT9GMF');
        `}
      </Script>
      <Navbar isStatic={true} />

      <main className={styles.main}>
        {loading ? (
          <div className={styles.state}>Loading article...</div>
        ) : !article ? (
          <div className={styles.state}>
            <h2>Article not found</h2>
            <Link href="/blog">Back to Blog</Link>
          </div>
        ) : (
          <article className={styles.article}>
            <h1>{article.title}</h1>
            {article.imageUrl && (
              <Image
                src={article.imageUrl}
                alt={article.title}
                width={1200}
                height={600}
                className={styles.heroImage}
              />
            )}
            {article.excerpt && <p className={styles.excerpt}>{article.excerpt}</p>}
            <div className={styles.content} dangerouslySetInnerHTML={{ __html: article.content }}></div>
            <Link href="/blog" className={styles.backLink}>← Back to Blog</Link>
          </article>
        )}
      </main>

      <Footer />
    </div>
  )
}
