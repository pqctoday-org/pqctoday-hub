// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { ToggleLeft, RotateCcw, Shuffle, CheckCircle, XCircle, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getRandomBytes } from '@/utils/webCrypto'
import { runAllTests, type TestResult } from '../utils/entropyTests'
import { BitMatrixGrid } from './BitMatrixGrid'

const SAMPLE_SIZE = 64 // 64 bytes = 512 bits, good for all tests

function createInitialSample() {
  return getRandomBytes(SAMPLE_SIZE)
}

export const BitFlipExperiment: React.FC = () => {
  const [original, setOriginal] = useState<Uint8Array>(createInitialSample)
  const originalRef = useRef(original)
  useEffect(() => {
    originalRef.current = original
  }, [original])
  const [data, setData] = useState<Uint8Array>(() => new Uint8Array(original))
  const [flippedBits, setFlippedBits] = useState<Set<number>>(() => new Set())

  const testResults = useMemo(() => runAllTests(data), [data])
  const passCount = testResults.filter((r) => r.passed).length

  const totalBits = SAMPLE_SIZE * 8
  const flipCount = flippedBits.size
  const flipPct = ((flipCount / totalBits) * 100).toFixed(1)

  const handleToggleBit = useCallback(
    (byteIdx: number, bitIdx: number) => {
      const globalBit = byteIdx * 8 + bitIdx
      const newData = new Uint8Array(data)
      // Toggle the bit
      const mask = 1 << (7 - bitIdx)
      newData[byteIdx] ^= mask

      const newFlipped = new Set(flippedBits)
      if (newFlipped.has(globalBit)) {
        newFlipped.delete(globalBit)
      } else {
        newFlipped.add(globalBit)
      }

      setData(newData)
      setFlippedBits(newFlipped)
    },
    [data, flippedBits]
  )

  const handleReset = useCallback(() => {
    setData(new Uint8Array(originalRef.current))
    setFlippedBits(new Set())
  }, [])

  const handleNewSample = useCallback(() => {
    const fresh = getRandomBytes(SAMPLE_SIZE)
    setOriginal(fresh)
    setData(new Uint8Array(fresh))
    setFlippedBits(new Set())
  }, [])

  const handleFlipRandom = useCallback(
    (pct: number) => {
      const numFlips = Math.ceil((totalBits * pct) / 100)
      const newData = new Uint8Array(data)
      const newFlipped = new Set(flippedBits)

      // Pick random unflipped bits to flip
      const available: number[] = []
      for (let i = 0; i < totalBits; i++) {
        if (!newFlipped.has(i)) available.push(i)
      }

      for (let f = 0; f < numFlips && available.length > 0; f++) {
        const idx = Math.floor(Math.random() * available.length)
        const globalBit = available[idx]
        available.splice(idx, 1)

        const byteIdx = Math.floor(globalBit / 8)
        const bitIdx = globalBit % 8
        const mask = 1 << (7 - bitIdx)
        newData[byteIdx] ^= mask
        newFlipped.add(globalBit)
      }

      setData(newData)
      setFlippedBits(newFlipped)
    },
    [data, flippedBits, totalBits]
  )

  const handleSetAllZeros = useCallback(() => {
    const newData = new Uint8Array(SAMPLE_SIZE)
    const newFlipped = new Set<number>()
    // Mark all bits that differ from original as flipped
    for (let b = 0; b < SAMPLE_SIZE; b++) {
      for (let bit = 0; bit < 8; bit++) {
        const mask = 1 << (7 - bit)
        if ((originalRef.current[b] & mask) !== (newData[b] & mask)) {
          newFlipped.add(b * 8 + bit)
        }
      }
    }
    setData(newData)
    setFlippedBits(newFlipped)
  }, [])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ToggleLeft size={20} className="text-primary" />
        <div>
          <h3 className="text-base font-semibold text-foreground">Bit Flipping Experiment</h3>
          <p className="text-xs text-muted-foreground">
            Click individual bits to toggle them. Watch how test results change in real time. Which
            test fails first?
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => handleFlipRandom(5)} className="gap-1.5">
          <Shuffle size={12} />
          Flip 5%
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFlipRandom(10)}
          className="gap-1.5"
        >
          <Shuffle size={12} />
          Flip 10%
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFlipRandom(25)}
          className="gap-1.5"
        >
          <Shuffle size={12} />
          Flip 25%
        </Button>
        <Button variant="outline" size="sm" onClick={handleSetAllZeros} className="gap-1.5">
          <Zap size={12} />
          All Zeros
        </Button>
        <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5">
          <RotateCcw size={12} />
          Reset
        </Button>
        <Button variant="ghost" size="sm" onClick={handleNewSample} className="gap-1.5 ml-auto">
          New Sample
        </Button>
      </div>

      {/* Corruption counter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Bits flipped:</span>
          <span
            className={`text-sm font-mono font-bold ${
              flipCount === 0
                ? 'text-foreground'
                : flipCount < totalBits * 0.1
                  ? 'text-warning'
                  : 'text-destructive'
            }`}
          >
            {flipCount} / {totalBits}
          </span>
          <span className="text-[10px] text-muted-foreground">({flipPct}%)</span>
        </div>
        {/* Progress bar */}
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-48">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              flipCount === 0
                ? 'bg-primary'
                : flipCount < totalBits * 0.1
                  ? 'bg-warning'
                  : 'bg-destructive'
            }`}
            style={{ width: `${Math.min((flipCount / totalBits) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Main content: grid + tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bit matrix (interactive) */}
        <div className="glass-panel p-4">
          <BitMatrixGrid
            data={data}
            onToggleBit={handleToggleBit}
            flippedBits={flippedBits}
            bitOnly
          />
        </div>

        {/* Live test results */}
        <div className="glass-panel p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Live Test Results
            </h4>
            <span
              className={`text-xs font-bold ${
                passCount === testResults.length
                  ? 'text-success'
                  : passCount === 0
                    ? 'text-destructive'
                    : 'text-warning'
              }`}
            >
              {passCount}/{testResults.length} Pass
            </span>
          </div>

          <div className="space-y-2">
            {testResults.map((result) => (
              <TestResultRow key={result.name} result={result} />
            ))}
          </div>
        </div>
      </div>

      {/* Educational callout */}
      <div className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3 space-y-1">
        <p>
          <strong className="text-foreground">Try these experiments:</strong>
        </p>
        <ul className="list-disc list-inside space-y-0.5 ml-1">
          <li>Flip a few random bits — do any tests fail?</li>
          <li>
            Click &quot;All Zeros&quot; — notice every test fails. The min-entropy drops to 0.
          </li>
          <li>Use &quot;Flip 10%&quot; repeatedly — which test breaks first?</li>
          <li>
            The frequency test is most sensitive to bias; the runs test catches clumping patterns.
          </li>
        </ul>
      </div>
    </div>
  )
}

/** Compact test result row with live pass/fail indicator */
const TestResultRow: React.FC<{ result: TestResult }> = ({ result }) => (
  <div
    className={`flex items-center gap-3 rounded-lg px-3 py-2 border transition-colors duration-200 ${
      result.passed
        ? 'border-success/30 bg-status-success/5'
        : 'border-destructive/30 bg-status-error/5'
    }`}
  >
    {result.passed ? (
      <CheckCircle size={14} className="text-success shrink-0" />
    ) : (
      <XCircle size={14} className="text-destructive shrink-0" />
    )}
    <div className="flex-1 min-w-0">
      <span className="text-xs font-medium text-foreground">{result.name}</span>
    </div>
    <div className="text-[10px] font-mono text-muted-foreground shrink-0">
      {result.value.toFixed(3)}
      <span className="text-muted-foreground/60"> / {result.threshold.toFixed(3)}</span>
    </div>
  </div>
)
