// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { MobileComplianceView, type MobileCertRecord } from './MobileComplianceView'
const sample: MobileCertRecord = {
  id: 'sample-cert',
  source: 'NIST',
  date: '2026-01-01',
  type: 'ACVP',
  status: 'Validated',
  productName: 'Sample implementation',
  vendor: 'Sample vendor',
  productCategory: 'Software',
  link: 'https://example.test/sample',
  pqcCoverage: 'ML-KEM',
}
describe('Phone snapshot loading, failure, empty success and retry', () => {
  it('does not present unavailable product-record counts as zero', () => {
    render(
      <MemoryRouter initialEntries={['/compliance?tab=products']}>
        <MobileComplianceView records={[]} recordsLoaded={false} recordsLoading />
      </MemoryRouter>
    )
    expect(screen.getByRole('status')).toHaveTextContent('Loading certification records')
    expect(
      screen.getByText('Snapshot counts are unavailable until records load successfully.')
    ).toBeInTheDocument()
    expect(screen.queryByText(/Current snapshot:/)).not.toBeInTheDocument()
  })
  it('shows the shared error/retry and recovers to the loaded sample counts', async () => {
    const retry = vi.fn()
    const { rerender } = render(
      <MemoryRouter initialEntries={['/compliance?tab=products']}>
        <MobileComplianceView
          records={[]}
          recordsError="Sample snapshot unavailable"
          onRetryRecords={retry}
        />
      </MemoryRouter>
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Sample snapshot unavailable')
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(retry).toHaveBeenCalledOnce()
    expect(screen.queryByText(/Current snapshot:/)).not.toBeInTheDocument()
    rerender(
      <MemoryRouter>
        <MobileComplianceView records={[sample]} recordsLoaded onRetryRecords={retry} />
      </MemoryRouter>
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(
      screen.getByText(/Current snapshot: 1 PQC algorithm-validation records/)
    ).toBeInTheDocument()
  })
  it('distinguishes successful empty records from loading and unavailable records', () => {
    render(
      <MemoryRouter initialEntries={['/compliance?tab=records']}>
        <MobileComplianceView records={[]} recordsLoaded />
      </MemoryRouter>
    )
    expect(
      screen.getByText('The loaded snapshot contains no certification records.')
    ).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
  it('does not call a certificate absent while its source is failed, even if old records remain', () => {
    render(
      <MemoryRouter initialEntries={['/compliance?cert=sample-missing']}>
        <MobileComplianceView
          records={[sample]}
          recordsLoaded
          recordsError="Sample source failed"
        />
      </MemoryRouter>
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Sample source failed')
    expect(screen.queryByText(/No certification record with the ID/)).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Certification records' })).not.toBeInTheDocument()
  })
})
