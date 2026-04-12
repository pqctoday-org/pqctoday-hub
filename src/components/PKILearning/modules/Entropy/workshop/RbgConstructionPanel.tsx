// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { ChevronDown, ChevronUp, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'

const RBG_TYPES = [
  {
    name: 'RBG1 (NRBG)',
    title: 'Non-Deterministic RBG',
    description:
      'Entropy source output is directly conditioned and output. No DRBG is involved. Source combining occurs at the conditioning stage — multiple noise sources are combined before the conditioning function produces the final output.',
    section: 'SP 800-90C §4',
    flow: 'Noise Sources → Combine → Condition → Output',
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
            SP 800-90C defines three Random Bit Generator constructions that use combined entropy
            sources. The source combining pipeline demonstrated below implements the{' '}
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
