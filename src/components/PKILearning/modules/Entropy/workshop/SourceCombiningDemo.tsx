// SPDX-License-Identifier: GPL-3.0-only
//
// Combining Sources workshop — Entropy remediation plan P0.3 and P0.5
// (2026-09-24). Health tests now run on the RAW source samples, before
// conditioning (SP 800-90B §4.3 item 6); diagnostics on the final output are
// labelled "demonstration only — not entropy validation"; HKDF is not presented
// as a DRBG or an SP 800-90C construction; and the old "remains secure"
// conclusion is replaced by an assessment driven by stated assumptions that
// can end in "not enough evidence" or "construction is unsafe".
import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { Link } from 'react-router'
import {
  Combine,
  Play,
  ArrowRight,
  Shield,
  Loader2,
  ExternalLink,
  BookOpen,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Scale,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/CopyButton'
import { PlaygroundNextStep } from '@/components/Playground/components/PlaygroundNextStep'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { getRandomBytes } from '@/utils/webCrypto'
import { hkdfExpand } from '@/utils/webCrypto'
import { useHSM } from '@/hooks/useHSM'
import { SOFTHSM_PRODUCT_VERSION } from '@/wasm/softhsm'
import {
  runHealthTests,
  runVisualizationChecks,
  SP800_90B_STARTUP_SAMPLES,
  type TestResult,
} from '../utils/entropyTests'
import { formatHex, binnedFrequency, xorBytes } from '../utils/outputFormatters'
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
import {
  accountEntropy,
  assessConstruction,
  assessRawSource,
  COUNTEREXAMPLES,
  DECLARED_MIN_ENTROPY_PER_SAMPLE,
  fullEntropyConditioningRequirement,
  instantiateEntropyRequirement,
  SAMPLES_PER_REQUEST,
  simulateRawSamples,
  TARGET_SECURITY_STRENGTH,
  VERDICT_LABELS,
  VETTED_CONDITIONER_BOUNDS,
  type AdversaryControl,
  type CounterexampleId,
  type FailureHandling,
  type Independence,
  type InputFreshness,
  type RawSourceCondition,
  type RawSourceHealth,
  type RbgClass,
  type SeedMaterial,
  type SourceContribution,
  type SourceValidation,
} from './sourceAssessment'
import { RbgConstructionPanel } from './RbgConstructionPanel'
import { ErrorAlert } from '@/components/ui/error-alert'
import { translateCryptoError } from '@/utils/cryptoErrorHint'

const TOTAL_SAMPLES = SP800_90B_STARTUP_SAMPLES + SAMPLES_PER_REQUEST
const REQUIRED_ENTROPY = instantiateEntropyRequirement(TARGET_SECURITY_STRENGTH)
const FULL_ENTROPY_256 = fullEntropyConditioningRequirement(256)

const CONDITION_ITEMS = [
  { id: 'healthy', label: 'Healthy (simulated)' },
  { id: 'stuck', label: 'Stuck at 0x00' },
  { id: 'biased', label: 'Biased toward 0x5A' },
]

const INDEPENDENCE_ITEMS = [
  { id: 'independent', label: 'Independent (separate security boundaries)' },
  { id: 'correlated', label: 'Correlated / shared boundary' },
  { id: 'unknown', label: 'Unknown' },
]
const ADVERSARY_ITEMS = [
  { id: 'none', label: 'No control' },
  { id: 'observe', label: 'Can observe its output' },
  { id: 'choose', label: 'Can choose its output' },
  { id: 'unknown', label: 'Unknown' },
]
type SeedPath = SeedMaterial['kind']
const SEED_ITEMS = [
  { id: 'conditioned-block', label: 'One conditioned block from Step 4' },
  { id: 'unconditioned', label: 'The assembled bitstring, unconditioned' },
]
const FAILURE_ITEMS = [
  { id: 'detected-excluded', label: 'Detected by health tests; failed source excluded' },
  { id: 'undetected', label: 'Not detected' },
  { id: 'unknown', label: 'Unknown' },
]
const VALIDATION_ITEMS = [
  { id: 'validated', label: 'Validated (Entropy Validation Certificate)' },
  { id: 'not-validated', label: 'Not validated' },
  { id: 'unknown', label: 'Unknown' },
]
const FRESHNESS_ITEMS = [
  { id: 'fresh', label: 'Fresh samples for every request' },
  { id: 'repeated', label: 'Same input reused' },
  { id: 'stale-remote', label: 'Stale data from a remote service' },
]
const CLASS_ITEMS = [
  { id: 'RBG1', label: 'RBG1' },
  { id: 'RBG2(P)', label: 'RBG2(P)' },
  { id: 'RBG2(NP)', label: 'RBG2(NP)' },
  { id: 'RBG3(XOR)', label: 'RBG3(XOR)' },
  { id: 'RBG3(RS)', label: 'RBG3(RS)' },
  { id: 'RBGC', label: 'RBGC' },
  { id: 'none', label: 'None named' },
]

/** Hex display for a labelled byte array */
const HexDisplay: React.FC<{ label: string; data: Uint8Array }> = ({ label, data }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <CopyButton
        text={formatHex(data)}
        label="Copy"
        className="h-6 min-h-[24px] px-2 py-0 text-[10px]"
      />
    </div>
    <pre className="font-mono text-sm text-foreground bg-muted/30 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
      {formatHex(data)}
    </pre>
  </div>
)

/** One check result, with the group-appropriate wording and its limit. */
const ResultCard: React.FC<{ result: TestResult; okLabel: string; badLabel: string }> = ({
  result,
  okLabel,
  badLabel,
}) => (
  <div
    className={`glass-panel p-3 space-y-1 border ${
      result.passed ? 'border-success' : 'border-destructive'
    }`}
  >
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm font-semibold text-foreground">{result.name}</span>
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          result.passed
            ? 'bg-status-success/20 text-status-success'
            : 'bg-status-error/20 text-status-error'
        }`}
      >
        {result.passed ? okLabel : badLabel}
      </span>
    </div>
    <p className="text-xs text-muted-foreground">{result.description}</p>
    <p className="text-xs font-mono text-foreground">{result.detail}</p>
    <p className="text-[10px] text-muted-foreground border-t border-border pt-1">
      <strong>Limit:</strong> {result.sampleLimit}
    </p>
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

/** Health-test block for one simulated source. */
const SourceHealthPanel: React.FC<{
  name: string
  health: RawSourceHealth
  onDemand: TestResult[] | null
  onRunOnDemand: () => void
}> = ({ name, health, onDemand, onRunOnDemand }) => (
  <div className="space-y-3 rounded-lg border border-border p-3">
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <p className="text-sm font-semibold text-foreground">{name}</p>
      {health.failed ? (
        <span className="flex items-center gap-1 text-xs font-bold text-status-error">
          <XCircle size={14} /> Failure signalled — samples excluded
        </span>
      ) : (
        <span className="flex items-center gap-1 text-xs font-bold text-status-success">
          <CheckCircle size={14} /> No failure signalled
        </span>
      )}
    </div>
    <p className="text-xs font-medium text-muted-foreground">
      Startup test — samples 1–{SP800_90B_STARTUP_SAMPLES} (SP 800-90B §4.3 item 4)
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {health.startup.map((r) => (
        <ResultCard
          key={`s-${r.name}`}
          result={r}
          okLabel="No failure"
          badLabel="Failure signalled"
        />
      ))}
    </div>
    <p className="text-xs font-medium text-muted-foreground">
      Continuous tests — every sample produced so far ({TOTAL_SAMPLES})
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {health.continuous.map((r) => (
        <ResultCard
          key={`c-${r.name}`}
          result={r}
          okLabel="No failure"
          badLabel="Failure signalled"
        />
      ))}
    </div>
    <div className="flex items-center gap-2 flex-wrap">
      <Button variant="outline" size="sm" onClick={onRunOnDemand}>
        <Activity size={14} className="mr-1" /> Run on-demand test (§4.3 item 5)
      </Button>
      {onDemand && (
        <span className="text-xs text-muted-foreground">
          On-demand rerun on {SP800_90B_STARTUP_SAMPLES} fresh samples:{' '}
          {onDemand.every((r) => r.passed) ? 'no failure signalled' : 'failure signalled'}
        </span>
      )}
    </div>
  </div>
)

export const SourceCombiningDemo: React.FC = () => {
  // Raw sources
  const [conditionA, setConditionA] = useState<RawSourceCondition>('healthy')
  const [conditionB, setConditionB] = useState<RawSourceCondition>('healthy')
  const [rawA, setRawA] = useState<Uint8Array | null>(null)
  const [rawB, setRawB] = useState<Uint8Array | null>(null)
  const [onDemandA, setOnDemandA] = useState<TestResult[] | null>(null)
  const [onDemandB, setOnDemandB] = useState<TestResult[] | null>(null)
  /** Counterexample switch: feed a failed source's samples to the conditioner anyway. */
  const [useFailedSource, setUseFailedSource] = useState(false)

  // Pipeline
  const [combinedResult, setCombinedResult] = useState<Uint8Array | null>(null)
  const [conditionedResult, setConditionedResult] = useState<Uint8Array | null>(null)
  const [expandedResult, setExpandedResult] = useState<Uint8Array | null>(null)
  const [diagnostics, setDiagnostics] = useState<TestResult[] | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  // Assumptions (P0.5)
  const [independence, setIndependence] = useState<Independence>('unknown')
  const [adversaryControl, setAdversaryControl] = useState<AdversaryControl>('unknown')
  const [failureHandling, setFailureHandling] = useState<FailureHandling>('detected-excluded')
  const [sourceValidation, setSourceValidation] = useState<SourceValidation>('not-validated')
  const [inputFreshness, setInputFreshness] = useState<InputFreshness>('fresh')
  const [rbgClass, setRbgClass] = useState<RbgClass>('none')
  const [seedPath, setSeedPath] = useState<SeedPath>('conditioned-block')
  const [activeCounterexample, setActiveCounterexample] = useState<CounterexampleId | null>(null)

  // Mode selection — defaults: 90C §3.1 concatenation, 90A §10.3.1 Hash_df
  const [combinationMode, setCombinationMode] = useState<CombinationMode>('concat')
  const [conditioningMode, setConditioningMode] = useState<ConditioningMode>('hash-df')

  // HSM lifecycle
  const { phase: hsmPhase, error: hsmError, moduleRef, hSessionRef, initialize: initHsm } = useHSM()

  useEffect(() => {
    initHsm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hsmReady = hsmPhase === 'session_open'

  const healthA = useMemo(() => (rawA ? assessRawSource(rawA) : null), [rawA])
  const healthB = useMemo(() => (rawB ? assessRawSource(rawB) : null), [rawB])

  /** The request samples (after the startup block) each source contributes. */
  const requestA = useMemo(() => (rawA ? rawA.slice(SP800_90B_STARTUP_SAMPLES) : null), [rawA])
  const requestB = useMemo(() => (rawB ? rawB.slice(SP800_90B_STARTUP_SAMPLES) : null), [rawB])

  const includeA = !!healthA && (!healthA.failed || useFailedSource)
  const includeB = !!healthB && (!healthB.failed || useFailedSource)
  const failedSourceOutputUsed = (includeA && !!healthA?.failed) || (includeB && !!healthB?.failed)

  // Source A is the one the adversary may control (see the Step 6 picker).
  const sources: SourceContribution[] = useMemo(
    () =>
      healthA && healthB
        ? [
            {
              name: 'Source A',
              failed: healthA.failed,
              samplesUsed: SAMPLES_PER_REQUEST,
              mayBeAdversaryControlled: true,
            },
            { name: 'Source B', failed: healthB.failed, samplesUsed: SAMPLES_PER_REQUEST },
          ]
        : [],
    [healthA, healthB]
  )
  const includedCount = (includeA ? 1 : 0) + (includeB ? 1 : 0)
  const assembly: CombinationMode = includedCount === 2 ? combinationMode : 'concat'
  /** nin: bits in the assembled bitstring (concat keeps both; XOR keeps one width; hash/HMAC give 256). */
  const assembledBits =
    includedCount === 0
      ? 0
      : includedCount === 1 || assembly === 'xor'
        ? SAMPLES_PER_REQUEST * 8
        : assembly === 'concat'
          ? 2 * SAMPLES_PER_REQUEST * 8
          : 256
  const conditionerBound = VETTED_CONDITIONER_BOUNDS[conditioningMode]
  const seed: SeedMaterial =
    seedPath === 'unconditioned'
      ? { kind: 'unconditioned', bitstringBits: assembledBits }
      : { kind: 'conditioned-block', inputBits: assembledBits, bound: conditionerBound }
  const { inputEntropyBits: credited, seedEntropyBits } = accountEntropy(sources, seed, {
    adversaryControl,
    assembly,
  })
  const conditionedBlockBits = accountEntropy(
    sources,
    { kind: 'conditioned-block', inputBits: assembledBits, bound: conditionerBound },
    { adversaryControl, assembly }
  ).seedEntropyBits
  const sourceAZeroed =
    !!healthA &&
    !healthA.failed &&
    (adversaryControl === 'choose' || adversaryControl === 'observe')

  const resetPipeline = useCallback(() => {
    setCombinedResult(null)
    setConditionedResult(null)
    setExpandedResult(null)
    setDiagnostics(null)
  }, [])

  const collectRaw = useCallback(
    (a: RawSourceCondition, b: RawSourceCondition) => {
      setRawA(simulateRawSamples(a, TOTAL_SAMPLES, getRandomBytes))
      setRawB(simulateRawSamples(b, TOTAL_SAMPLES, getRandomBytes))
      setOnDemandA(null)
      setOnDemandB(null)
      resetPipeline()
    },
    [resetPipeline]
  )

  const runOnDemand = useCallback(
    (which: 'A' | 'B') => {
      const cond = which === 'A' ? conditionA : conditionB
      const fresh = simulateRawSamples(cond, SP800_90B_STARTUP_SAMPLES, getRandomBytes)
      const res = runHealthTests(fresh, DECLARED_MIN_ENTROPY_PER_SAMPLE)
      if (which === 'A') setOnDemandA(res)
      else setOnDemandB(res)
    },
    [conditionA, conditionB]
  )

  const includedInputs = useMemo(() => {
    const out: Uint8Array[] = []
    if (includeA && requestA) out.push(requestA)
    if (includeB && requestB) out.push(requestB)
    return out
  }, [includeA, includeB, requestA, requestB])

  const handleCombine = useCallback(() => {
    if (includedInputs.length === 0) return
    if (includedInputs.length === 1) {
      setCombinedResult(includedInputs[0])
    } else {
      if (combinationNeedsHsm(combinationMode) && !hsmReady) return
      setCombinedResult(
        combine(
          combinationMode,
          moduleRef.current,
          hSessionRef.current,
          includedInputs[0],
          includedInputs[1]
        )
      )
    }
    setConditionedResult(null)
    setExpandedResult(null)
    setDiagnostics(null)
  }, [includedInputs, combinationMode, hsmReady, moduleRef, hSessionRef])

  const handleCondition = useCallback(() => {
    if (!combinedResult || !hsmReady) return
    setIsRunning(true)
    try {
      setConditionedResult(
        condition(conditioningMode, moduleRef.current!, hSessionRef.current, combinedResult)
      )
      setExpandedResult(null)
      setDiagnostics(null)
    } finally {
      setIsRunning(false)
    }
  }, [combinedResult, conditioningMode, hsmReady, moduleRef, hSessionRef])

  const handleExpand = useCallback(async () => {
    if (!conditionedResult) return
    setIsRunning(true)
    try {
      const info = new TextEncoder().encode('entropy-demo')
      setExpandedResult(await hkdfExpand(conditionedResult, info, 64, 'SHA-256'))
      setDiagnostics(null)
    } finally {
      setIsRunning(false)
    }
  }, [conditionedResult])

  const applyCounterexample = useCallback(
    (id: CounterexampleId) => {
      const cx = COUNTEREXAMPLES.find((c) => c.id === id)
      if (!cx) return
      setActiveCounterexample(id)
      setConditionA(cx.sourceA)
      setConditionB('healthy')
      setUseFailedSource(cx.useFailedSource)
      setIndependence(cx.assumptions.independence)
      setAdversaryControl(cx.assumptions.adversaryControl)
      setFailureHandling(cx.assumptions.failureHandling)
      setSourceValidation(cx.assumptions.sourceValidation)
      setInputFreshness(cx.assumptions.inputFreshness)
      setRbgClass(cx.assumptions.rbgClass)
      if (id === 'malicious-cancellation') setCombinationMode('xor')
      collectRaw(cx.sourceA, 'healthy')
    },
    [collectRaw]
  )

  const assessment = healthA
    ? assessConstruction({
        independence,
        adversaryControl,
        failureHandling,
        sourceValidation,
        inputFreshness,
        rbgClass,
        sources,
        assembly,
        seed,
        failedSourceOutputUsed,
      })
    : null

  const combineLabel = COMBINATION_LABELS[combinationMode]
  const conditionLabel = CONDITIONING_LABELS[conditioningMode]
  const combineDisabled =
    includedInputs.length === 0 ||
    (includedInputs.length === 2 && combinationNeedsHsm(combinationMode) && !hsmReady)
  const conditionDisabled = !combinedResult || !hsmReady

  const PIPELINE = [
    'Noise source',
    'Raw samples',
    'Health tests (SP 800-90B §4.4)',
    'Conditioning (optional)',
    'Entropy-source output',
    'SP 800-90C construction + DRBG',
    'Consumer',
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Combine size={24} className="text-primary" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">Source Combining Pipeline</h2>
          <p className="text-sm text-muted-foreground">
            Where health tests, conditioning and a combined construction sit — with two simulated
            raw sources. Hashing, HMAC, CMAC and Hash_df run in{' '}
            <a
              href="https://github.com/pqctoday-org/pqctoday-hsm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline inline-flex items-center gap-1"
            >
              SoftHSMv3 v{SOFTHSM_PRODUCT_VERSION}
              <ExternalLink size={12} />
            </a>{' '}
            PKCS#11 (pqctoday fork of{' '}
            <Link to="/migrate?highlight=SoftHSM2" className="text-primary underline">
              SoftHSM2
            </Link>
            ).
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            ML-KEM and ML-DSA key generation consume random seeds. If the entropy behind the RBG is
            weak or a failed source goes unnoticed, a post-quantum key is as guessable as an RSA or
            ECDSA one.
          </p>
        </div>
      </div>

      {/* Pipeline */}
      <div className="glass-panel p-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Where each check belongs</p>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {PIPELINE.map((label, i) => (
            <React.Fragment key={label}>
              <span
                className={`rounded-md border px-2.5 py-1 font-medium ${
                  i === 2
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-border text-muted-foreground'
                }`}
              >
                {label}
              </span>
              {i < PIPELINE.length - 1 && (
                <ArrowRight size={12} className="text-muted-foreground shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          SP 800-90B §4.3 item 6: &ldquo;Health tests shall be performed on the noise source samples
          before any conditioning is done.&rdquo; This workshop simulates the first five boxes. Its
          last stage is an HKDF expansion used as a stand-in; it is not an SP 800-90A DRBG, and
          nothing here is an SP 800-90C construction.
        </p>
      </div>

      {/* RBG Construction Types */}
      <RbgConstructionPanel />

      {/* Step 1: Raw samples */}
      <div className="glass-panel p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Step 1: Raw noise-source samples (simulated)
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Each source produces {TOTAL_SAMPLES} raw 8-bit samples: {SP800_90B_STARTUP_SAMPLES} for
          the startup test and {SAMPLES_PER_REQUEST} for this entropy request. A
          &ldquo;healthy&rdquo; source is browser CSPRNG bytes standing in for a physical noise
          source. Both sources are declared to carry H = {DECLARED_MIN_ENTROPY_PER_SAMPLE}{' '}
          bits/sample — an assumption, not a measurement — and that value sets the health-test
          cutoffs.
        </p>
        <div className="flex flex-wrap gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground">Source A condition</p>
            <FilterDropdown
              items={CONDITION_ITEMS}
              selectedId={conditionA}
              onSelect={(id) => {
                setConditionA(id as RawSourceCondition)
                setActiveCounterexample(null)
              }}
              label="Source A"
              noContainer
              variant="ghost"
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground">Source B condition</p>
            <FilterDropdown
              items={CONDITION_ITEMS}
              selectedId={conditionB}
              onSelect={(id) => {
                setConditionB(id as RawSourceCondition)
                setActiveCounterexample(null)
              }}
              label="Source B"
              noContainer
              variant="ghost"
            />
          </div>
        </div>
        <Button variant="gradient" onClick={() => collectRaw(conditionA, conditionB)}>
          <Play size={16} className="mr-2" />
          Collect raw samples
        </Button>
        {requestA && requestB && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <HexDisplay label="Source A — request samples (64)" data={requestA} />
              <FrequencyHistogram data={requestA} />
            </div>
            <div className="space-y-2">
              <HexDisplay label="Source B — request samples (64)" data={requestB} />
              <FrequencyHistogram data={requestB} />
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Health tests at the raw boundary */}
      {healthA && healthB && (
        <div className="glass-panel p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            Step 2: Health tests on the raw samples — before conditioning
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The two approved SP 800-90B §4.4 tests at H = {DECLARED_MIN_ENTROPY_PER_SAMPLE}{' '}
            bits/sample and &alpha; = 2<sup>-20</sup>: Repetition Count cutoff C = 6, Adaptive
            Proportion W = 512 with C = 62 (SP 800-90B Table 2). A source that signals a failure is
            excluded: SP 800-90C §3.1 (item 4.a.1) says entropy collected by a failed entropy source
            shall not be used.
          </p>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <SourceHealthPanel
              name="Source A"
              health={healthA}
              onDemand={onDemandA}
              onRunOnDemand={() => runOnDemand('A')}
            />
            <SourceHealthPanel
              name="Source B"
              health={healthB}
              onDemand={onDemandB}
              onRunOnDemand={() => runOnDemand('B')}
            />
          </div>
          {useFailedSource && failedSourceOutputUsed && (
            <div className="flex items-start gap-2 rounded-md border border-status-error/30 bg-status-error/10 p-2">
              <AlertTriangle size={14} className="text-status-error mt-0.5 shrink-0" />
              <p className="text-xs text-foreground">
                Counterexample active: the failed source&rsquo;s samples are fed to the conditioner
                anyway. Watch the output diagnostics below stay within range.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Assembly + entropy accounting */}
      {healthA && healthB && (
        <div className="glass-panel p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            Step 3: Assemble the request samples ({combineLabel})
          </h3>
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1 text-xs">
            <p className="text-foreground" data-testid="entropy-credited">
              <strong>Entropy credited to the assembled bitstring:</strong> {credited} bits (only
              sources with no failure signalled, {SAMPLES_PER_REQUEST} samples &times;{' '}
              {DECLARED_MIN_ENTROPY_PER_SAMPLE} bits each; summing two sources assumes they are
              independent and concatenated — SP 800-90C §2.6 item 8
              {assembly !== 'concat' && includedCount === 2
                ? '; with this assembly only the larger source is credited'
                : ''}
              ).
            </p>
            {sourceAZeroed && (
              <p className="text-status-warning">
                Source A counts 0 bits: you stated in Step 6 that the adversary can{' '}
                {adversaryControl === 'choose' ? 'choose' : 'observe'} its output, and output the
                adversary picked or has seen is not unpredictable to it.
              </p>
            )}
            <p className="text-muted-foreground">
              Instantiating a DRBG at security strength {TARGET_SECURITY_STRENGTH} from an entropy
              source needs at least {REQUIRED_ENTROPY} bits (3s/2, SP 800-90C §2.6 item 11).
              Delivered unconditioned, this bitstring would{' '}
              <strong
                className={
                  credited >= REQUIRED_ENTROPY ? 'text-status-success' : 'text-status-error'
                }
              >
                {credited >= REQUIRED_ENTROPY ? 'meet it' : 'not meet it'}
              </strong>
              ; one {conditionerBound.outputBits}-bit conditioned block (Step 4) never can. A
              256-bit full-entropy conditioned block needs {FULL_ENTROPY_256} bits (output_len + 64,
              SP 800-90C §3.2.2.2):{' '}
              <strong
                className={
                  credited >= FULL_ENTROPY_256 ? 'text-status-success' : 'text-status-error'
                }
              >
                {credited >= FULL_ENTROPY_256 ? 'met' : 'not met'}
              </strong>
              .
            </p>
          </div>
          {includedInputs.length === 0 ? (
            <div className="flex items-start gap-2 rounded-md border border-status-error/30 bg-status-error/10 p-2">
              <XCircle size={14} className="text-status-error mt-0.5 shrink-0" />
              <p className="text-xs text-foreground">
                Every source signalled a failure, so there is nothing to assemble: with Method 1
                counting, SP 800-90C §3.1 (item 4.a.3) says the RBG operation shall be terminated
                when all physical entropy sources report failures.
              </p>
            </div>
          ) : (
            <>
              {includedInputs.length === 2 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-foreground">Combination method:</p>
                  <FilterDropdown
                    items={COMBINATION_MODES}
                    selectedId={combinationMode}
                    onSelect={(id) => {
                      setCombinationMode(id as CombinationMode)
                      resetPipeline()
                    }}
                    label="Assembly"
                    noContainer
                    variant="ghost"
                  />
                </div>
              )}
              {includedInputs.length === 1 && (
                <p className="text-xs text-muted-foreground">
                  Only one source is in use, so its request samples are the whole input.
                </p>
              )}
              <Button variant="outline" onClick={handleCombine} disabled={combineDisabled}>
                <Combine size={16} className="mr-2" />
                Assemble
              </Button>
            </>
          )}
          {combinedResult && (
            <>
              <HexDisplay
                label={`Assembled input (${combinedResult.length} bytes)`}
                data={combinedResult}
              />
              {includedInputs.length === 2 && (
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {COMBINATION_DESCRIPTIONS[combinationMode]}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Step 4: Conditioning */}
      {combinedResult && (
        <div className="glass-panel p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            Step 4: Conditioning ({conditionLabel})
          </h3>
          <FilterDropdown
            items={CONDITIONING_MODES}
            selectedId={conditioningMode}
            onSelect={(id) => {
              setConditioningMode(id as ConditioningMode)
              setConditionedResult(null)
              setExpandedResult(null)
              setDiagnostics(null)
            }}
            label="Conditioning"
            noContainer
            variant="ghost"
          />
          <Button
            variant="outline"
            onClick={handleCondition}
            disabled={conditionDisabled || isRunning}
          >
            <Shield size={16} className="mr-2" />
            Apply {conditionLabel}
          </Button>
          {hsmPhase === 'loading' && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 size={12} className="animate-spin" />
              Loading SoftHSMv3 WASM...
            </div>
          )}
          {hsmError && <ErrorAlert message={translateCryptoError(`HSM error: ${hsmError}`)} />}
          {conditionedResult && (
            <>
              <HexDisplay label="Conditioned output (32 bytes)" data={conditionedResult} />
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {CONDITIONING_DESCRIPTIONS[conditioningMode]}
                </p>
                <p
                  className="text-xs text-muted-foreground leading-relaxed"
                  data-testid="conditioned-credit"
                >
                  Conditioning cannot add entropy (SP 800-90B §3.1.5: the output entropy &ldquo;is
                  at most h<sub>in</sub>&rdquo;). This block is credited {conditionedBlockBits}{' '}
                  bits: the smaller of its input entropy ({credited} bits from a {assembledBits}-bit
                  input), its {conditionerBound.outputBits}-bit output length and the
                  vetted-function estimate (SP 800-90B §3.1.5.1.2, Table 1)
                  {failedSourceOutputUsed ? '; the failed source adds nothing creditable' : ''}.
                  {conditioningMode === 'aes-cmac'
                    ? ' Only one 128-bit CMAC call is credited; the second demo block adds nothing.'
                    : ''}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 5: Expand (demonstration only) */}
      {conditionedResult && (
        <div className="glass-panel p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            Step 5: Expand with HKDF — demonstration only
          </h3>
          <p className="text-xs text-muted-foreground">
            HKDF-Expand (RFC 5869) stretches the block to 64 bytes so the diagnostics have something
            to look at. HKDF is not an SP 800-90A DRBG, and this pipeline is not an SP 800-90C RBG
            construction. In a real design the conditioned entropy seeds an approved DRBG — see the
            DRBG State Machine step.
          </p>
          <Button variant="outline" onClick={handleExpand} disabled={isRunning}>
            <ArrowRight size={16} className="mr-2" />
            Expand to 64 bytes
          </Button>
          {expandedResult && (
            <>
              <HexDisplay label="Expanded output (64 bytes)" data={expandedResult} />
              <FrequencyHistogram data={expandedResult} />
              <Button
                variant="outline"
                onClick={() => setDiagnostics(runVisualizationChecks(expandedResult))}
              >
                <Play size={16} className="mr-2" />
                Run output diagnostics
              </Button>
            </>
          )}
          {diagnostics && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-status-warning">
                Demonstration only — not entropy validation. These describe 64 output bytes; after a
                hash they sit within range even when a source has failed.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {diagnostics.map((r) => (
                  <ResultCard
                    key={r.name}
                    result={r}
                    okLabel="Within range"
                    badLabel="Outside range"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 6: Assumption-driven assessment (P0.5) */}
      <div className="glass-panel p-4 space-y-4 border border-border">
        <div className="flex items-center gap-2">
          <Scale size={18} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Step 6: Is the combined construction justified?
          </h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Whether combining sources protects you when one fails depends on assumptions, not on how
          the output looks. State them — or load a counterexample — and read the outcome. The best
          possible outcome here is &ldquo;consistent with the stated assumptions&rdquo;; nothing in
          this workshop is a validation.
        </p>

        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">Counterexamples</p>
          <div className="flex flex-wrap gap-2">
            {COUNTEREXAMPLES.map((cx) => (
              <Button
                key={cx.id}
                size="sm"
                variant={activeCounterexample === cx.id ? 'secondary' : 'outline'}
                onClick={() => applyCounterexample(cx.id)}
              >
                {cx.label}
              </Button>
            ))}
          </div>
          {activeCounterexample && (
            <p className="text-xs text-muted-foreground">
              {COUNTEREXAMPLES.find((c) => c.id === activeCounterexample)?.story}
            </p>
          )}
        </div>

        {activeCounterexample === 'malicious-cancellation' && requestB && (
          <HexDisplay
            label="Attacker sets A = B: A ⊕ B (first 32 bytes)"
            data={xorBytes(requestB.slice(0, 32), requestB.slice(0, 32))}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AssumptionPicker
            label="Are the sources independent?"
            items={INDEPENDENCE_ITEMS}
            value={independence}
            onChange={(v) => setIndependence(v as Independence)}
          />
          <AssumptionPicker
            label="Adversary control over Source A"
            items={ADVERSARY_ITEMS}
            value={adversaryControl}
            onChange={(v) => setAdversaryControl(v as AdversaryControl)}
          />
          <AssumptionPicker
            label="How is a source failure detected and handled?"
            items={FAILURE_ITEMS}
            value={failureHandling}
            onChange={(v) => setFailureHandling(v as FailureHandling)}
          />
          <AssumptionPicker
            label="Are the entropy sources validated (SP 800-90B)?"
            items={VALIDATION_ITEMS}
            value={sourceValidation}
            onChange={(v) => setSourceValidation(v as SourceValidation)}
          />
          <AssumptionPicker
            label="Freshness of the input"
            items={FRESHNESS_ITEMS}
            value={inputFreshness}
            onChange={(v) => setInputFreshness(v as InputFreshness)}
          />
          <AssumptionPicker
            label="SP 800-90C construction class"
            items={CLASS_ITEMS}
            value={rbgClass}
            onChange={(v) => setRbgClass(v as RbgClass)}
          />
          <AssumptionPicker
            label="What seeds the DRBG?"
            items={SEED_ITEMS}
            value={seedPath}
            onChange={(v) => setSeedPath(v as SeedPath)}
          />
        </div>
        <p className="text-xs text-muted-foreground" data-testid="pipeline-summary">
          From the pipeline: {credited} bits credited to the {assembledBits}-bit assembled
          bitstring;{' '}
          {seedPath === 'conditioned-block'
            ? `one ${conditionerBound.label} block (${conditionerBound.outputBits}-bit output) carries at most ${seedEntropyBits} bits to the DRBG`
            : `delivered unconditioned, it carries ${seedEntropyBits} bits to the DRBG`}
          ;{' '}
          {failedSourceOutputUsed
            ? 'a failed source’s samples ARE being used.'
            : 'no failed source’s samples are used.'}
        </p>

        {!assessment && (
          <p className="text-xs text-muted-foreground italic">
            Collect raw samples in Step 1, or load a counterexample, to see the outcome.
          </p>
        )}
        {assessment && (
          <div
            className={`rounded-lg border p-4 space-y-2 ${
              assessment.verdict === 'unsafe'
                ? 'border-status-error/40 bg-status-error/10'
                : assessment.verdict === 'not-enough-evidence'
                  ? 'border-status-warning/40 bg-status-warning/10'
                  : 'border-primary/30 bg-primary/5'
            }`}
            data-testid="construction-verdict"
          >
            <p className="text-sm font-semibold text-foreground">
              {VERDICT_LABELS[assessment.verdict]}
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {assessment.reasons.map((r) => (
                <li key={r} className="text-xs text-foreground/90 leading-relaxed">
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Standards Referenced */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Standards Referenced</h3>
        </div>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li>
            <Link
              to="/library?ref=NIST-SP-800-90B"
              className="text-primary hover:underline font-medium"
            >
              NIST SP 800-90B
            </Link>{' '}
            — health tests on raw samples before conditioning (§4.3), Repetition Count and Adaptive
            Proportion tests (§4.4), conditioning components (§3.1.5)
          </li>
          <li>
            <Link
              to="/library?ref=NIST-SP-800-90C"
              className="text-primary hover:underline font-medium"
            >
              NIST SP 800-90C
            </Link>{' '}
            — entropy counting and independence (§2.3, §2.6), Get_entropy_bitstring and failure
            handling (§3.1), external conditioning (§3.2), construction classes (Table 1)
          </li>
          <li>
            <Link
              to="/library?ref=NIST-SP-800-90A-R1"
              className="text-primary hover:underline font-medium"
            >
              NIST SP 800-90A Rev. 1
            </Link>{' '}
            — Hash_df derivation function (§10.3.1)
          </li>
        </ul>
      </div>

      <PlaygroundNextStep
        toolId="drbg-demo"
        name="SP 800-90A DRBG"
        description="Seed an HMAC_DRBG and step through Instantiate → Generate → Reseed, then check the code against NIST known-answer vectors."
      />
    </div>
  )
}

const AssumptionPicker: React.FC<{
  label: string
  items: { id: string; label: string }[]
  value: string
  onChange: (id: string) => void
}> = ({ label, items, value, onChange }) => (
  <div className="space-y-1">
    <p className="text-xs font-medium text-foreground">{label}</p>
    <FilterDropdown
      items={items}
      selectedId={value}
      onSelect={onChange}
      ariaLabel={label}
      noContainer
      variant="ghost"
    />
  </div>
)
