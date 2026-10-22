// SPDX-License-Identifier: AGPL-3.0-only
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
import { loadData, type DeviceManifest } from './evidenceLabData'
import type { Flat } from './evidenceLabLogic'

const runMock = vi.fn()
vi.mock('@/wasm/entropy90b/estimatorClient', () => ({
  runSp80090b: (...args: unknown[]) => runMock(...args),
}))

const downloads: { blob: Blob; name: string }[] = []
vi.mock('@/services/exportBundle', async (orig) => ({
  ...(await orig<typeof import('@/services/exportBundle')>()),
  downloadBlob: (blob: Blob, name: string) => downloads.push({ blob, name }),
}))

import { EntropyEvidenceLab } from './EntropyEvidenceLab'
import { ComparisonRows, CutoffsScreen, EsvReference } from './EvidenceLabScreens'
import { RestartTestExplanation, SequentialTestExplanation } from './TestExplanations'

it('shows certificate reuse status, distinct environments and the sourced naming caveat', () => {
  render(<EsvReference />)
  for (const [certificate, count] of [
    ['E19', 5],
    ['E200', 4],
    ['E280', 7],
  ] as const) {
    const card = within(screen.getByRole('article', { name: `Certificate ${certificate}` }))
    expect(card.getByText('Reuse status: Reuse restricted to vendor')).toBeInTheDocument()
    expect(
      card.getByText(`${count} operating environments listed — show OS/hardware combinations`)
    ).toBeInTheDocument()
    expect(card.getAllByRole('listitem', { hidden: true })).toHaveLength(count)
  }
  const aws = within(screen.getByRole('article', { name: 'Certificate E280' }))
  expect(
    aws.getByText('Amazon Linux 2 on EC2 m5dn.metal (Intel Xeon Platinum 8259CL)')
  ).toBeInTheDocument()
  expect(
    aws.getByText('Amazon Linux 2023 on EC2 m5dn.metal (Intel Xeon Platinum 8259CL)')
  ).toBeInTheDocument()
  expect(aws.getByText(/certificate page says c7a.metal;.*says c7a.metal-48xl/)).toBeInTheDocument()
  expect(aws.getByRole('link', { name: 'Certificate' })).toHaveAttribute(
    'href',
    'https://csrc.nist.gov/projects/cryptographic-module-validation-program/entropy-validations/certificate/280'
  )
  expect(aws.getByRole('link', { name: 'Public Use Document' })).toHaveAttribute(
    'href',
    'https://csrc.nist.gov/CSRC/media/projects/cryptographic-module-validation-program/documents/entropy/E280_PublicUse.pdf'
  )
})

it('explains all ten non-IID estimators and how to read their numbers', () => {
  render(<SequentialTestExplanation track="non-iid" />)
  expect(screen.getAllByRole('term', { hidden: true })).toHaveLength(10)
  expect(screen.getByText(/not a pass\/fail score/)).toBeInTheDocument()
  expect(screen.getByText(/A dash means no value was reported/)).toBeInTheDocument()
  expect(
    screen.getByText(/failure to finish is not, by itself, proof of zero entropy/)
  ).toBeInTheDocument()
})

it('explains IID checks without treating non-rejection as proof', () => {
  render(<SequentialTestExplanation track="iid" />)
  for (const label of [
    'Chi-square tests',
    'IID longest repeated substring test',
    'Permutation tests',
  ]) {
    expect(screen.getByText(label)).toBeInTheDocument()
  }
  expect(screen.getByText(/It does not prove independence/)).toBeInTheDocument()
  expect(screen.queryByText('Lag Prediction')).not.toBeInTheDocument()
})

it('explains restart rationale, failure, reduced estimates and incomplete runs', () => {
  render(<RestartTestExplanation />)
  expect(
    screen.getByText(/repeat predictable behaviour whenever it starts again/)
  ).toBeInTheDocument()
  expect(screen.getByText(/below half the initial estimate/)).toBeInTheDocument()
  expect(screen.getByText(/Passing can still reduce/)).toBeInTheDocument()
  expect(
    screen.getByText(/An error or an unrun test leaves the assessment incomplete/)
  ).toBeInTheDocument()
})

it('explains health-test rationale and result limits beside the cutoffs', () => {
  render(
    <CutoffsScreen
      cutoffs={{ h: 8, alpha: 2 ** -20, rct: 4, aptWindow: 512, apt: 13 }}
      basis="teaching example"
      applied={null}
    />
  )
  expect(screen.getByText(/same value repeating too many times in a row/)).toBeInTheDocument()
  expect(screen.getByText(/counts how often its first value appears/)).toBeInTheDocument()
  expect(
    screen.getByRole('region', { name: 'How to interpret health-test results' })
  ).toBeInTheDocument()
  expect(screen.getByText(/Investigate the source and the assumptions/)).toBeInTheDocument()
  expect(
    screen.getByText(/does not prove that the source is unpredictable, secure or validated/)
  ).toBeInTheDocument()
  expect(
    screen.getByText(/do not show that the device performs continuous health monitoring/)
  ).toBeInTheDocument()
})

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
  it('explains the observed hardware findings alongside the stored comparisons', () => {
    render(<ComparisonRows manifest={manifest} device="mac-orbstack-linux-vm" />)
    const findings = within(screen.getByRole('region', { name: 'What these recordings showed' }))
    expect(findings.getByText(/failed a check for excessive repetition/)).toBeInTheDocument()
    expect(findings.getByText(/down on native macOS/)).toBeInTheDocument()
    expect(findings.getByText(/collector running inside its Linux VM/)).toBeInTheDocument()
    expect(findings.getAllByText('The lesson:')).toHaveLength(4)
    expect(
      findings.getByText(/not checked the OS documentation and configuration/)
    ).toBeInTheDocument()
    expect(findings.getByText(/not as paired input and output/)).toBeInTheDocument()
    expect(findings.getByText(/not new measurements from your current run/)).toBeInTheDocument()
    expect(findings.getByText(/not a ranking of hardware security/)).toBeInTheDocument()
    const refs = Object.values(manifest.nativeReference.bySha256)
    expect(
      refs.find((r) => r.parityId === 'real-mac-orbstack-linux-vm-loaded-restart-matrix')?.restart
        ?.values.error
    ).toBe('Restart Sanity Check Failed.')
    for (const [device, increased] of [
      ['frdm-imx95', true],
      ['kv260', true],
      ['mac-orbstack-linux-vm', true],
      ['mac-m5max-native', false],
    ] as const) {
      const value = (condition: string) =>
        Number(
          refs.find((r) => r.parityId === `real-${device}-${condition}-sequential-jent-raw-noise`)
            ?.nonIid?.values['Overall / hAssessed']
        )
      expect(Number.isFinite(value('idle')) && Number.isFinite(value('loaded'))).toBe(true)
      expect(value('loaded') > value('idle')).toBe(increased)
      const outputSource = device === 'mac-m5max-native' ? 'urandom' : 'getrandom'
      const output = Number(
        refs.find((r) => r.parityId === `real-${device}-contrast-${outputSource}`)?.nonIid?.values[
          'Overall / hAssessed'
        ]
      )
      expect(Number.isFinite(output)).toBe(true)
      expect(output).toBeGreaterThan(value('idle'))
      expect(output).toBeGreaterThan(value('loaded'))
    }
  })

  it.each([
    ['kv260-idle-sequential', 'How this sample was collected', /lowest eight bits/],
    ['imx95-contrast-getrandom', 'How this sample was collected', /processed output bytes/],
    ['syn-stuck', 'How this sample was generated', /fills the sample with zeros/],
    ['syn-biased', 'How this sample was generated', /75% chance of one/],
    ['syn-markov', 'How this sample was generated', /70% chance/],
    ['syn-healthy', 'How this sample was generated', /different seed for each row/],
    ['syn-restart-correlated', 'How this sample was generated', /about 2% of positions/],
    [
      'syn-conditioned-stuck',
      'How this sample was generated',
      /blocks of zeros together with a counter/,
    ],
  ] as const)('explains the origin of %s before testing', async (id, heading, explanation) => {
    render(<EntropyEvidenceLab />)
    fireEvent.click(await screen.findByTestId(`evl-case-${id}`))
    next()
    const summary = await screen.findByRole('region', { name: heading })
    expect(within(summary).getByText(explanation)).toBeInTheDocument()
    expect(summary).toHaveTextContent(/does not contact/)
    expect(runMock).not.toHaveBeenCalled()
  })

  it.each(['missing', 'malformed', 'tool-error'])(
    'labels a %s result as incomplete on screen and in export',
    async (kind) => {
      runMock.mockImplementation(async (request: RunRequest) => {
        const result = await fakeRun(request, {})
        result.record.toolJson =
          kind === 'missing'
            ? null
            : kind === 'malformed'
              ? { errorLevel: 0, testCases: [] }
              : { errorLevel: -1, errorMessage: 'Unable to read input file.' }
        return result
      })
      await openRunScreen('kv260-idle-sequential')
      fireEvent.click(screen.getByTestId('evl-seq-run'))
      const result = await screen.findByTestId('evl-seq-result')
      expect(result).toHaveTextContent('Analysis incomplete — insufficient evidence')
      expect(result).not.toHaveTextContent('No entropy awarded')
      goToStep(6)
      fireEvent.click(screen.getByTestId('evl-verdict-insufficient-evidence'))
      expect(screen.getByTestId('evl-allowed-verdict')).toHaveTextContent('Insufficient evidence')
      fireEvent.click(screen.getByTestId('evl-export-evidence'))
      const exported = JSON.parse(await downloads[downloads.length - 1].blob.text())
      expect(exported.inputs.conclusion.verdict).toBe('insufficient-evidence')
    }
  )

  it.each(['hash', 'size'])(
    'rejects a sample file with a changed %s before estimation',
    async (kind) => {
      const dataset = manifest.datasets[0]
      const original = fs.readFileSync(path.join(ROOT, 'public', dataset.file))
      const changed = Buffer.from(kind === 'size' ? original.subarray(1) : original)
      if (kind === 'hash') changed[0] ^= 1
      const fetchChanged = vi.fn(async () => fakeResponse(changed)) as unknown as typeof fetch
      await expect(
        loadData({ kind: 'device', datasetId: dataset.id }, manifest, fetchChanged)
      ).rejects.toThrow(kind === 'hash' ? /SHA-256 does not match/ : /size does not match/)
      expect(runMock).not.toHaveBeenCalled()
    }
  )

  it.each(['reference', 'minimum', 'restart-hash', 'sequential-hash'])(
    'blocks a positive conclusion after a %s mismatch',
    async (kind) => {
      runMock.mockImplementation(async (request: RunRequest) => {
        const result = await fakeRun(request, {})
        if (
          (kind === 'restart-hash' && request.tool === 'restart') ||
          (kind === 'sequential-hash' && request.tool === 'non_iid')
        ) {
          result.record.datasetHashConfirmedByTool = false
        } else if (kind === 'reference' && request.tool === 'restart') {
          const overall = result.record.toolJson!.testCases!.find(
            (tc) => tc.testCaseDesc === 'Overall'
          )!
          overall.h_r = Number(overall.h_r) + 0.01
        } else if (kind === 'minimum' && request.tool === 'non_iid') {
          const overall = result.record.toolJson!.testCases!.find(
            (tc) => tc.testCaseDesc === 'Overall'
          )!
          overall.hAssessed = Number(overall.hAssessed) + 0.01
        }
        return result
      })
      await openRunScreen('kv260-idle-sequential')
      fireEvent.click(screen.getByTestId('evl-seq-run'))
      await screen.findByTestId('evl-seq-result')
      fireEvent.click(screen.getByTestId('evl-restart-run'))
      await screen.findByTestId('evl-restart-result')
      goToStep(6)
      fireEvent.click(screen.getByTestId('evl-verdict-estimate-for-dataset'))
      expect(screen.getByTestId('evl-allowed-verdict')).toHaveTextContent('Insufficient evidence')
      expect(screen.getByText(/Investigate the failed checks/)).toBeInTheDocument()
      fireEvent.click(screen.getByTestId('evl-export-evidence'))
      const exported = JSON.parse(await downloads[downloads.length - 1].blob.text())
      expect(exported.inputs.conclusion.verdict).toBe('insufficient-evidence')
      expect(exported.inputs.healthCutoffs).toBeNull()
      expect(exported.inputs.integrityIssues.length).toBeGreaterThan(0)
      expect(exported.cases).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'result integrity and consistency', pass: false }),
        ])
      )
    }
  )

  it('labels missing references without inventing a mismatch', async () => {
    const noReferences = structuredClone(manifest)
    noReferences.nativeReference.bySha256 = {}
    const fetchOriginal = globalThis.fetch
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url === '/data/entropy/device-datasets-manifest.json'
          ? fakeResponse(JSON.stringify(noReferences))
          : fetchOriginal(url)
      )
    )
    await openRunScreen('kv260-idle-sequential')
    fireEvent.click(screen.getByTestId('evl-seq-run'))
    await screen.findByTestId('evl-seq-result')
    expect(screen.getByTestId('evl-reference-none')).toHaveTextContent('This is not a mismatch')
    fireEvent.click(screen.getByTestId('evl-restart-run'))
    await screen.findByTestId('evl-restart-result')
    goToStep(6)
    fireEvent.click(screen.getByTestId('evl-verdict-estimate-for-dataset'))
    expect(screen.getByTestId('evl-allowed-verdict')).toHaveTextContent(
      'Estimator output supports an estimate for this dataset'
    )
    fireEvent.click(screen.getByTestId('evl-export-evidence'))
    const exported = JSON.parse(await downloads[downloads.length - 1].blob.text())
    expect(exported.inputs.integrityIssues).toEqual([])
    expect(exported.inputs.referenceAvailability.sequential).toBe(
      'No reference comparison available'
    )
  })

  it('explains what selecting a dataset does before any estimator runs', async () => {
    render(<EntropyEvidenceLab />)
    expect(screen.getByText(/tests establishing that its random generator/)).toBeInTheDocument()
    expect(screen.getByText(/migration also changes the hardware/)).toBeInTheDocument()
    expect(await screen.findByText(/Choose one stored dataset to examine/)).toBeInTheDocument()
    expect(
      screen.getByText(/does not activate a live entropy source or run an estimator/)
    ).toBeInTheDocument()
    expect(screen.getByText(/Nothing selected yet/)).toBeInTheDocument()

    const choice = await screen.findByTestId('evl-case-syn-stuck')
    fireEvent.click(choice)
    expect(choice).toHaveAttribute('aria-pressed', 'true')
    expect(within(choice).getByText('Selected')).toBeInTheDocument()
    expect(screen.getByText('Selected dataset: Synthetic: Stuck source')).toBeInTheDocument()
    expect(screen.getByText(/no entropy estimate exists until/i)).toBeInTheDocument()
  })

  it('shows a "what this proves / does not prove" panel on every screen', async () => {
    await openRunScreen('kv260-idle-sequential')
    for (let n = 1; n <= 6; n++) {
      goToStep(n)
      const panel = screen.getByTestId('evidence-proves-panel')
      expect(panel).toHaveTextContent('What this proves')
      expect(panel).toHaveTextContent('What this does not prove')
    }
  })

  it('a processed-output estimate never becomes a noise-source claim', async () => {
    await openRunScreen('imx95-contrast-getrandom')
    goToStep(2)
    expect(screen.getByText(/not simply running the test/)).toBeInTheDocument()
    expect(
      screen.queryByText(/it is the mistake this dataset exists to show/)
    ).not.toBeInTheDocument()
    goToStep(4)
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
    expect(screen.getByText(/That number alone does not establish/)).toBeInTheDocument()
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

  it('exports the evidence as a run record carrying the site build', async () => {
    downloads.length = 0
    await openRunScreen('kv260-idle-sequential')
    fireEvent.click(screen.getByTestId('evl-seq-run'))
    await screen.findByTestId('evl-seq-result', {}, { timeout: 10000 })
    goToStep(6)
    fireEvent.click(screen.getByTestId('evl-verdict-insufficient-evidence'))
    expect(screen.getByTestId('evl-provenance')).toHaveTextContent(/Site version .* · commit /)
    fireEvent.click(screen.getByTestId('evl-export-evidence'))
    expect(downloads).toHaveLength(1)
    expect(downloads[0].name).toMatch(
      /^entropy-evidence-kv260-idle-sequential-\d{4}-\d{2}-\d{2}\.json$/
    )
    const json = JSON.parse(await downloads[0].blob.text())
    expect(json.schema).toBe('pqctoday.run-manifest/2')
    expect(json.notice).toMatch(/^PQC Today is an educational/)
    expect(json.site).toHaveProperty('appVersion')
    expect(json.tool.id).toBe('entropy-evidence-lab')
    expect(json.inputs.schema).toBe('pqctoday.entropy.evidence-lab-export/1')
    expect(json.inputs.case.id).toBe('kv260-idle-sequential')
    expect(json.inputs.learner.verdict).toBe('insufficient-evidence')
    expect(json.cases.map((c: { id: string }) => c.id)).toContain(
      'dataset hash confirmed by the tool'
    )
    expect(json.limitations.join(' ')).toContain('Not an ESV submission')
  })
})
