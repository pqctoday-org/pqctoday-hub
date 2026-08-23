// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileMyPathView } from './MobileMyPathView'
import { useModuleStore } from '@/store/useModuleStore'
import { useLearnStore } from '@/store/useLearnStore'
import { PERSONAS } from '@/data/learningPersonas'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'

function renderPath(persona: 'executive' | 'developer' = 'executive') {
  return render(
    <MemoryRouter initialEntries={['/learn']}>
      <MobileMyPathView persona={persona} />
    </MemoryRouter>
  )
}

function markComplete(ids: readonly string[]) {
  const modules: Record<string, { status: string; completedSteps: string[] }> = {}
  for (const id of ids) modules[id] = { status: 'completed', completedSteps: [] }
  useModuleStore.setState({ modules: modules as never })
}

/**
 * usePersonaPathItems is a hook (useMemo-wrapped) — can't be called from
 * plain test code outside a component. This replicates just the "first
 * phase" slice of its real, deterministic partitioning logic (module items
 * up to the first checkpoint) directly off PERSONAS.<id>.pathItems, the same
 * real source the hook itself reads.
 */
function firstPhase(personaId: 'executive' | 'developer') {
  const items = PERSONAS[personaId].pathItems
  const moduleIds: string[] = []
  for (const item of items) {
    if (item.type === 'module') moduleIds.push(item.moduleId)
    else return { title: item.label, moduleIds, categories: item.categories as string[] }
  }
  throw new Error(`${personaId} has no checkpoint — test fixture assumption broke`)
}

beforeEach(() => {
  useModuleStore.setState({ modules: {} })
  useLearnStore.getState().reset()
  localStorage.clear()
})

describe('MobileMyPathView — Essentials tier (matches desktop exactly)', () => {
  it('shows the real essentials module count/minutes and each real module title', () => {
    renderPath('executive')
    const count = PERSONAS.executive.essentials.length
    expect(
      screen.getByText(new RegExp(`Essentials — the core ${count} modules`))
    ).toBeInTheDocument()
    for (const id of PERSONAS.executive.essentials) {
      expect(screen.getByText(MODULE_CATALOG[id].title)).toBeInTheDocument()
    }
  })

  it('renders no phases or checkpoints under Essentials — matches desktop, not the mockup screenshot', () => {
    renderPath('executive')
    expect(screen.queryByText(/Checkpoint quiz/)).not.toBeInTheDocument()
    expect(screen.queryByText(/of \d+ complete/)).not.toBeInTheDocument()
  })

  it('the capstone stays locked until every essential is read', () => {
    renderPath('executive')
    expect(screen.getByRole('button', { name: 'Locked' })).toBeDisabled()
  })

  it('unlocks the capstone once every essential is marked completed', () => {
    markComplete(PERSONAS.executive.essentials)
    renderPath('executive')
    expect(screen.getByRole('button', { name: 'Take it' })).toBeEnabled()
  })
})

describe('MobileMyPathView — Full track (phased, with checkpoint locking)', () => {
  it('switches to Full track via the tier toggle and shows the real first phase title', () => {
    renderPath('executive')
    fireEvent.click(screen.getByRole('tab', { name: /Full track/ }))
    expect(screen.getByText(firstPhase('executive').title)).toBeInTheDocument()
  })

  it("a phase's checkpoint is locked (new mobile behavior) until every module in that phase is read", () => {
    renderPath('executive')
    fireEvent.click(screen.getByRole('tab', { name: /Full track/ }))
    const phase = firstPhase('executive')
    expect(screen.getByText(new RegExp(`Checkpoint quiz — ${phase.title}`))).toBeInTheDocument()
    const quizButtons = screen.getAllByRole('button', { name: 'Locked' })
    expect(quizButtons.length).toBeGreaterThan(0)
  })

  it('unlocks a phase checkpoint to "Take quiz" once every module in that phase is marked completed', () => {
    const phase = firstPhase('executive')
    markComplete(phase.moduleIds)
    renderPath('executive')
    fireEvent.click(screen.getByRole('tab', { name: /Full track/ }))
    // Completing this phase's modules shifts auto-expand to the NEXT
    // incomplete phase (matches desktop's own defaultExpanded=containsNext
    // behavior) — expand this one explicitly to see its now-unlocked row.
    fireEvent.click(screen.getByText(phase.title))
    expect(screen.getByRole('button', { name: 'Take quiz' })).toBeEnabled()
  })

  it('shows "Review quiz", not locked, once the checkpoint is already passed — even without literal module completion', () => {
    const phase = firstPhase('executive')
    const scores: Record<string, number> = {}
    for (const cat of phase.categories) scores[cat] = 100
    useModuleStore.setState({
      modules: { quiz: { status: 'completed', completedSteps: [], quizScores: scores } } as never,
    })
    renderPath('executive')
    fireEvent.click(screen.getByRole('tab', { name: /Full track/ }))
    expect(screen.getByRole('button', { name: 'Review quiz' })).toBeEnabled()
  })
})
