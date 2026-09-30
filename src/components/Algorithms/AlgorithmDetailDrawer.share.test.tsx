// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { Button } from '@/components/ui/button'
import type { AlgorithmDetail } from '@/data/pqcAlgorithmsData'
import { AlgorithmDetailDrawer } from './AlgorithmDetailDrawer'

vi.mock('@/embed/platform', () => ({ isNativeApp: () => false }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))

const algo = {
  id: 'ml-kem-768',
  family: 'ML-KEM',
  name: 'ML-KEM-768',
  cryptoFamily: 'Lattice',
  securityLevel: 3,
  aesEquivalent: 'AES-192',
  publicKeySize: 1184,
  privateKeySize: 2400,
  signatureCiphertextSize: 1088,
  sharedSecretSize: 32,
  keyGenCycles: '100k',
  signEncapsCycles: '100k',
  verifyDecapsCycles: '100k',
  stackRAM: 0,
  optimizationTarget: '',
  fipsStandard: 'FIPS 203',
  useCaseNotes: '',
  region: 'US',
  status: 'Standardized',
  statusTier: 'standardized',
  type: 'KEM',
  hasResearchGap: false,
  sizesUnknown: false,
  perfUnknown: false,
} as unknown as AlgorithmDetail

describe('AlgorithmDetailDrawer — Share inside the drawer', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
  })

  it('Copy link copies the clean ?algo link and Esc closes only the menu', async () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter initialEntries={['/algorithms?tab=detailed&family=Lattice&algo=ml-kem-768']}>
        <AlgorithmDetailDrawer algo={algo} onClose={onClose} />
      </MemoryRouter>
    )
    const drawer = screen.getByTestId('algorithm-detail-drawer')
    fireEvent.click(within(drawer).getByRole('button', { name: /^Share ML-KEM-768/ }))
    const menu = screen.getByRole('menu')
    expect(drawer.contains(menu)).toBe(false)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.click(within(drawer).getByRole('button', { name: /^Share ML-KEM-768/ }))
    fireEvent.click(within(screen.getByRole('menu')).getByRole('button', { name: /Copy link/ }))
    await vi.waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `${window.location.origin}/algorithms?algo=ml-kem-768`
      )
    )
    expect(onClose).not.toHaveBeenCalled()
  })

  it('traps focus inside the open drawer', async () => {
    render(
      <MemoryRouter>
        <Button type="button">outside</Button>
        <AlgorithmDetailDrawer algo={algo} onClose={vi.fn()} />
      </MemoryRouter>
    )
    const drawer = screen.getByTestId('algorithm-detail-drawer')
    await vi.waitFor(() => expect(drawer.contains(document.activeElement)).toBe(true))
    screen.getByRole('button', { name: 'outside', hidden: true }).focus()
    await vi.waitFor(() => expect(drawer.contains(document.activeElement)).toBe(true))
  })
})
