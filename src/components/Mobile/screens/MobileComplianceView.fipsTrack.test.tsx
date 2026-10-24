// SPDX-License-Identifier: AGPL-3.0-only
//
// The phone Records tab prints one line under the PQC summary: the desktop
// chart's Products view at its latest month (prerequisite met (CAVP) / in
// progress / certified), from the same model and data.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { MobileComplianceView, type MobileCertRecord } from './MobileComplianceView'
import { usePersonaStore } from '@/store/usePersonaStore'
import { softwareData } from '@/data/migrateData'
import { certsByProduct } from '@/data/certificationXrefData'
import {
  buildProductStageTimeline,
  type InProcessMatch,
} from '@/components/Compliance/fipsStageProgressModel'
import { computeRecordsSnapshotDate } from '@/components/Compliance/recordSemantics'
import type { CertificationXref, SoftwareItem } from '@/types/MigrateTypes'

// A small fixed catalogue instead of the production one (whose size changes with
// every data release). Unmocked, the dynamic import would also parse the real CSVs
// and can outlive the test (EnvironmentTeardownError).
vi.mock('@/data/migrateData', () => {
  const p = (productId: string, over: Record<string, unknown>) => ({
    productId,
    softwareName: productId,
    pqcStatusCanonical: 'available',
    pqcCertified: 'none',
    ...over,
  })
  return {
    softwareData: [
      p('certified-1', { pqcCertified: 'yes' }),
      p('progress-1', { pqcCertified: 'in_progress' }),
      p('progress-2', { pqcCertified: 'in_progress' }),
      p('cavp-1', { pqcCertified: 'cavp' }),
      p('cavp-2', { pqcCertified: 'cavp' }),
      p('cavp-3', { pqcCertified: 'cavp' }),
      p('no-validation', { pqcCertified: 'none' }),
      p('no-pqc', { pqcStatusCanonical: 'none', pqcCertified: 'none' }),
    ],
  }
})
vi.mock('@/data/certificationXrefData', () => {
  const cert = (productId: string, certType: string, certDate: string) => ({
    productId,
    softwareName: productId,
    certType,
    certId: `${productId}-${certType}`,
    certVendor: 'V',
    certProduct: productId,
    pqcAlgorithms: 'ML-KEM',
    certificationLevel: '',
    status: 'Active',
    certDate,
    certLink: '',
    classicalOnly: false,
  })
  return {
    certsByProduct: new Map([
      [
        'certified-1',
        [
          cert('certified-1', 'ACVP', '2024-03-10'),
          cert('certified-1', 'FIPS 140-3', '2025-01-20'),
        ],
      ],
      ['progress-1', [cert('progress-1', 'ACVP', '2024-05-01')]],
      ['progress-2', [cert('progress-2', 'ACVP', '2024-06-01')]],
      ['cavp-1', [cert('cavp-1', 'ACVP', '2024-08-01')]],
      ['cavp-2', [cert('cavp-2', 'ACVP', '2024-09-01')]],
      ['cavp-3', [cert('cavp-3', 'ACVP', '2025-03-05')]],
    ]),
  }
})

const matches: InProcessMatch[] = [
  { product_id: 'progress-1', list: 'IUT', module: 'M1', date: '2025-02-10' },
  { product_id: 'progress-2', list: 'IUT', module: 'M2', date: '2025-01-05' },
]

const record = (over: Partial<MobileCertRecord>): MobileCertRecord => ({
  id: '4389',
  source: 'NIST',
  date: '2025-03-15',
  link: 'https://csrc.nist.gov/x',
  type: 'FIPS 140-3',
  status: 'Active',
  productName: 'Acme Crypto Module',
  productCategory: 'HSM',
  vendor: 'Acme',
  pqcCoverage: 'ML-KEM',
  ...over,
})
// The newest record date ends the axis, as on desktop: March 2025.
const records = [
  record({}),
  record({ id: 'A5555', type: 'ACVP', status: 'Validated', date: '2024-06-01' }),
]

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <MobileComplianceView records={records} recordsLoaded />
    </MemoryRouter>
  )
}

const stubFetch = (ok: boolean) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok, json: async () => (ok ? { matches } : null) }))
  )

beforeEach(() => {
  usePersonaStore.setState({ selectedPersona: null, selectedIndustries: [], selectedRegion: null })
})
afterEach(() => vi.unstubAllGlobals())

describe('MobileComplianceView — FIPS 140-3 track line (Records tab)', () => {
  it('shows the three counts the model gives for the same data, right under the PQC summary', async () => {
    stubFetch(true)
    renderAt('/compliance?tab=records')

    // Lazy: not there on first paint.
    expect(screen.queryByTestId('records-phone-fips-track')).not.toBeInTheDocument()

    const line = await screen.findByTestId('records-phone-fips-track')
    const latest = buildProductStageTimeline(
      softwareData as unknown as SoftwareItem[],
      certsByProduct as unknown as Map<string, CertificationXref[]>,
      matches,
      computeRecordsSnapshotDate(records) as Date
    ).points.at(-1)
    expect(latest).toMatchObject({ month: '2025-03', cavp: 3, in_progress: 2, certified: 1 })
    expect(line).toHaveTextContent(
      `FIPS 140-3 track: prerequisite met (CAVP) ${latest?.cavp} · in progress (NIST IUT / MIP) ${latest?.in_progress} · certified ${latest?.certified}.`
    )
    expect(line).toHaveTextContent(
      'FIPS 140-3 track: prerequisite met (CAVP) 3 · in progress (NIST IUT / MIP) 2 · certified 1.'
    )
    // 'none' (1 product with no validation) is left out.
    expect(line.textContent).not.toMatch(/no pqc validation/i)
    // Directly under the PQC summary, above the snapshot notice.
    expect(screen.getByTestId('records-phone-snapshot')).toHaveTextContent(
      /PQC in this snapshot:.*CAVP validations\.FIPS 140-3 track:.*certified 1\.Snapshot, not a live feed/
    )
  })

  it('is absent when the NIST matches file fails to load', async () => {
    stubFetch(false)
    renderAt('/compliance?tab=records')
    await waitFor(() => expect(fetch).toHaveBeenCalled())
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(screen.queryByTestId('records-phone-fips-track')).not.toBeInTheDocument()
    // The rest of the snapshot block is unaffected.
    expect(screen.getByTestId('records-phone-snapshot')).toHaveTextContent(/PQC in this snapshot:/)
  })

  it('loads nothing until the Records list is showing', async () => {
    stubFetch(true)
    renderAt('/compliance')
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(fetch).not.toHaveBeenCalled()
    expect(screen.queryByTestId('records-phone-fips-track')).not.toBeInTheDocument()
  })
})
