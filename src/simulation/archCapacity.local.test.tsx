// SPDX-License-Identifier: GPL-3.0-only
/**
 * 09-28 content plan decision P5 — the Pilots architecture step can need more
 * migration decisions than the P5 effort gate has unlocked. The rule stays;
 * the player is told (Decide card + the architecture panel) and pointed at the
 * other P5 tasks.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { archCapacity, archStepShortfall } from './archCapacity'
import { SIM_TREES, flattenTree, isGatingStep } from '@/simulation'
import { ArchitecturePanel } from '@/components/Simulation/ArchitecturePanel'
import { DecisionSection } from '@/components/Simulation/sections'
import { useSimulationStore } from '@/store/useSimulationStore'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'

vi.mock('@/components/Simulation/MermaidDiagram', () => ({ MermaidDiagram: () => null }))

describe('archCapacity / archStepShortfall', () => {
  it('matches the effort-gate formula (floor(p5Frac × migratable))', () => {
    // small org: 3 migratable links
    expect(archCapacity('small', 0.5, {})).toMatchObject({ migratable: 3, unlocked: 1, done: 0 })
    expect(archCapacity('small', 1, {}).unlocked).toBe(3)
  })

  it('reproduces the real shortfall at the P5 architecture steps (sequential play)', () => {
    const flat = flattenTree(SIM_TREES.p5!).filter(isGatingStep)
    const archSteps = flat
      .map((s, i) => ({ s, frac: i / flat.length }))
      .filter(({ s }) => s.kind === 'architecture')
    expect(archSteps.length).toBeGreaterThan(0)
    // at least one architecture step is short for every org size when reached in order
    for (const size of ['small', 'mid', 'large', 'global'] as const) {
      const short = archSteps.some(
        ({ s, frac }) => archStepShortfall(size, frac, {}, s.minDecisions ?? 0) !== null
      )
      expect(short, size).toBe(true)
    }
  })

  it('is null once enough links are unlocked or decided', () => {
    expect(archStepShortfall('small', 1, {}, 2)).toBeNull()
  })
})

describe('the player is told (ArchitecturePanel)', () => {
  beforeEach(() => {
    useSimulationStore.setState({ edgeDecisions: {} })
    useMigrateSelectionStore.setState({ myProducts: [], choice: {} })
  })

  it('says how many the task needs vs unlocked, and links to the other P5 tasks', () => {
    const onGoToProgress = vi.fn()
    render(
      <ArchitecturePanel
        size="small"
        country="US"
        p5Frac={0}
        target={2}
        onGoToProgress={onGoToProgress}
      />
    )
    const note = screen.getByTestId('arch-capacity-note')
    expect(note).toHaveTextContent(/needs 2 migration decisions/)
    expect(note).toHaveTextContent(/unlocked 0 so far/)
    fireEvent.click(screen.getByRole('button', { name: /open the other p5 tasks/i }))
    expect(onGoToProgress).toHaveBeenCalledTimes(1)
  })

  it('keeps the generic message when no step target is involved', () => {
    render(<ArchitecturePanel size="small" country="US" p5Frac={0} />)
    expect(screen.getByTestId('arch-capacity-note')).toHaveTextContent(
      /Complete more P5 \(Execute\) activities/
    )
  })
})

describe('the player is told (Decide card)', () => {
  it('renders the next-move note', () => {
    const p5 = SIM_TREES.p5!
    const band = p5.levels[0]!
    const act = band.activities[0]!
    render(
      <MemoryRouter>
        <DecisionSection
          phaseId="p5"
          ctx={{
            country: { id: 'US', label: 'US', hybrid: 'allowed', endState: 'hybrid' },
            sector: { id: 'financial', label: 'Financial', x: 10 },
            size: { id: 'mid', label: 'Mid-size' },
            over: 0,
          }}
          nextMove={{ band, act, step: act.steps[0]! }}
          level={0}
          stepsDone={0}
          stepsTotal={5}
          pitfalls={p5.pitfalls}
          onVisitRef={() => {}}
          canEmbed={() => true}
          onOpenStep={() => {}}
          note={<span>This task needs 4 migration decisions</span>}
        />
      </MemoryRouter>
    )
    expect(screen.getByText(/This task needs 4 migration decisions/)).toBeInTheDocument()
  })
})
