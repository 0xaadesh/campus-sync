"use server"

import { prisma } from "@/lib/prisma"
import { sendVerificationEmail, generateOtp } from "@/lib/email"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

const OTP_EXPIRY_MINUTES = 10
const MAX_ATTEMPTS = 5

// Send verification OTP to email
export async function sendVerificationOtpAction(email: string): Promise<{ error?: string; success?: boolean }> {
    if (!email || !email.includes("@")) {
        return { error: "Invalid email address" }
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Generate OTP
    const otp = generateOtp()
    const hashedOtp = await bcrypt.hash(otp, 10)
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    // Upsert token (replace any existing token for this email)
    await prisma.emailVerificationToken.upsert({
        where: { email: normalizedEmail },
        update: {
            token: hashedOtp,
            expiresAt,
            attempts: 0,
            createdAt: new Date(),
        },
        create: {
            email: normalizedEmail,
            token: hashedOtp,
            expiresAt,
            attempts: 0,
        },
    })

    // Send email
    await sendVerificationEmail({ to: normalizedEmail, otp })

    // Set email in cookie for verification page
    const cookieStore = await cookies()
    cookieStore.set("verify_email", normalizedEmail, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: OTP_EXPIRY_MINUTES * 60,
    })

    return { success: true }
}

// Verify OTP and confirm email
export async function verifyEmailOtpAction(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData
): Promise<{ error?: string; success?: boolean }> {
    const otp = formData.get("otp") as string

    if (!otp || otp.length !== 6) {
        return { error: "Please enter the 6-digit OTP" }
    }

    // Get email from cookie
    const cookieStore = await cookies()
    const email = cookieStore.get("verify_email")?.value

    if (!email) {
        return { error: "Session expired. Please sign up again." }
    }

    // Find token
    const verificationToken = await prisma.emailVerificationToken.findUnique({
        where: { email },
    })

    if (!verificationToken) {
        return { error: "No OTP found. Please request a new one." }
    }

    // Check expiry
    if (new Date() > verificationToken.expiresAt) {
        await prisma.emailVerificationToken.delete({ where: { email } })
        return { error: "OTP has expired. Please request a new one." }
    }

    // Check max attempts
    if (verificationToken.attempts >= MAX_ATTEMPTS) {
        await prisma.emailVerificationToken.delete({ where: { email } })
        return { error: "Too many attempts. Please request a new OTP." }
    }

    // Verify OTP
    const isValid = await bcrypt.compare(otp, verificationToken.token)

    if (!isValid) {
        // Increment attempts
        await prisma.emailVerificationToken.update({
            where: { email },
            data: { attempts: verificationToken.attempts + 1 },
        })
        const remaining = MAX_ATTEMPTS - verificationToken.attempts - 1
        return { error: `Invalid OTP. ${remaining} attempts remaining.` }
    }

    // Mark email as verified
    await prisma.user.update({
        where: { email },
        data: { emailVerified: new Date() },
    })

    // Clean up token and cookies
    await prisma.emailVerificationToken.delete({ where: { email } })
    cookieStore.delete("verify_email")

    return { success: true }
}

// Resend verification OTP
export async function resendVerificationOtpAction(): Promise<{ error?: string; success?: boolean }> {
    const cookieStore = await cookies()
    const email = cookieStore.get("verify_email")?.value

    if (!email) {
        return { error: "Session expired. Please sign up again." }
    }

    // Check if user exists and is not already verified
    const user = await prisma.user.findUnique({
        where: { email },
        select: { emailVerified: true },
    })

    if (!user) {
        return { error: "User not found. Please sign up again." }
    }

    if (user.emailVerified) {
        return { error: "Email already verified. Please log in." }
    }

    // Generate new OTP
    const otp = generateOtp()
    const hashedOtp = await bcrypt.hash(otp, 10)
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    // Update token
    await prisma.emailVerificationToken.upsert({
        where: { email },
        update: {
            token: hashedOtp,
            expiresAt,
            attempts: 0,
            createdAt: new Date(),
        },
        create: {
            email,
            token: hashedOtp,
            expiresAt,
            attempts: 0,
        },
    })

    // Send email
    await sendVerificationEmail({ to: email, otp })

    // Refresh cookie expiry
    cookieStore.set("verify_email", email, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: OTP_EXPIRY_MINUTES * 60,
    })

    return { success: true }
}
