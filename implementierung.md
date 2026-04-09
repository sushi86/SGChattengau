# Implementierungsplan v2: Website + App-Platform SG 1898 Chattengau e.V.

## Änderungen gegenüber v1

- **API-First-Architektur** mit dokumentierter REST-API (OpenAPI/Swagger) als Grundlage für spätere iOS/Android-App
- **Mobile-First-Frontend** — alle UI-Komponenten werden zuerst für mobile Viewports designed
- **Kein PDF-Export von Mitgliedsanträgen** — Daten leben ausschließlich in der Datenbank, nicht als generierte PDFs
- **IBAN-Verschlüsselung** via AES-256-GCM (Application-Level Encryption) — IBAN wird niemals im Klartext in der Datenbank gespeichert
- **Vereinsmeister-kompatiblen CSV-Export** für den Übergang, mit Perspektive auf eigenen Vereinsmanager im Backend
- **Langfristige Vision**: Schrittweiser Aufbau eines eigenen Vereinsmanagers, der den Vereinsmeister ablöst

---

## 1. Architektur-Überblick

### API-First-Prinzip

Die gesamte Business-Logik liegt in einer sauber getrennten API-Schicht. Das Next.js-Frontend ist lediglich ein Client dieser API — genauso wie die spätere iOS/Android-App.

```
┌─────────────────────────────────────────────────────┐
│                    Clients                           │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Next.js  │  │ iOS App  │  │ Android App       │  │
│  │ (SSR/CSR)│  │ (Swift)  │  │ (Kotlin)          │  │
│  └────┬─────┘  └────┬─────┘  └────┬──────────────┘  │
│       │              │              │                 │
│       └──────────────┼──────────────┘                 │
│                      ▼                                │
│         ┌────────────────────────┐                    │
│         │   REST API (Next.js   │                    │
│         │   Route Handlers)      │                    │
│         │   /api/v1/*            │                    │
│         │   OpenAPI/Swagger      │                    │
│         │   JWT + Session Auth   │                    │
│         └────────────┬───────────┘                    │
│                      │                                │
│         ┌────────────┼───────────┐                    │
│         ▼            ▼           ▼                    │
│    ┌─────────┐ ┌──────────┐ ┌────────┐              │
│    │PostgreSQL│ │File Store│ │ E-Mail │              │
│    │ (Prisma) │ │ (Uploads)│ │ (SMTP) │              │
│    └─────────┘ └──────────┘ └────────┘              │
└─────────────────────────────────────────────────────┘
```

### API-Versionierung

Alle Endpunkte unter `/api/v1/`. Bei Breaking Changes wird `/api/v2/` eingeführt, während `/api/v1/` für bestehende Clients weiterläuft. So kann die Website bereits auf v2 migrieren, während die App noch v1 nutzt.

### API-Dokumentation

OpenAPI 3.1 Spezifikation, automatisch generiert aus den Route Handlers via `next-swagger-doc` oder `zod-to-openapi`. Swagger UI unter `/api/docs` erreichbar. Jeder Endpunkt mit Request/Response-Schemas, Fehler-Codes und Beispielen dokumentiert.

---

## 2. Technologie-Stack (aktualisiert)

| Komponente | Technologie | Begründung |
|---|---|---|
| **Frontend** | Next.js 15 (App Router), Mobile-First | SSR für SEO, aber alle Daten über API |
| **API** | Next.js Route Handlers (`/api/v1/*`) | Gleicher Codebase, einfaches Deployment |
| **API-Docs** | OpenAPI 3.1 + Swagger UI | Maschinenlesbare Spec für App-Entwicklung |
| **Auth** | NextAuth.js v5 (Session) + JWT (API) | Session für Web, JWT Bearer Token für Apps |
| **Validierung** | Zod (shared schemas) | Gleiche Validierung für Frontend, API und Docs |
| **Datenbank** | PostgreSQL 16 + Prisma ORM | Relational, typsicher, bewährt |
| **Verschlüsselung** | Node.js `crypto` (AES-256-GCM) | IBAN Application-Level Encryption |
| **E-Mail** | Resend (oder Nodemailer + SMTP) | Transaktionsmails |
| **Kalender** | ical.js | iCal-Feed-Generierung |
| **Rich-Text** | Tiptap | Eingeschränkter Editor für Spartenleiter |
| **Styling** | Tailwind CSS, Mobile-First | Utility-First, responsive by default |
| **Deployment** | Docker + Dockge + Nginx Proxy Manager | Bestehende Infrastruktur |

---

## 3. Mobile-First-Strategie

### Design-Prinzipien

1. **Breakpoints**: Alle Komponenten werden zuerst für 320px–428px (iPhone SE bis iPhone Pro Max) designed. Tablet (768px) und Desktop (1024px+) sind progressive Erweiterungen.
2. **Touch-Targets**: Mindestens 44×44px für alle interaktiven Elemente (Apple HIG).
3. **Navigation**: Hamburger-Menu auf Mobile, horizontale Navigation ab Tablet. Sticky Header mit Logo + CTA ("Mitglied werden").
4. **Formulare**: Single-Column-Layout auf Mobile, volle Breite für Inputs. Große Labels, großzügige Abstände. Native Input-Types (`type="tel"`, `type="email"`, `type="date"`, `inputmode="numeric"` für IBAN).
5. **Kalender**: Auf Mobile default Listenansicht (nicht Monatsraster), mit Option auf Monatsansicht.
6. **Bilder**: Responsive Images via `next/image` mit passenden `sizes`-Attributen. WebP/AVIF-Automatik.
7. **Performance-Budget**: Lighthouse Mobile Score ≥ 90. Critical CSS inline. Lazy Loading für Below-the-Fold-Inhalte.

### Spartenseiten-Layout (Mobile-First)

```
Mobile (< 768px):
┌──────────────────┐
│ Hero (Spartenname │
│ + Icon)           │
├──────────────────┤
│ Beschreibung      │
│ (Accordion)       │
├──────────────────┤
│ Trainingszeiten   │
│ (Cards, stacked)  │
├──────────────────┤
│ Ansprechpartner   │
│ (Cards, stacked)  │
├──────────────────┤
│ News der Sparte   │
└──────────────────┘

Tablet/Desktop (≥ 768px):
┌───────────────────────────────┐
│ Hero (breiterer Banner)       │
├──────────────┬────────────────┤
│ Beschreibung │ Trainingszeiten│
│              │ (Sidebar)      │
├──────────────┴────────────────┤
│ Ansprechpartner (Grid 2-3col) │
├───────────────────────────────┤
│ News (Grid 2col)              │
└───────────────────────────────┘
```

---

## 4. API-Endpunkte (REST, `/api/v1/`)

### Authentifizierung

```
POST   /api/v1/auth/login          → JWT Token (für App) oder Session (für Web)
POST   /api/v1/auth/refresh         → Neuen JWT Token aus Refresh Token
POST   /api/v1/auth/logout          → Session/Token invalidieren
GET    /api/v1/auth/me              → Aktueller User + Rolle
```

### Sparten (öffentlich + geschützt)

```
GET    /api/v1/sparten              → Liste aller aktiven Sparten
GET    /api/v1/sparten/:slug        → Spartenseite mit Inhalten
GET    /api/v1/sparten/:slug/news   → News der Sparte (paginiert)

# Geschützt (Spartenleiter der jeweiligen Sparte oder Admin)
PUT    /api/v1/sparten/:slug        → Sparteninhalte aktualisieren
POST   /api/v1/sparten/:slug/images → Bild hochladen
DELETE /api/v1/sparten/:slug/images/:id → Bild löschen
```

### Termine

```
GET    /api/v1/termine              → Alle Termine (Query: sparte, von, bis)
GET    /api/v1/termine/ical         → iCal-Feed (Query: sparte)
GET    /api/v1/termine/:id          → Einzelner Termin

# Geschützt (Spartenleiter oder Admin)
POST   /api/v1/termine              → Termin anlegen
PUT    /api/v1/termine/:id          → Termin bearbeiten
DELETE /api/v1/termine/:id          → Termin löschen
```

### Mitgliedsanträge

```
# Öffentlich
POST   /api/v1/mitgliedsantraege    → Neuen Antrag einreichen
GET    /api/v1/mitgliedsantraege/sparten → Verfügbare Sparten für Antrag

# Geschützt (nur Admin)
GET    /api/v1/mitgliedsantraege            → Liste (Query: status, sparte, seite)
GET    /api/v1/mitgliedsantraege/:id        → Detailansicht (IBAN entschlüsselt)
PATCH  /api/v1/mitgliedsantraege/:id/status → Status ändern
GET    /api/v1/mitgliedsantraege/export/csv → Vereinsmeister-kompatibler CSV-Export
```

### Vereinsheim-Buchungen

```
# Öffentlich
GET    /api/v1/buchungen/kalender   → Belegte Zeiträume (ohne persönliche Daten)
POST   /api/v1/buchungen            → Buchungsanfrage stellen

# Geschützt (nur Admin)
GET    /api/v1/buchungen            → Alle Anfragen (Query: status)
GET    /api/v1/buchungen/:id        → Detailansicht
PATCH  /api/v1/buchungen/:id/status → Genehmigen/Ablehnen (löst E-Mail aus)
```

### News/Beiträge

```
GET    /api/v1/beitraege            → Alle veröffentlichten Beiträge (paginiert)
GET    /api/v1/beitraege/:slug      → Einzelner Beitrag

# Geschützt
POST   /api/v1/beitraege            → Beitrag erstellen
PUT    /api/v1/beitraege/:id        → Beitrag bearbeiten
DELETE /api/v1/beitraege/:id        → Beitrag löschen
```

### Admin: Nutzerverwaltung

```
GET    /api/v1/admin/nutzer         → Alle Nutzer
POST   /api/v1/admin/nutzer         → Neuen Nutzer anlegen
PUT    /api/v1/admin/nutzer/:id     → Nutzer bearbeiten
DELETE /api/v1/admin/nutzer/:id     → Nutzer deaktivieren
```

### Allgemeine Konventionen

- **Pagination**: `?seite=1&limit=20` → Response enthält `{ data: [...], meta: { seite, limit, gesamt } }`
- **Fehler**: Einheitliches Format `{ error: { code: "VALIDATION_ERROR", message: "...", details: [...] } }`
- **Auth**: `Authorization: Bearer <jwt>` für Apps, Session-Cookie für Web
- **CORS**: Konfigurierbar für App-Domains
- **Rate-Limiting**: 100 req/min für öffentliche Endpunkte, 300 req/min für authentifizierte

---

## 5. Datenschutz & IBAN-Verschlüsselung

### Das Problem

Eine IBAN ist ein personenbezogenes Datum (Art. 4 Nr. 1 DSGVO) und ermöglicht in Kombination mit dem Namen einen direkten Zugriff auf das Bankkonto. Im Falle eines Datenbank-Leaks wären unverschlüsselte IBANs sofort missbrauchbar.

### Lösung: Application-Level Encryption (ALE)

Die IBAN wird **vor dem Speichern** in der Anwendungsschicht verschlüsselt und erst **beim Abrufen** durch einen berechtigten Admin entschlüsselt. Die Datenbank sieht niemals den Klartext.

```
Antragsteller → IBAN eingeben → Validierung (ibantools) 
   → AES-256-GCM verschlüsseln → In DB speichern als:
     {
       iban_encrypted: "base64(iv:ciphertext:authTag)",
       iban_last4: "4567"  ← für Anzeige in Listen
     }
```

### Technische Umsetzung

```typescript
// encryption.ts — Zentrale Ver-/Entschlüsselungslogik
import crypto from 'crypto';

const ENCRYPTION_KEY = Buffer.from(process.env.IBAN_ENCRYPTION_KEY!, 'hex');
// 32 Bytes = 256 Bit, generiert via: crypto.randomBytes(32).toString('hex')

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;  // 128 Bit
const TAG_LENGTH = 16; // 128 Bit Auth-Tag

export function encryptIban(iban: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(iban, 'utf8'),
    cipher.final()
  ]);
  
  const authTag = cipher.getAuthTag();
  
  // Format: base64(iv + ciphertext + authTag)
  const combined = Buffer.concat([iv, encrypted, authTag]);
  return combined.toString('base64');
}

export function decryptIban(encryptedData: string): string {
  const combined = Buffer.from(encryptedData, 'base64');
  
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(combined.length - TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH, combined.length - TAG_LENGTH);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  
  return decipher.update(ciphertext) + decipher.final('utf8');
}

export function extractLast4(iban: string): string {
  return iban.replace(/\s/g, '').slice(-4);
}
```

### Warum AES-256-GCM statt CBC?

- **GCM** bietet authentifizierte Verschlüsselung (AEAD): Der Auth-Tag stellt sicher, dass die verschlüsselten Daten nicht manipuliert wurden. Bei CBC müsste man HMAC separat implementieren.
- **GCM** erkennt Bit-Flipping-Angriffe automatisch.
- Ein **zufälliger IV pro Verschlüsselung** stellt sicher, dass gleiche IBANs unterschiedliche Ciphertexte erzeugen.

### Key-Management

- Der `IBAN_ENCRYPTION_KEY` liegt **ausschließlich** als Environment-Variable im Docker-Container — nicht im Code, nicht in der Datenbank, nicht im Repository.
- **Key Rotation**: Bei Bedarf kann ein neuer Key eingeführt werden. Dann müssen alle bestehenden IBANs einmal entschlüsselt und mit dem neuen Key re-verschlüsselt werden (Migration-Script).
- **Backup des Keys**: Der Key wird separat vom Datenbank-Backup gesichert (z.B. in einem verschlüsselten Passwortmanager des Vorstands). Ohne den Key sind die IBANs in der DB wertlos — das ist der gewünschte Zustand.

### Was wird neben der IBAN noch geschützt?

| Feld | Speicherung | Begründung |
|---|---|---|
| IBAN | AES-256-GCM verschlüsselt | Bankzugangsdaten, höchste Schutzstufe |
| Kontoinhaber | AES-256-GCM verschlüsselt | In Kombination mit IBAN kritisch |
| Kreditinstitut | Klartext | Aus IBAN ableitbar, kein Zusatzrisiko |
| IBAN letzte 4 | Klartext (abgeleiteter Wert) | Für Anzeige in Admin-Listen ("****4567") |
| Signatur-Bilder | AES-256-GCM verschlüsselt (als Blob) | Biometrisches Merkmal |
| Name, Adresse etc. | Klartext | Normale Vereinsmitgliedsdaten, wie bisher auch analog verarbeitet |

### Wann wird entschlüsselt?

Nur in zwei Fällen:

1. **Admin-Detailansicht**: Wenn ein Admin den vollständigen Antrag öffnet, wird die IBAN live entschlüsselt und angezeigt. Sie wird nicht gecacht.
2. **CSV-Export für Vereinsmeister**: Beim Export werden die IBANs on-the-fly entschlüsselt und in die CSV geschrieben. Der Export selbst sollte über HTTPS heruntergeladen und lokal nur so lange wie nötig vorgehalten werden.

In der Admin-Listenansicht werden nur die letzten 4 Ziffern angezeigt — die volle IBAN wird nicht geladen.

---

## 6. Vereinsmeister-Export

### Import-Format

Der GLS Vereinsmeister importiert Mitgliederdaten per **CSV-Datei (Semikolon-getrennt)**. Der Import-Assistent erlaubt die Zuordnung der CSV-Spalten zu den Vereinsmeister-Feldern. Daher müssen wir kein festes Format treffen, sondern eine CSV mit klar benannten Spalten liefern.

### Export-Spalten

```csv
Nachname;Vorname;Strasse;PLZ;Ort;Geburtsdatum;Geschlecht;Telefon;Email;Eintrittsdatum;Sparte;IBAN;Kontoinhaber;Kreditinstitut;Mandatsreferenz;Erziehungsberechtigter
Mustermann;Max;Hauptstr. 1;34305;Niedenstein;15.03.1990;M;05624-12345;max@example.de;01.05.2026;Fußball;DE89370400440532013000;Max Mustermann;Commerzbank;;
```

### Besonderheiten

- **Datumsformat**: DD.MM.YYYY (Vereinsmeister-Konvention)
- **Geschlecht**: M/W/D
- **Sparte**: Name der Sparte wie im Vereinsmeister angelegt — hier muss eine einmalige Zuordnung der Spartennamen zwischen Website und Vereinsmeister erfolgen (Konfigurationstabelle im Admin)
- **Mandatsreferenz**: Wird leer exportiert, da diese vom Vereinsmeister beim SEPA-Einzug generiert wird. Alternativ: Automatische Generierung im Format `SGC-{Jahr}-{laufende Nummer}`, z.B. `SGC-2026-00042`
- **IBAN**: Wird beim Export live entschlüsselt (s. Abschnitt 5)
- **Encoding**: UTF-8 mit BOM (damit Excel/Vereinsmeister die Umlaute korrekt erkennt)

### Export-Workflow im Admin

1. Admin geht auf "Mitgliedsanträge" → "Export"
2. Filter wählbar: Nur neue Anträge seit letztem Export, Sparte, Status
3. Vorschau: Tabelle mit den zu exportierenden Datensätzen (IBAN maskiert)
4. Download der CSV (HTTPS, kein Caching, `Content-Disposition: attachment`)
5. Optional: Anträge automatisch auf Status "EXPORTIERT" setzen, damit beim nächsten Export nur neue erscheinen

### Langfrist-Perspektive: Eigener Vereinsmanager

Der Vereinsmeister-Export ist die Brücke für den Übergang. Langfristig sollen folgende Module direkt im Backend implementiert werden:

1. **Mitgliederverwaltung** (Phase 1 des Vereinsmanagers)
   - Alle Mitgliedsdaten in der eigenen DB
   - Status-Tracking: Aktiv, Ruhend, Ausgetreten, Archiviert
   - Spartenzuordnung (mehrere Sparten pro Mitglied)
   - Familienverbünde
   - Historisierung von Änderungen (Audit-Log)

2. **Beitragsverwaltung** (Phase 2)
   - Beitragsstufen pro Sparte (aus Beitragsordnung)
   - Automatische Sollstellung
   - Altersstaffeln
   - Sonderzahlungen / Aufnahmegebühren

3. **SEPA-Lastschrifteinzug** (Phase 3)
   - SEPA-XML (pain.008) Generierung für Sammel-Lastschriften
   - Upload zur Bank (oder Integration mit FinTS/HBCI)
   - Mandatsverwaltung mit Referenzen
   - Rücklastschrift-Verarbeitung

4. **LSB-Meldung** (Phase 4)
   - Bestandsmeldung an Landessportbund Hessen im DoSB-Format
   - Statistiken nach Alter, Geschlecht, Sparte

Das ist ein eigenständiges Großprojekt, aber die Datenbankstruktur und API werden von Anfang an so angelegt, dass die spätere Erweiterung nahtlos möglich ist.

---

## 7. Datenmodell (aktualisiert)

### Mitgliedsantrag (kein PDF, verschlüsselte Felder)

```prisma
model Mitgliedsantrag {
  id                    String   @id @default(cuid())
  status                AntragStatus @default(EINGEGANGEN)
  
  // Persönliche Daten (Klartext)
  nachname              String
  vorname               String
  strasse               String
  plz                   String
  ort                   String
  telefon               String?
  email                 String
  geburtsdatum          DateTime
  geschlecht            String
  erziehungsberechtigter String?
  
  // Spartenwahl
  eintrittsdatum        DateTime
  sparteId              String
  sparte                Sparte   @relation(fields: [sparteId], references: [id])
  
  // SEPA-Daten (verschlüsselt)
  ibanEncrypted         String   // AES-256-GCM verschlüsselt
  ibanLast4             String   // Letzte 4 Stellen für Listenansicht
  kontoinhaberEncrypted String   // AES-256-GCM verschlüsselt
  kreditinstitut        String   // Klartext (aus IBAN ableitbar)
  
  // Digitale Unterschriften (verschlüsselt)
  signaturMitgliedEncrypted   String?  // Base64-Canvas-Daten, verschlüsselt
  signaturSepaEncrypted       String?  // Base64-Canvas-Daten, verschlüsselt
  signaturErzBerechEncrypted  String?  // Bei Minderjährigen
  
  // Einwilligungen
  satzungAkzeptiert     Boolean
  datenschutzAkzeptiert Boolean
  sepaAkzeptiert        Boolean
  
  // Meta
  ipAdresse             String?  // Für Nachweis der Willenserklärung
  userAgent             String?  // Für Nachweis
  createdAt             DateTime @default(now())
  bearbeitetAm          DateTime?
  bearbeitetVon         String?
  exportiertAm          DateTime?  // Wann zuletzt für Vereinsmeister exportiert
}

enum AntragStatus {
  EINGEGANGEN
  IN_BEARBEITUNG
  ABGESCHLOSSEN
  EXPORTIERT
  ABGELEHNT
}
```

### Mitglied (für langfristigen Vereinsmanager, angelegt aber noch nicht aktiv)

```prisma
model Mitglied {
  id                    String   @id @default(cuid())
  mitgliedsnummer       String   @unique
  status                MitgliedStatus @default(AKTIV)
  
  // Stammdaten
  nachname              String
  vorname               String
  strasse               String
  plz                   String
  ort                   String
  telefon               String?
  email                 String?
  geburtsdatum          DateTime
  geschlecht            String
  
  // SEPA (verschlüsselt, wie bei Antrag)
  ibanEncrypted         String?
  ibanLast4             String?
  kontoinhaberEncrypted String?
  kreditinstitut        String?
  mandatsreferenz       String?  @unique
  mandatsDatum          DateTime?
  
  // Verein
  eintrittsdatum        DateTime
  austrittsdatum        DateTime?
  sparten               MitgliedSparte[]
  
  // Familie
  familienverbundId     String?
  istHauptzahler        Boolean  @default(false)
  
  // Herkunft
  ausAntragId           String?  // Link zum Original-Antrag
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

enum MitgliedStatus {
  AKTIV
  RUHEND
  AUSGETRETEN
  ARCHIVIERT
}
```

Die `Mitglied`-Tabelle wird in Phase 1 **bereits angelegt**, aber erst im Vereinsmanager-Ausbau produktiv befüllt. Wenn ein Antrag den Status `ABGESCHLOSSEN` erreicht, kann optional bereits ein `Mitglied`-Datensatz daraus erzeugt werden — als Vorbereitung.

---

## 8. Auth-Konzept (Dual: Session + JWT)

### Für das Web-Frontend (Next.js)

NextAuth.js v5 mit Session-basierter Auth. Der Session-Cookie ist `httpOnly`, `secure`, `sameSite=lax`. Kein JWT im Browser-Storage.

### Für die App (iOS/Android)

JWT-basierter Flow:

```
1. App → POST /api/v1/auth/login { email, password }
2. Server → { accessToken (15min), refreshToken (30d) }
3. App speichert refreshToken im Secure Storage (Keychain/Keystore)
4. App sendet: Authorization: Bearer <accessToken>
5. Bei 401 → POST /api/v1/auth/refresh { refreshToken }
6. Server → neuer accessToken
```

### Middleware

```typescript
// Prüft ob Request von Web (Session) oder App (JWT) kommt
export async function authenticateRequest(req: NextRequest) {
  // 1. Prüfe Session-Cookie (NextAuth)
  const session = await getServerSession(authOptions);
  if (session) return { user: session.user, source: 'web' };
  
  // 2. Prüfe Bearer Token (App)
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = verifyJwt(token);
    if (payload) return { user: payload, source: 'app' };
  }
  
  return null; // Nicht authentifiziert
}
```

---

## 9. Umsetzungsplan (Phasen, aktualisiert)

### Phase 1 — API-Fundament + Basis-UI (Wochen 1–4)

**Ziel:** Lauffähige App mit Auth, API-Grundgerüst, dokumentierte Endpunkte

- Next.js-Projekt: App Router, TypeScript, Tailwind (Mobile-First-Config)
- PostgreSQL + Prisma: Vollständiges Schema (inkl. vorbereitete Mitglied-Tabelle)
- Docker-Setup (docker-compose.yml)
- Auth: NextAuth.js v5 (Session) + JWT-Endpunkte für App
- API-Grundgerüst: `/api/v1/` Routing, Error-Handling-Middleware, Zod-Validierung
- OpenAPI-Spec: Automatische Generierung, Swagger UI unter `/api/docs`
- Basis-Layout: Mobile-First Header/Navigation/Footer
- Statische Seiten: Startseite, Impressum, Datenschutz
- Seed-Script: Sparten + Testdaten
- Verschlüsselungs-Modul: `encryptIban()`, `decryptIban()` mit Tests

### Phase 2 — Digitaler Mitgliedsantrag (Wochen 5–8)

**Priorisierung auf Platz 1, weil hier der größte Pain liegt.**

- Multi-Step-Formular (Mobile-First): Persönliche Daten → Sparte → SEPA → Einwilligungen → Signatur → Zusammenfassung
- IBAN-Validierung (ibantools) + automatischer BIC/Bank-Lookup
- Canvas-Signatur (touch-optimiert für Mobile, `react-signature-canvas`)
- API-Endpunkt: POST mit Verschlüsselung der IBAN/Kontoinhaber/Signaturen
- E-Mail-Benachrichtigungen (Antragsteller + Geschäftsstelle)
- Admin-Dashboard: Antragsliste (IBAN maskiert), Detailansicht (IBAN entschlüsselt), Status-Workflow
- Vereinsmeister CSV-Export mit Sparten-Mapping-Konfiguration
- Rate-Limiting + Honeypot als Bot-Schutz

### Phase 3 — Sparten-CMS + News (Wochen 9–11)

- API-Endpunkte für Sparten-CRUD
- Spartenleiter-Dashboard (Mobile-tauglich)
- Tiptap-Editor mit eingeschränkter Toolbar
- Strukturierte Editoren: Trainingszeiten, Ansprechpartner
- Bild-Upload mit Optimierung
- Öffentliche Spartenseiten (Mobile-First Template)
- News-Modul mit Spartenfilter
- Admin: Sparten-/Nutzerverwaltung

### Phase 4 — Terminkalender (Wochen 12–13)

- API-Endpunkte für Termine
- Kalender-UI: Listenansicht (Mobile Default), Monatsansicht (Desktop Default)
- Spartenfilter (farbcodiert, Mehrfachauswahl)
- iCal-Feed-Endpunkt mit Filterung
- Abo-Buttons mit Deep-Links (`webcal://`)
- CRUD für Spartenleiter + Admin

### Phase 5 — Vereinsheim-Buchung (Wochen 14–15)

- API-Endpunkte für Buchungen
- Belegungskalender (öffentlich, Mobile-First)
- Anfrage-Formular
- Admin-Genehmigungs-Workflow mit E-Mail-Templates
- Bestätigungs-Mail mit Zahlungsinfos (50€/Tag, Bankverbindung)

### Phase 6 — Feinschliff, Migration, API-Härtung (Wochen 16–18)

- OpenAPI-Spec finalisieren + alle Endpunkte testen
- CORS-Konfiguration für spätere App-Domains
- Rate-Limiting fine-tuning
- SEO: Meta-Tags, Open Graph, JSON-LD
- 301-Redirect-Map (alle alten WordPress-URLs)
- Content-Migration aus bestehender Website
- Lighthouse Mobile Audit (Ziel: ≥ 90)
- Testlauf mit Spartenleitern
- DNS-Umstellung

---

## 10. Aufwandsschätzung (aktualisiert)

| Phase | Umfang | Geschätzter Aufwand |
|---|---|---|
| Phase 1: API-Fundament + Basis-UI | Setup, Auth (dual), API-Gerüst, OpenAPI, Verschlüsselung | ~55 Stunden |
| Phase 2: Digitaler Mitgliedsantrag | Formular, IBAN-Verschlüsselung, Signatur, Export, Workflow | ~60 Stunden |
| Phase 3: Sparten-CMS + News | Editor, Dashboard, Templates, Bilder | ~50 Stunden |
| Phase 4: Terminkalender | UI, iCal, CRUD, Filter | ~30 Stunden |
| Phase 5: Vereinsheim-Buchung | Kalender, Anfrage, Workflow | ~25 Stunden |
| Phase 6: Feinschliff + Migration | SEO, Redirects, Tests, API-Härtung | ~40 Stunden |
| **Gesamt** | | **~260 Stunden** |

Mehraufwand gegenüber v1 (~230h) durch: API-Dokumentation, Dual-Auth, Verschlüsselungsschicht, Mobile-First-Testing.

---

## 11. DSGVO-Anforderungen (ergänzt)

### Technische Maßnahmen (Art. 32 DSGVO)

- **Verschlüsselung bei Übertragung**: HTTPS (TLS 1.3) durchgehend
- **Verschlüsselung bei Speicherung**: IBAN, Kontoinhaber und Signaturen via AES-256-GCM
- **Zugriffskontrolle**: Rollenbasiert (Admin, Spartenleiter), verschlüsselte Felder nur für Admins entschlüsselbar
- **Pseudonymisierung**: IBAN-Last4 in Listenansichten statt voller IBAN
- **Protokollierung**: Wer hat wann welchen Antrag eingesehen (Audit-Log)
- **Datensparsamkeit**: IP-Adresse und User-Agent nur für Nachweiszwecke (Willenserklärung), Löschung nach 2 Jahren

### Löschkonzept

| Datentyp | Aufbewahrungsfrist | Löschung |
|---|---|---|
| Abgeschlossene Anträge | 2 Jahre nach Abschluss | Automatisch (Cron-Job) |
| Abgelehnte Anträge | 6 Monate | Automatisch |
| Buchungsanfragen (abgelehnt) | 6 Monate | Automatisch |
| Buchungsanfragen (bestätigt) | 2 Jahre | Automatisch |
| Audit-Log-Einträge | 3 Jahre | Automatisch |

### Art. 13-Informationspflichten

Die bestehenden DSGVO-Infos aus dem PDF-Antrag (Seite 2) müssen für den Online-Antrag aktualisiert werden:

- Ergänzung: Verarbeitung erfolgt digital, verschlüsselte Speicherung der Bankdaten
- Ergänzung: Datenübermittlung an Vereinsmeister-Software zur Beitragsabrechnung
- Verantwortlicher: 1. Vorsitzender Christoph Eubel
- DSB: Frank Kirchner
- Rechtsgrundlage: Art. 6 Abs. 1 b) DSGVO (Beitrittsvertrag)

---

## 12. Nächste Schritte

1. **Abstimmung Vorstand**: Plan vorstellen, Priorisierung bestätigen
2. **Vereinsmeister-Sparten-Mapping**: Liste der Spartennamen im Vereinsmeister abgleichen
3. **Design-Entscheidung**: Modernisiertes Design oder nahe am bestehenden Look? Logo-Dateien in hoher Auflösung besorgen.
4. **E-Mail-Provider**: Resend-Account anlegen (Free Tier: 3.000 Mails/Monat — sollte reichen)
5. **Encryption Key generieren**: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` — sicher verwahren
6. **Phase 1 starten**: Projekt-Scaffolding, Schema, Docker, erste API-Endpunkte
