// SPDX-License-Identifier: AGPL-3.0-only
//
// A failed row can be a wrong answer (the engine accepted an invalid key, or refused a valid
// one) or an operational error (the engine call failed for another reason). The per-category
// counts say how many of the failures are errors, so a learner can tell them apart.
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Which layout the page renders: the wide tree (default) or the compact runner.
const viewport = vi.hoisted(() => ({ compact: false }))

vi.mock('@/hooks/useIsBelowLgViewport', () => ({
  useIsBelowLgViewport: () => viewport.compact,
}))

vi.mock('@/components/Playground/dev/monacoSelfHost', () => ({
  installMonacoSelfHost: vi.fn().mockResolvedValue(undefined),
}))

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

const fixture = vi.hoisted(() => ({ results: [] as unknown[] }))

vi.mock('@/components/Playground/hsm/acvp/useAcvpSuite', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/components/Playground/hsm/acvp/useAcvpSuite')>()
  return {
    ...actual,
    useAcvpSuite: () => ({
      results: fixture.results,
      loading: false,
      progress: null,
      logs: [],
      logCopied: false,
      setLogCopied: vi.fn(),
      logCopyTimerRef: { current: null },
      selectedCategories: new Set(actual.DEFAULT_CATEGORY_IDS),
      setSelectedCategories: vi.fn(),
      runTests: vi.fn(),
      totalChecks: fixture.results.length,
      passed: 0,
      failed: fixture.results.length,
      skipped: 0,
      executed: fixture.results.length,
    }),
  }
})

vi.mock('@/store/usePersonaStore', () => ({
  usePersonaStore: (sel: (s: { selectedPersona: string }) => unknown) =>
    sel({ selectedPersona: 'developer' }),
}))

import { AcvpSuiteWorkbench } from './AcvpSuiteWorkbench'

/** One ML-KEM row that failed; `error` marks an operational error rather than a wrong answer. */
const failedRow = (n: number, error: boolean) => ({
  id: `mlkem-keycheck-ek-ML-KEM-768-tg8-tc${n}-C++`,
  algorithm: 'ML-KEM-768 (C++)',
  testCase: `Encapsulation-key check · case ${n}`,
  referenceUrl: 'https://example.invalid/acvp',
  status: 'fail',
  details: error ? 'ERROR: C_CreateObject(ek) returned CKR_DEVICE_ERROR' : 'ACCEPTED a key',
  category: 'ml_kem',
  caseMeta: {
    origin: 'nist-acvp-server',
    upstreamOperation: 'encapsulationKeyCheck',
    localOperation: 'encapsulation',
    parameterSet: 'ML-KEM-768',
    expected: 'rejected',
    source: { repo: 'x', commit: 'x', path: 'x', sha256: 'x' },
    observed: error ? 'C_CreateObject(ek) returned CKR_DEVICE_ERROR' : 'C_CreateObject → CKR_OK',
    ...(error ? { error: true } : {}),
  },
})

describe('AcvpSuiteWorkbench — operational errors are counted apart from wrong answers', () => {
  describe('wide layout: the category row', () => {
    it('says how many of a category’s failures are errors', () => {
      viewport.compact = false
      fixture.results = [
        failedRow(1, false),
        failedRow(2, false),
        failedRow(3, false),
        failedRow(4, true),
        failedRow(5, true),
      ]
      render(<AcvpSuiteWorkbench />)
      expect(screen.getByText(/5 fail \(2 errors\)/)).toBeInTheDocument()
    })

    it('uses the singular for one error', () => {
      viewport.compact = false
      fixture.results = [failedRow(1, false), failedRow(2, true)]
      render(<AcvpSuiteWorkbench />)
      expect(screen.getByText(/2 fail \(1 error\)/)).toBeInTheDocument()
    })

    it('shows no error count when no failure is an error', () => {
      viewport.compact = false
      fixture.results = [failedRow(1, false), failedRow(2, false)]
      render(<AcvpSuiteWorkbench />)
      expect(screen.getAllByText(/2 fail/).length).toBeGreaterThan(0)
      expect(screen.queryByText(/error/)).toBeNull()
    })
  })

  describe('compact layout: the group summary', () => {
    it('says how many of a group’s failed rows are errors', () => {
      viewport.compact = true
      fixture.results = [
        failedRow(1, false),
        failedRow(2, false),
        failedRow(3, false),
        failedRow(4, true),
        failedRow(5, true),
      ]
      render(<AcvpSuiteWorkbench />)
      expect(screen.getByText(/5 failed \(2 errors\)/)).toBeInTheDocument()
    })
  })
})
