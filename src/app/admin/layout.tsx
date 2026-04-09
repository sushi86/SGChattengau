import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const allowedRoles = ['ADMIN', 'SPARTENLEITER', 'KURSLEITER']
  if (!allowedRoles.includes(session.user.role)) {
    redirect('/')
  }

  return (
    <div className="flex flex-col tablet:flex-row min-h-[calc(100vh-64px)]">
      <AdminSidebar role={session.user.role} />
      <div className="flex-1 p-4 tablet:p-8 bg-section-alt">
        {children}
      </div>
    </div>
  )
}
