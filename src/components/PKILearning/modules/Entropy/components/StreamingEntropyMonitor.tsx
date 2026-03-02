// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Activity, Play, Pause, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getRandomBytes } from '@/utils/webCrypto'
import { runAllTests, type TestResult } from '../utils/entropyTests'
import { mathRandomBytes, type LCGResult, lcgBytes } from '../utils/outputFormatters'
import {
  BAD_SAMPLE_ZEROS,
  BAD_SAMPLE_PATTERN,
  BAD_SAMPLE_INCREMENT,
} from '../utils/entropyConstants'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { EntropyGauge } from './EntropyGauge'
import { BitMatrixGrid } from './BitMatrixGrid'

type StreamSource = 'webcrypto' | 'mathrandom' | 'lcg' | 'zeros' | 'pattern' | 'increment'

const SOURCE_ITEMS = [
  { id: 'webcrypto', label: 'Web Crypto (Good)' },
  { id: 'mathrandom', label: 'Math.random()' },
  { id: 'lcg', label: 'Timestamp LCG' },
  { id: 'zeros', label: 'All Zeros (Bad)' },
  { id: 'pattern', label: 'Repeating 0xDEADBEEF' },
  { id: 'increment', label: 'Incrementing (Bad)' },
]

const SPEED_ITEMS = [
  { id: '200', label: 'Fast (200ms)' },
  { id: '500', label: 'Normal (500ms)' },
  { id: '1000', label: 'Slow (1s)' },
  { id: '2000', label: 'Very Slow (2s)' },
]

const BATCH_SIZE = 64
const HISTORY_LENGTH = 20

/** Which tests have "higher is better" semantics */
const HIGHER_IS_BETTER: Record<string, boolean> = {
  'Frequency (Monobit)': false, // value = deviation from 0.5, lower is better
  'Runs Test': false, // value = z-score, lower is better
  'Chi-Squared': false, // value = chi-sq stat, lower is better
  'Repetition Count': false, // value = max run length, lower is better
  'Min-Entropy': true, // value = bits/byte, higher is better
}

interface HistoryEntry {
  results: TestResult[]
}

function generateBatch(
  source: StreamSource,
  lcgStateRef: React.MutableRefObject<number>
): Uint8Array {
  switch (source) {
    case 'webcrypto':
      return getRandomBytes(BATCH_SIZE)
    case 'mathrandom':
      return mathRandomBytes(BATCH_SIZE)
    case 'lcg': {
      const result: LCGResult = lcgBytes(BATCH_SIZE, lcgStateRef.current)
      lcgStateRef.current = result.finalState
      return result.bytes
    }
    case 'zeros':
      return new Uint8Array(BAD_SAMPLE_ZEROS)
    case 'pattern':
      return new Uint8Array(BAD_SAMPLE_PATTERN)
    case 'increment':
      return new Uint8Array(BAD_SAMPLE_INCREMENT)
  }
}

export const StreamingEntropyMonitor: React.FC = () => {
  const [source, setSource] = useState<StreamSource>('webcrypto')
  const [speed, setSpeed] = useState(500)
  const [running, setRunning] = useState(false)
  const [currentData, setCurrentData] = useState<Uint8Array | null>(null)
  const [currentResults, setCurrentResults] = useState<TestResult[] | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [sampleCount, setSampleCount] = useState(0)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lcgStateRef = useRef(0)
  const sourceRef = useRef(source)
  const speedRef = useRef(speed)

  // Initialize LCG seed on mount
  useEffect(() => {
    lcgStateRef.current = Date.now() & 0xffffffff
  }, [])

  // Keep refs in sync
  useEffect(() => {
    sourceRef.current = source
  }, [source])

  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  const tick = useCallback(() => {
    const batch = generateBatch(sourceRef.current, lcgStateRef)
    const results = runAllTests(batch)

    setCurrentData(batch)
    setCurrentResults(results)
    setSampleCount((c) => c + 1)
    setHistory((prev) => {
      const next = [...prev, { results }]
      if (next.length > HISTORY_LENGTH) next.shift()
      return next
    })
  }, [])

  const start = useCallback(() => {
    if (intervalRef.current) return
    setRunning(true)
    // Generate first batch immediately
    tick()
    intervalRef.current = setInterval(tick, speedRef.current)
  }, [tick])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setRunning(false)
  }, [])

  const reset = useCallback(() => {
    stop()
    setCurrentData(null)
    setCurrentResults(null)
    setHistory([])
    setSampleCount(0)
    lcgStateRef.current = Date.now() & 0xffffffff
  }, [stop])

  // Restart interval when speed changes while running
  useEffect(() => {
    if (running && intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = setInterval(tick, speed)
    }
  }, [speed, running, tick])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Build sparkline histories per test
  const testHistories = useMemo(() => {
    const map: Record<string, number[]> = {}
    for (const entry of history) {
      for (const result of entry.results) {
        if (!map[result.name]) map[result.name] = []
        map[result.name].push(result.value)
      }
    }
    return map
  }, [history])

  const passCount = currentResults?.filter((r) => r.passed).length ?? 0
  const totalTests = currentResults?.length ?? 5

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Activity size={20} className="text-primary" />
        <div>
          <h3 className="text-base font-semibold text-foreground">Streaming Entropy Monitor</h3>
          <p className="text-xs text-muted-foreground">
            Watch entropy quality in real-time. Switch sources mid-stream to see tests respond.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <FilterDropdown
          items={SOURCE_ITEMS}
          selectedId={source}
          onSelect={(id) => setSource(id as StreamSource)}
          label="Source"
          noContainer
        />

        <FilterDropdown
          items={SPEED_ITEMS}
          selectedId={String(speed)}
          onSelect={(id) => setSpeed(Number(id))}
          label="Speed"
          noContainer
        />

        {!running ? (
          <Button variant="gradient" size="sm" onClick={start} className="gap-1.5">
            <Play size={14} />
            Start
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={stop} className="gap-1.5">
            <Pause size={14} />
            Pause
          </Button>
        )}

        <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5">
          <RotateCcw size={14} />
          Reset
        </Button>

        {sampleCount > 0 && (
          <span className="text-xs text-muted-foreground ml-auto">
            {sampleCount} samples ({(sampleCount * BATCH_SIZE).toLocaleString()} bytes)
          </span>
        )}
      </div>

      {/* Status bar */}
      {currentResults && (
        <div className="flex items-center gap-3">
          <div
            className={`h-2 w-2 rounded-full ${running ? 'animate-pulse' : ''} ${
              passCount === totalTests
                ? 'bg-success'
                : passCount === 0
                  ? 'bg-destructive'
                  : 'bg-warning'
            }`}
          />
          <span
            className={`text-xs font-bold ${
              passCount === totalTests
                ? 'text-success'
                : passCount === 0
                  ? 'text-destructive'
                  : 'text-warning'
            }`}
          >
            {passCount}/{totalTests} Tests Passing
          </span>
        </div>
      )}

      {/* Gauges */}
      {currentResults ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {currentResults.map((result) => (
            <EntropyGauge
              key={result.name}
              label={result.name}
              value={result.value}
              threshold={result.threshold}
              passed={result.passed}
              higherIsBetter={HIGHER_IS_BETTER[result.name] ?? false}
              history={testHistories[result.name] ?? []}
            />
          ))}
        </div>
      ) : (
        <div className="glass-panel p-8 text-center text-sm text-muted-foreground">
          Click Start to begin streaming entropy data
        </div>
      )}

      {/* Current data visualization */}
      {currentData && (
        <div className="glass-panel p-4">
          <BitMatrixGrid data={currentData} compact />
        </div>
      )}

      {/* Educational note */}
      <div className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3 space-y-1">
        <p>
          <strong className="text-foreground">Try this:</strong> Start with Web Crypto, then switch
          to &quot;All Zeros&quot; or &quot;Repeating 0xDEADBEEF&quot; mid-stream. Watch how quickly
          the gauges react — some tests (min-entropy, repetition count) detect bad data immediately,
          while others (chi-squared) may take a sample or two.
        </p>
      </div>
    </div>
  )
}
