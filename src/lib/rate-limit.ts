interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (entry && entry.resetAt <= now) {
    store.delete(key)
  }

  const current = store.get(key)

  if (!current) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs }
  }

  current.count++

  if (current.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt }
  }

  return { allowed: true, remaining: maxRequests - current.count, resetAt: current.resetAt }
}

export function resetRateLimitStore(): void {
  store.clear()
}
