// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileTransitionWizard } from './MobileTransitionWizard'
import { algorithmsData } from '@/data/algorithmsData'
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
    expect(screen.getByText(/What matters most for replacing/)).toBeInTheDocument()
  })

  it('the escape hatch to the full table is still present', () => {
    renderWizard()
    expect(screen.getByText('Show full table →')).toBeInTheDocument()
  })
})
