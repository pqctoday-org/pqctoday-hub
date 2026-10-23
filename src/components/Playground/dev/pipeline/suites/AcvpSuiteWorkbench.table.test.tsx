// SPDX-License-Identifier: AGPL-3.0-only
//
// The results table keeps six columns in a fixed order: e2e specs read the Details cell as
// the 5th cell, and its `title` carries the full text while the cell itself truncates. The
// category label wraps (instead of holding one line) so the six columns fit the canvas.
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { TestResult } from '@/components/Playground/hsm/acvp/useAcvpSuite'

const results: TestResult[] = [
  {
    id: 'wycheproof_pqc-1',
    algorithm: 'ML-KEM-768 (Rust)',
    testCase: 'Decapsulate · Wycheproof case 1',
    referenceUrl: 'https://example.test/1',
    status: 'pass',
    details: 'SS matches vector ✓: 3a7f…long details that would stretch the column',
    category: 'wycheproof_pqc',
  },
]

vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({ isReady: false, moduleRef: { current: null }, hSessionRef: { current: 0 } }),
}))

vi.mock('@/components/Playground/hsm/HsmContext', () => ({
  useHsmContext: () => ({ engineMode: 'rust' }),
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
      totalChecks: 1,
      passed: 1,
      failed: 0,
      skipped: 0,
      executed: 1,
    }),
  }
})

vi.mock('@/store/usePersonaStore', () => ({
  usePersonaStore: (sel: (s: { selectedPersona: string }) => unknown) =>
    sel({ selectedPersona: 'developer' }),
}))

import { AcvpSuiteWorkbench } from './AcvpSuiteWorkbench'

describe('AcvpSuiteWorkbench — results table', () => {
  it('keeps the six columns in order, with Details as the 5th cell', () => {
    render(<AcvpSuiteWorkbench />)
    const table = screen.getByRole('table')
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((h) => h.textContent)
    ).toEqual(['Category', 'Algorithm', 'Test Case', 'Status', 'Details', 'Ref'])
    const row = within(table).getByTestId('acvp-result-row')
    const cells = within(row).getAllByRole('cell')
    expect(cells).toHaveLength(6)
    expect(cells[4]).toHaveAttribute('title', results[0].details)
    expect(cells[4]).toHaveClass('truncate')
  })

  it('lets the category label wrap instead of holding one line', () => {
    render(<AcvpSuiteWorkbench />)
    const row = within(screen.getByRole('table')).getByTestId('acvp-result-row')
    const category = within(row).getAllByRole('cell')[0]
    expect(category).toHaveTextContent('Wycheproof ML-KEM / ML-DSA')
    expect(category).not.toHaveClass('whitespace-nowrap')
  })
})
