// SPDX-License-Identifier: GPL-3.0-only
/** The phone landing screen's detail sheet is `?algo=<algorithm_id>`, like desktop's drawer. */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import '@testing-library/jest-dom'
import { MobileAlgorithmsView } from './MobileAlgorithmsView'

function Probe() {
  return <span data-testid="url-search">{useLocation().search}</span>
}
const urlSearch = () => screen.getByTestId('url-search').textContent ?? ''
const renderAt = (entry: string) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <MobileAlgorithmsView />
      <Probe />
    </MemoryRouter>
  )

describe('MobileAlgorithmsView — ?algo', () => {
  it('tapping a bar pushes ?algo=<algorithm_id>; Close strips it', () => {
    renderAt('/algorithms')
    // eslint-disable-next-line testing-library/no-node-access
    fireEvent.click(screen.getByText('RSA-2048').closest('button')!)
    expect(screen.getByTestId('algorithm-detail-sheet')).toBeInTheDocument()
    expect(urlSearch()).toBe('?algo=rsa-2048')
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByTestId('algorithm-detail-sheet')).not.toBeInTheDocument()
    expect(urlSearch()).toBe('')
  })

  it('a link opens any algorithm in the reference data, not just the charted ones', async () => {
    renderAt('/algorithms?algo=fn-dsa-512')
    const sheet = await screen.findByTestId('algorithm-detail-sheet')
    await waitFor(() => expect(within(sheet).getAllByText(/FN-DSA-512/).length).toBeGreaterThan(0))
  })

  it('accepts an exact algorithm name from older links', () => {
    renderAt('/algorithms?algo=ML-KEM-768')
    expect(screen.getByTestId('algorithm-detail-sheet')).toBeInTheDocument()
  })

  it('an unknown id says so once the data has loaded; dismiss strips it', async () => {
    renderAt('/algorithms?algo=falcon-9000')
    expect(await screen.findByTestId('deeplink-notice-not-found')).toHaveTextContent('falcon-9000')
    expect(screen.queryByTestId('algorithm-detail-sheet')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /dismiss notice/i }))
    expect(urlSearch()).toBe('')
  })
})
