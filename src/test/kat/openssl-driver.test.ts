// SPDX-License-Identifier: GPL-3.0-only
/**
 * openssl-driver smoke test — confirms public/wasm/openssl.wasm loads
 * in vitest's Node environment and the `openssl version` command runs
 * end-to-end. If this fails, every downstream crypto-primitive KAT
 * fails too — keeping it as a separate file with a focused assertion.
 */
import { describe, expect, it } from 'vitest'
import { newModule, runOpenssl, readWasmBytes } from './openssl-driver'

describe('openssl-driver — Node-mode WASM loading', () => {
  it('public/wasm/openssl.wasm is a real WASM binary (not a placeholder)', () => {
    const bytes = readWasmBytes()
    // Every WASM binary starts with the 8-byte magic '\0asm\x01\x00\x00\x00'.
    expect(bytes[0]).toBe(0x00)
    expect(bytes[1]).toBe(0x61) // 'a'
    expect(bytes[2]).toBe(0x73) // 's'
    expect(bytes[3]).toBe(0x6d) // 'm'
    expect(bytes.length).toBeGreaterThan(1_000_000) // >1 MB — sanity
  })

  it('loads the openssl WASM module in Node and runs `openssl version`', async () => {
    const M = await newModule({ quiet: true })
    const { rc, stdout } = runOpenssl(M, ['version'])
    expect(rc).toBe(0)
    expect(stdout).toMatch(/OpenSSL\s+3\./)
  }, 60_000) // generous timeout — first WASM load on a cold cache is slow

  it('runs `openssl list -providers` and reports the default provider', async () => {
    const M = await newModule({ quiet: true })
    const { rc, stdout } = runOpenssl(M, ['list', '-providers'])
    expect(rc).toBe(0)
    expect(stdout.toLowerCase()).toContain('default')
  }, 60_000)
})
