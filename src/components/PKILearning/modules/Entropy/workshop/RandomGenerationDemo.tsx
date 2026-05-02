// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback } from 'react'
import {
  Dice5,
  Play,
  Clock,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Eye,
  CheckCircle,
  XCircle,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { runAllTests, type TestResult } from '../utils/entropyTests'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { BitMatrixGrid } from '../components/BitMatrixGrid'
import { LagPlot } from '../components/LagPlot'

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
}> = ({ label, data }) => {
  const bins = binnedFrequency(data, HISTOGRAM_BINS)
  const maxCount = Math.max(...bins, 1)

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="flex items-end gap-1 h-[72px] px-1">
        {bins.map((count, i) => {
          const heightPct = (count / maxCount) * 100
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

/** Compact test results comparison table */
const TestComparisonTable: React.FC<{
  results: Record<SourceId, TestResult[]>
  enabledSources: SourceId[]
}> = ({ results, enabledSources }) => {
  const testNames = results[enabledSources[0]]?.map((t) => t.name) ?? []
  return (
    <div className="glass-panel p-4 space-y-3">
      <h4 className="text-sm font-semibold text-foreground">Statistical Test Comparison</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Test</th>
              {enabledSources.map((id) => {
                const src = SOURCES.find((s) => s.id === id)!
                return (
                  <th
                    key={id}
                    className="text-center py-2 px-2 text-muted-foreground font-medium whitespace-nowrap"
                  >
                    {src.label}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {testNames.map((name) => (
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
                  return (
                    <td key={id} className="text-center py-1.5 px-2">
                      {test.passed ? (
                        <CheckCircle size={14} className="text-success inline-block" />
                      ) : (
                        <XCircle size={14} className="text-destructive inline-block" />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
        <h4 className="text-sm font-semibold text-foreground truncate">{source.label}</h4>
      </div>
      {result && (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/40 rounded-full px-2 py-0.5 shrink-0">
          <Clock size={12} />
          {formatTiming(result.timeMs)}
        </span>
      )}
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
        <pre className="font-mono text-[11px] text-foreground bg-muted/30 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed max-h-20 overflow-y-auto">
          {formatHex(result.data)}
        </pre>
        <BitMatrixGrid data={result.data} compact />
      </>
    ) : (
      <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
        No data yet — click Generate
      </div>
    )}
  </div>
)

export const RandomGenerationDemo: React.FC = () => {
  const [byteCount, setByteCount] = useState<number>(64)
  const [enabledSources, setEnabledSources] = useState<SourceId[]>(['webcrypto', 'openssl'])
  const [results, setResults] = useState<Partial<Record<SourceId, GenerationResult>>>({})
  const [errors, setErrors] = useState<Partial<Record<SourceId, string>>>({})
  const [loading, setLoading] = useState(false)
  const [lcgState, setLcgState] = useState<LCGResult | null>(null)
  const [prediction, setPrediction] = useState<Uint8Array | null>(null)
  const [showPrediction, setShowPrediction] = useState(false)
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
    setShowPrediction(true)
  }, [lcgState])

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
  const gridCols =
    enabledSources.length <= 2
      ? 'grid-cols-1 md:grid-cols-2'
      : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
  const hasInsecure = enabledSources.includes('mathrandom') || enabledSources.includes('lcg')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Dice5 size={24} className="text-primary" />
        <div>
          <h3 className="text-lg font-semibold text-foreground">Random Byte Generation</h3>
          <p className="text-sm text-muted-foreground">
            Compare cryptographically secure and insecure random sources side by side. See the
            difference between true randomness and deterministic PRNGs.
          </p>
        </div>
      </div>

      {/* Source toggles */}
      <div className="glass-panel p-4">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Sources
        </div>
        <div className="flex flex-wrap gap-2">
          {SOURCES.map((src) => (
            <Button
              key={src.id}
              variant={
                enabledSources.includes(src.id) ? (src.secure ? 'secondary' : 'outline') : 'ghost'
              }
              size="sm"
              onClick={() => toggleSource(src.id)}
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
        </div>
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

        <Button variant="gradient" onClick={handleGenerate} disabled={loading}>
          <Play size={16} className="mr-2" />
          {loading ? 'Generating...' : 'Generate'}
        </Button>

        {hasResults && (
          <Button variant="outline" size="sm" onClick={handleCompareAll}>
            Compare All Tests
          </Button>
        )}
      </div>

      {/* Side-by-side results */}
      <div className={`grid ${gridCols} gap-4`}>
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

      {/* LCG Prediction Demo */}
      {lcgState && enabledSources.includes('lcg') && (
        <div className="glass-panel p-4 border-l-4 border-l-warning space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-warning" />
              <h4 className="text-sm font-semibold text-foreground">
                LCG Determinism — Can We Predict the Next Bytes?
              </h4>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20">
              Not NIST SP 800-90A Approved
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            The LCG&apos;s internal state is fully deterministic. Knowing the state after generation
            means we can predict every future output.
          </p>

          {/* LCG parameter + seed breakdown */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Recurrence: state = (a × state + c) mod m
              </p>
              <span className="text-[10px] text-muted-foreground italic">
                Numerical Recipes parameters (Knuth, 1997)
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
              NIST SP 800-90A Rev. 1 §11 approves only{' '}
              <strong className="text-foreground">CTR_DRBG</strong>,{' '}
              <strong className="text-foreground">Hash_DRBG</strong>, and{' '}
              <strong className="text-foreground">HMAC_DRBG</strong> for cryptographic use. LCGs are
              explicitly excluded — they fail the backtracking-resistance and prediction-resistance
              requirements of the standard.
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
              <p className="text-[10px] text-muted-foreground">
                Generate again with the LCG to verify — the first 4 bytes of subsequent output from
                the same state will always be identical. This is why LCGs must never be used for
                cryptographic key generation.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Byte Frequency Histograms */}
      {hasResults && (
        <div className="glass-panel p-4 space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Byte Frequency Distribution</h4>
          <p className="text-xs text-muted-foreground">
            Each bar represents the count of bytes falling within a 16-value range. Uniform
            randomness produces roughly equal bar heights.
          </p>
          <div className={`grid ${gridCols} gap-6`}>
            {enabledSources.map((id) => {
              const res = results[id]
              if (!res) return null
              const src = SOURCES.find((s) => s.id === id)!
              return <FrequencyHistogram key={id} label={src.label} data={res.data} />
            })}
          </div>
        </div>
      )}

      {/* Lag Plots */}
      {hasResults && (
        <div className="glass-panel p-4 space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Autocorrelation (Lag Plot)</h4>
          <p className="text-xs text-muted-foreground">
            Plots (byte[i], byte[i+k]) pairs. Random data fills the square uniformly; patterns
            create lines, clusters, or voids that reveal sequential correlations.
          </p>
          <div
            className={`grid gap-6 ${
              enabledSources.length <= 2
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
            }`}
          >
            {enabledSources.map((id) => {
              const res = results[id]
              if (!res) return null
              return (
                <div key={id}>
                  <p className="text-xs font-medium text-foreground mb-2">
                    {SOURCES.find((s) => s.id === id)!.label}
                  </p>
                  <LagPlot data={res.data} size={enabledSources.length > 2 ? 180 : 200} />
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

      {/* Production entropy products */}
      <div className="glass-panel p-4 space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Production Entropy Sources</h4>
        <p className="text-xs text-muted-foreground">
          Hardware and cloud entropy services that feed NIST SP 800-90B qualified entropy into
          production DRBGs and HSMs.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(
            [
              {
                name: 'ID Quantique Quantis QRNG',
                desc: 'Photon-detection QRNG · FIPS 140-2 entropy source qualified',
              },
              {
                name: 'Quantinuum Quantum Origin',
                desc: 'Quantum computer-sourced entropy · HSM / KMS integration',
              },
              {
                name: 'QuintessenceLabs qStream',
                desc: 'High-speed optical QRNG · NIST SP 800-90B compliant',
              },
              {
                name: 'Qrypt BLAST SDK',
                desc: 'Quantum entropy SDK · peer-reviewed algorithm',
              },
            ] as { name: string; desc: string }[]
          ).map(({ name, desc }) => (
            <a
              key={name}
              href={`/migrate?q=${encodeURIComponent(name)}`}
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
          is fully reproducible. This is why NIST SP 800-90A requires entropy-seeded DRBGs for all
          cryptographic applications.
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
    </div>
  )
}
