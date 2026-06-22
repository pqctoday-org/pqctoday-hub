// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { ModuleCompletionCard, type ModuleCompletionCardProps } from './ModuleCompletionCard'

const base: ModuleCompletionCardProps = {
  title: 'HSM & PQC Operations',
  belt: { name: 'Yellow Belt', color: '#EAB308', textColor: '#1C1917' },
  score: 22,
  nextBelt: { name: 'Orange Belt' },
  pointsToNextBelt: 8,
  progress: { done: 7, total: 12 },
  nextLabel: 'KMS & PQC',
  onNext: vi.fn(),
  onClose: vi.fn(),
}

describe('ModuleCompletionCard', () => {
  it('renders the module completion moment with belt, score, progress and next CTA', () => {
    render(<ModuleCompletionCard {...base} />)
    expect(screen.getByRole('dialog', { name: /module complete/i })).toBeInTheDocument()
    expect(screen.getByText('HSM & PQC Operations')).toBeInTheDocument()
    expect(screen.getByText('Yellow Belt')).toBeInTheDocument()
    expect(screen.getByText('22 pts')).toBeInTheDocument()
    expect(screen.getByText(/8 pts to Orange Belt/i)).toBeInTheDocument()
    expect(screen.getByText('7/12')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Next: KMS & PQC/i })).toBeInTheDocument()
  })

  it('the path variant labels itself "Journey complete"', () => {
    render(<ModuleCompletionCard {...base} variant="path" title="Architect Journey" />)
    expect(screen.getByRole('dialog', { name: /journey complete/i })).toBeInTheDocument()
    expect(screen.getByText('Architect Journey')).toBeInTheDocument()
  })

  it('fires onNext from the CTA and onClose from Escape', async () => {
    const onNext = vi.fn()
    const onClose = vi.fn()
    render(<ModuleCompletionCard {...base} onNext={onNext} onClose={onClose} />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /Next: KMS & PQC/i }))
    expect(onNext).toHaveBeenCalledOnce()

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('falls back to a "Keep going" action when there is no next module', () => {
    render(<ModuleCompletionCard {...base} nextLabel={null} onNext={undefined} />)
    expect(screen.queryByRole('button', { name: /^Next:/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /keep going/i })).toBeInTheDocument()
  })
})
