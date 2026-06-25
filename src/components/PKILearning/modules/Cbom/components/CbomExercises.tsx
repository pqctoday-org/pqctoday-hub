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
      'Your org already runs Qualys, a CSPM, and an SBOM pipeline. Which discovery layers are still blind, and what is the minimal net-new scan?',
    step: 0,
    cta: 'Map your coverage',
  },
  {
    prompt:
      'A team needs a CBOM but is standardised on SPDX for SBOMs. Walk the trade-off and reach a recommendation.',
    step: 1,
    cta: 'Use the Format Chooser',
  },
  {
    prompt:
      'Run a quantum-safe policy over a mixed inventory. Explain why the legacy appliance returns "unknown" rather than "pass".',
    step: 2,
    cta: 'Run the policy check',
  },
  {
    prompt:
      'The same ECDSA key appears in an HSM, a certificate, source code and a network scan under four different ids. Which identifier collapses them to one logical key?',
    step: 3,
    cta: 'Correlate the key',
  },
]

export const CbomExercises: FC<Props> = ({ onNavigateToWorkshop }) => (
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
