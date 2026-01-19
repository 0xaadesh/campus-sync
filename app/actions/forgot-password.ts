"use server"

import { prisma } from "@/lib/prisma"
import { sendOtpEmail, generateOtp } from "@/lib/email"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

const OTP_EXPIRY_MINUTES = 10
const MAX_ATTEMPTS = 5

// Send OTP to email
export async function sendOtpAction(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData
): Promise<{ error?: string; success?: boolean }> {
    const email = formData.get("email") as string

    if (!email || !email.includes("@")) {
        return { error: "Please enter a valid email address" }
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user exists (but don't reveal this to prevent enumeration)
    const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
    })

    // Always return success to prevent email enumeration
    // But only actually send email if user exists
    if (user) {
        // Generate OTP
        const otp = generateOtp()
        const hashedOtp = await bcrypt.hash(otp, 10)
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

        // Upsert token (replace any existing token for this email)
        await prisma.passwordResetToken.upsert({
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
        await sendOtpEmail({ to: normalizedEmail, otp })
    }

    // Set email in cookie for next steps (prevents manipulation)
    const cookieStore = await cookies()
    cookieStore.set("reset_email", normalizedEmail, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: OTP_EXPIRY_MINUTES * 60,
    })

    return { success: true }
}

// Verify OTP
export async function verifyOtpAction(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData
): Promise<{ error?: string; success?: boolean }> {
    const otp = formData.get("otp") as string

    if (!otp || otp.length !== 6) {
        return { error: "Please enter the 6-digit OTP" }
    }

    // Get email from cookie
    const cookieStore = await cookies()
    const email = cookieStore.get("reset_email")?.value

    if (!email) {
        return { error: "Session expired. Please start again." }
    }

    // Find token
    const resetToken = await prisma.passwordResetToken.findUnique({
        where: { email },
    })

    if (!resetToken) {
        return { error: "No OTP found. Please request a new one." }
    }

    // Check expiry
    if (new Date() > resetToken.expiresAt) {
        await prisma.passwordResetToken.delete({ where: { email } })
        return { error: "OTP has expired. Please request a new one." }
    }

    // Check max attempts
    if (resetToken.attempts >= MAX_ATTEMPTS) {
        await prisma.passwordResetToken.delete({ where: { email } })
        return { error: "Too many attempts. Please request a new OTP." }
    }

    // Verify OTP
    const isValid = await bcrypt.compare(otp, resetToken.token)

    if (!isValid) {
        // Increment attempts
        await prisma.passwordResetToken.update({
            where: { email },
            data: { attempts: resetToken.attempts + 1 },
        })
        const remaining = MAX_ATTEMPTS - resetToken.attempts - 1
        return { error: `Invalid OTP. ${remaining} attempts remaining.` }
    }

    // Mark as verified in cookie
    cookieStore.set("otp_verified", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 5 * 60, // 5 minutes to complete password reset
    })

    return { success: true }
}

// Reset password
export async function resetPasswordAction(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData
): Promise<{ error?: string; success?: boolean }> {
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (!password || password.length < 6) {
        return { error: "Password must be at least 6 characters" }
    }

    if (password !== confirmPassword) {
        return { error: "Passwords do not match" }
    }

    // Get email and verify status from cookie
    const cookieStore = await cookies()
    const email = cookieStore.get("reset_email")?.value
    const otpVerified = cookieStore.get("otp_verified")?.value

    if (!email || otpVerified !== "true") {
        return { error: "Session expired. Please start again." }
    }

    // Check token still exists
    const resetToken = await prisma.passwordResetToken.findUnique({
        where: { email },
    })

    if (!resetToken) {
        return { error: "Session expired. Please start again." }
    }

    // Hash new password and update user
    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
    })

    // Clean up token and cookies
    await prisma.passwordResetToken.delete({ where: { email } })
    cookieStore.delete("reset_email")
    cookieStore.delete("otp_verified")

    return { success: true }
}

// Resend OTP
export async function resendOtpAction(): Promise<{ error?: string; success?: boolean }> {
    const cookieStore = await cookies()
    const email = cookieStore.get("reset_email")?.value

    if (!email) {
        return { error: "Session expired. Please start again." }
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
        where: { email },
    })

    if (!user) {
        // Pretend success to prevent enumeration
        return { success: true }
    }

    // Generate new OTP
    const otp = generateOtp()
    const hashedOtp = await bcrypt.hash(otp, 10)
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    // Update token
    await prisma.passwordResetToken.upsert({
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
    await sendOtpEmail({ to: email, otp })

    // Refresh cookie expiry
    cookieStore.set("reset_email", email, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: OTP_EXPIRY_MINUTES * 60,
    })

    return { success: true }
}
