// SPDX-License-Identifier: AGPL-3.0-only
/**
 * PKCS#11 call-log grouping and the RFC 5649 published-vector runner.
 *
 *  - The call-log panel starts a new section at every step header, so a header written AFTER its
 *    calls labels the NEXT step's calls (the C_GenerateKeyPair of "Step 2" sat under "Step 1", and
 *    two C_WrapKey calls sat under "Step 2"). The first test drives a full run with the HSM calls
 *    stubbed and checks that every call is preceded by its own step's header.
 *  - The second group runs runPublishedKwpVectors with a stand-in HSM whose wrap and unwrap are
 *    computed by Node's OpenSSL AES-KWP, so the comparison logic is exercised against an
 *    independent implementation: it must pass on the published vectors and fail on a wrong one.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { createCipheriv, createDecipheriv } from 'node:crypto'
import '@testing-library/jest-dom'

const rec = vi.hoisted(() => ({ events: [] as string[] }))

const hsmStub = vi.hoisted(() => ({
  isReady: true,
  phase: 'ready',
  error: null,
  engine: 'rust' as 'cpp' | 'rust',
  moduleRef: { current: {} as object | null },
  slotRef: { current: 0 },
  hSessionRef: { current: 1 },
  keys: [] as unknown[],
  log: [] as unknown[],
  registerKey: vi.fn(),
  removeKey: vi.fn(),
  addStepLog: vi.fn((label: string) => {
    rec.events.push(`HEADER ${label}`)
  }),
  clearKeys: vi.fn(),
  clearLog: vi.fn(),
  initialize: vi.fn(),
  finalize: vi.fn(),
  setEngine: vi.fn(),
}))

// Stand-in key store for the RFC 5649 runner test.
const store = vi.hoisted(() => ({ keys: new Map<number, Uint8Array>(), next: 100 }))

vi.mock('@/hooks/useHSM', () => ({ useHSM: () => hsmStub }))

vi.mock('@/wasm/softhsm', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/wasm/softhsm')>()
  const call = (fn: string) => rec.events.push(`CALL ${fn}`)
  return {
    ...real,
    // --- calls the envelope run makes, each recorded under its PKCS#11 function name ---
    hsm_generateAESKey: vi.fn(() => {
      call('C_GenerateKey')
      return 1
    }),
    hsm_generateMLKEMKeyPair: vi.fn(() => {
      call('C_GenerateKeyPair')
      return { pubHandle: 2, privHandle: 3 }
    }),
    hsm_generateRSAWrapKeyPair: vi.fn(() => {
      call('C_GenerateKeyPair')
      return { pubHandle: 2, privHandle: 3 }
    }),
    hsm_encapsulate: vi.fn(() => {
      call('C_EncapsulateKey')
      return { ciphertextBytes: new Uint8Array(1088), secretHandle: 4 }
    }),
    hsm_importGenericSecret: vi.fn((_m: unknown, _s: unknown, bytes: Uint8Array) => {
      call('C_CreateObject')
      const h = store.next++
      store.keys.set(h, bytes)
      return h
    }),
    hsm_hkdf: vi.fn(() => {
      call('C_DeriveKey')
      return new Uint8Array(32)
    }),
    hsm_importAESKey: vi.fn((_m: unknown, _s: unknown, bytes: Uint8Array) => {
      call('C_CreateObject')
      const h = store.next++
      store.keys.set(h, bytes)
      return h
    }),
    hsm_wrapKeyMech: vi.fn(
      (_m: unknown, _s: unknown, _mech: number, kekH: number, keyH: number) => {
        call('C_WrapKey')
        const kek = store.keys.get(kekH)
        const key = store.keys.get(keyH)
        if (!kek || !key) return new Uint8Array(40)
        const cipher = createCipheriv(
          `id-aes${kek.length * 8}-wrap-pad`,
          kek,
          Buffer.from('A65959A6', 'hex')
        )
        return Uint8Array.from(Buffer.concat([cipher.update(key), cipher.final()]))
      }
    ),
    hsm_rsaOaepWrapKey: vi.fn(() => {
      call('C_WrapKey')
      return new Uint8Array(256)
    }),
    hsm_decapsulate: vi.fn(() => {
      call('C_DecapsulateKey')
      return 7
    }),
    hsm_unwrapKeyMech: vi.fn(
      (_m: unknown, _s: unknown, _mech: number, kekH: number, wrapped: Uint8Array) => {
        call('C_UnwrapKey')
        const kek = store.keys.get(kekH)
        const h = store.next++
        if (kek && kek.length !== 32) {
          const d = createDecipheriv(
            `id-aes${kek.length * 8}-wrap-pad`,
            kek,
            Buffer.from('A65959A6', 'hex')
          )
          store.keys.set(h, Uint8Array.from(Buffer.concat([d.update(wrapped), d.final()])))
        } else {
          store.keys.set(h, new Uint8Array(32))
        }
        return h
      }
    ),
    hsm_rsaOaepUnwrapKey: vi.fn(() => {
      call('C_UnwrapKey')
      return 8
    }),
    hsm_getKeyCheckValue: vi.fn(() => new Uint8Array([1, 2, 3])),
    hsm_extractKeyValue: vi.fn((_m: unknown, _s: unknown, h: number) => {
      return store.keys.get(h) ?? new Uint8Array(32)
    }),
  }
})

import {
  EnvelopeEncryptionDemo,
  RFC5649_SECTION6_VECTORS,
  runPublishedKwpVectors,
  type PublishedKwpVector,
} from './EnvelopeEncryptionDemo'

/**
 * The steps each logged PKCS#11 function may belong to in this workshop. C_CreateObject imports
 * the secret that feeds the next operation, and step 6 derives the wrapping key a second time
 * from the recovered secret, so those two appear under more than one step.
 */
const STEPS_OF_CALL: Record<string, number[]> = {
  C_GenerateKey: [1],
  C_GenerateKeyPair: [2],
  C_EncapsulateKey: [3],
  C_CreateObject: [4, 5, 6],
  C_DeriveKey: [4, 6],
  C_WrapKey: [5],
  C_DecapsulateKey: [6],
  C_UnwrapKey: [6],
}

const headerStep = (e: string): number => {
  const m = /^HEADER ── Step (\d+):/.exec(e)
  if (!m) throw new Error(`not a step header: ${e}`)
  return Number(m[1])
}

/** Pairs every recorded call with the header the log panel would file it under. */
function sectionsOfRun(): { call: string; underStep: number | null }[] {
  let current: number | null = null
  const out: { call: string; underStep: number | null }[] = []
  for (const e of rec.events) {
    if (e.startsWith('HEADER')) current = headerStep(e)
    else if (e.startsWith('CALL ')) out.push({ call: e.slice(5), underStep: current })
  }
  return out
}

describe('envelope workshop call log: each header sits above its own calls', () => {
  beforeEach(() => {
    rec.events.length = 0
    store.keys.clear()
  })

  it('files every ML-KEM-path call under the header of the step that makes it', async () => {
    render(<EnvelopeEncryptionDemo />)
    fireEvent.click(screen.getByRole('button', { name: /Execute \(Live WASM\)/ }))
    await waitFor(() => expect(rec.events.some((e) => e.startsWith('HEADER ── Step 6'))).toBe(true))
    await waitFor(() => expect(screen.getByRole('button', { name: /Execute/ })).toBeEnabled())

    const sections = sectionsOfRun()
    expect(sections.length).toBeGreaterThan(6)
    // The first logged entry is a header, so no call is ever filed under "no step".
    expect(rec.events[0]).toMatch(/^HEADER ── Step 1:/)
    const misfiled = sections
      .filter((s) => !STEPS_OF_CALL[s.call].includes(s.underStep ?? -1))
      .map(
        (s) =>
          `${s.call} filed under step ${s.underStep}, belongs to step ${STEPS_OF_CALL[s.call].join(' or ')}`
      )
    expect(misfiled).toEqual([])
    // The named operations of each step appear in the order the workshop teaches them.
    expect(
      sections.filter((s) => s.call !== 'C_CreateObject').map((s) => `${s.underStep}:${s.call}`)
    ).toEqual([
      '1:C_GenerateKey',
      '2:C_GenerateKeyPair',
      '3:C_EncapsulateKey',
      '4:C_DeriveKey',
      '5:C_WrapKey',
      '6:C_DecapsulateKey',
      '6:C_DeriveKey',
      '6:C_UnwrapKey',
    ])
  })

  it('files every RSA-path call under the header of the step that makes it', async () => {
    render(<EnvelopeEncryptionDemo />)
    fireEvent.click(screen.getByRole('button', { name: 'RSA-2048' }))
    fireEvent.click(screen.getByRole('button', { name: /Execute \(Live WASM\)/ }))
    await waitFor(() => expect(rec.events.some((e) => e.startsWith('HEADER ── Step 4'))).toBe(true))
    await waitFor(() => expect(screen.getByRole('button', { name: /Execute/ })).toBeEnabled())

    // RSA path: 1 generate DEK, 2 generate key pair, 3 wrap, 4 unwrap
    const expected: Record<string, number> = {
      C_GenerateKey: 1,
      C_GenerateKeyPair: 2,
      C_WrapKey: 3,
      C_UnwrapKey: 4,
    }
    const sections = sectionsOfRun()
    expect(sections.map((s) => s.call)).toEqual([
      'C_GenerateKey',
      'C_GenerateKeyPair',
      'C_WrapKey',
      'C_UnwrapKey',
    ])
    const misfiled = sections
      .filter((s) => s.underStep !== expected[s.call])
      .map((s) => `${s.call} filed under step ${s.underStep}, belongs to step ${expected[s.call]}`)
    expect(misfiled).toEqual([])
  })
})

describe('runPublishedKwpVectors (RFC 5649 section 6)', () => {
  beforeEach(() => {
    store.keys.clear()
    rec.events.length = 0
  })
  const fakeModule = {} as never

  it('passes both published vectors against an independent AES-KWP implementation', () => {
    const results = runPublishedKwpVectors(fakeModule, 1)
    expect(results.map((r) => r.id)).toEqual(RFC5649_SECTION6_VECTORS.map((v) => v.id))
    expect(results.filter((r) => !r.pass).map((r) => `${r.id}: ${r.details}`)).toEqual([])
  })

  it('fails when the published ciphertext is wrong (the check compares against a value)', () => {
    const wrong: PublishedKwpVector = {
      ...RFC5649_SECTION6_VECTORS[1],
      id: 'sabotaged',
      wrappedHex: 'afbeb0f07dfbf5419200f2ccb50bb24e', // last nibble changed
    }
    const [r] = runPublishedKwpVectors(fakeModule, 1, [wrong])
    expect(r.pass).toBe(false)
    expect(r.details).toMatch(/wrap gave afbeb0f07dfbf5419200f2ccb50bb24f/)
  })
})
