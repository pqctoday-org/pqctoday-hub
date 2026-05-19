// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Play, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface WorkshopConfig {
  step: number
  candidateId?: string
  familyId?: string
}

interface CandidatesExercisesProps {
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

export const CandidatesExercises: React.FC<CandidatesExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const scenarios: Scenario[] = [
    {
      id: 'uov-wedge',
      title: '1. UOV under the 2025 wedge attack',
      description:
        'Open the Lifecycle Simulator and advance UOV through Round 2. Watch the Ran wedge-attack event fire and see three of four parameter sets drop below their security target.',
      badge: 'Cryptanalysis',
      badgeColor: 'bg-status-error/20 text-status-error border-status-error/50',
      observe:
        'UOV-Ip, UOV-III, and UOV-V all lose security in characteristic-2 fields. QR-UOV (odd characteristic) is untouched — this is exactly why algorithmic diversity within a family matters.',
      config: { step: 0, candidateId: 'uov' },
    },
    {
      id: 'sqisign-vs-faest',
      title: '2. SQIsign vs FAEST — bandwidth vs CPU',
      description:
        'Open the Candidate Comparator and select SQIsign (148 B signatures, slow signing) and FAEST (6.3 KB signatures, AES-grade trust). See where each one fits.',
      badge: 'Compare',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        "SQIsign wins for bandwidth-constrained protocols (IoT, certs). FAEST wins where AES-grade security trust is more important than wire cost. Same problem, opposite Pareto corners — that's why NIST keeps both.",
      config: { step: 2, candidateId: 'sqisign' },
    },
    {
      id: 'family-math',
      title: '3. Family math — what makes each one tick',
      description:
        'Open the Family Math Explainer and step through MPCitH → multivariate → isogeny → lattice. Each panel shows the core construction in an animated visual.',
      badge: 'Visualise',
      badgeColor: 'bg-status-info/20 text-status-info border-status-info/50',
      observe:
        'Notice how different the underlying assumptions are. A lattice break does not threaten an isogeny scheme, and vice versa — this is exactly the diversity NIST wants in the standardisation portfolio.',
      config: { step: 1 },
    },
    {
      id: 'hawk-vs-falcon',
      title: '4. HAWK as the integer-only Falcon alternative',
      description:
        "Open the Comparator and contrast HAWK against FN-DSA's deployment story. FN-DSA needs constant-time floating-point Gaussian sampling. HAWK doesn't.",
      badge: 'Implementation',
      badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
      observe:
        'HAWK at NIST Cat 1 is 555 B — smaller than both FN-DSA and ML-DSA — and uses integer-only arithmetic on a rank-2 module lattice. That eliminates a whole class of constant-time bugs that have plagued Falcon implementations.',
      config: { step: 2, candidateId: 'hawk' },
    },
    {
      id: 'worldwide-map',
      title: '5. Where the worldwide tracks intersect',
      description:
        'Open the Worldwide Standardisation Map and find where KpqC, CACR, and ISO/IEC overlap with NIST. Look at which bodies have a parallel process vs an aligned process.',
      badge: 'Global',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        "KpqC and CACR run parallel selections — they may pick algorithms NIST didn't. ISO/IEC aligns with NIST output, gating procurement in countries that pin to ISO. Your migration plan needs to know which mode applies in your jurisdiction.",
      config: { step: 5 },
    },
  ]

  const handleLaunch = (scenario: Scenario) => {
    if (onSetWorkshopConfig) onSetWorkshopConfig(scenario.config)
    onNavigateToWorkshop()
  }

  return (
    <div className="space-y-4 w-full">
      <p className="text-foreground/80 leading-relaxed">
        Each exercise pre-configures a workshop step and tells you what to look for. Open one, then
        come back and try the next.
      </p>
      {scenarios.map((s) => (
        <div key={s.id} className="glass-panel p-5 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <h3 className="text-base font-bold text-foreground">{s.title}</h3>
            <span
              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${s.badgeColor}`}
            >
              {s.badge}
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
          <div className="rounded-md border border-border bg-card/50 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
              What to observe
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">{s.observe}</p>
          </div>
          <div className="flex justify-end">
            <Button variant="gradient" onClick={() => handleLaunch(s)} className="gap-2">
              <Play size={14} /> Open in workshop <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
