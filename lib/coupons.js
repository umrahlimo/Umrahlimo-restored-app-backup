import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore'
import { db } from './firebase'

const normalizeCode = (code) => code.trim().toUpperCase()

const getExpiresAtDate = (value) => {
  if (!value) return null
  return value?.toDate ? value.toDate() : new Date(value)
}

export const validateCoupon = async (code) => {
  try {
    const normalized = normalizeCode(code)
    if (!normalized) {
      return { valid: false, error: 'Please enter a coupon code' }
    }

    const snap = await getDocs(
      query(collection(db, 'admin_coupons'), where('code', '==', normalized))
    )

    if (snap.empty) {
      return { valid: false, error: 'Invalid coupon code' }
    }

    const couponDoc = snap.docs[0]
    const data = couponDoc.data()
    const expiresAt = getExpiresAtDate(data.expiresAt)

    if (data.status === 'used') {
      return { valid: false, error: 'This coupon has already been used' }
    }

    if (expiresAt && expiresAt < new Date()) {
      if (data.status === 'active') {
        await updateDoc(doc(db, 'admin_coupons', couponDoc.id), { status: 'expired' })
      }
      return { valid: false, error: 'This coupon has expired' }
    }

    if (data.status !== 'active') {
      return { valid: false, error: 'This coupon is not valid' }
    }

    return {
      valid: true,
      coupon: {
        id: couponDoc.id,
        code: data.code,
        discountPercent: data.discountPercent,
        expiresAt: expiresAt ? expiresAt.toISOString() : null
      }
    }
  } catch (error) {
    console.error('Coupon validation error:', error)
    return { valid: false, error: 'Unable to validate coupon. Please try again.' }
  }
}

export const redeemCoupon = async (couponId, bookingRef) => {
  const couponRef = doc(db, 'admin_coupons', couponId)

  await runTransaction(db, async (transaction) => {
    const couponDoc = await transaction.get(couponRef)
    if (!couponDoc.exists()) {
      throw new Error('Coupon not found')
    }

    const data = couponDoc.data()
    const expiresAt = getExpiresAtDate(data.expiresAt)

    if (data.status === 'used') {
      throw new Error('Coupon already used')
    }

    if (expiresAt && expiresAt < new Date()) {
      throw new Error('Coupon expired')
    }

    if (data.status !== 'active') {
      throw new Error('Coupon not active')
    }

    transaction.update(couponRef, {
      status: 'used',
      usedAt: serverTimestamp(),
      usedByBookingRef: bookingRef
    })
  })
}
