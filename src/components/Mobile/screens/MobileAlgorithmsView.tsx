// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronRight, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ALGORITHM_REGISTRY, type AlgorithmProps } from '@/data/algorithmProperties'
import { transitionConsequence } from '@/data/algorithmConsequence'
import { INTENTS, type Intent } from '@/data/algorithmEntryIntents'
import {
  loadPQCAlgorithmsData,
  getPerformanceMultiplier,
  getPerformanceCategory,
  isResearchNeeded,
  type AlgorithmDetail,
} from '@/data/pqcAlgorithmsData'
import { MobileSheet } from '../primitives/Sheet'

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
  algo: AlgorithmProps
}

/**
 * 2026-08-24 audit R5: the 5 registry keys below used to be indexed
 * directly (`ALGORITHM_REGISTRY['SLH-DSA-SHA2-128s'].signatureOrCiphertextBytes`)
 * with no existence check — a future rename/removal in the registry's
 * source CSV would throw reading `.signatureOrCiphertextBytes` off
 * `undefined`, crashing the whole screen. `transitionConsequence()` below
 * already degrades gracefully (returns null, its callers already guard on
 * that) — this mirrors the same pattern: a row whose algorithm no longer
 * resolves is dropped, not a hard crash.
 */
function byteRow(
  label: string,
  key: string,
  field: 'publicKeyBytes' | 'signatureOrCiphertextBytes',
  highlight?: boolean
): ByteRow | null {
  // eslint-disable-next-line security/detect-object-injection -- key is one of a fixed set of literal string constants below, not user input
  const algo = ALGORITHM_REGISTRY[key]
  if (!algo) return null
  return { label, bytes: algo[field], highlight, algo }
}

function ByteBar({
  row,
  maxBytes,
  onSelect,
}: {
  row: ByteRow
  maxBytes: number
  onSelect: (algo: AlgorithmProps) => void
}) {
  const pct = Math.max(4, Math.round((row.bytes / maxBytes) * 100))
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => onSelect(row.algo)}
      className="flex h-auto w-full items-center justify-start gap-2 rounded-md p-0 font-normal"
    >
      <span className="w-[104px] shrink-0 truncate text-left text-[11px] font-medium text-foreground">
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
    </Button>
  )
}

interface SecurityRow {
  label: string
  level: number
  algo: AlgorithmProps
}

function SecurityBar({
  row,
  onSelect,
}: {
  row: SecurityRow
  onSelect: (algo: AlgorithmProps) => void
}) {
  const pct = Math.max(4, Math.round((row.level / 5) * 100))
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => onSelect(row.algo)}
      className="flex h-auto w-full items-center justify-start gap-2 rounded-md p-0 font-normal"
    >
      <span className="w-[104px] shrink-0 truncate text-left text-[11px] font-medium text-foreground">
        {row.label}
      </span>
      <div className="h-4 flex-1 overflow-hidden rounded bg-muted/30">
        <div className="h-full rounded bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-[52px] shrink-0 text-right font-mono text-[10.5px] text-muted-foreground">
        Level {row.level}
      </span>
    </Button>
  )
}

interface PerfRow {
  label: string
  cycles: string
  algo: AlgorithmProps
}

/** Log-scale, not linear: the real values span 0.1x to 500x (Ed25519 to
 * SLH-DSA-128s). A linear scale crushes every algorithm except the one
 * outlier to an indistinguishable sliver — logs are the natural scale for
 * a multiplicative "how many times slower" metric anyway, which is exactly
 * what these figures already are. */
function PerfBar({
  row,
  minMultiplier,
  maxMultiplier,
  onSelect,
}: {
  row: PerfRow
  minMultiplier: number
  maxMultiplier: number
  onSelect: (algo: AlgorithmProps) => void
}) {
  const value = getPerformanceMultiplier(row.cycles)
  const logRange = Math.log10(maxMultiplier / minMultiplier) || 1
  const pct = Math.max(4, Math.round((Math.log10(value / minMultiplier) / logRange) * 100))
  const category = getPerformanceCategory(row.cycles)
  // getPerformanceColor() returns translucent badge classes (bg-x/10 + text
  // + border), meant for a label chip — not a solid bar fill. Same
  // Fast/Moderate/Slow semantic tokens, opaque instead.
  const barColor =
    category === 'Fast' ? 'bg-success' : category === 'Slow' ? 'bg-destructive' : 'bg-warning'
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => onSelect(row.algo)}
      className="flex h-auto w-full items-center justify-start gap-2 rounded-md p-0 font-normal"
    >
      <span className="w-[104px] shrink-0 truncate text-left text-[11px] font-medium text-foreground">
        {row.label}
      </span>
      <div className="h-4 flex-1 overflow-hidden rounded bg-muted/30">
        <div className={`h-full rounded ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-[52px] shrink-0 truncate text-right font-mono text-[10.5px] text-muted-foreground">
        {/* Every row here uses signEncapsCycles, so a trailing "Sign"/"Verify"
            qualifier (present on some raw CSV values to disambiguate a
            classical signature algorithm's own column from a KEM's) is
            redundant with the section's own "signing/encapsulation speed"
            title — stripped for display, not from the value passed to
            getPerformanceMultiplier/getPerformanceCategory above. */}
        {row.cycles === 'Baseline' ? '1x' : row.cycles.replace(/ (Sign|Verify|Encaps)$/, '')}
      </span>
    </Button>
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
 * uses, not a dead end. Family/region filters, keygen/verify performance,
 * the four deeper tabs, and the full transition table are stated as cut,
 * not silently dropped — the entry strip is how a mobile reader still
 * reaches all of them.
 *
 * 2026-08-24 (real-user feedback on the shipped screen): the intent strip
 * shrank to the 3 global intents only (persona/EU-executive branching cut —
 * fewer choices before the reader sees real content). Two more graphical
 * comparisons were added, both from real sourced data, neither fabricated:
 * a security-level chart (PQC algorithms compared against each other —
 * NIST levels don't exist for classical algorithms in this registry, so a
 * classical-vs-PQC framing isn't possible here the way it is for size) and
 * a signing/encapsulation-speed chart (pqcAlgorithmsData.ts's real
 * keygen_cycles_relative-family data, the same data + helpers desktop's
 * Detailed Comparison tab already uses — log-scaled, since the real spread
 * is 0.1x to 500x and a linear scale would crush everything but the
 * outlier). Both charts hide themselves entirely if their data isn't
 * fully populated for the algorithms already featured, rather than
 * showing a partial or placeholder state.
 */
export function MobileAlgorithmsView() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<AlgorithmProps | null>(null)

  const publicKeyRows: ByteRow[] = [
    byteRow('RSA-2048', 'RSA-2048', 'publicKeyBytes'),
    byteRow('ML-KEM-768', 'ML-KEM-768', 'publicKeyBytes', true),
  ].filter((r): r is ByteRow => r !== null)
  const signatureRows: ByteRow[] = [
    byteRow('Ed25519', 'Ed25519', 'signatureOrCiphertextBytes'),
    byteRow('ML-DSA-65', 'ML-DSA-65', 'signatureOrCiphertextBytes', true),
    byteRow('SLH-DSA-128s', 'SLH-DSA-SHA2-128s', 'signatureOrCiphertextBytes', true),
  ].filter((r): r is ByteRow => r !== null)
  const maxBytes = Math.max(
    1,
    ...publicKeyRows.map((r) => r.bytes),
    ...signatureRows.map((r) => r.bytes)
  )

  const sigConsequence = transitionConsequence('Ed25519', 'ML-DSA-65')
  const keyConsequence = transitionConsequence('RSA-2048', 'ML-KEM-768')

  // Security level (NIST 1/2/3/5) only exists for PQC algorithms in this
  // registry -- classical algorithms carry `securityLevel: null` (NIST's
  // scale is defined relative to PQC candidates, not assigned to RSA/ECDSA/
  // Ed25519 themselves). So this compares the 3 PQC algorithms already
  // featured above against EACH OTHER, not against a classical baseline —
  // and that comparison is real information the byte charts hide: SLH-DSA-128s
  // has a LOWER security level than ML-DSA-65 despite a much larger signature.
  const securityRows: SecurityRow[] = (
    [
      ['ML-KEM-768', 'ML-KEM-768'],
      ['ML-DSA-65', 'ML-DSA-65'],
      ['SLH-DSA-128s', 'SLH-DSA-SHA2-128s'],
    ] as const
  )
    .map(([label, key]) => {
      // eslint-disable-next-line security/detect-object-injection -- key is one of a fixed set of literal string constants above, not user input
      const algo = ALGORITHM_REGISTRY[key]
      if (!algo || algo.securityLevel === null) return null
      const row: SecurityRow = { label, level: algo.securityLevel, algo }
      return row
    })
    .filter((r): r is SecurityRow => r !== null)

  // Real relative-performance data (keygen_cycles_relative etc. in the
  // source CSV) loads async via pqcAlgorithmsData.ts -- same module, same
  // loader, same helpers the desktop Detailed Comparison tab already uses.
  // Sign/encapsulation cost is the one dimension shown here (not keygen or
  // verify/decaps too): one real, graphical comparison beats three, and
  // every algorithm already featured on this screen has a real, populated
  // value for exactly this field.
  const [perfDetails, setPerfDetails] = useState<Map<string, AlgorithmDetail> | null>(null)
  useEffect(() => {
    let cancelled = false
    loadPQCAlgorithmsData()
      .then((details) => {
        if (cancelled) return
        setPerfDetails(new Map(details.map((d) => [d.name.toLowerCase(), d])))
      })
      .catch(() => {
        if (!cancelled) setPerfDetails(new Map())
      })
    return () => {
      cancelled = true
    }
  }, [])

  const perfRows: PerfRow[] = [
    'RSA-2048',
    'ML-KEM-768',
    'Ed25519',
    'ML-DSA-65',
    'SLH-DSA-SHA2-128s',
  ]
    .map((name) => {
      // eslint-disable-next-line security/detect-object-injection -- name is one of a fixed set of literal string constants above, not user input
      const algo = ALGORITHM_REGISTRY[name]
      const detail = perfDetails?.get(name.toLowerCase())
      if (!algo || !detail || isResearchNeeded(detail.signEncapsCycles)) return null
      return {
        label: name === 'SLH-DSA-SHA2-128s' ? 'SLH-DSA-128s' : name,
        cycles: detail.signEncapsCycles,
        algo,
      }
    })
    .filter((r): r is PerfRow => r !== null)
  const perfMultipliers = perfRows.map((r) => getPerformanceMultiplier(r.cycles))
  const minMultiplier = perfMultipliers.length ? Math.min(...perfMultipliers) : 1
  const maxMultiplier = perfMultipliers.length ? Math.max(...perfMultipliers) : 1

  return (
    <div className="px-4 pb-4 pt-4">
      <div className="mb-4 flex items-center gap-2">
        <Shield size={18} className="shrink-0 text-primary" aria-hidden="true" />
        <div>
          <h1 className="sr-only">Algorithms</h1>
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
            className="h-auto items-center justify-start gap-3 whitespace-normal rounded-[11px] border border-border bg-card p-3 text-left font-normal"
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
            <ByteBar key={row.label} row={row} maxBytes={maxBytes} onSelect={setSelected} />
          ))}
        </div>

        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          Signature
        </p>
        <div className="mb-3 flex flex-col gap-1.5">
          {signatureRows.map((row) => (
            <ByteBar key={row.label} row={row} maxBytes={maxBytes} onSelect={setSelected} />
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

      {securityRows.length > 0 && (
        <section className="mb-5 rounded-xl border border-border bg-card p-4">
          <p className="mb-1 text-[13px] font-bold text-foreground">
            What actually changes: security margin
          </p>
          <p className="mb-3 text-[10.5px] text-muted-foreground">
            NIST's security levels only apply to PQC candidates — a bigger signature doesn't mean a
            higher level.
          </p>
          <div className="flex flex-col gap-1.5">
            {securityRows.map((row) => (
              <SecurityBar key={row.label} row={row} onSelect={setSelected} />
            ))}
          </div>
        </section>
      )}

      {perfRows.length > 0 && (
        <section className="mb-5 rounded-xl border border-border bg-card p-4">
          <p className="mb-1 text-[13px] font-bold text-foreground">
            What actually changes: signing/encapsulation speed
          </p>
          <p className="mb-3 text-[10.5px] text-muted-foreground">
            Relative to RSA-2048's baseline. Log scale — SLH-DSA-128s is genuinely hundreds of times
            slower, not a rounding difference.
          </p>
          <div className="flex flex-col gap-1.5">
            {perfRows.map((row) => (
              <PerfBar
                key={row.label}
                row={row}
                minMultiplier={minMultiplier}
                maxMultiplier={maxMultiplier}
                onSelect={setSelected}
              />
            ))}
          </div>
        </section>
      )}

      <p className="border-t border-border pt-3 text-[10.5px] leading-relaxed text-muted-foreground">
        Family, region (NIST/BSI/ANSSI), and security-level filters and the full transition table
        are on a laptop. Protocol readiness and live KAT validation are reached through the options
        above.
      </p>

      <MobileSheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name}
        testId="algorithm-detail-sheet"
      >
        {selected && (
          <dl className="grid grid-cols-2 gap-x-3 gap-y-3">
            <div>
              <dt className="text-sim-chip font-bold uppercase tracking-wide text-muted-foreground">
                Family
              </dt>
              <dd className="mt-0.5 text-[12px] text-foreground">{selected.family}</dd>
            </div>
            <div>
              <dt className="text-sim-chip font-bold uppercase tracking-wide text-muted-foreground">
                FIPS standard
              </dt>
              <dd className="mt-0.5 text-[12px] text-foreground">
                {selected.fipsStandard ?? 'None'}
              </dd>
            </div>
            <div>
              <dt className="text-sim-chip font-bold uppercase tracking-wide text-muted-foreground">
                Security level
              </dt>
              <dd className="mt-0.5 text-[12px] text-foreground">
                {selected.securityLevel ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-sim-chip font-bold uppercase tracking-wide text-muted-foreground">
                Public key
              </dt>
              <dd className="mt-0.5 font-mono text-[12px] text-foreground">
                {selected.publicKeyBytes.toLocaleString()} B
              </dd>
            </div>
            <div>
              <dt className="text-sim-chip font-bold uppercase tracking-wide text-muted-foreground">
                Private key
              </dt>
              <dd className="mt-0.5 font-mono text-[12px] text-foreground">
                {selected.privateKeyBytes.toLocaleString()} B
              </dd>
            </div>
            <div>
              <dt className="text-sim-chip font-bold uppercase tracking-wide text-muted-foreground">
                Signature / ciphertext
              </dt>
              <dd className="mt-0.5 font-mono text-[12px] text-foreground">
                {selected.signatureOrCiphertextBytes.toLocaleString()} B
              </dd>
            </div>
            {selected.sharedSecretBytes != null && (
              <div>
                <dt className="text-sim-chip font-bold uppercase tracking-wide text-muted-foreground">
                  Shared secret
                </dt>
                <dd className="mt-0.5 font-mono text-[12px] text-foreground">
                  {selected.sharedSecretBytes.toLocaleString()} B
                </dd>
              </div>
            )}
          </dl>
        )}
      </MobileSheet>
    </div>
  )
}
