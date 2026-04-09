import { z } from 'zod'

export const buchungAnfrageSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  telefon: z.string().optional(),
  datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum'),
  anlass: z.string().min(3, 'Anlass muss mindestens 3 Zeichen lang sein'),
  nachricht: z.string().optional(),
  website: z.string().max(0, 'Bot detected').optional(),
})

// Admin: Tag blockieren / Belegung einspeichern
export const buchungAdminCreateSchema = z.object({
  datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum'),
  anlass: z.string().min(1, 'Anlass fehlt'),
  name: z.string().optional(),
  email: z.string().optional(),
  status: z.enum(['GENEHMIGT', 'ANGEFRAGT']).optional(),
})

export const buchungStatusSchema = z.object({
  status: z.enum(['ANGEFRAGT', 'GENEHMIGT', 'ABGELEHNT', 'STORNIERT']),
  ablehnungsgrund: z.string().optional(),
})

export type BuchungAnfrageInput = z.infer<typeof buchungAnfrageSchema>
