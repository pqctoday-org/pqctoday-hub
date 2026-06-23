// SPDX-License-Identifier: GPL-3.0-only
/**
 * useSimAutoRunPlayer — the LIVE guided playthrough.
 *
 * Walks the auto-run queue at a human pace: per gating step it switches to the
 * phase, opens the tool inline (`openStep`), genuinely completes it
 * (`completeStepGenuine`), and narrates a caption. Pause / resume / stop / speed
 * are included. Scenario (sandbox-lab) steps are excluded by the queue (non-gating).
 * When the walk ends, every lifecycle phase has reached its win level, so the sim's
 * own run-complete ceremony fires.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSimulationStore } from '@/store/useSimulationStore'
import type { PhaseId } from '@/data/frameworkPhases'
import type { TreeStep } from '@/simulation'
import { autoRunQueue, completeStepGenuine, type AutoRunQueueItem } from './simAutoRun'

export type AutoRunSpeed = 'slow' | 'normal' | 'fast'

export interface SimAutoRunPlayer {
  running: boolean
  paused: boolean
  done: boolean
  caption: string
  phaseLabel: string
  index: number
  total: number
  speed: AutoRunSpeed
  start: () => void
  pause: () => void
  resume: () => void
  stop: () => void
  cycleSpeed: () => void
}

function delayFor(speed: AutoRunSpeed): number {
  switch (speed) {
    case 'slow':
      return 2600
    case 'fast':
      return 500
    default:
      return 1300
  }
}

function phaseLabel(phase: PhaseId): string {
  if (phase === 'foundations') return 'Foundations'
  if (phase === 'verify-close') return 'Verify & Close'
  return `Phase ${phase.slice(1)}`
}

function kindVerb(kind: TreeStep['kind']): string {
  switch (kind) {
    case 'learn':
      return 'Studying'
    case 'activity':
      return 'Producing'
    case 'workshop':
      return 'Practising'
    case 'scenario':
      return 'Running'
    default:
      return 'Reviewing'
  }
}

function narrationFor(item: AutoRunQueueItem): string {
  return `${phaseLabel(item.phase)} — ${kindVerb(item.step.kind)}: ${item.step.label}`
}

export function useSimAutoRunPlayer(openStep: (s: TreeStep) => void): SimAutoRunPlayer {
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [done, setDone] = useState(false)
  const [index, setIndex] = useState(0)
  const [total, setTotal] = useState(0)
  const [caption, setCaption] = useState('')
  const [label, setLabel] = useState('')
  const [speed, setSpeed] = useState<AutoRunSpeed>('normal')

  const queueRef = useRef<AutoRunQueueItem[]>([])
  const lastPhaseRef = useRef<PhaseId | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Keep the latest openStep without making it an effect dependency (the sim
  // recreates the closure each render; depending on it would reset the timer).
  const openStepRef = useRef(openStep)
  useEffect(() => {
    openStepRef.current = openStep
  }, [openStep])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    clearTimer()
    const q = autoRunQueue()
    queueRef.current = q
    lastPhaseRef.current = null
    setTotal(q.length)
    setIndex(0)
    setDone(false)
    setPaused(false)
    setLabel('')
    setCaption('Starting the migration playthrough…')
    setRunning(true)
  }, [clearTimer])

  const pause = useCallback(() => setPaused(true), [])
  const resume = useCallback(() => setPaused(false), [])
  const stop = useCallback(() => {
    clearTimer()
    setRunning(false)
    setPaused(false)
  }, [clearTimer])
  const cycleSpeed = useCallback(
    () => setSpeed((s) => (s === 'normal' ? 'fast' : s === 'fast' ? 'slow' : 'normal')),
    []
  )

  useEffect(() => {
    if (!running || paused || done) return
    const q = queueRef.current
    const item = q.at(index)
    if (!item) return
    timerRef.current = setTimeout(
      () => {
        if (item.phase !== lastPhaseRef.current) {
          lastPhaseRef.current = item.phase
          useSimulationStore.getState().setSel(item.phase)
          setLabel(phaseLabel(item.phase))
        }
        openStepRef.current(item.step)
        completeStepGenuine(item.step)
        const next = index + 1
        if (next >= q.length) {
          // Last gating step done — the sim's own run-complete ceremony fires.
          setCaption('Migration complete — every phase cleared.')
          setRunning(false)
          setDone(true)
        } else {
          setCaption(narrationFor(item))
          setIndex(next)
        }
      },
      index === 0 ? 350 : delayFor(speed)
    )
    return clearTimer
  }, [running, paused, done, index, speed, clearTimer])

  // Stop the timer if the sim unmounts mid-run.
  useEffect(() => clearTimer, [clearTimer])

  return {
    running,
    paused,
    done,
    caption,
    phaseLabel: label,
    index,
    total,
    speed,
    start,
    pause,
    resume,
    stop,
    cycleSpeed,
  }
}
