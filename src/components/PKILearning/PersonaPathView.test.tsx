// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { PersonaPathView, computeNextIncompleteModuleId } from './PersonaPathView'
import { useLearnStore } from '../../store/useLearnStore'
import { useModuleStore } from '../../store/useModuleStore'
import { PERSONAS } from '@/data/learningPersonas'

const noop = () => {}
const falseFn = () => false

const renderView = (
  personaId: 'executive' | 'developer' | 'architect' | 'researcher' | 'ops' | 'curious',
  overrides?: { onShowEverything?: () => void }
) =>
  render(
    <MemoryRouter>
      <PersonaPathView
        personaId={personaId}
        onSelectModule={noop}
        isModuleRelevant={falseFn}
        isModuleAboveLevel={falseFn}
        onShowEverything={overrides?.onShowEverything}
      />
    </MemoryRouter>
  )

const checkpointCount = (personaId: keyof typeof PERSONAS) =>
  PERSONAS[personaId].pathItems.filter((p) => p.type === 'checkpoint').length

describe('PersonaPathView — phase partitioning (P0-4)', () => {
  beforeEach(() => {
    useLearnStore.getState().reset()
    useModuleStore.setState({ modules: {} })
    localStorage.clear()
  })

  it('renders one phase per checkpoint plus a terminal wrap-up for executive', () => {
    renderView('executive')
    // Plan: executive has 5 checkpoints → 6 phases (5 named + wrap-up)
    const expected = checkpointCount('executive') + 1
    const summaries = screen.getAllByRole('group')
    // <details> elements expose role=group — sanity check we have at least the expected count
    expect(summaries.length).toBeGreaterThanOrEqual(expected)
    expect(screen.getByText(/Wrap-up: Take the quiz/i)).toBeInTheDocument()
  })

  it('renders one phase per checkpoint plus a terminal wrap-up for curious', () => {
    renderView('curious')
    // Plan: curious has 4 checkpoints → 5 phases (4 named + wrap-up).
    // P2-2 also surfaces each phase title in the sticky breadcrumb for curious,
    // so titles appear twice (breadcrumb item + <summary> in <details>) — use
    // getAllByText and assert ≥1 occurrence.
    expect(screen.getAllByText(/Understanding the Threat/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Why It Matters/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/What the World Is Doing/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Practical Foundations/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Wrap-up: Take the quiz/i).length).toBeGreaterThan(0)
  })

  it('returns null when persona is unknown', () => {
    // Cast through unknown to exercise the defensive branch in usePersonaPathItems
    const { container } = render(
      <MemoryRouter>
        <PersonaPathView
          // @ts-expect-error — testing the defensive branch
          personaId={'nonsense'}
          onSelectModule={noop}
          isModuleRelevant={falseFn}
          isModuleAboveLevel={falseFn}
        />
      </MemoryRouter>
    )
    expect(container.firstChild).toBeNull()
  })
})

describe('PersonaPathView — curious "Show me everything" escape (P0-3)', () => {
  beforeEach(() => {
    useLearnStore.getState().reset()
    useModuleStore.setState({ modules: {} })
  })

  it('renders the escape button only for curious + when onShowEverything is provided', () => {
    const handler = vi.fn()
    renderView('curious', { onShowEverything: handler })
    expect(screen.getByRole('button', { name: /Show me everything/i })).toBeInTheDocument()
  })

  it('does NOT render the escape for non-curious personas', () => {
    const handler = vi.fn()
    renderView('executive', { onShowEverything: handler })
    expect(screen.queryByRole('button', { name: /Show me everything/i })).not.toBeInTheDocument()
  })

  it('invokes onShowEverything when the escape is clicked', () => {
    const handler = vi.fn()
    renderView('curious', { onShowEverything: handler })
    fireEvent.click(screen.getByRole('button', { name: /Show me everything/i }))
    expect(handler).toHaveBeenCalledTimes(1)
  })
})

describe('computeNextIncompleteModuleId — first-incomplete walk', () => {
  it('returns the first non-completed module from pathItems', () => {
    const pathItems = [
      { type: 'module' as const, moduleId: 'a' },
      { type: 'checkpoint' as const, moduleId: undefined },
      { type: 'module' as const, moduleId: 'b' },
      { type: 'module' as const, moduleId: 'c' },
    ]
    expect(computeNextIncompleteModuleId(pathItems, { a: 'completed', b: 'in-progress' })).toBe('b')
  })

  it('returns null when every module is completed', () => {
    const pathItems = [
      { type: 'module' as const, moduleId: 'a' },
      { type: 'module' as const, moduleId: 'b' },
    ]
    expect(computeNextIncompleteModuleId(pathItems, { a: 'completed', b: 'completed' })).toBeNull()
  })

  it('treats absent modules as not-started (first one wins)', () => {
    const pathItems = [{ type: 'module' as const, moduleId: 'x' }]
    expect(computeNextIncompleteModuleId(pathItems, {})).toBe('x')
  })

  it('skips checkpoint nodes', () => {
    const pathItems = [
      { type: 'checkpoint' as const, moduleId: undefined },
      { type: 'module' as const, moduleId: 'only' },
    ]
    expect(computeNextIncompleteModuleId(pathItems, {})).toBe('only')
  })
})
