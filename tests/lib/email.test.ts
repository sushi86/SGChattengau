import { describe, it, expect } from 'vitest'
import { renderAntragBestaetigung, renderAntragBenachrichtigung, renderBuchungBestaetigung, renderBuchungGenehmigt, renderBuchungAbgelehnt } from '@/lib/email-templates'

describe('email templates', () => {
  const antragData = {
    vorname: 'Max',
    nachname: 'Mustermann',
    email: 'max@example.de',
    sparteName: 'Fußball',
    eintrittsdatum: '2026-05-01',
  }

  it('renders confirmation email for applicant', () => {
    const result = renderAntragBestaetigung(antragData)
    expect(result.subject).toContain('Mitgliedsantrag')
    expect(result.html).toContain('Max Mustermann')
    expect(result.html).toContain('Fußball')
    expect(result.html).toContain('max@example.de')
  })

  it('renders notification email for office', () => {
    const result = renderAntragBenachrichtigung(antragData)
    expect(result.subject).toContain('Neuer Mitgliedsantrag')
    expect(result.html).toContain('Max Mustermann')
    expect(result.html).toContain('Fußball')
  })
})

describe('buchung email templates', () => {
  const buchungData = {
    name: 'Max Mustermann', email: 'max@example.de',
    datum: '15.06.2026', startzeit: '14:00', endzeit: '22:00', anlass: 'Geburtstagsfeier',
  }

  it('renders booking confirmation', () => {
    const result = renderBuchungBestaetigung(buchungData)
    expect(result.subject).toContain('Buchungsanfrage')
    expect(result.html).toContain('Max Mustermann')
    expect(result.html).toContain('Geburtstagsfeier')
  })

  it('renders approval with payment info', () => {
    const result = renderBuchungGenehmigt(buchungData)
    expect(result.subject).toContain('genehmigt')
    expect(result.html).toContain('50')
    expect(result.html).toContain('Max Mustermann')
  })

  it('renders rejection', () => {
    const result = renderBuchungAbgelehnt({ ...buchungData, grund: 'Vereinsheim bereits belegt' })
    expect(result.subject).toContain('abgelehnt')
    expect(result.html).toContain('bereits belegt')
  })
})
