// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { ChevronDown, ChevronUp, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'

const RBG_TYPES = [
  {
    name: 'RBG1 (NRBG)',
    title: 'Non-Deterministic RBG',
    description:
      'Has no entropy source of its own — it IS a DRBG, but one instantiated exactly once from an external randomness source and never reseeded. Every output ultimately derives from that single external seed. Source combining, if any, happens upstream in whatever produced the external seed.',
    section: 'SP 800-90C §4',
    flow: 'External Seed → DRBG (instantiate once, never reseed) → Output',
  },
  {
    name: 'RBG2 (DRBG + Entropy)',
    title: 'DRBG Seeded by Entropy Source',
    description:
      'The most common construction. Combined entropy sources seed a DRBG (CTR_DRBG, HMAC_DRBG, Hash_DRBG, or XOF_DRBG). The DRBG stretches the seed into an arbitrary-length random stream. Reseeding refreshes entropy periodically.',
    section: 'SP 800-90C §5',
    flow: 'Noise Sources → Combine → Condition → DRBG Seed → DRBG → Output',
  },
  {
    name: 'RBG3 (NRBG + DRBG)',
    title: 'Defense-in-Depth Construction',
    description:
      'Combines an NRBG with a DRBG for maximum resilience. Even if the DRBG is compromised (e.g., state leakage), the NRBG contributes independent entropy. Source combining can occur at multiple points in the pipeline.',
    section: 'SP 800-90C §6',
    flow: 'NRBG Output ⊕ DRBG Output → Output',
  },
  {
    name: 'RBGC (Consolidated)',
    title: 'Consolidated RBG',
    description:
      'Added in the final SP 800-90C (Sept 2025). A single construction that can serve both prediction-resistant requests (fresh entropy consulted per-request, RBG1-like) and non-prediction-resistant requests (DRBG-stretched output between reseeds, RBG2-like) from the same underlying components, selected per-request rather than baked into a fixed pipeline.',
    section: 'SP 800-90C §7',
    flow: 'Noise Sources → Combine → Condition → (per-request: fresh output, or DRBG-stretched output)',
  },
] as const

export const RbgConstructionPanel = () => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="glass-panel p-4 border border-border">
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-primary" />
          <span className="text-sm font-semibold text-foreground">
            SP 800-90C RBG Construction Types
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp size={16} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={16} className="text-muted-foreground" />
        )}
      </Button>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            SP 800-90C defines four Random Bit Generator constructions (RBG1, RBG2, RBG3, RBGC). The
            source combining pipeline demonstrated below implements the{' '}
            <span className="font-medium text-foreground">
              source assembly (§3.1) and external conditioning (§3.2)
            </span>{' '}
            component of these architectures. A complete RBG construction would additionally include
            an SP 800-90A DRBG for pseudorandom bit generation.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {RBG_TYPES.map((rbg) => (
              <div key={rbg.name} className="bg-muted/30 rounded-lg p-3 border border-border">
                <div className="text-sm font-semibold text-foreground mb-1">{rbg.name}</div>
                <div className="text-xs font-medium text-primary mb-2">{rbg.title}</div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                  {rbg.description}
                </p>
                <div className="text-xs font-mono text-foreground/70 bg-muted/50 rounded px-2 py-1 mb-1">
                  {rbg.flow}
                </div>
                <div className="text-xs text-muted-foreground italic">{rbg.section}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
