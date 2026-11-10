// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { DeploymentPlaybook } from './DeploymentPlaybook'

const addExecutiveDocument = vi.fn()
vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: (selector?: (state: unknown) => unknown) => {
    const state = { addExecutiveDocument, artifacts: { executiveDocuments: [] } }
    return selector ? selector(state) : state
  },
}))

describe('retirement worked sample stays separate from planning completion', () => {
  beforeEach(() => addExecutiveDocument.mockClear())
  it('shows all snapshots without changing checklist selections or saving a document', () => {
    render(<DeploymentPlaybook />)
    const sample = screen.getByRole('region', { name: 'Fictional retirement worked sample' })
    expect(within(sample).getByRole('status')).toHaveTextContent('Incomplete')
    const checkboxes = screen.getAllByRole('checkbox')
    expect(
      checkboxes.every(
        (checkbox) =>
          !checkbox.hasAttribute('data-state') ||
          checkbox.getAttribute('data-state') === 'unchecked'
      )
    ).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Fictional snapshot:' }))
    fireEvent.click(screen.getByRole('option', { name: 'Gateway removed, fallback remains' }))
    expect(within(sample).getByRole('status')).toHaveTextContent('Incomplete')
    expect(within(sample).getByText('Old path still accepts: direct-legacy')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Fictional snapshot:' }))
    fireEvent.click(screen.getByRole('option', { name: 'Follow-up cleanup' }))
    expect(within(sample).getByRole('status')).toHaveTextContent(
      'Consistent for the declared sample paths'
    )
    expect(checkboxes.every((checkbox) => checkbox.getAttribute('aria-checked') !== 'true')).toBe(
      true
    )
    expect(addExecutiveDocument).not.toHaveBeenCalled()
    fireEvent.click(checkboxes[0])
    expect(within(sample).getByRole('status')).toHaveTextContent(
      'Consistent for the declared sample paths'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Fictional snapshot:' }))
    fireEvent.click(screen.getByRole('option', { name: 'Before cutover' }))
    expect(within(sample).getByRole('status')).toHaveTextContent('Incomplete')
  })
  it('copies the selected packet without creating a saved checklist', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    render(<DeploymentPlaybook />)
    const sample = screen.getByRole('region', { name: 'Fictional retirement worked sample' })
    fireEvent.click(screen.getByRole('button', { name: 'Fictional snapshot:' }))
    fireEvent.click(screen.getByRole('option', { name: 'Gateway removed, fallback remains' }))
    fireEvent.click(within(sample).getByRole('button', { name: /Copy/ }))
    await waitFor(() => expect(writeText).toHaveBeenCalled())
    expect(writeText.mock.calls[0][0]).toContain('Snapshot: Gateway removed, fallback remains')
    expect(writeText.mock.calls[0][0]).toContain('Old path still accepts: direct-legacy')
    expect(addExecutiveDocument).not.toHaveBeenCalled()
  })
})
