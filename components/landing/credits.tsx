import { Github, Linkedin } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DotPattern } from "@/components/ui/dot-pattern"

type Person = {
  name: string
  role: string
  avatar: string
  github?: string
  linkedin?: string
}

const BUILT_BY: Person[] = [
  {
    name: "Aadesh Gavhane",
    role: "Developer",
    avatar: "https://github.com/0xaadesh.png",
    github: "https://github.com/0xaadesh",
    linkedin: "https://www.linkedin.com/in/aadeshgavhane/",
  },
  {
    name: "Kartika Thite",
    role: "Developer",
    avatar: "https://github.com/Kartika2005.png",
    github: "https://github.com/Kartika2005",
    linkedin: "https://www.linkedin.com/in/kartika-thite-70288130a/",
  },
  {
    name: "Pooja Maskare",
    role: "Developer",
    avatar: "https://github.com/poojamaskare.png",
    github: "https://github.com/poojamaskare",
    linkedin: "https://www.linkedin.com/in/pooja-maskare/",
  },
  {
    name: "Siddhi Jadhav",
    role: "Developer",
    avatar: "https://github.com/SiddhiJadhav13.png",
    github: "https://github.com/SiddhiJadhav13",
    linkedin: "https://www.linkedin.com/in/siddhi-jadhav-a1252827a/",
  },
]

const GUIDED_BY: Person[] = [
  {
    name: "Mr. Vishal Badgujar",
    role: "Project Guide",
    avatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQG9PV54aUfKiQjG67GGSRl-z6LhMWCJKl_nQ&s",
    linkedin: "https://www.linkedin.com/in/vishalbadgujar/",
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

function PersonRow({ person, index }: { person: Person; index: number }) {
  return (
    <li className="border-primary-foreground/20 hover:bg-primary-foreground/5 grid grid-cols-[2.5rem_1fr] items-center gap-x-4 gap-y-3 border-t py-5 transition-colors md:grid-cols-[3rem_1fr_10rem_auto] md:gap-x-6">
      <span className="font-mono text-xs tracking-[0.22em] tabular-nums">
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="flex items-center gap-3">
        <Avatar className="size-9">
          <AvatarImage src={person.avatar} alt="" />
          <AvatarFallback>{initials(person.name)}</AvatarFallback>
        </Avatar>
        <span className="text-base font-medium md:text-lg">{person.name}</span>
      </div>

      <span className="col-start-2 font-mono text-xs tracking-[0.22em] uppercase opacity-70 md:col-start-3">
        {person.role}
      </span>

      <div className="col-start-2 flex items-center gap-5 md:col-start-4">
        {person.github ? (
          <a
            href={person.github}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 font-mono text-xs tracking-[0.18em] uppercase underline-offset-4 hover:underline"
          >
            <Github className="size-4" />
            GitHub
          </a>
        ) : null}
        {person.linkedin ? (
          <a
            href={person.linkedin}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 font-mono text-xs tracking-[0.18em] uppercase underline-offset-4 hover:underline"
          >
            <Linkedin className="size-4" />
            LinkedIn
          </a>
        ) : null}
      </div>
    </li>
  )
}

export function Credits() {
  return (
    <section
      id="team"
      className="bg-primary text-primary-foreground relative isolate overflow-hidden"
    >
      <DotPattern
        width={14}
        height={14}
        cr={1.3}
        className="text-primary-foreground/25 [mask-image:radial-gradient(70%_80%_at_20%_100%,black,transparent)]"
      />

      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 px-4 py-16 md:grid-cols-12 md:gap-16 md:px-6 md:py-24">
        <div className="flex flex-col gap-4 md:col-span-4">
          <p className="font-mono text-xs tracking-[0.22em] uppercase">
            Team
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            We built the thing we kept asking for.
          </h2>
        </div>

        <div className="flex flex-col gap-12 md:col-span-8">
          <div className="flex flex-col gap-2">
            <p className="font-mono text-xs tracking-[0.22em] uppercase opacity-70">
              Built by
            </p>
            <ul className="border-primary-foreground/20 flex flex-col border-b">
              {BUILT_BY.map((person, i) => (
                <PersonRow key={person.name} person={person} index={i} />
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <p className="font-mono text-xs tracking-[0.22em] uppercase opacity-70">
              Guided by
            </p>
            <ul className="border-primary-foreground/20 flex flex-col border-b">
              {GUIDED_BY.map((person, i) => (
                <PersonRow key={person.name} person={person} index={i} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
