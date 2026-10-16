// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { OnboardingCTAs } from './OnboardingCTAs'

const mockNavigate = vi.fn()
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderCtas(persona: Parameters<typeof OnboardingCTAs>[0]['persona']) {
  return render(
    <MemoryRouter>
      <OnboardingCTAs persona={persona} region={null} />
    </MemoryRouter>
  )
}

describe('OnboardingCTAs — third CTA follows the persona Home funnel', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline')))
    )
  })
  afterEach(() => vi.unstubAllGlobals())

  it('a researcher is offered the evidence, not the learning journey', async () => {
    renderCtas('researcher')
    expect(screen.queryByText('Start Your Journey')).toBeNull()
    fireEvent.click(await screen.findByText('Browse the evidence'))
    expect(mockNavigate).toHaveBeenCalledWith('/library?qv=new&sort=newest')
  })

  it.each(['executive', 'developer', 'curious'] as const)(
    '%s keeps "Start Your Journey" into Learn',
    async (persona) => {
      renderCtas(persona)
      fireEvent.click(await screen.findByText('Start Your Journey'))
      expect(mockNavigate).toHaveBeenCalledWith('/learn')
    }
  )
})
