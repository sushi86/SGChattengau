import type { Metadata } from 'next'
import { Container } from '@/components/layout/container'

export const metadata: Metadata = { title: 'Datenschutzerklärung' }

export default function DatenschutzPage() {
  return (
    <section className="py-12">
      <Container className="max-w-2xl">
        <h1 className="font-heading text-h1 text-text-heading mb-8">Datenschutzerklärung</h1>
        <div className="space-y-8 text-text-body">
          <div>
            <h2 className="font-heading text-h3 text-text-heading mb-2">1. Verantwortlicher</h2>
            <p>SG 1898 Chattengau e.V.<br />1. Vorsitzender: Christoph Eubel<br />Niedenstein</p>
          </div>
          <div>
            <h2 className="font-heading text-h3 text-text-heading mb-2">2. Datenschutzbeauftragter</h2>
            <p>Frank Kirchner</p>
          </div>
          <div>
            <h2 className="font-heading text-h3 text-text-heading mb-2">3. Erhebung und Verarbeitung personenbezogener Daten</h2>
            <p>Wir verarbeiten personenbezogene Daten nur, soweit dies zur Bereitstellung unserer Website und unserer Leistungen erforderlich ist.</p>
          </div>
          <div>
            <h2 className="font-heading text-h3 text-text-heading mb-2">4. Digitaler Mitgliedsantrag</h2>
            <p>Bei der Nutzung unseres digitalen Mitgliedsantrags werden folgende Daten erhoben: Name, Adresse, Geburtsdatum, Kontaktdaten, Bankverbindung (IBAN) und digitale Unterschrift.</p>
            <p className="mt-2"><strong>Bankdaten (IBAN, Kontoinhaber)</strong> werden verschlüsselt gespeichert (AES-256-GCM) und sind nur für berechtigte Administratoren einsehbar.</p>
            <p className="mt-2">Rechtsgrundlage: Art. 6 Abs. 1 lit. b) DSGVO (Erfüllung des Beitrittsvertrags).</p>
          </div>
          <div>
            <h2 className="font-heading text-h3 text-text-heading mb-2">5. Ihre Rechte</h2>
            <p>Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO), Löschung (Art. 17 DSGVO), Einschränkung der Verarbeitung (Art. 18 DSGVO), Datenübertragbarkeit (Art. 20 DSGVO) und Widerspruch (Art. 21 DSGVO).</p>
          </div>
          <div>
            <h2 className="font-heading text-h3 text-text-heading mb-2">6. Löschfristen</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Abgeschlossene Mitgliedsanträge: 2 Jahre nach Abschluss</li>
              <li>Abgelehnte Anträge: 6 Monate</li>
              <li>Buchungsanfragen (abgelehnt): 6 Monate</li>
              <li>Buchungsanfragen (bestätigt): 2 Jahre</li>
            </ul>
          </div>
        </div>
      </Container>
    </section>
  )
}
