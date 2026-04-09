import { z } from 'zod'

export const sparteUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  beschreibung: z.string().optional(),
  typ: z.enum(['SPARTE', 'KURS']).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  maxTeilnehmer: z.number().int().min(1).nullable().optional(),
  preisZehnerkarteMitglied: z.number().min(0).nullable().optional(),
  preisZehnerkarteGast: z.number().min(0).nullable().optional(),
})

export const trainingszeitSchema = z.object({
  id: z.string().optional(),
  wochentag: z.number().int().min(0).max(6),
  startzeit: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  endzeit: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  ort: z.string().optional(),
  hinweis: z.string().optional(),
})

export const trainingszeitenUpdateSchema = z.object({
  trainingszeiten: z.array(trainingszeitSchema),
})

export const ansprechpartnerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  rolle: z.string().optional(),
  telefon: z.string().optional(),
  email: z.string().email('Ungültige E-Mail').optional().or(z.literal('')),
})

export const ansprechpartnerUpdateSchema = z.object({
  ansprechpartner: z.array(ansprechpartnerSchema),
})

export const sparteCreateSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  typ: z.enum(['SPARTE', 'KURS']).optional(),
})

export type SparteUpdateInput = z.infer<typeof sparteUpdateSchema>
export type TrainingszeitenUpdateInput = z.infer<typeof trainingszeitenUpdateSchema>
export type AnsprechpartnerUpdateInput = z.infer<typeof ansprechpartnerUpdateSchema>
