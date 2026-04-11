// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export interface WorkshopConfig {
  step: number
}

interface KmsPqcExercisesProps {
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
  config: WorkshopConfig
}

export const KmsPqcExercises: React.FC<KmsPqcExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'key-hierarchy-design',
      title: '1. Key Hierarchy Design',
      description:
        'Design a 3-level PQC key hierarchy for a multi-cloud enterprise. Select algorithm modes (Classical, Hybrid, or PQC-only) for each level — Root KEK, Zone KEK, and DEK — and observe how key material sizes and storage requirements change.',
      badge: 'Hierarchy',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'Switching from Classical to PQC-only at the Root KEK level increases the public key from 256 bytes (RSA-4096) to 1,568 bytes (ML-KEM-1024). The tree visualization shows how mode choices cascade through the hierarchy.',
      config: { step: 0 },
    },
    {
      id: 'envelope-encryption',
      title: '2. Envelope Encryption Walkthrough',
      description:
        'Step through the 5-step ML-KEM envelope encryption flow side-by-side with classical RSA-OAEP. Observe the extra KDF step that PQC requires and compare artifact sizes at each stage.',
      badge: 'Encryption',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'RSA-OAEP wraps the DEK in one step (256 bytes). ML-KEM requires encapsulate → KDF → AES-KW wrap, producing 1,128 bytes total — a 4.4x increase. The extra complexity is inherent to the KEM paradigm.',
      config: { step: 1 },
    },
    {
      id: 'hybrid-pqc-wrapping',
      title: '3. Hybrid vs PQC-Only Wrapping',
      description:
        'Compare four hybrid combiner modes: X25519+ML-KEM-768, P-256+ML-KEM-768, X25519+ML-KEM-1024, and X-Wing. Examine the combiner formula, wire overhead, and recommended use case for each.',
      badge: 'Hybrid',
      badgeColor: 'bg-warning/20 text-warning border-warning/50',
      observe:
        'X-Wing (used by Google Cloud KMS) has the same wire overhead as X25519+ML-KEM-768 (1,120 bytes) but provides a standardized single-construction hybrid KEM. FIPS-compliant environments should prefer P-256+ML-KEM-768.',
      config: { step: 2 },
    },
    {
      id: 'provider-api-mapping',
      title: '4. Provider API Mapping',
      description:
        'Map the same PQC key wrapping operation across three cloud KMS providers (AWS KMS, Google Cloud KMS, Azure Key Vault). See how each provider exposes PQC capabilities through their API and CLI.',
      badge: 'Multi-Cloud',
      badgeColor: 'bg-destructive/20 text-destructive border-destructive/50',
      observe:
        'AWS KMS has GA ML-DSA signing (ML-DSA-44/65/87) across all regions. Google Cloud KMS supports ML-KEM-768, ML-KEM-1024, X-Wing, ML-DSA-65, and SLH-DSA (preview). Azure Key Vault does not yet expose PQC key types natively; SymCrypt supports ML-KEM/ML-DSA internally but not through the Key Vault API.',
      config: { step: 2 },
    },
    {
      id: 'compliance-rotation',
      title: '5. Compliance-Driven Rotation',
      description:
        'Plan a key rotation schedule for 500 certificates aligned with CNSA 2.0 (2027-2033), NIST IR 8547 (2030/2035), and provider-specific rotation capabilities. Calculate storage and bandwidth impact across three migration phases.',
      badge: 'Compliance',
      badgeColor: 'bg-success/20 text-success border-success/50',
      observe:
        'CNSA 2.0 requires all new NSS acquisitions to be PQC-compliant by 2027 and exclusively PQC by 2033. The storage impact multiplier ranges from 1.0x (AES-256 DEKs) to 30.0x (ECDSA → ML-DSA-65 code signing keys).',
      config: { step: 3 },
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
          Work through these scenarios to master PQC key management patterns, envelope encryption,
          hybrid wrapping, and compliance-driven rotation planning. Each exercise pre-configures the
          Workshop &mdash; click &quot;Load &amp; Run&quot; to begin.
        </p>
      </div>

      <div className="space-y-4">
        {scenarios.map((scenario) => (
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
                <Play size={14} fill="currentColor" /> Load &amp; Run
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Quiz Link */}
      <div className="glass-panel p-6 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-primary" />
            <div>
              <h3 className="font-bold text-foreground">Test Your Knowledge</h3>
              <p className="text-sm text-muted-foreground">
                Take the PQC quiz to test what you&apos;ve learned about KMS and PQC key management.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/learn/quiz')}
            className="btn btn-secondary flex items-center gap-2 px-4 py-2"
          >
            Take Quiz <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}
