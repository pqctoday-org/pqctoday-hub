import React, { useState, useCallback } from 'react'
import { AlertTriangle, PenLine, RotateCcw, Info, ShieldAlert, CheckCircle } from 'lucide-react'
import {
  LMS_PARAMETER_SETS,
  formatSignatureCount,
  type LMSParameterSet,
} from '../data/statefulSigsConstants'

const DEMO_PARAMS = [
  { id: 'lms-h5-w8', label: 'H5 (32 sigs)', maxSigs: 32 },
  { id: 'lms-h10-w4', label: 'H10 (1,024 sigs)', maxSigs: 1024 },
  { id: 'lms-h5-w4', label: 'H5/W4 (32 sigs)', maxSigs: 32 },
] as const

type DemoParamId = (typeof DEMO_PARAMS)[number]['id']

interface SignatureLogEntry {
  index: number
  message: string
  timestamp: number
}

export const StateManagementVisualizer: React.FC = () => {
  const [selectedDemoId, setSelectedDemoId] = useState<DemoParamId>('lms-h5-w8')
  const [counter, setCounter] = useState(0)
  const [signatureLog, setSignatureLog] = useState<SignatureLogEntry[]>([])
  const [isExhausted, setIsExhausted] = useState(false)
  const [showStateLossExplainer, setShowStateLossExplainer] = useState(false)
  const [simulatedStateLoss, setSimulatedStateLoss] = useState(false)
  const [reusedIndex, setReusedIndex] = useState<number | null>(null)

  const selectedDemo = DEMO_PARAMS.find((p) => p.id === selectedDemoId) || DEMO_PARAMS[0]
  const selectedParam: LMSParameterSet =
    LMS_PARAMETER_SETS.find((p) => p.id === selectedDemoId) || LMS_PARAMETER_SETS[0]

  const maxSigs = selectedDemo.maxSigs
  const progressPercent = Math.min(100, (counter / maxSigs) * 100)
  const remainingSigs = maxSigs - counter

  const handleSign = useCallback(() => {
    if (isExhausted) return

    const newCounter = counter + 1
    const newEntry: SignatureLogEntry = {
      index: counter,
      message: `Document_${String(newCounter).padStart(4, '0')}.pdf`,
      timestamp: Date.now(),
    }

    setCounter(newCounter)
    setSignatureLog((prev) => [newEntry, ...prev].slice(0, 20))

    if (newCounter >= maxSigs) {
      setIsExhausted(true)
    }
  }, [counter, isExhausted, maxSigs])

  const handleBatchSign = useCallback(
    (count: number) => {
      if (isExhausted) return

      const actualCount = Math.min(count, remainingSigs)
      const newCounter = counter + actualCount
      const newEntries: SignatureLogEntry[] = Array.from({ length: actualCount }, (_, i) => ({
        index: counter + i,
        message: `Batch_${String(counter + i + 1).padStart(4, '0')}.bin`,
        timestamp: Date.now() + i,
      }))

      setCounter(newCounter)
      setSignatureLog((prev) => [...newEntries.reverse(), ...prev].slice(0, 20))

      if (newCounter >= maxSigs) {
        setIsExhausted(true)
      }
    },
    [counter, isExhausted, maxSigs, remainingSigs]
  )

  const handleSimulateStateLoss = useCallback(() => {
    if (counter === 0) return
    const lostToIndex = Math.max(0, counter - Math.ceil(counter / 3))
    setCounter(lostToIndex)
    setSimulatedStateLoss(true)
    setReusedIndex(lostToIndex)
    setIsExhausted(false)
  }, [counter])

  const handleReset = useCallback(() => {
    setCounter(0)
    setSignatureLog([])
    setIsExhausted(false)
    setSimulatedStateLoss(false)
    setReusedIndex(null)
  }, [])

  const handleParamChange = useCallback(
    (id: DemoParamId) => {
      if (id === selectedDemoId) return
      setSelectedDemoId(id)
      handleReset()
    },
    [selectedDemoId, handleReset]
  )

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">State Management Simulator</h3>
        <p className="text-sm text-muted-foreground">
          Experience the stateful signature lifecycle: sign messages, watch the counter advance, and
          see what happens when the key is exhausted or state is lost.
        </p>
      </div>

      {/* Parameter selector */}
      <div className="flex flex-wrap gap-2">
        {DEMO_PARAMS.map((param) => (
          <button
            key={param.id}
            onClick={() => handleParamChange(param.id as DemoParamId)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              selectedDemoId === param.id
                ? 'bg-primary/20 text-primary border border-primary/50'
                : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
            }`}
          >
            {param.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: State dashboard */}
        <div className="space-y-4">
          {/* Counter and progress */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-foreground">Signature Counter</h4>
              <span className="text-2xl font-bold font-mono text-primary">
                {counter} / {formatSignatureCount(maxSigs)}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-background rounded-full h-4 border border-border mb-2">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isExhausted
                    ? 'bg-destructive'
                    : progressPercent > 80
                      ? 'bg-warning'
                      : 'bg-primary/60'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Used: {counter}</span>
              <span>
                Remaining: {remainingSigs > 0 ? formatSignatureCount(remainingSigs) : 'NONE'}
              </span>
            </div>

            {/* Warning thresholds */}
            {progressPercent > 80 && !isExhausted && (
              <div className="mt-3 flex items-center gap-2 bg-warning/10 rounded p-2 border border-warning/30">
                <AlertTriangle size={14} className="text-warning shrink-0" />
                <p className="text-[10px] text-warning">
                  Warning: {Math.round(progressPercent)}% of signing capacity used. Plan key
                  rotation.
                </p>
              </div>
            )}
          </div>

          {/* Catastrophic warning */}
          {isExhausted && (
            <div className="bg-destructive/10 rounded-lg p-4 border border-destructive/30 animate-pulse">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert size={18} className="text-destructive" />
                <span className="text-sm font-bold text-destructive">KEY EXHAUSTED</span>
              </div>
              <p className="text-xs text-foreground/80">
                All {formatSignatureCount(maxSigs)} one-time signature keys have been used. This key
                MUST be retired. Any further signing would require generating a new key pair. In a
                real system, continued use would reuse OTS keys and{' '}
                <strong>completely compromise the scheme</strong>.
              </p>
            </div>
          )}

          {/* State loss warning */}
          {simulatedStateLoss && reusedIndex !== null && (
            <div className="bg-destructive/10 rounded-lg p-4 border border-destructive/30">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={18} className="text-destructive" />
                <span className="text-sm font-bold text-destructive">
                  STATE LOSS DETECTED &mdash; KEY COMPROMISE
                </span>
              </div>
              <p className="text-xs text-foreground/80">
                State was rolled back to index {reusedIndex}. OTS keys from index {reusedIndex} to{' '}
                {signatureLog.length > 0 ? signatureLog[0].index : counter} will be reused if
                signing continues. <strong>This constitutes a complete break</strong> &mdash; an
                attacker observing two signatures from the same OTS key can forge arbitrary
                signatures. The key MUST be revoked immediately.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSign}
              disabled={isExhausted}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <PenLine size={14} />
              Sign Message
            </button>
            {maxSigs > 32 && (
              <button
                onClick={() => handleBatchSign(10)}
                disabled={isExhausted}
                className="flex items-center gap-2 px-4 py-2 bg-secondary/20 text-secondary font-medium rounded-lg hover:bg-secondary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm border border-secondary/30"
              >
                Batch Sign (10)
              </button>
            )}
            <button
              onClick={handleSimulateStateLoss}
              disabled={counter === 0}
              className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive font-medium rounded-lg hover:bg-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm border border-destructive/30"
            >
              <AlertTriangle size={14} />
              Simulate State Loss
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm border border-border"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
        </div>

        {/* Right: Log and explainer */}
        <div className="space-y-4">
          {/* Signature log */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h4 className="text-sm font-bold text-foreground mb-3">Signature Log</h4>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {signatureLog.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No signatures yet. Click &quot;Sign Message&quot; to begin.
                </p>
              ) : (
                signatureLog.map((entry) => (
                  <div
                    key={`${entry.index}-${entry.timestamp}`}
                    className={`flex items-center gap-2 text-[10px] font-mono px-2 py-1 rounded ${
                      simulatedStateLoss && reusedIndex !== null && entry.index >= reusedIndex
                        ? 'bg-destructive/5 border border-destructive/20 text-destructive'
                        : 'bg-background/50 text-muted-foreground'
                    }`}
                  >
                    <CheckCircle size={10} className="text-success shrink-0" />
                    <span className="text-primary font-bold w-12">
                      #{String(entry.index).padStart(4, '0')}
                    </span>
                    <span className="truncate">{entry.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Key parameters summary */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h4 className="text-sm font-bold text-foreground mb-3">Active Key Info</h4>
            <div className="space-y-2">
              {[
                { label: 'Scheme', value: selectedParam.name },
                { label: 'Tree Height', value: `H=${selectedParam.treeHeight}` },
                { label: 'Max Signatures', value: formatSignatureCount(maxSigs) },
                {
                  label: 'State Storage',
                  value: `${counter * 4} bytes (counter + used leaf bitmap)`,
                },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-bold text-foreground">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* State loss explainer toggle */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <button
              onClick={() => setShowStateLossExplainer(!showStateLossExplainer)}
              className="flex items-center gap-2 text-sm font-bold text-foreground w-full"
            >
              <Info size={14} className="text-primary" />
              What happens if state is lost?
              <span className="ml-auto text-xs text-primary">
                {showStateLossExplainer ? 'Hide' : 'Show'}
              </span>
            </button>
            {showStateLossExplainer && (
              <div className="mt-3 space-y-3 text-xs text-foreground/80">
                <p>
                  In stateful hash-based signatures, the private key state includes a{' '}
                  <strong>monotonic counter</strong> tracking the next unused OTS leaf. If this
                  counter is lost (via VM snapshot restore, backup restoration, or crash without
                  flush), the signer may unknowingly reuse a one-time key.
                </p>
                <div className="space-y-2">
                  <div className="bg-destructive/5 rounded p-2 border border-destructive/20">
                    <span className="font-bold text-destructive">
                      Scenario 1: VM Snapshot Restore
                    </span>
                    <p className="text-muted-foreground mt-1">
                      VM is snapshotted at counter=100. Signing continues to counter=150. VM is
                      restored to snapshot. Counter resets to 100. Leaves 100&ndash;149 will be
                      reused. An attacker with both signatures from any reused leaf can forge.
                    </p>
                  </div>
                  <div className="bg-destructive/5 rounded p-2 border border-destructive/20">
                    <span className="font-bold text-destructive">
                      Scenario 2: Crash Before Flush
                    </span>
                    <p className="text-muted-foreground mt-1">
                      System signs at counter=50 but crashes before persisting counter=51 to disk.
                      On restart, counter reads 50. Leaf 50 will be reused on next signature.
                    </p>
                  </div>
                  <div className="bg-destructive/5 rounded p-2 border border-destructive/20">
                    <span className="font-bold text-destructive">Scenario 3: Key Cloning</span>
                    <p className="text-muted-foreground mt-1">
                      Private key (including counter) is copied to a second server for redundancy.
                      Both servers sign independently, reusing all leaves. Every signature from the
                      clone is potentially forgeable.
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  <strong>Mitigation:</strong> Always use hardware monotonic counters (TPM/HSM),
                  write-ahead logging, and never duplicate stateful signing keys.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
