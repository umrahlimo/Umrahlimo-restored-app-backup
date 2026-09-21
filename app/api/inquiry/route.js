import { NextResponse } from 'next/server'
import { db } from '../../../lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import nodemailer from 'nodemailer'

const RECIPIENT_EMAILS = ['info@umrahlimo.com', 'corp@saibtrading.com']

export async function POST(req) {
  try {
    const body = await req.json()

    const {
      firstName,
      lastName,
      email,
      countryCode,
      phone,
      arrivalDate,
      persons,
      luggage,
      vehicleChoice,
      comments,
      spamUserAnswer,
      spamExpectedAnswer,
      honeypot,
      subscribeNewsletter
    } = body

    // 1. Spam Check Validation
    if (honeypot && honeypot.trim() !== '') {
      return NextResponse.json(
        { success: false, error: 'Spam detected.' },
        { status: 400 }
      )
    }

    if (parseInt(spamUserAnswer, 10) !== parseInt(spamExpectedAnswer, 10)) {
      return NextResponse.json(
        { success: false, error: 'Incorrect spam verification answer. Please try again.' },
        { status: 400 }
      )
    }

    // 2. Mandatory Fields Validation
    if (!firstName || !lastName || !email || !phone || !arrivalDate || !vehicleChoice) {
      return NextResponse.json(
        { success: false, error: 'Please fill in all required fields.' },
        { status: 400 }
      )
    }

    const fullPhone = `${countryCode || ''} ${phone}`.trim()

    // 3. Save to Firestore DB in collection "inquiry"
    let inquiryId = null
    try {
      const docRef = await addDoc(collection(db, 'inquiry'), {
        firstName,
        lastName,
        email,
        countryCode: countryCode || '',
        phone,
        fullPhone,
        arrivalDate,
        persons: Number(persons) || 1,
        luggage: Number(luggage) || 0,
        vehicleChoice,
        comments: comments || '',
        subscribeNewsletter: subscribeNewsletter || false,
        status: 'new',
        createdAt: serverTimestamp(),
        createdAtIso: new Date().toISOString()
      })
      inquiryId = docRef.id
    } catch (dbError) {
      console.error('Firestore inquiry insert error:', dbError)
      // Fallback: Continue so user inquiry is still processed
    }

    // 4. Send Email Notification
    let emailSent = false
    try {
      const host = process.env.SMTP_HOST || 'smtp.gmail.com'
      const port = Number(process.env.SMTP_PORT || 465)
      const user = process.env.SMTP_USER
      const pass = process.env.SMTP_PASS
      const from = process.env.SMTP_FROM || user || 'no-reply@umrahlimo.com'

      if (user && pass) {
        const transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass }
        })

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #08111f 0%, #0f172a 100%); padding: 24px; text-align: center; color: #ffffff;">
              <h2 style="margin: 0; font-size: 22px; color: #5eead4;">New Customer Inquiry</h2>
              <p style="margin: 6px 0 0; color: #cbd5e1; font-size: 14px;">UmrahLimo VIP Transport Service</p>
            </div>
            
            <div style="padding: 24px; color: #1e293b;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; width: 140px;">Customer Name:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">${firstName} ${lastName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">Email:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;"><a href="mailto:${email}" style="color: #0f766e;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">Phone / WhatsApp:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;"><a href="https://wa.me/${fullPhone.replace(/[^0-9]/g, '')}" style="color: #0f766e;">${fullPhone}</a></td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">Arrival Date:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">${arrivalDate}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">Persons / Luggage:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">${persons} Passengers | ${luggage} Luggage</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">Vehicle Choice:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0d9488;">${vehicleChoice}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-weight: bold; vertical-align: top;">Comments / Notes:</td>
                  <td style="padding: 10px 0; white-space: pre-wrap;">${comments || 'None'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-weight: bold; vertical-align: top;">Newsletter:</td>
                  <td style="padding: 10px 0; white-space: pre-wrap;">${subscribeNewsletter ? 'Subscribed ✔️' : 'Not Subscribed ❌'}</td>
                </tr>
              </table>
            </div>

            <div style="background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
              Inquiry ID: ${inquiryId || 'N/A'} · Received via UmrahLimo Portal
            </div>
          </div>
        `

        await transporter.sendMail({
          from: `"UmrahLimo Inquiry" <${from}>`,
          to: RECIPIENT_EMAILS.join(', '),
          subject: `⚡ New Trip Inquiry from ${firstName} ${lastName} (${vehicleChoice})`,
          html: htmlContent
        })

        emailSent = true
      }
    } catch (mailErr) {
      console.warn('Nodemailer email sending skipped or failed:', mailErr.message)
    }

    return NextResponse.json({
      success: true,
      message: 'Your inquiry has been submitted successfully! Our team will contact you shortly.',
      inquiryId,
      emailSent
    })

  } catch (error) {
    console.error('Inquiry submission API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error processing inquiry.' },
      { status: 500 }
    )
  }
}
