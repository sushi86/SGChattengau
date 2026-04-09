import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.IBAN_ENCRYPTION_KEY =
    'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2'
})

describe('encryption', () => {
  it('encrypts and decrypts an IBAN correctly', async () => {
    const { encrypt, decrypt } = await import('@/lib/encryption')
    const iban = 'DE89370400440532013000'
    const encrypted = encrypt(iban)
    expect(encrypted).not.toBe(iban)
    expect(decrypt(encrypted)).toBe(iban)
  })

  it('produces different ciphertexts for the same input (random IV)', async () => {
    const { encrypt } = await import('@/lib/encryption')
    const iban = 'DE89370400440532013000'
    const a = encrypt(iban)
    const b = encrypt(iban)
    expect(a).not.toBe(b)
  })

  it('throws on tampered ciphertext', async () => {
    const { encrypt, decrypt } = await import('@/lib/encryption')
    const encrypted = encrypt('DE89370400440532013000')
    const tampered = encrypted.slice(0, -2) + 'XX'
    expect(() => decrypt(tampered)).toThrow()
  })

  it('extracts last 4 digits correctly', async () => {
    const { extractLast4 } = await import('@/lib/encryption')
    expect(extractLast4('DE89 3704 0044 0532 0130 00')).toBe('3000')
    expect(extractLast4('DE89370400440532013000')).toBe('3000')
  })

  it('encrypts and decrypts unicode (Kontoinhaber names)', async () => {
    const { encrypt, decrypt } = await import('@/lib/encryption')
    const name = 'Müller-Lüdenscheidt'
    expect(decrypt(encrypt(name))).toBe(name)
  })

  it('encrypts and decrypts long strings (signature base64)', async () => {
    const { encrypt, decrypt } = await import('@/lib/encryption')
    const longString = 'data:image/png;base64,' + 'A'.repeat(10000)
    expect(decrypt(encrypt(longString))).toBe(longString)
  })
})
