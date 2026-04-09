'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface User {
  id: string
  email: string
  name: string
  role: string
  sparteId: string | null
  sparte: { name: string } | null
  isActive: boolean
}

interface SparteOption {
  id: string
  name: string
}

export function NutzerVerwaltung({ sparten }: { sparten: SparteOption[] }) {
  const [users, setUsers] = useState<User[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'SPARTENLEITER', sparteId: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/v1/admin/nutzer')
    if (res.ok) {
      const body = await res.json()
      setUsers(body.data || [])
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function createUser() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/v1/admin/nutzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const body = await res.json()
        setError(body.error?.message || 'Fehler')
        return
      }
      setShowForm(false)
      setForm({ email: '', name: '', password: '', role: 'SPARTENLEITER', sparteId: '' })
      load()
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(user: User) {
    await fetch(`/api/v1/admin/nutzer?id=${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !user.isActive }),
    })
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-h1 text-text-heading">Nutzerverwaltung</h1>
        <Button className="text-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Abbrechen' : '+ Neuer Nutzer'}
        </Button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg border border-border mb-6 max-w-lg space-y-3">
          {error && <p className="text-sm text-error">{error}</p>}
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="E-Mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="Passwort" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium text-text-heading mb-1">Rolle</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-md border border-border px-4 py-3 bg-white">
              <option value="ADMIN">Admin</option>
              <option value="SPARTENLEITER">Spartenleiter</option>
              <option value="KURSLEITER">Kursleiter</option>
            </select>
          </div>
          {form.role !== 'ADMIN' && (
            <div>
              <label className="block text-sm font-medium text-text-heading mb-1">Zugeordnete Sparte</label>
              <select value={form.sparteId} onChange={(e) => setForm({ ...form, sparteId: e.target.value })} className="w-full rounded-md border border-border px-4 py-3 bg-white">
                <option value="">Keine</option>
                {sparten.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          <Button onClick={createUser} disabled={saving}>{saving ? 'Erstellen...' : 'Nutzer erstellen'}</Button>
        </div>
      )}

      <div className="bg-white rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-section-alt">
              <th className="text-left p-3 font-medium text-text-heading">Name</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">E-Mail</th>
              <th className="text-left p-3 font-medium text-text-heading">Rolle</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">Sparte</th>
              <th className="text-left p-3 font-medium text-text-heading">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border-light hover:bg-section-alt">
                <td className="p-3 font-medium text-text-heading">{u.name}</td>
                <td className="p-3 hidden tablet:table-cell text-text-body">{u.email}</td>
                <td className="p-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary-light text-primary">{u.role}</span>
                </td>
                <td className="p-3 hidden tablet:table-cell text-text-body">{u.sparte?.name || '—'}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {u.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td className="p-3">
                  <button onClick={() => toggleActive(u)} className="text-sm text-primary hover:text-primary-hover">
                    {u.isActive ? 'Deaktivieren' : 'Aktivieren'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
