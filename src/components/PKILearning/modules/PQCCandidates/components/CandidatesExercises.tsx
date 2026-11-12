// SPDX-License-Identifier: AGPL-3.0-only
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
        'Open the Candidate Comparator and compare the retained SQIsign example (148-byte signature) with FAEST v3.0 FAEST-128f (5,170-byte signature). Compare each sample’s public key plus signature bytes, then consider the different assumptions and implementation costs.',
      badge: 'Compare',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'The SQIsign example has 65 + 148 = 213 bytes of public key plus signature; FAEST v3.0 FAEST-128f has 32 + 5,170 = 5,202 bytes. This does not measure CPU cost. FAEST’s serialized private key is 16-byte x plus 16-byte k = 32 bytes, larger than MAYO’s retained 24-byte compact seed. Compare declared versions and representations rather than calling the 16-byte AES secret the complete serialized private key.',
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
      title: '4. HAWK: the integer-only Falcon alternative that was withdrawn',
      description:
        "Open the Comparator and contrast HAWK against FN-DSA's deployment story. FN-DSA needs constant-time floating-point Gaussian sampling. HAWK didn't, but its team withdrew it on 29 July 2026 after a new key-recovery attack.",
      badge: 'Implementation',
      badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
      observe:
        'HAWK at NIST Cat 1 is 555 B — smaller than both FN-DSA and ML-DSA — and uses integer-only arithmetic on a rank-2 module lattice, which removes a whole class of constant-time bugs that have plagued Falcon implementations. Easier implementation did not save it: a key-recovery attack ended its candidacy; in this module’s reading, a reminder that security comes first among the evaluation criteria.',
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
