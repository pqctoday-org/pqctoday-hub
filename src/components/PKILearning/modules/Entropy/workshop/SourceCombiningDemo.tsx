import React, { useState, useCallback } from 'react'
import { Combine, Play, ArrowRight, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getRandomBytes } from '@/utils/webCrypto'
import { hkdfExtract, hkdfExpand } from '@/utils/webCrypto'
import { runAllTests, type TestResult } from '../utils/entropyTests'
import { formatHex, xorBytes, binnedFrequency } from '../utils/outputFormatters'
import { QRNG_SAMPLE_64 } from '../utils/entropyConstants'

/** Pipeline step labels for the flow diagram */
const PIPELINE_STEPS = [
  { label: 'Sources', shortLabel: 'A + B' },
  { label: 'XOR', shortLabel: 'XOR' },
  { label: 'HMAC Conditioning', shortLabel: 'HMAC' },
  { label: 'Expand (HKDF)', shortLabel: 'Expand' },
] as const

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
  const [xorResult, setXorResult] = useState<Uint8Array | null>(null)
  const [conditionedResult, setConditionedResult] = useState<Uint8Array | null>(null)
  const [expandedResult, setExpandedResult] = useState<Uint8Array | null>(null)
  const [testResults, setTestResults] = useState<TestResult[] | null>(null)
  const [pipelineStep, setPipelineStep] = useState(0)
  const [showCompromiseDemo, setShowCompromiseDemo] = useState(false)
  const [compromiseResults, setCompromiseResults] = useState<TestResult[] | null>(null)
  const [compromiseExpanded, setCompromiseExpanded] = useState<Uint8Array | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  /** Reset pipeline from a given step onwards */
  const resetFrom = useCallback((step: number) => {
    if (step <= 1) {
      setXorResult(null)
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

  const handleXorCombine = useCallback(() => {
    if (!sourceA) return
    const combined = xorBytes(sourceA, sourceB)
    setXorResult(combined)
    setPipelineStep(2)
    resetFrom(2)
  }, [sourceA, sourceB, resetFrom])

  const handleCondition = useCallback(async () => {
    if (!sourceA || !xorResult) return
    setIsRunning(true)
    try {
      // Concatenate Source A + Source B as IKM
      const ikm = new Uint8Array(sourceA.length + sourceB.length)
      ikm.set(sourceA)
      ikm.set(sourceB, sourceA.length)

      const conditioned = await hkdfExtract(xorResult, ikm, 'SHA-256')
      setConditionedResult(conditioned)
      setPipelineStep(3)
      setExpandedResult(null)
      setTestResults(null)
      setShowCompromiseDemo(false)
      setCompromiseResults(null)
      setCompromiseExpanded(null)
    } finally {
      setIsRunning(false)
    }
  }, [sourceA, sourceB, xorResult])

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
    setIsRunning(true)
    try {
      // Replace Source A with all zeros
      const compromisedA = new Uint8Array(32).fill(0)

      // XOR: zeros XOR sourceB = sourceB (entropy preserved)
      const compromisedXor = xorBytes(compromisedA, sourceB)

      // Concatenate compromised A + Source B as IKM
      const ikm = new Uint8Array(compromisedA.length + sourceB.length)
      ikm.set(compromisedA)
      ikm.set(sourceB, compromisedA.length)

      // HMAC Conditioning
      const conditioned = await hkdfExtract(compromisedXor, ikm, 'SHA-256')

      // Expand
      const info = new TextEncoder().encode('entropy-demo')
      const expanded = await hkdfExpand(conditioned, info, 64, 'SHA-256')

      setCompromiseExpanded(expanded)

      // Run tests on the compromised pipeline output
      const results = runAllTests(expanded)
      setCompromiseResults(results)
      setShowCompromiseDemo(true)
    } finally {
      setIsRunning(false)
    }
  }, [sourceB])

  const stepComplete = (step: number) => pipelineStep >= step
  const stepActive = (step: number) => pipelineStep === step

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Combine size={24} className="text-primary" />
        <div>
          <h3 className="text-lg font-semibold text-foreground">Source Combining Pipeline</h3>
          <p className="text-sm text-muted-foreground">
            Demonstrate the SP 800-90C approach of combining multiple independent entropy sources
            for defense-in-depth.
          </p>
        </div>
      </div>

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
            {PIPELINE_STEPS.slice(1).map((step, i) => {
              const stepNum = i + 2 // Steps 2, 3, 4
              return (
                <React.Fragment key={step.label}>
                  <div
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                      stepComplete(stepNum)
                        ? 'border-success text-status-success bg-status-success/10'
                        : stepActive(stepNum - 1) || (stepNum === 2 && pipelineStep >= 1)
                          ? 'border-primary text-primary bg-primary/10'
                          : 'border-border text-muted-foreground'
                    }`}
                  >
                    {step.label}
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
        <h4 className="text-sm font-semibold text-foreground">Step 1: Generate Sources</h4>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="gradient" onClick={handleGenerateSourceA}>
            <Play size={16} className="mr-2" />
            Generate Source A (TRNG)
          </Button>
          <span className="text-xs text-muted-foreground">
            Source B (QRNG) is pre-loaded from ANU quantum random data
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

      {/* Step 2: XOR Combination */}
      <div className="glass-panel p-4 space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Step 2: XOR Combination</h4>
        <Button variant="outline" onClick={handleXorCombine} disabled={!sourceA}>
          <Combine size={16} className="mr-2" />
          Combine via XOR
        </Button>

        {xorResult && (
          <>
            <HexDisplay label="Combined XOR output (32 bytes)" data={xorResult} />
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                XOR ensures the combined output has at least as much entropy as the stronger source.
                Even if one source is compromised (all zeros), the other source's entropy is
                preserved.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Step 3: HMAC Conditioning */}
      <div className="glass-panel p-4 space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Step 3: HMAC Conditioning</h4>
        <Button variant="outline" onClick={handleCondition} disabled={!xorResult || isRunning}>
          <Shield size={16} className="mr-2" />
          Apply HMAC Conditioning
        </Button>

        {conditionedResult && (
          <>
            <HexDisplay label="Conditioned output (32 bytes)" data={conditionedResult} />
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Conditioning distributes entropy uniformly across the output using a cryptographic
                function. HKDF-Extract uses HMAC-SHA-256 with the XOR output as salt and the
                concatenated sources as input keying material.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Step 4: Expand */}
      <div className="glass-panel p-4 space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Step 4: Expand</h4>
        <Button variant="outline" onClick={handleExpand} disabled={!conditionedResult || isRunning}>
          <ArrowRight size={16} className="mr-2" />
          Expand to 64 bytes
        </Button>

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
            Source A with all zeros and re-run the entire pipeline.
          </p>

          <Button variant="outline" onClick={handleCompromiseDemo} disabled={isRunning}>
            <Shield size={16} className="mr-2" />
            What if Source A is compromised?
          </Button>

          {showCompromiseDemo && compromiseExpanded && compromiseResults && (
            <div className="space-y-4 mt-2">
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                <p className="text-xs font-medium text-foreground">
                  Source A replaced with 32 bytes of zeros
                </p>
                <p className="text-xs text-muted-foreground">
                  XOR(zeros, Source B) = Source B -- Source B's entropy is fully preserved.
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
                  secure. The XOR combination preserves the entropy of the surviving source, and the
                  HMAC conditioning + HKDF expansion produce cryptographically strong output from
                  that preserved entropy.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
