import { validateIBAN, friendlyFormatIBAN, electronicFormatIBAN } from 'ibantools'

interface IbanValidationResult {
  valid: boolean
  bic?: string
  bankName?: string
  error?: string
}

const KNOWN_BANKS: Record<string, string> = {
  'COBADEFFXXX': 'Commerzbank',
  'COBADEFF': 'Commerzbank',
  'DEUTDEDBFRA': 'Deutsche Bank',
  'DEUTDEFF': 'Deutsche Bank',
  'GENODED1GDB': 'GLS Bank',
  'HELADEF1KAS': 'Kasseler Sparkasse',
  'HELADEF1MEG': 'Kreissparkasse Schwalm-Eder',
  'PBNKDEFF': 'Postbank',
  'BYLADEM1001': 'DKB',
  'INGDDEFFXXX': 'ING',
  'INGDDEFF': 'ING',
  'MAABORSMXXX': 'N26',
}

export function validateIban(input: string): IbanValidationResult {
  if (!input || input.trim().length === 0) {
    return { valid: false, error: 'IBAN ist erforderlich' }
  }

  const electronic = electronicFormatIBAN(input.trim())
  if (!electronic) {
    return { valid: false, error: 'Ungültiges IBAN-Format' }
  }

  const validation = validateIBAN(electronic)
  if (!validation.valid) {
    return { valid: false, error: 'Ungültige IBAN' }
  }

  return { valid: true }
}

export function formatIban(iban: string): string {
  return friendlyFormatIBAN(iban.replace(/\s/g, '')) || iban
}

export function getBankName(bic: string): string {
  if (KNOWN_BANKS[bic]) return KNOWN_BANKS[bic]
  const prefix = bic.replace(/XXX$/, '')
  if (KNOWN_BANKS[prefix]) return KNOWN_BANKS[prefix]
  return bic
}
