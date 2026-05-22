// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { RecommendedPathBanner } from './RecommendedPathBanner'
import { useModuleStore } from '../../store/useModuleStore'
import { PERSONAS } from '@/data/learningPersonas'

describe('RecommendedPathBanner', () => {
  beforeEach(() => {
    useModuleStore.setState({ modules: {} })
  })

  it('renders the persona label, module count, checkpoint count, and hours', () => {
    const onResume = vi.fn()
    render(
      <MemoryRouter>
        <RecommendedPathBanner personaId="executive" onResume={onResume} />
      </MemoryRouter>
    )

    const persona = PERSONAS.executive
    const moduleCount = persona.pathItems.filter((p) => p.type === 'module').length
    const checkpointCount = persona.pathItems.filter((p) => p.type === 'checkpoint').length
    const expectedHours = `~${Math.round(persona.estimatedMinutes / 60)}h`

    expect(screen.getByText(persona.label)).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(`${moduleCount} modules · ${checkpointCount} checkpoints · ${expectedHours}`))
    ).toBeInTheDocument()
  })

  it('shows the first incomplete module as the resume target', () => {
    const persona = PERSONAS.executive
    const firstModuleId = persona.pathItems.find((p) => p.type === 'module')?.moduleId as string
    const onResume = vi.fn()

    render(
      <MemoryRouter>
        <RecommendedPathBanner personaId="executive" onResume={onResume} />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /Resume/ }))
    expect(onResume).toHaveBeenCalledWith(firstModuleId)
  })

  it('hides the Resume button when every module is completed', () => {
    const persona = PERSONAS.executive
    const allCompleted: Record<string, { status: 'completed'; completedSteps: string[]; learnSectionChecks: Record<string, boolean> }> = {}
    for (const item of persona.pathItems) {
      if (item.type === 'module') {
        allCompleted[item.moduleId] = { status: 'completed', completedSteps: [], learnSectionChecks: {} }
      }
    }
    useModuleStore.setState({ modules: allCompleted })

    render(
      <MemoryRouter>
        <RecommendedPathBanner personaId="executive" onResume={() => {}} />
      </MemoryRouter>
    )

    expect(screen.queryByRole('button', { name: /Resume/ })).not.toBeInTheDocument()
  })
})
