// SPDX-License-Identifier: AGPL-3.0-only
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
  it('carries the catalogue status, its source and the advisory into the phone sheet, and does not call non-FIPS metadata a FIPS standard', async () => {
    renderAt('/algorithms?algo=classic-mceliece-460896')
    const sheet = await screen.findByTestId('algorithm-detail-sheet')
    // Classic McEliece's catalogue status says BSI advises against new use.
    await waitFor(() =>
      expect(
        within(sheet).getByText('ISO 18033-2 Amd2; BSI advises against new use')
      ).toBeInTheDocument()
    )
    expect(within(sheet).getByRole('link', { name: 'Status source' })).toHaveAttribute(
      'href',
      expect.stringContaining('bsi.bund.de')
    )
    // The advisory badge shown on desktop is shown here too.
    expect(within(sheet).getAllByText(/BSI: not for new use/i).length).toBeGreaterThan(0)
    // ISO / advisory metadata sits under "Standard", never under a "FIPS standard" label.
    expect(within(sheet).queryByText('FIPS standard')).not.toBeInTheDocument()
    expect(within(sheet).getByText('Standard')).toBeInTheDocument()
    expect(within(sheet).getAllByText(/ISO\/IEC 18033-2/).length).toBeGreaterThan(0)
  })

  it('shows a real FIPS standard for ML-KEM-768 with its own status, as a contrasting case', async () => {
    renderAt('/algorithms?algo=ml-kem-768')
    const sheet = await screen.findByTestId('algorithm-detail-sheet')
    await waitFor(() =>
      expect(within(sheet).getByRole('link', { name: 'Status source' })).toBeInTheDocument()
    )
    expect(within(sheet).getByRole('link', { name: 'Status source' })).toHaveAttribute(
      'href',
      expect.stringContaining('csrc.nist.gov')
    )
    expect(within(sheet).queryByText(/BSI: not for new use/i)).not.toBeInTheDocument()
  })
})
