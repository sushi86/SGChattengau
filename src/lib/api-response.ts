import { NextResponse } from 'next/server'
import { ApiError } from './api-error'

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status })
}

interface PaginationMeta {
  seite: number
  limit: number
  gesamt: number
}

export function apiPaginated<T>(
  data: T[],
  meta: PaginationMeta
): NextResponse {
  return NextResponse.json({ data, meta })
}

export function apiError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json(err.toJSON(), { status: err.statusCode })
  }

  console.error('Unhandled error:', err)
  return NextResponse.json(
    { error: { code: 'INTERNAL_ERROR', message: 'Interner Serverfehler' } },
    { status: 500 }
  )
}
