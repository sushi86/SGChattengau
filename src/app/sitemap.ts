import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://sg1898chattengau.de'

  // Statische Seiten
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/angebote`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/termine`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/aktuelles`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/mitmachen`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/belegung-vereinsheim`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/kontakt`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/impressum`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/datenschutz`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Dynamische Sparten-Seiten
  const sparten = await prisma.sparte.findMany({
    where: { isActive: true },
    select: { slug: true, typ: true, updatedAt: true },
  })

  const spartenPages: MetadataRoute.Sitemap = sparten.map((s) => ({
    url: `${baseUrl}/${s.typ === 'KURS' ? 'kurse' : 'sparten'}/${s.slug}`,
    lastModified: s.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Dynamische Beitrags-Seiten
  const beitraege = await prisma.beitrag.findMany({
    where: { veroeffentlicht: true },
    select: { slug: true, updatedAt: true },
  })

  const beitraegePages: MetadataRoute.Sitemap = beitraege.map((b) => ({
    url: `${baseUrl}/aktuelles/${b.slug}`,
    lastModified: b.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...spartenPages, ...beitraegePages]
}
