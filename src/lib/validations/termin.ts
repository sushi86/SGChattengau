import { z } from 'zod'

export const terminCreateSchema = z.object({
  titel: z.string().min(3, 'Titel muss mindestens 3 Zeichen lang sein'),
  beschreibung: z.string().optional(),
  startzeit: z.string().datetime({ message: 'Ungültiges Datum' }),
  endzeit: z.string().datetime({ message: 'Ungültiges Datum' }).optional(),
  ort: z.string().optional(),
  ganztaegig: z.boolean().optional(),
  sparteId: z.string().optional(),
})

export const terminUpdateSchema = terminCreateSchema.partial()

export type TerminCreateInput = z.infer<typeof terminCreateSchema>
export type TerminUpdateInput = z.infer<typeof terminUpdateSchema>
