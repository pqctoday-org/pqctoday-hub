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
      'A vulnerability scanner reports "CKM_ECDSA_SHA256" and a JWT service reports "ES256" for what your team suspects is the same signing key. Confirm it — and explain why "RSA2048" alone, from a third tool, can\'t be normalized the same way.',
    step: 0,
    cta: 'Use the Algorithm Normalizer',
  },
  {
    prompt:
      'Your certificate inventory lists a curve as "secp256r1"; a network capture reports "P-256" for the same handshake. Are these the same curve — and what canonical entry (with OID) proves it?',
    step: 1,
    cta: 'Use the Curve Lookup',
  },
]

export const CryptoRegistryExercises: FC<Props> = ({ onNavigateToWorkshop }) => (
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
