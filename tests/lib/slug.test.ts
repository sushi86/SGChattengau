import { describe, it, expect } from 'vitest'
import { generateSlug } from '@/lib/slug'

describe('generateSlug', () => {
  it('converts to lowercase', () => {
    expect(generateSlug('Fußball')).toBe('fussball')
  })

  it('replaces spaces with hyphens', () => {
    expect(generateSlug('Fit am Montag')).toBe('fit-am-montag')
  })

  it('replaces umlauts', () => {
    expect(generateSlug('Übungsleiter Müller')).toBe('uebungsleiter-mueller')
  })

  it('removes special characters', () => {
    expect(generateSlug('Triathlon / Multisport')).toBe('triathlon-multisport')
  })

  it('collapses multiple hyphens', () => {
    expect(generateSlug('Fitness & Gymnastik')).toBe('fitness-gymnastik')
  })

  it('trims hyphens from start and end', () => {
    expect(generateSlug(' -Test- ')).toBe('test')
  })

  it('handles ß correctly', () => {
    expect(generateSlug('Straße')).toBe('strasse')
  })
})
