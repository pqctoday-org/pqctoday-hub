// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DeploymentPlaybook } from './DeploymentPlaybook'
import type { ExecutiveDocument } from '@/services/storage/types'
import type { RoadmapOutput } from '../types'

const addExecutiveDocument = vi.fn()
let mockExecutiveDocuments: ExecutiveDocument[] = []

vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: (selector?: (s: unknown) => unknown) => {
    const state = {
      addExecutiveDocument,
      artifacts: { executiveDocuments: mockExecutiveDocuments },
    }
    return selector ? selector(state) : state
  },
}))

const sampleRoadmapOutput: RoadmapOutput = {
  milestones: [{ label: 'Inventory complete', year: 2027, phaseId: 'p1' }],
  earliestYear: 2027,
}

describe('DeploymentPlaybook — roadmap output chaining', () => {
  beforeEach(() => {
    mockExecutiveDocuments = []
    addExecutiveDocument.mockClear()
  })

  it('renders without a roadmap banner when no output is available anywhere', () => {
    render(<DeploymentPlaybook />)
    expect(screen.queryByText(/roadmap milestone/i)).not.toBeInTheDocument()
  })

  it('shows the roadmap banner when roadmapOutput is passed as a live prop', () => {
    render(<DeploymentPlaybook roadmapOutput={sampleRoadmapOutput} />)
    expect(screen.getByText(/1 roadmap milestone from Step 1/i)).toBeInTheDocument()
  })

  it('falls back to the last saved Roadmap Builder artifact when no prop is passed', () => {
    mockExecutiveDocuments = [
      {
        id: 'migration-roadmap-1',
        moduleId: 'migration-program',
        type: 'migration-roadmap',
        title: 'PQC Migration Roadmap',
        data: '',
        createdAt: Date.now(),
        inputs: {},
        output: sampleRoadmapOutput,
      },
    ]
    render(<DeploymentPlaybook />)
    expect(
      screen.getByText(/1 roadmap milestone from your last Roadmap Builder export/i)
    ).toBeInTheDocument()
  })
})

describe('DeploymentPlaybook — checklist persistence', () => {
  beforeEach(() => {
    mockExecutiveDocuments = []
    addExecutiveDocument.mockClear()
  })

  it('restores previously-checked items instead of always starting empty', () => {
    // OpsChecklist's checkedItems state used to always initialize to new
    // Set() with no restore path at all, so a saved playbook looked reset
    // on every remount even though the save itself succeeded.
    mockExecutiveDocuments = [
      {
        id: 'deployment-playbook-1',
        moduleId: 'migration-program',
        type: 'deployment-playbook',
        title: 'PQC Deployment Playbook',
        data: '',
        createdAt: Date.now(),
        inputs: { checkedItems: ['prep-feature-flags'] },
      },
    ]
    render(<DeploymentPlaybook />)
    const checkbox = screen.getAllByRole('checkbox')[0]
    expect(checkbox).toBeChecked()
  })

  it('starts unchecked when nothing was saved before', () => {
    render(<DeploymentPlaybook />)
    const checkbox = screen.getAllByRole('checkbox')[0]
    expect(checkbox).not.toBeChecked()
  })
})
