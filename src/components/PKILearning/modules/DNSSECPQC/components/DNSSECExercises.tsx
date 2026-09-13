// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'

export interface SimulationConfig {
  step: number
  highlightAlgorithm?: string
}

interface DNSSECExercisesProps {
  onNavigateToSimulate: () => void
  onSetSimulationConfig?: (config: SimulationConfig) => void
}

interface Scenario {
  id: string
  title: string
  description: string
  badge: string
  badgeColor: string
  observe: string
  config: SimulationConfig
}

export const DNSSECExercises: React.FC<DNSSECExercisesProps> = ({
  onNavigateToSimulate,
  onSetSimulationConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'signature-sizes',
      title: '1. Compare Signature Sizes Against the DNS UDP Ceiling',
      description:
        'Step through RSA-2048, ECDSA P-256, Ed25519, ML-DSA-44, and SLH-DSA-SHA2-128s signature sizes against DNS’s practical ~1,232-byte UDP response limit.',
      badge: 'Sizes',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'ML-DSA-44 (2,420 B) alone exceeds the UDP ceiling by roughly 2x; SLH-DSA-SHA2-128s (7,856 B) exceeds it by more than 6x. Every classical algorithm shown fits comfortably under it.',
      config: { step: 0, highlightAlgorithm: 'ML-DSA-44' },
    },
    {
      id: 'validation-chain',
      title: '2. Walk the PQ Validation Chain',
      description:
        'Step through the root → TLD → domain DS/DNSKEY/RRSIG trust chain and see exactly where algorithm 18 sits today versus where it would need to sit for full deployment.',
      badge: 'Chain',
      badgeColor: 'bg-warning/20 text-warning border-warning/50',
      observe:
        'In this simplified illustration, algorithm 18 exists only at the leaf (dnstest.dev’s own zone). Every level above it — the .dev TLD and the DNS root — still delegates classically, so the chain of trust as a whole is not yet post-quantum.',
      config: { step: 1 },
    },
    {
      id: 'roadmap',
      title: '3. Track the Deployment Roadmap',
      description:
        "Review Cloudflare's own roadmap from resolver validation through authoritative signing and registrar DS support, and see how it compares to the DNS root's separate rollover estimate.",
      badge: 'Roadmap',
      badgeColor: 'bg-success/20 text-success border-success/50',
      observe:
        "Cloudflare's own company-wide PQ security target is ~2029 (not a DNSSEC-specific date); the DNS root's own algorithm rollover is a separate, broader estimate of mid-2030s (Verisign). Don't conflate the two.",
      config: { step: 2 },
    },
  ]

  const handleLoadAndRun = (scenario: Scenario) => {
    onSetSimulationConfig?.(scenario.config)
    onNavigateToSimulate()
  }

  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Guided Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Work through these scenarios to see exactly why DNSSEC’s PQC transition is constrained by
          message size, and where the real Cloudflare deployment sits in the bigger migration
          picture. Each exercise pre-configures the Workshop &mdash; click &quot;Load &amp;
          Run&quot; to begin.
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
                Take the PQC quiz to test what you&apos;ve learned about DNSSEC and post-quantum
                signatures.
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
