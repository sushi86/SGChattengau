export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
    public readonly details?: unknown[]
  ) {
    super(message)
    this.name = 'ApiError'
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    }
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Validierung fehlgeschlagen', details?: unknown[]) {
    super('VALIDATION_ERROR', message, 400, details)
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Nicht authentifiziert') {
    super('UNAUTHORIZED', message, 401)
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Keine Berechtigung') {
    super('FORBIDDEN', message, 403)
  }
}

export class NotFoundError extends ApiError {
  constructor(resource = 'Ressource') {
    super('NOT_FOUND', `${resource} nicht gefunden`, 404)
  }
}
