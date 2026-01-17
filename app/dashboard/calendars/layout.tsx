import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function CalendarsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  // All authenticated users can access calendars
  // (HOD sees all, others see only assigned ones)
  return <>{children}</>
}
