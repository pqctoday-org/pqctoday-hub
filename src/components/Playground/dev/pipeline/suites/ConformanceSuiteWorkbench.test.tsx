// WS-G G-4 + G-6: the conformance workbench must (1) show the engines' native
// suite counts only as read from native-conformance.generated.json — with
// engine commit, report date, staleness and "not executed in this browser" —
// and (2) label the OASIS-published cases, the generated profile-condition
// probes and the product mechanism probes separately, with counts taken from
// the case/probe definitions, never summarizing all of them as OASIS cases.
import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePersonaStore } from '@/store/usePersonaStore'
import generatedJson from '@/data/validation/native-conformance.generated.json'
import {
  formatCounts,
  shortCommit,
  type NativeConformanceFile,
} from '@/data/validation/nativeConformance'
import { profileConditionProbeCounts } from '@/wasm/pkcs11ConformanceRunner/profileConditions'
import { mechanismProbes } from '@/wasm/pkcs11ConformanceRunner/mechanismCoverageProbes'
import { TIER_A_CASES, type RunnerRow } from '../../../hsm/conformance/usePkcs11Conformance'
import { ConformanceSuiteWorkbench } from './ConformanceSuiteWorkbench'

vi.mock('@monaco-editor/react', () => ({ default: () => null }))
vi.mock('../../monacoSelfHost', () => ({ installMonacoSelfHost: () => Promise.resolve() }))
vi.mock('@/services/python/pyRuntime', () => ({ bootPyRuntime: vi.fn(), runPython: vi.fn() }))

const ROWS: RunnerRow[] = [
  {
    id: 'a',
    engine: 'C++',
    tier: 'A',
    name: 'BL-M-1-32',
    citation: '§5.1.1',
    status: 'pass',
    detail: 'ok',
  },
  {
    id: 'b',
    engine: 'C++',
    tier: 'B',
    name: 'C_GetInfo',
    citation: '§5.1 5.a',
    status: 'pass',
    detail: 'ok',
  },
  {
    id: 'c',
    engine: 'C++',
    tier: 'B',
    name: 'C_Login',
    citation: '§5.3',
    status: 'fail',
    detail: 'rv',
  },
  {
    id: 'd',
    engine: 'C++',
    tier: 'Coverage',
    name: 'CKM_RSA_PKCS',
    citation: '§6.1',
    status: 'pass',
    detail: 'ok',
  },
  {
    id: 'e',
    engine: 'C++',
    tier: 'ErrorPath',
    name: 'CKM_AES_CBC · encrypt · operation-active',
    citation: '§5.8.1',
    status: 'fail',
    detail: 'second C_EncryptInit → CKR_OK',
  },
]

vi.mock('../../../hsm/conformance/usePkcs11Conformance', async (importActual) => {
  const actual =
    await importActual<typeof import('../../../hsm/conformance/usePkcs11Conformance')>()
  return {
    ...actual,
    usePkcs11Conformance: () => ({
      rows: ROWS,
      loading: false,
      ran: true,
      selection: actual.FULL_SELECTION(),
      toggleCase: vi.fn(),
      setTierB: vi.fn(),
      setCoverage: vi.fn(),
      setErrorPaths: vi.fn(),
      run: vi.fn(),
      pass: 3,
      fail: 2,
      notClaimed: 0,
      reportText: () => '',
      engineMode: 'cpp',
    }),
  }
})

const data = generatedJson as unknown as NativeConformanceFile

describe('ConformanceSuiteWorkbench', () => {
  beforeEach(() => usePersonaStore.setState({ selectedPersona: 'developer' }))

  it('shows each native suite from the generated file with commit, date, staleness and the not-in-browser statement', async () => {
    render(<ConformanceSuiteWorkbench />)
    const panel = await screen.findByTestId('native-conformance-evidence')
    expect(panel).toHaveTextContent('not executed in this browser')
    expect(panel).toHaveTextContent(shortCommit(data.hsm.pinnedCommit))

    for (const s of data.suites) {
      const block = within(panel).getByTestId(`native-suite-${s.id}`)
      expect(block).toHaveTextContent(s.name)
      expect(block).toHaveTextContent(/not executed in this browser/i)
      if (!s.report) {
        expect(block).toHaveTextContent(/No committed report/)
        continue
      }
      const r = s.report
      expect(within(block).getByTestId('native-suite-counts')).toHaveTextContent(
        `${formatCounts(r.counts)} · ${r.counts.total} cases`
      )
      expect(block).toHaveTextContent(shortCommit(r.engineCommit))
      expect(block).toHaveTextContent(r.reportDate)
      expect(block).toHaveTextContent(String(r.staleness.commitsFromEngineToPinnedMain))
      if (r.wasm && !r.wasm.engineCommitEqualsBundleCommit)
        expect(block).toHaveTextContent(shortCommit(r.wasm.bundleHsmCommit))
    }
    // The stale hand-written suite sizes are gone.
    expect(document.body).not.toHaveTextContent(/815-row|976-check|49-scenario/)
  })

  it('labels OASIS cases, generated probes and product probes separately, with counted totals', async () => {
    render(<ConformanceSuiteWorkbench />)
    await screen.findByTestId('native-conformance-evidence')
    const tierB = Object.values(profileConditionProbeCounts()).reduce((a, b) => a + b, 0)
    const mech = mechanismProbes().length

    const scope = screen.getByTestId('pkcs11-conformance-scope')
    expect(scope).toHaveTextContent(`${TIER_A_CASES.length} mandatory test cases OASIS published`)
    expect(scope).toHaveTextContent(`up to ${tierB} probes PQC Today generated`)
    expect(scope).toHaveTextContent('not OASIS test cases')
    expect(scope).toHaveTextContent(`${mech} product-authored mechanism probes`)
    expect(scope).not.toHaveTextContent(/\b(46|58) OASIS/)

    // Results are tallied per kind, never as one OASIS total.
    const breakdown = screen.getByTestId('pkcs11-conformance-tier-breakdown')
    expect(breakdown).toHaveTextContent('OASIS published test cases: 1/1 pass')
    expect(breakdown).toHaveTextContent('Generated profile-condition probes: 1/2 pass, 1 fail')
    expect(breakdown).toHaveTextContent('Product mechanism probes: 1/1 pass')
    expect(breakdown).toHaveTextContent('Error-path probes: 0/1 pass, 1 fail')

    const badges = screen.getAllByTestId('pkcs11-conformance-row').map((r) => r.textContent ?? '')
    expect(badges[0]).toMatch(/OASIS case/)
    expect(badges[1]).toMatch(/Generated probe/)
    expect(badges[3]).toMatch(/Product probe/)
    expect(badges[4]).toMatch(/Error-path probe/)
    expect(scope).toHaveTextContent('error-path probes')
  })
})
