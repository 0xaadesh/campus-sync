"use client"

import * as React from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { loginAction } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/password-input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"

const EMAIL_DOMAIN = "@apsit.edu.in"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Spinner size="sm" className="mr-2" />}
      {pending ? "Signing in..." : "Sign In"}
    </Button>
  )
}

export default function LoginPage() {
  const [state, formAction] = React.useActionState(loginAction, null)
  const [username, setUsername] = React.useState("")

  // Create a wrapped action that appends the domain
  const handleSubmit = async (formData: FormData) => {
    const usernameValue = formData.get("username") as string
    formData.set("email", usernameValue + EMAIL_DOMAIN)
    formData.delete("username")
    return formAction(formData)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to your account</CardTitle>
          <CardDescription>
            Enter your credentials to sign in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
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

              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <FieldContent>
                  <PasswordInput
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    required
                  />
                </FieldContent>
              </Field>

              {state?.error && (
                <FieldError>{state.error}</FieldError>
              )}
            </FieldGroup>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Forgot password?
              </Link>
            </div>

            <SubmitButton />

            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/signup" className="text-primary underline underline-offset-4 hover:text-primary/80">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
