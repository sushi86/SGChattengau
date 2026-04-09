import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { NutzerVerwaltung } from '@/components/admin/nutzer-verwaltung'

export default async function NutzerPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/admin')

  const sparten = await prisma.sparte.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return <NutzerVerwaltung sparten={sparten} />
}
