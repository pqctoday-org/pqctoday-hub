// SPDX-License-Identifier: GPL-3.0-only
import { useNavigate } from 'react-router'
import { ChevronRight, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePersonaStore } from '@/store/usePersonaStore'
import { ALGORITHM_REGISTRY } from '@/data/algorithmProperties'
import { transitionConsequence } from '@/data/algorithmConsequence'
import {
  INTENTS,
  PERSONA_INTENTS,
  EU_EXECUTIVE_INTENTS,
  type Intent,
} from '@/data/algorithmEntryIntents'

function intentHref(params: Intent['params']): string {
  const query = Object.entries(params)
    .filter((entry): entry is [string, string] => entry[1] != null)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&')
  return `/algorithms?${query}`
}

interface ByteRow {
  label: string
  bytes: number
  highlight?: boolean
}

function ByteBar({ row, maxBytes }: { row: ByteRow; maxBytes: number }) {
  const pct = Math.max(4, Math.round((row.bytes / maxBytes) * 100))
  return (
    <div className="flex items-center gap-2">
      <span className="w-[104px] shrink-0 truncate text-[11px] font-medium text-foreground">
        {row.label}
      </span>
      <div className="h-4 flex-1 overflow-hidden rounded bg-muted/30">
        <div
          className={
            row.highlight ? 'h-full rounded bg-primary' : 'h-full rounded bg-muted-foreground/40'
          }
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-[52px] shrink-0 text-right font-mono text-[10.5px] text-muted-foreground">
        {row.bytes.toLocaleString()} B
      </span>
    </div>
  )
}

/**
 * Mobile Algorithms (handoff Phase 7 — Reference set, design handoff §19).
 * Source: algorithmEntryIntents.tsx (E-3, already pure-moved for exactly
 * this reuse), algorithmProperties.ts, algorithmConsequence.ts. Confirmed
 * with the user to build fresh rather than reuse the pre-existing
 * MobileAlgorithmList.tsx/MobileTransitionWizard.tsx (real, phone-tested,
 * but scoped only to the Transition Guide tab and built outside the
 * isMobileShell pattern Timeline/Threats use).
 *
 * Two real corrections against the README's own §19 numbers, made before
 * writing any UI (Phase 0's "correct the handoff in place" spirit):
 * - "ECDSA 72 B" does not exist anywhere in `ALGORITHM_REGISTRY` or its
 *   source CSV (real ECDSA P-256 is 64 B, identical to Ed25519's raw r‖s
 *   signature convention this codebase uses) — dropped rather than typed.
 * - "RSA-2048 256 B" is real, but it's `signatureOrCiphertextBytes`
 *   (RSA-2048's real `publicKeyBytes` is 270), not the public-key figure
 *   the mockup implies. Both groups below use the correctly-labeled field.
 * - The README's 45×/120× growth factors (and the plan doc's own
 *   corrected 46×/123×) don't reconcile against any single real baseline
 *   in the registry — `transitionConsequence()` computes the real number
 *   live instead of typing any of them.
 *
 * Entry-strip taps navigate to a real desktop tab (?tab=...) in mobile
 * chrome — same "not yet distilled" pattern every other unbuilt section
 * uses, not a dead end. Family/region/security-level filters, the four
 * deeper tabs, and the full transition table are stated as cut, not
 * silently dropped — the entry strip is how a mobile reader still reaches
 * all of them.
 */
export function MobileAlgorithmsView() {
  const navigate = useNavigate()
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const selectedRegion = usePersonaStore((s) => s.selectedRegion)

  const personaIntents: Intent[] | undefined =
    selectedPersona === 'executive' && selectedRegion === 'eu'
      ? EU_EXECUTIVE_INTENTS
      : selectedPersona && PERSONA_INTENTS[selectedPersona]
        ? [PERSONA_INTENTS[selectedPersona]]
        : undefined

  const publicKeyRows: ByteRow[] = [
    { label: 'RSA-2048', bytes: ALGORITHM_REGISTRY['RSA-2048'].publicKeyBytes },
    {
      label: 'ML-KEM-768',
      bytes: ALGORITHM_REGISTRY['ML-KEM-768'].publicKeyBytes,
      highlight: true,
    },
  ]
  const signatureRows: ByteRow[] = [
    { label: 'Ed25519', bytes: ALGORITHM_REGISTRY['Ed25519'].signatureOrCiphertextBytes },
    {
      label: 'ML-DSA-65',
      bytes: ALGORITHM_REGISTRY['ML-DSA-65'].signatureOrCiphertextBytes,
      highlight: true,
    },
    {
      label: 'SLH-DSA-128s',
      bytes: ALGORITHM_REGISTRY['SLH-DSA-SHA2-128s'].signatureOrCiphertextBytes,
      highlight: true,
    },
  ]
  const maxBytes = Math.max(
    ...publicKeyRows.map((r) => r.bytes),
    ...signatureRows.map((r) => r.bytes)
  )

  const sigConsequence = transitionConsequence('Ed25519', 'ML-DSA-65')
  const keyConsequence = transitionConsequence('RSA-2048', 'ML-KEM-768')

  return (
    <div className="px-4 pb-24 pt-4">
      <div className="mb-4 flex items-center gap-2">
        <Shield size={18} className="shrink-0 text-primary" aria-hidden="true" />
        <div>
          <h1 className="text-[17px] font-extrabold leading-tight text-foreground">Algorithms</h1>
          <p className="text-[11.5px] text-muted-foreground">
            {Object.keys(ALGORITHM_REGISTRY).length} tracked
          </p>
        </div>
      </div>

      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        What brings you here?
      </p>
      <div className="mb-5 flex flex-col gap-2">
        {INTENTS.map((intent) => (
          <Button
            key={intent.label}
            type="button"
            variant="ghost"
            onClick={() => navigate(intentHref(intent.params))}
            className="h-auto items-center justify-start gap-3 rounded-[11px] border border-border bg-card p-3 text-left font-normal"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-bold text-foreground">{intent.label}</span>
              <span className="block text-[11px] leading-snug text-muted-foreground">
                {intent.description}
              </span>
            </span>
            <ChevronRight size={15} className="shrink-0 text-muted-foreground" aria-hidden="true" />
          </Button>
        ))}
        {personaIntents?.map((intent) => (
          <Button
            key={intent.label}
            type="button"
            variant="ghost"
            onClick={() => navigate(intentHref(intent.params))}
            className="h-auto items-center justify-start gap-3 rounded-[11px] border border-primary/30 bg-primary/5 p-3 text-left font-normal"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-bold text-foreground">{intent.label}</span>
              <span className="block text-[11px] leading-snug text-muted-foreground">
                {intent.description}
              </span>
            </span>
            <ChevronRight size={15} className="shrink-0 text-muted-foreground" aria-hidden="true" />
          </Button>
        ))}
      </div>

      <section className="mb-5 rounded-xl border border-border bg-card p-4">
        <p className="mb-1 text-[13px] font-bold text-foreground">What actually changes: size</p>
        <p className="mb-3 text-[10.5px] text-muted-foreground">
          Same shared scale across both groups, so keys and signatures compare directly.
        </p>

        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          Public key
        </p>
        <div className="mb-3 flex flex-col gap-1.5">
          {publicKeyRows.map((row) => (
            <ByteBar key={row.label} row={row} maxBytes={maxBytes} />
          ))}
        </div>

        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          Signature
        </p>
        <div className="mb-3 flex flex-col gap-1.5">
          {signatureRows.map((row) => (
            <ByteBar key={row.label} row={row} maxBytes={maxBytes} />
          ))}
        </div>

        {sigConsequence && (
          <p className="text-[11.5px] text-foreground/90">{sigConsequence.sentence}</p>
        )}
        {keyConsequence && (
          <p className="mt-1 text-[11.5px] text-foreground/90">{keyConsequence.sentence}</p>
        )}
        <p className="mt-2 text-[10.5px] text-muted-foreground">
          That growth is why certificate chains and firmware headers are where migrations stall.
        </p>
      </section>

      <p className="border-t border-border pt-3 text-[10.5px] leading-relaxed text-muted-foreground">
        Family, region (NIST/BSI/ANSSI), and security-level filters, the full transition table, and
        KAT WASM validation are reached through the options above, or on a laptop.
      </p>
    </div>
  )
}
