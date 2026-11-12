// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'
import { createPublicKey, verify } from 'node:crypto'
import path from 'node:path'
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js'
import * as S from './softhsm'
import { SshEngine, type SshHandshakeConfig } from './openssh'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'

const require_ = createRequire(import.meta.url)
async function cpp(): Promise<SoftHSMModule> {
  const glue = path.resolve(process.cwd(), 'src/vendor/softhsm-wasm/wasm/softhsm.js')
  return require_(glue)({
    locateFile: (p: string) =>
      p.endsWith('.wasm') ? path.join(path.dirname(glue), 'softhsm.wasm') : p,
  })
}
type Fault =
  | 'none'
  | 'ciphertext'
  | 'wrong-kem-key'
  | 'wrong-ec-key'
  | 'transcript'
  | 'signature'
  | 'short-signature'
  | 'wrong-signing-key'
  | 'device-error'
  | 'final-error'
const defaults: SshHandshakeConfig = { kex: 'mlkem768-curve25519-sha256', hostKey: 'ssh-mldsa-65' }

describe.each([
  ['Rust', S.getSoftHSMRustModule],
  ['C++', cpp],
] as const)('Executed SSH model checks (%s)', (_name, load) => {
  async function run(fault: Fault = 'none', config: SshHandshakeConfig = defaults) {
    const M = await load()
    S.hsm_initialize(M)
    const slot = S.hsm_initToken(M, S.hsm_getFirstFreeSlot(M), '12345678', 'SSH sample checks')
    const h = S.hsm_openUserSession(M, slot, '12345678', 'user1234')
    const wrongKem = fault === 'wrong-kem-key' ? S.hsm_generateMLKEMKeyPair(M, h, 768, false) : null
    const wrongEc = fault === 'wrong-ec-key' ? S.hsm_generateECKeyPair(M, h, 'X25519', false) : null
    const wrongSign =
      fault === 'wrong-signing-key' ? S.hsm_generateMLDSAKeyPair(M, h, 65, false) : null
    let derives = 0,
      verifyKey = 0,
      decaps = 0
    const checks: Array<{ valid: boolean; rv: number }> = []
    const proxy = new Proxy(M, {
      get(target, property) {
        const value = Reflect.get(target, property)
        if (typeof value !== 'function') return value
        return (...input: number[]) => {
          const args = [...input]
          const argument = (index: number) => {
            const value = args.at(index)
            if (value === undefined) throw new Error('Missing verification test argument')
            return value
          }
          let temporary = 0
          try {
            if (property === '_C_DeriveKey' && ++derives === 2 && wrongEc)
              args[2] = wrongEc.privHandle
            if (property === '_C_DecapsulateKey') {
              decaps++
              if (wrongKem) args[2] = wrongKem.privHandle
              if (fault === 'ciphertext') {
                const altered = target.HEAPU8.slice(args[5], args[5] + args[6])
                altered[0] ^= 1
                temporary = target._malloc(altered.length)
                target.HEAPU8.set(altered, temporary)
                args[5] = temporary
              }
            }
            if (property === '_C_MessageVerifyFinal' && fault === 'final-error') {
              Reflect.apply(value, target, args)
              return 0x30
            }
            if (property === '_C_MessageVerifyInit' || property === '_C_VerifyInit') {
              if (wrongSign) args[2] = wrongSign.pubHandle
              verifyKey = args[2]
            }
            if (property === '_C_VerifyMessage' || property === '_C_Verify') {
              const modern = property === '_C_VerifyMessage',
                msgIndex = modern ? 3 : 1,
                sigIndex = modern ? 5 : 3,
                lenIndex = modern ? 6 : 4
              if (fault === 'transcript' || fault === 'signature') {
                const index = fault === 'transcript' ? msgIndex : sigIndex
                const length = argument(fault === 'transcript' ? msgIndex + 1 : lenIndex)
                const altered = target.HEAPU8.slice(argument(index), argument(index) + length)
                altered[0] ^= 1
                temporary = target._malloc(altered.length)
                target.HEAPU8.set(altered, temporary)
                args.splice(index, 1, temporary)
              }
              if (fault === 'short-signature') args.splice(lenIndex, 1, argument(lenIndex) - 1)
              if (fault === 'device-error') return 0x30
              const message = target.HEAPU8.slice(
                argument(msgIndex),
                argument(msgIndex) + argument(msgIndex + 1)
              )
              const signature = target.HEAPU8.slice(
                argument(sigIndex),
                argument(sigIndex) + argument(lenIndex)
              )
              let valid = false
              if (config.hostKey === 'ssh-ed25519') {
                const point = S.hsm_extractECPoint(target, h, verifyKey),
                  raw = point.length === 34 ? point.slice(2) : point
                const publicKey = createPublicKey({
                  format: 'der',
                  type: 'spki',
                  key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), raw]),
                })
                valid = verify(null, message, publicKey, signature)
              } else if (config.hostKey === 'ssh-mldsa-65') {
                valid = ml_dsa65.verify(
                  signature,
                  message,
                  S.hsm_extractKeyValue(target, h, verifyKey)
                )
              }
              const rv = Number(Reflect.apply(value, target, args)) >>> 0
              if (config.hostKey === 'ssh-ed25519' || config.hostKey === 'ssh-mldsa-65')
                checks.push({ valid, rv })
              return rv
            }
            return Reflect.apply(value, target, args)
          } finally {
            if (temporary) target._free(temporary)
          }
        }
      },
    })
    try {
      const engine = new SshEngine()
      engine.bindHsm({ module: proxy, hSession: h })
      const result = await engine.runHandshake(config)
      return { result, checks, decaps }
    } finally {
      S.hsm_finalize(M, h)
    }
  }
  it.each([
    { kex: 'curve25519-sha256', hostKey: 'ssh-ed25519' },
    defaults,
    { kex: 'mlkem768', hostKey: 'ssh-mldsa-65' },
    { kex: 'mlkem512-nistp256-sha256', hostKey: 'ssh-mldsa-65' },
    { kex: 'mlkem768-curve25519-sha256', hostKey: 'ssh-slh-dsa-sha2-128s' },
  ] as SshHandshakeConfig[])(
    'executes matching secrets and both signature checks for $kex/$hostKey',
    async (config) => {
      const { result, checks, decaps } = await run('none', config)
      expect(result.error).toBeUndefined()
      expect(result.connection_ok).toBe(true)
      expect(result.operation_checks).toEqual({
        outcome: 'passed',
        shared_secret_equal: true,
        host_signature_valid: true,
        client_signature_valid: true,
      })
      expect(decaps).toBe(config.kex === 'curve25519-sha256' ? 0 : 1)
      if (config.hostKey === 'ssh-ed25519' || config.hostKey === 'ssh-mldsa-65')
        expect(checks).toEqual([
          { valid: true, rv: 0 },
          { valid: true, rv: 0 },
        ])
    },
    30000
  )
  it.each(['ciphertext', 'wrong-kem-key'] as const)(
    'actual %s input cannot produce model success',
    async (fault) => {
      const { result } = await run(fault)
      expect(result.connection_ok).toBe(false)
      expect(result.operation_checks?.outcome).toBe('failed')
      expect(result.operation_checks?.shared_secret_equal).toBe(false)
      expect(result.wire_packets).toEqual([])
    },
    30000
  )
  it('actual wrong classical peer key produces unequal secrets rather than assumed equality', async () => {
    const { result, checks } = await run('wrong-ec-key', {
      kex: 'curve25519-sha256',
      hostKey: 'ssh-ed25519',
    })
    expect(result.connection_ok).toBe(false)
    expect(result.operation_checks?.shared_secret_equal).toBe(false)
    expect(checks).toHaveLength(2)
    expect(checks.every((c) => !c.valid && c.rv === 0xc0)).toBe(true)
  }, 30000)
  it.each(['transcript', 'signature', 'short-signature', 'wrong-signing-key'] as const)(
    'actual %s is rejected by both the token and independent verifier',
    async (fault) => {
      const { result, checks } = await run(fault)
      expect(result.connection_ok).toBe(false)
      expect(result.operation_checks).toEqual({
        outcome: 'failed',
        shared_secret_equal: true,
        host_signature_valid: false,
        client_signature_valid: false,
      })
      expect(checks).toHaveLength(2)
      expect(checks.every((c) => !c.valid && (c.rv === 0xc0 || c.rv === 0xc1))).toBe(true)
    },
    30000
  )
  it.each(['device-error', 'final-error'] as const)(
    'an injected %s RV is incomplete/error, never a passed invalid-signature check',
    async (fault) => {
      const { result, checks } = await run(fault)
      if (fault === 'final-error') expect(checks).toEqual([{ valid: true, rv: 0 }])
      else expect(checks).toEqual([])
      expect(result.connection_ok).toBe(false)
      expect(result.operation_checks).toEqual({
        outcome: 'error',
        shared_secret_equal: true,
        host_signature_valid: null,
        client_signature_valid: null,
      })
      expect(result.error).toContain('Verification operation error 0x30')
    },
    30000
  )
})
