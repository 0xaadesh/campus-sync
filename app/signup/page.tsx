import { redirect } from "next/navigation"
import Link from "next/link"
import { SignupForm } from "./signup-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SignupPage() {
  // Check if signup is completely disabled
  const isSignupDisabled = process.env.DISABLE_SIGNUP === "true"

  if (isSignupDisabled) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign Up Disabled</CardTitle>
            <CardDescription>
              New account registration is currently not available.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please contact your administrator if you need an account.
            </p>
            <Button asChild className="w-full">
              <Link href="/login">Go to Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check role-specific restrictions
  const allowHod = process.env.DISABLE_HOD_SIGNUP !== "true"
  const allowFaculty = process.env.DISABLE_FACULTY_SIGNUP !== "true"

  return <SignupForm allowHod={allowHod} allowFaculty={allowFaculty} />
}
