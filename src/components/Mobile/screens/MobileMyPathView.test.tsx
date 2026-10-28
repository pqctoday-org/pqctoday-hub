// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router'
import { MobileMyPathView } from './MobileMyPathView'
import { useModuleStore } from '@/store/useModuleStore'
import { useLearnStore } from '@/store/useLearnStore'
import { PERSONAS } from '@/data/learningPersonas'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'

function renderPath(persona: 'executive' | 'developer' | 'cert-engineer' = 'executive') {
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

describe('MobileMyPathView — new-to-PQC pointer', () => {
  it('a path that starts at the certificate links PQC 101 and the Algorithms page as optional background', () => {
    renderPath('cert-engineer')
    const note = screen.getByTestId('new-to-pqc-note')
    expect(note.querySelector('a[href="/learn/pqc-101"]')).not.toBeNull()
    expect(note.querySelector('a[href="/algorithms"]')).not.toBeNull()
  })

  it('keeps the Essentials / Full track labels apart from their times', () => {
    renderPath('cert-engineer')
    for (const name of [/^Essentials/, /^Full track/]) {
      const tab = screen.getByRole('tab', { name })
      // The button is a flex row, so the space in the text collapses: the gap has to come from the class.
      expect(tab.className).toMatch(/(^|\s)gap-1(\s|$)/)
      expect(tab).toHaveTextContent(/^(Essentials|Full track) \d+h/)
    }
  })

  it('a path that already opens with PQC 101 shows no such note', () => {
    renderPath('executive')
    expect(screen.queryByTestId('new-to-pqc-note')).toBeNull()
  })
})

describe('MobileMyPathView — long module titles', () => {
  const LONG = MODULE_CATALOG['crypto-product-certification'].title

  /** A title wraps in full: no clamp, no ellipsis, and its row grows instead of keeping 44 px. */
  function expectWrapsInFull(title: HTMLElement) {
    expect(title).toHaveClass('whitespace-normal', 'break-words')
    expect(title.className).not.toMatch(/line-clamp/)
    expect(title).not.toHaveClass('truncate')
    const row = title.closest('button')!
    expect(row).toHaveClass('h-auto', 'min-h-11')
    expect(row.className).not.toMatch(/(^|\s)h-11(\s|$)/)
  }

  it('wraps a long module title in full in the Essentials list instead of cutting it', () => {
    renderPath('cert-engineer')
    expectWrapsInFull(screen.getByText(LONG))
  })

  it('wraps every module title in full in the Full track list too, at any width', () => {
    renderPath('cert-engineer')
    fireEvent.click(screen.getByRole('tab', { name: /Full track/ }))
    const titles = screen.getAllByText(/./, { selector: 'button span.whitespace-normal' })
    expect(titles.length).toBeGreaterThan(0)
    for (const title of titles) expectWrapsInFull(title)
    expect(screen.getAllByText(LONG).length).toBeGreaterThan(0)
  })
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
    const takeQuiz = screen.getByRole('button', { name: 'Take quiz' })
    expect(takeQuiz).toBeEnabled()
    // 2026-08-24 audit R5: was h-8 (32px), under the 44px touch-target floor.
    expect(takeQuiz).toHaveClass('h-11')
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

  // 2026-08-24 audit R4.1: tapping "Take quiz" navigated with no location
  // state at all, so Quiz/index.tsx's `checkpointState?.checkpointLabel ??
  // persona?.label` fell through to the PERSONA label — a Foundations
  // checkpoint quiz opened headed "CISO"/"Executive" instead of the phase
  // it actually gates. Renders a probe at the real destination route to
  // prove the navigation itself carries the right state, not just that the
  // button text says the right phase name.
  it('"Take quiz" navigates with the real phase title as checkpointLabel, not the persona label', () => {
    const phase = firstPhase('executive')
    markComplete(phase.moduleIds)
    function LocationProbe() {
      const location = useLocation()
      const state = location.state as { checkpointLabel?: string } | null
      return <div data-testid="probe">{state?.checkpointLabel ?? 'NO STATE'}</div>
    }
    render(
      <MemoryRouter initialEntries={['/learn']}>
        <Routes>
          <Route path="/learn" element={<MobileMyPathView persona="executive" />} />
          <Route path="/learn/quiz" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('tab', { name: /Full track/ }))
    fireEvent.click(screen.getByText(phase.title))
    fireEvent.click(screen.getByRole('button', { name: 'Take quiz' }))
    expect(screen.getByTestId('probe')).toHaveTextContent(`Checkpoint quiz — ${phase.title}`)
  })
})
