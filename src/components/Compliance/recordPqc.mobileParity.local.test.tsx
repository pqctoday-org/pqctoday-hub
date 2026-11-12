// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import '@testing-library/jest-dom'
import { MobileComplianceView } from '@/components/Mobile/screens/MobileComplianceView'
import { recordFilterExclusions } from './recordFilters'
import type { ComplianceRecord } from './types'
import { usePersonaStore } from '@/store/usePersonaStore'

const row = (
  id: string,
  pqcCoverage: string,
  type: ComplianceRecord['type'] = 'ACVP'
): ComplianceRecord => ({
  id,
  pqcCoverage,
  type,
  source: 'NIST',
  status: 'Validated',
  date: '2026-01-01',
  link: 'https://example.test/sample',
  productName: id,
  productCategory: 'Library',
  vendor: 'Sample',
})
const records = [
  row('KEM sample', 'ML-KEM'),
  row('DSA sample', 'ML-DSA'),
  row('Mixed sample', 'ML-KEM, ML-DSA'),
  row('SLH sample', 'SLH-DSA'),
  row('Unknown sample', ''),
  row('Entropy sample', '', 'ESV'),
]
const cases: [string, string[]][] = [
  ['pqc=ML-KEM', ['KEM sample', 'Mixed sample']],
  ['pqc=ML-DSA', ['DSA sample', 'Mixed sample']],
  ['pqc=ML-KEM,ML-DSA', ['KEM sample', 'DSA sample', 'Mixed sample']],
  ['pqc=SLH-DSA', ['SLH sample']],
  ['pqc=unrecorded', []],
  ['pqc=ML-KEM-768', []],
  ['pqc=ml-kem', []],
  ['pqc=,', records.map((r) => r.id)],
  ['pqc=ML-KEM,,ML-DSA', ['KEM sample', 'DSA sample', 'Mixed sample']],
  ['pqc=ML-KEM&pqc=ML-DSA', ['KEM sample', 'Mixed sample']],
  ['pqc=%20ML-KEM', []],
  ['pqc=ML-KEM&rtab=esv', ['Entropy sample']],
  ['pqc=ML-KEM&rtab=ESV', ['Entropy sample']],
]
function Probe() {
  return <output data-testid="url">{useLocation().search}</output>
}
function show(query: string) {
  render(
    <MemoryRouter initialEntries={['/compliance?tab=records&' + query]}>
      <MobileComplianceView records={records} recordsLoaded />
      <Probe />
    </MemoryRouter>
  )
}
const params = () => new URLSearchParams(screen.getByTestId('url').textContent ?? '')
beforeEach(() =>
  usePersonaStore.setState({ selectedPersona: null, selectedIndustries: [], selectedRegion: null })
)

describe('Phone named-PQC incoming filters retain desktop semantics', () => {
  it.each(cases)(
    'matches the desktop result and explicit expectation for %s',
    (query, expected) => {
      const search = new URLSearchParams(query)
      const desktop = records
        .filter(
          (record) =>
            recordFilterExclusions(record, {
              scope: 'current',
              certType: search.get('rtab') ?? 'all',
              text: '',
              pqc: search.get('pqc')?.split(',').filter(Boolean) ?? [],
              category: [],
              source: [],
              vendor: [],
              migrateCat: [],
            }).length === 0
        )
        .map((r) => r.id)
      expect(desktop).toEqual(expected)
      show(query)
      const list = within(screen.getByRole('region', { name: 'Certification records' }))
      for (const record of records) {
        expect(Boolean(list.queryByText(record.productName))).toBe(expected.includes(record.id))
      }
      expect(params().get('pqc')).toBe(search.get('pqc'))
      if (expected.length === 0) expect(list.getByText('No records match.')).toBeInTheDocument()
    }
  )
  it('shows an incoming filter and clears only pqc, retaining other URL choices', () => {
    show('pqc=ML-KEM&rtab=acvp&rstatus=all&q=sample&vendor=Sample&unrelated=keep')
    const active = screen.getByRole('group', { name: 'Active PQC filter' })
    expect(active).toHaveTextContent('ML-KEM')
    fireEvent.click(within(active).getByRole('button', { name: 'Clear PQC filter' }))
    expect(params().has('pqc')).toBe(false)
    expect(params().get('rtab')).toBe('acvp')
    expect(params().get('q')).toBe('sample')
    expect(params().get('rstatus')).toBe('all')
    expect(params().get('vendor')).toBe('Sample')
    expect(params().get('unrelated')).toBe('keep')
    expect(screen.queryByRole('group', { name: 'Active PQC filter' })).not.toBeInTheDocument()
    expect(screen.getByText('DSA sample')).toBeInTheDocument()
  })
  it('preserves pqc when search and record-type controls change', () => {
    show('pqc=ML-KEM,ML-DSA')
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search certification records' }), {
      target: { value: 'Mixed' },
    })
    expect(params().get('pqc')).toBe('ML-KEM,ML-DSA')
    expect(screen.getByText('Mixed sample')).toBeInTheDocument()
    expect(screen.queryByText('KEM sample')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'NIST CAVP' }))
    expect(params().get('pqc')).toBe('ML-KEM,ML-DSA')
    expect(params().get('q')).toBe('Mixed')
  })
  it('keeps the incoming selection visible and explains its existing ESV exception', () => {
    show('pqc=ML-KEM&rtab=esv')
    expect(screen.getByRole('group', { name: 'Active PQC filter' })).toHaveTextContent(
      'Not applied to entropy source records'
    )
    expect(screen.getByText('Entropy sample')).toBeInTheDocument()
  })
})
