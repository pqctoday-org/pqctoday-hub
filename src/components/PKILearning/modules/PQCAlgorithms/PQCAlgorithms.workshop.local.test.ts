// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection -- indexes the files of this test by fixed names */
/**
 * Runs the exact command lines of the two live workshop steps against the real bundled OpenSSL
 * build (the binary the browser loads), and checks what the steps show: sizes equal the registry
 * values, both sides of a round trip hold the same secret, a changed ciphertext returns a
 * different secret without an error, a changed message or context fails verification, and the
 * hedged and deterministic modes behave as the step says.
 *
 * Venue: *.local.test.ts (real-wasm venue, run by `npm run test:local`).
 */
import { describe, it, expect } from 'vitest'
import { getAlgorithm } from '@/data/algorithmProperties'
import { parseOpensslArgs } from '@/components/OpenSSLStudio/worker/commandParser'
import { newModule, readFileBin, runOpenssl, writeFile } from '@/test/kat/openssl-driver'
import {
  DSA_COMMANDS,
  DSA_PARAMETER_SETS,
  FILES,
  KEM_COMMANDS,
  KEM_PARAMETER_SETS,
} from './data/workshopData'

type Files = Record<string, Uint8Array>

/** One command in a fresh module (the build tears its runtime down after each call), like the worker's persistent file map. */
async function run(command: string, inputs: Files, outputs: string[] = []) {
  const M = await newModule({ quiet: true })
  for (const [name, data] of Object.entries(inputs)) writeFile(M, `/${name}`, data)
  const r = runOpenssl(M, parseOpensslArgs(command))
  const out: Files = {}
  for (const name of outputs) {
    try {
      out[name] = readFileBin(M, `/${name}`)
    } catch {
      /* not written */
    }
  }
  return { rc: r.rc, stdout: r.stdout, stderr: r.stderr, out }
}

const eq = (a: Uint8Array, b: Uint8Array) => Buffer.from(a).equals(Buffer.from(b))

describe.each(KEM_PARAMETER_SETS)('workshop step 1, %s', (alg) => {
  it('round-trips, and a changed ciphertext returns a different secret with no error', async () => {
    const reg = getAlgorithm(alg)
    const gen = await run(KEM_COMMANDS.generate(alg), {}, [FILES.kemKey])
    expect(gen.rc, gen.stderr).toBe(0)
    const priv = gen.out[FILES.kemKey]
    const pubRes = await run(KEM_COMMANDS.publicKey(), { [FILES.kemKey]: priv }, [FILES.kemPub])
    expect(pubRes.rc, pubRes.stderr).toBe(0)
    const pub = pubRes.out[FILES.kemPub]

    const enc = await run(KEM_COMMANDS.encapsulate(), { [FILES.kemPub]: pub }, [
      FILES.kemCiphertext,
      FILES.kemSecret,
    ])
    expect(enc.rc, enc.stderr).toBe(0)
    const ct = enc.out[FILES.kemCiphertext]
    const secret = enc.out[FILES.kemSecret]
    expect(ct.length).toBe(reg.signatureOrCiphertextBytes)
    expect(secret.length).toBe(reg.sharedSecretBytes)

    const dec = await run(
      KEM_COMMANDS.decapsulate(FILES.kemCiphertext, FILES.kemRecovered),
      { [FILES.kemKey]: priv, [FILES.kemCiphertext]: ct },
      [FILES.kemRecovered]
    )
    expect(dec.rc, dec.stderr).toBe(0)
    expect(eq(dec.out[FILES.kemRecovered], secret)).toBe(true)

    const changed = new Uint8Array(ct)
    changed[Math.floor(ct.length / 2)] ^= 0x01
    const bad = await run(
      KEM_COMMANDS.decapsulate(FILES.kemAlteredCiphertext, FILES.kemAlteredRecovered),
      { [FILES.kemKey]: priv, [FILES.kemAlteredCiphertext]: changed },
      [FILES.kemAlteredRecovered]
    )
    expect(bad.rc, bad.stderr).toBe(0)
    const badSecret = bad.out[FILES.kemAlteredRecovered]
    expect(badSecret.length).toBe(reg.sharedSecretBytes)
    expect(eq(badSecret, secret)).toBe(false)
  }, 120_000)
})

describe.each(DSA_PARAMETER_SETS)('workshop step 2, %s', (alg) => {
  it('signs and verifies; a changed message or context fails; modes behave as described', async () => {
    const reg = getAlgorithm(alg)
    const message = new TextEncoder().encode('Message to sign')
    const changedMessage = new TextEncoder().encode('Message to sigN')

    const gen = await run(DSA_COMMANDS.generate(alg), {}, [FILES.dsaKey])
    expect(gen.rc, gen.stderr).toBe(0)
    const priv = gen.out[FILES.dsaKey]
    const pubRes = await run(DSA_COMMANDS.publicKey(), { [FILES.dsaKey]: priv }, [FILES.dsaPub])
    expect(pubRes.rc, pubRes.stderr).toBe(0)
    const pub = pubRes.out[FILES.dsaPub]

    const sign = async (o: { deterministic: boolean; context: string }) => {
      const r = await run(
        DSA_COMMANDS.sign(o),
        { [FILES.dsaKey]: priv, [FILES.dsaMessage]: message },
        [FILES.dsaSignature]
      )
      expect(r.rc, r.stderr).toBe(0)
      return r.out[FILES.dsaSignature]
    }
    const verify = (sig: Uint8Array, msg: Uint8Array, context: string) =>
      run(DSA_COMMANDS.verify(context), {
        [FILES.dsaPub]: pub,
        [FILES.dsaMessage]: msg,
        [FILES.dsaSignature]: sig,
      })

    const hedgedA = await sign({ deterministic: false, context: '' })
    const hedgedB = await sign({ deterministic: false, context: '' })
    expect(hedgedA.length).toBe(reg.signatureOrCiphertextBytes)
    expect(eq(hedgedA, hedgedB)).toBe(false)

    const detA = await sign({ deterministic: true, context: '' })
    const detB = await sign({ deterministic: true, context: '' })
    expect(eq(detA, detB)).toBe(true)

    expect((await verify(hedgedA, message, '')).rc).toBe(0)
    expect((await verify(detA, message, '')).rc).toBe(0)
    expect((await verify(hedgedA, changedMessage, '')).rc).not.toBe(0)

    const withContext = await sign({ deterministic: false, context: 'two words' })
    expect((await verify(withContext, message, 'two words')).rc).toBe(0)
    expect((await verify(withContext, message, 'other')).rc).not.toBe(0)
    expect((await verify(withContext, message, '')).rc).not.toBe(0)
  }, 180_000)
})
