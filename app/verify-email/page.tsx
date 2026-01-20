"use client"

import * as React from "react"
import { useFormStatus } from "react-dom"
import { useRouter } from "next/navigation"
import {
    verifyEmailOtpAction,
    resendVerificationOtpAction,
} from "@/app/actions/verify-email"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "@/components/ui/input-otp"
import { Check, Mail } from "lucide-react"

function SubmitButton({ children }: { children: React.ReactNode }) {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Spinner size="sm" className="mr-2" />}
            {children}
        </Button>
    )
}

export default function VerifyEmailPage() {
    const router = useRouter()
    const [otp, setOtp] = React.useState("")
    const [resendCooldown, setResendCooldown] = React.useState(0)
    const [resendError, setResendError] = React.useState("")
    const [isVerified, setIsVerified] = React.useState(false)

    const [otpState, otpAction] = React.useActionState(verifyEmailOtpAction, null)

    // Handle success
    React.useEffect(() => {
        if (otpState?.success) {
            setIsVerified(true)
        }
    }, [otpState])

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
        const result = await resendVerificationOtpAction()
        if (result.error) {
            setResendError(result.error)
        }
    }

    if (isVerified) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                        <CardTitle className="text-center">Email Verified!</CardTitle>
                        <CardDescription className="text-center">
                            Your account has been verified successfully.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" onClick={() => router.push("/login")}>
                            Continue to Sign In
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Mail className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-center">Verify Your Email</CardTitle>
                    <CardDescription className="text-center">
                        We've sent a 6-digit code to your email. Enter it below to verify your account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={otpAction} className="space-y-6">
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

                        <SubmitButton>Verify Email</SubmitButton>

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
                                    Resend Code
                                </button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
