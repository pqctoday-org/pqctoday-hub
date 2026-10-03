// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router'
import '@testing-library/jest-dom'
import { Button } from '@/components/ui/button'
import { PQCProtocolMatrix } from './PQCProtocolMatrix'
import { PROTOCOL_MATRIX } from '@/data/pqcProtocolMatrix'

function Probe() {
  return <span data-testid="url-search">{useLocation().search}</span>
}
/** An in-app link followed while the matrix is already mounted. */
function GoTo({ to }: { to: string }) {
  const navigate = useNavigate()
  return (
    <Button type="button" onClick={() => navigate(to)}>
      {`go ${to}`}
    </Button>
  )
}
const renderAt = (entry: string, links: string[] = [], embedded = false) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <PQCProtocolMatrix embedded={embedded} />
      <Probe />
      {links.map((to) => (
        <GoTo key={to} to={to} />
      ))}
    </MemoryRouter>
  )
const urlSearch = () => screen.getByTestId('url-search').textContent ?? ''
const searchBox = () => screen.getByLabelText('Search protocols') as HTMLInputElement

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

  it('?matrixHighlight=recommended tints the recommended rows (old ?highlight form still read)', () => {
    const rec = PROTOCOL_MATRIX.find((r) => r.recommended && !r.historical)!
    for (const q of ['matrixHighlight=recommended', 'highlight=recommended']) {
      const { container, unmount } = renderAt(`/algorithms?tab=support&${q}`)
      // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
      const row = container.querySelector(`tr[data-deeplink-id="${rec.id}"]`)
      expect(row?.className, q).toContain('bg-status-warning/5')
      unmount()
    }
  })
})

describe('PQCProtocolMatrix — URL state follows same-page links', () => {
  it('re-syncs matrixQ / matrixAvailability / matrixSort when a second link lands', () => {
    const next =
      '/algorithms?tab=support&matrixQ=ssh&matrixAvailability=has-oss&matrixSort=name:desc'
    renderAt('/algorithms?tab=support&matrixQ=tls', [next])
    expect(searchBox().value).toBe('tls')
    fireEvent.click(screen.getByRole('button', { name: `go ${next}` }))
    expect(searchBox().value).toBe('ssh')
    expect(screen.getByRole('button', { name: /Has OSS/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Name/ })).toBeInTheDocument()
  })

  it("the reader's own typing is not fought by the re-sync", () => {
    renderAt('/algorithms?tab=support')
    fireEvent.change(searchBox(), { target: { value: 'ss' } })
    fireEvent.change(searchBox(), { target: { value: 'ssh' } })
    expect(searchBox().value).toBe('ssh')
    expect(urlSearch()).toContain('matrixQ=ssh')
  })

  it('a filter write pins tab=support when the URL had no tab (persona default)', () => {
    renderAt('/algorithms')
    fireEvent.change(searchBox(), { target: { value: 'tls' } })
    expect(urlSearch()).toContain('tab=support')
    expect(urlSearch()).toContain('matrixQ=tls')
  })
})

describe('PQCProtocolMatrix — embedded (simulation) keeps state local', () => {
  const row = PROTOCOL_MATRIX.find((r) => !r.historical)!

  it('ignores the host URL and never writes matrix*/protocol into it', () => {
    renderAt(`/simulation?step=3&matrixQ=zzz&protocol=${row.id}`, [], true)
    expect(searchBox().value).toBe('')
    expect(screen.queryByTestId('deeplink-notice-not-found')).not.toBeInTheDocument()
    fireEvent.change(searchBox(), { target: { value: row.name } })
    expect(searchBox().value).toBe(row.name)
    fireEvent.click(screen.getAllByRole('button', { name: `Open details for ${row.name}` })[0])
    expect(urlSearch()).toBe(`?step=3&matrixQ=zzz&protocol=${row.id}`)
  })
})
