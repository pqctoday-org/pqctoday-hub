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
import {
  TIER_A_CASES,
  type RunnerRow,
  type V33Row,
} from '../../../hsm/conformance/usePkcs11Conformance'
import {
  V33_DRAFT_GROUP_LABEL,
  summarizeV33,
} from '@/wasm/pkcs11ConformanceRunner/v33DraftFeatures'
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

const V33_ROWS: V33Row[] = [
  {
    id: 'v33.mu.gen-from-key-Rust',
    engine: 'Rust',
    section: 'external-mu',
    title: 'µ from a key handle',
    status: 'pass',
    observed: 'µ ab12… = independent µ',
    expected: 'equals µ computed independently',
  },
  {
    id: 'v33.kat.kem.CKP_COMP_KEM_MLKEM768_X25519-Rust',
    engine: 'Rust',
    section: 'kat',
    title: 'Decapsulate the published ciphertext · id-MLKEM768-X25519-SHA3-256',
    status: 'not-in-engine',
    observed: 'CKM_COMP_KEM not advertised',
    expected: 'secret = published k',
    source: 'lamps-wg/draft-composite-kem @ d77e754 (2026-02-21)',
  },
  {
    id: 'v33.kat.kem.CKP_COMP_KEM_MLKEM768_ECDH_BRAINPOOLP256R1-Rust',
    engine: 'Rust',
    section: 'kat',
    title: 'brainpool',
    status: 'not-supported',
    observed: 'C_CreateObject → CKR_PARAMETER_SET_NOT_SUPPORTED',
    expected: 'secret = published k',
  },
  {
    id: 'v33.errpath.x-Rust',
    engine: 'Rust',
    section: 'error-path',
    title: 'CKM_COMP_SIG_EXTERNAL_HASH with a pre-hash of the wrong length',
    status: 'pending-engine',
    observed: 'C_Sign → CKR_DATA_LEN_RANGE (code not asserted until the engine update)',
    expected: 'CKR_DATA_LEN_RANGE',
    citation: 'comp_sig.md',
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
      setV33Draft: vi.fn(),
      v33Rows: V33_ROWS,
      v33RowsRef: { current: V33_ROWS },
      v33Summary: summarizeV33(V33_ROWS),
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

  it('shows the v3.3 draft group separately: verbatim label, own summary, no draft status drawn as a failure', async () => {
    render(<ConformanceSuiteWorkbench />)
    await screen.findByTestId('native-conformance-evidence')
    expect(screen.getByTestId('pkcs11-conformance-v33-label')).toHaveTextContent(
      V33_DRAFT_GROUP_LABEL
    )
    expect(screen.getByTestId('pkcs11-conformance-v33-summary')).toHaveTextContent(
      '1 pass, 0 fail, 1 not in this engine yet, 1 not supported, 1 pending engine (of 4 rows)'
    )
    // The v3.2 summary and tier tallies are untouched by the 4 draft rows.
    expect(screen.getByTestId('pkcs11-conformance-summary')).toHaveTextContent(
      `3/${ROWS.length} rows conformant`
    )
    expect(screen.getAllByTestId('pkcs11-conformance-row')).toHaveLength(ROWS.length)
    const v33 = screen.getAllByTestId('pkcs11-conformance-v33-row')
    expect(v33).toHaveLength(4)
    for (const row of v33) {
      if (row.getAttribute('data-status') === 'fail') continue
      expect(row.querySelector('.text-destructive')).toBeNull()
    }
    expect(v33[1]).toHaveTextContent('not in this engine yet')
    expect(v33[1]).toHaveTextContent('lamps-wg/draft-composite-kem @ d77e754')
    expect(v33[3]).toHaveTextContent('Cited: comp_sig.md')
    expect(screen.getByRole('checkbox', { name: 'v3.3 draft features' })).toBeInTheDocument()
  })
})
