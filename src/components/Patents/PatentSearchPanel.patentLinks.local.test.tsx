// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PatentSearchPanel } from './PatentSearchPanel'
import { transformRow } from '@/data/patentsData'
import { filterPatents } from '@/data/patentFilters'
import type { PatentItem } from '@/types/PatentTypes'

vi.mock('@/services/search/useSemanticSearch', () => ({
  useSemanticSearch: () => ({ hits: [], mode: 'idle' as const, loading: false }),
}))
vi.mock('@/utils/analytics', () => ({ logPatentSearch: vi.fn(), logPatentView: vi.fn() }))

function bareRow(patentNumber = '12676741'): Parameters<typeof transformRow>[0] {
  return {
    patent_number: patentNumber,
    title: 'Fictional lattice key exchange example',
    inventors: 'Fictional Inventor',
    assignee: 'Sample Assignee',
    priority_date: '2025-01-01',
    issue_date: '2025-06-01',
    filing_date: '2025-01-01',
    cpc_codes: '',
    one_sentence_summary: 'Fictional lattice demonstration for link construction only.',
    primary_inventive_claim: '',
    crypto_agility_mode: 'pqc_only',
    migration_strategy: 'in_place_upgrade',
    quantum_relevance: 'core_invention',
    quantum_notes: '',
    quantum_safe_basis: 'pqc_algorithm',
    protocols: '',
    classical_algorithms: '',
    pqc_algorithms: 'ML-KEM',
    quantum_technology: '',
    key_management_ops: '',
    hardware_components: '',
    authentication_factors: '',
    standards_referenced: '',
    threat_model: '',
    entropy_source: '',
    primitive_types: '',
    application_domain: '',
    independent_claim_subjects: '',
    performance_claims: '',
    data_types_protected: '',
    compliance_targets: '',
    citation_graph: '',
    claim_dependencies: '[]',
    nist_round_status: '[]',
    pqc_migration_score: '5',
    pqc_migration_reason: '',
    status: 'active',
  }
}
function parsedPatent(): PatentItem {
  const patent = transformRow(bareRow())
  if (!patent) throw new Error('Active fictional bare-number row must parse')
  return patent
}
async function assertCorrectResult(patents: PatentItem[]) {
  render(<PatentSearchPanel patents={patents} onSelectPatent={vi.fn()} urlQuery="lattice" />)
  const link = await screen.findByRole('link', { name: 'Open on Google Patents' })
  expect(link).toHaveAttribute('href', 'https://patents.google.com/patent/US12676741')
  expect(link).toHaveAttribute('target', '_blank')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  expect(screen.getByText('US12676741')).toBeInTheDocument()
  expect(screen.queryByText('US US12676741')).not.toBeInTheDocument()
  expect(link.getAttribute('href')).not.toContain('/USUS')
}

describe('Patent search canonical external identifier', () => {
  it('turns a supported bare CSV identifier into one US-prefixed search link through the real parser', async () => {
    const raw = bareRow()
    expect(raw.patent_number).toBe('12676741')
    const patent = transformRow(raw)
    expect(patent?.patentNumber).toBe('US12676741')
    if (!patent) throw new Error('Expected parsed patent')
    await assertCorrectResult([patent])
  })

  it('preserves an already canonical US-prefixed PatentItem without adding a second prefix', async () => {
    const patent: PatentItem = { ...parsedPatent(), patentNumber: 'US12676741' }
    await assertCorrectResult([patent])
  })

  it.each(['12676741', 'US12676741'])(
    'accepts the documented patentIds=%s filter boundary and keeps the canonical external link',
    async (inputId) => {
      const selected = parsedPatent()
      const other = transformRow(bareRow('12676742'))
      if (!other) throw new Error('Expected second active fictional patent')
      const filtered = filterPatents([selected, other], new URLSearchParams({ patentIds: inputId }))
      expect(filtered.map((patent) => patent.patentNumber)).toEqual(['US12676741'])
      await assertCorrectResult(filtered)
    }
  )
})
