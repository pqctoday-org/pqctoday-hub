// SPDX-License-Identifier: GPL-3.0-only
import { useState, useEffect } from 'react'
import { ArrowRight, FlaskConical, Network, Shuffle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PersonaId } from '@/data/learningPersonas'

const DISMISS_KEY = 'algorithms-entry-strip-dismissed'

interface AlgorithmEntryStripProps {
  persona: PersonaId | null
  /** Strip is hidden when the page was loaded with existing URL filter/tab state. */
  hasActiveParams: boolean
  onApply: (params: Record<string, string | null>) => void
}

interface Intent {
  label: string
  description: string
  icon: React.ReactNode
  params: Record<string, string | null>
}

const INTENTS: Intent[] = [
  {
    label: 'Replace a classical algorithm',
    description: 'Find the right PQC drop-in for RSA, ECC, or AES',
    icon: <Shuffle size={15} />,
    params: { tab: 'transition' },
  },
  {
    label: 'Understand PQC protocols',
    description: 'See TLS, SSH, and IKE standardization status',
    icon: <Network size={15} />,
    params: { tab: 'support' },
  },
  {
    label: 'Run a live test',
    description: 'Execute KAT vectors against real WASM implementations',
    icon: <FlaskConical size={15} />,
    params: { tab: 'detailed', section: 'kat' },
  },
]

const PERSONA_INTENTS: Partial<Record<PersonaId, Intent>> = {
  executive: {
    label: 'View top compliance picks',
    description: 'ML-KEM-768 and ML-DSA-65 — the FIPS-required choices for US federal compliance',
    icon: <ArrowRight size={15} />,
    params: {
      tab: 'detailed',
      highlight: 'ML-KEM-768,ML-DSA-65,SLH-DSA-SHA2-128s',
      section: 'security',
    },
  },
  developer: {
    label: 'Find a drop-in replacement',
    description: 'Transition table with key sizes, performance, and standardization status',
    icon: <Shuffle size={15} />,
    params: { tab: 'transition', status: 'Standardized' },
  },
  architect: {
    label: 'See protocol readiness',
    description: 'TLS, SSH, IKE, QUIC and more — IETF stage status across 4 PQC dimensions',
    icon: <Network size={15} />,
    params: { tab: 'support' },
  },
  researcher: {
    label: 'Run KAT validation',
    description: 'Execute ACVP-style vectors and cross-validate against WASM implementations',
    icon: <FlaskConical size={15} />,
    params: { tab: 'detailed', section: 'kat' },
  },
}

export function AlgorithmEntryStrip({
  persona,
  hasActiveParams,
  onApply,
}: AlgorithmEntryStripProps) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (dismissed) {
      try {
        sessionStorage.setItem(DISMISS_KEY, '1')
      } catch {
        // sessionStorage unavailable — degrade gracefully
      }
    }
  }, [dismissed])

  if (dismissed || hasActiveParams) return null

  const handleApply = (params: Record<string, string | null>) => {
    onApply(params)
    setDismissed(true)
  }

  const personaIntent = persona ? PERSONA_INTENTS[persona] : undefined

  return (
    <div className="glass-panel p-4 mb-4 relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setDismissed(true)}
        className="absolute top-2.5 right-2.5 p-1 h-auto text-muted-foreground hover:text-foreground hover:bg-muted/40"
        aria-label="Dismiss"
      >
        <X size={13} />
      </Button>

      {personaIntent ? (
        /* Known persona — single focused CTA */
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pr-6">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{personaIntent.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{personaIntent.description}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleApply(personaIntent.params)}
            className="shrink-0 flex items-center gap-1.5"
          >
            {personaIntent.icon}
            Go
          </Button>
        </div>
      ) : (
        /* Unknown persona — show 3 intent choices */
        <div className="pr-6">
          <p className="text-xs font-medium text-muted-foreground mb-3">
            What are you trying to do?
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            {INTENTS.map((intent) => (
              <Button
                key={intent.label}
                variant="ghost"
                size="sm"
                onClick={() => handleApply(intent.params)}
                className="flex-1 flex items-start gap-2.5 p-3 rounded-lg border border-border bg-muted/20 hover:bg-primary/5 hover:border-primary/30 transition-colors text-left group h-auto justify-start"
              >
                <span className="mt-0.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                  {intent.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-medium text-foreground">{intent.label}</span>
                  <span className="block text-[10px] text-muted-foreground mt-0.5 leading-tight">
                    {intent.description}
                  </span>
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
