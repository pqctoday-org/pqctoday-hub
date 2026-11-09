// SPDX-License-Identifier: AGPL-3.0-only
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { execFileSync, spawnSync } from 'node:child_process'
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { CODE_EXAMPLES } from './codeExamplesData'
import { ProviderPatternWorkshop } from '../workshop/ProviderPatternWorkshop'

vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: false,
    moduleRef: { current: null },
    hSessionRef: { current: 0 },
    slotRef: { current: 0 },
    keys: [],
    log: [],
    registerKey: vi.fn(),
    clearLog: vi.fn(),
  }),
}))
vi.mock('@/wasm/softhsm', () => ({}))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
vi.mock('@/components/shared/HsmKeyInspector', () => ({ HsmKeyInspector: () => null }))

const example = CODE_EXAMPLES.find(
  (entry) => entry.apiId === 'pkcs11' && entry.operation === 'keygen'
)!
let directory: string
let executable: string
const modulePath = process.env.PKCS11_EXAMPLE_MODULE
const headers = process.env.PKCS11_EXAMPLE_HEADERS
const sdk = process.env.PKCS11_EXAMPLE_SDKROOT
const fixture = resolve(
  'src/components/PKILearning/modules/CryptoDevAPIs/data/fixtures/pkcs11KeygenHarness.c'
)

beforeAll(() => {
  expect(
    process.platform,
    'Requires the approved task-private native macOS software-token build'
  ).toBe('darwin')
  expect(
    modulePath,
    'Supply the source-pinned private module, never a physical/shared token provider'
  ).toBeTruthy()
  expect(headers, 'Supply the exact official OASIS 3.2 header directory').toBeTruthy()
  directory = mkdtempSync(join(tmpdir(), 'pkcs11-keygen-example-'))
  executable = join(directory, 'run')
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Write only the actual published snippet into this test's fresh directory.
  writeFileSync(join(directory, 'example-under-test.inc'), example.code)
  copyFileSync(fixture, join(directory, 'harness.c'))
  execFileSync(
    '/usr/bin/clang',
    [
      '-std=c11',
      '-Wall',
      '-Wextra',
      '-Werror',
      ...(sdk ? ['-isysroot', sdk] : []),
      '-I',
      headers!,
      'harness.c',
      '-o',
      executable,
    ],
    { cwd: directory, encoding: 'utf8' }
  )
}, 30_000)

afterAll(() => {
  if (directory) rmSync(directory, { recursive: true, force: true })
})

function run(mode: string) {
  const env = { ...process.env }
  delete env.SOFTHSMRUST_STATE_FILE
  delete env.SOFTHSMRUST_SLOTS
  return JSON.parse(
    execFileSync(executable, [modulePath!, mode], {
      cwd: directory,
      encoding: 'utf8',
      env,
      timeout: 30_000,
    })
  )
}

describe('Published PKCS11 numeric parameter selection', () => {
  it('generates the declared 65 key, signs and verifies, rejecting changed message and signature', () => {
    expect(run('valid')).toMatchObject({
      generationRv: 0,
      parameter: 2,
      privateParameter: 2,
      publicBytes: 1952,
      signatureBytes: 3309,
      declared65: true,
      verified: true,
      changedMessageRejected: true,
      changedSignatureRejected: true,
      wrongKeyRejected: true,
    })
  })
  it('does not mistake another valid parameter set for the declared 65 sample', () => {
    expect(run('wrong-valid-44')).toMatchObject({
      generationRv: 0,
      parameter: 1,
      publicBytes: 1312,
      declared65: false,
    })
  })
  it.each(['string', 'short', 'unsupported', 'missing'])(
    'records actual contrary outcome without declaring 65: %s',
    (mode) => {
      expect(run(mode)).toMatchObject({ mode, declared65: false })
    }
  )
  it('fails visibly when the explicitly selected module is unavailable', () => {
    const result = spawnSync(executable, [join(directory, 'does-not-exist.dylib')], {
      cwd: directory,
      encoding: 'utf8',
    })
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('module unavailable')
  })
  it('renders the same complete function in the actual PKCS11 key-generation pane', () => {
    render(<ProviderPatternWorkshop />)
    fireEvent.click(screen.getByRole('button', { name: 'API:' }))
    fireEvent.click(screen.getByRole('option', { name: 'PKCS#11' }))
    expect(screen.getByText(example.code, { normalizer: (text) => text })).toBeInTheDocument()
    expect(screen.getByText(example.notes!, { exact: false })).toBeInTheDocument()
  })
})
