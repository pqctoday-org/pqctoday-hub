// SPDX-License-Identifier: AGPL-3.0-only
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { execFileSync, spawnSync } from 'node:child_process'
import { writeFileSync, mkdtempSync, rmSync, existsSync, mkdirSync, copyFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createHash } from 'node:crypto'
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

const examples = ['keygen', 'sign', 'verify'].map((operation) =>
  CODE_EXAMPLES.find((entry) => entry.apiId === 'openssl' && entry.operation === operation)!
)
const publishedCode = examples.map((entry) => entry.code).join('\n\n') + '\n'
const prefix = process.env.OPENSSL_EXAMPLE_PREFIX ?? '/opt/homebrew/opt/openssl@3'
const cli = join(prefix, 'bin/openssl')
const sdk = process.env.OPENSSL_EXAMPLE_SDKROOT
const fixture = resolve(
  'src/components/PKILearning/modules/CryptoDevAPIs/data/fixtures/opensslOneShotHarness.c'
)
let directory: string
let normal: string
let faults: string
let functional: Record<string, number>
const receipts: unknown[] = []
const sha = (data: string | Buffer) => createHash('sha256').update(data).digest('hex')

beforeAll(() => {
  expect(
    process.platform,
    'This native local fixture requires the explicitly selected existing macOS SDK'
  ).toBe('darwin')
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Read only the selected native test SDK header.
  expect(existsSync(join(prefix, 'include/openssl/evp.h'))).toBe(true)
  directory = mkdtempSync(join(tmpdir(), 'mldsa-one-shot-'))
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Write the published functions into this test's fresh temporary directory.
  writeFileSync(join(directory, 'examples-under-test.inc'), publishedCode)
  copyFileSync(fixture, join(directory, 'harness.c'))
  normal = join(directory, 'normal')
  faults = join(directory, 'faults')
  const args = [
    '-std=c11',
    '-Wall',
    '-Wextra',
    '-Werror',
    ...(sdk ? ['-isysroot', sdk] : []),
    '-I',
    join(prefix, 'include'),
    'harness.c',
    '-L',
    join(prefix, 'lib'),
    `-Wl,-rpath,${join(prefix, 'lib')}`,
    '-lcrypto',
  ]
  // The normal build has no test wrappers: its functions are the published text verbatim.
  execFileSync('/usr/bin/clang', [...args, '-o', normal], { cwd: directory, encoding: 'utf8' })
  execFileSync('/usr/bin/clang', ['-DHARNESS_FAULTS', ...args, '-o', faults], {
    cwd: directory,
    encoding: 'utf8',
  })
  const output = execFileSync(normal, ['run'], { cwd: directory, encoding: 'utf8' })
  functional = JSON.parse(output)
  receipts.push({
    kind: 'normal exact-code build',
    sourceSha256: sha(publishedCode),
    compilerSdkOverride: sdk ?? null,
    output: functional,
    version: execFileSync(cli, ['version'], { encoding: 'utf8' }).trim(),
    linkage: execFileSync('/usr/bin/otool', ['-L', normal], { encoding: 'utf8' }),
  })
}, 30_000)

afterAll(() => {
  const evidence = process.env.OPENSSL_EXAMPLE_EVIDENCE_DIR
  if (directory && evidence) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Optional evidence directory is supplied by the test runner, never by learner data.
    mkdirSync(evidence, { recursive: true })
    for (const name of [
      'examples-under-test.inc',
      'public.pem',
      'wrong-public.pem',
      'message.bin',
      'changed-message.bin',
      'signature.bin',
      'changed-signature.bin',
    ]) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- Fixed artifact names in this test's fresh temporary directory.
      if (existsSync(join(directory, name)))
        copyFileSync(join(directory, name), join(evidence, name))
    }
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Write only the named receipt under the test-runner evidence directory.
    writeFileSync(join(evidence, 'receipts.json'), JSON.stringify(receipts, null, 2) + '\n')
  }
  if (directory) rmSync(directory, { recursive: true, force: true })
})

describe('Published OpenSSL ML-DSA-65 one-shot examples', () => {
  it('signs and verifies using the exact displayed functions and rejects real changed inputs', () => {
    expect(functional).toEqual({
      valid: 1,
      changedMessage: 0,
      wrongKey: 0,
      changedSignature: 0,
      retry: 1,
      missingKey: -1,
      signatureBytes: 3309,
    })
  })

  it('independently verifies emitted public artifacts through the existing CLI', () => {
    for (const [publicKey, message, signature, valid] of [
      ['public.pem', 'message.bin', 'signature.bin', true],
      ['public.pem', 'changed-message.bin', 'signature.bin', false],
      ['wrong-public.pem', 'message.bin', 'signature.bin', false],
      ['public.pem', 'message.bin', 'changed-signature.bin', false],
    ] as const) {
      const args = [
        'pkeyutl',
        '-verify',
        '-pubin',
        '-rawin',
        '-inkey',
        publicKey,
        '-in',
        message,
        '-sigfile',
        signature,
      ]
      const result = spawnSync(cli, args, { cwd: directory, encoding: 'utf8' })
      expect(result.error).toBeUndefined()
      if (valid) expect(result.status).toBe(0)
      else expect(result.status).toBe(1)
      receipts.push({
        kind: 'independent CLI artifact check',
        args,
        exit: result.status,
        valid,
        stdout: result.stdout,
        stderr: result.stderr,
      })
    }
  })

  it('distinguishes eleven explicit harness-only operation faults from cryptographic rejection', () => {
    const output = execFileSync(faults, ['run'], { cwd: directory, encoding: 'utf8' })
    expect(JSON.parse(output)).toEqual({
      harnessOnlyFaultCases: 11,
      allRejectedAsOperationFailures: true,
    })
    receipts.push({
      kind: 'artificial harness-only faults, not algorithm rejection',
      output: JSON.parse(output),
    })
  })

  it('fails without producing success output when the selected process has no ML-DSA provider', () => {
    const config = join(directory, 'null-provider.cnf')
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Process-local provider fixture in this test's temporary directory; no global config.
    writeFileSync(
      config,
      'openssl_conf = init\n[init]\nproviders = providers\n[providers]\nnull = null_provider\n[null_provider]\nactivate = 1\n'
    )
    const result = spawnSync(normal, ['run'], {
      cwd: directory,
      env: { ...process.env, OPENSSL_CONF: config },
      encoding: 'utf8',
    })
    expect(result.error).toBeUndefined()
    expect(result.status).toBe(1)
    expect(result.stdout).toBe('')
    expect(result.stderr).toContain('Failed: real key generation')
    receipts.push({
      kind: 'actual process-scoped provider unavailable, not crypto rejection',
      exit: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
    })
  })

  it('renders the compiled keygen/sign/verify strings through the actual operation and API filters', () => {
    render(<ProviderPatternWorkshop />)
    fireEvent.click(screen.getByRole('button', { name: /^API:?$/ }))
    fireEvent.click(screen.getByRole('option', { name: 'OpenSSL' }))
    for (const [index, operation] of ['Key Generation', 'Sign', 'Verify'].entries()) {
      fireEvent.click(screen.getByRole('button', { name: /^Operation:?$/ }))
      fireEvent.click(screen.getByRole('option', { name: operation }))
      const snippet = screen.getByText(examples.at(index)!.code, {
        exact: true,
        normalizer: (text) => text,
      })
      expect(snippet.tagName).toBe('CODE')
      expect(snippet.textContent).toBe(examples.at(index)!.code)
      expect(screen.getByText(examples.at(index)!.notes, { exact: true })).toBeVisible()
    }
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
