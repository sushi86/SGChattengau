import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TerminForm } from '@/components/admin/termin-form'

export default async function NeuTerminPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const sparten = await prisma.sparte.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div>
      <h1 className="font-heading text-h1 text-text-heading mb-6">Neuer Termin</h1>
      <div className="bg-white p-6 rounded-lg border border-border max-w-3xl">
        <TerminForm sparten={sparten} fixedSparteId={session.user.role !== 'ADMIN' ? session.user.sparteId : null} />
      </div>
    </div>
  )
}
