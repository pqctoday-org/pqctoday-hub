// SPDX-License-Identifier: AGPL-3.0-only
//
// A run produces hundreds of rows. The reader narrows them with status chips (pass / fail /
// skipped) and evidence-class chips; the counts on the chips come from the finished run.
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { TestResult } from '@/components/Playground/hsm/acvp/useAcvpSuite'

const row = (id: string, status: TestResult['status']): TestResult => ({
  id,
  algorithm: 'KDF',
  testCase: `case ${id}`,
  referenceUrl: 'https://example.test',
  status,
  details: '',
  category: 'kdf',
})

const results = [row('r1', 'pass'), row('r2', 'pass'), row('r3', 'fail'), row('r4', 'skip')]
const classesOf: Record<string, string[]> = {
  r1: ['nist-acvp-reference-sample'],
  r2: ['published-standard-kat'],
  r3: ['published-standard-kat'],
}

vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({ isReady: false, moduleRef: { current: null }, hSessionRef: { current: 0 } }),
}))

vi.mock('@/components/Playground/hsm/HsmContext', () => ({
  useHsmContext: () => ({ engineMode: 'rust' }),
}))

vi.mock('@/data/validation/acvpRowEvidence', () => ({
  loadAcvpRowEvidence: () => Promise.resolve(),
  evidenceForRowId: (id: string) =>
    (classesOf[id] ?? []).map((evidenceClass) => ({ evidenceClass })),
}))

vi.mock('@/components/shared/CaseEvidenceBadge', () => ({
  CaseEvidenceBadge: () => null,
  coverageMatrixUrl: () => '#',
}))

vi.mock('@/components/Playground/hsm/acvp/useAcvpSuite', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/components/Playground/hsm/acvp/useAcvpSuite')>()
  return {
    ...actual,
    useAcvpSuite: () => ({
      results,
      loading: false,
      progress: null,
      logs: [],
      logCopied: false,
      setLogCopied: vi.fn(),
      logCopyTimerRef: { current: null },
      selectedCategories: new Set(actual.DEFAULT_CATEGORY_IDS),
      setSelectedCategories: vi.fn(),
      runTests: vi.fn(),
      totalChecks: 4,
      passed: 2,
      failed: 1,
      skipped: 1,
      executed: 3,
    }),
  }
})

vi.mock('@/store/usePersonaStore', () => ({
  usePersonaStore: (sel: (s: { selectedPersona: string }) => unknown) =>
    sel({ selectedPersona: 'developer' }),
}))

import { AcvpSuiteWorkbench } from './AcvpSuiteWorkbench'

const shownIds = () =>
  within(screen.getByRole('table'))
    .getAllByTestId('acvp-result-row')
    .map((r) => r.getAttribute('data-row-id'))

describe('AcvpSuiteWorkbench — result filters', () => {
  it('shows every row and the run counts on the chips by default', async () => {
    render(<AcvpSuiteWorkbench />)
    expect(shownIds()).toEqual(['r1', 'r2', 'r3', 'r4'])
    expect(screen.getByTestId('acvp-filter-status-all')).toHaveTextContent('All 4')
    expect(screen.getByTestId('acvp-filter-status-pass')).toHaveTextContent('Pass 2')
    expect(screen.getByTestId('acvp-filter-status-fail')).toHaveTextContent('Fail 1')
    expect(screen.getByTestId('acvp-filter-status-skip')).toHaveTextContent('Skipped 1')
    expect(await screen.findByTestId('acvp-filter-class-published-standard-kat')).toHaveTextContent(
      'Standard KAT 2'
    )
    expect(screen.getByTestId('acvp-filter-class-none')).toHaveTextContent('No badge 1')
  })

  it('a status chip narrows the table, and "Show all rows" restores it', () => {
    render(<AcvpSuiteWorkbench />)
    fireEvent.click(screen.getByTestId('acvp-filter-status-fail'))
    expect(shownIds()).toEqual(['r3'])
    expect(screen.getByTestId('acvp-filter-status-fail')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/Showing 1 of 4 rows/)).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('acvp-filter-clear'))
    expect(shownIds()).toEqual(['r1', 'r2', 'r3', 'r4'])
  })

  it('an evidence-class chip combines with the status chip, and a second click clears it', async () => {
    render(<AcvpSuiteWorkbench />)
    const kat = await screen.findByTestId('acvp-filter-class-published-standard-kat')
    fireEvent.click(kat)
    expect(shownIds()).toEqual(['r2', 'r3'])
    fireEvent.click(screen.getByTestId('acvp-filter-status-pass'))
    expect(shownIds()).toEqual(['r2'])
    fireEvent.click(kat)
    expect(shownIds()).toEqual(['r1', 'r2'])
  })

  it('says so when nothing matches the filter', async () => {
    render(<AcvpSuiteWorkbench />)
    fireEvent.click(await screen.findByTestId('acvp-filter-class-none'))
    fireEvent.click(screen.getByTestId('acvp-filter-status-pass'))
    expect(screen.getByText('No rows match this filter.')).toBeInTheDocument()
  })
})
