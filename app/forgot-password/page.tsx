"use client"

import * as React from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    sendOtpAction,
    verifyOtpAction,
    resetPasswordAction,
    resendOtpAction,
} from "@/app/actions/forgot-password"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/password-input"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Field,
    FieldContent,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "@/components/ui/input-otp"
import { ArrowLeft, Check } from "lucide-react"

const EMAIL_DOMAIN = "@apsit.edu.in"

type Step = "email" | "otp" | "password" | "success"

function SubmitButton({ children }: { children: React.ReactNode }) {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Spinner size="sm" className="mr-2" />}
            {children}
        </Button>
    )
}

export default function ForgotPasswordPage() {
    const router = useRouter()
    const [step, setStep] = React.useState<Step>("email")
    const [username, setUsername] = React.useState("")
    const [otp, setOtp] = React.useState("")
    const [resendCooldown, setResendCooldown] = React.useState(0)
    const [resendError, setResendError] = React.useState("")

    // Full email for display
    const fullEmail = username + EMAIL_DOMAIN

    // Form state handlers
    const [emailState, emailAction] = React.useActionState(sendOtpAction, null)
    const [otpState, otpAction] = React.useActionState(verifyOtpAction, null)
    const [passwordState, passwordAction] = React.useActionState(
        resetPasswordAction,
        null
    )

    // Handle step transitions
    React.useEffect(() => {
        if (emailState?.success) {
            setStep("otp")
        }
    }, [emailState])

    React.useEffect(() => {
        if (otpState?.success) {
            setStep("password")
        }
    }, [otpState])

    React.useEffect(() => {
        if (passwordState?.success) {
            setStep("success")
        }
    }, [passwordState])

    // Resend cooldown timer
    React.useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [resendCooldown])

    const handleResendOtp = async () => {
        setResendError("")
        setResendCooldown(60)
        const result = await resendOtpAction()
        if (result.error) {
            setResendError(result.error)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    {step !== "success" && step !== "email" && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-fit -ml-2 mb-2"
                            onClick={() => {
                                if (step === "otp") setStep("email")
                                if (step === "password") setStep("otp")
                            }}
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back
                        </Button>
                    )}
                    <CardTitle>
                        {step === "email" && "Forgot Password"}
                        {step === "otp" && "Enter OTP"}
                        {step === "password" && "Set New Password"}
                        {step === "success" && "Password Reset!"}
                    </CardTitle>
                    <CardDescription>
                        {step === "email" &&
                            "Enter your email to receive a password reset OTP"}
                        {step === "otp" && `We sent a 6-digit code to ${fullEmail}`}
                        {step === "password" && "Create a new password for your account"}
                        {step === "success" &&
                            "Your password has been reset successfully"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Step 1: Email */}
                    {step === "email" && (
                        <form
                            action={async (formData: FormData) => {
                                const usernameValue = formData.get("username") as string
                                formData.set("email", usernameValue + EMAIL_DOMAIN)
                                formData.delete("username")
                                return emailAction(formData)
                            }}
                            className="space-y-4"
                        >
                            <FieldGroup>
                                <Field>
                                    <FieldLabel htmlFor="username">Email</FieldLabel>
                                    <FieldContent>
                                        <div className="flex">
                                            <Input
                                                id="username"
                                                name="username"
                                                type="text"
                                                placeholder="username"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                className="rounded-r-none border-r-0"
                                                required
                                            />
                                            <span className="inline-flex items-center px-3 bg-muted border border-input border-l-0 rounded-r-md text-sm text-muted-foreground">
                                                {EMAIL_DOMAIN}
                                            </span>
                                        </div>
                                    </FieldContent>
                                </Field>
                                {emailState?.error && (
                                    <FieldError>{emailState.error}</FieldError>
                                )}
                            </FieldGroup>
                            <SubmitButton>Send OTP</SubmitButton>
                            <div className="text-center text-sm text-muted-foreground">
                                Remember your password?{" "}
                                <Link
                                    href="/login"
                                    className="text-primary underline underline-offset-4 hover:text-primary/80"
                                >
                                    Sign in
                                </Link>
                            </div>
                        </form>
                    )}

                    {/* Step 2: OTP */}
                    {step === "otp" && (
                        <form action={otpAction} className="space-y-4">
                            <input type="hidden" name="otp" value={otp} />
                            <div className="flex justify-center">
                                <InputOTP
                                    maxLength={6}
                                    value={otp}
                                    onChange={(value) => setOtp(value)}
                                >
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                    </InputOTPGroup>
                                    <InputOTPSeparator />
                                    <InputOTPGroup>
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>
                            {otpState?.error && (
                                <p className="text-sm text-destructive text-center">
                                    {otpState.error}
                                </p>
                            )}
                            {resendError && (
                                <p className="text-sm text-destructive text-center">
                                    {resendError}
                                </p>
                            )}
                            <SubmitButton>Verify OTP</SubmitButton>
                            <div className="text-center text-sm text-muted-foreground">
                                Didn't receive the code?{" "}
                                {resendCooldown > 0 ? (
                                    <span>Resend in {resendCooldown}s</span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        className="text-primary underline underline-offset-4 hover:text-primary/80"
                                    >
                                        Resend OTP
                                    </button>
                                )}
                            </div>
                        </form>
                    )}

                    {/* Step 3: New Password */}
                    {step === "password" && (
                        <form action={passwordAction} className="space-y-4">
                            <FieldGroup>
                                <Field>
                                    <FieldLabel htmlFor="password">New Password</FieldLabel>
                                    <FieldContent>
                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            placeholder="Enter new password"
                                            required
                                            minLength={6}
                                        />
                                    </FieldContent>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="confirmPassword">
                                        Confirm Password
                                    </FieldLabel>
                                    <FieldContent>
                                        <PasswordInput
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            placeholder="Confirm new password"
                                            required
                                            minLength={6}
                                        />
                                    </FieldContent>
                                </Field>
                                {passwordState?.error && (
                                    <FieldError>{passwordState.error}</FieldError>
                                )}
                            </FieldGroup>
                            <SubmitButton>Reset Password</SubmitButton>
                        </form>
                    )}

                    {/* Step 4: Success */}
                    {step === "success" && (
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                            <p className="text-center text-muted-foreground">
                                You can now sign in with your new password.
                            </p>
                            <Button className="w-full" onClick={() => router.push("/login")}>
                                Go to Sign In
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
