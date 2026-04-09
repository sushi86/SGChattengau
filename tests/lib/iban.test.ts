import { describe, it, expect } from 'vitest'
import { validateIban, formatIban, getBankName } from '@/lib/iban'

describe('validateIban', () => {
  it('accepts a valid German IBAN', () => {
    const result = validateIban('DE89370400440532013000')
    expect(result.valid).toBe(true)
  })

  it('accepts a valid IBAN with spaces', () => {
    const result = validateIban('DE89 3704 0044 0532 0130 00')
    expect(result.valid).toBe(true)
  })

  it('rejects an invalid IBAN', () => {
    const result = validateIban('DE00000000000000000000')
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('rejects empty input', () => {
    const result = validateIban('')
    expect(result.valid).toBe(false)
  })

  it('rejects non-IBAN strings', () => {
    const result = validateIban('not-an-iban')
    expect(result.valid).toBe(false)
  })
})

describe('formatIban', () => {
  it('formats IBAN with spaces every 4 chars', () => {
    expect(formatIban('DE89370400440532013000')).toBe('DE89 3704 0044 0532 0130 00')
  })

  it('handles already formatted IBAN', () => {
    expect(formatIban('DE89 3704 0044 0532 0130 00')).toBe('DE89 3704 0044 0532 0130 00')
  })
})

describe('getBankName', () => {
  it('returns bank name for known BIC', () => {
    const name = getBankName('COBADEFFXXX')
    expect(name).toBe('Commerzbank')
  })

  it('returns BIC for unknown banks', () => {
    const name = getBankName('UNKNOWNBIC')
    expect(name).toBe('UNKNOWNBIC')
  })
})
