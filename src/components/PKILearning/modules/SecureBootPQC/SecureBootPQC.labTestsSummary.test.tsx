// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The three-row summary at the top of "What the lab tests" (Learn > Firmware PQC Migration):
 * it sits after the paragraph that defines the terms and before part 1, each row restates a
 * quotation that is already in part 2, and on a phone each row is a stacked block.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { SecureBootIntroduction } from './components/SecureBootIntroduction'
import { LAB_TESTS_SUMMARY_ROWS } from './data/labTestsSummaryRows'

const flat = (s: string) =>
  s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim()

function openSection() {
  render(
    <MemoryRouter>
      <SecureBootIntroduction onNavigateToWorkshop={() => {}} />
    </MemoryRouter>
  )
  fireEvent.click(
    screen.getByRole('button', { name: /ML-DSA-65 for Firmware Signature Migration/ })
  )
  return screen.getByTestId('lab-tests-summary')
}

describe('Secure Boot "What the lab tests" - summary table', () => {
  it('has the three approved rows, each pointing to part 2 and the CNSA 2.0 FAQ page', () => {
    const summary = openSection()
    const table = within(screen.getByTestId('lab-summary-table')).getByRole('table')
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(3)
    const cells = rows.map((r) =>
      within(r)
        .getAllByRole('cell')
        .map((c) => c.textContent)
    )
    expect(cells).toEqual([
      [
        'Code that only verifies signatures',
        'CAVP is all the NSA expects.',
        'Part 2, CNSA 2.0 FAQ p. 11',
      ],
      [
        'A signer that is itself a National Security System (NSS)',
        'Must follow SP 800-208, hardware validated by CMVP, waivers not granted.',
        'Part 2, CNSA 2.0 FAQ pp. 11-12',
      ],
      [
        'A product under a NIAP protection profile that only verifies, signing done outside it',
        'Profile requirements apply to verification only, so CAVP, not CMVP, is expected.',
        'Part 2, CNSA 2.0 FAQ p. 12',
      ],
    ])
    expect(summary).toHaveTextContent(
      "A signer that is not an NSS, such as a commercial vendor's build environment: the NSA validates only that the verification code on the device passes CAVP."
    )
  })

  it('sits after the paragraph that defines the terms and before part 1', () => {
    const summary = openSection()
    const terms = screen.getByText(/Every quotation below is verbatim from the document named/)
    const partOne = screen.getByRole('heading', { name: /1\. The verifier: algorithm tests/ })
    const FOLLOWS = Node.DOCUMENT_POSITION_FOLLOWING
    expect(terms.compareDocumentPosition(summary) & FOLLOWS).toBeTruthy()
    expect(summary.compareDocumentPosition(partOne) & FOLLOWS).toBeTruthy()
  })

  it('restates quotations that are already in part 2', () => {
    openSection()
    const partTwo = screen.getByRole('heading', { name: /2\. The signer: SP 800-208/ })
    const box = flat(partTwo.parentElement?.textContent ?? '')
    // row 1
    expect(box).toContain(
      'If your product is only verifying signatures, CAVP testing is all that is required.'
    )
    // row 2
    expect(box).toContain(
      "which requires hardware validated by NIST's Cryptographic Module Validation Program (CMVP)"
    )
    expect(box).toContain('Waivers for this will not be granted.')
    // row 3
    expect(box).toContain('Protection Profile requirements only apply to signature verification.')
    expect(box).toContain('only CAVP validation (not CMVP) will be expected')
    // the line under the table
    expect(box).toContain(
      'the only part NSA will validate is that the signature verification code on the device passes CAVP.'
    )
  })

  it('shows stacked blocks below 640 px and the table from 640 px up, never both', () => {
    openSection()
    const stacked = screen.getByTestId('lab-summary-stacked')
    expect(stacked).toHaveClass('sm:hidden')
    expect(stacked).not.toHaveClass('hidden')
    expect(within(stacked).getAllByRole('listitem')).toHaveLength(LAB_TESTS_SUMMARY_ROWS.length)
    const tableWrap = screen.getByTestId('lab-summary-table')
    expect(tableWrap).toHaveClass('hidden', 'sm:block')
    expect(within(tableWrap).getByRole('table').className).not.toMatch(/min-w-/)
  })
})
