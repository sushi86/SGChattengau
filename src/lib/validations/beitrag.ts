import { z } from 'zod'

export const beitragCreateSchema = z.object({
  titel: z.string().min(3, 'Titel muss mindestens 3 Zeichen lang sein'),
  inhalt: z.string().min(10, 'Inhalt muss mindestens 10 Zeichen lang sein'),
  auszug: z.string().optional(),
  bildUrl: z.string().optional(),
  sparteId: z.string().optional(),
  veroeffentlicht: z.boolean().optional(),
})

export const beitragUpdateSchema = beitragCreateSchema.partial()

export type BeitragCreateInput = z.infer<typeof beitragCreateSchema>
export type BeitragUpdateInput = z.infer<typeof beitragUpdateSchema>
