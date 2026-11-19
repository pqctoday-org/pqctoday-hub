// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Button } from '@/components/ui/button'

interface StandardsBodiesExercisesProps {
  onNavigateToWorkshop: (step?: number) => void
}

const EXERCISES = [
  {
    id: 'multinational-vendor',
    title: 'Multinational Vendor PQC Certification Strategy',
    badge: 'Certification',
    badgeColor: 'bg-primary/20 text-primary border-primary/50',
    scenario:
      "Your HSM vendor sells products to US federal agencies, EU government entities, and a Korean telecom. For each market: (1) US: Which certification program must your FIPS 203/204/205 implementation pass? Which body administers it, and which body wrote the underlying standard? (2) EU: If the customer requires CC-based certification, which EU scheme applies? Which body issues EUCC certificates, and which body maintains the Agreed Cryptographic Mechanisms (ACM) list? (3) Korea: Which national PQC competition produced Korea's approved algorithms? Which government institutions set up the research group that ran the competition, and which algorithms were selected?",
    hint: 'Use the Organization Explorer (Step 2) to research each body, and the Coverage Grid (Step 4) to map which certification bodies operate in each region.',
    checklist: [
      'US: FIPS 140-3 module validation administered by CMVP (joint NIST/CSE) with CAVP algorithm validation (via ACVP) for NIST-authored FIPS 203/204/205.',
      'EU: EUCC (Regulation (EU) 2024/482) — accredited certification bodies issue certificates (national authorities supervise, ENISA publishes); the ECCG Sub-group on Cryptography maintains the ACM v2 guideline.',
      'Korea: KpqC competition run by the KpqC research group (set up by NSR and NIS; KISA on advisory committees), selecting HAETAE & AIMer (signatures) and SMAUG-T & NTRU+ (KEMs).',
    ],
    step: 1,
  },
  {
    id: 'ietf-vs-nist',
    title: 'IETF vs NIST — Protocol Integration Decision',
    badge: 'Protocol',
    badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
    scenario:
      'Your engineering team is adding PQC to a TLS 1.3 implementation. They ask: "Should we follow the NIST standard or the IETF standard?" Help them understand the relationship: (1) Which organization published the ML-KEM algorithm (FIPS 203)? What type of body is it? (2) Which IETF working group handles PQC integration into TLS? What RFC did they produce? (3) Are these in conflict, or complementary? How do NIST algorithm standards feed into IETF protocol standards?',
    hint: 'Use the Scenario Challenge (Step 5, Scenario 4: the TLS 1.3 question) and the Organization Explorer (Step 2) to compare NIST vs IETF decision-making processes.',
    checklist: [
      'NIST (governmental US standards body) specifies the ML-KEM primitive in FIPS 203.',
      'IETF TLS WG (global non-governmental standards body) specifies TLS 1.3 (RFC 9846, obsoleting RFC 8446), hybrid design (RFC 9954), and hybrid key agreement groups such as X25519MLKEM768 (RFC 10024); separately, LAMPS WG covers X.509/CMS composite ML-DSA (RFC 10073 / RFC 10082).',
      'Complementary layers: NIST defines the cryptographic primitive; IETF defines wire encodings and protocol negotiation; endpoint support still depends on the specific TLS library version.',
    ],
    step: 4,
  },
  {
    id: 'compliance-authorship',
    title: 'Compliance Framework Authorship Audit',
    badge: 'Compliance',
    badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
    scenario:
      'Your legal team is preparing a PQC compliance brief and lists the following documents as requirements. For each, identify: (a) which organization authored it, (b) whether that organization is governmental or non-governmental, (c) whether compliance is mandatory or advisory, and (d) what underlying technical standards it references:\n\n• FIPS 140-3\n• CNSA 2.0\n• ETSI TS 103 744\n• NIS2 Directive\n• ANSSI PQC Position Paper',
    hint: 'Use the Body Classifier (Step 1) to verify your classifications, and the Organization Explorer (Step 2) to find the decision-making process and PQC outputs for each authoring organization.',
    checklist: [
      'FIPS 140-3: NIST (governmental) — mandatory for US federal procurement under FISMA; validated by CMVP against ISO/IEC 19790 & FIPS 203/204/205.',
      'CNSA 2.0: NSA (governmental) — mandatory for US National Security Systems (FAQ v2.2: new acquisitions Jan 2027, phase-out Dec 2030, mandated Dec 2031); references FIPS 203 (ML-KEM-1024), FIPS 204 (ML-DSA-87), and SP 800-208 (LMS/XMSS).',
      'ETSI TS 103 744: ETSI TC CYBER (non-governmental) — normative technical specification ("shall") for hybrid key establishment (e.g., ECDH + ML-KEM), binding only when invoked by law, scheme, or contract.',
      'NIS2 Directive: European Parliament & Council (governmental) — EU Directive transposed into national law; Art. 24 lets Member States require EUCC-certified products, rather than mandating them directly.',
      'ANSSI PQC Position Paper: ANSSI (governmental) — phased hybridisation guidance/roadmap, not a blanket legal mandate for a defined perimeter (hash-based signatures excluded from systematic hybridisation).',
    ],
    step: 0,
  },
]

export const StandardsBodiesExercises: React.FC<StandardsBodiesExercisesProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Standards Bodies — Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Apply what you learned in the workshop to these real-world scenarios. Each exercise guides
          you through the workshop tools &mdash; click &quot;Go to Workshop&quot; to begin.
        </p>
      </div>

      <div className="space-y-4">
        {EXERCISES.map((exercise) => (
          <div key={exercise.id} className="glass-panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-foreground">{exercise.title}</h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold ${exercise.badgeColor}`}
                  >
                    {exercise.badge}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 mb-2 whitespace-pre-line">
                  {exercise.scenario}
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>How to approach:</strong> {exercise.hint}
                </p>
                <details className="mt-2 text-xs text-muted-foreground">
                  <summary className="cursor-pointer font-medium text-primary hover:underline">
                    Decision checklist &amp; self-check
                  </summary>
                  <ul className="mt-2 list-disc pl-5 space-y-1 text-foreground/80">
                    {exercise.checklist.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </details>
              </div>
              <Button
                variant="gradient"
                onClick={() => onNavigateToWorkshop(exercise.step)}
                className="px-4 py-2 font-bold rounded-lg transition-colors text-sm shrink-0"
              >
                Go to Workshop
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
