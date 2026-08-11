import Link from "next/link"

import { ArrowRight } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BlurFade } from "@/components/ui/blur-fade"
import { Button } from "@/components/ui/button"
import { DotPattern } from "@/components/ui/dot-pattern"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { TextAnimate } from "@/components/ui/text-animate"
import { cn } from "@/lib/utils"

export type HeroUser = {
  name?: string | null
  email?: string | null
  role?: string | null
}

const LABEL_CLASS = "font-mono text-xs tracking-[0.22em] uppercase"

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function SignedInPanel({ user }: { user: HeroUser }) {
  const name = user.name?.trim() || "there"

  return (
    <div className="flex flex-col items-start gap-6">
      <div className="flex items-center gap-3">
        <BlurFade inView delay={0.1}>
          <Avatar className="size-10">
            <AvatarFallback>{initials(name)}</AvatarFallback>
          </Avatar>
        </BlurFade>

        <div className="flex flex-col">
          <TextAnimate
            as="span"
            by="word"
            animation="blurInUp"
            once
            delay={0.15}
            className="font-medium"
          >
            {name}
          </TextAnimate>
          {user.email ? (
            <TextAnimate
              as="span"
              by="text"
              animation="blurInUp"
              once
              delay={0.25}
              className="text-muted-foreground text-xs"
            >
              {user.email}
            </TextAnimate>
          ) : null}
        </div>

        {user.role ? (
          <BlurFade inView delay={0.35}>
            <Badge variant="secondary">{user.role}</Badge>
          </BlurFade>
        ) : null}
      </div>

      <BlurFade inView delay={0.45}>
        <Button asChild>
          <Link href="/dashboard">
            Open dashboard
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </BlurFade>
    </div>
  )
}

function SignInForm() {
  return (
    <BlurFade inView delay={0.15}>
      <form action="/login" method="get" className="w-full max-w-md">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="hero-roll">Roll number</FieldLabel>
            <div className="flex items-center gap-2">
              <Input
                id="hero-roll"
                name="u"
                inputMode="numeric"
                autoComplete="username"
                placeholder="e.g. 24204017"
              />
              <Button type="submit">
                Log in
                <ArrowRight data-icon="inline-end" />
              </Button>
            </div>
            <FieldDescription>
              New here?{" "}
              <Link href="/signup" className="underline underline-offset-4">
                Create an account
              </Link>
              .
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </BlurFade>
  )
}

export function HeroBand({ user }: { user: HeroUser | null }) {
  return (
    <section className="bg-primary text-primary-foreground relative isolate overflow-hidden">
      <DotPattern
        width={14}
        height={14}
        cr={1.3}
        className="text-primary-foreground/30 [mask-image:radial-gradient(80%_60%_at_70%_20%,black,transparent)]"
      />

      {/* Headline band: anchored bottom-left, never centered. */}
      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-12 px-4 md:px-6">
        <div className="col-span-12 flex min-h-[62svh] flex-col justify-end gap-6 py-16 md:col-span-10 md:py-24">
          <BlurFade delay={0.05}>
            <Badge variant="secondary">TIMETABLE INFRASTRUCTURE</Badge>
          </BlurFade>

          <TextAnimate
            as="h1"
            by="line"
            animation="blurInUp"
            once
            delay={0.15}
            className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-7xl"
          >
            {"Every class, every room,\nevery faculty. One grid."}
          </TextAnimate>
        </div>
      </div>

      {/* Ruled band: hairline-split, with a light panel cut into the blue. */}
      <div className="border-primary-foreground/25 relative border-t">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 md:grid-cols-2">
          <div className="flex flex-col gap-8 px-4 py-10 md:py-16 md:pr-16 md:pl-6">
            <TextAnimate
              as="p"
              by="text"
              animation="blurInUp"
              once
              className={LABEL_CLASS}
            >
              What it does:
            </TextAnimate>

            <TextAnimate
              as="p"
              by="word"
              animation="blurInUp"
              once
              delay={0.1}
              className="max-w-md text-lg leading-relaxed text-balance md:text-xl"
            >
              Build the timetable once, share it with a join code, and everyone
              sees only their own day.
            </TextAnimate>
          </div>

          <div className="bg-background text-foreground border-primary-foreground/25 flex flex-col gap-8 px-4 py-10 md:border-l md:py-16 md:pr-6 md:pl-16">
            <TextAnimate
              as="p"
              by="text"
              animation="blurInUp"
              once
              className={cn("text-muted-foreground", LABEL_CLASS)}
            >
              {user ? "You're signed in" : "Already enrolled?"}
            </TextAnimate>

            {user ? <SignedInPanel user={user} /> : <SignInForm />}
          </div>
        </div>
      </div>
    </section>
  )
}
