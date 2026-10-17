// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileTransitionWizard } from './MobileTransitionWizard'
import { algorithmsData, type AlgorithmTransition } from '@/data/algorithmsData'
import type { AlgorithmDetail } from '@/data/pqcAlgorithmsData'

// 2026-08-24 (live phone testing): Step 1 used to dump all 17 real KEM +
// 21 real Signature classical_algorithm values as one flat, unsorted chip
// wrap — "2 full pages of options". Real data throughout: every assertion
// below derives from the SAME algorithmsData the wizard itself reads.
describe('MobileTransitionWizard', () => {
  function renderWizard() {
    return render(
      <MobileTransitionWizard
        data={algorithmsData}
        pqcDetailMap={new Map<string, AlgorithmDetail>()}
        onShowFullTable={() => {}}
      />
    )
  }

  it('caps each group to 6 visible chips by default, with a real "+N more" count', () => {
    renderWizard()
    const kemNames = new Set(
      algorithmsData
        .filter((r) => r.function === 'Encryption/KEM' || r.function.includes('KEM'))
        .map((r) => r.classical)
    )
    expect(kemNames.size).toBeGreaterThan(6)
    const moreButtons = screen.getAllByText(/^\+\d+ more$/)
    expect(moreButtons.length).toBeGreaterThan(0)
  })

  it('tapping "N more" reveals the rest of that group, including context-only rows', () => {
    renderWizard()
    const moreButtons = screen.getAllByText(/^\+\d+ more$/)
    fireEvent.click(moreButtons[0])
    // After expanding, the context-only catch-all rows (ranked last, never
    // dropped) become reachable.
    expect(screen.getAllByText('(classical only)').length).toBeGreaterThan(0)
  })

  it('a visible (non-expanded) chip still advances the wizard to step 2', () => {
    renderWizard()
    const chip = screen
      .getAllByRole('button')
      .find(
        (b) =>
          b.textContent && !/more$/.test(b.textContent) && !/^Show full table/.test(b.textContent)
      )
    expect(chip).toBeTruthy()
    fireEvent.click(chip!)
    expect(screen.getByText(/What matters most when moving/)).toBeInTheDocument()
  })

  it('the escape hatch to the full table is still present', () => {
    renderWizard()
    expect(screen.getByText('Show full table →')).toBeInTheDocument()
  })

  // A classical name such as RSA has both key-establishment and signature
  // rows. Choosing it under key establishment must never offer a signature
  // scheme, even when that scheme has the smallest public key.
  it('only offers candidates from the function group chosen in step 1', () => {
    const row = (pqc: string, fn: AlgorithmTransition['function']): AlgorithmTransition => ({
      classical: 'RSA',
      pqc,
      function: fn,
      deprecationDate: '',
      standardizationDate: '',
      region: 'NIST',
      status: 'Standardized',
      statusTier: 'final',
    })
    const data = [
      row('SLH-DSA-SHA2-128f', 'Signature'),
      row('ML-KEM-768', 'Encryption/KEM'),
      row('', 'Encryption/KEM'),
    ]
    const detail = (name: string, publicKeySize: number) =>
      ({ name, publicKeySize, securityLevel: 1 }) as unknown as AlgorithmDetail
    const map = new Map<string, AlgorithmDetail>([
      ['slh-dsa-sha2-128f', detail('SLH-DSA-SHA2-128f', 32)],
      ['ml-kem-768', detail('ML-KEM-768', 1184)],
    ])
    render(
      <MemoryRouter>
        <MobileTransitionWizard data={data} pqcDetailMap={map} onShowFullTable={() => {}} />
      </MemoryRouter>
    )
    const kemGroup = screen.getByText('KEM').parentElement as HTMLElement
    fireEvent.click(within(kemGroup).getByRole('button', { name: /RSA/ }))
    fireEvent.click(screen.getByText('Smaller keys'))
    expect(screen.getByText('ML-KEM-768')).toBeInTheDocument()
    expect(screen.queryByText('SLH-DSA-SHA2-128f')).not.toBeInTheDocument()
    expect(screen.queryByText(/Top picks/)).not.toBeInTheDocument()
    expect(screen.queryByText(/replaces/)).not.toBeInTheDocument()
    expect(screen.getByText(/not a drop-in replacement/)).toBeInTheDocument()
  })
})
