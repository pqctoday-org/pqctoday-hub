// SPDX-License-Identifier: AGPL-3.0-only
//
// The workbench counts "test groups" in its selection panel but streams one row per "test
// case". The page must say what each word means, on the workbench itself.
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: false,
    moduleRef: { current: null },
    hSessionRef: { current: 0 },
    initialize: vi.fn(),
    log: [],
    clearLog: vi.fn(),
    keys: [],
    removeKey: vi.fn(),
    clearKeys: vi.fn(),
  }),
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
      results: [],
      loading: false,
      progress: null,
      logs: [],
      logCopied: false,
      setLogCopied: vi.fn(),
      logCopyTimerRef: { current: null },
      selectedCategories: new Set(actual.DEFAULT_CATEGORY_IDS),
      setSelectedCategories: vi.fn(),
      runTests: vi.fn(),
      totalChecks: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      executed: 0,
    }),
  }
})

vi.mock('@/store/usePersonaStore', () => ({
  usePersonaStore: (sel: (s: { selectedPersona: string }) => unknown) =>
    sel({ selectedPersona: 'developer' }),
}))

import { AcvpSuiteWorkbench } from './AcvpSuiteWorkbench'

describe('AcvpSuiteWorkbench — test groups vs test cases', () => {
  it('explains both words next to the group count, without any interaction', () => {
    render(<AcvpSuiteWorkbench />)
    const note = screen.getByTestId('acvp-groups-explained')
    expect(note).toHaveTextContent(/Test group: a block of related checks/)
    expect(note).toHaveTextContent(/Test case: one input and its expected result/)
    expect(note).toHaveTextContent(/Each row in the results table is one test case/)
  })

  it('opens with ML-KEM only: 5 of 71 groups', () => {
    render(<AcvpSuiteWorkbench />)
    expect(screen.getByText('Test groups')).toBeInTheDocument()
    expect(screen.getByText('5/71')).toBeInTheDocument()
    expect(screen.getByText('1/8')).toBeInTheDocument()
  })
})
