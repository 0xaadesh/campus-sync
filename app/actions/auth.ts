"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { signIn } from "@/auth"
import { Role } from "@prisma/client"
import { redirect } from "next/navigation"
import { sendVerificationOtpAction } from "./verify-email"

export async function signupAction(prevState: any, formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const role = formData.get("role") as Role
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  // Validation
  if (!name || !email || !role || !password || !confirmPassword) {
    return { error: "All fields are required" }
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" }
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" }
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    return { error: "User with this email already exists" }
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Create user
  try {
    await prisma.user.create({
      data: {
        name,
        email,
        role,
        password: hashedPassword,
        // emailVerified is null by default - requires OTP verification
      },
    })

    // Send verification OTP and redirect to verify page
    await sendVerificationOtpAction(email)

    redirect("/verify-email")
  } catch (error: any) {
    // Re-throw redirect errors - they are expected
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error
    }
    console.error("Signup error:", error)
    return { error: "Failed to create account. Please try again." }
  }
}

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  // Check if user exists and if email is verified
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { emailVerified: true },
  })

  if (user && !user.emailVerified) {
    // Send new OTP and redirect to verify page
    await sendVerificationOtpAction(email)
    redirect("/verify-email")
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    })
    // If we reach here without redirect, something went wrong
    return { error: "Authentication failed" }
  } catch (error: any) {
    // Re-throw redirect errors - they are expected (successful login)
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error
    }
    // Handle CredentialsSignin error (invalid credentials)
    if (error?.name === "CredentialsSignin" || error?.cause?.name === "CredentialsSignin") {
      return { error: "Invalid email or password" }
    }
    // Log other errors for debugging
    console.error("Login error:", error)
    return { error: "Invalid email or password" }
  }
}

export async function getCurrentUser() {
  const { auth } = await import("@/auth")
  const session = await auth()
  if (!session?.user?.email) {
    return null
  }

  // Fetch additional user data from database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      availability: true,
      status: true,
    }
  })

  return user
}

export async function updateUserName(name: string) {
  const { auth } = await import("@/auth")
  const session = await auth()

  if (!session?.user?.email) {
    return { error: "Not authenticated" }
  }

  const trimmedName = name.trim()

  if (!trimmedName) {
    return { error: "Name is required" }
  }

  if (trimmedName.length > 100) {
    return { error: "Name must be 100 characters or less" }
  }

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { name: trimmedName },
    })
    return { success: true }
  } catch (error) {
    console.error("Update name error:", error)
    return { error: "Failed to update name. Please try again." }
  }
}

export async function updateUserAvailability(availability: "Active" | "Away" | "Busy") {
  const { auth } = await import("@/auth")
  const session = await auth()

  if (!session?.user?.email) {
    return { error: "Not authenticated" }
  }

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { availability },
    })
    return { success: true }
  } catch (error) {
    console.error("Update availability error:", error)
    return { error: "Failed to update availability. Please try again." }
  }
}

export async function updateUserStatus(status: string) {
  const { auth } = await import("@/auth")
  const session = await auth()

  if (!session?.user?.email) {
    return { error: "Not authenticated" }
  }

  const trimmedStatus = status.trim()

  if (trimmedStatus.length > 100) {
    return { error: "Status must be 100 characters or less" }
  }

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { status: trimmedStatus || null },
    })
    return { success: true }
  } catch (error) {
    console.error("Update status error:", error)
    return { error: "Failed to update status. Please try again." }
  }
}

