// SPDX-License-Identifier: GPL-3.0-only
/**
 * Grade-A remediation Phase 2 (pqctoday-priv/grade-a-remediation/PLAN-00-TOP-
 * CONNECTING-PLAN.md §6, PLAN-11-REFERENCE-TRUST-TAIL.md): PatentDetail's
 * "Explore Related → Algorithms" link built its `highlight` query param
 * straight from the patent corpus's filing-era algorithm names (Kyber,
 * Dilithium, SPHINCS+, Falcon), which don't match anything in /algorithms'
 * own FIPS-parameter-set-named data (ML-KEM, ML-DSA, SLH-DSA, FN-DSA). These
 * tests confirm the link now runs the same names through the shared
 * `expandAlgorithmAliases` lookup (src/data/algorithmNameAliases.ts) that
 * PatentSearchPanel already uses, so the FIPS name rides along too.
 */
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithRouter } from '@/test/utils'
import { PatentDetail } from './PatentDetail'
import type { PatentItem } from '@/types/PatentTypes'

const basePatent: PatentItem = {
  patentNumber: 'US11000001',
  title: 'Lattice-Based Key Encapsulation Method',
  inventors: 'Test Inventor',
  assignee: 'TestCo',
  priorityDate: '2020-01-01',
  issueDate: '2022-06-01',
  filingDate: '2020-01-01',
  cpcCodes: '',
  summary: 'A sample summary.',
  primaryInventiveClaim: 'A sample claim.',
  cryptoAgilityMode: 'hybrid',
  migrationStrategy: 'hybrid',
  quantumRelevance: 'core_invention',
  quantumNotes: '',
  protocols: [],
  classicalAlgorithms: [],
  pqcAlgorithms: [],
  quantumTechnology: [],
  keyManagementOps: [],
  hardwareComponents: [],
  authenticationFactors: [],
  standardsReferenced: [],
  threatModel: [],
  entropySource: [],
  primitiveTypes: [],
  applicationDomain: [],
  independentClaimSubjects: [],
  performanceClaims: [],
  dataTypesProtected: [],
  complianceTargets: [],
  citationGraph: [],
  claimDependencies: [],
  nistRoundStatus: [],
  pqcMigrationScore: 5,
  pqcMigrationReason: '',
  impactScore: 50,
  impactLevel: 'Medium',
  priorityYear: 2020,
  filingYear: 2020,
}

function renderDetail(patent: PatentItem) {
  return renderWithRouter(
    <PatentDetail
      patent={patent}
      inCorpusIds={new Set([patent.patentNumber])}
      onClose={() => undefined}
      onNavigate={() => undefined}
    />
  )
}

describe('PatentDetail — Algorithms deep link', () => {
  it('translates a filing-era algorithm name (Kyber) to its FIPS name (ML-KEM) in the highlight param', () => {
    renderDetail({ ...basePatent, pqcAlgorithms: ['Kyber'] })
    const link = screen.getByRole('link', { name: /Algorithms/i })
    const href = link.getAttribute('href') ?? ''
    const highlight = decodeURIComponent(
      new URL(href, 'https://example.test').searchParams.get('highlight') ?? ''
    )
    const terms = highlight.split(',')
    expect(terms).toContain('Kyber')
    expect(terms).toContain('ML-KEM')
  })

  it('translates each of the four legacy filing-era names to their FIPS equivalents', () => {
    const cases: [string, string][] = [
      ['Kyber', 'ML-KEM'],
      ['Dilithium', 'ML-DSA'],
      ['SPHINCS+', 'SLH-DSA'],
      ['Falcon', 'FN-DSA'],
    ]
    for (const [legacy, fips] of cases) {
      const { unmount } = renderDetail({ ...basePatent, pqcAlgorithms: [legacy] })
      const link = screen.getByRole('link', { name: /Algorithms/i })
      const href = link.getAttribute('href') ?? ''
      const highlight = decodeURIComponent(
        new URL(href, 'https://example.test').searchParams.get('highlight') ?? ''
      )
      expect(highlight.split(',')).toContain(fips)
      unmount()
    }
  })

  it('leaves an already-FIPS-named algorithm untouched (no spurious duplicate)', () => {
    renderDetail({ ...basePatent, pqcAlgorithms: ['ML-KEM'] })
    const link = screen.getByRole('link', { name: /Algorithms/i })
    const href = link.getAttribute('href') ?? ''
    const highlight = decodeURIComponent(
      new URL(href, 'https://example.test').searchParams.get('highlight') ?? ''
    )
    expect(highlight.split(',')).toEqual(['ML-KEM', 'Kyber'])
  })

  it('omits the Algorithms link entirely when the patent has no PQC algorithms or standards', () => {
    renderDetail({ ...basePatent, pqcAlgorithms: [], standardsReferenced: [] })
    expect(screen.queryByRole('link', { name: /Algorithms/i })).not.toBeInTheDocument()
  })
})
