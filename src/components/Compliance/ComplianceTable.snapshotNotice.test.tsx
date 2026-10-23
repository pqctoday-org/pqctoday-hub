// SPDX-License-Identifier: AGPL-3.0-only
//
// The Records table is a published snapshot, not a live feed. The reader must see
// that next to the retrieval dates, not only in a tooltip, and the reload button
// must say what it reloads (the snapshot).
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ComplianceTable } from './ComplianceTable'
import type { ComplianceRecord } from './types'

const records: ComplianceRecord[] = [
  {
    id: '5560',
    source: 'NIST',
    date: '2026-10-21',
    link: 'https://example.test',
    type: 'FIPS 140-3',
    status: 'Active',
    pqcCoverage: '',
    productName: 'Module A',
    productCategory: 'HSM',
    vendor: 'Vendor A',
  },
]

describe('ComplianceTable snapshot notice', () => {
  it('prints that the table is a snapshot, not a live feed', () => {
    render(<ComplianceTable data={records} onRefresh={vi.fn()} />)
    expect(screen.getByTestId('records-snapshot-notice')).toHaveTextContent(
      'Snapshot, not a live feed — confirm status on the official register'
    )
  })

  it('names what the reload button reloads', () => {
    render(<ComplianceTable data={records} onRefresh={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Reload this snapshot/ })).toBeInTheDocument()
  })

  it('prints the retrieval dates as UTC, in a line of their own under the toolbar', () => {
    render(
      <ComplianceTable
        data={records}
        onRefresh={vi.fn()}
        lastUpdated={new Date('2026-10-21T00:00:00Z')}
        meta={{
          schemaVersion: 1,
          partitions: {
            fips: { label: 'NIST CMVP', retrievedAt: '2026-10-23T02:05:53+00:00' },
            cavp: { label: 'NIST CAVP', retrievedAt: '2026-10-22T23:10:00+00:00' },
          },
        }}
      />
    )
    const line = screen.getByTestId('records-retrieval')
    expect(line).toHaveTextContent(
      'NIST CMVP retrieved 23 Oct 2026 · NIST CAVP retrieved 22 Oct 2026 (dates in UTC)'
    )
    expect(line).toHaveTextContent('Newest record date: 21 Oct 2026')
  })
})
