// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { FrameworkConceptGraphModal } from './FrameworkConceptGraphModal'
vi.mock('./FrameworkConceptGraph', () => ({
  FrameworkConceptGraph: ({
    centerConceptId,
    height,
  }: {
    centerConceptId: string
    height: number
  }) => (
    <div>
      Existing graph {centerConceptId}, height {height}
    </div>
  ),
}))
vi.mock('@/embed/platform', () => ({ isNativeApp: () => false }))

describe('shared graph modal teaches mapping limits without changing navigation', () => {
  it('keeps the same graph identity, height contract, share action and Close callback', () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter>
        <FrameworkConceptGraphModal
          isOpen
          centerConceptId="guidance:cnsa-2"
          title="Sample Framework"
          frameworkId="sample-framework"
          onClose={onClose}
        />
      </MemoryRouter>
    )
    const dialog = screen.getByRole('dialog', { name: 'Sample Framework' })
    expect(within(dialog).getByText(/These mappings are learning aids/)).toHaveTextContent(
      'not legal or conformance determinations'
    )
    expect(within(dialog).getByText(/Existing graph guidance:cnsa-2/)).toHaveTextContent(
      `height ${Math.min(700, window.innerHeight - 200)}`
    )
    expect(
      within(dialog).getByRole('button', { name: /^Share Sample Framework/ })
    ).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close concept graph' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
  it('still closes through the existing overlay Escape handler', () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter>
        <FrameworkConceptGraphModal
          isOpen
          centerConceptId="guidance:cnsa-2"
          title="Sample Framework"
          frameworkId="sample-framework"
          onClose={onClose}
        />
      </MemoryRouter>
    )
    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Sample Framework' }), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })
})
