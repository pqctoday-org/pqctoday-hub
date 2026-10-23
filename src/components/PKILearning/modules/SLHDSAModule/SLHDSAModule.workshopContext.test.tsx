// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The SLH-DSA module reuses the Stateful module's live demo in workshop steps 1-3.
 * Inside the SLH-DSA module it must read as an SLH-DSA page: no pointer to "Steps
 * 1-3" of a different module and no "Stateful Signatures" checks heading.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { SLHDSAModule } from './index'

vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: false,
    phase: 'idle',
    initialize: vi.fn(),
    moduleRef: { current: null },
    hSessionRef: { current: 0 },
    keys: [],
    log: [],
    registerKey: vi.fn(),
    clearLog: vi.fn(),
  }),
}))

describe('SLH-DSA module workshop', () => {
  it('shows SLH-DSA wording in the shared live demo, not the Stateful module’s', async () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <SLHDSAModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Workshop' }))
    expect(
      await screen.findByRole('heading', { name: 'Algorithm checks: SLH-DSA' })
    ).toBeInTheDocument()
    const text = document.body.textContent ?? ''
    expect(text).toContain('Step 4 of this module compares the three schemes side by side')
    expect(text).not.toMatch(/Steps\s*1–3/)
    expect(text).not.toContain('Stateful Signatures Known Answer Tests')
    expect(text).toContain('Functional round trips (not known-answer tests)')
    expect(screen.queryByTestId('lms-acvp-sigver')).not.toBeInTheDocument()
  })
})
