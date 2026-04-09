# Design-Spec: Website + App-Platform SG 1898 Chattengau e.V.

## Kontext

Die SG 1898 Chattengau e.V. (Niedenstein, Nordhessen) benötigt eine neue Website als Ablösung der bestehenden WordPress/Divi-Seite. Die neue Plattform soll API-First aufgebaut sein, um später eine iOS/Android-App anbinden zu können.

Bestehende Website: https://sg1898chattengau.de
Claim: "Wir bewegen Niedenstein!"

---

## 1. Technologie-Stack

| Komponente | Technologie |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS (Mobile-First) |
| API | Next.js Route Handlers (`/api/v1/*`) |
| API-Docs | OpenAPI 3.1 + Swagger UI (`/api/docs`) |
| Auth | NextAuth.js v5 (Session für Web) + JWT (Bearer Token für Apps) |
| Validierung | Zod (shared schemas zwischen Frontend, API, OpenAPI) |
| Datenbank | PostgreSQL 16 + Prisma ORM |
| Verschlüsselung | Node.js `crypto` (AES-256-GCM) für IBAN, Kontoinhaber, Signaturen |
| E-Mail | Konfigurierbar im Admin-Backoffice (Resend API, SMTP, etc.) |
| Kalender | ical.js für iCal-Feed-Generierung |
| Rich-Text | Tiptap (eingeschränkte Toolbar für Spartenleiter/Kursleiter) |
| Styling | Tailwind CSS, Mobile-First |
| Deployment | Docker + docker-compose |

---

## 2. Design-System

### Farben (orientiert an bestehender Website)

- **Primär:** #2ea3f2 (Blau)
- **Primär Hover:** #1a8cd8 (dunkleres Blau)
- **Text:** #333333 (Überschriften), #666666 (Fließtext)
- **Hintergrund:** #ffffff (Haupt), #f7f7f7 (Sektionen alternierend)
- **Border/Trenner:** #dddddd, #eeeeee
- **Erfolg:** #28a745
- **Fehler:** #dc3545
- **Warnung:** #ffc107

### Typografie

- **Body:** Open Sans (300–700)
- **Headings:** Archivo (500–700)
- **Größen (Mobile → Desktop):**
  - H1: 24px → 30px
  - H2: 20px → 26px
  - H3: 18px → 22px
  - Body: 14px → 16px
- **Zeilenabstand:** 1.7

### Breakpoints (Mobile-First)

- **Mobile:** 320px – 767px (Default)
- **Tablet:** 768px – 1023px
- **Desktop:** 1024px+
- **Max Container:** 1080px

### Touch-Targets

Mindestens 44x44px für alle interaktiven Elemente (Apple HIG).

### Logo

Vereinslogo als JPEG vorhanden (`/public/logo.jpeg`). Wird im Header links angezeigt, daneben der Claim "Wir bewegen Niedenstein!".

---

## 3. Rollenmodell & Berechtigungen

| Rolle | Berechtigungen |
|---|---|
| **Admin** | Vollzugriff: Nutzerverwaltung, Mitgliedsanträge (inkl. IBAN-Entschlüsselung), CSV-Export, Systemkonfiguration (E-Mail-Provider, Sparten-Mapping), Vereinsheim-Buchungen genehmigen, alle Inhalte editieren |
| **Spartenleiter** | Eigene Sparte: Inhalte editieren, Trainingszeiten pflegen, Termine anlegen, News schreiben, Bilder hochladen |
| **Kursleiter** | Eigener Kurs: Inhalte editieren, Trainingszeiten pflegen, Teilnehmerliste einsehen, Anwesenheit abhaken |

---

## 4. Datenmodell-Übersicht

### Kernmodelle (Phase 1–5)

- **User** — Authentifizierung, Rolle (ADMIN, SPARTENLEITER, KURSLEITER)
- **Sparte** — Name, Slug, Beschreibung, Trainingszeiten, Ansprechpartner, Bilder, Typ (SPARTE oder KURS)
- **Mitgliedsantrag** — Persönliche Daten, verschlüsselte SEPA-Daten, Einwilligungen, Signaturen, Status-Workflow
- **Mitglied** — Vorbereitet für späteren Vereinsmanager (Phase 1 angelegt, noch nicht aktiv)
- **Termin** — Titel, Datum, Ort, Sparte(n), Beschreibung
- **Beitrag** — News/Blog mit Spartenfilter, Tiptap-Content
- **Buchung** — Vereinsheim-Reservierung mit Genehmigungs-Workflow
- **SystemConfig** — Key-Value-Store für Admin-konfigurierbare Einstellungen (E-Mail-Provider, SMTP-Daten, etc.)

### Kurs-Modelle (Phase 6)

- **Kurs** — Erweitert Sparte um: max. Teilnehmer, Preis, Zeitraum
- **ZehnerkKarte** — Käufer, Kurs, Preis, Gültigkeitszeitraum, verbleibende Einheiten
- **KursBuchung** — Teilnehmer, Kurs/10er-Karte, Datum, Anwesenheitsstatus
- **Zahlung** — SumUp-Referenz, Betrag, Status, Typ (ZEHNERKARTE, EINZELBUCHUNG)

### Verschlüsselte Felder (AES-256-GCM)

- `iban_encrypted` — IBAN (Bankverbindung)
- `kontoinhaber_encrypted` — Name des Kontoinhabers
- `signatur_*_encrypted` — Digitale Unterschriften (Canvas-Bilder)

Nicht verschlüsselt, aber abgeleitet: `iban_last4` für maskierte Anzeige in Listen.

---

## 5. E-Mail-Konfiguration (Admin-Backoffice)

Statt einen festen E-Mail-Provider zu verdrahten, wird dies im Admin konfigurierbar:

**Einstellbare Parameter:**
- Provider-Typ: Resend API / SMTP
- API-Key (bei Resend) oder Host/Port/User/Passwort (bei SMTP)
- Absender-Adresse und -Name
- Test-Mail-Funktion zum Verifizieren der Konfiguration

**Gespeichert in:** `SystemConfig`-Tabelle (API-Keys verschlüsselt).

---

## 6. Sparten & Kurse

Sparten und Kurse teilen sich das gleiche Grundmodell (`Sparte`), unterschieden durch ein `typ`-Feld:

| | Sparte | Kurs |
|---|---|---|
| Typ | `SPARTE` | `KURS` |
| Leitung | Spartenleiter | Kursleiter |
| Dauer | Permanent | Kann zeitlich begrenzt sein |
| Teilnehmerbegrenzung | Nein | Ja (max. Teilnehmer) |
| 10er-Karten | Nein | Ja (Phase 6) |
| Online-Buchung | Nein | Ja (Phase 6) |

### Bestehende Sparten (aus aktueller Website)

Fußball, Nordic Walking, Rehasport, Judo, Schwimmen, Volleyball, Tischtennis, Tennis, Laufen, Fotografie, Kinderturnen, Qigong, Metalza, Fit am Montag, Gesundheitssport, Fitness/Gymnastik, Yoga, Triathlon/Multisport

---

## 7. Phasenplan

| Phase | Inhalt |
|---|---|
| **1. API-Fundament + Basis-UI** | Next.js Setup, Prisma Schema (komplett), Docker, Auth (dual), API-Gerüst, OpenAPI, Verschlüsselungsmodul, Basis-Layout (Mobile-First), statische Seiten |
| **2. Digitaler Mitgliedsantrag** | Multi-Step-Formular, IBAN-Verschlüsselung, Canvas-Signatur, Admin-Dashboard, Vereinsmeister CSV-Export |
| **3. Sparten-CMS + News** | Tiptap-Editor, Spartenleiter-Dashboard, öffentliche Spartenseiten, News-Modul |
| **4. Terminkalender** | Kalender-UI (Liste + Monats), iCal-Feed, Spartenfilter, CRUD |
| **5. Vereinsheim-Buchung** | Belegungskalender, Anfrage-Formular, Admin-Genehmigungs-Workflow |
| **6. Kurs-System + 10er-Karten + SumUp** | Kurs-Buchung, 10er-Karten-Verwaltung, SumUp-Payment-Integration, Anwesenheits-Tracking |
| **7. Feinschliff + Migration** | SEO, 301-Redirects, Content-Migration, Lighthouse Audit, DNS-Umstellung |

---

## 8. API-Konventionen

- **Basis-Pfad:** `/api/v1/`
- **Pagination:** `?seite=1&limit=20` → `{ data: [...], meta: { seite, limit, gesamt } }`
- **Fehler:** `{ error: { code: "VALIDATION_ERROR", message: "...", details: [...] } }`
- **Auth:** Session-Cookie (Web) oder `Authorization: Bearer <jwt>` (App)
- **Rate-Limiting:** 100 req/min (öffentlich), 300 req/min (authentifiziert)
- **CORS:** Konfigurierbar für App-Domains
- **Versionierung:** Bei Breaking Changes → `/api/v2/`, v1 bleibt für bestehende Clients

---

## 9. Sicherheit

- **HTTPS** durchgehend (TLS 1.3)
- **IBAN/Kontoinhaber/Signaturen:** AES-256-GCM Application-Level Encryption
- **IBAN_ENCRYPTION_KEY:** Nur als Environment-Variable, nicht im Code/DB/Repo
- **Session-Cookies:** httpOnly, secure, sameSite=lax
- **Bot-Schutz:** Rate-Limiting + Honeypot (kein CAPTCHA)
- **DSGVO:** Löschkonzept mit automatischer Bereinigung (Cron), Art. 13-Informationspflichten
- **Admin-Config-Secrets** (SMTP-Passwörter, API-Keys): Verschlüsselt in SystemConfig

---

## 10. Mobile-First-Prinzipien

1. Alle Komponenten zuerst für 320px–428px designed
2. Touch-Targets: min. 44x44px
3. Navigation: Hamburger-Menu auf Mobile, horizontal ab Tablet
4. Formulare: Single-Column auf Mobile, volle Breite für Inputs
5. Kalender: Listenansicht als Mobile-Default
6. Bilder: `next/image` mit WebP/AVIF
7. Performance-Budget: Lighthouse Mobile Score >= 90
