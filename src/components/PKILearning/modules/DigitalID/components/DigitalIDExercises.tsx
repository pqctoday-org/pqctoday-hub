// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'

interface DigitalIDExercisesProps {
  onNavigateToWorkshop: () => void
  onNavigateToStep?: (stepIndex: number) => void
}

interface Scenario {
  id: string
  title: string
  description: string
  badge: string
  badgeColor: string
  observe: string
  stepIndex: number
}

const SCENARIOS: Scenario[] = [
  {
    id: 'wallet-key-audit',
    title: '1. Wallet Cryptographic Key Audit',
    description:
      'Open the EUDI Wallet (Step 1) and examine the key store. How many keys does María hold? Identify the key algorithm and purpose for each key slot. Consider: which keys are used for credential binding vs. device authentication, and what PQC replacements exist for each.',
    badge: 'Key Management',
    badgeColor: 'bg-primary/20 text-primary border-primary/50',
    observe:
      'The wallet uses ECDSA P-256 for credential binding — the same key is used to sign presentation proofs sent to relying parties. Under a CRQC threat, harvested presentations could be used to forge proofs. ML-DSA-65 (FIPS 204) is the parameter set this module standardises on for wallet device keys: BSI TR-02102-1 recommends ML-DSA/SLH-DSA at NIST security categories 3 and 5, and ML-DSA-44 (category 2) sits below that floor. No EUDI specification mandates a parameter set yet.',
    stepIndex: 0,
  },
  {
    id: 'pid-issuance-flow',
    title: '2. PID Issuance and Trust Chain',
    description:
      'Use the PID Issuer (Step 2) to issue a Person Identification Data credential. After issuance, answer: What format is the PID (mso_mdoc or SD-JWT VC)? Who signed it? Where is the issuer certificate anchored? What is the PQC migration deadline for national PID issuers per the EUDI ARF roadmap?',
    badge: 'PID Issuance',
    badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
    observe:
      'The PID is issued in mso_mdoc format (ISO 18013-5), signed by the national PID Issuer using ECDSA P-256. The issuer certificate is anchored to the national Trusted List. The EU Coordinated Implementation Roadmap for PQC recommends national PQC roadmaps by 2026 and migration of high-risk use cases such as identity by 2030 — a policy recommendation rather than a binding EUDI ARF mandate.',
    stepIndex: 1,
  },
  {
    id: 'selective-disclosure-privacy',
    title: '3. Selective Disclosure at the Bank',
    description:
      "Navigate to the Bank (Relying Party, Step 4). The bank asks for your name, your degree, and age_over_18 — note it does NOT ask for birth_date. At the disclosure step you choose what to share. First run it as offered and read the log: which PID element's digest is verified, and which one never leaves the wallet? Then run it again and untick age_over_18 — what does the bank do, and is the proof itself still valid? Finally: what's the risk if the presentation proof's signature algorithm is broken by a CRQC?",
    badge: 'Privacy by Design',
    badgeColor: 'bg-warning/20 text-warning border-warning/50',
    observe:
      'age_over_18 is disclosed and its digest is checked against the issuer-signed Mobile Security Object, while birth_date is absent from the payload entirely — not hidden from view, never transmitted. That is ISO 18013-5 selective disclosure: the issuer signs the digests, so withholding an element costs nothing cryptographically, and the bank learns you are eligible without learning when you were born. GDPR Article 5(1)(c) enforced by construction rather than by policy. Untick age_over_18 and the bank refuses — the proof stays cryptographically valid, it simply no longer answers the question asked, which is the honest cost of withholding. The key binding proof is still ECDSA, though: a CRQC could forge it and impersonate you. ML-DSA-65 would fix that.',
    stepIndex: 3,
  },
  {
    id: 'qes-qtsp-selection',
    title: '4. QTSP Selection for QES Signing',
    description:
      "Use the QTSP provider (Step 5) to sign a document with a Qualified Electronic Signature. Note which algorithms the QTSP uses for signature creation. Then evaluate: why does QES require SCAL2 (Sole Control Assurance Level 2), and what makes a QTSP 'qualified' under eIDAS 2.0? Which ETSI standard governs QTSP requirements?",
    badge: 'QES / QTSP',
    badgeColor: 'bg-destructive/20 text-destructive border-destructive/50',
    observe:
      "QES requires SCAL2 because the signing key must be under the sole control of the signatory — the QTSP must ensure no third party (including the QTSP itself) can sign on the user's behalf without their active authorisation. QTSPs that issue qualified certificates follow ETSI EN 319 411, while remote QES signing with SCAL2 is governed by the CEN EN 419 241 series (with the QSCD covered by CEN EN 419 221-5 — the EN 419 xxx series is CEN/TC 224, not ETSI); QTSPs are listed on National Trusted Lists. The CSC API v2 (Cloud Signature Consortium) standardises the remote signing protocol.",
    stepIndex: 4,
  },
  {
    id: 'pqc-migration-roadmap',
    title: '5. EUDI Wallet PQC Migration Timeline',
    description:
      "Review the full wallet workflow (all 5 steps). Then map the three-phase EU PQC migration roadmap for digital identity systems: December 2026 (national roadmaps), December 2030 (high-risk migration), December 2035 (full PQC transition). For each of the five workshop actors (Wallet, PID Issuer, University, Bank, QTSP), identify which phase applies and which algorithm they'd migrate first.",
    badge: 'PQC Roadmap',
    badgeColor: 'bg-success/20 text-success border-success/50',
    observe:
      'PID Issuers and QTSPs are high-risk entities per ENISA guidance — they should target Phase 2 (2030) or earlier. The wallet device key (used in all presentation proofs) is the single highest-priority migration item: once it becomes quantum-safe, every relying party interaction benefits. University attestation issuers and banks are lower priority but must accept PQC wallet proofs once migration begins.',
    stepIndex: 0,
  },
]

export const DigitalIDExercises: React.FC<DigitalIDExercisesProps> = ({
  onNavigateToWorkshop,
  onNavigateToStep,
}) => {
  const navigate = useNavigate()

  const handleLoadAndRun = (scenario: Scenario) => {
    onNavigateToStep?.(scenario.stepIndex)
    onNavigateToWorkshop()
  }

  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Guided Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Work through these scenarios to master the EUDI Wallet ecosystem: audit wallet keys, trace
          PID issuance trust chains, explore selective disclosure privacy, evaluate QTSP
          requirements, and map the EU PQC migration roadmap. Each exercise navigates directly to
          the relevant workshop step &mdash; click &quot;Load &amp; Run&quot; to begin.
        </p>
      </div>

      <div className="space-y-4">
        {SCENARIOS.map((scenario) => (
          <div key={scenario.id} className="glass-panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-foreground">{scenario.title}</h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold ${scenario.badgeColor}`}
                  >
                    {scenario.badge}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 mb-2">{scenario.description}</p>
                <p className="text-xs text-muted-foreground">
                  <strong>What to observe:</strong> {scenario.observe}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => handleLoadAndRun(scenario)}
                className="btn btn-primary flex items-center gap-2 px-4 py-2 shrink-0"
              >
                <Play size={14} fill="currentColor" aria-hidden="true" /> Load &amp; Run
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Quiz Link */}
      <div className="glass-panel p-6 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-primary" aria-hidden="true" />
            <div>
              <h3 className="font-bold text-foreground">Test Your Knowledge</h3>
              <p className="text-sm text-muted-foreground">
                Take the PQC quiz to check what you&apos;ve learned about digital identity and eIDAS
                2.0.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/learn/quiz')}
            className="btn btn-secondary flex items-center gap-2 px-4 py-2"
          >
            Take Quiz <ArrowRight size={14} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}
