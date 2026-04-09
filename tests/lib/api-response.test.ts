import { describe, it, expect } from 'vitest'
import { apiSuccess, apiPaginated, apiError } from '@/lib/api-response'
import { ValidationError } from '@/lib/api-error'

describe('apiSuccess', () => {
  it('returns a 200 JSON response', async () => {
    const res = apiSuccess({ name: 'Fußball' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual({ name: 'Fußball' })
  })

  it('accepts a custom status code', async () => {
    const res = apiSuccess({ id: '1' }, 201)
    expect(res.status).toBe(201)
  })
})

describe('apiPaginated', () => {
  it('returns paginated response with meta', async () => {
    const items = [{ id: '1' }, { id: '2' }]
    const res = apiPaginated(items, { seite: 1, limit: 20, gesamt: 50 })
    const body = await res.json()
    expect(body.data).toHaveLength(2)
    expect(body.meta).toEqual({ seite: 1, limit: 20, gesamt: 50 })
  })
})

describe('apiError', () => {
  it('returns error response from ApiError', async () => {
    const err = new ValidationError('Feld fehlt', [
      { field: 'email', message: 'Pflichtfeld' },
    ])
    const res = apiError(err)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(body.error.details).toHaveLength(1)
  })

  it('returns 500 for unknown errors', async () => {
    const res = apiError(new Error('boom'))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error.code).toBe('INTERNAL_ERROR')
  })
})
