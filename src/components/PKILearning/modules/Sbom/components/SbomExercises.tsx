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
      'Your org is standardised on SPDX for license compliance, but a new client demands VEX-linked vulnerability data. Does that force a format migration, or can you keep both?',
    step: 0,
    cta: 'Compare the formats',
  },
  {
    prompt:
      'A security scanner flags a CVE in a compression library that ships inside three of your products. Only one actually calls the vulnerable function. What closes that gap, and what document expresses it?',
    step: 0,
    cta: 'Review VEX',
  },
  {
    prompt:
      'You need an SBOM for a container image built from a Python base with a compiled Java service inside it. Which tool(s) do you run, and do they agree on a format?',
    step: 1,
    cta: 'Pick generation tools',
  },
  {
    prompt:
      'Your CBOM effort keeps missing library dependency chains that a widely-used crypto library brings in transitively. What existing artifact should have been cross-referenced first?',
    step: 1,
    cta: 'See the SBOM-CBOM bridge',
  },
]

export const SbomExercises: FC<Props> = ({ onNavigateToWorkshop }) => (
  <div className="space-y-3">
    <p className="text-sm text-muted-foreground">
      Apply each idea in the workshop. There&apos;s no single right answer — reason through the
      trade-off, then check it against the tool.
    </p>
    {EXERCISES.map((ex, i) => (
      <div key={i} className="glass-panel p-4">
        <p className="text-sm text-foreground mb-3">{ex.prompt}</p>
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
