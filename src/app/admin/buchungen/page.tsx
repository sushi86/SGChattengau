import { BuchungList } from '@/components/admin/buchung-list'
import { AdminBuchungCreate } from '@/components/admin/buchung-create'

export default function BuchungenPage() {
  return (
    <div>
      <div className="flex flex-col tablet:flex-row tablet:items-center justify-between gap-4 mb-6">
        <h1 className="font-heading text-h1 text-text-heading">Vereinsheim-Buchungen</h1>
      </div>
      <AdminBuchungCreate />
      <BuchungList />
    </div>
  )
}
