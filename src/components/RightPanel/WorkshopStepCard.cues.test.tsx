// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { readFileSync, readdirSync } from 'node:fs'
import { WorkshopStepCard } from './WorkshopStepCard'
import { useWorkshopOverlayStore } from '@/store/useWorkshopOverlayStore'
import { useWorkshopStore } from '@/store/useWorkshopStore'
import type { WorkshopCue, WorkshopFlow, WorkshopStep } from '@/types/Workshop'
import '@testing-library/jest-dom'

const FLOW_DIR = 'public/workshop'

function loadFlows(): WorkshopFlow[] {
  return readdirSync(FLOW_DIR)
    .filter((f) => f.endsWith('.json') && f !== 'index.json')
    .map((f) => JSON.parse(readFileSync(`${FLOW_DIR}/${f}`, 'utf8')) as WorkshopFlow)
}

function stepsOf(flow: WorkshopFlow): WorkshopStep[] {
  return [
    flow.intro,
    flow.prerequisites,
    ...flow.common,
    ...Object.values(flow.regions ?? {}),
    flow.close,
  ].flatMap((chapter) => chapter.steps)
}

const publishedSteps = loadFlows()
  .flatMap(stepsOf)
  .filter((step) => (step.cues ?? []).some((c) => c.kind !== 'advance'))

const applyCue = vi.fn()
const onNext = vi.fn()

function renderStep(step: WorkshopStep) {
  return render(
    <MemoryRouter>
      <WorkshopStepCard
        step={step}
        flow={null}
        index={0}
        total={1}
        isCompleted={false}
        onBack={null}
        onNext={onNext}
        onSkip={vi.fn()}
        onMarkComplete={vi.fn()}
      />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.useFakeTimers({
    toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'setTimeout'],
  })
  applyCue.mockClear()
  onNext.mockClear()
  useWorkshopOverlayStore.setState({ applyCue })
  // Voice off, normal speed, Workshop Mode running.
  useWorkshopStore.setState({ mode: 'running', playbackSpeed: 'normal', ttsEnabled: false })
})

afterEach(() => {
  vi.useRealTimers()
  useWorkshopStore.setState({ mode: 'idle' })
})

const visible = (step: WorkshopStep): WorkshopCue[] =>
  (step.cues ?? []).filter((c) => c.kind !== 'advance')
const advanceAt = (step: WorkshopStep): number =>
  (step.cues ?? []).find((c) => c.kind === 'advance')?.tMs ?? 0

describe('Workshop step cues run to their last authored cue (voice off)', () => {
  it('the published data has steps with cues later than one minute, so the cases test something', () => {
    const late = publishedSteps.filter((s) => visible(s).some((c) => c.tMs > 60_000))
    expect(late.length).toBeGreaterThan(100)
  })

  it('the developer PQC 101 step still runs its Workshop tab cue after the first minute', () => {
    const step = publishedSteps.find((s) => s.id === 'f-mod-pqc-101')!
    const cue = visible(step).find(
      (c) => c.kind === 'select-tab' && c.tabName === 'Workshop' && c.tMs > 60_000
    )!
    expect(cue).toBeDefined()
    renderStep(step)
    act(() => {
      vi.advanceTimersByTime(cue.tMs + 100)
    })
    expect(applyCue.mock.calls.some(([fired]) => fired === cue)).toBe(true)
  })

  it('every cue of every published step fires, in order, and the step then advances once', () => {
    for (const step of publishedSteps) {
      applyCue.mockClear()
      onNext.mockClear()
      const { unmount } = renderStep(step)
      const lastCue = Math.max(...visible(step).map((c) => c.tMs))
      const advanceTime = Math.max(advanceAt(step), lastCue)

      act(() => {
        vi.advanceTimersByTime(advanceTime - 200)
      })
      // Not advanced early: the step holds until its own advance time.
      expect(onNext, `${step.id} advanced early`).not.toHaveBeenCalled()
      act(() => {
        vi.advanceTimersByTime(600)
      })
      const fired = applyCue.mock.calls.map(([cue]) => cue as WorkshopCue)
      expect(fired, `${step.id} cues`).toEqual([...visible(step)].sort((a, b) => a.tMs - b.tMs))
      expect(onNext, `${step.id} advance`).toHaveBeenCalledTimes(1)
      unmount()
    }
  }, 120_000)
})
