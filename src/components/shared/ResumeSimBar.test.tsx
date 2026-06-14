// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ResumeSimBar } from './ResumeSimBar'

const renderBar = () =>
  render(
    <MemoryRouter>
      <ResumeSimBar />
    </MemoryRouter>
  )

beforeEach(() => sessionStorage.clear())

describe('ResumeSimBar', () => {
  it('renders nothing when the resume flag is not set', () => {
    renderBar()
    expect(screen.queryByText(/Resume Simulation/i)).not.toBeInTheDocument()
  })

  it('shows a return link to /simulation when the flag is set', () => {
    sessionStorage.setItem('sim:resume', '1')
    renderBar()
    expect(screen.getByRole('link', { name: /Resume Simulation/i })).toHaveAttribute(
      'href',
      '/simulation'
    )
  })

  it('can be dismissed (clears the flag)', () => {
    sessionStorage.setItem('sim:resume', '1')
    renderBar()
    fireEvent.click(screen.getByRole('button', { name: /Dismiss/i }))
    expect(screen.queryByText(/Resume Simulation/i)).not.toBeInTheDocument()
    expect(sessionStorage.getItem('sim:resume')).toBeNull()
  })
})
