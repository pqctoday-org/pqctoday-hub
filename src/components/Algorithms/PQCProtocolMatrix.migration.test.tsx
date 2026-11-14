// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import '@testing-library/jest-dom'
import { PQCProtocolMatrix } from './PQCProtocolMatrix'

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
const urlSearch = () => screen.getByTestId('url-search').textContent ?? ''
const searchBox = () => screen.getByLabelText('Search protocols') as HTMLInputElement
const rowFor = (container: HTMLElement, id: string) =>
  // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
  container.querySelector(`[data-deeplink-id="${id}"]`)

describe('PQCProtocolMatrix — successor button keeps the address bar in step', () => {
  it('opens the successor and writes ?protocol=<successor> (heatmap row)', () => {
    renderAt('/algorithms?tab=support')
    fireEvent.click(screen.getByRole('button', { name: /no PQC path → TLS 1\.3/ }))
    expect(urlSearch()).toContain('protocol=tls-1-3')
    expect(screen.getByRole('dialog')).toHaveTextContent('TLS 1.3')
  })

  it('replaces ?protocol=<deprecated> with the successor when the reader arrived on a deprecated row', () => {
    renderAt('/algorithms?tab=support&protocol=tls-1-2')
    expect(urlSearch()).toContain('protocol=tls-1-2')
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: /no PQC path → TLS 1\.3/ })
    )
    expect(urlSearch()).toContain('protocol=tls-1-3')
    expect(urlSearch()).not.toContain('protocol=tls-1-2')
  })

  it('shows the way out on a detailed-view card too', () => {
    renderAt('/algorithms?tab=support&matrixView=detailed')
    fireEvent.click(screen.getByRole('button', { name: /no PQC path → TLS 1\.3/ }))
    expect(urlSearch()).toContain('protocol=tls-1-3')
  })

  it('lists the deprecated protocols a row replaces, and opens one from the dialog', () => {
    renderAt('/algorithms?tab=support&protocol=tls-1-3')
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent(/replaces/)
    fireEvent.click(within(dialog).getByRole('button', { name: 'SSL 3.0' }))
    expect(urlSearch()).toContain('protocol=ssl-3-0')
  })
})

describe('PQCProtocolMatrix — deprecated rows are reachable', () => {
  it('a deep link to a deprecated row keeps that row in the table after the dialog closes', () => {
    const { container } = renderAt('/algorithms?tab=support&protocol=ikev1')
    expect(rowFor(container, 'ikev1')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(urlSearch()).not.toContain('protocol=')
    expect(rowFor(container, 'ikev1')).not.toBeNull()
    expect(screen.getByRole('button', { name: /Hide deprecated/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('stays hidden by default when no deprecated row was asked for', () => {
    const { container } = renderAt('/algorithms?tab=support')
    expect(rowFor(container, 'ikev1')).toBeNull()
    expect(screen.getByRole('button', { name: /Show deprecated/ })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })

  it.each([
    ['IKEv1', 'ikev1'],
    ['SSL 3.0', 'ssl-3-0'],
    ['TLS 1.0', 'tls-1-0-1-1'],
  ])('searching "%s" finds the deprecated row', (text, id) => {
    const { container } = renderAt('/algorithms?tab=support')
    expect(rowFor(container, id)).toBeNull()
    fireEvent.change(searchBox(), { target: { value: text } })
    expect(rowFor(container, id)).not.toBeNull()
    expect(screen.queryByText(/No protocols match/)).not.toBeInTheDocument()
  })

  it('clearing the search hides the deprecated rows again', () => {
    const { container } = renderAt('/algorithms?tab=support')
    fireEvent.change(searchBox(), { target: { value: 'IKEv1' } })
    expect(rowFor(container, 'ikev1')).not.toBeNull()
    fireEvent.change(searchBox(), { target: { value: '' } })
    expect(rowFor(container, 'ikev1')).toBeNull()
  })
})

describe('PQCProtocolMatrix — specification chips never dead-end', () => {
  it('opens the cited page in a new tab when the Library does not hold it', () => {
    renderAt('/algorithms?tab=support&matrixView=detailed&matrixQ=KMIP')
    const chip = screen.getAllByRole('link', { name: /KMIP 3\.0 CSD02/ })[0]
    expect(chip).toHaveAttribute('href', 'https://docs.oasis-open.org/kmip/kmip-spec/v3.0/')
    expect(chip).toHaveAttribute('target', '_blank')
    expect(chip).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('opens the Library entry for a vendor id that used to miss', () => {
    renderAt('/algorithms?tab=support&matrixView=detailed&matrixQ=PKCS')
    const chip = screen.getAllByRole('link', { name: /PKCS#11 v3\.2 OS|pkcs11-spec/i })[0]
    expect(chip.getAttribute('href')).toBe('/library?ref=PKCS11-V32-OS-OASIS')
    expect(chip).not.toHaveAttribute('target')
  })
})
