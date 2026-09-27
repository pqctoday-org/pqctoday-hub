// SPDX-License-Identifier: GPL-3.0-only
// OWNER: FIPS author
/**
 * Render sanity for Path A: every FIPS section renders its teaching anchors,
 * the landscape reads Level/status only from the Hub's CMVP certificate-page
 * fields (with a link-out fallback), and the level planner scores fit, not
 * height.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import type { ReactNode } from 'react'
import {
  FipsAcvpBridge,
  FipsLandscape,
  FipsLevels,
  FipsLifecycle,
  FipsRequirementAreas,
  FipsRouteTable,
  FipsWhatItIs,
} from './FipsSections'
import { FipsLevelPlanner } from '../../workshop/FipsLevelPlanner'
import { CMVP_ROUTES, SP_LEVEL_ROWS, VERIFIED_PQC_LEVEL3_CERTS } from '../../data/fipsData'

const wrap = (node: ReactNode) => render(<MemoryRouter>{node}</MemoryRouter>)

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('FIPS sections render', () => {
  it('what-it-is: pins the ISO editions and reads a real certificate', () => {
    wrap(<FipsWhatItIs />)
    expect(screen.getByText(/ISO published 2025 editions of both documents/)).toBeInTheDocument()
    expect(screen.getByText('Five documents, five jobs')).toBeInTheDocument()
    expect(screen.getByText('Security Level Exceptions')).toBeInTheDocument()
  })

  it('requirement areas: renders the twelve Security Policy rows for four certificates', () => {
    wrap(<FipsRequirementAreas />)
    const rowHeaders = screen.getAllByRole('rowheader').map((h) => h.textContent ?? '')
    for (const [i, row] of SP_LEVEL_ROWS.entries()) expect(rowHeaders).toContain(`${i + 1}. ${row}`)
    expect(screen.getAllByRole('columnheader')).toHaveLength(5)
  })

  it('levels: corrects "Level 1 = software-only" and teaches the FIPS-L3 / PCI PIN nuance', () => {
    wrap(<FipsLevels />)
    expect(screen.getByText(/Level 1 is not “software-only”/)).toBeInTheDocument()
    expect(screen.getByText(/FIPS Level 3 and PCI/)).toBeInTheDocument()
  })

  it('lifecycle: MIP is pipeline, not proof', () => {
    wrap(<FipsLifecycle />)
    expect(screen.getByText('Pipeline, not proof')).toBeInTheDocument()
    expect(screen.getByText(/does not imply or guarantee FIPS 140/)).toBeInTheDocument()
  })

  it('acvp bridge and route table render', () => {
    wrap(
      <>
        <FipsAcvpBridge />
        <FipsRouteTable />
      </>
    )
    expect(screen.getByLabelText('From algorithm to certificate')).toBeInTheDocument()
    for (const r of CMVP_ROUTES) expect(screen.getAllByText(r.code).length).toBeGreaterThan(0)
  })
})

describe('FIPS landscape — Hub data contract', () => {
  it('shows Level/status from certificate-page fields and falls back per missing field', async () => {
    const [withFields] = VERIFIED_PQC_LEVEL3_CERTS
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => [
          {
            id: withFields.cert,
            type: 'FIPS 140-3',
            // legacy fields must be ignored
            certificationLevel: 'FIPS 140-3 L1',
            pqcCoverage: 'nonsense',
            overallLevel: 3,
            cmvpStatus: 'Active',
            sunsetDate: '2031-05-19',
            embodiment: 'MultiChipStand',
            cmvpDetailsFetchedAt: '2026-09-24T12:00:00Z',
          },
        ],
      }))
    )
    wrap(<FipsLandscape />)
    const row = await screen.findByRole('row', { name: (n) => n.includes(`#${withFields.cert}`) })
    expect(within(row).getByText('Level 3')).toBeInTheDocument()
    expect(within(row).getByText('Active')).toBeInTheDocument()
    expect(within(row).getByText('2031-05-19')).toBeInTheDocument()
    // the other three have no fields → link-out fallback
    expect(screen.getAllByText('not in Hub data — see certificate').length).toBeGreaterThanOrEqual(
      3
    )
    expect(screen.queryByText('FIPS 140-3 L1')).not.toBeInTheDocument()
  })

  it('degrades to a link-out note when the data cannot be loaded', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline')
      })
    )
    wrap(<FipsLandscape />)
    expect(await screen.findByText(/Hub certificate data could not be loaded/)).toBeInTheDocument()
  })
})

describe('FIPS level planner', () => {
  const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))

  it('does not reward the highest level, and accepts a fitting plan', () => {
    wrap(<FipsLevelPlanner config={{ scenario: 'appliance' }} />)
    click('Appliance hardware')
    click('Firmware')
    click('Crypto library')
    click('Overall Level 4')
    click(/CAVP algorithm validations/)
    click(/Self-tests for each PQC algorithm/)
    click(/Entropy source validation/)
    click(/UPDT if each of the five change ratios/)
    click(/validated under FIPS 140-3 certificate #N at overall Level 3/)
    click('Check my plan')
    expect(screen.getByText(/4 of 5 decisions defensible for/)).toBeInTheDocument()
    expect(screen.getByText(/Over-specified/)).toBeInTheDocument()

    click('Overall Level 3')
    click('Check my plan')
    expect(screen.getByText(/5 of 5 decisions defensible for/)).toBeInTheDocument()
  })

  it('rejects TRNS for a market deadline and a MIP-based claim', () => {
    wrap(<FipsLevelPlanner config={{ scenario: 'cloud-partition', focus: 'claim' }} />)
    click(/No separate level/)
    click(/TRNS/)
    click(/validation pending at Level 3/)
    click('Check my plan')
    expect(screen.getByText(/published CMVP algorithm transition/)).toBeInTheDocument()
    expect(screen.getByText(/queue position, not evidence/)).toBeInTheDocument()
  })
})
