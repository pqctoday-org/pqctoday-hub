// SPDX-License-Identifier: GPL-3.0-only
import { useState, useEffect } from 'react'
import { ArrowRight, FlaskConical, Network, Shuffle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PersonaId } from '@/data/learningPersonas'
import type { Region } from '@/store/usePersonaStore'

const DISMISS_KEY = 'algorithms-entry-strip-dismissed'

interface AlgorithmEntryStripProps {
  persona: PersonaId | null
  region: Region | null
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

// Exported (ACCURACY-0705) so a drift-guard test can assert every literal
// `status:` value here is a real member of AlgorithmFilters' STATUS_ITEMS —
// this is exactly the class of bug that shipped a 'Standardized' value no
// filter enum recognised, silently producing a zero-result CTA.
export const INTENTS: Intent[] = [
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
    // KAT Validation lives on the Validation tab (moved from Detailed
    // Comparison) — see AlgorithmValidationView.tsx.
    params: { tab: 'validation', section: 'kat' },
  },
]

export const PERSONA_INTENTS: Partial<Record<PersonaId, Intent>> = {
  executive: {
    label: 'View top compliance picks',
    description: 'ML-KEM-768 and ML-DSA-65 — the FIPS-required choices for US federal compliance',
    icon: <ArrowRight size={15} />,
    params: {
      tab: 'detailed',
      highlight: 'ML-KEM-768,ML-DSA-65,SLH-DSA-SHA2-128s',
    },
  },
  developer: {
    label: 'Find a drop-in replacement',
    description: 'Transition table with key sizes, performance, and standardization status',
    icon: <Shuffle size={15} />,
    // ACCURACY-0705: 'Standardized' is not a value in STATUS_ITEMS
    // (AlgorithmFilters.tsx) — this was a zero-result dead end for every
    // Developer-persona user, since it's the persona's default entry CTA.
    // 'Certified' is the closest existing status (FIPS 203/204/205 finalized).
    params: { tab: 'transition', status: 'Certified' },
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
    params: { tab: 'validation', section: 'kat' },
  },
}

// bplus-programme WS4c (2026-08-07): the executive default above is a US/NIST
// FIPS claim, which is wrong to show unqualified to an EU visitor — BSI and
// ANSSI have their OWN, DIFFERENT positions, verified against their primary
// documents (both cached in pqctoday-priv/local-evidence-cache/library/):
// BSI-TR-02102-1.pdf (2026-01 ed.) and ANSSI-PG-083-v3-2026.pdf. They are
// shown as two separate entries, never merged into one line, because they
// disagree on more than the "which alternate" question:
//   - BSI: ML-KEM/ML-DSA are listed as suitable standalone (no hybrid
//     language in their sections). SLH-DSA is recommended ONLY at NIST
//     Category 3/5 (192-/256-bit) — Category 1 (128-bit) is absent from its
//     recommended-parameters table. Two hybrid-mode conservative KEM
//     alternates are named: FrodoKEM-976/1344 and Classic McEliece
//     (460896/6688128/8192128).
//   - ANSSI: explicit rule — "used without hybridization, regardless of
//     parameter set, ML-KEM/ML-DSA do not respect RègleSécuAsym." Standalone
//     PQC is not compliant for these two mechanisms at all. SLH-DSA is the
//     one exception ANSSI calls out as compliant standalone, with no
//     category restriction stated. Its named hybrid KEM alternate is
//     FrodoKEM-976 only — Classic McEliece appears nowhere in the document
//     (checked: zero matches for "McEliece" or "Goppa").
// Drift-guarded in AlgorithmEntryStrip.driftguard.test.ts against a
// hand-verified allowlist transcribed from BSI's own recommended-parameter
// tables, so a future edit can't silently attribute an unverified algorithm
// to either authority.
export const EU_EXECUTIVE_INTENTS: Intent[] = [
  {
    label: 'BSI (Germany)',
    description:
      'ML-KEM-768 and ML-DSA-65 usable standalone; SLH-DSA recommended at 192-bit+, not 128; FrodoKEM-976 or Classic McEliece for hybrid high-assurance',
    icon: <ArrowRight size={15} />,
    params: {
      tab: 'detailed',
      highlight: 'ML-KEM-768,ML-DSA-65,SLH-DSA-SHA2-192s,FrodoKEM-976,Classic-McEliece-6688128',
    },
  },
  {
    label: 'ANSSI (France)',
    description:
      'ML-KEM-768 and ML-DSA-65 require hybridization with a classical algorithm — no standalone PQC yet; SLH-DSA is usable alone; FrodoKEM-976 is the hybrid pick',
    icon: <ArrowRight size={15} />,
    params: {
      tab: 'detailed',
      highlight: 'ML-KEM-768,ML-DSA-65,SLH-DSA-SHA2-128s,FrodoKEM-976',
    },
  },
]

export function AlgorithmEntryStrip({
  persona,
  region,
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

  // EU: BSI and ANSSI diverge (see the comment above EU_EXECUTIVE_INTENTS), so
  // the executive persona gets both entries, distinctly labeled, instead of
  // one line that would have to pick a side or blur the disagreement.
  const personaIntents: Intent[] | undefined =
    persona === 'executive' && region === 'eu'
      ? EU_EXECUTIVE_INTENTS
      : persona && PERSONA_INTENTS[persona]
        ? [PERSONA_INTENTS[persona]]
        : undefined

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

      {personaIntents ? (
        /* Known persona — one or more focused CTAs (EU: BSI + ANSSI, shown separately) */
        <div className="flex flex-col gap-3 pr-6">
          {personaIntents.map((intent) => (
            <div key={intent.label} className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{intent.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{intent.description}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleApply(intent.params)}
                className="shrink-0 flex items-center gap-1.5"
              >
                {intent.icon}
                Go
              </Button>
            </div>
          ))}
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
