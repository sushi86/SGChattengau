import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh Token fehlt'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
