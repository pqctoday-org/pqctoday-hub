// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the MLSGroupMessaging ModuleShell conversion
 * (A2 hard tail, clean-fit). Captured against the PRE-conversion module; must
 * stay green after it adopts <ModuleShell> with a reduced 5-tab set (no
 * Exercises) and a non-stepper `workshop` slot (3 stacked tools + its own Reset
 * button wired to api.resetWorkshop).
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { MLSGroupMessagingModule } from './index'

describe('MLSGroupMessaging render parity', () => {
  it('renders the header, the in-page description, and the 5-tab set (no Exercises)', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <MLSGroupMessagingModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    expect(screen.getByRole('heading', { name: 'MLS — Group Messaging' })).toBeInTheDocument()
    expect(screen.getByText(/Messaging Layer Security \(RFC 9420\)/)).toBeInTheDocument()
    for (const name of ['Learn', 'Visual', 'Workshop', 'References', 'Tools & Products']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
    // reduced tab set: no Exercises tab
    expect(screen.queryByRole('button', { name: 'Exercises' })).not.toBeInTheDocument()
  })
})
