// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Workshop step 4 of the Stateful module is the shared live demo. There it points at
 * this module's Steps 1-3 and carries the LMS checks, the NIST LMS sample and the
 * comparison table with named parameter sets.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { StatefulSignaturesModule } from './index'

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

describe('Stateful Signatures workshop step 4', () => {
  it('shows the Stateful wording, the LMS checks and the corrected comparison', async () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <StatefulSignaturesModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Workshop' }))
    fireEvent.click(await screen.findByText(/Step 4: SLH-DSA Live Demo/))
    expect(
      await screen.findByRole('heading', { name: 'Algorithm checks: LMS and SLH-DSA' })
    ).toBeInTheDocument()
    const text = document.body.textContent ?? ''
    expect(text).toContain('stateful LMS/XMSS schemes from Steps 1–3 of this module')
    expect(text).toContain('Known-answer checks: LMS (RFC 8554) and SHA-256')
    expect(text).toContain('Functional round trips (not known-answer tests)')
    expect(screen.getByTestId('lms-acvp-sigver')).toBeInTheDocument()
    expect(text).toContain('ML-DSA-87 only')
  })
})
