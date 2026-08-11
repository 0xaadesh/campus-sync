/**
 * Seed faculty users from apsit_it_faculty.csv
 *
 * - Everyone is created with role Faculty, except Kiran Deshpande (HOD)
 * - Password is "<firstname>@1234" (lowercase first name), bcrypt hashed
 * - Emails are auto-verified (emailVerified set to now)
 *
 * Usage: bun run scripts/seed-faculty.ts
 */

import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env') })
config({ path: resolve(process.cwd(), '.env.local') })

const prisma = new PrismaClient()

const CSV_PATH = resolve(process.cwd(), 'apsit_it_faculty.csv')
const HOD_EMAIL = 'kbdeshpande@apsit.edu.in'

function parseCsv(raw: string) {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0)
  const header = lines[0].split(',').map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((c) => c.trim())
    return Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ''])) as Record<string, string>
  })
}

async function main() {
  const rows = parseCsv(readFileSync(CSV_PATH, 'utf-8'))

  let created = 0
  let updated = 0

  for (const row of rows) {
    const email = row.email.toLowerCase()
    const name = [row.title, row.first_name, row.middle_name, row.last_name]
      .filter(Boolean)
      .join(' ')
    const role = email === HOD_EMAIL ? Role.HOD : Role.Faculty
    const password = await bcrypt.hash(`${row.first_name.toLowerCase()}@1234`, 10)

    const existing = await prisma.user.findUnique({ where: { email } })

    await prisma.user.upsert({
      where: { email },
      create: { name, email, role, password, emailVerified: new Date() },
      update: { name, role, password, emailVerified: new Date() },
    })

    if (existing) {
      updated++
      console.log(`updated  ${role.padEnd(7)} ${email}`)
    } else {
      created++
      console.log(`created  ${role.padEnd(7)} ${email}`)
    }
  }

  console.log(`\nDone. ${created} created, ${updated} updated (${rows.length} rows).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
