import Stripe from 'stripe'
import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
        const { amount, currency = 'usd', bookingRef, customerEmail } = await request.json()

        // Validate amount
        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: 'Invalid amount' },
                { status: 400 }
            )
        }

        // Stripe expects amount in smallest currency unit (cents for USD)
        const amountInSmallestUnit = Math.round(amount * 100)

        // Create PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInSmallestUnit,
            currency: currency.toLowerCase(),
            metadata: {
                bookingRef: bookingRef || '',
                source: 'umrahlimo-customer'
            },
            receipt_email: customerEmail || undefined,
            automatic_payment_methods: {
                enabled: true,
            },
        })

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        })
    } catch (error) {
        console.error('Stripe PaymentIntent error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create payment intent' },
            { status: 500 }
        )
    }
}
