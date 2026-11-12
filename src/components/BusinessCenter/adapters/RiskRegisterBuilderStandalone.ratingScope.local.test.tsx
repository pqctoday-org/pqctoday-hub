// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { RiskRegisterBuilderStandalone } from './RiskRegisterBuilderStandalone'
import {
  AUTOMATIC_RISK_RATING_SCOPE,
  buildRiskRegisterMarkdown,
} from '@/components/PKILearning/modules/PQCRiskManagement/components/RiskRegisterBuilder'
import { DEFAULT_RISK_ENTRIES, useRiskRegisterStore } from '@/store/useRiskRegisterStore'
import { bankRiskEntries } from '@/components/Simulation/autorun/executiveBankCase'

let sampleBank = false
let snapshot = {
  input: { dataSensitivity: ['high'], migrationStatus: 'not-started' },
  result: { hndlRiskWindow: { isAtRisk: true } },
}
let transitions = [
  {
    classical: 'RSA',
    storedKey: 'RSA-2048',
    keySize: '2048-bit',
    function: 'Signature',
    pqc: 'ML-DSA',
    deprecationDate: '',
    status: 'Sample',
  },
]
let context = {
  myFrameworks: [] as unknown[],
  myProducts: [] as { softwareName: string }[],
  myThreats: [] as { industry: string; criticality: string; description: string }[],
}
vi.mock('@/components/Simulation/autorun/autoRunFill', () => ({
  isExecutiveBankOverview: () => sampleBank,
}))
vi.mock('@/hooks/assessment/useAssessmentSnapshot', () => ({
  useAssessmentSnapshot: () => snapshot,
}))
vi.mock('@/hooks/useAlgorithmTransitionsForAssessment', () => ({
  useAlgorithmTransitionsForAssessment: () => transitions,
}))
vi.mock('@/hooks/useExecutiveModuleData', () => ({ useExecutiveModuleData: () => context }))
vi.mock(
  '@/components/PKILearning/modules/PQCRiskManagement/components/RiskHeatmapGenerator',
  () => ({ EducationalGuide: () => null })
)

beforeEach(() => {
  sampleBank = false
  snapshot = {
    input: { dataSensitivity: ['high'], migrationStatus: 'not-started' },
    result: { hndlRiskWindow: { isAtRisk: true } },
  }
  transitions = [
    {
      classical: 'RSA',
      storedKey: 'RSA-2048',
      keySize: '2048-bit',
      function: 'Signature',
      pqc: 'ML-DSA',
      deprecationDate: '',
      status: 'Sample',
    },
  ]
  context = { myFrameworks: [], myProducts: [], myThreats: [] }
  useRiskRegisterStore.setState({ riskEntries: [], lastSavedKey: null })
})
describe('automatic risk rating interpretation', () => {
  it('does not increase signing likelihood for HNDL or impact for framework bookmarks', async () => {
    context = {
      myFrameworks: [{}],
      myProducts: [{ softwareName: 'Fictional product' }],
      myThreats: [{ industry: 'Sample', criticality: 'high', description: 'Fictional threat' }],
    }
    render(<RiskRegisterBuilderStandalone />)
    await waitFor(() =>
      expect(useRiskRegisterStore.getState().riskEntries[0]?.id).toBe('assess-risk-1')
    )
    const rows = useRiskRegisterStore.getState().riskEntries
    expect(rows.map((r) => [r.likelihood, r.impact])).toEqual([
      [4, 4],
      [4, 4],
      [4, 4],
    ])
    expect(rows[0].threatVector).toBe('forgery')
    fireEvent.click(screen.getByText('How automatic starting ratings work'))
    expect(screen.getByText(AUTOMATIC_RISK_RATING_SCOPE)).toHaveTextContent(
      'not event probabilities'
    )
    expect(screen.getByText(AUTOMATIC_RISK_RATING_SCOPE)).toHaveTextContent(
      'signing and symmetric/hash rows do not receive that increase'
    )
    const md = buildRiskRegisterMarkdown(rows)
    expect(md).toContain(AUTOMATIC_RISK_RATING_SCOPE)
    expect(md).not.toContain('| 5 | 5 | 25 | Critical |')
    expect(md).toContain('| 4 | 4 | 16 | High |')
    expect(md).toContain(
      'a bookmark does not establish deployment, algorithm exposure or calibrated risk'
    )
    expect(md).toContain('Framework bookmarks do not change these ratings')
  })
  it.each([false, true])('applies HNDL=%s only to confidentiality rows', async (hndlOpen) => {
    snapshot.result.hndlRiskWindow.isAtRisk = hndlOpen
    const base = transitions[0]
    transitions = ['Signature', 'Symmetric', 'Encryption/KEM'].map((fn) => ({
      ...base,
      function: fn,
    }))
    context.myFrameworks = [{}, {}, {}]
    render(<RiskRegisterBuilderStandalone />)
    await waitFor(() => expect(useRiskRegisterStore.getState().riskEntries).toHaveLength(3))
    expect(
      useRiskRegisterStore
        .getState()
        .riskEntries.map((r) => [r.threatVector, r.likelihood, r.impact])
    ).toEqual([
      ['forgery', 4, 4],
      ['grover', 4, 4],
      ['hndl', hndlOpen ? 5 : 4, 4],
    ])
  })
  it.each([
    ['not-started', ['critical'], 4, 5],
    ['planning', ['high'], 3, 4],
    ['other', ['medium'], 3, 3],
    ['other', ['low'], 3, 2],
    ['other', [], 3, 3],
  ])(
    'keeps initial ordinal rule for %s and %j',
    async (status, sensitivity, likelihood, impact) => {
      snapshot = {
        input: { dataSensitivity: sensitivity as string[], migrationStatus: status as string },
        result: { hndlRiskWindow: { isAtRisk: false } },
      }
      render(<RiskRegisterBuilderStandalone />)
      await waitFor(() =>
        expect(useRiskRegisterStore.getState().riskEntries[0]?.id).toBe('assess-risk-1')
      )
      expect(useRiskRegisterStore.getState().riskEntries[0]).toMatchObject({ likelihood, impact })
    }
  )
  it('describes stored entries separately from current context without reseeding edited values', () => {
    const old = {
      id: 'assess-risk-1',
      assetName: 'Earlier edited signing sample',
      currentAlgorithm: 'RSA-2048',
      threatVector: 'forgery',
      likelihood: 2,
      impact: 2,
      mitigation: 'Keep edited values',
    }
    useRiskRegisterStore.setState({ riskEntries: [old] })
    context.myProducts = [{ softwareName: 'Current unrelated product' }]
    render(<RiskRegisterBuilderStandalone />)
    expect(screen.getByRole('status')).toHaveTextContent('1 stored risk entry')
    expect(screen.getByRole('status')).toHaveTextContent(
      'Current available context: 1 reported algorithm + 1 product'
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'Stored or edited entries may reflect earlier inputs'
    )
    expect(screen.queryByText('Pre-filled from your assessment.')).not.toBeInTheDocument()
    expect(useRiskRegisterStore.getState().riskEntries).toEqual([old])
    expect(buildRiskRegisterMarkdown([old])).toContain('| 2 | 2 | 4 | Low |')
    fireEvent.click(screen.getByRole('button', { name: 'Restore sample entries' }))
    expect(useRiskRegisterStore.getState().riskEntries).toEqual(DEFAULT_RISK_ENTRIES)
  })
  it('preserves the executive bank branch without attaching current-input seed attribution', () => {
    sampleBank = true
    render(<RiskRegisterBuilderStandalone />)
    expect(screen.queryByText('How automatic starting ratings work')).not.toBeInTheDocument()
    expect(screen.queryByText('Stored worksheet context.')).not.toBeInTheDocument()
    expect(screen.getByDisplayValue(bankRiskEntries()[0].assetName)).toBeInTheDocument()
    expect(useRiskRegisterStore.getState().riskEntries).toEqual([])
  })
})
