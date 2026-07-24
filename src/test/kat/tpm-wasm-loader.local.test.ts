// SPDX-License-Identifier: GPL-3.0-only
//
// WS0(b) spike result, kept as a living guarantee: the shipped pqctpm WASM
// (public/wasm/pqctpm.{js,wasm}) loads and executes inside vitest via the
// same UMD-sandbox pattern src/test/kat/openssl-driver.ts established for
// openssl.wasm. This is the loader the Phase 1 curriculum engine-replay
// tests (tpmLessons.local.test.ts) build on — if this breaks, those break,
// so it pins: module instantiation, tpm_wasm_startup, a real
// GetCapability(ALGS) round trip (PQC + classical algorithm IDs), and a
// real classical RSA CreatePrimary→Sign (proving the classical path the
// curriculum's classical cards rely on works headless, not just in the
// browser).
//
// Venue: `*.local.test.ts` per the 2026-07-01 new-test-suite convention —
// local gate only, not CI.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { describe, it, expect, beforeAll } from 'vitest'

const REPO_ROOT = process.cwd() // vitest's import.meta.url is not file:// — use cwd (openssl-driver.ts precedent)
const WASM_DIR = join(REPO_ROOT, 'public', 'wasm')

interface PqcTpmModule {
  cwrap: (name: string, ret: string | null, args: string[]) => (...a: unknown[]) => number
  HEAPU8: Uint8Array
  _malloc: (n: number) => number
  _free: (p: number) => void
}
type Factory = (cfg: {
  locateFile: (p: string) => string
  print: (t: string) => void
  printErr: (t: string) => void
}) => Promise<PqcTpmModule>

function loadFactory(): Factory {
  // pqctpm.js is UMD (module.exports = PqcTpmModule). Evaluate it in a
  // plain CommonJS sandbox so Vite's require-interception can't break it.
  const src = readFileSync(join(WASM_DIR, 'pqctpm.js'), 'utf-8')
  const shimModule: { exports: unknown } = { exports: {} }
  const shimRequire = createRequire(`file://${join(REPO_ROOT, 'package.json')}`)
  const wrapped = new Function('module', 'exports', 'require', '__dirname', '__filename', src)
  wrapped(shimModule, shimModule.exports, shimRequire, WASM_DIR, join(WASM_DIR, 'pqctpm.js'))
  return shimModule.exports as Factory
}

// wire helpers (big-endian)
const p16 = (a: number[], v: number) => a.push((v >> 8) & 0xff, v & 0xff)
const p32 = (a: number[], v: number) =>
  a.push((v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff)
const g16 = (b: Uint8Array, o: number) => (b[o] << 8) | b[o + 1]
const g32 = (b: Uint8Array, o: number) =>
  ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0
const patchSize = (a: number[]) => {
  const t = a.length
  a[2] = (t >>> 24) & 0xff
  a[3] = (t >>> 16) & 0xff
  a[4] = (t >>> 8) & 0xff
  a[5] = t & 0xff
}

describe('pqctpm WASM loads and executes under vitest (WS0(b) guarantee)', () => {
  let exec: (cmd: Uint8Array) => Uint8Array

  beforeAll(async () => {
    const factory = loadFactory()
    const mod = await factory({
      locateFile: (p) => (p.endsWith('.wasm') ? join(WASM_DIR, 'pqctpm.wasm') : p),
      print: () => {},
      printErr: () => {},
    })
    const startup = mod.cwrap('tpm_wasm_startup', 'number', ['string'])
    expect(startup('')).toBe(0)
    const proc = mod.cwrap('tpm_wasm_process', 'number', ['number', 'number', 'number', 'number'])
    exec = (cmd: Uint8Array) => {
      const inPtr = mod._malloc(cmd.length)
      mod.HEAPU8.set(cmd, inPtr)
      const outPtr = mod._malloc(8192)
      const n = proc(inPtr, cmd.length, outPtr, 8192)
      const out = n > 0 ? new Uint8Array(mod.HEAPU8.buffer, outPtr, n).slice() : new Uint8Array(0)
      mod._free(inPtr)
      mod._free(outPtr)
      return out
    }
  }, 60_000)

  it('GetCapability(ALGS) reports both PQC and classical algorithms', () => {
    const a: number[] = []
    p16(a, 0x8001)
    p32(a, 0)
    p32(a, 0x17a)
    p32(a, 0) // TPM_CAP_ALGS
    p32(a, 0)
    p32(a, 128)
    patchSize(a)
    const r = exec(new Uint8Array(a))
    expect(g32(r, 6)).toBe(0)
    const count = g32(r, 15)
    const algs: number[] = []
    for (let i = 0; i < count; i++) algs.push(g16(r, 19 + i * 6))
    expect(algs).toContain(0x00a0) // TPM_ALG_MLKEM
    expect(algs).toContain(0x00a1) // TPM_ALG_MLDSA
    expect(algs).toContain(0x0001) // TPM_ALG_RSA
    expect(algs).toContain(0x0023) // TPM_ALG_ECC
  })

  it('classical RSA-2048 CreatePrimary → TPM2_Sign works headless', () => {
    // Unrestricted RSA-2048 signing key under Owner (TpmTypes.h-verified constants)
    const a: number[] = []
    p16(a, 0x8002)
    p32(a, 0)
    p32(a, 0x131) // CreatePrimary
    p32(a, 0x40000001) // RH_OWNER
    p32(a, 9)
    p32(a, 0x40000009)
    p16(a, 0)
    a.push(0)
    p16(a, 0)
    p16(a, 4)
    p16(a, 0)
    p16(a, 0)
    const szIdx = a.length
    p16(a, 0)
    const pubStart = a.length
    p16(a, 0x0001) // TPM_ALG_RSA
    p16(a, 0x000b) // SHA-256 nameAlg
    p32(a, 0x2 | 0x10 | 0x20 | 0x40 | 0x40000) // fixedTPM|fixedParent|sensOrigin|userAuth|sign
    p16(a, 0)
    p16(a, 0x0010) // symmetric NULL
    p16(a, 0x0010) // scheme NULL
    p16(a, 2048)
    p32(a, 0)
    p16(a, 0) // unique empty
    const pubSize = a.length - pubStart
    a[szIdx] = (pubSize >> 8) & 0xff
    a[szIdx + 1] = pubSize & 0xff
    p16(a, 0)
    p32(a, 0)
    patchSize(a)
    const cr = exec(new Uint8Array(a))
    expect(g32(cr, 6)).toBe(0)
    const handle = g32(cr, 10)

    const s: number[] = []
    p16(s, 0x8002)
    p32(s, 0)
    p32(s, 0x15d) // TPM2_Sign
    p32(s, handle)
    p32(s, 9)
    p32(s, 0x40000009)
    p16(s, 0)
    s.push(0)
    p16(s, 0)
    p16(s, 32)
    for (let i = 0; i < 32; i++) s.push(0xbb)
    p16(s, 0x0014) // RSASSA
    p16(s, 0x000b) // SHA-256
    p16(s, 0x8024) // NULL hashcheck ticket
    p32(s, 0x40000007)
    p16(s, 0)
    patchSize(s)
    const sr = exec(new Uint8Array(s))
    expect(g32(sr, 6)).toBe(0)
    const sigAlg = g16(sr, 14)
    const sigSize = g16(sr, 18)
    expect(sigAlg).toBe(0x0014)
    expect(sigSize).toBe(256) // RSA-2048 signature
  }, 30_000)
})
