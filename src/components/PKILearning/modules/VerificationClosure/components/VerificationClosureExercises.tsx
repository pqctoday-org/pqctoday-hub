// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  onNavigateToWorkshop?: (step?: number) => void
}

const EXERCISES: { prompt: string; step: number; cta: string }[] = [
  {
    prompt:
      'An RSA-2048 TLS key has been replaced by an ML-KEM hybrid, and the change ticket is closed. Why is the migration still not "done", and what is the missing step?',
    step: 0,
    cta: 'Walk the decommission steps',
  },
  {
    prompt:
      'You have 4,000 systems across three tiers. How much do you verify per tier, and what counts as proof for a Tier-1 system?',
    step: 1,
    cta: 'Plan coverage',
  },
  {
    prompt:
      'The program is finishing. List the standing capabilities that must transfer to a permanent owner before you can close — and who accepts the residual risk.',
    step: 2,
    cta: 'Build the handover register',
  },
]

export const VerificationClosureExercises: FC<Props> = ({ onNavigateToWorkshop }) => (
  <div className="space-y-3">
    <p className="text-sm text-muted-foreground">
      Verification and closure are where programs quietly fail. Reason through each, then check it
      against the tool.
    </p>
    {EXERCISES.map((ex, i) => (
      <div key={i} className="glass-panel p-4">
        <p className="mb-3 text-sm text-foreground">{ex.prompt}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigateToWorkshop?.(ex.step)}
          className="gap-1.5 border-primary text-primary hover:bg-primary/10"
        >
          {ex.cta} <ArrowRight size={13} />
        </Button>
      </div>
    ))}
  </div>
)
