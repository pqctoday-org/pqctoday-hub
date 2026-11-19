// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { useEmbeddedLearn } from '../../../embeddedLearnContext'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'

export interface WorkshopConfig {
  step: number
}

interface DataAssetExercisesProps {
  onNavigateToWorkshop: () => void
  onSetWorkshopConfig?: (config: WorkshopConfig) => void
}

interface Scenario {
  id: string
  title: string
  description: string
  badge: string
  badgeColor: string
  observe: string
  evidenceCheck: string
  config: WorkshopConfig
}

export const DataAssetExercises: React.FC<DataAssetExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()
  const embeddedLearn = useEmbeddedLearn()

  const scenarios: Scenario[] = [
    {
      id: 'healthcare-hndl',
      title: '1. Healthcare HNDL Classification Challenge',
      description:
        'A regional hospital system stores electronic health records (ePHI) under HIPAA. HIPAA’s 6-year rule covers required compliance documentation, not patient records; state law and other requirements set medical-record retention. For this sample, assume a 30-year retention period set by the hospital’s own legal and business requirements. Using the Asset Inventory Builder, create an asset entry for this ePHI database: Asset Type = Data Store, Sensitivity = High, Retention = 25+ years, Confidentiality Period = 25+ years for this sample, Industry = Healthcare. Then check the HNDL Risk Year column.',
      badge: 'HNDL',
      badgeColor: 'bg-status-error/20 text-status-error border-status-error/50',
      observe:
        'Compare the selected hypothetical CRQC year with the sample confidentiality period to inspect the calculated HNDL planning threshold. This does not establish when records were collected or that an adversary captured them. In Step 4, inspect the score, urgency band and drivers produced by the current weights and selected framework flags. These are illustrative prioritization results, not a guaranteed Critical result or a compliance finding.',
      evidenceCheck:
        'Distinguish the business service (the EHR archiving and retrieval service) from the protected data asset (long-lived patient records). In production, verify the retention schedule with Legal and inspect actual transport/storage encryption configuration rather than relying on a policy label.',
      config: { step: 0 },
    },
    {
      id: 'multi-jurisdiction-finance',
      title: '2. Multi-Jurisdiction Financial Institution',
      description:
        'Your bank rotates its ECDSA P-256 TLS certificates every 90 days. Add two sample Communication assets in Step 1 for the data carried over TLS. Keep the same sensitivity and retention, then choose Under 1 year of confidentiality for a short-lived status message and 10–25 years for confidential transaction history. Compare the HNDL thresholds and verify the key agreement used by the connection independently of the certificate.',
      badge: 'Compliance',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'ECDSA authenticates the server in this example. The connection key agreement protects the confidentiality of the data. A copied ciphertext may still matter long after the certificate rotates or internal records are deleted. Record only confirmed applicable obligations. DORA Article 35 periodic penalty payments concern designated critical ICT third-party providers in the circumstances specified in that article.',
      evidenceCheck:
        'In production, capture live TLS handshakes to confirm the negotiated key-agreement group (for example X25519MLKEM768) independently of certificate rotation, and confirm whether DORA/NIS2 risk-management duties or EU PQC Roadmap v1.1 milestones apply to the entity.',
      config: { step: 0 },
    },
    {
      id: 'root-ca-methodology',
      title: '3. Root CA Migration — Signing Trust',
      description:
        'In Step 4, find the sample Root CA Signing Key and expand its scoring breakdown. The key signs certificates and the signing trust lasts for years. Inspect its retention and HNDL contributions, then open the Priority Map and record the replacement signature profile for the sample national security system.',
      badge: 'Methodology',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'For the sample national security system, CNSA 2.0 specifies ML-DSA-87 (FIPS 204) for signing certificates. Check the applicable certificate-signing profile in the cited NSA guidance. Its CNSA 2.0 FAQ (version 2.2) sets three dates for national security systems: new acquisitions from 1 January 2027, equipment that cannot support CNSA 2.0 phased out by 31 December 2030 (exceptions possible), and CNSA 2.0 algorithms mandated by 31 December 2031 unless otherwise noted. The absence of a confidentiality threshold for a signing-only key leaves migration relevant because old verifiers may still trust forgeable signatures.',
      evidenceCheck:
        'Confirm system scope first (CNSA 2.0 binds NSS; federal civilian HVAs/high-impact systems follow EO 14412 & OMB M-26-15). For HSM-backed CAs, check active CMVP FIPS 140-3 module certificates and Security Policies rather than vendor marketing sheets or ACVP-only algorithm listings.',
      config: { step: 3 },
    },
    {
      id: 'build-priority-map',
      title: '4. Build Your Own Priority Map',
      description:
        "Add at least 6 assets to the Asset Inventory Builder covering all four sensitivity tiers (Low, Medium, High, Critical) and at least three different asset types. Record confirmed applicable obligations for each asset in its inventory entry. Run through the Sensitivity Scoring Engine and adjust the weights to reflect your organization's priorities (e.g., increase the compliance weight if you are heavily regulated). Then review the Priority Map. Identify: (1) the single highest-urgency asset and why, (2) any assets that can safely wait, and (3) which compliance deadline is most constraining for your portfolio.",
      badge: 'Workshop',
      badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
      observe:
        'Compare the assets’ displayed scores, urgency bands and contributing factors under your selected weights and framework flags. Changing those assumptions can change the order; an illustrative Low result does not establish that migration can safely wait. Check the applicable system scope and dated source guidance before using a framework or date to prioritise work. An industry label or an illustrative score does not establish which requirements apply or that they have been met. Export your Priority Map as Markdown to discuss its assumptions with your security team.',
      evidenceCheck:
        'Use the exported Markdown only as an educational planning template. In production, back each priority rank with a verified cryptographic inventory (CBOM), legal applicability sign-off, and documented CRQC/confidentiality-period assumptions.',
      config: { step: 0 },
    },
  ]

  const handleLoadAndRun = (scenario: Scenario) => {
    onSetWorkshopConfig?.(scenario.config)
    onNavigateToWorkshop()
  }

  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Guided Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Work through these real-world scenarios to apply data classification, compliance mapping,
          risk methodology comparison, and sensitivity scoring. Each exercise pre-configures the
          Workshop to the relevant step — click &quot;Load &amp; Run&quot; to begin.
        </p>
      </div>

      <div className="space-y-4">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="glass-panel p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-foreground">{scenario.title}</h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold ${scenario.badgeColor}`}
                  >
                    {scenario.badge}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 mb-3">{scenario.description}</p>
                <div className="bg-muted/40 rounded-lg p-3 border border-border space-y-1.5">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">What to observe:</strong> {scenario.observe}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">GRC decision &amp; evidence check:</strong>{' '}
                    {scenario.evidenceCheck}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => handleLoadAndRun(scenario)}
                className="btn btn-primary flex items-center gap-2 px-4 py-2 shrink-0 self-start"
              >
                <Play size={14} fill="currentColor" /> Load &amp; Run
              </Button>
            </div>
          </div>
        ))}
      </div>

      {!embeddedLearn && (
        <div className="glass-panel p-6 border-primary/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BookOpen size={24} className="text-primary shrink-0" />
              <div>
                <h3 className="font-bold text-foreground">Test Your Knowledge</h3>
                <p className="text-sm text-muted-foreground">
                  Take the PQC quiz to check your understanding of data classification, compliance
                  frameworks, and risk management methodologies.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate('/learn/quiz')}
              className="btn btn-secondary flex items-center gap-2 px-4 py-2 shrink-0"
            >
              Take Quiz <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
