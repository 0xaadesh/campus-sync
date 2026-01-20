import nodemailer from "nodemailer"

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
  secure: process.env.EMAIL_SERVER_PORT === "465",
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
})

interface SendOtpEmailParams {
  to: string
  otp: string
}

export async function sendOtpEmail({ to, otp }: SendOtpEmailParams) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || "Campus Sync <noreply@campussync.com>",
    to,
    subject: "Your Password Reset OTP - Campus Sync",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
          <div style="max-width: 400px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">
              Password Reset
            </h1>
            <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; text-align: center;">
              Use this OTP to reset your password:
            </p>
            <div style="background: #f4f4f5; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #18181b;">
                ${otp}
              </span>
            </div>
            <p style="margin: 0 0 8px; color: #71717a; font-size: 14px; text-align: center;">
              This code expires in <strong>10 minutes</strong>.
            </p>
            <p style="margin: 0; color: #71717a; font-size: 14px; text-align: center;">
              If you didn't request this, please ignore this email.
            </p>
          </div>
        </body>
      </html>
    `,
    text: `Your Password Reset OTP is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.`,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error("Failed to send OTP email:", error)
    return { success: false, error: "Failed to send email" }
  }
}

// Generate a 6-digit OTP
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send verification email for account confirmation
export async function sendVerificationEmail({ to, otp }: SendOtpEmailParams) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || "Campus Sync <noreply@campussync.com>",
    to,
    subject: "Verify Your Email - Campus Sync",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
          <div style="max-width: 400px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">
              Welcome to Campus Sync! 🎉
            </h1>
            <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; text-align: center;">
              Use this OTP to verify your email:
            </p>
            <div style="background: #f4f4f5; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #18181b;">
                ${otp}
              </span>
            </div>
            <p style="margin: 0 0 8px; color: #71717a; font-size: 14px; text-align: center;">
              This code expires in <strong>10 minutes</strong>.
            </p>
            <p style="margin: 0; color: #71717a; font-size: 14px; text-align: center;">
              If you didn't create an account, please ignore this email.
            </p>
          </div>
        </body>
      </html>
    `,
    text: `Welcome to Campus Sync!\n\nYour verification OTP is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't create an account, please ignore this email.`,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error("Failed to send verification email:", error)
    return { success: false, error: "Failed to send email" }
  }
}
