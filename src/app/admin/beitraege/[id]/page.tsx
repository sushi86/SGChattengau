import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { BeitragForm } from '@/components/admin/beitrag-form'

export default async function BeitragEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id } = await params

  const beitrag = await prisma.beitrag.findUnique({ where: { id } })
  if (!beitrag) notFound()

  // Only author or admin can edit
  if (session.user.role !== 'ADMIN' && beitrag.authorId !== session.user.id) {
    redirect('/admin/beitraege')
  }

  const sparten = await prisma.sparte.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div>
      <Link href="/admin/beitraege" className="text-sm text-primary hover:text-primary-hover mb-4 inline-block">
        &larr; Zurück zur Liste
      </Link>
      <h1 className="font-heading text-h1 text-text-heading mb-6">Beitrag bearbeiten</h1>
      <div className="bg-white p-6 rounded-lg border border-border max-w-3xl">
        <BeitragForm beitrag={beitrag} sparten={sparten} />
      </div>
    </div>
  )
}
