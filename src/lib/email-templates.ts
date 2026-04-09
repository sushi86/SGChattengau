interface AntragEmailData {
  vorname: string
  nachname: string
  email: string
  sparteName: string
  eintrittsdatum: string
}

interface EmailContent {
  subject: string
  html: string
  text: string
}

export function renderAntragBestaetigung(data: AntragEmailData): EmailContent {
  const name = `${data.vorname} ${data.nachname}`

  return {
    subject: 'Dein Mitgliedsantrag bei der SG 1898 Chattengau e.V.',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Mitgliedsantrag eingegangen</h2>
        <p>Hallo ${data.vorname},</p>
        <p>vielen Dank für deinen Mitgliedsantrag bei der SG 1898 Chattengau e.V.!</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Name</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">E-Mail</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.email}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Sparte</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.sparteName}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Eintrittsdatum</td><td style="padding: 8px;">${data.eintrittsdatum}</td></tr>
        </table>
        <p>Dein Antrag wird nun bearbeitet. Du erhältst eine weitere Benachrichtigung, sobald er bestätigt wurde.</p>
        <p style="color: #666; font-size: 14px; margin-top: 24px;">
          SG 1898 Chattengau e.V. — Wir bewegen Niedenstein!
        </p>
      </div>
    `,
    text: `Mitgliedsantrag eingegangen\n\nHallo ${data.vorname},\n\nvielen Dank für deinen Mitgliedsantrag bei der SG 1898 Chattengau e.V.!\n\nName: ${name}\nE-Mail: ${data.email}\nSparte: ${data.sparteName}\nEintrittsdatum: ${data.eintrittsdatum}\n\nDein Antrag wird nun bearbeitet.\n\nSG 1898 Chattengau e.V.`,
  }
}

export function renderAntragBenachrichtigung(data: AntragEmailData): EmailContent {
  const name = `${data.vorname} ${data.nachname}`

  return {
    subject: `Neuer Mitgliedsantrag: ${name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Neuer Mitgliedsantrag</h2>
        <p>Ein neuer Mitgliedsantrag wurde eingereicht:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Name</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">E-Mail</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.email}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Sparte</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.sparteName}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Eintrittsdatum</td><td style="padding: 8px;">${data.eintrittsdatum}</td></tr>
        </table>
        <p><a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/antraege" style="color: #2ea3f2;">Im Admin-Dashboard ansehen →</a></p>
      </div>
    `,
    text: `Neuer Mitgliedsantrag: ${name}\n\nE-Mail: ${data.email}\nSparte: ${data.sparteName}\nEintrittsdatum: ${data.eintrittsdatum}`,
  }
}

interface BuchungEmailData {
  name: string
  email: string
  datum: string
  startzeit: string
  endzeit: string
  anlass: string
}

export function renderBuchungBestaetigung(data: BuchungEmailData): EmailContent {
  return {
    subject: `Buchungsanfrage eingegangen – ${data.anlass}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Buchungsanfrage eingegangen</h2>
        <p>Hallo ${data.name},</p>
        <p>vielen Dank für deine Buchungsanfrage. Wir werden sie so schnell wie möglich prüfen und uns bei dir melden.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Name</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.name}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Anlass</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.anlass}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Datum</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.datum}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Uhrzeit</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.startzeit} – ${data.endzeit} Uhr</td></tr>
          <tr><td style="padding: 8px; color: #666;">E-Mail</td><td style="padding: 8px;">${data.email}</td></tr>
        </table>
        <p style="color: #666; font-size: 14px; margin-top: 24px;">
          SG 1898 Chattengau e.V. — Wir bewegen Niedenstein!
        </p>
      </div>
    `,
    text: `Buchungsanfrage eingegangen\n\nHallo ${data.name},\n\nvielen Dank für deine Buchungsanfrage.\n\nAnlass: ${data.anlass}\nDatum: ${data.datum}\nUhrzeit: ${data.startzeit} – ${data.endzeit} Uhr\n\nSG 1898 Chattengau e.V.`,
  }
}

export function renderBuchungGenehmigt(data: BuchungEmailData): EmailContent {
  return {
    subject: `Deine Buchungsanfrage wurde genehmigt – ${data.anlass}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Buchung genehmigt</h2>
        <p>Hallo ${data.name},</p>
        <p>wir freuen uns, dir mitteilen zu können, dass deine Buchungsanfrage genehmigt wurde!</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Name</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.name}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Anlass</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.anlass}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Datum</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.datum}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Uhrzeit</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.startzeit} – ${data.endzeit} Uhr</td></tr>
        </table>
        <h3 style="color: #333;">Zahlungsinformationen</h3>
        <p>Die Nutzungsgebühr beträgt <strong>50 € pro Stunde</strong>. Bitte überweise den Gesamtbetrag bis spätestens eine Woche vor dem Veranstaltungsdatum.</p>
        <p style="color: #666; font-size: 14px; margin-top: 24px;">
          SG 1898 Chattengau e.V. — Wir bewegen Niedenstein!
        </p>
      </div>
    `,
    text: `Buchung genehmigt\n\nHallo ${data.name},\n\ndeine Buchungsanfrage wurde genehmigt.\n\nAnlass: ${data.anlass}\nDatum: ${data.datum}\nUhrzeit: ${data.startzeit} – ${data.endzeit} Uhr\n\nZahlungsinformationen: Die Nutzungsgebühr beträgt 50 € pro Stunde.\n\nSG 1898 Chattengau e.V.`,
  }
}

export function renderBuchungAbgelehnt(data: BuchungEmailData & { grund?: string }): EmailContent {
  return {
    subject: `Deine Buchungsanfrage wurde abgelehnt – ${data.anlass}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Buchungsanfrage abgelehnt</h2>
        <p>Hallo ${data.name},</p>
        <p>leider müssen wir dir mitteilen, dass deine Buchungsanfrage abgelehnt wurde.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Anlass</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.anlass}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Datum</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.datum}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Uhrzeit</td><td style="padding: 8px;">${data.startzeit} – ${data.endzeit} Uhr</td></tr>
        </table>
        ${data.grund ? `<p><strong>Begründung:</strong> ${data.grund}</p>` : ''}
        <p>Bei Fragen stehen wir dir gerne zur Verfügung.</p>
        <p style="color: #666; font-size: 14px; margin-top: 24px;">
          SG 1898 Chattengau e.V. — Wir bewegen Niedenstein!
        </p>
      </div>
    `,
    text: `Buchungsanfrage abgelehnt\n\nHallo ${data.name},\n\nleider wurde deine Buchungsanfrage abgelehnt.\n\nAnlass: ${data.anlass}\nDatum: ${data.datum}\nUhrzeit: ${data.startzeit} – ${data.endzeit} Uhr${data.grund ? `\n\nBegründung: ${data.grund}` : ''}\n\nSG 1898 Chattengau e.V.`,
  }
}
