// SPDX-License-Identifier: GPL-3.0-only
/**
 * Regression guard for the KEM decap output-flag divergence fixed in the
 * openssl.md remediation: WorkbenchPresets.tsx used `-secret recovered.bin`
 * for `pkeyutl -decap` while Workbench.tsx's live command builder used
 * `-out secret.bin` — only one of those is the documented, correct flag for
 * decapsulation output (`-secret` is documented for encapsulation only; see
 * `openssl pkeyutl -help`), so the preset and the builder silently disagreed.
 *
 * This exercises the FULL Studio flow (genpkey -> pkey -pubout -> encap ->
 * decap) entirely against the real bundled `public/wasm/openssl.wasm`
 * binary — the same one the app runs in the browser — using `-out` for
 * decap, and asserts the recovered secret matches what encap produced.
 */
import { describe, expect, it } from 'vitest'
import { newModule, runOpenssl, readFileBin, writeFile } from './openssl-driver'

describe('pkeyutl -decap output flag (Studio KEM flow, real WASM binary)', () => {
  it('ML-KEM-768: genpkey -> pubout -> encap -> decap with -out recovers the exact shared secret', async () => {
    // Fresh module per callMain — the WASM bundle tears its runtime down
    // after each call (EXIT_RUNTIME=1), so chain state via the filesystem
    // snapshot/rehydrate pattern the worker itself uses.
    const M1 = await newModule({ quiet: true })
    const gen = runOpenssl(M1, ['genpkey', '-algorithm', 'ML-KEM-768', '-out', '/priv.key'])
    expect(gen.rc, gen.stderr).toBe(0)
    const priv = readFileBin(M1, '/priv.key')

    const M2 = await newModule({ quiet: true })
    writeFile(M2, '/priv.key', priv)
    const pub = runOpenssl(M2, ['pkey', '-in', '/priv.key', '-pubout', '-out', '/pub.key'])
    expect(pub.rc, pub.stderr).toBe(0)
    const pubKey = readFileBin(M2, '/pub.key')

    const M3 = await newModule({ quiet: true })
    writeFile(M3, '/pub.key', pubKey)
    // Matches Workbench.tsx's genpkey/encap command shape exactly.
    const encap = runOpenssl(M3, [
      'pkeyutl',
      '-encap',
      '-inkey',
      '/pub.key',
      '-pubin',
      '-out',
      '/ciphertext.bin',
      '-secret',
      '/secret.bin',
    ])
    expect(encap.rc, encap.stderr).toBe(0)
    const ciphertext = readFileBin(M3, '/ciphertext.bin')
    const encapSecret = readFileBin(M3, '/secret.bin')
    expect(encapSecret.length).toBe(32)

    const M4 = await newModule({ quiet: true })
    writeFile(M4, '/priv.key', priv)
    writeFile(M4, '/ciphertext.bin', ciphertext)
    // The flag under test — this MUST be -out (Workbench.tsx's builder),
    // NOT -secret (the pre-fix WorkbenchPresets.tsx preset).
    const decap = runOpenssl(M4, [
      'pkeyutl',
      '-decap',
      '-inkey',
      '/priv.key',
      '-in',
      '/ciphertext.bin',
      '-out',
      '/recovered.bin',
    ])
    expect(decap.rc, decap.stderr).toBe(0)
    const recovered = readFileBin(M4, '/recovered.bin')
    expect(Buffer.from(recovered).equals(Buffer.from(encapSecret))).toBe(true)
  }, 60_000)
})
