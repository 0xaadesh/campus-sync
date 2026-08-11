import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Marquee } from "@/components/ui/marquee"

type Voice = {
  name: string
  role: string
  avatar: string
  quote: string
}

const VOICES: Voice[] = [
  {
    name: "Dr. Kiran Deshpande",
    role: "Head of Department",
    avatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmnXeTYieQCBz4OYBU0-73sWLJssuj-i95Nw&s",
    quote:
      "CampusSync has significantly streamlined how our department manages schedules. Faculty availability, room allocation and timetable changes are now handled in one place, reducing confusion and last-minute issues.",
  },
  {
    name: "Mr. Vishal Badgujar",
    role: "Assistant Professor",
    avatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQG9PV54aUfKiQjG67GGSRl-z6LhMWCJKl_nQ&s",
    quote:
      "What I appreciate most is its simplicity. Updating my availability and checking daily schedules takes seconds. It has eliminated countless WhatsApp messages and emails.",
  },
  {
    name: "Mrs. Sonal Jain",
    role: "Assistant Professor",
    avatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIzxRzQPp6lyIQyi8olsThWMOBe8TGOgCFGg&s",
    quote:
      "Coordinating schedules across multiple batches is no longer a challenge. The centralized dashboard has made academic coordination smoother and far less time-consuming.",
  },
]

function initials(name: string) {
  return name
    .replace(/^(Dr|Mr|Mrs|Ms)\.?\s+/i, "")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
}

function VoiceCard({ voice }: { voice: Voice }) {
  return (
    <Card className="w-[22rem] shrink-0 md:w-[26rem]">
      <CardContent>
        <p className="text-sm leading-relaxed">&ldquo;{voice.quote}&rdquo;</p>
      </CardContent>
      <CardFooter>
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarImage src={voice.avatar} alt="" />
            <AvatarFallback>{initials(voice.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{voice.name}</span>
            <span className="text-muted-foreground text-xs">{voice.role}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

export function Voices() {
  return (
    <section id="voices" className="overflow-hidden border-t">
      <div className="mx-auto w-full max-w-7xl px-4 pt-16 md:px-6 md:pt-24">
        <div className="flex flex-col gap-4 md:max-w-2xl">
          <p className="text-muted-foreground font-mono text-xs tracking-[0.22em] uppercase">
            From the department
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-5xl">
            The people who run the timetable.
          </h2>
        </div>
      </div>

      <div className="relative mt-12 flex flex-col gap-4 pb-16 md:mt-16 md:pb-24">
        <Marquee pauseOnHover className="[--duration:48s] [--gap:1rem]">
          {VOICES.map((voice) => (
            <VoiceCard key={voice.name} voice={voice} />
          ))}
        </Marquee>
        <Marquee reverse pauseOnHover className="[--duration:60s] [--gap:1rem]">
          {[...VOICES].reverse().map((voice) => (
            <VoiceCard key={voice.name} voice={voice} />
          ))}
        </Marquee>

        <div className="from-background pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r to-transparent md:w-32" />
        <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l to-transparent md:w-32" />
      </div>
    </section>
  )
}
