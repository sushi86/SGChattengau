const STEPS = [
  'Persönliche Daten',
  'Sparte',
  'Bankdaten',
  'Einwilligungen',
  'Unterschrift',
  'Zusammenfassung',
]

interface StepIndicatorProps {
  currentStep: number // 0-indexed
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      {/* Mobile: nur Text */}
      <p className="tablet:hidden text-sm text-text-body text-center mb-2">
        Schritt {currentStep + 1} von {STEPS.length}: <strong className="text-text-heading">{STEPS[currentStep]}</strong>
      </p>

      {/* Mobile: Fortschrittsbalken */}
      <div className="tablet:hidden h-2 bg-border-light rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Tablet+: Schritte als Punkte */}
      <div className="hidden tablet:flex items-center justify-between">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                  ${i < currentStep ? 'bg-primary text-white' : ''}
                  ${i === currentStep ? 'bg-primary text-white ring-4 ring-primary-light' : ''}
                  ${i > currentStep ? 'bg-border-light text-text-body' : ''}`}
              >
                {i < currentStep ? '\u2713' : i + 1}
              </div>
              <span className={`text-xs mt-1 ${i <= currentStep ? 'text-text-heading' : 'text-text-body'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-12 desktop:w-20 mx-2 ${i < currentStep ? 'bg-primary' : 'bg-border-light'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
