// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'

const HSM_STUB = {
  isReady: true,
  moduleRef: { current: {} as unknown },
  hSessionRef: { current: 1 },
  initialize: vi.fn().mockResolvedValue(undefined),
}
vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => HSM_STUB,
}))

const mockRunKAT = vi.fn()
vi.mock('@/utils/katRunner', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/katRunner')>()
  return { ...actual, runKAT: (...args: unknown[]) => mockRunKAT(...args) }
})

import { MobileKATValidationView } from './MobileKATValidationView'
import { ATTACK_PROFILES } from '@/data/implementationAttackProfiles'

describe('MobileKATValidationView', () => {
  beforeEach(() => {
    mockRunKAT.mockReset()
    mockRunKAT.mockResolvedValue({
      id: 'kat-algo-mlkem512-decap',
      useCase: 'ML-KEM-512 decapsulation',
      algorithm: 'ML-KEM-512',
      standard: 'FIPS 203',
      referenceUrl: 'https://csrc.nist.gov/pubs/fips/203/final',
      status: 'pass',
      details: 'ok',
    })
  })

  it('shows only the 7 real PQC tiles — 3 ML-KEM, 3 ML-DSA, 1 SLH-DSA', () => {
    render(<MobileKATValidationView />)
    for (const name of ['ML-KEM-512', 'ML-KEM-768', 'ML-KEM-1024']) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }
    for (const name of ['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87']) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }
    expect(screen.getByText('SLH-DSA')).toBeInTheDocument()
  })

  it('drops the classical-crypto tiles, per the confirmed PQC-only scope', () => {
    render(<MobileKATValidationView />)
    for (const name of ['AES-256-GCM', 'AES-256-CBC']) {
      expect(screen.queryByText(name)).not.toBeInTheDocument()
    }
    expect(screen.getByText(/Classical-crypto KATs.*are on a laptop/i)).toBeInTheDocument()
  })

  it('running a tile calls the real runKAT() and shows a pass result', async () => {
    render(<MobileKATValidationView />)
    const tile = screen.getByText('ML-KEM-512').closest('div')!
    fireEvent.click(
      Array.from(tile.parentElement!.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Run NIST KAT')
      )!
    )
    await waitFor(() => expect(mockRunKAT).toHaveBeenCalled())
    expect(await screen.findByText('2/2 passed')).toBeInTheDocument()
  })

  it('SLH-DSA variant switcher changes the run spec (visible via the level badge)', () => {
    render(<MobileKATValidationView />)
    const slhCard = screen.getByText('SLH-DSA').closest('div')!.parentElement!
    expect(within(slhCard).getByText('Level 1')).toBeInTheDocument()
    fireEvent.click(within(slhCard).getByText('SHA2-256s').closest('button')!)
    expect(within(slhCard).getByText('Level 5')).toBeInTheDocument()
  })

  it('Implementation Attacks section is collapsed by default and shows real profile data when opened', () => {
    render(<MobileKATValidationView />)
    expect(screen.queryByText(ATTACK_PROFILES[0].summary)).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Implementation Attacks').closest('button')!)
    expect(screen.getByText(ATTACK_PROFILES[0].algorithm)).toBeInTheDocument()
    expect(screen.getByText(ATTACK_PROFILES[0].summary)).toBeInTheDocument()
  })
})
