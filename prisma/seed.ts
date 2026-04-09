import * as fs from 'node:fs'
import * as path from 'node:path'
import { PrismaClient, SparteTyp } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

// Load .env.local since tsx doesn't auto-load it like Next.js does
function loadEnvLocal() {
  const envPath = path.resolve(import.meta.dirname ?? __dirname, '../.env.local')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const match = line.match(/^([^#=]+)=["']?(.+?)["']?\s*$/)
      if (match && !process.env[match[1].trim()]) {
        process.env[match[1].trim()] = match[2].trim()
      }
    }
  }
  // Also load .env as fallback
  const envFallback = path.resolve(import.meta.dirname ?? __dirname, '../.env')
  if (fs.existsSync(envFallback)) {
    const content = fs.readFileSync(envFallback, 'utf-8')
    for (const line of content.split('\n')) {
      const match = line.match(/^([^#=]+)=["']?(.+?)["']?\s*$/)
      if (match && !process.env[match[1].trim()]) {
        process.env[match[1].trim()] = match[2].trim()
      }
    }
  }
}

loadEnvLocal()

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Please check .env.local or .env')
  process.exit(1)
}

const adapter = new PrismaPg(process.env.DATABASE_URL)
const prisma = new PrismaClient({ adapter }) as unknown as InstanceType<typeof PrismaClient>

const sparten = [
  { name: 'Fußball', slug: 'fussball', typ: SparteTyp.SPARTE, sortOrder: 1 },
  { name: 'Schwimmen', slug: 'schwimmen', typ: SparteTyp.SPARTE, sortOrder: 2 },
  { name: 'Volleyball', slug: 'volleyball', typ: SparteTyp.SPARTE, sortOrder: 3 },
  { name: 'Tischtennis', slug: 'tischtennis', typ: SparteTyp.SPARTE, sortOrder: 4 },
  { name: 'Tennis', slug: 'tennis', typ: SparteTyp.SPARTE, sortOrder: 5 },
  { name: 'Judo', slug: 'judo', typ: SparteTyp.SPARTE, sortOrder: 6 },
  { name: 'Laufen', slug: 'laufen', typ: SparteTyp.SPARTE, sortOrder: 7 },
  { name: 'Triathlon / Multisport', slug: 'triathlon-multisport', typ: SparteTyp.SPARTE, sortOrder: 8 },
  { name: 'Kinderturnen', slug: 'kinderturnen', typ: SparteTyp.SPARTE, sortOrder: 9 },
  { name: 'Rehasport', slug: 'rehasport', typ: SparteTyp.SPARTE, sortOrder: 10 },
  { name: 'Gesundheitssport', slug: 'gesundheitssport', typ: SparteTyp.SPARTE, sortOrder: 11 },
  { name: 'Fitness / Gymnastik', slug: 'fitness-gymnastik', typ: SparteTyp.SPARTE, sortOrder: 12 },
  { name: 'Nordic Walking', slug: 'nordic-walking', typ: SparteTyp.SPARTE, sortOrder: 13 },
  { name: 'Fotografie', slug: 'fotografie', typ: SparteTyp.SPARTE, sortOrder: 14 },
  // Kurse
  { name: 'Yoga', slug: 'yoga', typ: SparteTyp.KURS, sortOrder: 20 },
  { name: 'Qigong', slug: 'qigong', typ: SparteTyp.KURS, sortOrder: 21 },
  { name: 'Metalza', slug: 'metalza', typ: SparteTyp.KURS, sortOrder: 22 },
  { name: 'Fit am Montag', slug: 'fit-am-montag', typ: SparteTyp.KURS, sortOrder: 23 },
]

async function main() {
  console.log('Seeding database...')

  // Admin-User
  const passwordHash = await bcrypt.hash('admin1234', 12)
  await prisma.user.upsert({
    where: { email: 'admin@sg1898chattengau.de' },
    update: {},
    create: {
      email: 'admin@sg1898chattengau.de',
      name: 'Administrator',
      passwordHash,
      role: 'ADMIN',
    },
  })
  console.log('Admin user created: admin@sg1898chattengau.de / admin1234')

  // Sparten
  for (const sparte of sparten) {
    await prisma.sparte.upsert({
      where: { slug: sparte.slug },
      update: { name: sparte.name, typ: sparte.typ, sortOrder: sparte.sortOrder },
      create: sparte,
    })
  }
  console.log(`${sparten.length} Sparten/Kurse created`)

  console.log('Seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
