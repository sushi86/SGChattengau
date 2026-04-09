'use client'

interface SparteOption {
  id: string
  name: string
}

// Feste Farben für die ersten 10 Sparten, danach Rotation
const SPARTE_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-500',
  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500',
  'bg-teal-500', 'bg-cyan-500',
]

export function getSparteColor(index: number): string {
  return SPARTE_COLORS[index % SPARTE_COLORS.length]
}

interface TerminFilterProps {
  sparten: SparteOption[]
  selected: string[]
  onChange: (selected: string[]) => void
}

export function TerminFilter({ sparten, selected, onChange }: TerminFilterProps) {
  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange([])}
        className={`px-3 py-1.5 rounded-full text-sm min-h-[36px] transition-colors
          ${selected.length === 0
            ? 'bg-primary text-white'
            : 'bg-section-alt text-text-body hover:bg-border-light'}`}
      >
        Alle
      </button>
      {sparten.map((s, i) => {
        const active = selected.includes(s.id)
        const color = getSparteColor(i)
        return (
          <button
            key={s.id}
            onClick={() => toggle(s.id)}
            className={`px-3 py-1.5 rounded-full text-sm min-h-[36px] transition-colors flex items-center gap-1.5
              ${active
                ? 'bg-primary text-white'
                : 'bg-section-alt text-text-body hover:bg-border-light'}`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
            {s.name}
          </button>
        )
      })}
    </div>
  )
}
