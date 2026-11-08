// SPDX-License-Identifier: AGPL-3.0-only
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RunScreen } from './EvidenceLabScreens'
import { IDLE_RUN } from './runState'
import { makeResultRecord } from '@/wasm/entropy90b/resultRecord'
const record = makeResultRecord({
  dataset: { sha256: '0'.repeat(64), bytes: 100, bitsPerSymbol: 1, provenance: 'synthetic' },
  program: 'ea_iid',
  argv: [],
  runtime: { kind: 'wasm', wasmSha256: '1'.repeat(64) },
  startedAt: '2026-11-04T00:00:00Z',
  elapsedMs: 1,
  exitCode: 0,
  pinnedUrandom: false,
  toolJsonText: JSON.stringify({ errorLevel: 0, sha256: '0'.repeat(64), testCases: [] }),
  toolJsonSha256: '2'.repeat(64),
})
function props(iidPassed: boolean | null): ComponentProps<typeof RunScreen> {
  return {
    labCase: {
      id: 'sample',
      group: 'synthetic',
      title: 'Sample',
      lesson: 'Sample display check',
      provenance: 'synthetic',
      bitsPerSymbol: 1,
      sequential: { kind: 'synthetic', d4Id: 'sample' },
    },
    track: 'iid',
    manifest: {
      schema: 'pqctoday.entropy.device-datasets/1',
      truthBoundary: 'Sample display test',
      recorderTool: {},
      sampleFormat: {},
      sizeBudgetBytes: 0,
      totalBytes: 0,
      datasets: [],
      comparisonOnly: [],
      notCollected: [],
      nativeReference: {
        tool: 'sample',
        commit: 'sample',
        platform: 'sample',
        parityRunAt: 'sample',
        parityReport: 'sample',
        wasmSha256: {},
        notes: [],
        bySha256: {},
      },
    },
    seqRun: { ...IDLE_RUN, status: 'done', record },
    restartRun: IDLE_RUN,
    seqRows: [],
    seqMin: null,
    seqH: null,
    seqError: null,
    seqReference: null,
    iidPassed,
    restartEval: null,
    restartReference: null,
    restartRows: [],
    referenceRestart: null,
    onRunSeq: vi.fn(),
    onCancelSeq: vi.fn(),
    onRunRestart: vi.fn(),
    onCancelRestart: vi.fn(),
    onExport: vi.fn(),
  }
}
describe('IID result display distinguishes unknown from rejection', () => {
  it.each([
    [true, 'did not reject the IID assumption'],
    [false, 'rejected the IID assumption'],
    [null, 'not assessed — IID result unavailable'],
  ] as const)('renders %s without borrowing another outcome', (passed, text) => {
    render(<RunScreen {...props(passed)} />)
    expect(screen.getByTestId('evl-iid-verdict')).toHaveTextContent(text)
    if (passed === null)
      expect(screen.getByTestId('evl-iid-verdict')).not.toHaveTextContent('rejected')
  })
  it('does not apply an IID verdict to the non-IID track', () => {
    render(<RunScreen {...props(null)} track="non-iid" />)
    expect(screen.queryByTestId('evl-iid-verdict')).not.toBeInTheDocument()
  })
})
