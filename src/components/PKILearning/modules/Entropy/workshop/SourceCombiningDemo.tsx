// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Combine, Play, ArrowRight, Shield, Loader2, ExternalLink, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { getRandomBytes } from '@/utils/webCrypto'
import { hkdfExpand } from '@/utils/webCrypto'
import { useHSM } from '@/hooks/useHSM'
import { SOFTHSM_PRODUCT_VERSION } from '@/wasm/softhsm'
import { runAllTests, type TestResult } from '../utils/entropyTests'
import { formatHex, binnedFrequency } from '../utils/outputFormatters'
import { QRNG_SAMPLE_64 } from '../utils/entropyConstants'
import {
  combine,
  condition,
  combinationNeedsHsm,
  COMBINATION_MODES,
  CONDITIONING_MODES,
  COMBINATION_DESCRIPTIONS,
  CONDITIONING_DESCRIPTIONS,
  COMBINATION_LABELS,
  CONDITIONING_LABELS,
  type CombinationMode,
  type ConditioningMode,
} from './sourceCombiningCrypto'
import { RbgConstructionPanel } from './RbgConstructionPanel'
import { ErrorAlert } from '@/components/ui/error-alert'
import { translateCryptoError } from '@/utils/cryptoErrorHint'

/** Hex display for a labelled byte array */
const HexDisplay: React.FC<{ label: string; data: Uint8Array }> = ({ label, data }) => (
  <div className="space-y-1">
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <pre className="font-mono text-sm text-foreground bg-muted/30 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
      {formatHex(data)}
    </pre>
  </div>
)

/** Test result card */
const TestCard: React.FC<{ result: TestResult }> = ({ result }) => (
  <div
    className={`glass-panel p-3 space-y-1 border ${
      result.passed ? 'border-success' : 'border-destructive'
    }`}
  >
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-foreground">{result.name}</span>
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          result.passed
            ? 'bg-status-success/20 text-status-success'
            : 'bg-status-error/20 text-status-error'
        }`}
      >
        {result.passed ? 'PASS' : 'FAIL'}
      </span>
    </div>
    <p className="text-xs text-muted-foreground">{result.description}</p>
    <p className="text-xs font-mono text-foreground">{result.detail}</p>
  </div>
)

/** Frequency histogram for 16 bins */
const FrequencyHistogram: React.FC<{ data: Uint8Array }> = ({ data }) => {
  const bins = binnedFrequency(data, 16)
  const maxCount = Math.max(...bins, 1)

  return (
    <div className="flex items-end gap-1 h-[48px] px-1">
      {bins.map((count, i) => {
        const heightPct = (count / maxCount) * 100
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center justify-end h-full"
            title={`Bin ${i}: ${count} bytes`}
          >
            <div
              className="w-full rounded-t bg-primary/60 transition-all duration-300 min-h-[2px]"
              style={{ height: `${Math.max(heightPct, 3)}%` }}
            />
          </div>
        )
      })}
    </div>
  )
}

export const SourceCombiningDemo: React.FC = () => {
  const [sourceA, setSourceA] = useState<Uint8Array | null>(null)
  const [sourceB] = useState<Uint8Array>(() => QRNG_SAMPLE_64.slice(0, 32))
  const [combinedResult, setCombinedResult] = useState<Uint8Array | null>(null)
  const [conditionedResult, setConditionedResult] = useState<Uint8Array | null>(null)
  const [expandedResult, setExpandedResult] = useState<Uint8Array | null>(null)
  const [testResults, setTestResults] = useState<TestResult[] | null>(null)
  const [pipelineStep, setPipelineStep] = useState(0)
  const [showCompromiseDemo, setShowCompromiseDemo] = useState(false)
  const [compromiseResults, setCompromiseResults] = useState<TestResult[] | null>(null)
  const [compromiseExpanded, setCompromiseExpanded] = useState<Uint8Array | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [compromiseLoading, setCompromiseLoading] = useState(false)

  // Mode selection — defaults are NIST-compliant (90C §3.1 concat, 90A §10.3.1 Hash_df)
  const [combinationMode, setCombinationMode] = useState<CombinationMode>('concat')
  const [conditioningMode, setConditioningMode] = useState<ConditioningMode>('hash-df')

  // HSM lifecycle
  const { phase: hsmPhase, error: hsmError, moduleRef, hSessionRef, initialize: initHsm } = useHSM()

  useEffect(() => {
    initHsm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hsmReady = hsmPhase === 'session_open'

  /** Reset pipeline from a given step onwards */
  const resetFrom = useCallback((step: number) => {
    if (step <= 1) {
      setCombinedResult(null)
    }
    if (step <= 2) {
      setConditionedResult(null)
    }
    if (step <= 3) {
      setExpandedResult(null)
    }
    setTestResults(null)
    setShowCompromiseDemo(false)
    setCompromiseResults(null)
    setCompromiseExpanded(null)
  }, [])

  const handleGenerateSourceA = useCallback(() => {
    const bytes = getRandomBytes(32)
    setSourceA(bytes)
    setPipelineStep(1)
    resetFrom(1)
  }, [resetFrom])

  const handleCombine = useCallback(() => {
    if (!sourceA) return
    if (combinationNeedsHsm(combinationMode) && !hsmReady) return
    const result = combine(
      combinationMode,
      moduleRef.current,
      hSessionRef.current,
      sourceA,
      sourceB
    )
    setCombinedResult(result)
    setPipelineStep(2)
    resetFrom(2)
  }, [sourceA, sourceB, combinationMode, hsmReady, moduleRef, hSessionRef, resetFrom])

  const handleCondition = useCallback(() => {
    if (!combinedResult || !hsmReady) return
    setIsRunning(true)
    try {
      const result = condition(
        conditioningMode,
        moduleRef.current!,
        hSessionRef.current,
        combinedResult
      )
      setConditionedResult(result)
      setPipelineStep(3)
      setExpandedResult(null)
      setTestResults(null)
      setShowCompromiseDemo(false)
      setCompromiseResults(null)
      setCompromiseExpanded(null)
    } finally {
      setIsRunning(false)
    }
  }, [combinedResult, conditioningMode, hsmReady, moduleRef, hSessionRef])

  const handleExpand = useCallback(async () => {
    if (!conditionedResult) return
    setIsRunning(true)
    try {
      const info = new TextEncoder().encode('entropy-demo')
      const expanded = await hkdfExpand(conditionedResult, info, 64, 'SHA-256')
      setExpandedResult(expanded)
      setPipelineStep(4)
      setTestResults(null)
      setShowCompromiseDemo(false)
      setCompromiseResults(null)
      setCompromiseExpanded(null)
    } finally {
      setIsRunning(false)
    }
  }, [conditionedResult])

  const handleRunTests = useCallback(() => {
    if (!expandedResult) return
    const results = runAllTests(expandedResult)
    setTestResults(results)
  }, [expandedResult])

  const handleCompromiseDemo = useCallback(async () => {
    if (!hsmReady) return
    setCompromiseLoading(true)
    try {
      const compromisedA = new Uint8Array(32).fill(0)
      const compromisedCombined = combine(
        combinationMode,
        moduleRef.current,
        hSessionRef.current,
        compromisedA,
        sourceB
      )
      const conditioned = condition(
        conditioningMode,
        moduleRef.current!,
        hSessionRef.current,
        compromisedCombined
      )
      const info = new TextEncoder().encode('entropy-demo')
      const expanded = await hkdfExpand(conditioned, info, 64, 'SHA-256')
      setCompromiseExpanded(expanded)
      const results = runAllTests(expanded)
      setCompromiseResults(results)
      setShowCompromiseDemo(true)
    } finally {
      setCompromiseLoading(false)
    }
  }, [sourceB, combinationMode, conditioningMode, hsmReady, moduleRef, hSessionRef])

  const stepComplete = (step: number) => pipelineStep >= step
  const stepActive = (step: number) => pipelineStep === step

  const combineLabel = COMBINATION_LABELS[combinationMode]
  const conditionLabel = CONDITIONING_LABELS[conditioningMode]

  const combineDisabled = !sourceA || (combinationNeedsHsm(combinationMode) && !hsmReady)
  const conditionDisabled = !combinedResult || !hsmReady

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Combine size={24} className="text-primary" />
        <div>
          <h3 className="text-lg font-semibold text-foreground">Source Combining Pipeline</h3>
          <p className="text-sm text-muted-foreground">
            SP 800-90 series source assembly and conditioning. Default flow follows NIST standards
            (90C §3.1 concatenation + 90A §10.3.1 Hash_df). Powered by{' '}
            <a
              href="https://github.com/pqctoday-org/pqctoday-hsm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              SoftHSMv3 v{SOFTHSM_PRODUCT_VERSION}
              <ExternalLink size={12} />
            </a>{' '}
            PKCS#11 (pqctoday fork of{' '}
            <Link to="/migrate?highlight=SoftHSM2" className="text-primary hover:underline">
              SoftHSM2
            </Link>
            ).
          </p>
        </div>
      </div>

      {/* Pipeline Configuration */}
      <div className="glass-panel p-4 space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Pipeline Configuration</h4>
        <p className="text-xs text-muted-foreground">
          Defaults follow NIST SP 800-90 series. Options marked &quot;educational&quot; are
          non-standard alternatives for comparison.
        </p>
        <div className="flex flex-wrap gap-4 min-h-[60px]">
          {!sourceA && <div className="text-sm text-muted-foreground italic flex items-center">Generate Source A to unlock configuration options.</div>}
          {sourceA && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-foreground">Combination method (step 2):</p>
              <FilterDropdown
                items={COMBINATION_MODES}
                selectedId={combinationMode}
                onSelect={(id) => {
                  setCombinationMode(id as CombinationMode)
                  resetFrom(1)
                }}
                label="Assembly"
                noContainer
                variant="ghost"
              />
            </div>
          )}
          {combinedResult && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-foreground">Conditioning method (step 3):</p>
              <FilterDropdown
                items={CONDITIONING_MODES}
                selectedId={conditioningMode}
                onSelect={(id) => {
                  setConditioningMode(id as ConditioningMode)
                  resetFrom(2)
                }}
                label="Conditioning"
                noContainer
                variant="ghost"
              />
            </div>
          )}
        </div>
        {hsmPhase === 'loading' && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 size={12} className="animate-spin" />
            Loading SoftHSMv3 WASM...
          </div>
        )}
        {hsmReady && (
          <p className="text-xs text-status-success">
            SoftHSMv3 v{SOFTHSM_PRODUCT_VERSION} PKCS#11 session active
          </p>
        )}
        {hsmError && <ErrorAlert message={translateCryptoError(`HSM error: ${hsmError}`)} />}
      </div>

      {/* RBG Construction Types */}
      <RbgConstructionPanel />

      {/* Pipeline Visualization */}
      <div className="glass-panel p-4">
        <p className="text-xs font-medium text-muted-foreground mb-3">Pipeline Flow</p>
        <div className="flex flex-col gap-2">
          {/* Source inputs */}
          <div className="flex items-center gap-2 text-xs">
            <div
              className={`rounded-md border px-3 py-1.5 font-medium transition-colors ${
                stepComplete(1)
                  ? 'border-success text-status-success bg-status-success/10'
                  : 'border-border text-muted-foreground'
              }`}
            >
              Source A (TRNG)
            </div>
            <span className="text-muted-foreground">+</span>
            <div className="rounded-md border border-success text-status-success bg-status-success/10 px-3 py-1.5 font-medium">
              Source B (QRNG)
            </div>
          </div>

          {/* Arrow down */}
          <div className="flex items-center pl-6">
            <ArrowRight size={14} className="text-muted-foreground rotate-90" />
          </div>

          {/* Processing steps */}
          <div className="flex flex-wrap items-center gap-2">
            {[combineLabel, conditionLabel, 'Expand (HKDF)'].map((label, i) => {
              const stepNum = i + 2
              return (
                <React.Fragment key={label}>
                  <div
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                      stepComplete(stepNum)
                        ? 'border-success text-status-success bg-status-success/10'
                        : stepActive(stepNum - 1) || (stepNum === 2 && pipelineStep >= 1)
                          ? 'border-primary text-primary bg-primary/10'
                          : 'border-border text-muted-foreground'
                    }`}
                  >
                    {label}
                  </div>
                  {i < 2 && (
                    <ArrowRight
                      size={14}
                      className={`flex-shrink-0 ${
                        stepComplete(stepNum) ? 'text-status-success' : 'text-muted-foreground'
                      }`}
                    />
                  )}
                </React.Fragment>
              )
            })}
            <ArrowRight
              size={14}
              className={`flex-shrink-0 ${
                stepComplete(4) ? 'text-status-success' : 'text-muted-foreground'
              }`}
            />
            <div
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                stepComplete(4)
                  ? 'border-success text-status-success bg-status-success/10'
                  : 'border-border text-muted-foreground'
              }`}
            >
              Output
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Generate Sources */}
      <div className="glass-panel p-4 space-y-3">
        <h4 className="text-sm font-semibold text-foreground">
          Step 1: Entropy Sources (SP 800-90B)
        </h4>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="gradient" onClick={handleGenerateSourceA}>
            <Play size={16} className="mr-2" />
            Generate Source A (TRNG)
          </Button>
          <span className="text-xs text-muted-foreground">
            Source B (QRNG) is a pre-loaded reference sample. Both represent validated SP 800-90B
            entropy source outputs.
          </span>
        </div>

        {sourceA && <HexDisplay label="Source A (32 bytes)" data={sourceA} />}
        <HexDisplay label="Source B (32 bytes)" data={sourceB} />

        {sourceA && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Source A frequency</p>
              <FrequencyHistogram data={sourceA} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Source B frequency</p>
              <FrequencyHistogram data={sourceB} />
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Assembly (SP 800-90C §3.1) */}
      <div className="glass-panel p-4 space-y-3">
        <h4 className="text-sm font-semibold text-foreground">
          Step 2: {combineLabel} Assembly (SP 800-90C §3.1)
        </h4>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleCombine} disabled={combineDisabled}>
            <Combine size={16} className="mr-2" />
            Assemble via {combineLabel}
          </Button>
          {sourceA && hsmPhase !== 'session_open' && !hsmError && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 size={14} className="animate-spin" />
              Initializing HSM… step 2 will be ready shortly
            </div>
          )}
        </div>

        {combinedResult && (
          <>
            <HexDisplay
              label={`Combined output (${combinedResult.length} bytes)`}
              data={combinedResult}
            />
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {COMBINATION_DESCRIPTIONS[combinationMode]}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Step 3: Conditioning (SP 800-90C §3.2) */}
      <div className="glass-panel p-4 space-y-3">
        <h4 className="text-sm font-semibold text-foreground">
          Step 3: {conditionLabel} Conditioning (SP 800-90C §3.2)
        </h4>
        <Button
          variant="outline"
          onClick={handleCondition}
          disabled={conditionDisabled || isRunning}
        >
          <Shield size={16} className="mr-2" />
          Apply {conditionLabel}
        </Button>

        {conditionedResult && (
          <>
            <HexDisplay label="Conditioned output (32 bytes)" data={conditionedResult} />
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {CONDITIONING_DESCRIPTIONS[conditioningMode]}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Step 4: Expand */}
      <div className="glass-panel p-4 space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Step 4: Expand (HKDF)</h4>
        <Button variant="outline" onClick={handleExpand} disabled={!conditionedResult || isRunning}>
          <ArrowRight size={16} className="mr-2" />
          Expand to 64 bytes
        </Button>
        <p className="text-xs text-muted-foreground">
          Uses HKDF-Expand (RFC 5869) for demonstration. In production, conditioned entropy seeds an
          SP 800-90A DRBG (Hash_DRBG, HMAC_DRBG, or CTR_DRBG) which includes a nonce per §8.6.7.
        </p>

        {expandedResult && (
          <>
            <HexDisplay label="Expanded output (64 bytes)" data={expandedResult} />
            <div>
              <p className="text-xs text-muted-foreground mb-1">Output frequency distribution</p>
              <FrequencyHistogram data={expandedResult} />
            </div>
          </>
        )}
      </div>

      {/* Run Tests */}
      {expandedResult && (
        <div className="flex items-center gap-3">
          <Button variant="gradient" onClick={handleRunTests}>
            <Play size={16} className="mr-2" />
            Run Entropy Tests
          </Button>
          <span className="text-xs text-muted-foreground">
            Run SP 800-90B health tests on the final expanded output
          </span>
        </div>
      )}

      {/* Test Results */}
      {testResults && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Test Results</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {testResults.map((result) => (
              <TestCard key={result.name} result={result} />
            ))}
          </div>
        </div>
      )}

      {/* Standards Referenced */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-muted-foreground" />
          <h4 className="text-sm font-semibold text-foreground">Standards Referenced</h4>
        </div>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li>
            <Link
              to="/library?ref=NIST-SP-800-90C"
              className="text-primary hover:underline font-medium"
            >
              NIST SP 800-90C
            </Link>{' '}
            — RBG constructions: source assembly (§3.1), vetted conditioning functions (§3.2),
            defense-in-depth principle
          </li>
          <li>
            <Link
              to="/library?ref=NIST-SP-800-90A-R1"
              className="text-primary hover:underline font-medium"
            >
              NIST SP 800-90A Rev. 1
            </Link>{' '}
            — Hash_df derivation function (§10.3.1), DRBG seeding (§8.6.7)
          </li>
          <li>
            <Link
              to="/library?ref=NIST-SP-800-90B"
              className="text-primary hover:underline font-medium"
            >
              NIST SP 800-90B
            </Link>{' '}
            — Entropy source validation; health tests (repetition count, adaptive proportion)
          </li>
        </ul>
      </div>

      {/* Defense-in-Depth Demo */}
      {testResults && (
        <div className="glass-panel p-4 space-y-4 border border-border">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-primary" />
            <h4 className="text-sm font-semibold text-foreground">
              Defense-in-Depth Demonstration
            </h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            What happens if one entropy source is completely compromised? Click below to replace
            Source A with all zeros and re-run the entire pipeline using the currently selected{' '}
            {combineLabel} + {conditionLabel} modes.
          </p>

          <Button
            variant="outline"
            onClick={handleCompromiseDemo}
            disabled={compromiseLoading || !hsmReady}
          >
            {compromiseLoading ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" />
                Running…
              </>
            ) : (
              <>
                <Shield size={16} className="mr-2" />
                What if Source A is compromised?
              </>
            )}
          </Button>

          {showCompromiseDemo && compromiseExpanded && compromiseResults && (
            <div className="space-y-4 mt-2">
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                <p className="text-xs font-medium text-foreground">
                  Source A replaced with 32 bytes of zeros
                </p>
                <p className="text-xs text-muted-foreground">
                  {combinationMode === 'xor'
                    ? "XOR(zeros, Source B) = Source B — Source B's entropy is fully preserved."
                    : combinationMode === 'hash'
                      ? "Hash(zeros || Source B) — SHA-256 still produces a uniform digest from Source B's entropy."
                      : combinationMode === 'hmac'
                        ? "HMAC(zeros, Source B) — the zero key is weak but Source B's entropy survives conditioning."
                        : 'Concat(zeros, Source B) — zeros contribute no entropy; conditioning must extract from Source B alone.'}
                </p>
              </div>

              <HexDisplay
                label="Compromised pipeline output (64 bytes)"
                data={compromiseExpanded}
              />

              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Compromised output frequency distribution
                </p>
                <FrequencyHistogram data={compromiseExpanded} />
              </div>

              <h4 className="text-sm font-semibold text-foreground">
                Compromised Pipeline Test Results
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {compromiseResults.map((result) => (
                  <TestCard key={result.name} result={result} />
                ))}
              </div>

              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  <span className="font-semibold">Defense-in-depth principle (SP 800-90C):</span>{' '}
                  Even if one entropy source fails completely, the combined RBG output remains
                  secure. The {combineLabel} combination preserves the entropy of the surviving
                  source, and the {conditionLabel} conditioning + HKDF expansion produce
                  cryptographically strong output from that preserved entropy.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
