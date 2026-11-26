// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import '@testing-library/jest-dom'
import { JourneyProgressStrip } from './JourneyProgressStrip'

describe('belt score, phases and events, re-homed as a strip', () => {
  it('renders on its own, outside the drawer', () => {
    render(
      <MemoryRouter>
        <JourneyProgressStrip />
      </MemoryRouter>
    )
    expect(screen.getByRole('region', { name: 'Your progress' })).toBeInTheDocument()
  })
})
