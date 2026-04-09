import { describe, it, expect } from 'vitest'
import { ApiError, ValidationError, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/api-error'

describe('ApiError', () => {
  it('creates an ApiError with code and status', () => {
    const err = new ApiError('CUSTOM_ERROR', 'Something broke', 500)
    expect(err.code).toBe('CUSTOM_ERROR')
    expect(err.message).toBe('Something broke')
    expect(err.statusCode).toBe(500)
  })

  it('creates a ValidationError with details', () => {
    const details = [{ field: 'email', message: 'Ungültige E-Mail' }]
    const err = new ValidationError('Validierung fehlgeschlagen', details)
    expect(err.code).toBe('VALIDATION_ERROR')
    expect(err.statusCode).toBe(400)
    expect(err.details).toEqual(details)
  })

  it('creates an UnauthorizedError', () => {
    const err = new UnauthorizedError()
    expect(err.statusCode).toBe(401)
    expect(err.code).toBe('UNAUTHORIZED')
  })

  it('creates a ForbiddenError', () => {
    const err = new ForbiddenError()
    expect(err.statusCode).toBe(403)
    expect(err.code).toBe('FORBIDDEN')
  })

  it('creates a NotFoundError', () => {
    const err = new NotFoundError('Sparte')
    expect(err.statusCode).toBe(404)
    expect(err.message).toBe('Sparte nicht gefunden')
  })
})
