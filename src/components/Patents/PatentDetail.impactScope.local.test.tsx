// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
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
  quantumSafeBasis: 'pqc_algorithm',
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

it.each(['classical_only', 'pqc_only'] as const)(
  'keeps a high %s catalogue score without claiming verified priority or patent validity',
  (mode) => {
    const close = vi.fn()
    renderWithRouter(
      <PatentDetail
        patent={{ ...basePatent, cryptoAgilityMode: mode, impactScore: 82, impactLevel: 'High' }}
        inCorpusIds={new Set([basePatent.patentNumber])}
        onClose={close}
        onNavigate={() => undefined}
      />
    )
    expect(screen.getByText('Hub catalogue analysis score')).toBeVisible()
    expect(screen.getByText('82')).toBeVisible()
    expect(screen.getByText(/This uncalibrated Hub score/)).toHaveTextContent(
      'does not establish migration priority, deployed security, patent validity or IP value'
    )
    expect(screen.queryByText('Migration Impact')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Close/ }))
    expect(close).toHaveBeenCalledOnce()
  }
)
