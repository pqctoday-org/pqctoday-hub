// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { RiskHeatmapGenerator } from './RiskHeatmapGenerator'
vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: () => ({ addExecutiveDocument: vi.fn() }),
}))
vi.mock('@/hooks/useSavedArtifactInputs', () => ({ useSavedArtifactInputs: () => undefined }))
vi.mock('@/components/PKILearning/common/executive', () => ({ ExportableArtifact: () => null }))
describe('Risk heatmap keyboard treatment selection', () => {
  it('exposes all cells as named native buttons and opens/closes the existing treatment activity', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <RiskHeatmapGenerator
          riskEntries={[
            {
              id: 'sample-risk',
              assetName: 'Sample portal',
              currentAlgorithm: 'RSA',
              threatVector: 'Sample threat',
              likelihood: 3,
              impact: 4,
              mitigation: 'Sample plan',
            },
          ]}
        />
      </MemoryRouter>
    )
    const cells = screen.getAllByRole('button', { name: /^Likelihood \d/ })
    expect(cells).toHaveLength(25)
    for (const cell of cells) expect(cell.tagName).toBe('BUTTON')
    const target = screen.getByRole('button', { name: /^Likelihood 3 .*impact 4 .*Sample portal/ })
    target.focus()
    await user.keyboard('{Enter}')
    expect(target).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByRole('heading', { name: /Cell Details.*Likelihood: 3, Impact: 4/ })
    ).toBeInTheDocument()
    const mitigate = screen.getByRole('button', { name: 'Mitigate' })
    mitigate.focus()
    await user.keyboard(' ')
    expect(screen.getByRole('button', { name: 'Projected Sample' })).toBeEnabled()
    target.focus()
    await user.keyboard(' ')
    expect(target).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByRole('heading', { name: /Cell Details/ })).not.toBeInTheDocument()
  })
})
