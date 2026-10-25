// SPDX-License-Identifier: AGPL-3.0-only
/**
 * "Which scheme for which use" (Learn tab, after "What the lab tests"): five rows, each with one
 * example parameter set. The number of signatures on every row must equal 2 to the power of the
 * set's total tree height as the constants file defines it, and the figures that had no source
 * must appear nowhere on the page.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { StatefulSignaturesModule } from './index'
import { SchemeForUseSection } from './components/SchemeForUseSection'
import {
  SCHEME_FOR_USE_ROWS,
  LMS_PARAMETER_SETS,
  XMSS_PARAMETER_SETS,
  schemeForUseParamSet,
  schemeForUseTotalHeight,
} from './data/statefulSigsConstants'

const renderSection = () =>
  render(
    <MemoryRouter>
      <SchemeForUseSection />
    </MemoryRouter>
  )

/** 2^height with thousands separators, written out here and not taken from the section's code. */
const expectedCapacity = (height: number) => (BigInt(2) ** BigInt(height)).toLocaleString('en-US')

// The approved figures, in row order.
const APPROVED: Record<string, { height: number; capacity: string; label: string }> = {
  'firmware-signing': { height: 20, capacity: '1,048,576', label: 'LMS, one tree, height 20' },
  'code-signing': {
    height: 20,
    capacity: '1,048,576',
    label: 'XMSS-SHA2_20_256, one tree, height 20',
  },
  'secure-boot': { height: 10, capacity: '1,024', label: 'LMS, one tree, height 10' },
  'document-signing': {
    height: 40,
    capacity: '1,099,511,627,776',
    label: 'XMSS^MT-SHA2_40/4_256, total height 40 in 4 layers',
  },
  timestamping: {
    height: 60,
    capacity: '1,152,921,504,606,846,976',
    label: 'XMSS^MT-SHA2_60/6_256, total height 60 in 6 layers',
  },
}

describe('Which scheme for which use - capacities', () => {
  it('has the five approved uses in order', () => {
    expect(SCHEME_FOR_USE_ROWS.map((r) => r.id)).toEqual(Object.keys(APPROVED))
  })

  it('every row names a real parameter set whose total height gives the approved figure', () => {
    for (const r of SCHEME_FOR_USE_ROWS) {
      const set = schemeForUseParamSet(r)
      const want = APPROVED[r.id]
      expect(schemeForUseTotalHeight(r), r.id).toBe(want.height)
      expect(expectedCapacity(set.treeHeight), r.id).toBe(want.capacity)
      // the set's own maxSignatures agrees (2^60 is exact as a double, so BigInt() is exact)
      expect(BigInt(set.maxSignatures), r.id).toBe(BigInt(2) ** BigInt(set.treeHeight))
    }
    const all = [...LMS_PARAMETER_SETS, ...XMSS_PARAMETER_SETS]
    expect(new Set(all.map((s) => s.id)).size).toBe(all.length)
  })

  it('each displayed capacity equals 2 to the power of the set height, in the table and stacked', () => {
    renderSection()
    for (const r of SCHEME_FOR_USE_ROWS) {
      const height = schemeForUseParamSet(r).treeHeight
      expect(screen.getByTestId(`scheme-capacity-${r.id}`).textContent, r.id).toBe(
        expectedCapacity(height)
      )
      expect(screen.getByTestId(`scheme-stacked-capacity-${r.id}`).textContent, r.id).toBe(
        expectedCapacity(height)
      )
    }
  })
})

describe('Which scheme for which use - the section', () => {
  it('opens with the approved lead-in and shows each row as approved', () => {
    renderSection()
    expect(screen.getByRole('heading', { name: 'Which scheme for which use' })).toBeInTheDocument()
    expect(
      screen.getByText(
        /^Each row shows one example parameter set and the number of signatures it can ever make\. Every signature uses up one one-time key, so that number is a hard limit; estimate what your use needs and pick a set that covers it\. The record of which keys are used \(the state\) must stay inside the signing hardware module; a device that only verifies keeps none\.$/
      )
    ).toBeInTheDocument()
    const table = within(screen.getByTestId('scheme-table')).getByRole('table')
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((h) => h.textContent)
    ).toEqual(['Use', 'Parameter set', 'Signatures', 'State', 'CNSA 2.0'])
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(5)
    const cells = rows.map((r) =>
      within(r)
        .getAllByRole('cell')
        .map((c) => c.textContent)
    )
    expect(cells).toEqual([
      [
        'Firmware signing',
        'LMS, one tree, height 20',
        '1,048,576',
        'Signing HSM, the device holds none.',
        'LMS allowed for firmware and software, SHA-256/192 recommended, HSS not allowed.',
      ],
      [
        'Code signing',
        'XMSS-SHA2_20_256, one tree, height 20',
        '1,048,576',
        'Signing HSM.',
        'XMSS allowed for software, XMSS^MT not allowed.',
      ],
      [
        'Secure boot',
        'LMS, one tree, height 10',
        '1,024',
        "The vendor's signing HSM, the device holds only the public key.",
        'LMS allowed; note that a larger Winternitz w makes signatures smaller but slows key generation, signing and verification (RFC 8554).',
      ],
      [
        'Document signing',
        'XMSS^MT-SHA2_40/4_256, total height 40 in 4 layers',
        '1,099,511,627,776',
        'Signing HSM, backups must prevent state re-use (CNSA 2.0 FAQ p. 12).',
        'XMSS^MT not allowed, LMS and XMSS approved for firmware and software only, ML-DSA-87 approved for every use.',
      ],
      [
        'Timestamping',
        'XMSS^MT-SHA2_60/6_256, total height 60 in 6 layers',
        '1,152,921,504,606,846,976',
        'Signing HSM, backups must prevent state re-use (CNSA 2.0 FAQ p. 12).',
        'XMSS^MT not allowed, LMS and XMSS approved for firmware and software only, ML-DSA-87 approved for every use.',
      ],
    ])
  })

  it('shows the sources, each linking to its Library entry', () => {
    renderSection()
    const sources = screen.getByText(/^Sources:/)
    for (const [name, ref] of [
      ['NIST SP 800-208', 'NIST%20SP%20800-208'],
      ['RFC 8554', 'RFC%208554'],
      ['RFC 8391', 'RFC%208391'],
      ['NSA CNSA 2.0 FAQ v2.2', 'NSA%20CNSA%202.0%20FAQ'],
    ]) {
      expect(within(sources).getByRole('link', { name })).toHaveAttribute(
        'href',
        `/library?ref=${ref}`
      )
    }
  })

  it('has none of the figures or phrases that had no source', () => {
    const { container } = renderSection()
    const text = container.textContent ?? ''
    for (const gone of [
      '~10,000',
      '~100,000',
      '~1,000,000+',
      '~10,000,000+',
      '60-level',
      'Large W parameter',
      'OTP fuses',
      'secure element',
      'over device lifetime',
    ]) {
      expect(text, gone).not.toContain(gone)
    }
  })

  it('stacks on a phone: blocks below 640 px, the table from 640 px up, never both', () => {
    renderSection()
    const stacked = screen.getByTestId('scheme-stacked')
    expect(stacked).toHaveClass('sm:hidden')
    expect(stacked).not.toHaveClass('hidden')
    expect(within(stacked).getAllByRole('listitem')).toHaveLength(5)
    const wrap = screen.getByTestId('scheme-table')
    expect(wrap).toHaveClass('hidden', 'sm:block')
    expect(within(wrap).getByRole('table').className).not.toMatch(/min-w-/)
  })
})

describe('Which scheme for which use - on the Learn tab', () => {
  it('comes after "What the lab tests" and before the related resources', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <StatefulSignaturesModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    const lab = screen.getByRole('heading', { name: 'What the lab tests' })
    const scheme = screen.getByRole('heading', { name: 'Which scheme for which use' })
    const resources = screen.getByRole('heading', { name: 'Related Resources' })
    const FOLLOWS = Node.DOCUMENT_POSITION_FOLLOWING
    expect(lab.compareDocumentPosition(scheme) & FOLLOWS).toBeTruthy()
    expect(scheme.compareDocumentPosition(resources) & FOLLOWS).toBeTruthy()
  })
})
