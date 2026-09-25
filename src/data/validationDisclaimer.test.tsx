// SPDX-License-Identifier: GPL-3.0-only
/**
 * A-4 (ACVP remediation plan 2026-09-24): the §2.2 disclaimer is visible —
 * without opening anything — on the validation workbench and the Algorithms
 * validation view, and is carried by every exported artifact.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VALIDATION_DISCLAIMER } from './validationDisclaimer'

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
      selectedCategories: new Set(actual.ALL_CATEGORY_IDS),
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

import { KATView } from '@/components/Algorithms/KATView'
import { AcvpSuiteWorkbench } from '@/components/Playground/dev/pipeline/suites/AcvpSuiteWorkbench'
import {
  emitAcvpSuite,
  emitConformanceSuite,
} from '@/components/Playground/dev/pipeline/suites/suiteCodegen'
import { ALL_CATEGORY_IDS } from '@/components/Playground/hsm/acvp/useAcvpSuite'

describe('validation disclaimer (plan §2.2)', () => {
  it('is the plan text, verbatim', () => {
    expect(VALIDATION_DISCLAIMER).toBe(
      'PQC Today executes selected public reference vectors, standards tests, conformance cases, and implementation probes. A passing result is evidence only for the identified test, operation, parameters, implementation build, and target. It is not an ACVTS verdict, a CAVP/CMVP certificate, or proof of exhaustive conformance.'
    )
  })

  it('renders on the Algorithms validation (KAT) view without any interaction', () => {
    render(<KATView />)
    expect(screen.getByTestId('validation-disclaimer')).toHaveTextContent(VALIDATION_DISCLAIMER)
  })

  it('renders on the Cryptographic Validation Workbench without any interaction', () => {
    render(<AcvpSuiteWorkbench />)
    expect(screen.getByTestId('validation-disclaimer')).toHaveTextContent(VALIDATION_DISCLAIMER)
    // A-1: the suite heading no longer implies every row is ACVP-backed.
    expect(screen.queryByText(/ACVP Known-Answer Tests/)).not.toBeInTheDocument()
    expect(screen.getAllByText('Cryptographic Validation Workbench').length).toBeGreaterThan(0)
  })

  it('is printed by both generated suite scripts', () => {
    const acvp = emitAcvpSuite(new Set(ALL_CATEGORY_IDS), 'rust')
    expect(acvp).toContain(`print(${JSON.stringify(VALIDATION_DISCLAIMER)})`)
    const conf = emitConformanceSuite(
      { tierA: new Set(), tierB: false, coverage: false } as unknown as Parameters<
        typeof emitConformanceSuite
      >[0],
      'rust'
    )
    expect(conf).toContain(`print(${JSON.stringify(VALIDATION_DISCLAIMER)})`)
  })
})
