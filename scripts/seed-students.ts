/**
 * Seed student users from a CSV (columns: email,name) and optionally add them to a group.
 *
 * - Role Student, emails auto-verified
 * - Password is "<firstname>@1234" (lowercase first name), bcrypt hashed,
 *   matching the convention used by scripts/seed-faculty.ts
 * - Group membership uses the group's defaultRole
 *
 * Usage: bun run scripts/seed-students.ts <csv-path> [groupId]
 */

import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env') })
config({ path: resolve(process.cwd(), '.env.local') })

const prisma = new PrismaClient()

const [csvArg, groupId] = process.argv.slice(2)
if (!csvArg) {
  console.error('Usage: bun run scripts/seed-students.ts <csv-path> [groupId]')
  process.exit(1)
}

function parseCsv(raw: string) {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0)
  const header = lines[0].split(',').map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((c) => c.trim())
    return Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ''])) as Record<string, string>
  })
}

async function main() {
  const rows = parseCsv(readFileSync(resolve(process.cwd(), csvArg), 'utf-8'))

  const group = groupId
    ? await prisma.group.findUnique({ where: { id: groupId } })
    : null
  if (groupId && !group) throw new Error(`Group ${groupId} not found`)

  let created = 0
  let updated = 0
  let joined = 0

  for (const row of rows) {
    const email = row.email.toLowerCase().trim()
    const name = row.name.trim()
    if (!email || !name) {
      console.log(`SKIP incomplete row: ${JSON.stringify(row)}`)
      continue
    }

    const firstName = name.split(/\s+/)[0].toLowerCase()
    const password = await bcrypt.hash(`${firstName}@1234`, 10)

    const existing = await prisma.user.findUnique({ where: { email } })

    const user = await prisma.user.upsert({
      where: { email },
      create: { name, email, role: Role.Student, password, emailVerified: new Date() },
      update: { name, role: Role.Student, password, emailVerified: new Date() },
    })

    if (existing) {
      updated++
    } else {
      created++
    }

    if (group) {
      const membership = await prisma.groupMembership.findUnique({
        where: { groupId_userId: { groupId: group.id, userId: user.id } },
      })
      if (!membership) {
        await prisma.groupMembership.create({
          data: { groupId: group.id, userId: user.id, role: group.defaultRole },
        })
        joined++
      }
    }

    console.log(`${existing ? 'updated' : 'created'}  ${email}  ${name}`)
  }

  console.log(`\nDone. ${created} created, ${updated} updated (${rows.length} rows).`)
  if (group) console.log(`${joined} added to group "${group.title}" as ${group.defaultRole}.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
