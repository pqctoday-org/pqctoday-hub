// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { RoleToolsRow } from './RoleToolsRow'
import { toolsForRole } from '@/data/roleTools'

function renderRow(personaId: Parameters<typeof RoleToolsRow>[0]['personaId']) {
  return render(
    <MemoryRouter>
      <RoleToolsRow personaId={personaId} />
    </MemoryRouter>
  )
}

describe('RoleToolsRow counts', () => {
  it('does not claim the researcher\'s suggested Command Center tools "name this role"', () => {
    renderRow('researcher')
    const { playground, business } = toolsForRole('researcher')
    expect(screen.getByTestId('role-tools-counts')).toHaveTextContent(
      `${playground.length} Playground tools name this role. ${business.length} Command Center tools are suggested starting points.`
    )
  })

  it('counts the Command Center tools whose audience names the role separately from suggestions', () => {
    renderRow('developer')
    const { businessNamingRole, business } = toolsForRole('developer')
    const text = screen.getByTestId('role-tools-counts').textContent ?? ''
    expect(text).toContain(`and ${businessNamingRole.length} Command Center`)
    expect(text).toContain(`${business.length - businessNamingRole.length} more Command Center`)
  })
})
