// SPDX-License-Identifier: GPL-3.0-only
import { useCallback, useMemo, useState } from 'react'
import { CheckCircle2, ChevronDown, ExternalLink, Loader2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useHSM } from '@/hooks/useHSM'
import { runKAT, type KatTestSpec, type KATResult, type SlhDsaVariant } from '@/utils/katRunner'
import { ATTACK_PROFILES } from '@/data/implementationAttackProfiles'

const FIPS_203_URL = 'https://csrc.nist.gov/pubs/fips/203/final'
const FIPS_204_URL = 'https://csrc.nist.gov/pubs/fips/204/final'
const FIPS_205_URL = 'https://csrc.nist.gov/pubs/fips/205/final'

interface KATTileConfig {
  id: string
  name: string
  standard: string
  fipsUrl: string
  level: number
  specs: KatTestSpec[]
}

// Same real tile configs KATView.tsx's own ML_KEM_TILES/ML_DSA_TILES carry —
// replicated (hand-authored, non-computed literals pinned to fixed FIPS
// specs, same category as this session's other small step-scoped literals)
// rather than importing a desktop view file, per the mobile ESLint boundary.
const ML_KEM_TILES: KATTileConfig[] = [
  {
    id: 'mlkem-512',
    name: 'ML-KEM-512',
    standard: 'FIPS 203',
    fipsUrl: FIPS_203_URL,
    level: 1,
    specs: [
      {
        id: 'kat-algo-mlkem512-decap',
        useCase: 'ML-KEM-512 decapsulation',
        standard: 'FIPS 203',
        referenceUrl: FIPS_203_URL,
        kind: { type: 'mlkem-decap', variant: 512 },
      },
      {
        id: 'kat-algo-mlkem512-rt',
        useCase: 'ML-KEM-512 encap+decap round-trip',
        standard: 'FIPS 203',
        referenceUrl: FIPS_203_URL,
        kind: { type: 'mlkem-encap-roundtrip', variant: 512 },
      },
    ],
  },
  {
    id: 'mlkem-768',
    name: 'ML-KEM-768',
    standard: 'FIPS 203',
    fipsUrl: FIPS_203_URL,
    level: 3,
    specs: [
      {
        id: 'kat-algo-mlkem768-decap',
        useCase: 'ML-KEM-768 decapsulation',
        standard: 'FIPS 203',
        referenceUrl: FIPS_203_URL,
        kind: { type: 'mlkem-decap', variant: 768 },
      },
      {
        id: 'kat-algo-mlkem768-rt',
        useCase: 'ML-KEM-768 encap+decap round-trip',
        standard: 'FIPS 203',
        referenceUrl: FIPS_203_URL,
        kind: { type: 'mlkem-encap-roundtrip', variant: 768 },
      },
    ],
  },
  {
    id: 'mlkem-1024',
    name: 'ML-KEM-1024',
    standard: 'FIPS 203',
    fipsUrl: FIPS_203_URL,
    level: 5,
    specs: [
      {
        id: 'kat-algo-mlkem1024-decap',
        useCase: 'ML-KEM-1024 decapsulation',
        standard: 'FIPS 203',
        referenceUrl: FIPS_203_URL,
        kind: { type: 'mlkem-decap', variant: 1024 },
      },
      {
        id: 'kat-algo-mlkem1024-rt',
        useCase: 'ML-KEM-1024 encap+decap round-trip',
        standard: 'FIPS 203',
        referenceUrl: FIPS_203_URL,
        kind: { type: 'mlkem-encap-roundtrip', variant: 1024 },
      },
    ],
  },
]

const ML_DSA_TILES: KATTileConfig[] = [
  {
    id: 'mldsa-44',
    name: 'ML-DSA-44',
    standard: 'FIPS 204',
    fipsUrl: FIPS_204_URL,
    level: 2,
    specs: [
      {
        id: 'kat-algo-mldsa44-sigver',
        useCase: 'ML-DSA-44 signature verification',
        standard: 'FIPS 204',
        referenceUrl: FIPS_204_URL,
        kind: { type: 'mldsa-sigver', variant: 44 },
      },
      {
        id: 'kat-algo-mldsa44-rt',
        useCase: 'ML-DSA-44 sign+verify round-trip',
        standard: 'FIPS 204',
        referenceUrl: FIPS_204_URL,
        kind: { type: 'mldsa-functional', variant: 44 },
      },
    ],
  },
  {
    id: 'mldsa-65',
    name: 'ML-DSA-65',
    standard: 'FIPS 204',
    fipsUrl: FIPS_204_URL,
    level: 3,
    specs: [
      {
        id: 'kat-algo-mldsa65-sigver',
        useCase: 'ML-DSA-65 signature verification',
        standard: 'FIPS 204',
        referenceUrl: FIPS_204_URL,
        kind: { type: 'mldsa-sigver', variant: 65 },
      },
      {
        id: 'kat-algo-mldsa65-rt',
        useCase: 'ML-DSA-65 sign+verify round-trip',
        standard: 'FIPS 204',
        referenceUrl: FIPS_204_URL,
        kind: { type: 'mldsa-functional', variant: 65 },
      },
    ],
  },
  {
    id: 'mldsa-87',
    name: 'ML-DSA-87',
    standard: 'FIPS 204',
    fipsUrl: FIPS_204_URL,
    level: 5,
    specs: [
      {
        id: 'kat-algo-mldsa87-sigver',
        useCase: 'ML-DSA-87 signature verification',
        standard: 'FIPS 204',
        referenceUrl: FIPS_204_URL,
        kind: { type: 'mldsa-sigver', variant: 87 },
      },
      {
        id: 'kat-algo-mldsa87-rt',
        useCase: 'ML-DSA-87 sign+verify round-trip',
        standard: 'FIPS 204',
        referenceUrl: FIPS_204_URL,
        kind: { type: 'mldsa-functional', variant: 87 },
      },
    ],
  },
]

const SLH_DSA_VARIANTS: { value: SlhDsaVariant; label: string; level: number }[] = [
  { value: 'SHA2-128s', label: 'SHA2-128s', level: 1 },
  { value: 'SHA2-192s', label: 'SHA2-192s', level: 3 },
  { value: 'SHA2-256s', label: 'SHA2-256s', level: 5 },
  { value: 'SHAKE-128s', label: 'SHAKE-128s', level: 1 },
  { value: 'SHAKE-192s', label: 'SHAKE-192s', level: 3 },
  { value: 'SHAKE-256s', label: 'SHAKE-256s', level: 5 },
]

function KATTile({ config, hsm }: { config: KATTileConfig; hsm: ReturnType<typeof useHSM> }) {
  const [results, setResults] = useState<KATResult[]>([])
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRun = useCallback(async () => {
    setRunning(true)
    setError(null)
    setResults([])
    try {
      if (!hsm.isReady) await hsm.initialize()
      const M = hsm.moduleRef.current!
      const hSession = hsm.hSessionRef.current
      const out: KATResult[] = []
      for (const spec of config.specs) {
        out.push(await runKAT(M, hSession, spec))
        setResults([...out])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setRunning(false)
    }
  }, [hsm, config.specs])

  const passCount = results.filter((r) => r.status === 'pass').length
  const done = results.length === config.specs.length && !running

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12.5px] font-bold text-foreground">{config.name}</span>
        <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
          Level {config.level}
        </span>
      </div>
      <a
        href={config.fipsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-0.5 inline-flex items-center gap-1 text-[10.5px] font-mono text-muted-foreground"
      >
        {config.standard}
        <ExternalLink size={9} aria-hidden="true" />
      </a>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleRun}
        disabled={running}
        className="mt-2 h-9 w-full text-[11.5px]"
      >
        {running ? (
          <>
            <Loader2 size={13} className="mr-1.5 animate-spin" aria-hidden="true" />
            Running…
          </>
        ) : (
          'Run NIST KAT'
        )}
      </Button>

      {error && (
        <p className="mt-2 rounded bg-status-error/10 px-2 py-1.5 text-[10.5px] text-status-error">
          {error}
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-2 flex flex-col gap-1 border-t border-border pt-2">
          {results.map((r) => (
            <div key={r.id} className="flex items-start justify-between gap-2 text-[10.5px]">
              <span className="text-foreground/80">{r.useCase}</span>
              {r.status === 'pass' ? (
                <CheckCircle2
                  size={13}
                  className="shrink-0 text-status-success"
                  aria-label="pass"
                />
              ) : (
                <XCircle size={13} className="shrink-0 text-status-error" aria-label="fail" />
              )}
            </div>
          ))}
          {done && (
            <p
              className={cn(
                'text-[10.5px] font-semibold',
                passCount === results.length ? 'text-status-success' : 'text-status-error'
              )}
            >
              {passCount}/{results.length} passed
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function SLHDSATile({ hsm }: { hsm: ReturnType<typeof useHSM> }) {
  const [variant, setVariant] = useState<SlhDsaVariant>('SHA2-128s')
  const [results, setResults] = useState<KATResult[]>([])
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const level = SLH_DSA_VARIANTS.find((v) => v.value === variant)?.level ?? 1
  const spec: KatTestSpec = useMemo(
    () => ({
      id: `kat-algo-slhdsa-${variant}`,
      useCase: `SLH-DSA-${variant} sign+verify round-trip`,
      standard: 'FIPS 205',
      referenceUrl: FIPS_205_URL,
      kind: { type: 'slhdsa-functional', variant },
    }),
    [variant]
  )

  const handleRun = useCallback(async () => {
    setRunning(true)
    setError(null)
    setResults([])
    try {
      if (!hsm.isReady) await hsm.initialize()
      const M = hsm.moduleRef.current!
      const hSession = hsm.hSessionRef.current
      setResults([await runKAT(M, hSession, spec)])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setRunning(false)
    }
  }, [hsm, spec])

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12.5px] font-bold text-foreground">SLH-DSA</span>
        <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
          Level {level}
        </span>
      </div>
      <a
        href={FIPS_205_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-0.5 inline-flex items-center gap-1 text-[10.5px] font-mono text-muted-foreground"
      >
        FIPS 205
        <ExternalLink size={9} aria-hidden="true" />
      </a>

      <div className="-mx-3 mt-2 flex snap-x gap-1.5 overflow-x-auto px-3 pb-1">
        {SLH_DSA_VARIANTS.map((v) => (
          <Button
            key={v.value}
            type="button"
            variant="ghost"
            onClick={() => {
              setVariant(v.value)
              setResults([])
              setError(null)
            }}
            aria-pressed={variant === v.value}
            className={cn(
              'h-7 shrink-0 snap-start rounded-full border px-2.5 text-[10.5px] font-semibold',
              variant === v.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground'
            )}
          >
            {v.label}
          </Button>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleRun}
        disabled={running}
        className="mt-2 h-9 w-full text-[11.5px]"
      >
        {running ? (
          <>
            <Loader2 size={13} className="mr-1.5 animate-spin" aria-hidden="true" />
            Running…
          </>
        ) : (
          'Run NIST KAT'
        )}
      </Button>

      {error && (
        <p className="mt-2 rounded bg-status-error/10 px-2 py-1.5 text-[10.5px] text-status-error">
          {error}
        </p>
      )}

      {results.length > 0 &&
        results.map((r) => (
          <div
            key={r.id}
            className="mt-2 flex items-start justify-between gap-2 border-t border-border pt-2 text-[10.5px]"
          >
            <span className="text-foreground/80">{r.useCase}</span>
            {r.status === 'pass' ? (
              <CheckCircle2 size={13} className="shrink-0 text-status-success" aria-label="pass" />
            ) : (
              <XCircle size={13} className="shrink-0 text-status-error" aria-label="fail" />
            )}
          </div>
        ))}
    </div>
  )
}

const SEVERITY_TONE: Record<string, string> = {
  critical: 'text-status-error',
  high: 'text-status-error',
  medium: 'text-status-warning',
  low: 'text-muted-foreground',
}

/**
 * "Run a live test" / "Run KAT validation" (`?tab=validation&section=kat`).
 *
 * 2026-08-24 audit: same fall-through-to-desktop bug as the Protocol Matrix
 * screen. Real data/logic reused verbatim: runKAT()/useHSM() (`@/utils/
 * katRunner`, `@/hooks/useHSM`) — the exact same headless WASM KAT execution
 * KATView.tsx calls, not a reimplementation — and ATTACK_PROFILES
 * (`@/data/implementationAttackProfiles`, its own doc comment: "Pure data,
 * no UI imports, so consumers don't pull in the view component").
 *
 * Scope, confirmed with the user before building: desktop's 21 run-tiles
 * span 3 PQC groups (ML-KEM/ML-DSA/SLH-DSA, 7 tiles) and 4 classical-crypto
 * groups (AES/HMAC/classical signatures/KDF, 14 tiles) that exist for
 * parity, not because they're PQC-relevant. Mobile keeps only the 7 PQC
 * tiles — what "run a live test" is actually about on a PQC product — and
 * drops classical crypto plus the PKCS#11 diagnostics/HSM-key-inspector
 * panel (debug surface, not the pass/fail answer a reader taps in for).
 */
export function MobileKATValidationView() {
  const hsm = useHSM('rust')
  const [attacksOpen, setAttacksOpen] = useState(false)

  return (
    <div className="px-4 pb-4 pt-4">
      <h1 className="text-[17px] font-extrabold leading-tight text-foreground">Run a live test</h1>
      <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
        Pinned NIST known-answer-test vectors, run live in your browser via WASM — real crypto, not
        a simulation.
      </p>

      <p className="mb-1.5 mt-4 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        Key Encapsulation — ML-KEM (FIPS 203)
      </p>
      <div className="flex flex-col gap-2">
        {ML_KEM_TILES.map((c) => (
          <KATTile key={c.id} config={c} hsm={hsm} />
        ))}
      </div>

      <p className="mb-1.5 mt-4 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        Digital Signatures — ML-DSA (FIPS 204)
      </p>
      <div className="flex flex-col gap-2">
        {ML_DSA_TILES.map((c) => (
          <KATTile key={c.id} config={c} hsm={hsm} />
        ))}
      </div>

      <p className="mb-1.5 mt-4 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        Digital Signatures — SLH-DSA (FIPS 205)
      </p>
      <SLHDSATile hsm={hsm} />

      <div className="mt-4 border-t border-border pt-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setAttacksOpen((v) => !v)}
          aria-expanded={attacksOpen}
          className="flex h-auto w-full items-center justify-between gap-2 whitespace-normal rounded-lg border border-border bg-card px-3 py-2.5 text-left"
        >
          <span className="flex flex-col items-start">
            <span className="text-[12.5px] font-bold text-foreground">Implementation Attacks</span>
            <span className="text-[10.5px] text-muted-foreground">
              Side-channel and fault-injection reference, {ATTACK_PROFILES.length} algorithms
            </span>
          </span>
          <ChevronDown
            size={16}
            className={cn(
              'shrink-0 text-muted-foreground transition-transform',
              attacksOpen && 'rotate-180'
            )}
            aria-hidden="true"
          />
        </Button>
        {attacksOpen && (
          <div className="mt-2 flex flex-col gap-2">
            {ATTACK_PROFILES.map((p) => (
              <div key={p.algorithm} className="rounded-lg border border-border bg-card p-3">
                <p className="text-[12px] font-bold text-foreground">{p.algorithm}</p>
                <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted-foreground">
                  {p.summary}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {p.attacks
                    .filter((a) => a.status === 'yes')
                    .map((a) => (
                      <span
                        key={a.category}
                        className={cn(
                          'rounded bg-muted/50 px-1.5 py-0.5 text-[10px] font-semibold',
                          a.severity ? SEVERITY_TONE[a.severity] : 'text-muted-foreground'
                        )}
                      >
                        {a.category}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-4 border-t border-border pt-3 text-[10.5px] leading-relaxed text-muted-foreground">
        Classical-crypto KATs (AES, HMAC, classical signatures, key derivation) and the PKCS#11
        diagnostics/HSM key-inspector panel are on a laptop.
      </p>
    </div>
  )
}
