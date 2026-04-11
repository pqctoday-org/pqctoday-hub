// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Play, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface WorkshopConfig {
  step: number
  paramId?: string
}

interface SLHDSAExercisesProps {
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

export const SLHDSAExercises: React.FC<SLHDSAExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const scenarios: Scenario[] = [
    {
      id: 'small-vs-fast',
      title: '1. Small Signature vs Fast Signing',
      description:
        'Generate keys with SHA2-128s (small/slow) then SHA2-128f (fast/large). Observe signature size and how the hypertree layer count (d) drives the tradeoff.',
      badge: 'Parameter Tradeoff',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'SHA2-128s produces 7,856 B signatures with d=7 layers. SHA2-128f produces 17,088 B signatures with d=22 layers. More layers = faster signing, bigger proof.',
      config: { step: 0 },
    },
    {
      id: 'context-strings',
      title: '2. Context String Domain Separation',
      description:
        'Sign a message with context string "protocol:codesign", then attempt verification with a different context "protocol:tls". Observe CKR_SIGNATURE_INVALID.',
      badge: 'FIPS 205 §9.2',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'The same (SK, M) pair produces valid signatures under each context, but cross-context verification fails. This prevents replay attacks across protocol boundaries.',
      config: { step: 2 },
    },
    {
      id: 'deterministic',
      title: '3. Randomized vs Deterministic Signing',
      description:
        'Sign the same message twice in randomized mode — signatures differ. Then enable deterministic mode and sign again twice — signatures are identical.',
      badge: 'FIPS 205 §10',
      badgeColor: 'bg-accent/20 text-accent border-accent/50',
      observe:
        'Deterministic mode (opt_rand = none) trades RNG-failure protection for reproducibility. Both modes produce valid signatures; verification succeeds for both.',
      config: { step: 2 },
    },
    {
      id: 'hash-slh-dsa',
      title: '4. Pure vs HashSLH-DSA',
      description:
        'Sign with Pure SLH-DSA, then switch to HashSLH-DSA (SHA-256 pre-hash). Observe that the PKCS#11 mechanism changes from CKM_SLH_DSA to CKM_HASH_SLH_DSA_SHA256.',
      badge: 'FIPS 205 §11',
      badgeColor: 'bg-muted/40 text-foreground border-border',
      observe:
        "HashSLH-DSA pre-hashes M before signing: M' = 0x01 || len(ctx) || ctx || OID_DER || H(M). Context strings are NOT allowed in HashSLH-DSA mode (§9.2).",
      config: { step: 1 },
    },
  ]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">SLH-DSA Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Hands-on scenarios to build intuition for FIPS 205 parameter tradeoffs, context strings,
          deterministic mode, and the Pure vs HashSLH-DSA distinction.
        </p>
      </div>

      <div className="grid gap-4">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="glass-panel p-5 space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <h3 className="font-semibold text-foreground">{scenario.title}</h3>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded border ${scenario.badgeColor}`}
              >
                {scenario.badge}
              </span>
            </div>

            <p className="text-sm text-muted-foreground">{scenario.description}</p>

            <div className="bg-muted/40 rounded-lg px-3 py-2 text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">What to observe:</strong> {scenario.observe}
            </div>

            <Button
              variant="ghost"
              onClick={() => {
                onSetWorkshopConfig?.(scenario.config)
                onNavigateToWorkshop()
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors text-sm font-medium"
            >
              <Play size={13} />
              Go to Workshop Step {scenario.config.step + 1}
              <ArrowRight size={13} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
