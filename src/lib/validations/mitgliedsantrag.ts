import { z } from 'zod'

export const persoenlichesDatenSchema = z.object({
  vorname: z.string().min(2, 'Vorname muss mindestens 2 Zeichen lang sein'),
  nachname: z.string().min(2, 'Nachname muss mindestens 2 Zeichen lang sein'),
  geburtsdatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum'),
  geschlecht: z.enum(['M', 'W', 'D'], { message: 'Bitte Geschlecht wählen' }),
  strasse: z.string().min(3, 'Straße muss mindestens 3 Zeichen lang sein'),
  plz: z.string().regex(/^\d{5}$/, 'PLZ muss 5 Ziffern haben'),
  ort: z.string().min(2, 'Ort muss mindestens 2 Zeichen lang sein'),
  telefon: z.string().optional(),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  erziehungsberechtigter: z.string().optional(),
})

export const spartenwahlSchema = z.object({
  sparteId: z.string().min(1, 'Bitte eine Sparte wählen'),
  eintrittsdatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum'),
})

export const sepaSchema = z.object({
  iban: z.string().min(15, 'IBAN ist zu kurz'),
  kontoinhaber: z.string().min(2, 'Kontoinhaber muss mindestens 2 Zeichen lang sein'),
  kreditinstitut: z.string().min(1, 'Kreditinstitut fehlt'),
})

export const einwilligungenSchema = z.object({
  satzungAkzeptiert: z.literal(true, { error: 'Satzung muss akzeptiert werden' }),
  datenschutzAkzeptiert: z.literal(true, { error: 'Datenschutz muss akzeptiert werden' }),
  sepaAkzeptiert: z.literal(true, { error: 'SEPA-Mandat muss erteilt werden' }),
})

export const signaturenSchema = z.object({
  signaturMitglied: z.string().min(100, 'Unterschrift fehlt'),
  signaturSepa: z.string().min(100, 'SEPA-Unterschrift fehlt'),
  signaturErzBerech: z.string().optional(),
})

export const mitgliedsantragSchema = persoenlichesDatenSchema
  .merge(spartenwahlSchema)
  .merge(sepaSchema)
  .merge(einwilligungenSchema)
  .merge(signaturenSchema)

export type MitgliedsantragInput = z.infer<typeof mitgliedsantragSchema>

export const antragSubmitSchema = mitgliedsantragSchema.extend({
  website: z.string().max(0, 'Bot detected').optional(),
})
