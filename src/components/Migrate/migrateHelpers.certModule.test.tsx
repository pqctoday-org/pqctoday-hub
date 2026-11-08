// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CertBadges } from './migrateHelpers'
import type { CertificationXref } from '@/types/MigrateTypes'

function cert(over: Partial<CertificationXref>): CertificationXref {
  return {
    productId: 'p1',
    softwareName: 'Test Product',
    certType: 'FIPS 140-3',
    certId: 'F1',
    certVendor: 'Vendor',
    certProduct: 'Module A',
    pqcAlgorithms: 'No PQC',
    certificationLevel: '',
    status: 'Active',
    certDate: '2026-01-01',
    certLink: 'https://example.com/f1',
    classicalOnly: false,
    ...over,
  }
}

const longName =
  'MX240, MX480 and MX960 series and EX9204, EX9208, EX9214 Ethernet Switches, Junos OS 22.3R1'

describe('certificate popover module name', () => {
  it('shows the module name of each certificate whose coverage is recorded, clamped to two lines, with the full text in the title', () => {
    render(
      <CertBadges
        certs={[
          cert({
            certId: 'F1',
            certProduct: longName,
            certDate: '2026-06-01',
            certCovers: 'MX series, Junos OS 22.3R1',
            certRelationship: 'earlier_release',
          }),
          cert({
            certId: 'F2',
            certProduct: 'Module B',
            certDate: '2025-01-01',
            certLink: 'https://example.com/f2',
            certRelationship: 'same_release',
          }),
        ]}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /2 FIPS 140-3 certificates/i }))
    const names = within(screen.getByRole('menu')).getAllByTestId('cert-module-name')
    expect(names.map((n) => n.textContent)).toEqual([longName, 'Module B'])
    expect(names[0]).toHaveAttribute('title', longName)
    expect(names[0].className).toContain('line-clamp-2')
  })

  it('shows no module name line while no coverage is recorded, so today the popover is unchanged', () => {
    render(
      <CertBadges
        certs={[
          cert({ certId: 'F1', certProduct: longName }),
          cert({
            certId: 'F2',
            certProduct: 'Module B',
            certLink: 'https://example.com/f2',
            certDate: '2025-01-01',
          }),
        ]}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /2 FIPS 140-3 certificates/i }))
    expect(within(screen.getByRole('menu')).queryByTestId('cert-module-name')).toBeNull()
  })

  it('shows no module line for a certificate with coverage recorded but no module name', () => {
    render(
      <CertBadges
        certs={[
          cert({ certId: 'F1', certProduct: '', certRelationship: 'earlier_release' }),
          cert({
            certId: 'F2',
            certProduct: '',
            certCovers: 'Some module',
            certLink: 'https://example.com/f2',
            certDate: '2025-01-01',
          }),
        ]}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /2 FIPS 140-3 certificates/i }))
    expect(within(screen.getByRole('menu')).queryByTestId('cert-module-name')).toBeNull()
  })
})

describe('certificate popover placement and height', () => {
  const realHeight = window.innerHeight
  afterEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(window, 'innerHeight', { value: realHeight, configurable: true })
  })

  function sevenCovered(): CertificationXref[] {
    return Array.from({ length: 7 }, (_, i) =>
      cert({
        certId: `F${i}`,
        certDate: `2026-0${i + 1}-01`,
        certLink: `https://example.com/f${i}`,
        certProduct: longName,
        certRelationship: 'earlier_release',
        certCovers: 'MX series',
      })
    )
  }

  function openWithTriggerAt(top: number, bottom: number, viewportHeight: number) {
    Object.defineProperty(window, 'innerHeight', { value: viewportHeight, configurable: true })
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top,
      bottom,
      left: 200,
      right: 260,
      width: 60,
      height: bottom - top,
      x: 200,
      y: top,
      toJSON: () => ({}),
    })
    render(<CertBadges certs={sevenCovered()} />)
    fireEvent.click(screen.getByRole('button', { name: /7 FIPS 140-3 certificates/i }))
    return screen.getByRole('menu')
  }

  it('opens above the trigger when a tall list does not fit below but does fit above', () => {
    const menu = openWithTriggerAt(700, 730, 800)
    expect(menu.style.bottom).not.toBe('')
    expect(menu.style.top).toBe('')
  })

  it('opens below the trigger when the list fits there', () => {
    const menu = openWithTriggerAt(20, 50, 1400)
    expect(menu.style.top).not.toBe('')
    expect(menu.style.bottom).toBe('')
  })

  it('limits its height to the room on the side it opens to, and scrolls inside', () => {
    const menu = openWithTriggerAt(40, 70, 300)
    // Room below is the larger side (300 - 70 - 6 - 12 = 212), and the list is taller than that.
    expect(menu.style.top).not.toBe('')
    expect(menu.style.maxHeight).toBe('212px')
    expect(menu.className).toContain('overflow-y-auto')
  })

  it('stays open when the list inside it is scrolled, and closes when the page scrolls', () => {
    const menu = openWithTriggerAt(40, 70, 300)
    fireEvent.scroll(menu)
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.scroll(document)
    expect(screen.queryByRole('menu')).toBeNull()
  })
})
