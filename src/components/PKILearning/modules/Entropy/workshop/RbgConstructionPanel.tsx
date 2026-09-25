// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { ChevronDown, ChevronUp, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * SP 800-90C (final, September 2025) construction classes, from §2.2 and
 * Table 1. Kept consistent with quiz ent-007 and sourceAssessment.ts
 * (RbgConstructionPanel.test.tsx checks both).
 */
export const RBG_TYPES = [
  {
    name: 'RBG1',
    classes: ['RBG1'],
    title: 'DRBG seeded once from another RBG',
    description:
      'A DRBG with no entropy source of its own. SP 800-90C §2.2: it "does not have access to a randomness source after instantiation"; it is instantiated once over a physically secure channel from an external RBG2(P), RBG3 or root RBGC construction, does not support reseeding, cannot provide prediction resistance and cannot provide full-entropy output. It can seed subordinate DRBGs (sub-DRBGs).',
    section: 'SP 800-90C §2.2, §4',
    flow: 'External RBG2(P) / RBG3 / root RBGC → DRBG (instantiated once, never reseeded) → Output',
  },
  {
    name: 'RBG2(P) / RBG2(NP)',
    classes: ['RBG2(P)', 'RBG2(NP)'],
    title: 'DRBG with its own entropy sources',
    description:
      'One or more entropy sources instantiate the DRBG and may reseed it; prediction resistance is available when a reseed is performed. RBG2(P) uses a physical entropy source, RBG2(NP) a non-physical one. An RBG2 construction cannot provide full-entropy output.',
    section: 'SP 800-90C §2.2, §5',
    flow: 'Validated entropy source(s) → [optional conditioning] → DRBG → Output',
  },
  {
    name: 'RBG3(XOR) / RBG3(RS)',
    classes: ['RBG3(XOR)', 'RBG3(RS)'],
    title: 'Full-entropy output from physical entropy sources',
    description:
      'Includes one or more physical entropy sources and produces outputs with full entropy; prediction resistance is provided for all outputs. RBG3(XOR) XORs validated entropy-source output with the output of an instantiated, approved DRBG (§6.4). RBG3(RS) uses the entropy sources to provide seed material for the DRBG by continuously reseeding (§6.5).',
    section: 'SP 800-90C §2.2, §6',
    flow: 'RBG3(XOR): entropy-source output ⊕ DRBG output → Output · RBG3(RS): entropy source reseeds the DRBG → Output',
  },
  {
    name: 'RBGC',
    classes: ['RBGC'],
    title: 'Construction for DRBG trees',
    description:
      'Allows a tree of RBGs that consists only of RBGC constructions on the same computing platform. The root RBGC accesses an initial randomness source for instantiation and reseeding; a non-root RBGC obtains its seed material from its parent RBGC. Prediction resistance may be provided for the root, not for non-root RBGC constructions.',
    section: 'SP 800-90C §2.2, §7',
    flow: 'Randomness source → root RBGC → child RBGC → … (same platform)',
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
            SP 800-90C defines four classes of Random Bit Generator construction — RBG1, RBG2, RBG3
            and RBGC — and every one includes an SP 800-90A DRBG (§2.2). The source combining
            pipeline demonstrated below implements the{' '}
            <span className="font-medium text-foreground">
              source assembly (§3.1) and external conditioning (§3.2)
            </span>{' '}
            component of these architectures. A complete RBG construction would additionally include
            an SP 800-90A DRBG for pseudorandom bit generation.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            SP 800-90A Rev. 1 is the current final DRBG recommendation. NIST&apos;s SP 800-90A Rev.
            2 page is a pre-draft call for comments (published 2025-09-04, comments closed
            2025-11-04) announcing a planned SHAKE/XOF-based DRBG; no draft text exists, so no such
            mechanism is specified yet (status checked 2026-09-24).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
