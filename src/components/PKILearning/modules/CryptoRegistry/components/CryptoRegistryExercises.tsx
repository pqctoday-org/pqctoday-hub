// SPDX-License-Identifier: AGPL-3.0-only
import type { FC } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  onNavigateToWorkshop?: (step?: number) => void
}

const EXERCISES: { prompt: string; explanation?: string; step: number; cta: string }[] = [
  {
    prompt:
      'A sample scanner reports "CKM_ECDSA_SHA256" and a sample JWT record reports "ES256". Use the normalizer to compare their algorithm families. What do those labels tell you, and what additional information would you need before linking the records to the same signing key? Why does "RSA2048" alone leave its signing profile unspecified?',
    explanation:
      'Matching algorithm labels or families does not establish key identity. ES256 specifies P-256 with SHA-256; CKM_ECDSA_SHA256 does not by itself select the key’s curve. In production tools, inspect key parameters, public-key fingerprints computed over a comparable representation, and record provenance before linking keys. This normalizer resolves names; it does not verify that two records contain the same key.',
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
      Apply each idea in the workshop. Distinguish what the tool resolves from information it does
      not receive or verify.
    </p>
    {EXERCISES.map((ex, i) => (
      <div key={i} className="glass-panel p-4">
        <p className="text-sm text-foreground mb-3">{ex.prompt}</p>
        {ex.explanation && <p className="text-xs text-muted-foreground mb-3">{ex.explanation}</p>}
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
