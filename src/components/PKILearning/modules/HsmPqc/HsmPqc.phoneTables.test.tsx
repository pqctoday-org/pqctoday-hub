// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Every table on the HSM lesson's Learn tab must read on a phone: below 640 px each row is a
 * stacked block with its column headings as labels, from 640 px up it is a table, and no column
 * (the firmware table's "FIPS Recert" in particular) is cut off inside a narrow scrolling box.
 * jsdom does not apply Tailwind, so these assertions pin the markup and classes that produce that
 * layout, not the pixels.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { HsmPqcIntroduction } from './components/HsmPqcIntroduction'
import {
  FIRMWARE_UPGRADE_PATHS,
  KEY_SIZE_COMPARISONS,
  PKCS11_MECHANISMS,
} from './data/hsmConstants'

const openSections = () => {
  render(
    <EmbedProvider>
      <MemoryRouter>
        <HsmPqcIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    </EmbedProvider>
  )
  for (const title of ['PKCS#11 v3.2 PQC Mechanisms', 'HSM Firmware Migration']) {
    fireEvent.click(screen.getByRole('heading', { name: title }))
  }
}

const CASES: [string, number, string[]][] = [
  [
    'hsm-classical-mechanisms',
    PKCS11_MECHANISMS.filter((m) => m.type === 'classical').length,
    ['Mechanism', 'Code', 'Description', 'Key Size'],
  ],
  [
    'hsm-pqc-mechanisms',
    PKCS11_MECHANISMS.filter((m) => m.type === 'pqc').length,
    ['Mechanism', 'Code', 'Description', 'Parameters'],
  ],
  [
    'hsm-buffer-sizes',
    KEY_SIZE_COMPARISONS.length,
    ['Algorithm', 'Public Key', 'Private Key', 'Sig/Ciphertext', 'Quantum Safe'],
  ],
  [
    'hsm-firmware-migration',
    FIRMWARE_UPGRADE_PATHS.length,
    [
      'Vendor',
      'Current → Target',
      'Algorithms Added',
      'Complexity',
      'Downtime (est.)',
      'FIPS Recert',
    ],
  ],
]

describe('HSM lesson tables on a phone', () => {
  it.each(CASES)(
    '%s has a stacked twin with one block per row and every column heading as a label',
    (id, rowCount, headings) => {
      openSections()
      const stacked = within(screen.getByTestId(`${id}-stacked`))
      expect(screen.getByTestId(`${id}-stacked`)).toHaveClass('sm:hidden')
      expect(stacked.getAllByRole('listitem')).toHaveLength(rowCount)
      expect(stacked.getAllByRole('term')).toHaveLength(rowCount * (headings.length - 1))
      expect(
        stacked
          .getAllByRole('term')
          .slice(0, headings.length - 1)
          .map((t) => t.textContent)
      ).toEqual(headings.slice(1))
      const table = within(within(screen.getByTestId(`${id}-table`)).getByRole('table'))
      expect(screen.getByTestId(`${id}-table`)).toHaveClass('hidden', 'sm:block')
      expect(table.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(headings)
      expect(table.getAllByRole('row')).toHaveLength(rowCount + 1)
    }
  )

  it('shows the FIPS Recert value of every vendor in the stacked firmware blocks', () => {
    openSections()
    const stacked = within(screen.getByTestId('hsm-firmware-migration-stacked'))
    const labels = stacked.getAllByText('FIPS Recert')
    expect(labels).toHaveLength(FIRMWARE_UPGRADE_PATHS.length)
    expect(stacked.getAllByText('Required')).toHaveLength(FIRMWARE_UPGRADE_PATHS.length)
    for (const path of FIRMWARE_UPGRADE_PATHS) {
      expect(stacked.getByText(path.vendorName)).toBeInTheDocument()
      expect(stacked.getAllByText(path.upgradeComplexity.toUpperCase()).length).toBeGreaterThan(0)
    }
  })

  it('keeps no table inside a narrow scrolling box on a phone', () => {
    openSections()
    expect(document.body.innerHTML).not.toMatch(/min-w-\[/)
    for (const table of screen.queryAllByRole('table')) {
      // eslint-disable-next-line testing-library/no-node-access -- the wrapper's classes are what hides the table on a phone
      expect(table.parentElement).toHaveClass('hidden', 'sm:block')
    }
  })
})
