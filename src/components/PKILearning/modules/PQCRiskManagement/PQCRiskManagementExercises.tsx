// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PQCRiskManagementExercisesProps {
  onNavigateToWorkshop: (step?: number) => void
}

const EXERCISES = [
  {
    id: 'fin-hndl',
    title: 'Scenario: Financial Services HNDL',
    prompt:
      'Assume your bank records TLS sessions that carry wire-transfer records. Assume the legacy connection uses TLS 1.2 RSA key transport (TLS 1.3 does not use RSA key transport; see RFC 8446). Some captured data remains confidential for up to 7 years. Model a CRQC arrival in 2034 as a scenario, not a forecast. Identify which captured sessions could remain sensitive until then, state the assumptions, and recommend a key-establishment migration timeline. Do not treat database-at-rest encryption or all wire records as automatically exposed.',
    workshopStep: 0,
    workshopStepLabel: 'Step 1 — CRQC Scenario Planner',
    decisionRubric: [
      'Separate the business service (wire-transfer portal/gateway) from the protected asset (recorded wire-transfer records with a 7-year confidentiality horizon).',
      'Confirm that HNDL applies only where ciphertext is captured and protected by quantum-vulnerable public-key key establishment (TLS 1.2 RSA key transport), not automatically to AES database-at-rest encryption.',
      'Document 2034 as an editable planning scenario rather than a forecast, and explain why migrating to TLS 1.3 with an RFC 10024 hybrid group (e.g., X25519MLKEM768) must precede the 7-year secrecy overlap.',
      'Identify the production-tool check needed next: inspect actual TLS versions, cipher suites, and key-exchange groups on live endpoints rather than relying on sample assumptions.',
    ],
  },
  {
    id: 'healthcare-signing',
    title: 'Scenario: Healthcare Data at Risk',
    prompt:
      'A hospital system uses ECDSA P-256 for signing electronic health records that must remain valid for 30 years. Identify the risk category, estimate a risk score (1–25), and propose a mitigation strategy.',
    workshopStep: 1,
    workshopStepLabel: 'Step 2 — Risk Register Builder',
    decisionRubric: [
      'Classify the primary threat as Signature Forgery / Trust Now, Forge Later (TNFL) rather than HNDL, because signing protects integrity and authenticity rather than confidentiality.',
      'Separate the business service (EHR signing & verification service) from the protected asset (30-year retained health records) and assign a functional owner role plus a next review date so the row is a managed risk, not an unowned note.',
      'Justify the Likelihood × Impact score (1–25) as a relative planning judgment based on the 30-year verification horizon and clinical/legal impact, not a measured probability.',
      'Propose a standards-aligned migration path (e.g., evaluating FIPS 204 ML-DSA or FIPS 205 SLH-DSA alongside long-term archival timestamping/re-signing and verifier support in production tools).',
    ],
  },
  {
    id: 'gov-cnsa',
    title: 'Scenario: Government Compliance Deadline',
    prompt:
      'Your agency operates national security systems subject to CNSA 2.0 (new acquisitions from 1 January 2027, equipment that cannot support CNSA 2.0 phased out by 31 December 2030 absent an exception, and CNSA 2.0 algorithms mandated by 31 December 2031 unless otherwise noted). You have 200+ systems using RSA-3072 and ECDSA P-256 (both quantum-vulnerable), plus AES-128 (which CNSA 2.0 upgrades to AES-256). Build a prioritized risk register with at least 4 entries covering different asset types and threat vectors.',
    workshopStep: 1,
    workshopStepLabel: 'Step 2 — Risk Register Builder',
    decisionRubric: [
      'Confirm NSS scope first (CNSA 2.0 FAQ v2.2 applies to National Security Systems; federal civilian agencies instead follow EO 14412 and OMB M-26-15).',
      'Distinguish Shor-vulnerable public-key algorithms (RSA-3072, ECDSA P-256) from symmetric AES-128 (upgraded to AES-256 under CNSA 2.0 policy rather than broken by Shor’s algorithm).',
      'Include at least 4 distinct asset types and threat vectors (e.g., HNDL key establishment, signature forgery, supply-chain code signing, Grover/symmetric policy upgrade), each with an owner role and review date.',
      'Carry the register into Step 3 (Risk Heatmap) to assign draft treatments and document priority rationale rather than relying on raw scores alone.',
    ],
  },
  {
    id: 'compliance-gap',
    title: 'Scenario: Compliance Gap Analysis',
    prompt:
      'Using your completed risk register, run the Compliance Gap Analysis (Step 4). Set 2032 as a CRQC planning scenario. Identify public-key algorithms that NIST IR 8547 says are deprecated after 2030, and separately identify those disallowed after 2035 under NIST standards and guidelines. A CRQC scenario year does not determine compliance status. For each item, state whether the relevant NIST standard applies and name a standards-aligned migration option for its actual use.',
    workshopStep: 3,
    workshopStepLabel: 'Step 4 — Compliance Gap Analysis',
    decisionRubric: [
      'Keep the 2032 CRQC planning scenario strictly separate from regulatory/standards applicability and dates.',
      'Distinguish NIST IR 8547 (final, October 2026) deprecation after 2030 from disallowance after 2035 under NIST standards and guidelines, and note that NIST status is not a global private-sector law on its own.',
      'Verify the actual cryptographic operation (key establishment vs. digital signature) and required parameter set before naming a replacement (e.g., FIPS 203 ML-KEM for KEM, FIPS 204 ML-DSA / FIPS 205 SLH-DSA for signatures).',
      'Explain why substring matching in the sample tool cannot prove compliance and what evidence (FIPS 140-3 module certificates, protocol configs, CBOMs) your production tools must collect.',
    ],
  },
]

export const PQCRiskManagementExercises: React.FC<PQCRiskManagementExercisesProps> = ({
  onNavigateToWorkshop,
}) => {
  const [openRubrics, setOpenRubrics] = useState<Record<string, boolean>>({})

  const toggleRubric = (id: string) => {
    setOpenRubrics((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="w-full space-y-6">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">Risk Management Exercises</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Apply what you learned in the workshop to these fictional executive scenarios. Use the
          Workshop tab tools to model your answers, then check your reasoning against each
          exercise&apos;s decision rubric.
        </p>
        <div className="space-y-4">
          {EXERCISES.map((exercise) => {
            const isOpen = Boolean(openRubrics[exercise.id])
            return (
              <div key={exercise.id} className="glass-panel p-5 space-y-3">
                <h3 className="text-lg font-semibold text-foreground">{exercise.title}</h3>
                <p className="text-sm text-foreground/80">{exercise.prompt}</p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="bg-muted/50 rounded-lg p-3 border border-border flex-1">
                    <p className="text-xs text-muted-foreground italic">
                      Use <strong className="text-foreground">{exercise.workshopStepLabel}</strong>{' '}
                      in the Workshop tab to model your response.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleRubric(exercise.id)}
                      aria-expanded={isOpen}
                      className="text-xs gap-1"
                    >
                      Decision Checklist
                      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => onNavigateToWorkshop(exercise.workshopStep)}
                      className="text-xs text-primary hover:underline shrink-0"
                    >
                      Open {exercise.workshopStepLabel.split(' — ')[0]} →
                    </Button>
                  </div>
                </div>
                {isOpen && (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-2">
                    <div className="text-xs font-semibold text-foreground">
                      Executive Decision Checklist
                    </div>
                    <ul className="space-y-1.5">
                      {exercise.decisionRubric.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                          <CheckCircle2
                            size={14}
                            className="text-primary shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
