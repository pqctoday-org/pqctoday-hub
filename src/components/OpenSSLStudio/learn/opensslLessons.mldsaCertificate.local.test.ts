// SPDX-License-Identifier: AGPL-3.0-only
//
// Checks, against the real OpenSSL WASM build, that the ML-DSA req command the lessons run
// produces a certificate whose signature algorithm is ML-DSA-65, and that the RSA arm is
// sha256WithRSAEncryption. The lesson text states exactly this, so it is read from the
// engine rather than assumed.
import { describe, it, expect } from 'vitest'
import { OPENSSL_LESSONS } from './opensslLessons'
import { parseOpensslArgs } from '../worker/commandParser'
import {
  newModule,
  runOpenssl,
  writeFile,
  readFileBin,
  listNewOutputFiles,
} from '../../../test/kat/openssl-driver'

describe('OpenSSL lessons: signature algorithm in the emitted certificates', () => {
  it('the commands the lesson runs emit ML-DSA-65 and sha256WithRSAEncryption certificates', async () => {
    const files = new Map<string, Uint8Array>()
    const run = async (cmd: string) => {
      const M = await newModule({ quiet: true })
      for (const [name, data] of files) writeFile(M, `/${name}`, data)
      const pre = new Set(files.keys())
      const r = runOpenssl(M, parseOpensslArgs(cmd))
      for (const n of listNewOutputFiles(M, pre)) files.set(n, readFileBin(M, `/${n}`))
      if (r.rc !== 0) throw new Error(r.stderr)
      return r.stdout
    }
    const lesson = OPENSSL_LESSONS.find((l) =>
      l.steps.some((s) => s.op.includes('learn-l2-mldsa'))
    )!
    for (const step of lesson.steps) await run(step.op)

    const mldsa = await run('x509 -in learn-l2-mldsa.crt -noout -text')
    expect(mldsa.match(/Signature Algorithm: .*/g)).toEqual([
      'Signature Algorithm: ML-DSA-65',
      'Signature Algorithm: ML-DSA-65',
    ])
    const rsa = await run('x509 -in learn-l2-rsa.crt -noout -text')
    expect(rsa).toMatch(/Signature Algorithm: sha256WithRSAEncryption/)
  }, 60_000)
})
