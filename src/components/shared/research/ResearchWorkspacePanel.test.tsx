// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Link, MemoryRouter } from 'react-router'
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

describe('ResearchWorkspacePanel same-page link', () => {
  it('scrolls into view when an already-mounted panel gets its own hash', () => {
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    render(
      <MemoryRouter>
        <Link to="/business#operations-pack">ops</Link>
        <Link to="/business#research-workspace">research</Link>
        <ResearchWorkspacePanel />
      </MemoryRouter>
    )
    expect(scrollIntoView).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('ops'))
    expect(scrollIntoView).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('research'))
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
  })
})
