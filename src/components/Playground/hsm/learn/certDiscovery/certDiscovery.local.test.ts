// SPDX-License-Identifier: GPL-3.0-only
//
// Replays the "Discovering certificates" lesson's engine work against a
// FRESH Rust softhsmrustv3 instance (vitest gives every test file its own
// module graph, so this engine shares nothing with other suites) — the same
// isolation the lesson gets from its dedicated Web Worker in the browser.
//
// Venue: `*.local.test.ts` — run by the local gate, not CI.
import { describe, it, expect } from 'vitest'
import * as shim from '@/wasm/softhsmrustv3.js'
import {
  FIXTURE,
  LONG_FLOW_BATCH,
  nameToString,
  provisionFixture,
  runLongFlow,
  runShortFlow,
  x509Subject,
  type DiscoveryEngine,
} from './certDiscoveryCore'
import { LESSON_CERTS_DER_HEX } from './lessonCerts'

const engine: DiscoveryEngine = {
  ...(shim as unknown as DiscoveryEngine),
  memory: () =>
    (shim as unknown as { __wbg_get_memory: () => WebAssembly.Memory }).__wbg_get_memory(),
}

const fromHex = (h: string) => Uint8Array.from(h.match(/../g)!, (x) => parseInt(x, 16))
const count = (r: { counts: [string, number][] }, fn: string) =>
  r.counts.find(([f]) => f === fn)?.[1] ?? 0

describe('certificate-discovery lesson (fresh Rust engine)', () => {
  it('extracts the subject Name from each fixture certificate', () => {
    LESSON_CERTS_DER_HEX.forEach((h, i) => {
      expect(nameToString(x509Subject(fromHex(h)))).toBe(`O=PQC Today, CN=Lesson Cert ${i}`)
    })
  })

  it('provisions, then both flows return the same certificates at the expected cost', () => {
    const p = provisionFixture(engine, LESSON_CERTS_DER_HEX)
    expect(p.slots).toHaveLength(FIXTURE.slots)
    expect(p.calls.every((c) => c.rv === 0)).toBe(true)

    const S = FIXTURE.slots
    const C = FIXTURE.certsPerSlot
    const certs = S * C

    const short = runShortFlow(engine)
    expect(short.rows).toHaveLength(certs)
    expect(short.rows.every((r) => r.rv === 0)).toBe(true)
    // 3 + 3·S + C·S: Initialize, one pre-sized GetSlotList, per slot
    // OpenSession + FindObjectsInit + FindObjects, one GetAttributeValue per
    // certificate, Finalize.
    expect(short.calls).toHaveLength(3 + 3 * S + certs)
    expect(count(short, 'C_GetSlotList')).toBe(1)
    expect(count(short, 'C_GetAttributeValue')).toBe(certs)

    const long = runLongFlow(engine)
    // The size query adds one spare, uninitialized slot; the long flow sees
    // and skips it.
    expect(long.slots).toHaveLength(S + 1)
    expect(long.skipped).toHaveLength(1)
    const batches = Math.floor(C / LONG_FLOW_BATCH) + 1 + (C % LONG_FLOW_BATCH ? 1 : 0)
    expect(count(long, 'C_GetSlotList')).toBe(2)
    expect(count(long, 'C_GetTokenInfo')).toBe(S + 1)
    expect(count(long, 'C_FindObjects')).toBe(S * batches)
    expect(count(long, 'C_GetAttributeValue')).toBe(2 * certs)
    expect(count(long, 'C_CloseSession')).toBe(S)
    expect(long.calls.every((c) => c.rv === 0)).toBe(true)

    // Same answer.
    expect(long.rows).toEqual(short.rows)
    short.rows.forEach((r) => {
      const [s, i] = [r.id.slice(0, 2), r.id.slice(2)].map((x) => parseInt(x, 16))
      expect(r.label).toBe(`slot${s}-cert-${i}`)
      expect(r.subject).toBe(`O=PQC Today, CN=Lesson Cert ${i % LESSON_CERTS_DER_HEX.length}`)
    })
    expect(long.calls.length).toBeGreaterThan(short.calls.length)
  })
})
