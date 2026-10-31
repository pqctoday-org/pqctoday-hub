// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState, useCallback } from 'react'
import {
  Dice5,
  Play,
  Clock,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Eye,
  Search,
  CheckCircle,
  XCircle,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/CopyButton'
import { PlaygroundNextStep } from '@/components/Playground/components/PlaygroundNextStep'
import { getRandomBytes } from '@/utils/webCrypto'
import { arrayBufferToHex } from '@/utils/webCrypto'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import {
  formatHex,
  binnedFrequency,
  formatTiming,
  lcgBytes,
  lcgPredict,
  mathRandomBytes,
  type LCGResult,
} from '../utils/outputFormatters'
import { BYTE_COUNT_OPTIONS } from '../utils/entropyConstants'
import {
  groupResults,
  runAllTests,
  TEST_GROUP_STATUS,
  type TestGroup,
  type TestResult,
} from '../utils/entropyTests'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { BitMatrixGrid } from '../components/BitMatrixGrid'
import { LagPlot } from '../components/LagPlot'
import { migrateProductHref } from '@/utils/migrateLinks'
import { recoverLcgTimestampSeed, type LcgSeedRecovery } from '../utils/lcgAttack'

interface GenerationResult {
  hex: string
  data: Uint8Array
  timeMs: number
}

type SourceId = 'webcrypto' | 'openssl' | 'mathrandom' | 'lcg'

interface SourceConfig {
  id: SourceId
  label: string
  description: string
  secure: boolean
}

const SOURCES: SourceConfig[] = [
  {
    id: 'webcrypto',
    label: 'Web Crypto API',
    description: 'Browser CSPRNG backed by OS entropy',
    secure: true,
  },
  {
    id: 'openssl',
    label: 'OpenSSL WASM',
    description: 'OpenSSL DRBG seeded from OS entropy',
    secure: true,
  },
  {
    id: 'mathrandom',
    label: 'Math.random()',
    description: 'Browser PRNG — NOT cryptographically secure',
    secure: false,
  },
  {
    id: 'lcg',
    label: 'Timestamp LCG',
    description: 'Linear Congruential Generator seeded from Date.now()',
    secure: false,
  },
]

const HISTOGRAM_BINS = 16

/** Bin label for a 16-bin histogram (e.g. "00-0F", "10-1F") */
function binLabel(index: number): string {
  const lo = (index * 16).toString(16).toUpperCase().padStart(2, '0')
  const hi = (index * 16 + 15).toString(16).toUpperCase().padStart(2, '0')
  return `${lo}-${hi}`
}

/** Simple inline histogram showing byte frequency across 16 bins */
const FrequencyHistogram: React.FC<{
  label: string
  data: Uint8Array
  sharedMaxCount: number
}> = ({ label, data, sharedMaxCount }) => {
  const bins = binnedFrequency(data, HISTOGRAM_BINS)

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="flex items-end gap-1 h-[72px] px-1">
        {bins.map((count, i) => {
          const heightPct = (count / sharedMaxCount) * 100
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end h-full"
              title={`${binLabel(i)}: ${count} bytes`}
            >
              <div
                className="w-full rounded-t bg-primary/60 transition-all duration-300 min-h-[2px]"
                style={{ height: `${Math.max(heightPct, 3)}%` }}
              />
              <div className="bg-muted/30 w-full h-[1px]" />
            </div>
          )
        })}
      </div>
      <div className="flex gap-1 px-1">
        {bins.map((_, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[9px] text-muted-foreground leading-tight"
          >
            {i % 4 === 0 ? binLabel(i).split('-')[0] : ''}
          </div>
        ))}
      </div>
    </div>
  )
}

/** What each group can and cannot say, shown under its heading. */
const GROUP_NOTES: Partial<Record<TestGroup, string>> = {
  visualization:
    'Describe each buffer only. Math.random() and the LCG usually land within range here — the expected lesson: these statistics cannot tell a predictable generator from an unpredictable one.',
  health:
    'SP 800-90B §4.4 tests, defined on raw noise-source samples before conditioning (§4.3 item 6). Every source here is generator output, so this is a demonstration only.',
}

/**
 * Side-by-side results, one block per group (Entropy remediation P0.4): the
 * visual checks and the health tests are never totalled into one verdict.
 */
const TestComparisonTable: React.FC<{
  results: Record<SourceId, TestResult[]>
  enabledSources: SourceId[]
}> = ({ results, enabledSources }) => {
  const groups = groupResults(results[enabledSources[0]] ?? [])
  return (
    <div className="glass-panel p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">
        4 · Check Outputs — read each group on its own
      </h3>
      {groups.map((g) => (
        <div key={g.group} className="space-y-2">
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {g.label}
            </h4>
            {GROUP_NOTES[g.group] && (
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                {GROUP_NOTES[g.group]}
              </p>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Check</th>
                  {enabledSources.map((id) => {
                    const src = SOURCES.find((s) => s.id === id)!
                    return (
                      <th
                        key={id}
                        className="text-center py-2 px-2 text-muted-foreground font-medium"
                      >
                        {src.label}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {g.results.map(({ name }) => (
                  <tr key={name} className="border-b border-border/50">
                    <td className="py-1.5 pr-3 font-medium text-foreground whitespace-nowrap">
                      {name}
                    </td>
                    {enabledSources.map((id) => {
                      const test = results[id]?.find((t) => t.name === name)
                      if (!test)
                        return (
                          <td key={id} className="text-center py-1.5 px-2 text-muted-foreground">
                            —
                          </td>
                        )
                      const label = test.passed
                        ? TEST_GROUP_STATUS[test.group].ok
                        : TEST_GROUP_STATUS[test.group].bad
                      return (
                        <td key={id} className="text-center py-1.5 px-2" title={label}>
                          {test.passed ? (
                            <CheckCircle size={14} className="text-success inline-block" />
                          ) : (
                            <XCircle size={14} className="text-destructive inline-block" />
                          )}
                          <span className="sr-only">{label}</span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Result card for a single RNG source */
const SourceCard: React.FC<{
  source: SourceConfig
  result: GenerationResult | null
  error: string | null
  loading: boolean
}> = ({ source, result, error, loading }) => (
  <div className="glass-panel p-4 flex-1 min-w-0 space-y-3">
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        {source.secure ? (
          <ShieldCheck size={14} className="text-success shrink-0" />
        ) : (
          <ShieldAlert size={14} className="text-warning shrink-0" />
        )}
        <h3 className="text-sm font-semibold text-foreground truncate">{source.label}</h3>
      </div>
    </div>

    {!source.secure && (
      <p className="text-[10px] text-warning leading-tight">{source.description}</p>
    )}

    {loading ? (
      <div className="h-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      </div>
    ) : error ? (
      <div className="h-24 flex flex-col items-center justify-center text-status-error text-xs gap-1 text-center px-4 bg-status-error/5 rounded border border-status-error/20">
        <AlertTriangle size={16} />
        <span className="line-clamp-2">{error}</span>
      </div>
    ) : result ? (
      <>
        <div className="flex justify-end mb-1">
          <CopyButton
            text={formatHex(result.data)}
            label="Copy hex"
            className="h-6 min-h-[24px] px-2 py-0 text-[10px]"
          />
        </div>
        <pre className="font-mono text-[11px] text-foreground bg-muted/30 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed max-h-20 overflow-y-auto">
          {formatHex(result.data)}
        </pre>
        <BitMatrixGrid data={result.data} compact />
        <details className="text-[10px] text-muted-foreground">
          <summary className="cursor-pointer inline-flex items-center gap-1">
            <Clock size={11} /> Generation timing
          </summary>
          <p className="mt-1">
            Observed in this browser: {formatTiming(result.timeMs)}. Speed does not establish
            unpredictability or security.
          </p>
        </details>
      </>
    ) : (
      <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
        No data yet — click Generate
      </div>
    )}
  </div>
)

export const RandomGenerationDemo: React.FC = () => {
  const [byteCount, setByteCount] = useState<number>(128)
  const [enabledSources, setEnabledSources] = useState<SourceId[]>(['webcrypto', 'lcg'])
  const [showAdditionalSources, setShowAdditionalSources] = useState(false)
  const [appearancePrediction, setAppearancePrediction] = useState<
    'webcrypto' | 'lcg' | 'cannot-tell' | null
  >(null)
  const [results, setResults] = useState<Partial<Record<SourceId, GenerationResult>>>({})
  const [errors, setErrors] = useState<Partial<Record<SourceId, string>>>({})
  const [loading, setLoading] = useState(false)
  const [lcgState, setLcgState] = useState<LCGResult | null>(null)
  const [prediction, setPrediction] = useState<Uint8Array | null>(null)
  const [showPrediction, setShowPrediction] = useState(false)
  const [predictionVerified, setPredictionVerified] = useState(false)
  const [seedWindowMs, setSeedWindowMs] = useState(1_000)
  const [seedRecovery, setSeedRecovery] = useState<LcgSeedRecovery | null>(null)
  const [conclusion, setConclusion] = useState<'visual' | 'checks' | 'predictability' | null>(null)
  const [testResults, setTestResults] = useState<Record<string, TestResult[]>>({})
  const [showTests, setShowTests] = useState(false)

  const byteCountItems = BYTE_COUNT_OPTIONS.map((n) => ({
    id: String(n),
    label: `${n} bytes`,
  }))

  const toggleSource = useCallback((id: SourceId) => {
    setEnabledSources((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev // Keep at least one
        return prev.filter((s) => s !== id)
      }
      return [...prev, id]
    })
  }, [])

  const handleGenerate = useCallback(async () => {
    setLoading(true)
    setResults({})
    setErrors({})
    setLcgState(null)
    setPrediction(null)
    setShowPrediction(false)
    setPredictionVerified(false)
    setSeedRecovery(null)
    setConclusion(null)
    setTestResults({})
    setShowTests(false)

    try {
      const newResults: Partial<Record<SourceId, GenerationResult>> = {}

      const generators: Promise<void>[] = []

      if (enabledSources.includes('webcrypto')) {
        generators.push(
          (async () => {
            try {
              const t0 = performance.now()
              const bytes = getRandomBytes(byteCount)
              const timeMs = performance.now() - t0
              newResults.webcrypto = {
                hex: arrayBufferToHex(bytes.buffer as ArrayBuffer),
                data: bytes,
                timeMs,
              }
            } catch (e) {
              setErrors((prev) => ({
                ...prev,
                webcrypto: e instanceof Error ? e.message : String(e),
              }))
            }
          })()
        )
      }

      if (enabledSources.includes('openssl')) {
        generators.push(
          (async () => {
            try {
              const t0 = performance.now()
              const result = await openSSLService.execute(`rand -hex ${byteCount}`)
              const timeMs = performance.now() - t0
              const hexString = result.stdout.trim().replace(/[\s\n]/g, '')
              const bytes = new Uint8Array(byteCount)
              for (let i = 0; i < byteCount; i++) {
                bytes[i] = parseInt(hexString.substring(i * 2, i * 2 + 2), 16)
              }
              newResults.openssl = { hex: hexString, data: bytes, timeMs }
            } catch (e) {
              setErrors((prev) => ({
                ...prev,
                openssl: e instanceof Error ? e.message : String(e),
              }))
            }
          })()
        )
      }

      if (enabledSources.includes('mathrandom')) {
        generators.push(
          (async () => {
            try {
              const t0 = performance.now()
              const bytes = mathRandomBytes(byteCount)
              const timeMs = performance.now() - t0
              newResults.mathrandom = {
                hex: formatHex(bytes, 0),
                data: bytes,
                timeMs,
              }
            } catch (e) {
              setErrors((prev) => ({
                ...prev,
                mathrandom: e instanceof Error ? e.message : String(e),
              }))
            }
          })()
        )
      }

      if (enabledSources.includes('lcg')) {
        generators.push(
          (async () => {
            try {
              const seed = Date.now() & 0xffffffff
              const t0 = performance.now()
              const lcgResult = lcgBytes(byteCount, seed)
              const timeMs = performance.now() - t0
              setLcgState(lcgResult)
              newResults.lcg = {
                hex: formatHex(lcgResult.bytes, 0),
                data: lcgResult.bytes,
                timeMs,
              }
            } catch (e) {
              setErrors((prev) => ({ ...prev, lcg: e instanceof Error ? e.message : String(e) }))
            }
          })()
        )
      }

      await Promise.allSettled(generators)
      setResults(newResults)
    } finally {
      setLoading(false)
    }
  }, [byteCount, enabledSources])

  const handlePredictNext = useCallback(() => {
    if (!lcgState) return
    const predicted = lcgPredict(4, lcgState.finalState)
    setPrediction(predicted.bytes)
    setPredictionVerified(false)
    setShowPrediction(true)
  }, [lcgState])

  const handleVerifyPrediction = useCallback(() => {
    if (!lcgState || !prediction) return
    const actual = lcgBytes(prediction.length, lcgState.finalState)
    setPredictionVerified(actual.bytes.every((byte, index) => byte === prediction[index]))
  }, [lcgState, prediction])

  const handleRecoverSeed = useCallback(() => {
    if (!lcgState) return
    setSeedRecovery(
      recoverLcgTimestampSeed(lcgState.bytes.slice(0, 4), lcgState.seed, seedWindowMs)
    )
  }, [lcgState, seedWindowMs])

  const handleCompareAll = useCallback(() => {
    const allTestResults: Record<string, TestResult[]> = {}
    for (const id of enabledSources) {
      const res = results[id]
      if (res) {
        allTestResults[id] = runAllTests(res.data)
      }
    }
    setTestResults(allTestResults)
    setShowTests(true)
  }, [enabledSources, results])

  const hasResults = Object.keys(results).length > 0
  const gridCols = 'grid-cols-1 md:grid-cols-2'
  const hasInsecure = enabledSources.includes('mathrandom') || enabledSources.includes('lcg')
  const sharedHistogramMax = Math.max(
    1,
    ...enabledSources.flatMap((id) => {
      const result = results[id]
      return result ? binnedFrequency(result.data, HISTOGRAM_BINS) : []
    })
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Dice5 size={24} className="text-primary" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">Random Byte Generation</h2>
          <p className="text-sm text-muted-foreground">
            Compare cryptographically secure and insecure random sources side by side, and see why
            output that looks random can still be fully predictable.
          </p>
        </div>
      </div>

      <div className="glass-panel p-4 space-y-3" data-testid="appearance-prediction">
        <div className="text-xs font-bold text-primary uppercase tracking-wider">1 · Predict</div>
        <h3 className="text-sm font-semibold text-foreground">
          Which 128-byte sample will look less random?
        </h3>
        <p className="text-xs text-muted-foreground">
          Commit to a prediction before generating. You will test whether appearance reveals
          predictability.
        </p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['webcrypto', 'Web Crypto'],
              ['lcg', 'Timestamp LCG'],
              ['cannot-tell', 'Cannot tell from appearance'],
            ] as const
          ).map(([id, label]) => (
            <Button
              key={id}
              variant={appearancePrediction === id ? 'secondary' : 'outline'}
              size="sm"
              aria-pressed={appearancePrediction === id}
              onClick={() => setAppearancePrediction(id)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Source toggles */}
      <div className="glass-panel p-4">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
          2 · Observe — sources
        </div>
        <div className="flex flex-wrap gap-2">
          {SOURCES.filter((src) => src.id === 'webcrypto' || src.id === 'lcg').map((src) => (
            <Button
              key={src.id}
              variant={
                enabledSources.includes(src.id) ? (src.secure ? 'secondary' : 'outline') : 'ghost'
              }
              size="sm"
              onClick={() => toggleSource(src.id)}
              aria-pressed={enabledSources.includes(src.id)}
              aria-label={`Toggle source: ${src.label}`}
              className={`gap-1.5 ${
                enabledSources.includes(src.id) && !src.secure ? 'border-warning/50' : ''
              }`}
            >
              {src.secure ? (
                <ShieldCheck size={12} />
              ) : (
                <ShieldAlert size={12} className="text-warning" />
              )}
              {src.label}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdditionalSources((shown) => !shown)}
            aria-expanded={showAdditionalSources}
          >
            {showAdditionalSources ? 'Hide optional sources' : 'Explore more sources'}
          </Button>
        </div>
        {showAdditionalSources && (
          <div className="mt-3 border-t border-border/50 pt-3 space-y-2">
            <p className="text-[10px] text-muted-foreground">
              Optional extensions; the guided comparison uses Web Crypto and the timestamp LCG.
            </p>
            <div className="flex flex-wrap gap-2">
              {SOURCES.filter((src) => src.id === 'openssl' || src.id === 'mathrandom').map(
                (src) => (
                  <Button
                    key={src.id}
                    variant={enabledSources.includes(src.id) ? 'outline' : 'ghost'}
                    size="sm"
                    onClick={() => toggleSource(src.id)}
                    aria-pressed={enabledSources.includes(src.id)}
                    aria-label={`Toggle source: ${src.label}`}
                    className={
                      enabledSources.includes(src.id) && !src.secure ? 'border-warning/50' : ''
                    }
                  >
                    {src.secure ? (
                      <ShieldCheck size={12} />
                    ) : (
                      <ShieldAlert size={12} className="text-warning" />
                    )}
                    {src.label}
                  </Button>
                )
              )}
            </div>
          </div>
        )}
        {hasInsecure && (
          <p className="text-[10px] text-warning mt-2 flex items-center gap-1">
            <AlertTriangle size={10} />
            Insecure sources included for educational comparison only
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <FilterDropdown
          items={byteCountItems}
          selectedId={String(byteCount)}
          onSelect={(id) => setByteCount(Number(id))}
          label="Bytes"
          noContainer
        />

        <Button
          variant="gradient"
          onClick={handleGenerate}
          disabled={loading || appearancePrediction === null}
        >
          <Play size={16} className="mr-2" />
          {loading ? 'Generating...' : 'Generate'}
        </Button>

        {hasResults && (
          <div className="flex flex-col items-start gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCompareAll}
              title="Run descriptive output checks and SP 800-90B health-test demonstrations on every active source; results appear in separate groups"
            >
              Run Output Checks
            </Button>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Visual checks and health tests, grouped
            </p>
          </div>
        )}
      </div>

      {/* Side-by-side results */}
      <div className={`grid ${gridCols} gap-4`} data-testid="source-results-grid">
        {enabledSources.map((id) => {
          const src = SOURCES.find((s) => s.id === id)!
          return (
            <SourceCard
              key={id}
              source={src}
              result={results[id] ?? null}
              error={errors[id] ?? null}
              loading={loading}
            />
          )
        })}
      </div>

      {hasResults && (
        <div
          className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2"
          data-testid="visual-similarity-callout"
        >
          <h3 className="text-sm font-semibold text-foreground">
            The pictures may look alike. That is the result.
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            A {byteCount}-byte snapshot is too small—and visual inspection is the wrong tool—to
            establish unpredictability. The timestamp LCG can resemble Web Crypto here even though
            its output can be reproduced from a small seed search.
          </p>
          <p className="text-xs text-foreground">
            Your prediction:{' '}
            <strong>
              {appearancePrediction === 'cannot-tell'
                ? 'appearance cannot decide'
                : appearancePrediction === 'webcrypto'
                  ? 'Web Crypto would look less random'
                  : 'the timestamp LCG would look less random'}
            </strong>
          </p>
        </div>
      )}

      {/* LCG Prediction Demo */}
      {lcgState && enabledSources.includes('lcg') && (
        <div className="glass-panel p-4 border-l-4 border-l-warning space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-warning" />
              <h3 className="text-sm font-semibold text-foreground">
                3 · Prove Predictability — Recover and Continue the LCG
              </h3>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-destructive/10 text-status-error border border-destructive/20">
              Not NIST SP 800-90A Approved
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            Visual similarity is not security. First recover the timestamp seed from four observed
            bytes, then continue the exposed state to predict future output.
          </p>

          <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 space-y-3">
            <div>
              <p className="text-xs font-semibold text-foreground">Bound the timestamp window</p>
              <p className="text-[10px] text-muted-foreground">
                This browser demonstration searches around the known generation time; a real
                attacker estimates that time from surrounding events.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[250, 1000, 5000].map((radius) => (
                <Button
                  key={radius}
                  variant={seedWindowMs === radius ? 'secondary' : 'outline'}
                  size="sm"
                  aria-pressed={seedWindowMs === radius}
                  onClick={() => {
                    setSeedWindowMs(radius)
                    setSeedRecovery(null)
                  }}
                >
                  ±{radius.toLocaleString()} ms
                </Button>
              ))}
              <Button variant="outline" size="sm" onClick={handleRecoverSeed}>
                <Search size={14} className="mr-1.5" />
                Recover Seed from First 4 Bytes
              </Button>
            </div>
            {seedRecovery && (
              <p className="text-xs text-success" data-testid="lcg-seed-recovered">
                Recovered seed 0x{seedRecovery.seed.toString(16).padStart(8, '0')} after checking{' '}
                {seedRecovery.candidatesChecked.toLocaleString()} candidates. That seed reproduces
                the stream and determines every later byte.
              </p>
            )}
          </div>

          {/* LCG parameter + seed breakdown */}
          <details className="bg-muted/30 rounded-lg p-3">
            <summary className="cursor-pointer text-xs font-medium text-foreground">
              Inspect LCG parameters and exposed state
            </summary>
            <div className="mt-3 space-y-2">
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Recurrence: state = (a × state + c) mod m
                </p>
                <span className="text-[10px] text-muted-foreground italic">
                  Numerical Recipes parameters (Knuth, The Art of Computer Programming, Volume 2 —
                  Seminumerical Algorithms, 3rd ed., 1997)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground uppercase">a (multiplier)</div>
                  <div className="text-foreground">{lcgState.a.toLocaleString()}</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground uppercase">c (increment)</div>
                  <div className="text-foreground">{lcgState.c.toLocaleString()}</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground uppercase">m (modulus)</div>
                  <div className="text-foreground">2³²</div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug border-t border-border/40 pt-2">
                NIST SP 800-90A Rev. 1 §10 specifies three DRBG mechanisms:{' '}
                <strong className="text-foreground">Hash_DRBG</strong>,{' '}
                <strong className="text-foreground">HMAC_DRBG</strong> and{' '}
                <strong className="text-foreground">CTR_DRBG</strong>. An LCG is not one of them, so
                it is not an approved DRBG. Each state is a fixed linear function of the previous
                one, so anyone who learns the state can compute every later output.
              </p>
              <div className="border-t border-border/50 pt-2 space-y-1.5">
                <div className="flex items-baseline gap-2 text-xs font-mono flex-wrap">
                  <span className="text-[10px] text-muted-foreground uppercase w-16 shrink-0">
                    Seed
                  </span>
                  <span className="text-warning">
                    0x{lcgState.seed.toString(16).padStart(8, '0')}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    = Date.now() &amp; 0xFFFFFFFF
                  </span>
                </div>
                <p className="text-[10px] text-warning leading-snug">
                  Date.now() has ~1ms resolution — an attacker who knows the approximate generation
                  time can enumerate ≤ 86,400,000 candidates per day, making brute-force trivial on
                  any modern CPU.
                </p>
                <div className="flex items-baseline gap-2 text-xs font-mono">
                  <span className="text-[10px] text-muted-foreground uppercase w-16 shrink-0">
                    State
                  </span>
                  <span className="text-foreground">
                    0x{lcgState.finalState.toString(16).padStart(8, '0')}
                  </span>
                </div>
              </div>
            </div>
          </details>

          {!showPrediction ? (
            <Button variant="outline" size="sm" onClick={handlePredictNext}>
              <Eye size={14} className="mr-1.5" />
              Predict Next 4 Bytes
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="text-xs text-foreground">
                <span className="font-medium">Predicted:</span>{' '}
                <code className="font-mono text-warning bg-muted/30 px-1.5 py-0.5 rounded">
                  {prediction ? formatHex(prediction) : ''}
                </code>
              </div>
              {!predictionVerified ? (
                <Button variant="outline" size="sm" onClick={handleVerifyPrediction}>
                  <CheckCircle size={14} className="mr-1.5" />
                  Advance Same State and Verify
                </Button>
              ) : (
                <p className="text-xs text-success" data-testid="lcg-prediction-verified">
                  Exact match: continuing from the same exposed state produced these four bytes.
                </p>
              )}
              <p className="text-[10px] text-muted-foreground">
                An LCG is deterministic: knowing its state determines every later output. Generate
                starts a new timestamp-seeded run; verification above continues this run instead.
                LCGs must never be used for cryptographic key generation.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Byte Frequency Histograms */}
      {hasResults && (
        <div className="glass-panel p-4 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Byte Frequency Distribution</h3>
          <p className="text-xs text-muted-foreground">
            Each bar counts bytes in a 16-value range. Every chart uses the same vertical scale;
            this small sample can describe output, but cannot establish entropy or security.
          </p>
          <div className={`grid ${gridCols} gap-6`} data-testid="frequency-grid">
            {enabledSources.map((id) => {
              const res = results[id]
              if (!res) return null
              const src = SOURCES.find((s) => s.id === id)!
              return (
                <FrequencyHistogram
                  key={id}
                  label={src.label}
                  data={res.data}
                  sharedMaxCount={sharedHistogramMax}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Lag Plots */}
      {hasResults && (
        <div className="glass-panel p-4 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Autocorrelation (Lag Plot)</h3>
          <p className="text-xs text-muted-foreground">
            Plots (byte[i], byte[i+k]) pairs. Random data fills the square uniformly; patterns
            create lines, clusters, or voids that reveal sequential correlations.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="lag-plot-grid">
            {enabledSources.map((id) => {
              const res = results[id]
              if (!res) return null
              return (
                <div key={id} className="min-w-0">
                  <p className="text-xs font-medium text-foreground mb-2">
                    {SOURCES.find((s) => s.id === id)!.label}
                  </p>
                  <LagPlot data={res.data} size={220} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Test comparison table */}
      {showTests && Object.keys(testResults).length > 0 && (
        <TestComparisonTable
          results={testResults as Record<SourceId, TestResult[]>}
          enabledSources={enabledSources.filter((id) => testResults[id])}
        />
      )}

      {hasResults && (
        <div className="glass-panel p-4 space-y-3">
          <div className="text-xs font-bold text-primary uppercase tracking-wider">
            5 · Conclude
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            What can this experiment establish?
          </h3>
          <div className="flex flex-col items-start gap-2">
            {(
              [
                ['visual', 'The secure generator is visibly better'],
                ['checks', 'Passing these checks proves entropy'],
                ['predictability', 'Appearance alone cannot establish unpredictability'],
              ] as const
            ).map(([id, label]) => (
              <Button
                key={id}
                variant={conclusion === id ? 'secondary' : 'outline'}
                size="sm"
                aria-pressed={conclusion === id}
                onClick={() => setConclusion(id)}
                className="h-auto whitespace-normal text-left"
              >
                {label}
              </Button>
            ))}
          </div>
          {conclusion && (
            <p
              className={`text-xs ${conclusion === 'predictability' ? 'text-success' : 'text-warning'}`}
              data-testid="experiment-conclusion"
            >
              {conclusion === 'predictability'
                ? 'Correct. Security depends on the generator design, seed quality, state protection, and validation evidence—not a convincing-looking sample.'
                : 'Not quite. Short samples and passing output checks can coexist with a completely predictable generator.'}
            </p>
          )}
        </div>
      )}

      {/* Production entropy products */}
      <div className="glass-panel p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Production Entropy Sources</h3>
        <p className="text-xs text-muted-foreground">
          Products marketed as entropy sources for DRBGs and HSMs. Where a CMVP Entropy Validation
          Certificate exists it is named (checked 2026-09-24); a certificate covers the listed
          versions only, and none of this is demonstrated by this workshop.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(
            [
              {
                name: 'ID Quantique Quantis QRNG',
                desc: 'QRNG chips · CMVP entropy certificate E63 (SP 800-90B, IDQ Quantis IID QRNG)',
              },
              {
                name: 'Quantinuum Quantum Origin',
                desc: 'CMVP entropy certificate E214 (SP 800-90B) · noise source classified Non-Physical',
              },
              {
                name: 'QuintessenceLabs qStream',
                desc: 'CMVP entropy certificate E145 (SP 800-90B) · qStream 100 v1.5',
              },
              {
                name: 'Qrypt BLAST SDK',
                desc: 'Quantum entropy SDK · vendor description only, no certificate cited',
              },
            ] as { name: string; desc: string }[]
          ).map(({ name, desc }) => (
            <a
              key={name}
              href={migrateProductHref(name)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-0.5 px-3 py-2 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              <span className="text-xs font-medium text-foreground">{name}</span>
              <span className="text-[10px] text-muted-foreground">{desc}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Educational note + library xrefs */}
      <div className="border-t border-border pt-4 space-y-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Secure sources</strong> (Web Crypto, OpenSSL) draw
          from the operating system&apos;s entropy pool (e.g.,{' '}
          <code className="font-mono text-primary">/dev/urandom</code>).{' '}
          <strong className="text-foreground">Insecure sources</strong> (Math.random, LCG) use
          deterministic algorithms with predictable seeds — their output <em>looks</em> random but
          is fully reproducible. An SP 800-90A DRBG is deterministic too: its output is only as
          unpredictable as its seed, which SP 800-90C expects to come from validated SP 800-90B
          entropy sources.
        </p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'NIST-SP-800-90A-R1', label: 'SP 800-90A Rev. 1' },
              { id: 'NIST-SP-800-90B', label: 'SP 800-90B' },
              { id: 'NIST-SP-800-90C', label: 'SP 800-90C' },
              { id: 'NIST-SP-800-22-R1A', label: 'SP 800-22 Rev. 1a' },
              { id: 'BSI-AIS-20-31', label: 'BSI AIS 20/31' },
            ] as { id: string; label: string }[]
          ).map(({ id, label }) => (
            <a
              key={id}
              href={`/library?ref=${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
            >
              <BookOpen size={9} />
              {label}
            </a>
          ))}
        </div>
      </div>
      <PlaygroundNextStep
        toolId="entropy-test"
        name="Entropy Testing"
        description="Run the visual checks and the SP 800-90B health tests on a sample as separate groups, and see what neither group can tell you."
      />
    </div>
  )
}
