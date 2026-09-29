// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import '@testing-library/jest-dom'
import { PQCProtocolMatrix } from './PQCProtocolMatrix'
import { PROTOCOL_MATRIX } from '@/data/pqcProtocolMatrix'

function Probe() {
  return <span data-testid="url-search">{useLocation().search}</span>
}
const renderAt = (entry: string) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <PQCProtocolMatrix />
      <Probe />
    </MemoryRouter>
  )

describe('PQCProtocolMatrix — ?protocol deep links', () => {
  it('shows a not-found notice for an unknown protocol id and strips it on dismiss', () => {
    renderAt('/algorithms?tab=support&protocol=no-such-protocol')
    expect(screen.getByTestId('deeplink-notice-not-found')).toHaveTextContent('no-such-protocol')
    fireEvent.click(screen.getByRole('button', { name: /dismiss notice/i }))
    expect(screen.getByTestId('url-search').textContent).not.toContain('protocol=')
    expect(screen.queryByTestId('deeplink-notice-not-found')).not.toBeInTheDocument()
  })

  it('tags every visible matrix row with its protocol id for scroll-to-row', () => {
    const { container } = renderAt('/algorithms?tab=support')
    const row = PROTOCOL_MATRIX.find((r) => !r.historical)!
    // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
    expect(container.querySelector(`[data-deeplink-id="${row.id}"]`)).not.toBeNull()
    expect(screen.queryByTestId('deeplink-notice-not-found')).not.toBeInTheDocument()
  })
})
