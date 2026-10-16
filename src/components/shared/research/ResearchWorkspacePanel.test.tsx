// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'

vi.mock('@/data/libraryData', () => ({ REFERENCE_ID_ALIASES: {}, libraryData: [] }))

import { ResearchWorkspacePanel } from './ResearchWorkspacePanel'

describe('ResearchWorkspacePanel', () => {
  it('shows every part of the workspace, even with nothing saved', () => {
    render(
      <MemoryRouter>
        <ResearchWorkspacePanel />
      </MemoryRouter>
    )
    for (const id of [
      'research-question',
      'research-collections',
      'research-changes',
      'research-claims',
      'research-reproductions',
      'research-bundle-reviewer',
    ]) {
      expect(screen.getByTestId(id)).toBeInTheDocument()
    }
  })
})
