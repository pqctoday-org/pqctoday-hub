// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileAboutView } from './MobileAboutView'
import { securityAuditDate } from '@/data/securityAuditData'

vi.mock('@/hooks/useTheme', () => ({ useTheme: () => ({ theme: 'light', setTheme: vi.fn() }) }))
vi.mock('@/embed/EmbedProvider', () => ({ useIsEmbedded: () => false }))

describe('phone recorded provenance coverage', () => {
  it('does not promise universal reviewers or accuracy and retains the recorded audit date', () => {
    render(
      <MemoryRouter>
        <MobileAboutView />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: /Trust & verification/ }))
    const prose = screen.getByText(/Source links and any recorded trust or review metadata/)
    expect(prose).toHaveTextContent('entries that include them')
    expect(prose).toHaveTextContent(
      'missing source or reviewer metadata does not establish that a claim was reviewed'
    )
    expect(prose).toHaveTextContent('computed result is not a guarantee of factual accuracy')
    expect(prose).not.toHaveTextContent(
      /every reviewed change|named reviewer|signed public audit trail/
    )
    const audit = screen.getByText(/Latest recorded report:/)
    if (securityAuditDate)
      expect(audit).toHaveTextContent(
        securityAuditDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      )
    expect(audit).toHaveTextContent('does not establish current vulnerability status')
  })
})
