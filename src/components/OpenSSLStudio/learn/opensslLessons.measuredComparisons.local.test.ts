// SPDX-License-Identifier: AGPL-3.0-only
import { createPrivateKey, generateKeyPairSync } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import { OPENSSL_LESSONS, openSslRunComparison, type OpenSslStepResult } from './opensslLessons'
import type { OpenSslLearnContext } from './opensslLearnContext'
import { parseOpensslArgs } from '../worker/commandParser'
import {
  newModule,
  runOpenssl,
  writeFile,
  readFileBin,
  listNewOutputFiles,
} from '../../../test/kat/openssl-driver'

const lesson = (id: string) => OPENSSL_LESSONS.find((item) => item.id === id)!
const bytes = (value: string) => new TextEncoder().encode(value)
const controlledContext = (file?: Uint8Array): OpenSslLearnContext => ({
  run: vi.fn(async () => ({ stdout: '' })),
  readFile: () => file,
  writeFile: () => {},
})

describe('Studio comparison uses successful output-file measurements', () => {
  it('distinguishes valid LF and CRLF RSA PEM encodings instead of a reference count', async () => {
    const pem = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      publicKeyEncoding: { type: 'spki', format: 'pem' },
    }).privateKey
    const variants = [pem, pem.replace(/\n/g, '\r\n')]
    const measured = []
    for (const value of variants) {
      expect(createPrivateKey(value).asymmetricKeyType).toBe('rsa')
      const ctx = controlledContext(bytes(value))
      const result = await lesson('first-keypair').steps[0].run(ctx)
      expect(ctx.run).toHaveBeenCalledWith(lesson('first-keypair').steps[0].op)
      expect(result.byteLength).toBe(Buffer.byteLength(value))
      const comparison = openSslRunComparison(lesson('first-keypair'), [
        result,
        { detail: 'Controlled second output', byteLength: 2048 },
      ])!
      expect(comparison.rows.find((row) => row.label === 'Private key (PEM)')?.a).toBe(
        `${Buffer.byteLength(value)} B (RSA-2048)`
      )
      measured.push(result.byteLength)
    }
    expect(measured[0]).not.toBe(measured[1])
    expect(createPrivateKey(variants[0]).export({ type: 'pkcs8', format: 'der' })).toEqual(
      createPrivateKey(variants[1]).export({ type: 'pkcs8', format: 'der' })
    )
  })

  it.each([undefined, new Uint8Array()])(
    'rejects successful commands without a nonempty measured output',
    async (file) => {
      await expect(lesson('first-keypair').steps[0].run(controlledContext(file))).rejects.toThrow(
        'did not produce a nonempty output file'
      )
      expect(
        openSslRunComparison(lesson('first-keypair'), [
          undefined,
          { detail: 'Other step', byteLength: 2048 },
        ])
      ).toBeUndefined()
    }
  )

  it('does not convert an operational error into a captured measurement', async () => {
    const ctx = controlledContext(new Uint8Array(1200))
    vi.mocked(ctx.run).mockRejectedValueOnce(new Error('Engine operation failed'))
    await expect(lesson('first-keypair').steps[0].run(ctx)).rejects.toThrow(
      'Engine operation failed'
    )
  })

  it.each([
    { rsa: 256, mldsa: 3309, ratio: '12.9×' },
    { rsa: 100, mldsa: 500, ratio: '5.0×' },
  ])(
    'derives the signature ratio from retained counts ($rsa B and $mldsa B)',
    ({ rsa, mldsa, ratio }) => {
      const result: (OpenSslStepResult | undefined)[] = Array.from({ length: 9 }, () => undefined)
      result[2] = { detail: 'Controlled RSA measurement', byteLength: rsa }
      result[6] = { detail: 'Controlled ML-DSA measurement', byteLength: mldsa }
      const measured = openSslRunComparison(lesson('sign-verify'), result)!
      expect(measured.rows.find((row) => row.label === 'Signature size')).toMatchObject({
        a: `${rsa} B (RSA-2048)`,
        b: `${mldsa} B (ML-DSA-65)`,
      })
      expect(measured.summary).toContain(`ML-DSA-65 / RSA-2048 ≈ ${ratio}`)
      expect(measured.summary).toContain('not equivalent-strength')
    }
  )

  it('withdraws the ratio when either signature measurement is unavailable', () => {
    const result: (OpenSslStepResult | undefined)[] = Array.from({ length: 9 }, () => undefined)
    result[2] = { detail: 'Controlled RSA measurement', byteLength: 256 }
    result[6] = { detail: 'Unavailable output', byteLength: 0 }
    expect(openSslRunComparison(lesson('sign-verify'), result)).toBeUndefined()
  })

  it('binds actual bundled-engine key, certificate and signature comparisons to the generated files', async () => {
    for (const [id, label, aName, bName] of [
      ['first-keypair', 'Private key (PEM)', 'learn-l1-rsa.key', 'learn-l1-mldsa.key'],
      ['cert-issuance', 'Self-signed certificate', 'learn-l2-rsa.crt', 'learn-l2-mldsa.crt'],
      ['sign-verify', 'Signature size', 'learn-l3-rsa.sig', 'learn-l3-mldsa.sig'],
    ] as const) {
      const files = new Map<string, Uint8Array>()
      const ctx: OpenSslLearnContext = {
        run: async (cmd) => {
          const module = await newModule({ quiet: true })
          for (const [name, data] of files) writeFile(module, `/${name}`, data)
          const result = runOpenssl(module, parseOpensslArgs(cmd))
          if (result.rc !== 0) throw new Error(result.stderr)
          // Capture current bytes even when an output overwrites an existing name.
          for (const name of listNewOutputFiles(module, new Set()))
            files.set(name, readFileBin(module, `/${name}`))
          return { stdout: result.stdout }
        },
        readFile: (name) => files.get(name),
        writeFile: (name, content) => {
          files.set(name, typeof content === 'string' ? bytes(content) : content)
        },
      }
      const selected = lesson(id),
        results = []
      for (const step of selected.steps) results.push(await step.run(ctx))
      const row = openSslRunComparison(selected, results)!.rows.find(
        (item) => item.label === label
      )!
      expect(row.a).toBe(`${files.get(aName)!.length} B (RSA-2048)`)
      expect(row.b).toBe(`${files.get(bName)!.length} B (ML-DSA-65)`)
    }
  }, 120_000)
})
