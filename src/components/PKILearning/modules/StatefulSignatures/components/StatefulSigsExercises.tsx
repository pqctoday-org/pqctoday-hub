import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export interface WorkshopConfig {
  step: number
  paramId?: string
}

interface StatefulSigsExercisesProps {
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

export const StatefulSigsExercises: React.FC<StatefulSigsExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'lms-param-tradeoffs',
      title: '1. LMS Parameter Trade-offs',
      description:
        'Start with H5/W8 (smallest signatures, fewest keys), then switch to H20/W4. Observe how tree height controls signing capacity while the Winternitz parameter controls the signature size vs signing speed trade-off.',
      badge: 'LMS',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'H5/W8 produces only 32 signatures at ~1.3 KB each. H20/W4 produces over 1 million signatures at ~2.8 KB each. The public key remains 56 bytes regardless of parameters.',
      config: { step: 0, paramId: 'lms-h5-w8' },
    },
    {
      id: 'xmss-vs-lms',
      title: '2. XMSS vs LMS Comparison',
      description:
        'Select XMSS-SHA2_10 and compare its signature size, key sizes, and security properties against LMS H10/W4. Understand why different regulatory bodies prefer different schemes.',
      badge: 'XMSS',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'At the same tree height (H=10), XMSS produces smaller signatures than LMS but has larger private keys due to bitmask storage. XMSS has a stronger security proof against multi-target attacks.',
      config: { step: 1, paramId: 'xmss-sha2-10' },
    },
    {
      id: 'multi-tree-scaling',
      title: '3. Multi-Tree Scaling (HSS / XMSS^MT)',
      description:
        'Explore the XMSS^MT multi-tree variants. See how chaining sub-trees enables effectively unlimited signing capacity while keeping individual trees manageable.',
      badge: 'Multi-Tree',
      badgeColor: 'bg-warning/20 text-warning border-warning/50',
      observe:
        'XMSS^MT-SHA2_60/6 provides 2^60 signatures (over 10^18) by chaining 6 layers of 10-level trees. This is suitable for long-lived timestamping authorities that sign millions of times per year.',
      config: { step: 1, paramId: 'xmssmt-sha2-40-4' },
    },
    {
      id: 'state-exhaustion',
      title: '4. Key Exhaustion Simulation',
      description:
        'Use the State Management simulator with H5 (32 signatures). Sign messages until the key is exhausted. Observe the warning thresholds at 80% usage and the catastrophic exhaustion message.',
      badge: 'State',
      badgeColor: 'bg-destructive/20 text-destructive border-destructive/50',
      observe:
        'At 80% capacity (26/32 signatures), a rotation warning appears. At 32/32, the key is permanently exhausted. In production, you must rotate BEFORE exhaustion. There is no way to "refill" a stateful key.',
      config: { step: 2 },
    },
    {
      id: 'state-loss-attack',
      title: '5. State Loss Attack',
      description:
        'Sign several messages, then click "Simulate State Loss" to roll back the counter. Observe how this creates a key reuse vulnerability that completely breaks the signature scheme.',
      badge: 'Attack',
      badgeColor: 'bg-destructive/20 text-destructive border-destructive/50',
      observe:
        'After state loss, previously-used leaf indices become "available" again. Any signature produced with a reused leaf gives an attacker enough information to forge signatures. This is why VM snapshots and key cloning are forbidden for stateful schemes.',
      config: { step: 2 },
    },
  ]

  const handleLoadAndRun = (scenario: Scenario) => {
    onSetWorkshopConfig?.(scenario.config)
    onNavigateToWorkshop()
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Guided Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Work through these scenarios to understand stateful hash-based signatures, parameter
          trade-offs, and the critical importance of state management. Each exercise pre-configures
          the Workshop &mdash; click &quot;Load &amp; Run&quot; to begin.
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
              <button
                onClick={() => handleLoadAndRun(scenario)}
                className="btn btn-primary flex items-center gap-2 px-4 py-2 shrink-0"
              >
                <Play size={14} fill="currentColor" /> Load &amp; Run
              </button>
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
                Take the PQC quiz to test what you&apos;ve learned about stateful signatures.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/learn/quiz')}
            className="btn btn-secondary flex items-center gap-2 px-4 py-2"
          >
            Take Quiz <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
