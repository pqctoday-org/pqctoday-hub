// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render tests for the Entropy Evidence Lab step. The WASM estimator is mocked
 * (repo convention): the mock returns the PINNED native NIST tool result for
 * the exact bytes it receives, looked up by SHA-256 in the shipped manifest,
 * so the UI is exercised on real reference output without running WASM.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { makeResultRecord, type NistToolJson } from '@/wasm/entropy90b/resultRecord'
import type { RunRequest } from '@/wasm/entropy90b/protocol'
import { aptCutoff } from '../../utils/entropyTests'
import type { DeviceManifest } from './evidenceLabData'
import type { Flat } from './evidenceLabLogic'

const runMock = vi.fn()
vi.mock('@/wasm/entropy90b/estimatorClient', () => ({
  runSp80090b: (...args: unknown[]) => runMock(...args),
}))

import { EntropyEvidenceLab } from './EntropyEvidenceLab'

const ROOT = process.cwd()
const manifestText = fs.readFileSync(
  path.join(ROOT, 'public/data/entropy/device-datasets-manifest.json'),
  'utf8'
)
const manifest = JSON.parse(manifestText) as DeviceManifest

function toolJsonFrom(flat: Flat, sha256: string): NistToolJson {
  const cases = new Map<string, Record<string, unknown> & { testCaseDesc: string }>()
  for (const [k, v] of Object.entries(flat)) {
    if (k === 'error') continue
    const i = k.lastIndexOf(' / ')
    const desc = k.slice(0, i)
    if (!cases.has(desc)) cases.set(desc, { testCaseDesc: desc })
    cases.get(desc)![k.slice(i + 3)] = v
  }
  return {
    errorLevel: flat.error ? -1 : 0,
    errorMessage: flat.error ? String(flat.error) : undefined,
    sha256,
    testCases: [...cases.values()],
  }
}

/** Stand-in for the worker: the pinned native result for these bytes. */
async function fakeRun(
  req: Omit<RunRequest, 'type'>,
  opts: { onProgress?: (s: string, l: string) => void }
) {
  const sha = createHash('sha256').update(req.data).digest('hex')
  const ref = manifest.nativeReference.bySha256[sha]
  if (!ref) throw new Error(`no pinned result for ${sha}`)
  const values =
    req.tool === 'restart'
      ? ref.restart!.values
      : req.tool === 'iid'
        ? { ...ref.iid!.values, ' / passedIidPermutationTests': false }
        : ref.nonIid!.values
  opts.onProgress?.('Literal Most Common Value', 'Literal MCV Estimate: …')
  const json = toolJsonFrom(values, sha)
  const text = JSON.stringify(json)
  return {
    record: makeResultRecord({
      dataset: {
        sha256: sha,
        bytes: req.data.length,
        bitsPerSymbol: req.bitsPerSymbol,
        provenance: req.provenance,
      },
      program: `ea_${req.tool}`,
      argv: ['-v', '-v', '-o', '/work/result.json', '/work/input.bin', String(req.bitsPerSymbol)],
      runtime: {
        kind: 'wasm',
        wasmSha256: 'd0c2a5faca24319c97ac3dafb3de3a1c4469647f8e5047cce14f5eabf92c78cc',
      },
      startedAt: '2026-09-25T00:00:00.000Z',
      elapsedMs: 1234,
      exitCode: json.errorLevel === 0 ? 0 : 255,
      pinnedUrandom: false,
      toolJsonText: text,
      toolJsonSha256: createHash('sha256').update(text).digest('hex'),
    }),
    stdout: [],
  }
}

function fakeResponse(body: Buffer | string) {
  const buf = typeof body === 'string' ? Buffer.from(body) : body
  return {
    ok: true,
    status: 200,
    json: async () => JSON.parse(buf.toString('utf8')),
    arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
  }
}

beforeEach(() => {
  runMock.mockReset()
  runMock.mockImplementation(fakeRun)
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url === '/data/entropy/device-datasets-manifest.json') return fakeResponse(manifestText)
      if (url.startsWith('/data/entropy/'))
        return fakeResponse(fs.readFileSync(path.join(ROOT, 'public', url)))
      return { ok: false, status: 404 }
    })
  )
})
afterEach(() => vi.unstubAllGlobals())

const next = () => fireEvent.click(screen.getByTestId('evl-next'))

async function openRunScreen(caseId: string, track: 'non-iid' | 'iid' = 'non-iid') {
  render(<EntropyEvidenceLab />)
  fireEvent.click(await screen.findByTestId(`evl-case-${caseId}`))
  next()
  await screen.findByText(/matches the manifest|no pinned hash/, {}, { timeout: 10000 })
  next()
  fireEvent.click(screen.getByTestId(`evl-track-${track}`))
  next()
}

function goToStep(n: number) {
  const nav = screen.getByRole('navigation', { name: 'Evidence lab steps' })
  fireEvent.click(within(nav).getByRole('button', { name: new RegExp(`^${n}\\. `) }))
}

describe('EntropyEvidenceLab', () => {
  it('shows a "what this proves / does not prove" panel on every screen', async () => {
    await openRunScreen('kv260-idle-sequential')
    for (let n = 1; n <= 6; n++) {
      goToStep(n)
      const panel = screen.getByTestId('evidence-proves-panel')
      expect(panel).toHaveTextContent('What this proves')
      expect(panel).toHaveTextContent('What this does not prove')
    }
  })

  it('contrast data "passes" but never becomes a noise-source claim', async () => {
    await openRunScreen('imx95-contrast-getrandom')
    fireEvent.click(screen.getByTestId('evl-seq-run'))
    const result = await screen.findByTestId('evl-seq-result', {}, { timeout: 10000 })
    expect(result).toHaveTextContent('7.1570')
    expect(result).toHaveTextContent('Matches native reference')
    next()
    expect(
      screen.getByText(/Cutoffs\s+derived from an estimate of conditioned output/)
    ).toBeInTheDocument()
    next()
    fireEvent.click(screen.getByTestId('evl-verdict-estimate-for-dataset'))
    expect(screen.getByTestId('evl-verdict-check')).toHaveTextContent(
      /claims more than the evidence/
    )
    expect(screen.getByTestId('evl-allowed-verdict')).toHaveTextContent(
      'Not evidence about a noise source'
    )
  })

  it('real device data ends in "insufficient evidence" until the restart test passes', async () => {
    await openRunScreen('kv260-idle-sequential')
    fireEvent.click(screen.getByTestId('evl-seq-run'))
    const result = await screen.findByTestId('evl-seq-result', {}, { timeout: 10000 })
    expect(screen.getByTestId('evl-seq-min')).toHaveTextContent('2.8196')
    expect(screen.getByTestId('evl-seq-min')).toHaveTextContent('Compression Test')
    expect(screen.getByTestId('evl-seq-min')).toHaveTextContent("Equals the tool's own H_assessed")
    expect(result).toHaveTextContent('Matches native reference')
    expect(screen.getByTestId('evl-seq-record')).toHaveTextContent('87c104d0ed4c')

    goToStep(6)
    fireEvent.click(screen.getByTestId('evl-verdict-insufficient-evidence'))
    expect(screen.getByTestId('evl-allowed-verdict')).toHaveTextContent('Insufficient evidence')
    expect(screen.getByTestId('evl-verdict-check')).toHaveTextContent('matches what the evidence')

    goToStep(4)
    fireEvent.click(screen.getByTestId('evl-restart-run'))
    const restart = await screen.findByTestId('evl-restart-result', {}, { timeout: 10000 })
    expect(restart).toHaveTextContent('Restart tests passed')
    expect(restart).toHaveTextContent('Matches native reference')
    const restartCall = runMock.mock.calls.find(([r]) => (r as RunRequest).tool === 'restart')!
    expect((restartCall[0] as RunRequest).hI).toBe(2.819614073435354)
    expect((restartCall[0] as RunRequest).trackFlag).toBe('-n')

    goToStep(5)
    expect(screen.getByTestId('evl-rct')).toHaveTextContent('C = 9')
    expect(screen.getByTestId('evl-apt')).toHaveTextContent(
      `C = ${aptCutoff(512, 2.819614073435354)}`
    )

    goToStep(6)
    fireEvent.click(screen.getByTestId('evl-verdict-estimate-for-dataset'))
    expect(screen.getByTestId('evl-allowed-verdict')).toHaveTextContent(
      'Estimator output supports an estimate for this dataset — 2.8196'
    )
  })

  it('a Mac dataset without a shipped restart matrix stays at "insufficient evidence"', async () => {
    await openRunScreen('mac-native-baseline-sequential')
    expect(screen.getByTestId('evl-no-restart')).toHaveTextContent('restart passed')
    fireEvent.click(screen.getByTestId('evl-seq-run'))
    await screen.findByTestId('evl-seq-result', {}, { timeout: 10000 })
    goToStep(6)
    fireEvent.click(screen.getByTestId('evl-verdict-estimate-for-dataset'))
    expect(screen.getByTestId('evl-allowed-verdict')).toHaveTextContent('Insufficient evidence')
  })

  it('the IID track on jitter data cannot conclude an estimate', async () => {
    await openRunScreen('kv260-idle-sequential', 'iid')
    expect(screen.queryByTestId('evl-seq-result')).toBeNull()
    // No IID reference is pinned for device data: running is still possible,
    // and the conclusion is insufficient evidence regardless of the outcome.
    goToStep(6)
    fireEvent.click(screen.getByTestId('evl-verdict-insufficient-evidence'))
    expect(screen.getByTestId('evl-allowed-verdict')).toHaveTextContent('Insufficient evidence')
  })

  it('synthetic stuck source: the tool awards no entropy', async () => {
    await openRunScreen('syn-stuck')
    fireEvent.click(screen.getByTestId('evl-seq-run'))
    const result = await screen.findByTestId('evl-seq-result', {}, { timeout: 10000 })
    expect(result).toHaveTextContent('No entropy awarded')
    expect(result).toHaveTextContent('Symbol alphabet consists of 1 symbol')
    goToStep(5)
    expect(screen.getByText(/No entropy estimate is available/)).toBeInTheDocument()
    goToStep(6)
    fireEvent.click(screen.getByTestId('evl-verdict-no-entropy-awarded'))
    expect(screen.getByTestId('evl-verdict-check')).toHaveTextContent('matches what the evidence')
  })
})
