// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback } from 'react'
import {
  BarChart3,
  Play,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ToggleLeft,
  Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/CopyButton'
import { PlaygroundNextStep } from '@/components/Playground/components/PlaygroundNextStep'
import { Input } from '@/components/ui/input'
import { getRandomBytes } from '@/utils/webCrypto'
import {
  runHealthTests,
  runVisualizationChecks,
  TEST_GROUP_LABELS,
  SP800_90B_MIN_SEQUENTIAL_SAMPLES,
  type TestResult,
} from '../utils/entropyTests'
import { formatHex, binnedFrequency } from '../utils/outputFormatters'
import {
  BAD_SAMPLE_ZEROS,
  BAD_SAMPLE_PATTERN,
  BAD_SAMPLE_INCREMENT,
} from '../utils/entropyConstants'
import { BitMatrixGrid } from '../components/BitMatrixGrid'
import { LagPlot } from '../components/LagPlot'
import { BitFlipExperiment } from '../components/BitFlipExperiment'
import { StreamingEntropyMonitor } from '../components/StreamingEntropyMonitor'
import { KatValidationPanel } from '@/components/shared/KatValidationPanel'
import type { KatTestSpec } from '@/utils/katRunner'

// Group 4 (algorithm known-answer tests): these check the SHA-256 and HMAC
// primitives only. Until 2026-09-24 they were labelled "SP 800-90B" / "health
// test"; they are not entropy-source or RBG tests. The HMAC_DRBG known-answer
// check is in the DRBG State Machine step (utils/hmacDrbg.ts).
const PRIMITIVE_SELF_CHECK_SPECS: KatTestSpec[] = [
  {
    id: 'entropy-sha256-empty',
    useCase: 'SHA-256 (empty input)',
    standard: 'FIPS 180-4 (ACVP sample vector)',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/180-4/upd1/final',
    libraryRefId: 'FIPS-180-4',
    kind: { type: 'sha256-hash', testIndex: 0 },
  },
  {
    id: 'entropy-sha256-abc',
    useCase: 'SHA-256 (3-byte input)',
    standard: 'FIPS 180-4 (ACVP sample vector)',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/180-4/upd1/final',
    libraryRefId: 'FIPS-180-4',
    kind: { type: 'sha256-hash', testIndex: 1 },
  },
  {
    id: 'entropy-hmac256-health',
    useCase: 'HMAC-SHA-256 verify',
    standard: 'FIPS 198-1 (ACVP sample vector)',
    referenceUrl:
      'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/HMAC-SHA2-256',
    // No FIPS-198-1 record in library CSV; external ACVP URL is the authoritative source
    kind: { type: 'hmac-verify', hashAlg: 'SHA-256' },
  },
  {
    id: 'entropy-hmac512-health',
    useCase: 'HMAC-SHA-512 verify',
    standard: 'FIPS 198-1 (ACVP sample vector)',
    referenceUrl:
      'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/HMAC-SHA2-512',
    // No FIPS-198-1 record in library CSV; external ACVP URL is the authoritative source
    kind: { type: 'hmac-verify', hashAlg: 'SHA-512' },
  },
]

type SampleType = 'good' | 'bad-zeros' | 'bad-pattern' | 'bad-increment'
type TestingMode = 'static' | 'bitflip' | 'streaming'

interface EntropyTestingDemoProps {
  initialSampleType?: SampleType
}

function resolveInitialSample(type?: SampleType): { data: Uint8Array; label: string } | null {
  if (!type) return null
  switch (type) {
    case 'good':
      return { data: getRandomBytes(64), label: 'Random (64 bytes)' }
    case 'bad-zeros':
      return { data: new Uint8Array(BAD_SAMPLE_ZEROS), label: 'All Zeros (64 bytes)' }
    case 'bad-pattern':
      return { data: new Uint8Array(BAD_SAMPLE_PATTERN), label: 'Repeating Pattern (64 bytes)' }
    case 'bad-increment':
      return { data: new Uint8Array(BAD_SAMPLE_INCREMENT), label: 'Incrementing (64 bytes)' }
  }
}

export const EntropyTestingDemo: React.FC<EntropyTestingDemoProps> = ({ initialSampleType }) => {
  const [mode, setMode] = useState<TestingMode>('static')
  const [sampleData, setSampleData] = useState<Uint8Array | null>(
    () => resolveInitialSample(initialSampleType)?.data ?? null
  )
  const [sampleLabel, setSampleLabel] = useState<string>(
    () => resolveInitialSample(initialSampleType)?.label ?? ''
  )
  const [testResults, setTestResults] = useState<{
    visual: TestResult[]
    health: TestResult[]
  } | null>(null)
  const [showPasteInput, setShowPasteInput] = useState(false)
  const [pasteHex, setPasteHex] = useState('')
  const [pasteHexError, setPasteHexError] = useState<string | null>(null)

  const loadSample = useCallback((type: SampleType) => {
    setTestResults(null)
    setShowPasteInput(false)
    switch (type) {
      case 'good': {
        const bytes = getRandomBytes(64)
        setSampleData(bytes)
        setSampleLabel('Random (64 bytes)')
        break
      }
      case 'bad-zeros':
        setSampleData(new Uint8Array(BAD_SAMPLE_ZEROS))
        setSampleLabel('All Zeros (64 bytes)')
        break
      case 'bad-pattern':
        setSampleData(new Uint8Array(BAD_SAMPLE_PATTERN))
        setSampleLabel('Repeating Pattern (64 bytes)')
        break
      case 'bad-increment':
        setSampleData(new Uint8Array(BAD_SAMPLE_INCREMENT))
        setSampleLabel('Incrementing (64 bytes)')
        break
    }
  }, [])

  const handlePasteHex = useCallback(() => {
    const cleaned = pasteHex.replace(/[\s,0x]/g, '')
    if (cleaned.length < 2) {
      setPasteHexError('Hex string must be at least 2 characters (1 byte).')
      return
    }
    if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
      setPasteHexError('Invalid hex characters. Only 0-9 and A-F are allowed.')
      return
    }
    const byteCount = Math.floor(cleaned.length / 2)
    const hexPairs = Array.from({ length: byteCount }, (_, idx) =>
      parseInt(cleaned.slice(idx * 2, idx * 2 + 2), 16)
    )
    const bytes = new Uint8Array(hexPairs)
    setSampleData(bytes)
    setSampleLabel(`Pasted Hex (${bytes.length} bytes)`)
    setTestResults(null)
    setPasteHexError(null)
  }, [pasteHex])

  const handleRunTests = useCallback(() => {
    if (!sampleData) return
    // Groups are computed and shown separately and never totalled (P0.4).
    setTestResults({
      visual: runVisualizationChecks(sampleData),
      health: runHealthTests(sampleData),
    })
  }, [sampleData])

  const bins = sampleData ? binnedFrequency(sampleData, 16) : null
  const maxBinCount = bins ? Math.max(...bins) : 0

  // Render alternate modes (KAT panel shown in all modes — it tests conditioning
  // functions that are independent of the active testing mode)
  return (
    <div className="space-y-6">
      <ModeSelector mode={mode} onChange={setMode} />

      {mode !== 'static' && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          This mode shows the visual checks and the SP 800-90B health tests side by side. Read them
          as separate groups: a count of passing checks is not an entropy verdict, and the health
          tests only mean something on raw noise-source samples.
        </p>
      )}

      <div className={mode === 'bitflip' ? 'block' : 'hidden'}>
        <div className="space-y-6">
          <BitFlipExperiment />
        </div>
      </div>

      <div className={mode === 'streaming' ? 'block' : 'hidden'}>
        <div className="space-y-6">
          <StreamingEntropyMonitor />
        </div>
      </div>

      <div className={mode === 'static' ? 'block space-y-6' : 'hidden'}>
        {/* Header */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-2">Entropy Testing Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Load a data sample and run the checks. Results appear in four separate groups: visual
            checks, SP 800-90B health tests, SP 800-90B entropy estimators (not run here) and
            primitive self-checks. None of them, alone or added up, tells you whether a source is
            unpredictable.
          </p>
        </div>

        {/* Data source selector */}
        <div className="glass-panel p-4">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
            Data Source
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="gradient" size="sm" onClick={() => loadSample('good')}>
              Generate Random
            </Button>
            <Button variant="outline" size="sm" onClick={() => loadSample('bad-zeros')}>
              All Zeros
            </Button>
            <Button variant="outline" size="sm" onClick={() => loadSample('bad-pattern')}>
              Repeating Pattern
            </Button>
            <Button variant="outline" size="sm" onClick={() => loadSample('bad-increment')}>
              Incrementing
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowPasteInput(!showPasteInput)
                if (showPasteInput) setPasteHex('')
              }}
            >
              Paste Hex
            </Button>
          </div>

          {/* Paste hex input */}
          {showPasteInput && (
            <div className="mt-3">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={pasteHex}
                  onChange={(e) => {
                    const val = e.target.value
                    setPasteHex(val)
                    const cleaned = val.replace(/[\s,0x]/g, '')
                    if (cleaned.length > 0 && !/^[0-9a-fA-F]+$/.test(cleaned)) {
                      setPasteHexError(
                        'Invalid characters — enter hexadecimal digits only (0–9, a–f)'
                      )
                    } else if (cleaned.length > 0 && cleaned.length % 2 !== 0) {
                      setPasteHexError('Odd number of hex digits — each byte requires 2 digits')
                    } else {
                      setPasteHexError(null)
                    }
                  }}
                  placeholder="e.g. deadbeef01020304..."
                  className="flex-1 font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePasteHex}
                  disabled={pasteHex.length === 0}
                >
                  Load
                </Button>
              </div>
              {pasteHexError && (
                <p className="mt-1.5 text-xs flex items-center gap-1 text-status-error">
                  <AlertTriangle size={12} />
                  {pasteHexError}
                </p>
              )}
            </div>
          )}

          {sampleData && !testResults && (
            <Button variant="gradient" className="mt-3 w-full" onClick={handleRunTests}>
              Run the checks
            </Button>
          )}
        </div>

        {/* Hex data display + Bit Matrix */}
        {sampleData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass-panel p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Sample Data
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-primary font-medium">{sampleLabel}</span>
                  <CopyButton
                    text={formatHex(sampleData, 4)}
                    label="Copy"
                    className="h-6 min-h-[24px] px-2 py-0 text-[10px]"
                  />
                </div>
              </div>
              <div className="bg-muted rounded-lg p-3 border border-border overflow-x-auto">
                <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-all leading-relaxed">
                  {formatHex(sampleData, 4)}
                </pre>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1.5">
                {sampleData.length} bytes ({sampleData.length * 8} bits)
              </div>
            </div>

            <div className="glass-panel p-4">
              <BitMatrixGrid data={sampleData} />
            </div>
          </div>
        )}

        {/* Test Results — four separate groups, no combined verdict (P0.4) */}
        {testResults && (
          <div className="space-y-4">
            <ResultGroup
              title={`1. ${TEST_GROUP_LABELS.visualization}`}
              note="Describe this buffer only. Math.random() or a linear congruential generator usually lands within range here — that is the expected lesson: these statistics cannot tell a predictable generator from an unpredictable one, so no security verdict comes from this group."
              results={testResults.visual}
              okLabel="Within range"
              badLabel="Outside range"
            />
            <ResultGroup
              title={`2. ${TEST_GROUP_LABELS.health}`}
              note="SP 800-90B defines these on raw noise-source samples, before any conditioning (§4.3 item 6). Here each byte is treated as one raw sample with an assumed H = 8 bits/sample. Web Crypto output is DRBG output, so on it this is a demonstration only. A health test detects gross failures; it is not an entropy estimate."
              results={testResults.health}
              okLabel="No failure signalled"
              badLabel="Failure signalled"
            />
            <div className="glass-panel p-4 space-y-2">
              <h3 className="text-sm font-bold text-foreground">
                3. {TEST_GROUP_LABELS.estimator} — not run here
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                An SP 800-90B entropy estimate needs at least{' '}
                {SP800_90B_MIN_SEQUENTIAL_SAMPLES.toLocaleString('en-US')} sequential raw
                noise-source samples plus a 1,000 &times; 1,000 restart dataset (&sect;3.1.1), and
                takes the lowest result of the full estimator set. One estimator on a{' '}
                {sampleData?.length ?? 0}-byte buffer would be a fake result, so this step does not
                compute one. Run the estimators with the NIST SP 800-90B Entropy Assessment tool
                (link below) on real raw data; the module&rsquo;s entropy-evidence workshop is where
                that belongs.
              </p>
            </div>
            <div className="glass-panel p-4 space-y-1">
              <h3 className="text-sm font-bold text-foreground">4. {TEST_GROUP_LABELS.kat}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The primitive self-checks for SHA-256 and HMAC are below; the HMAC_DRBG known-answer
                check is in the DRBG State Machine step. They show an algorithm is computed
                correctly and say nothing about entropy.
              </p>
            </div>

            {/* Run again button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTestResults(null)}
                className="gap-2"
              >
                <Play size={14} />
                Reset &amp; Choose New Sample
              </Button>
            </div>
            {pasteHexError && <p className="mt-1 text-xs text-status-error">{pasteHexError}</p>}
          </div>
        )}

        {/* Visualizations side by side */}
        {sampleData && bins && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Byte Frequency Histogram */}
            <div className="glass-panel p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={16} className="text-primary" />
                <span className="text-sm font-bold text-foreground">
                  Byte Frequency Distribution (16 bins)
                </span>
              </div>
              <div className="flex items-end gap-1 h-32">
                {bins.map((count, i) => {
                  const height = maxBinCount > 0 ? (count / maxBinCount) * 100 : 0
                  const rangeStart = i * 16
                  const rangeEnd = rangeStart + 15
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center justify-end h-full group"
                    >
                      {/* Bar */}
                      <div
                        className="w-full rounded-t bg-primary/70 group-hover:bg-primary transition-colors relative"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`Bin ${i} (0x${rangeStart.toString(16).padStart(2, '0')}-0x${rangeEnd.toString(16).padStart(2, '0')}): ${count}`}
                      >
                        {/* Count label on hover */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {count}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Bin labels */}
              <div className="flex gap-1 mt-1">
                {bins.map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 text-center text-[7px] text-muted-foreground font-mono"
                  >
                    {(i * 16).toString(16).padStart(2, '0')}
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-muted-foreground mt-2 text-center">
                Byte value range (hex) — a flat histogram is consistent with uniform output; it does
                not show the source is unpredictable
              </div>
            </div>

            {/* Lag Plot */}
            <div className="glass-panel p-4">
              <LagPlot data={sampleData} />
            </div>
          </div>
        )}

        {/* Educational note */}
        <div className="glass-panel p-4 border-l-4 border-l-warning">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              These are simplified educational implementations. An SP 800-90B entropy assessment
              uses the NIST SP 800-90B EntropyAssessment tool (
              <a
                href="https://github.com/usnistgov/SP800-90B_EntropyAssessment"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                github.com/usnistgov/SP800-90B_EntropyAssessment
              </a>
              ) on at least 1,000,000 raw noise-source samples plus restart data (SP 800-90B
              &sect;3.1.1).
            </p>
          </div>
        </div>

        {/* Related products note */}
        <div className="glass-panel p-4">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Related Products
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Hardware entropy sources and HSMs that provide NIST-validated entropy for production use
            are tracked in the{' '}
            <a
              href="/migrate?category=Hardware+Security+Modules"
              className="text-primary underline"
            >
              Migrate catalog → Hardware Security Modules
            </a>
            . No standalone entropy-source products are currently cataloged; contributions welcome
            via the{' '}
            <a
              href="https://github.com/pqctoday-org/pqctoday-hub/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              issue tracker
            </a>
            .
          </p>
        </div>
      </div>

      <KatValidationPanel
        specs={PRIMITIVE_SELF_CHECK_SPECS}
        label="Primitive self-checks (SHA-256, HMAC) — not entropy or RBG tests"
        authorityNote="FIPS 180-4 · FIPS 198-1 — algorithm correctness only"
      />
      <PlaygroundNextStep
        toolId="source-combining"
        name="Source Combining"
        description="Health-test raw source samples before conditioning, and see why random-looking conditioned output is not evidence about the source."
      />
    </div>
  )
}

/** Mode selector tabs */
const ModeSelector: React.FC<{
  mode: TestingMode
  onChange: (mode: TestingMode) => void
}> = ({ mode, onChange }) => (
  <div className="glass-panel p-2">
    <div className="flex gap-1">
      <Button
        variant={mode === 'static' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onChange('static')}
        className="gap-1.5 flex-1"
      >
        <BarChart3 size={14} />
        <span className="hidden sm:inline">Static Tests</span>
        <span className="sm:hidden">Tests</span>
      </Button>
      <Button
        variant={mode === 'bitflip' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onChange('bitflip')}
        className="gap-1.5 flex-1"
      >
        <ToggleLeft size={14} />
        <span className="hidden sm:inline">Bit Flipper</span>
        <span className="sm:hidden">Flip</span>
      </Button>
      <Button
        variant={mode === 'streaming' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onChange('streaming')}
        className="gap-1.5 flex-1"
      >
        <Activity size={14} />
        <span className="hidden sm:inline">Live Monitor</span>
        <span className="sm:hidden">Live</span>
      </Button>
    </div>
  </div>
)

/** One result group: its own heading, note and cards — never totalled with other groups. */
const ResultGroup: React.FC<{
  title: string
  note: string
  results: TestResult[]
  okLabel: string
  badLabel: string
}> = ({ title, note, results, okLabel, badLabel }) => (
  <div className="glass-panel p-4 space-y-3">
    <div>
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed mt-1">{note}</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {results.map((result) => (
        <div
          key={result.name}
          className={`rounded-lg p-4 border-l-4 border border-border ${
            result.passed
              ? 'border-l-success bg-status-success/10'
              : 'border-l-destructive bg-status-error/10'
          }`}
        >
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-sm font-bold text-foreground">{result.name}</span>
            {result.passed ? (
              <span className="flex items-center gap-1 text-xs font-bold text-success">
                <CheckCircle size={14} />
                {okLabel}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-bold text-destructive">
                <XCircle size={14} />
                {badLabel}
              </span>
            )}
          </div>
          <div className="flex gap-4 mb-2 text-xs">
            <div>
              <span className="text-muted-foreground">Value: </span>
              <span className="font-mono font-bold text-foreground">{result.value.toFixed(4)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Cutoff: </span>
              <span className="font-mono text-foreground">{result.threshold.toFixed(4)}</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mb-1">{result.description}</p>
          <p className="text-[10px] text-muted-foreground/80 font-mono mb-2">{result.detail}</p>
          <p className="text-[10px] text-muted-foreground border-t border-border pt-1.5">
            <strong>Limit:</strong> {result.sampleLimit}
          </p>
        </div>
      ))}
    </div>
  </div>
)
