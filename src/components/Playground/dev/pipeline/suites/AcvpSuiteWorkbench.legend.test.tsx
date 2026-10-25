// SPDX-License-Identifier: AGPL-3.0-only
//
// The certification view's evidence legend says what a row with no badge means. One passing
// ML-KEM boundary probe is left unbadged on purpose (the registry does not register it, because
// on the Rust engine it drives no mechanism operation), so the sentence must cover that case.
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
    sel({ selectedPersona: 'cert-engineer' }),
}))

import { AcvpSuiteWorkbench } from './AcvpSuiteWorkbench'

describe('AcvpSuiteWorkbench — evidence legend, certification view', () => {
  it('says unbadged rows are skips, errors or checks that exercise no mechanism on this engine', () => {
    render(<AcvpSuiteWorkbench />)
    const legend = screen.getByTestId('acvp-evidence-legend')
    const intro = legend.previousElementSibling
    expect(intro).toHaveTextContent(
      'Rows with no badge are skips, errors, or checks that exercise no mechanism on this engine (for example a rejected key import); they are not evidence for a vector.'
    )
    expect(intro).not.toHaveTextContent('(skips, errors) are evidence of nothing')
  })
})
