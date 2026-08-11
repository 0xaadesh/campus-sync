import Image from "next/image"
import Link from "next/link"

const COLUMNS = [
  {
    label: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    label: "Account",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Sign up", href: "/signup" },
      { label: "Forgot password", href: "/forgot-password" },
    ],
  },
  {
    label: "Project",
    links: [
      { label: "Team", href: "#team" },
      { label: "Voices", href: "#voices" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-10 px-4 py-12 md:grid-cols-6 md:px-6 md:py-16">
        <div className="col-span-2 flex flex-col gap-4 md:col-span-3">
          <div className="flex items-center gap-2">
            <Image
              src="/campus-sync-circular.svg"
              alt=""
              width={24}
              height={24}
              className="size-6"
            />
            <span className="font-mono text-sm tracking-[0.18em] uppercase">
              CampusSync
            </span>
          </div>
          <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
            Timetables, rooms, groups and availability for a whole campus, in
            one place.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.label} className="flex flex-col gap-4">
            <p className="text-muted-foreground font-mono text-xs tracking-[0.22em] uppercase">
              {column.label}
            </p>
            <ul className="flex flex-col gap-3">
              {column.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto w-full max-w-7xl border-t px-4 py-6 md:px-6">
        <p className="text-muted-foreground font-mono text-xs tracking-[0.18em] uppercase">
          © {new Date().getFullYear()} CampusSync
        </p>
      </div>
    </footer>
  )
}
