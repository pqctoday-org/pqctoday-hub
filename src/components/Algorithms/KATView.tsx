// SPDX-License-Identifier: GPL-3.0-only
import { useState, useMemo, useCallback } from 'react'
import {
  Shield,
  Lock,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
  Terminal,
  ShieldCheck,
  KeyRound,
  Hash,
  PenTool,
  Waypoints,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
import { useHSM, type HsmKey } from '@/hooks/useHSM'
import { ValidationDisclaimer, KatEvidenceChip } from '@/components/shared/ValidationDisclaimer'
import { runKAT, advertisedMechanisms, summarizeKatResults } from '@/utils/katRunner'
import type { KatTestSpec, KATResult, SlhDsaVariant } from '@/utils/katRunner'
import {
  KAT_EVIDENCE_META,
  evidenceForKind,
  evidenceRecordsForKind,
  katActionLabel,
  sourceForKind,
} from '@/utils/katEvidence'
import { CaseEvidenceBadge } from '@/components/shared/CaseEvidenceBadge'
import { KatStatusBadge } from '@/components/shared/KatStatusBadge'
import type { UseHSMResult } from '@/hooks/useHSM'
import {
  type KATTileConfig,
  ML_KEM_TILES,
  ML_DSA_TILES,
  AES_TILES,
  HMAC_HASH_TILES,
  CLASSICAL_SIG_TILES,
  KDF_TILES,
  SLH_DSA_DROPDOWN_ITEMS,
  FIPS_205_URL,
} from './katTileConfig'

/** Render security level badge text — "Level X" for PQC (1-5), "X-bit" for classical */
function levelLabel(n: number): string {
  return n <= 5 ? `Level ${n}` : `${n}-bit`
}

// ── Run summary: skips are their own count, never passes ───────────────────

const KatCounts: React.FC<{ counts: ReturnType<typeof summarizeKatResults> }> = ({ counts }) => {
  const ran = counts.total - counts.skip
  const ok = counts.fail + counts.error === 0
  return (
    <span data-testid="kat-counts" className={ok ? 'text-status-success' : 'text-status-error'}>
      {counts.pass}/{ran} passed
      {counts.skip > 0 && <span className="text-status-warning"> · {counts.skip} not tested</span>}
    </span>
  )
}

// ── Results table (shared by all tiles) ─────────────────────────────────────

const ResultsTable: React.FC<{ results: KATResult[]; specs: readonly KatTestSpec[] }> = ({
  results,
  specs,
}) => (
  <div className="overflow-x-auto rounded-lg border border-border">
    <table className="w-full text-xs text-left">
      <thead>
        <tr className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider">
          <th className="sticky left-0 z-10 bg-background px-3 py-2 font-semibold">Use Case</th>
          <th className="px-3 py-2 font-semibold">Algorithm</th>
          <th className="px-3 py-2 font-semibold">Evidence</th>
          <th className="px-3 py-2 font-semibold">Status</th>
          <th className="px-3 py-2 font-semibold">Details</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/40">
        {results.map((r) => (
          <tr key={r.id} className="hover:bg-muted/20 transition-colors">
            <td className="sticky left-0 z-10 bg-background px-3 py-2 font-medium text-foreground">
              {r.useCase}
            </td>
            <td className="px-3 py-2 font-mono text-foreground">{r.algorithm}</td>
            <td className="px-3 py-2 min-w-[9rem]">
              {(() => {
                const spec = specs.find((s) => s.id === r.id)
                const records = spec ? evidenceRecordsForKind(spec.kind) : []
                return records.length > 0 ? (
                  <CaseEvidenceBadge records={records} />
                ) : (
                  <KatEvidenceChip evidence={r.evidence} />
                )
              })()}
            </td>
            <td className="px-3 py-2">
              <KatStatusBadge status={r.status} />
            </td>
            <td className="px-3 py-2 text-muted-foreground">{r.details}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

// ── Tile components ─────────────────────────────────────────────────────────

interface KATTileProps {
  config: KATTileConfig
  hsm: UseHSMResult
}

const KATTile: React.FC<KATTileProps> = ({ config, hsm }) => {
  const [results, setResults] = useState<KATResult[]>([])
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultsOpen, setResultsOpen] = useState(false)

  const counts = summarizeKatResults(results)
  const done = results.length === config.specs.length && !running
  const specs = config.specs
  // Only a spec that actually reads a NIST ACVP-Server file earns a link to
  // one — and it is that file's own pinned upstream URL, not a folder guess.
  const referenceSampleUrl = config.specs
    .filter((s) => evidenceForKind(s.kind) === 'nist-acvp-reference-sample')
    .map((s) => sourceForKind(s.kind)?.url)
    .find(Boolean)

  const handleRun = useCallback(async () => {
    setRunning(true)
    setError(null)
    setResults([])
    setResultsOpen(true)
    try {
      if (!hsm.isReady) await hsm.initialize()
      const M = hsm.moduleRef.current!
      const hSession = hsm.hSessionRef.current
      const advertised = advertisedMechanisms(M, hsm.slotRef.current)
      const out: KATResult[] = []
      for (const spec of config.specs) {
        const r = await runKAT(M, hSession, spec, { advertised })
        out.push(r)
        setResults([...out])
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setRunning(false)
    }
  }, [hsm, config.specs])

  return (
    <div className="border border-border rounded-lg p-5 bg-muted/30 hover:border-primary/50 transition-colors space-y-4">
      <div className="flex items-start justify-between">
        <h5 className="font-semibold text-foreground text-lg">{config.name}</h5>
        <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary border border-primary/30">
          {levelLabel(config.securityLevel)}
        </span>
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Standard</span>
          <a
            href={config.fipsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-mono text-xs inline-flex items-center gap-1"
          >
            {config.standard}
            <ExternalLink size={10} />
          </a>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground shrink-0">Tests</span>
          <span className="text-foreground text-xs text-right">
            {config.specs.map((spec, i) => (
              <span key={spec.id} className="block">
                {config.operations[i]}{' '}
                <span className="text-muted-foreground">
                  ({KAT_EVIDENCE_META[evidenceForKind(spec.kind)].short})
                </span>
              </span>
            ))}
          </span>
        </div>
        {referenceSampleUrl && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reference sample</span>
            <a
              href={referenceSampleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-xs inline-flex items-center gap-1"
              title="Pinned upstream NIST ACVP-Server file this tile's reference-sample test reads"
            >
              NIST ACVP-Server
              <ExternalLink size={10} />
            </a>
          </div>
        )}
      </div>

      {/* Run button */}
      <Button variant="outline" size="sm" onClick={handleRun} disabled={running} className="w-full">
        {running ? (
          <>
            <Loader2 size={14} className="animate-spin mr-2" />
            Running...
          </>
        ) : (
          <>
            <ShieldCheck size={14} className="mr-2" />
            {katActionLabel(config.specs)}
          </>
        )}
      </Button>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-status-error bg-status-error/10 rounded-lg px-3 py-2">
          <AlertCircle size={13} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Collapsible results */}
      {results.length > 0 && (
        <div className="border-t border-border pt-3">
          <Button
            variant="ghost"
            onClick={() => setResultsOpen(!resultsOpen)}
            className="flex items-center gap-2 w-full justify-start text-sm font-medium text-foreground hover:text-primary px-0"
          >
            {resultsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>Results</span>
            {done && (
              <span className="ml-auto text-xs text-muted-foreground">
                <KatCounts counts={counts} />
              </span>
            )}
          </Button>
          {resultsOpen && (
            <div className="mt-2">
              <ResultsTable results={results} specs={specs} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── SLH-DSA grouped tile ────────────────────────────────────────────────────

const SLHDSATile: React.FC<{ hsm: UseHSMResult }> = ({ hsm }) => {
  const [variant, setVariant] = useState<SlhDsaVariant>('SHA2-128s')
  const [results, setResults] = useState<KATResult[]>([])
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultsOpen, setResultsOpen] = useState(false)

  const level = variant.includes('128') ? 1 : variant.includes('192') ? 3 : 5

  const specs: KatTestSpec[] = useMemo(
    () => [
      {
        id: `kat-algo-slhdsa-${variant}`,
        useCase: `SLH-DSA-${variant} sign+verify round-trip`,
        standard: 'FIPS 205',
        referenceUrl: FIPS_205_URL,
        kind: { type: 'slhdsa-functional' as const, variant },
      },
      {
        id: `kat-algo-slhdsa-${variant}-sigver`,
        useCase: `SLH-DSA-${variant} verify of the NIST sigGen output`,
        standard: 'FIPS 205',
        referenceUrl: FIPS_205_URL,
        kind: { type: 'slhdsa-sigver' as const, variant },
      },
    ],
    [variant]
  )

  const counts = summarizeKatResults(results)
  const done = results.length === specs.length && !running

  const handleRun = useCallback(async () => {
    setRunning(true)
    setError(null)
    setResults([])
    setResultsOpen(true)
    try {
      if (!hsm.isReady) await hsm.initialize()
      const M = hsm.moduleRef.current!
      const hSession = hsm.hSessionRef.current
      const advertised = advertisedMechanisms(M, hsm.slotRef.current)
      const out: KATResult[] = []
      for (const spec of specs) {
        const r = await runKAT(M, hSession, spec, { advertised })
        out.push(r)
        setResults([...out])
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setRunning(false)
    }
  }, [hsm, specs])

  const handleVariantChange = (id: string) => {
    setVariant(id as SlhDsaVariant)
    setResults([])
    setError(null)
    setResultsOpen(false)
  }

  return (
    <div className="border border-border rounded-lg p-5 bg-muted/30 hover:border-primary/50 transition-colors space-y-4 md:col-span-2 lg:col-span-3">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <h5 className="font-semibold text-foreground text-lg">SLH-DSA (Stateless Hash-Based)</h5>
        <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary border border-primary/30">
          Level {level}
        </span>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-muted-foreground">Variant:</span>
        <FilterDropdown
          items={SLH_DSA_DROPDOWN_ITEMS}
          selectedId={variant}
          onSelect={handleVariantChange}
          defaultLabel="SHA2-128s"
          variant="ghost"
        />
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Standard</span>
          <a
            href={FIPS_205_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-mono text-xs inline-flex items-center gap-1"
          >
            FIPS 205
            <ExternalLink size={10} />
          </a>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tests</span>
          <span className="text-foreground text-xs text-right">
            {specs.map((sp, i) => (
              <span key={sp.id} className="block">
                {i === 0 ? 'Sign+verify round-trip' : 'Verify of the NIST sigGen output'}{' '}
                <span className="text-muted-foreground">
                  ({KAT_EVIDENCE_META[evidenceForKind(sp.kind)].short})
                </span>
              </span>
            ))}
          </span>
        </div>
      </div>

      {/* Run button */}
      <Button variant="outline" size="sm" onClick={handleRun} disabled={running}>
        {running ? (
          <>
            <Loader2 size={14} className="animate-spin mr-2" />
            Running...
          </>
        ) : (
          <>
            <ShieldCheck size={14} className="mr-2" />
            {katActionLabel(specs)}
          </>
        )}
      </Button>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-status-error bg-status-error/10 rounded-lg px-3 py-2">
          <AlertCircle size={13} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Collapsible results */}
      {results.length > 0 && (
        <div className="border-t border-border pt-3">
          <Button
            variant="ghost"
            onClick={() => setResultsOpen(!resultsOpen)}
            className="flex items-center gap-2 w-full justify-start text-sm font-medium text-foreground hover:text-primary px-0"
          >
            {resultsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>Results</span>
            {done && (
              <span className="ml-auto text-xs text-muted-foreground">
                <KatCounts counts={counts} />
              </span>
            )}
          </Button>
          {resultsOpen && (
            <div className="mt-2">
              <ResultsTable results={results} specs={specs} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main KATView ────────────────────────────────────────────────────────────

export const KATView: React.FC = () => {
  const hsm = useHSM()
  const [diagOpen, setDiagOpen] = useState(false)

  return (
    <div className="space-y-8">
      {/* Intro banner */}
      <div className="flex items-start gap-3 p-4 bg-status-info border border-border rounded-lg">
        <Info className="text-primary flex-shrink-0 mt-0.5" size={20} />
        <div className="text-sm">
          <p className="font-semibold mb-1 text-foreground">Known-answer and functional tests</p>
          <p className="text-muted-foreground">
            Run pinned test vectors in-browser against a WebAssembly PKCS#11 implementation. Each
            test is labelled with its evidence class: a public NIST ACVP-Server reference sample, a
            published standard&apos;s own example, an OpenSSL-oracle comparison, or a functional
            round-trip with no external expected value. Every tile runs a single sampled case per
            operation, not a full ACVP test matrix.
          </p>
          <details className="mt-2 group">
            <summary className="text-xs font-medium text-primary cursor-pointer hover:underline">
              Why KATs matter
            </summary>
            <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
              <p>
                Known Answer Tests verify that an implementation produces the{' '}
                <span className="font-medium text-foreground">exact same outputs</span> as the NIST
                reference specification for known inputs. This catches subtle implementation bugs
                (polynomial arithmetic errors, endianness issues, off-by-one in sampling) that could
                silently weaken security without being obvious.
              </p>
              <p>
                FIPS 140-3 modules run their own power-on KAT self-tests, and algorithm validation
                (CAVP) is established through ACVTS-issued vector sets &mdash; neither happens here.
                Running these tests in-browser shows that{' '}
                <span className="font-medium text-foreground">your copy</span> of the WASM library
                reproduces the pinned expected values for the sampled cases shown, and nothing more.
              </p>
            </div>
          </details>
          <ValidationDisclaimer className="mt-3" />
        </div>
      </div>

      {/* Key Encapsulation — ML-KEM */}
      <div className="glass-panel p-6">
        <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Lock className="text-primary" size={20} />
          Key Encapsulation (ML-KEM)
          <span className="text-sm font-normal text-muted-foreground">FIPS 203</span>
        </h4>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ML_KEM_TILES.map((tile) => (
            <KATTile key={tile.id} config={tile} hsm={hsm} />
          ))}
        </div>
      </div>

      {/* Digital Signatures — ML-DSA + SLH-DSA */}
      <div className="glass-panel p-6">
        <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Shield className="text-primary" size={20} />
          Digital Signatures (ML-DSA, SLH-DSA)
          <span className="text-sm font-normal text-muted-foreground">FIPS 204, FIPS 205</span>
        </h4>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ML_DSA_TILES.map((tile) => (
            <KATTile key={tile.id} config={tile} hsm={hsm} />
          ))}
          <SLHDSATile hsm={hsm} />
        </div>
      </div>

      {/* AES Symmetric */}
      <div className="glass-panel p-6">
        <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
          <KeyRound className="text-primary" size={20} />
          AES Symmetric
          <span className="text-sm font-normal text-muted-foreground">
            SP 800-38D, SP 800-38A, RFC 3394
          </span>
        </h4>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {AES_TILES.map((tile) => (
            <KATTile key={tile.id} config={tile} hsm={hsm} />
          ))}
        </div>
      </div>

      {/* HMAC / Hash */}
      <div className="glass-panel p-6">
        <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Hash className="text-primary" size={20} />
          HMAC / Hash
          <span className="text-sm font-normal text-muted-foreground">FIPS 198-1, FIPS 180-4</span>
        </h4>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {HMAC_HASH_TILES.map((tile) => (
            <KATTile key={tile.id} config={tile} hsm={hsm} />
          ))}
        </div>
      </div>

      {/* Classical Signatures */}
      <div className="glass-panel p-6">
        <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
          <PenTool className="text-primary" size={20} />
          Classical Signatures
          <span className="text-sm font-normal text-muted-foreground">FIPS 186-5, RFC 8032</span>
        </h4>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CLASSICAL_SIG_TILES.map((tile) => (
            <KATTile key={tile.id} config={tile} hsm={hsm} />
          ))}
        </div>
      </div>

      {/* Key Derivation */}
      <div className="glass-panel p-6">
        <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Waypoints className="text-primary" size={20} />
          Key Derivation
          <span className="text-sm font-normal text-muted-foreground">RFC 8018, RFC 5869</span>
        </h4>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {KDF_TILES.map((tile) => (
            <KATTile key={tile.id} config={tile} hsm={hsm} />
          ))}
        </div>
      </div>

      {/* PKCS#11 Diagnostics — collapsible */}
      <div className="glass-panel overflow-hidden">
        <Button
          variant="ghost"
          onClick={() => setDiagOpen(!diagOpen)}
          className="flex items-center gap-3 w-full justify-start text-left p-6 h-auto rounded-none hover:bg-muted/30"
        >
          <Terminal className="text-primary shrink-0" size={20} />
          <div className="flex-1 min-w-0 text-left">
            <h4 className="text-lg font-bold text-foreground">PKCS#11 Diagnostics</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Activity log and key inspector for all KAT operations
            </p>
          </div>
          <span className="text-xs text-muted-foreground mr-2">
            {hsm.log.length > 0 ? `${hsm.log.length} operations` : 'No activity yet'}
          </span>
          <ChevronDown
            size={18}
            className={`text-muted-foreground transition-transform ${diagOpen ? '' : '-rotate-90'}`}
          />
        </Button>

        {diagOpen && (
          <div className="px-6 pb-6 space-y-6 border-t border-border pt-4">
            <Pkcs11LogPanel
              log={hsm.log}
              onClear={hsm.clearLog}
              title="PKCS#11 Call Log — KAT Validation"
              defaultOpen
              emptyMessage="Run a KAT to see PKCS#11 operations here."
            />

            <HsmKeyInspector
              keys={hsm.keys}
              moduleRef={hsm.moduleRef}
              hSessionRef={hsm.hSessionRef}
              onRemoveKey={(key: HsmKey) => hsm.removeKey(key.handle)}
              onClear={hsm.clearKeys}
              title="HSM Key Registry — KAT Session"
            />
          </div>
        )}
      </div>
    </div>
  )
}
