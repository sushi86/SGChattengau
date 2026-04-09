import * as fs from 'node:fs'
import * as path from 'node:path'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Load .env.local
const envPath = path.resolve(import.meta.dirname ?? __dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const val = match[2].trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
  }
}

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter }) as unknown as PrismaClient

async function main() {
  // Delete all blog posts so they can be re-imported with clean slugs
  const result = await prisma.beitrag.deleteMany({})
  console.log(`Deleted ${result.count} Beiträge`)
  console.log('Now run: npx tsx prisma/migrate-content.ts')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
