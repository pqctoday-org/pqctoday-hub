// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { WhereToStartTree } from './WhereToStartTree'
import { START_BRANCHES, crosswalkRows, phaseHeading, routingSourceNote } from './guidedRouting'

const renderTree = () =>
  render(
    <MemoryRouter>
      <WhereToStartTree defaultOpen />
    </MemoryRouter>
  )

// The desktop disclosure and the phone Guided tab read one file; this pins that the desktop
// still shows exactly what that file says.
describe('WhereToStartTree (desktop) reads the shared routing file', () => {
  it('offers every shared statement', () => {
    renderTree()
    for (const b of START_BRANCHES) {
      expect(screen.getByRole('button', { name: b.question })).toBeInTheDocument()
    }
  })

  it('shows the reason, phase, start button and crosswalk of the chosen statement', () => {
    renderTree()
    const branch = START_BRANCHES[1]
    fireEvent.click(screen.getByRole('button', { name: branch.question }))
    expect(screen.getByText(branch.rationale)).toBeInTheDocument()
    expect(screen.getByText(phaseHeading(branch.phase))).toBeInTheDocument()
    expect(screen.getByRole('button', { name: new RegExp(branch.cta) })).toBeInTheDocument()
    for (const row of crosswalkRows(branch.phase)) {
      expect(screen.getByText(row.label)).toBeInTheDocument()
    }
    expect(screen.getByText(routingSourceNote())).toBeInTheDocument()
  })
})
