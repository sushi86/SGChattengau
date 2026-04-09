import { z } from 'zod'

export const zehnerkarteKaufSchema = z.object({
  vorname: z.string().min(2, 'Vorname muss mindestens 2 Zeichen lang sein'),
  nachname: z.string().min(2, 'Nachname muss mindestens 2 Zeichen lang sein'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  istMitglied: z.boolean(),
})

export const kursBuchungSchema = z.object({
  vorname: z.string().min(2, 'Vorname muss mindestens 2 Zeichen lang sein'),
  nachname: z.string().min(2, 'Nachname muss mindestens 2 Zeichen lang sein'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum'),
  zehnerkarteId: z.string().min(1, '10er-Karten-ID fehlt'),
})

export const anwesenheitSchema = z.object({
  anwesenheit: z.enum(['GEBUCHT', 'ANWESEND', 'ABWESEND', 'STORNIERT']),
})

export const kursUpdateSchema = z.object({
  maxTeilnehmer: z.number().int().min(1).nullable().optional(),
  preisZehnerkarteMitglied: z.number().min(0).nullable().optional(),
  preisZehnerkarteGast: z.number().min(0).nullable().optional(),
})

export type ZehnerkarteKaufInput = z.infer<typeof zehnerkarteKaufSchema>
export type KursBuchungInput = z.infer<typeof kursBuchungSchema>
