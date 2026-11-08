// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { WorkflowBanner } from './WorkflowBanner'
import { useMigrationWorkflowStore } from '@/store/useMigrationWorkflowStore'
import { usePersonaStore } from '@/store/usePersonaStore'
function Location() {
  return <output aria-label="Current route">{useLocation().pathname}</output>
}
beforeEach(() => {
  useMigrationWorkflowStore.getState().resetWorkflow()
  useMigrationWorkflowStore.getState().startWorkflow()
  usePersonaStore.setState({ selectedPersona: null })
})
describe('workflow phases are exposed and work through keyboard navigation', () => {
  it.each([
    ['Risk Assessment — current', '/assess', 1],
    ['Compliance Review — pending', '/compliance', 2],
    ['Product Selection — pending', '/migrate', 3],
    ['Timeline Review — pending', '/timeline', 4],
  ] as const)('exposes %s and activates it with Enter', async (name, route, tabs) => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/assess']}>
        <WorkflowBanner />
        <Location />
      </MemoryRouter>
    )
    const region = screen.getByRole('status', { name: 'Migration planning workflow progress' })
    const button = within(region).getByRole('button', { name })
    expect(button).toHaveAccessibleName(name)
    for (let i = 0; i < tabs; i++) await user.tab()
    expect(button).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByLabelText('Current route')).toHaveTextContent(route)
    expect(
      screen.getByRole('status', { name: 'Migration planning workflow progress' })
    ).toBeVisible()
  })
  it('keeps the dismiss control keyboard reachable after the phase controls and removes the banner', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/assess']}>
        <WorkflowBanner />
      </MemoryRouter>
    )
    const close = screen.getByRole('button', { name: 'Dismiss workflow' })
    for (let i = 0; i < 6; i++) await user.tab()
    expect(close).toHaveFocus()
    await user.keyboard(' ')
    expect(
      screen.queryByRole('status', { name: 'Migration planning workflow progress' })
    ).not.toBeInTheDocument()
    expect(useMigrationWorkflowStore.getState().workflowActive).toBe(false)
  })
})
