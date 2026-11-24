// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { LearnOrderStrip } from './LearnOrderStrip'

const renderStrip = (moduleId: string) =>
  render(
    <MemoryRouter>
      <LearnOrderStrip moduleId={moduleId} />
    </MemoryRouter>
  )

describe('LearnOrderStrip', () => {
  it('renders the stage, prerequisite and next-module links', () => {
    renderStrip('pqc-algorithms')

    expect(screen.getByRole('navigation', { name: 'Where this fits' })).toBeInTheDocument()
    expect(screen.getByText('Stage 2 · Core concepts')).toBeInTheDocument()
    expect(screen.getByText('Take first:')).toBeInTheDocument()
    expect(screen.getByText('Next:')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'PQC 101' })).toHaveAttribute('href', '/learn/pqc-101')
    expect(screen.getByRole('link', { name: 'PQC Candidates & Lifecycle' })).toHaveAttribute(
      'href',
      '/learn/pqc-candidates'
    )
  })

  it('leaves out an empty prerequisite line', () => {
    renderStrip('pqc-101')

    expect(screen.queryByText('Take first:')).not.toBeInTheDocument()
    expect(screen.getByText('Next:')).toBeInTheDocument()
  })

  it('renders nothing for an unknown module', () => {
    const { container } = renderStrip('not-a-learn-module')

    expect(container).toBeEmptyDOMElement()
  })
})
