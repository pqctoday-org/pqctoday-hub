// SPDX-License-Identifier: GPL-3.0-only
//
// Verifies algorithmListParser.ts against the REAL `openssl list` output
// from the actual bundled openssl.wasm — not a hand-written fixture. This
// is what stops the parser from silently drifting out of sync with a
// future OpenSSL WASM rebuild that reformats `list`'s text (a real risk:
// this output format is undocumented and human-oriented, see
// algorithmListParser.ts's header comment).
//
// Also asserts the provider-honesty rule itself (a RED-FIRST test, per
// openssl-studio-phase3-algorithm-explorer-plan-07242026.md §5): the
// `pkcs11` provider must currently probe as NON-functional in this
// sandbox. If a future build wires up its PKCS#11 module and this starts
// passing, that's real news worth updating the UI/docs for — the test
// failing loudly is the point, not a bug to silence.
//
// Venue: `*.local.test.ts` — local gate only, not CI.
import { describe, it, expect } from 'vitest'
import { newModule, runOpenssl, writeFile } from '../../../test/kat/openssl-driver'
import { parseOpensslArgs } from '../worker/commandParser'
import {
  parseProviders,
  parseKeyManagersSection,
  parseFlatProvidedList,
  parseLegacySection,
  classifyFamily,
  pickProbeTarget,
  probeProviderFunctional,
} from './algorithmListParser'

async function runList(args: string[]): Promise<string> {
  const M = await newModule({ quiet: true })
  const r = runOpenssl(M, args)
  expect(r.rc, args.join(' ')).toBe(0)
  return r.stdout
}

describe('algorithmListParser — parses the real openssl list output', () => {
  it('parseProviders finds both default and pkcs11, with real build info', async () => {
    const raw = await runList(['list', '-providers', '-verbose'])
    const providers = parseProviders(raw)
    const byKey = Object.fromEntries(providers.map((p) => [p.key, p]))

    expect(byKey.default, raw).toBeTruthy()
    expect(byKey.default.reportedStatus).toBe('active')
    expect(byKey.default.version).toBe('3.6.2')

    expect(byKey.pkcs11, raw).toBeTruthy()
    expect(byKey.pkcs11.reportedStatus).toBe('active')
    expect(byKey.pkcs11.buildInfo ?? '').toContain('SoftHSMv3')
  })

  it('parseKeyManagersSection finds ML-KEM/ML-DSA/SLH-DSA under @ default, and the pkcs11 duplicates', async () => {
    const raw = await runList(['list', '-public-key-algorithms'])
    const entries = parseKeyManagersSection(raw)
    expect(entries.length, raw.slice(0, 500)).toBeGreaterThan(20)

    const mldsa65Default = entries.find(
      (e) => e.provider === 'default' && e.aliases.includes('ML-DSA-65')
    )
    expect(mldsa65Default, JSON.stringify(entries.map((e) => e.aliases))).toBeTruthy()
    expect(mldsa65Default!.oids).toContain('2.16.840.1.101.3.4.3.18')
    expect(mldsa65Default!.family).toBe('pqc')

    const mlkem768Pkcs11 = entries.find(
      (e) => e.provider === 'pkcs11' && e.aliases.includes('ML-KEM-768')
    )
    expect(mlkem768Pkcs11, 'pkcs11 should register ML-KEM-768 too').toBeTruthy()
    expect(mlkem768Pkcs11!.family).toBe('pqc')

    const compositePkcs11 = entries.find((e) =>
      e.aliases.some((a) => a.includes('MLDSA44-RSA2048-PSS-SHA256'))
    )
    expect(compositePkcs11, 'the LAMPS composite signature should be present').toBeTruthy()
    expect(compositePkcs11!.provider).toBe('pkcs11')
    expect(compositePkcs11!.family).toBe('pqc')
  })

  it('parseFlatProvidedList handles -kem-algorithms and -signature-algorithms (no header line)', async () => {
    const kemRaw = await runList(['list', '-kem-algorithms'])
    const kemEntries = parseFlatProvidedList(kemRaw, 'kem-algorithms')
    expect(kemEntries.some((e) => e.aliases.includes('ML-KEM-768'))).toBe(true)
    expect(kemEntries.some((e) => e.aliases.includes('X25519MLKEM768'))).toBe(true)

    const sigRaw = await runList(['list', '-signature-algorithms'])
    const sigEntries = parseFlatProvidedList(sigRaw, 'signature-algorithms')
    expect(sigEntries.some((e) => e.aliases.includes('SLH-DSA-SHA2-128s'))).toBe(true)
    expect(sigEntries.some((e) => e.aliases.includes('ML-DSA-65'))).toBe(true)
  })

  it('parseFlatProvidedList handles the headered -kdf-algorithms / -mac-algorithms shape', async () => {
    const kdfRaw = await runList(['list', '-kdf-algorithms'])
    const kdfEntries = parseFlatProvidedList(kdfRaw, 'kdf-algorithms')
    expect(kdfEntries.some((e) => e.aliases.includes('HKDF'))).toBe(true)
    expect(kdfEntries.find((e) => e.aliases.includes('HKDF'))?.family).toBe('kdf')
    expect(kdfEntries.some((e) => e.aliases.includes('SCRYPT'))).toBe(true)

    const macRaw = await runList(['list', '-mac-algorithms'])
    const macEntries = parseFlatProvidedList(macRaw, 'mac-algorithms')
    expect(macEntries.some((e) => e.aliases.includes('HMAC'))).toBe(true)
    expect(macEntries.find((e) => e.aliases.includes('HMAC'))?.family).toBe('hash-hmac')
  })

  it('parseLegacySection captures digest/cipher legacy names without crashing on inconsistent shapes', async () => {
    const raw = await runList(['list', '-digest-algorithms'])
    const legacy = parseLegacySection(raw, 'digest-algorithms')
    expect(legacy.length).toBeGreaterThan(10)
    expect(legacy.every((e) => e.provider === 'legacy')).toBe(true)
    expect(legacy.some((e) => e.name === 'SHA256')).toBe(true)
  })

  it('classifyFamily recognizes representative names from every family', () => {
    expect(classifyFamily(['ML-DSA-65'])).toBe('pqc')
    expect(classifyFamily(['X25519MLKEM768'])).toBe('pqc')
    expect(classifyFamily(['MLDSA44-RSA2048-PSS-SHA256'])).toBe('pqc')
    expect(classifyFamily(['RSA', 'rsaEncryption'])).toBe('classical-asymmetric')
    expect(classifyFamily(['AES-256-GCM'])).toBe('symmetric')
    expect(classifyFamily(['SHA256'])).toBe('hash-hmac')
    expect(classifyFamily(['HMAC'])).toBe('hash-hmac')
    expect(classifyFamily(['HKDF'])).toBe('kdf')
    expect(classifyFamily(['totally-unknown-thing'])).toBe('other')
  })
})

describe('provider-honesty probe — RED-FIRST: pkcs11 must currently fail', () => {
  it('default provider probes as genuinely functional', async () => {
    const files = new Map<string, Uint8Array>()
    const run = async (cmd: string) => {
      const args = parseOpensslArgs(cmd)
      const M = await newModule({ quiet: true })
      for (const [name, data] of files) writeFile(M, `/${name}`, data)
      const r = runOpenssl(M, args)
      if (r.rc !== 0) throw new Error(r.stderr.trim() || `exit ${r.rc}`)
      return { stdout: r.stdout }
    }
    const result = await probeProviderFunctional(run, 'default', 'RSA')
    expect(result.functional, result.error).toBe(true)
  })

  it('pkcs11 provider probes as NOT functional — registered but Module initialization failed', async () => {
    const run = async (cmd: string) => {
      const M = await newModule({ quiet: true })
      const args = parseOpensslArgs(cmd)
      const r = runOpenssl(M, args)
      if (r.rc !== 0) throw new Error(r.stderr.trim() || `exit ${r.rc}`)
      return { stdout: r.stdout }
    }
    const result = await probeProviderFunctional(run, 'pkcs11', 'RSA')
    expect(result.functional).toBe(false)
    expect(result.error ?? '').toContain('pkcs11')
  })

  it('pickProbeTarget prefers RSA when a provider registers it', async () => {
    const raw = await runList(['list', '-public-key-algorithms'])
    const entries = parseKeyManagersSection(raw)
    expect(pickProbeTarget(entries, 'pkcs11')).toBe('RSA')
    expect(pickProbeTarget(entries, 'default')).toBe('RSA')
  })
})
