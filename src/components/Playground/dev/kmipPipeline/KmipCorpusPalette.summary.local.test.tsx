// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useKmipCorpus } from '../../kmip/useKmipCorpus'
import {
  KmipCorpusDisclosure,
  KmipCorpusPaletteList,
  KmipCorpusDetail,
  KmipCorpusSummaryCard,
} from './KmipCorpusPalette'
import type { TestStatus } from '@/wasm/kmip/corpus/runner'

const mocked = vi.hoisted(() => ({ run: vi.fn() }))
vi.mock('@/wasm/kmip/corpus/runner', () => ({ runCorpusTest: mocked.run }))
vi.mock('@/wasm/kmip/ttlv/codepointTable', () => ({
  // Readiness token only: no wire decoding is performed by this UI fixture.
  getCodepointTable: async () => ({}),
}))
const examples = [
  { name: 'Passed sample one', status: 'PASS', detail: 'Observed pass one', tier: 'mandatory' },
  { name: 'Passed sample two', status: 'PASS', detail: 'Observed pass two', tier: 'pqc' },
  {
    name: 'Mismatch sample',
    status: 'FAIL',
    detail: 'Controlled comparison mismatch',
    tier: 'mandatory',
  },
  { name: 'Error sample', status: 'ERROR', detail: 'Controlled replay error', tier: 'pqc' },
  {
    name: 'Deprecated sample',
    status: 'SKIP_DEPRECATED',
    detail: 'Controlled deprecated-algorithm reason',
    tier: 'mandatory',
  },
  {
    name: 'Unsupported sample',
    status: 'SKIP_OP',
    detail: 'Controlled unsupported-operation reason',
    tier: 'mandatory',
  },
  {
    name: 'Unparseable sample',
    status: 'SKIP_PARSE',
    detail: 'Controlled malformed-XML reason',
    tier: 'mandatory',
  },
  {
    name: 'Transport sample',
    status: 'SKIP_TRANSPORT',
    detail: 'Controlled native-transport reason',
    tier: 'mandatory',
  },
] as const
const manifest = {
  count: 8,
  tests: examples.map((example) => ({
    name: example.name,
    file: `fictional/${example.name}.xml`,
    tier: example.tier,
    category: 'Authored sample outcomes',
  })),
}
let statuses: Map<string, TestStatus>
let details: Map<string, string>
beforeEach(() => {
  statuses = new Map(examples.map((example) => [example.name, example.status]))
  details = new Map(examples.map((example) => [example.name, example.detail]))
  mocked.run.mockReset().mockImplementation(async (name: string) => ({
    name,
    status: statuses.get(name),
    detail: details.get(name),
    opsUsed: [],
    pairs: [],
  }))
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string) => {
      if (input === '/kmip-corpus/manifest.json') return { ok: true, json: async () => manifest }
      if (manifest.tests.some((entry) => input === `/kmip-corpus/${entry.file}`))
        return { ok: true, text: async () => '<controlled-ui-input/>' }
      throw new Error(`Unexpected fixture request: ${input}`)
    })
  )
})
afterEach(() => vi.unstubAllGlobals())

function CorpusView() {
  // Real hook and renderers; only fetch and replay outcomes are controlled.
  const corpus = useKmipCorpus({ enabled: true })
  return (
    <>
      <KmipCorpusDisclosure corpus={corpus} />
      <KmipCorpusSummaryCard corpus={corpus} />
      <KmipCorpusPaletteList corpus={corpus} />
      <KmipCorpusDetail corpus={corpus} field="responseTree" emptyHint="Choose a sample" />
    </>
  )
}

async function runEach() {
  for (const example of examples) {
    fireEvent.click(await screen.findByRole('button', { name: example.name }))
    await screen.findByText(details.get(example.name)!, { selector: 'span' })
  }
}

describe('corpus rendered supported-subset outcome accounting', () => {
  it('renders empty and mixed results, preserves skip reasons, and recomputes a rerun without double counting', async () => {
    render(<CorpusView />)
    expect(screen.getByText('none yet')).toBeInTheDocument()
    expect(screen.getByText(/skips, not passes/)).toBeInTheDocument()
    await runEach()
    expect(screen.getByText('2 passed, 2 failed, 4 skipped (8 total)')).toBeInTheDocument()
    expect(mocked.run).toHaveBeenCalledTimes(8)
    for (const reason of [
      'SKIP (deprecated algorithm)',
      'SKIP (op not implemented)',
      'SKIP (XML malformed)',
      'SKIP (native-transport-only feature)',
    ])
      expect(screen.getAllByText(reason).length).toBeGreaterThan(0)

    fireEvent.click(
      screen.getByRole('button', { name: (name) => name.endsWith('Passed sample one') })
    )
    await screen.findByText('Observed pass one', { selector: 'span' })
    expect(mocked.run).toHaveBeenCalledTimes(8)
    statuses.set('Passed sample one', 'SKIP_OP')
    details.set('Passed sample one', 'Changed supported-scope reason')
    fireEvent.click(screen.getByRole('button', { name: 'Run' }))
    await screen.findByText('1 passed, 2 failed, 5 skipped (8 total)')
    expect(mocked.run).toHaveBeenCalledTimes(9)
    expect(
      screen.getByText('Changed supported-scope reason', { selector: 'span' })
    ).toBeInTheDocument()
  })

  it('shows all-skipped outcomes as zero passes and eight skips despite zero failures', async () => {
    for (const example of examples) statuses.set(example.name, 'SKIP_OP')
    render(<CorpusView />)
    await runEach()
    expect(screen.getByText('0 passed, 0 failed, 8 skipped (8 total)')).toBeInTheDocument()
    expect(screen.queryByText('PASS')).not.toBeInTheDocument()
    expect(
      screen.getByText(/Replay results do not establish product certification/)
    ).toBeInTheDocument()
  })
})
