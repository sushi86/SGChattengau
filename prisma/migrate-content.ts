import * as fs from 'node:fs'
import * as path from 'node:path'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Load .env.local since tsx doesn't auto-load it like Next.js does
function loadEnvLocal() {
  const envPath = path.resolve(import.meta.dirname ?? __dirname, '../.env.local')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const match = line.match(/^([^#=]+)=["']?(.+?)["']?\s*$/)
      if (match && !process.env[match[1].trim()]) {
        process.env[match[1].trim()] = match[2].trim()
      }
    }
  }
  const envFallback = path.resolve(import.meta.dirname ?? __dirname, '../.env')
  if (fs.existsSync(envFallback)) {
    const content = fs.readFileSync(envFallback, 'utf-8')
    for (const line of content.split('\n')) {
      const match = line.match(/^([^#=]+)=["']?(.+?)["']?\s*$/)
      if (match && !process.env[match[1].trim()]) {
        process.env[match[1].trim()] = match[2].trim()
      }
    }
  }
}

loadEnvLocal()

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Please check .env.local or .env')
  process.exit(1)
}

const adapter = new PrismaPg(process.env.DATABASE_URL)
const prisma = new PrismaClient({ adapter }) as unknown as InstanceType<typeof PrismaClient>

// ─── HTML Entity Decoding ───

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#8222;/g, '\u201E') // „
    .replace(/&#8220;/g, '\u201C') // "
    .replace(/&#8221;/g, '\u201D') // "
    .replace(/&#8216;/g, '\u2018') // '
    .replace(/&#8217;/g, '\u2019') // '
    .replace(/&#8211;/g, '\u2013') // –
    .replace(/&#8212;/g, '\u2014') // —
    .replace(/&#8230;/g, '\u2026') // …
    .replace(/&#8243;/g, '\u2033') // ″
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
}

// ─── Divi Shortcode Stripping ───

function stripDiviShortcodes(html: string): string {
  // Remove Divi shortcode tags like [et_pb_section ...], [/et_pb_section], etc.
  let cleaned = html.replace(/\[\/?(et_pb_[^\]]*)\]/g, '')
  // Remove inline styles
  cleaned = cleaned.replace(/ style="[^"]*"/g, '')
  // Remove class attributes with Divi/FB CSS classes
  cleaned = cleaned.replace(/ class="[^"]*"/g, '')
  // Remove data attributes
  cleaned = cleaned.replace(/ data-[a-z-]+="[^"]*"/g, '')
  // Remove loading/decoding attributes
  cleaned = cleaned.replace(/ (loading|decoding|referrerpolicy|alt)="[^"]*"/g, '')
  // Remove empty divs
  cleaned = cleaned.replace(/<div>\s*<\/div>/g, '')
  // Remove Facebook emoji images
  cleaned = cleaned.replace(/<img[^>]*class="[^"]*"[^>]*alt="[^"]*"[^>]*\/>/g, '')
  cleaned = cleaned.replace(/<img[^>]*src="https:\/\/static\.xx\.fbcdn[^"]*"[^>]*\/>/g, '')
  // Collapse multiple newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
  // Decode HTML entities
  cleaned = decodeHtmlEntities(cleaned)
  return cleaned.trim()
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

// ─── Wochentag Mapping ───

const WOCHENTAG: Record<string, number> = {
  Mo: 0,
  Di: 1,
  Mi: 2,
  Do: 3,
  Fr: 4,
  Sa: 5,
  So: 6,
}

// ─── Sparten Data ───

interface TrainingszeitData {
  wochentag: number
  startzeit: string
  endzeit: string
  ort?: string
  hinweis?: string
}

interface AnsprechpartnerData {
  name: string
  rolle?: string
  telefon?: string
  email?: string
}

interface SparteData {
  slug: string
  beschreibung: string
  trainingszeiten: TrainingszeitData[]
  ansprechpartner: AnsprechpartnerData[]
}

const spartenData: SparteData[] = [
  {
    slug: 'fussball',
    beschreibung: 'Fußball wird im Chattengau zusammen mit dem TSV Metze gespielt. Die beiden Niedensteiner Stadtteile bilden im Jugend- und Seniorenbereich eine Gemeinschaft. Unser Motto: \u201EJeder soll die Möglichkeit haben Fußball zu spielen\u201C.',
    trainingszeiten: [
      { wochentag: WOCHENTAG.Fr, startzeit: '17:00', endzeit: '18:00', hinweis: 'Bambini', ort: 'Sportplatz Metze' },
      { wochentag: WOCHENTAG.Mi, startzeit: '17:30', endzeit: '19:00', hinweis: 'F-Jugend', ort: 'Sportplatz Niedenstein' },
      { wochentag: WOCHENTAG.Fr, startzeit: '17:00', endzeit: '18:30', hinweis: 'F-Jugend', ort: 'Sportplatz Niedenstein' },
      { wochentag: WOCHENTAG.Mo, startzeit: '18:00', endzeit: '19:45', hinweis: 'E1-Jugend', ort: 'Sportplatz Niedenstein' },
      { wochentag: WOCHENTAG.Mi, startzeit: '18:00', endzeit: '19:45', hinweis: 'E1-Jugend', ort: 'Sportplatz Niedenstein' },
      { wochentag: WOCHENTAG.Mo, startzeit: '17:30', endzeit: '19:00', hinweis: 'E2-Jugend', ort: 'Metze Sportplatz' },
      { wochentag: WOCHENTAG.Mo, startzeit: '17:30', endzeit: '19:30', hinweis: 'D-Jugend', ort: 'Sportplatz Niedenstein' },
      { wochentag: WOCHENTAG.Mi, startzeit: '17:30', endzeit: '19:30', hinweis: 'D-Jugend', ort: 'Sportplatz Niedenstein' },
      { wochentag: WOCHENTAG.Di, startzeit: '17:30', endzeit: '19:00', hinweis: 'C-Jugend', ort: 'Sportplatz Niedenstein' },
      { wochentag: WOCHENTAG.Do, startzeit: '17:30', endzeit: '19:00', hinweis: 'C-Jugend', ort: 'Sportplatz Niedenstein' },
      { wochentag: WOCHENTAG.Do, startzeit: '16:30', endzeit: '18:00', hinweis: 'Mädchenfußball', ort: 'Sportplatz Niedenstein' },
      { wochentag: WOCHENTAG.Di, startzeit: '19:00', endzeit: '20:30', hinweis: 'Senioren', ort: 'Niedenstein/Metze' },
      { wochentag: WOCHENTAG.Fr, startzeit: '19:00', endzeit: '20:30', hinweis: 'Senioren', ort: 'Niedenstein/Metze' },
    ],
    ansprechpartner: [
      { name: 'Sebastian Heerdt', rolle: 'Jugendleiter' },
      { name: 'Christoph Lang', rolle: 'F-Jugend', telefon: '0173-6375703' },
      { name: 'FSG Metze/Chattengau', rolle: 'E-Mail-Kontakt', email: 'fsg.metzechattengau@gmail.com' },
    ],
  },
  {
    slug: 'schwimmen',
    beschreibung: 'Wir sehen unsere Aufgabe darin, Kindern und Jugendlichen die Freude am Schwimmen zu vermitteln. In unseren unterschiedlichen Trainingsgruppen bringen qualifizierte Übungsleiter und Trainer die verschiedenen Schwimmtechniken bei.',
    trainingszeiten: [
      { wochentag: WOCHENTAG.Mo, startzeit: '15:30', endzeit: '16:15', hinweis: 'Gruppe 1', ort: 'Hallenbad Niedenstein' },
      { wochentag: WOCHENTAG.Mo, startzeit: '16:00', endzeit: '17:00', hinweis: 'Gruppe 2', ort: 'Hallenbad Niedenstein' },
      { wochentag: WOCHENTAG.Mo, startzeit: '16:15', endzeit: '17:15', hinweis: 'Gruppe 3', ort: 'Hallenbad Niedenstein' },
      { wochentag: WOCHENTAG.Mo, startzeit: '17:00', endzeit: '19:00', hinweis: 'Gruppe 4+5', ort: 'Hallenbad Niedenstein' },
      { wochentag: WOCHENTAG.Mo, startzeit: '19:00', endzeit: '20:00', hinweis: 'Schwimmen für Jedermann', ort: 'Hallenbad Niedenstein' },
      { wochentag: WOCHENTAG.Sa, startzeit: '09:00', endzeit: '10:45', hinweis: 'Leistungsgruppe', ort: 'Hallenbad Niedenstein' },
    ],
    ansprechpartner: [
      { name: 'Marc Dente', rolle: 'Spartenleiter', telefon: '0175-6671694', email: 'Marc.Dente@sg-chattengau.de' },
    ],
  },
  {
    slug: 'volleyball',
    beschreibung: 'Volleyball ist mehr als ein Sport \u2013 es ist Teamgeist, Bewegung und Spaß in einem. Bei uns trainierst du nicht nur deine Technik, Sprungkraft und Ausdauer, sondern lernst auch, als Team zusammenzuwachsen.',
    trainingszeiten: [
      { wochentag: WOCHENTAG.Di, startzeit: '19:45', endzeit: '22:00', ort: 'Turnhalle Louise-Schröder-Schule Niedenstein' },
    ],
    ansprechpartner: [
      { name: 'Frank Kirchner', rolle: 'Spartenleiter', telefon: '05624 920087', email: 'frank.kirchner@sg-chattengau.de' },
    ],
  },
  {
    slug: 'tischtennis',
    beschreibung: 'Tischtennis \u2013 schnell, spannend, grenzenlos. Heute gilt Tischtennis als die schnellste Rückschlagsportart der Welt. Aktuell verfügt die SG Chattengau über eine Kooperation mit dem FC Rot Weiß Kirchberg und dem TSV Eintracht Gudensberg.',
    trainingszeiten: [
      { wochentag: WOCHENTAG.Mi, startzeit: '18:00', endzeit: '22:00', ort: 'DGH Kirchberg' },
      { wochentag: WOCHENTAG.Fr, startzeit: '20:00', endzeit: '22:00', ort: 'Turnhalle Odenbergschule, Gudensberg' },
    ],
    ansprechpartner: [
      { name: 'Klaus Reckerth', rolle: 'Spartenleiter', telefon: '05603 3867', email: 'klaus.reckerth@sg-chattengau.de' },
    ],
  },
  {
    slug: 'tennis',
    beschreibung: 'Tennis ist mehr als nur ein Spiel \u2013 es ist ein effektives Ganzkörpertraining. Seit 2022 gehört die Tennis-Sparte des früheren \u201ETennisclub Niedenstein\u201C zur SG Chattengau. Auf zwei Plätzen wird Tennissport für alle Altersklassen angeboten.',
    trainingszeiten: [
      { wochentag: WOCHENTAG.Mo, startzeit: '17:00', endzeit: '18:00', hinweis: 'Tennis für jedermann', ort: 'Tennisanlage Am Schwimmbad' },
      { wochentag: WOCHENTAG.Mi, startzeit: '16:00', endzeit: '17:00', hinweis: 'Schnuppertraining Kleinkinder', ort: 'Tennisanlage' },
      { wochentag: WOCHENTAG.Mi, startzeit: '17:00', endzeit: '18:00', hinweis: 'Kindertraining', ort: 'Tennisanlage' },
      { wochentag: WOCHENTAG.Mi, startzeit: '18:00', endzeit: '19:00', hinweis: 'Erwachsenentraining', ort: 'Tennisanlage' },
      { wochentag: WOCHENTAG.Do, startzeit: '16:00', endzeit: '17:00', hinweis: 'Kindertraining Gruppe 1', ort: 'Tennisanlage' },
      { wochentag: WOCHENTAG.Do, startzeit: '17:00', endzeit: '18:00', hinweis: 'Kindertraining Gruppe 2', ort: 'Tennisanlage' },
      { wochentag: WOCHENTAG.Do, startzeit: '18:00', endzeit: '19:00', hinweis: 'Erwachsenentraining', ort: 'Tennisanlage' },
    ],
    ansprechpartner: [
      { name: 'Detlef Berger', rolle: 'Spartenleiter', telefon: '0171/1903907', email: 'Berger-Niedenstein@t-online.de' },
    ],
  },
  {
    slug: 'judo',
    beschreibung: 'Judo \u2013 \u201ESiegen durch Nachgeben\u201C. Entwickelt von Kan\u014D Jigor\u014D (1860\u20131938). Heute wird Judo in über 150 Ländern ausgeübt und ist damit die am weitesten verbreitete Kampfsportart der Welt.',
    trainingszeiten: [
      { wochentag: WOCHENTAG.Mi, startzeit: '18:00', endzeit: '19:30', hinweis: 'Freies Training', ort: 'Turnhalle Louise-Schröder-Schule' },
      { wochentag: WOCHENTAG.Fr, startzeit: '18:00', endzeit: '19:30', hinweis: 'Anfänger', ort: 'Turnhalle Louise-Schröder-Schule' },
      { wochentag: WOCHENTAG.Fr, startzeit: '19:30', endzeit: '21:00', hinweis: 'Freies Training', ort: 'Turnhalle Louise-Schröder-Schule' },
    ],
    ansprechpartner: [
      { name: 'Martin Schminke', rolle: 'Spartenleiter', telefon: '0152 51830297', email: 'info@sg-chattengau.de' },
    ],
  },
  {
    slug: 'laufen',
    beschreibung: 'Gemeinsam laufen, Spaß haben und fit bleiben \u2013 das ist das Ziel unserer Lauftreffs! Unter Anleitung erfahrener Lauftreff-Betreuer treffen sich Laufbegeisterte jeder Leistungsstufe zu regelmäßigen Trainingseinheiten.',
    trainingszeiten: [
      { wochentag: WOCHENTAG.Mo, startzeit: '18:00', endzeit: '19:00', ort: 'Hessenturmstadion' },
      { wochentag: WOCHENTAG.Mi, startzeit: '18:30', endzeit: '19:30', ort: 'Schwimmbad' },
      { wochentag: WOCHENTAG.Sa, startzeit: '09:00', endzeit: '10:00', hinweis: 'nach Absprache' },
    ],
    ansprechpartner: [
      { name: 'Klaus Pfeifer', rolle: 'Spartenleiter', telefon: '05624 5089914', email: 'panorama-lauf@gmx.de' },
    ],
  },
  {
    slug: 'triathlon-multisport',
    beschreibung: 'In unserer Triathlon-Sparte treffen Sportbegeisterte aller Altersklassen aufeinander. Ob Einsteigerinnen und Einsteiger, ambitionierte Hobbysportler oder Kinder und Jugendliche \u2013 bei uns steht die Freude an Bewegung im Vordergrund.',
    trainingszeiten: [],
    ansprechpartner: [
      { name: 'Sebastian Weber', telefon: '0176-32535700', email: 'sebastian_weber1985@web.de' },
      { name: 'Julia Weber', telefon: '0152-03751926' },
    ],
  },
  {
    slug: 'kinderturnen',
    beschreibung: 'Kinderturnen ist mehr! Bewegung fördert alle Sinne. Wir klettern, rennen, rollen und springen \u2013 und entdecken dabei spielerisch unsere Welt.',
    trainingszeiten: [
      { wochentag: WOCHENTAG.Mo, startzeit: '15:00', endzeit: '16:00', hinweis: 'Turnen 5&6 Jahre', ort: 'Turnhalle Louise-Schröder-Schule' },
      { wochentag: WOCHENTAG.Mo, startzeit: '16:00', endzeit: '17:15', hinweis: 'Turnen 1.-4. Schuljahr', ort: 'Turnhalle Louise-Schröder-Schule' },
      { wochentag: WOCHENTAG.Di, startzeit: '15:30', endzeit: '16:30', hinweis: 'Turnen 3&4 Jahre', ort: 'Turnhalle Louise-Schröder-Schule' },
      { wochentag: WOCHENTAG.Di, startzeit: '16:30', endzeit: '17:30', hinweis: 'Eltern-Kind-Turnen', ort: 'Turnhalle Louise-Schröder-Schule' },
      { wochentag: WOCHENTAG.Mi, startzeit: '15:30', endzeit: '16:30', hinweis: 'Eltern-Kind-Turnen', ort: 'Turnhalle Louise-Schröder-Schule' },
    ],
    ansprechpartner: [
      { name: 'Christine Schön', rolle: 'Spartenleiterin', telefon: '05624-926919', email: 'christineschoen@web.de' },
    ],
  },
  {
    slug: 'rehasport',
    beschreibung: 'Rehabilitationssport bietet Ihnen die Möglichkeit, gemeinsam mit anderen Teilnehmenden Ihre Kraft, Ausdauer, Beweglichkeit und Koordination durch gezielte und wohldosierte Sport- und Bewegungsangebote nachhaltig zu verbessern.',
    trainingszeiten: [
      { wochentag: WOCHENTAG.Mi, startzeit: '15:45', endzeit: '16:45', hinweis: 'Gruppe I', ort: 'Kulturzentrum Niedenstein' },
      { wochentag: WOCHENTAG.Mi, startzeit: '17:00', endzeit: '18:00', hinweis: 'Gruppe II', ort: 'Turnhalle Louise-Schröder-Schule' },
    ],
    ansprechpartner: [
      { name: 'Carmen Pfennig', rolle: 'Kursleiterin', telefon: '05624-926919', email: 'info@sg-chattengau.de' },
    ],
  },
  {
    slug: 'gesundheitssport',
    beschreibung: 'Fit & Vital \u2013 Gesundheitssport. Unser Gesundheitssportangebot umfasst Rehasport, Nordic Walking und QiGong.',
    trainingszeiten: [],
    ansprechpartner: [],
  },
  {
    slug: 'fitness-gymnastik',
    beschreibung: 'Unser Fitness- und Gymnastikangebot umfasst Zumba, KAHA, Metalza, Fit am Montag/Dienstag und Powergymnastik.',
    trainingszeiten: [],
    ansprechpartner: [],
  },
  {
    slug: 'nordic-walking',
    beschreibung: 'Nordic Walking ist ein ganzheitlicher Gesundheits- und Wohlfühlsport für jedes Alter. Die Technik ist leicht zu erlernen und wird von qualifizierten Übungsleitern Schritt für Schritt vermittelt.',
    trainingszeiten: [
      { wochentag: WOCHENTAG.Di, startzeit: '19:00', endzeit: '20:00', ort: 'Treffpunkt Schwimmbad Niedenstein' },
    ],
    ansprechpartner: [
      { name: 'Stefani Brandt', rolle: 'Übungsleiterin', telefon: '0177 7794477', email: 'Stefani.brandt@sg-chattengau.de' },
    ],
  },
  {
    slug: 'fotografie',
    beschreibung: 'Die Fotofreunde Niedenstein sind ein wenig \u201Eexotisch\u201C in einem Sportverein und sehen sich als kulturelle Komponente in der Sportgemeinschaft Chattengau 1898.',
    trainingszeiten: [
      { wochentag: WOCHENTAG.Di, startzeit: '19:00', endzeit: '21:00', hinweis: '3. Dienstag im Monat, nach Absprache' },
    ],
    ansprechpartner: [
      { name: 'Thomas Martin', rolle: 'Spartenleiter', email: 'martin-niedenstein@t-online.de' },
    ],
  },
  {
    slug: 'yoga',
    beschreibung: 'Yoga \u2013 Balance für Körper, Geist und Seele. Yoga ist eine jahrtausendealte Praxis mit Ursprung in Indien, die Körper, Geist und Seele in Einklang bringt.',
    trainingszeiten: [
      { wochentag: WOCHENTAG.Mo, startzeit: '18:00', endzeit: '19:00', ort: 'Kulturzentrum Niedenstein' },
    ],
    ansprechpartner: [
      { name: 'Horst Ulrich', rolle: 'Kursleitung', telefon: '05624-926919', email: 'info@sg-chattengau.de' },
    ],
  },
  {
    slug: 'qigong',
    beschreibung: '\u201EKomm doch mal zur Ruhe\u201C \u2013 Qigong ist eine meditative Bewegungsform. Bewegung und Atemübungen sind die zentralen Elemente. Die Übungen helfen, die Beweglichkeit zu steigern und das Wohlbefinden zu steigern.',
    trainingszeiten: [
      { wochentag: WOCHENTAG.Mo, startzeit: '17:30', endzeit: '18:30', ort: 'Sommermonaten: Sportplatz Wichdorf, Winter: ZOOM' },
    ],
    ansprechpartner: [
      { name: 'Roland Umbach', rolle: 'Kursleiter', telefon: '0152-22735321', email: 'roland-umbach@freenet.de' },
    ],
  },
  {
    slug: 'metalza',
    beschreibung: 'METALZA\u00AE \u2013 Das Workout, das rockt! METALZA\u00AE verbindet funktionelle Fitness mit der Kraft und Dynamik von Metal-Musik. Explosive Moves, kraftvolle Kick- & Punch-Elemente und intensive Ganzkörper-Workouts.',
    trainingszeiten: [
      { wochentag: WOCHENTAG.Do, startzeit: '18:45', endzeit: '19:45', ort: 'Sporthalle Louise-Schröder-Schule Niedenstein' },
    ],
    ansprechpartner: [
      { name: 'Gina Lück', rolle: 'Kursleiterin', telefon: '05624-926919', email: 'glueck@metalza.de' },
    ],
  },
  {
    slug: 'fit-am-montag',
    beschreibung: 'Fit am Montag und Dienstag \u2013 eine abwechslungsreiche, mit Koordination und Balance kombinierte funktionelle Gymnastik zur Erhaltung und Verbesserung der körperlichen und geistigen Beweglichkeit. Speziell für Teilnehmende ab 60 Jahren.',
    trainingszeiten: [
      { wochentag: WOCHENTAG.Mo, startzeit: '18:00', endzeit: '19:15', ort: 'Turnhalle Louise-Schröder-Schule' },
      { wochentag: WOCHENTAG.Di, startzeit: '18:00', endzeit: '19:15', ort: 'Turnhalle Louise-Schröder-Schule' },
    ],
    ansprechpartner: [
      { name: 'Veronika Döring', rolle: 'Übungsleiterin', telefon: '05624-1393, 0171-9302860' },
    ],
  },
]

// ─── Blog Post Import ───

interface WpPost {
  id: number
  date: string
  slug: string
  title: { rendered: string }
  content: { rendered: string }
  excerpt: { rendered: string }
}

async function importBlogPosts() {
  console.log('\n── Importing Blog Posts ──')

  const wpPostsPath = path.resolve(import.meta.dirname ?? __dirname, '../wp-posts.json')
  if (!fs.existsSync(wpPostsPath)) {
    console.log('  wp-posts.json not found, skipping blog import')
    return
  }

  const posts: WpPost[] = JSON.parse(fs.readFileSync(wpPostsPath, 'utf-8'))
  console.log(`  Found ${posts.length} posts in wp-posts.json`)

  let created = 0
  let skipped = 0

  for (const post of posts) {
    // Decode URL-encoded slugs and strip emojis/non-ASCII
    const decodedSlug = decodeURIComponent(post.slug)
      .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII (emojis etc.)
      .replace(/^-+|-+$/g, '')       // Trim leading/trailing hyphens
      .replace(/-{2,}/g, '-')        // Collapse multiple hyphens
    const slug = decodedSlug || post.slug.replace(/%[0-9a-f]{2}/gi, '').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-')
    const existing = await prisma.beitrag.findUnique({ where: { slug } })
    if (existing) {
      skipped++
      continue
    }

    const titel = decodeHtmlEntities(post.title.rendered)
    const inhalt = stripDiviShortcodes(post.content.rendered)
    const excerptText = stripHtmlTags(decodeHtmlEntities(post.excerpt.rendered))
    const auszug = excerptText.length > 200 ? excerptText.substring(0, 200) : excerptText

    await prisma.beitrag.create({
      data: {
        titel,
        slug,
        inhalt,
        auszug: auszug || null,
        veroeffentlicht: true,
        createdAt: new Date(post.date),
        sparteId: null,
      },
    })
    created++
  }

  console.log(`  Blog Posts: ${created} erstellt, ${skipped} übersprungen (bereits vorhanden)`)
}

// ─── Main Migration ───

async function main() {
  console.log('═══ Content Migration Start ═══\n')

  // Step 1: Update Sparten descriptions
  console.log('── Updating Sparten Beschreibungen ──')
  for (const data of spartenData) {
    try {
      await prisma.sparte.update({
        where: { slug: data.slug },
        data: { beschreibung: data.beschreibung },
      })
      console.log(`  ✓ ${data.slug}`)
    } catch (e) {
      console.error(`  ✗ ${data.slug}: ${(e as Error).message}`)
    }
  }

  // Step 2: Clear and recreate Trainingszeiten
  console.log('\n── Importing Trainingszeiten ──')
  await prisma.trainingszeit.deleteMany()
  console.log('  Bestehende Trainingszeiten gelöscht')

  for (const data of spartenData) {
    if (data.trainingszeiten.length === 0) continue
    try {
      const sparte = await prisma.sparte.findUnique({ where: { slug: data.slug } })
      if (!sparte) {
        console.error(`  ✗ Sparte nicht gefunden: ${data.slug}`)
        continue
      }
      await prisma.trainingszeit.createMany({
        data: data.trainingszeiten.map((t) => ({
          sparteId: sparte.id,
          wochentag: t.wochentag,
          startzeit: t.startzeit,
          endzeit: t.endzeit,
          ort: t.ort ?? null,
          hinweis: t.hinweis ?? null,
        })),
      })
      console.log(`  ✓ ${data.slug}: ${data.trainingszeiten.length} Trainingszeiten`)
    } catch (e) {
      console.error(`  ✗ ${data.slug}: ${(e as Error).message}`)
    }
  }

  // Step 3: Clear and recreate Ansprechpartner
  console.log('\n── Importing Ansprechpartner ──')
  await prisma.ansprechpartner.deleteMany()
  console.log('  Bestehende Ansprechpartner gelöscht')

  for (const data of spartenData) {
    if (data.ansprechpartner.length === 0) continue
    try {
      const sparte = await prisma.sparte.findUnique({ where: { slug: data.slug } })
      if (!sparte) {
        console.error(`  ✗ Sparte nicht gefunden: ${data.slug}`)
        continue
      }
      await prisma.ansprechpartner.createMany({
        data: data.ansprechpartner.map((a) => ({
          sparteId: sparte.id,
          name: a.name,
          rolle: a.rolle ?? null,
          telefon: a.telefon ?? null,
          email: a.email ?? null,
        })),
      })
      console.log(`  ✓ ${data.slug}: ${data.ansprechpartner.length} Ansprechpartner`)
    } catch (e) {
      console.error(`  ✗ ${data.slug}: ${(e as Error).message}`)
    }
  }

  // Step 4: Import blog posts
  await importBlogPosts()

  console.log('\n═══ Content Migration Abgeschlossen ═══')
}

main()
  .catch((e) => {
    console.error('Migration fehlgeschlagen:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
