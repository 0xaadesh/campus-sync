"use client"

import * as React from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { signupAction } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/password-input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"

const EMAIL_DOMAIN = "@apsit.edu.in"

interface SignupFormProps {
    allowHod: boolean
    allowFaculty: boolean
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Spinner size="sm" className="mr-2" />}
            {pending ? "Signing up..." : "Sign Up"}
        </Button>
    )
}

export function SignupForm({ allowHod, allowFaculty }: SignupFormProps) {
    const [state, formAction] = React.useActionState(signupAction, null)
    const [role, setRole] = React.useState<string>("")
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
                    <CardTitle>Create an account</CardTitle>
                    <CardDescription>
                        Enter your information to create your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="name">Name</FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="name"
                                        name="name"
                                        type="text"
                                        placeholder="John Doe"
                                        required
                                    />
                                </FieldContent>
                            </Field>

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
                                <FieldLabel htmlFor="role">Role</FieldLabel>
                                <FieldContent>
                                    <Select value={role} onValueChange={setRole} required>
                                        <SelectTrigger id="role" className="w-full">
                                            <SelectValue placeholder="Select your role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allowHod && <SelectItem value="HOD">HOD</SelectItem>}
                                            {allowFaculty && <SelectItem value="Faculty">Faculty</SelectItem>}
                                            <SelectItem value="Student">Student</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <input type="hidden" name="role" value={role} />
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
                                        minLength={6}
                                    />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                                <FieldContent>
                                    <PasswordInput
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        placeholder="Confirm your password"
                                        required
                                        minLength={6}
                                    />
                                </FieldContent>
                            </Field>

                            {state?.error && (
                                <FieldError>{state.error}</FieldError>
                            )}
                        </FieldGroup>

                        <SubmitButton />

                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link href="/login" className="text-primary underline underline-offset-4 hover:text-primary/80">
                                Sign in
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
