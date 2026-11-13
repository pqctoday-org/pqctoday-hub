// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection -- engine key is a literal 'cpp' | 'rust' */
//
// The SoftHSM-backed Profile C receiver (the one the SUCI workshop uses when the live HSM is on),
// on both real wasm engines. The sender is built independently with Node and noble from the home
// network's PUBLIC keys read out of the HSM; the receiver gets only the wire bytes and the two
// private-key handles.
//
//   npx vitest run --config vitest.local.config.ts \
//     src/components/PKILearning/modules/FiveG/services/hsmPsc1Receiver.local.test.ts
import {
  createCipheriv,
  createHash,
  createHmac,
  createPublicKey,
  diffieHellman,
  generateKeyPairSync,
} from 'node:crypto'
import { createRequire } from 'node:module'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { ml_kem768 } from '@noble/post-quantum/ml-kem.js'
import * as SoftHSM from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import { HOME_NETWORK } from './homeNetwork'
import { hsmPsc1Receiver } from './hsmPsc1Receiver'
import {
  assemblePsc1,
  bcdEncodeMsin,
  buildPsc1MacInput,
  recoverPsc1,
  type Psc1Header,
  type Psc1Mode,
} from './pscEnvelope'

const require_ = createRequire(import.meta.url)
const CPP_GLUE = path.resolve(process.cwd(), 'src/vendor/softhsm-wasm/wasm/softhsm.js')
const CPP_WASM = path.join(path.dirname(CPP_GLUE), 'softhsm.wasm')
const loadCpp = async (): Promise<SoftHSMModule> => {
  const create = require_(CPP_GLUE) as (arg?: Record<string, unknown>) => Promise<SoftHSMModule>
  return create({ locateFile: (p: string) => (p.endsWith('.wasm') ? CPP_WASM : p) })
}

const bytes = (v: Uint8Array | Buffer) => new Uint8Array(v)
const concat = (...parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}
const sha256 = (d: Uint8Array) => bytes(createHash('sha256').update(d).digest())
const sha3 = (d: Uint8Array) => bytes(createHash('sha3-256').update(d).digest())
const counter = (n: number) => Uint8Array.of(0, 0, 0, n)
const SPKI = Buffer.from('302a300506032b656e032100', 'hex')
const MSIN = '123456789'

interface Engine {
  M: SoftHSMModule
  hSession: number
  kemPriv: number
  eccPriv: number
  kemPub: Uint8Array
  eccPub: Uint8Array
}

const open = (M: SoftHSMModule): Engine => {
  SoftHSM.hsm_initialize(M)
  const slot = SoftHSM.hsm_initToken(M, SoftHSM.hsm_getFirstFreeSlot(M), '1234', 'PSC1')
  const hSession = SoftHSM.hsm_openUserSession(M, slot, '1234', '1234')
  const kem = SoftHSM.hsm_generateMLKEMKeyPair(M, hSession, 768, false)
  const ecc = SoftHSM.hsm_generateECKeyPair(M, hSession, 'X25519', false, 'x25519')
  const point = SoftHSM.hsm_extractECPoint(M, hSession, ecc.pubHandle)
  return {
    M,
    hSession,
    kemPriv: kem.privHandle,
    eccPriv: ecc.privHandle,
    kemPub: SoftHSM.hsm_extractKeyValue(M, hSession, kem.pubHandle),
    eccPub: point.slice(point.length - 32), // raw 32-byte key (the attribute may be DER-wrapped)
  }
}

/** Independent sender for the HSM's public keys. */
function send(
  engine: Engine,
  mode: Psc1Mode,
  header: Psc1Header = { ...HOME_NETWORK, mode, routingIndicator: '0' }
) {
  const enc = ml_kem768.encapsulate(engine.kemPub, new Uint8Array(32).fill(5 + mode))
  let z = enc.sharedSecret
  let ephemeral = new Uint8Array(0)
  if (mode === 2) {
    const pair = generateKeyPairSync('x25519')
    ephemeral = bytes(pair.publicKey.export({ format: 'der', type: 'spki' }).subarray(12))
    const peer = createPublicKey({
      key: Buffer.concat([SPKI, engine.eccPub]),
      format: 'der',
      type: 'spki',
    })
    z = sha256(concat(bytes(diffieHellman({ privateKey: pair.privateKey, publicKey: peer })), z))
  }
  const kEnc = sha3(concat(z, counter(1), ephemeral))
  const kMac = sha3(concat(z, counter(2), ephemeral))
  const cipher = createCipheriv('aes-256-ctr', kEnc, Buffer.alloc(16))
  const msinCiphertext = bytes(Buffer.concat([cipher.update(bcdEncodeMsin(MSIN)), cipher.final()]))
  const macInput = buildPsc1MacInput(header, {
    ephemeralPublicKey: ephemeral,
    kemCiphertext: enc.cipherText,
    msinCiphertext,
  })
  const tag = bytes(createHmac('sha3-256', kMac).update(macInput).digest()).slice(0, 8)
  return assemblePsc1(macInput, tag)
}

describe.each(['cpp', 'rust'] as const)('HSM Profile C receiver on the %s engine', (name) => {
  let engine: Engine
  beforeAll(async () => {
    const M =
      name === 'cpp' ? await loadCpp() : ((await SoftHSM.getSoftHSMRustModule()) as SoftHSMModule)
    engine = open(M)
  }, 120_000)

  const receiver = () =>
    hsmPsc1Receiver(engine.M, engine.hSession, {
      mlKemPrivHandle: engine.kemPriv,
      x25519PrivHandle: engine.eccPriv,
    })

  it.each([1, 2] as const)('mode %i: recovers the MSIN from the bytes alone', async (mode) => {
    const recovery = await recoverPsc1(send(engine, mode), receiver(), HOME_NETWORK)
    expect(recovery.msinDigits).toBe(MSIN)
  })

  it.each([1, 2] as const)(
    'mode %i: an altered byte is refused before decryption',
    async (mode) => {
      const wire = send(engine, mode)
      for (const offset of [15, wire.length - 9, wire.length - 1]) {
        const altered = new Uint8Array(wire)
        altered[offset] ^= 1
        await expect(recoverPsc1(altered, receiver(), HOME_NETWORK)).rejects.toThrow(/MAC refused/)
      }
    }
  )

  it('a foreign PLMN is refused although the HSM keys and MAC are valid', async () => {
    const foreign = send(engine, 2, { ...HOME_NETWORK, mnc: '990', mode: 2, routingIndicator: '0' })
    await expect(recoverPsc1(foreign, receiver(), HOME_NETWORK)).rejects.toThrow(/PLMN/)
  })

  it('the pure receiver does not need an X25519 key handle; the hybrid one refuses without it', async () => {
    const noEcc = hsmPsc1Receiver(engine.M, engine.hSession, { mlKemPrivHandle: engine.kemPriv })
    expect((await recoverPsc1(send(engine, 1), noEcc, HOME_NETWORK)).msinDigits).toBe(MSIN)
    await expect(recoverPsc1(send(engine, 2), noEcc, HOME_NETWORK)).rejects.toThrow(/X25519/)
  })
})
