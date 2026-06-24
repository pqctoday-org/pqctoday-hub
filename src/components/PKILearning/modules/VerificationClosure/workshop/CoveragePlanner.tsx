// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Verification Coverage Planner — decide WHICH systems to verify and WHAT proof
 * per tier. The evidence standard (observed behaviour, e.g. a captured handshake
 * showing ML-KEM) and the sampling approach are practitioner guidance, not a
 * named standard — surfaced as such.
 */

interface Tier {
  id: string
  label: string
  coverage: string
  evidence: string
}

const TIERS: Tier[] = [
  {
    id: 't1',
    label: 'Tier 1 — business-critical / internet-facing',
    coverage: 'Verify 100%',
    evidence: 'Observed behaviour: capture the handshake and confirm ML-KEM/ML-DSA was negotiated.',
  },
  {
    id: 't2',
    label: 'Tier 2 — internal, sensitive',
    coverage: 'Documented sample per migration wave',
    evidence:
      'Sampled handshake/scan evidence; any sampled failure widens the check to the whole wave.',
  },
  {
    id: 't3',
    label: 'Tier 3 — low-risk / long-tail',
    coverage: 'Lightweight sample + continuous monitoring',
    evidence: 'Drift monitoring (reuse the SOC Cryptographic Drift Monitoring) flags regressions.',
  },
]

export function CoveragePlanner() {
  const [picked, setPicked] = useState<string | null>(null)
  const tier = TIERS.find((t) => t.id === picked) ?? null

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardCheck size={18} className="text-primary" />
          <h3 className="font-semibold text-foreground">Plan verification coverage</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          You can&apos;t verify everything by hand. Pick a system tier to see the recommended
          coverage and the proof you should collect.{' '}
          <span className="text-status-info">◆ practitioner guidance</span>
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {TIERS.map((t) => (
          <Button
            key={t.id}
            variant="outline"
            size="sm"
            onClick={() => setPicked(t.id)}
            className={`h-auto justify-start whitespace-normal py-2 text-left ${
              picked === t.id ? 'border-primary bg-primary/10 text-primary' : ''
            }`}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {tier && (
        <div className="glass-panel p-4 border border-primary/30 space-y-2">
          <div className="text-sm">
            <span className="text-muted-foreground">Coverage: </span>
            <span className="font-semibold text-foreground">{tier.coverage}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Evidence: </span>
            <span className="text-foreground">{tier.evidence}</span>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            Control basis (independent): NIST CSWP 48 (draft) maps migration capabilities to CSF 2.0
            / SP 800-53.
          </p>
        </div>
      )}
    </div>
  )
}
