// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection -- fixed-length byte buffers and small enum tables indexed by validated integers */
//
// Profile C end to end through the real OpenSSL wasm engine: assemble the PSC1 project sample
// envelope, then run the SIDF step on its bytes alone. Before the SIDF step every value derived on
// the sender side is deleted, so a recovered SUPI can only have come from the received bytes and
// the home network's own private keys.
//
//   npx vitest run --config vitest.local.config.ts \
//     src/components/PKILearning/modules/FiveG/services/ops/SucOps.profileC.local.test.ts
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { FiveGService } from '../FiveGService'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { WasmAdapter } from '../__tests__/WasmAdapter'
import { PSC1_FORMAT_LABEL } from '../pscEnvelope'

vi.mock('@/services/crypto/OpenSSLService', () => ({
  openSSLService: {
    execute: vi.fn(),
    deleteFile: vi.fn().mockResolvedValue(undefined),
    init: vi.fn().mockResolvedValue(undefined),
  },
}))

const SUPI = '310260123456789'

async function senderThroughAssembly(mode: 'hybrid' | 'pure') {
  const service = new FiveGService()
  service.state.supi = SUPI
  const hn = await service.generateNetworkKey('C', mode)
  const eph = await service.generateEphemeralKey('C', mode)
  await service.computeSharedSecret('C', eph.privKey, hn.pubKeyFile, mode)
  await service.deriveKeys('C')
  await service.encryptMSIN()
  expect(await service.computeMAC()).toContain('[SUCCESS]')
  const structure = await service.visualizeStructure()
  const assembled = await service.assembleSUCI('C')
  return { service, structure, assembled }
}

const flipHexByte = (hex: string, byteOffset: number) => {
  const bytes = hex.match(/../g)!
  bytes[byteOffset] = (parseInt(bytes[byteOffset], 16) ^ 1).toString(16).padStart(2, '0')
  return bytes.join('')
}

const forgetSenderState = (service: FiveGService) => {
  for (const key of [
    'sharedSecretHex',
    'kEncHex',
    'kMacHex',
    'encryptedMSINHex',
    'macTagHex',
    'ciphertextHex',
    'ephemeralPubKeyHex',
    'ephPrivHex',
    'cipherFile',
  ] as const)
    delete service.state[key]
}

describe('Profile C PSC1 envelope through the OpenSSL engine', () => {
  beforeAll(async () => {
    const wasm = new WasmAdapter()
    await wasm.init()
    vi.mocked(openSSLService.execute).mockImplementation(async (cmd, files = []) => {
      const res = await wasm.execute(cmd, files)
      return {
        stdout: res.stdout,
        stderr: res.stderr,
        files: res.files,
        error: res.stderr && res.stderr.includes('error') ? res.stderr : undefined,
      }
    })
  })

  it.each([
    ['pure', 1116],
    ['hybrid', 1148],
  ] as const)(
    '%s: assembles %i bytes and the SIDF recovers the SUPI from those bytes alone',
    async (mode, total) => {
      const { service, structure, assembled } = await senderThroughAssembly(mode)
      expect(service.state.psc1WireHex!.length / 2).toBe(total)
      expect(assembled).toContain(PSC1_FORMAT_LABEL)
      expect(assembled).toContain(`${total} bytes`)
      expect(structure).toContain(PSC1_FORMAT_LABEL)
      expect(assembled).not.toMatch(/suci-0-/)
      forgetSenderState(service)
      const result = await service.sidfDecrypt('C')
      expect(result).toContain(`[SUCCESS] SUPI Recovered: ${SUPI}`)
      expect(result).toContain('[OK] MAC VALID')
    },
    120_000
  )

  it('the hybrid envelope carries the ephemeral key the receiver uses for ECDH', async () => {
    const { service } = await senderThroughAssembly('hybrid')
    const wire = service.state.psc1WireHex!
    const ephemeral = wire.slice(15 * 2, 47 * 2)
    expect(ephemeral).toHaveLength(64)
    forgetSenderState(service)
    // Replace the ephemeral key with a different valid-length value: ECDH changes, MAC fails.
    service.state.psc1WireHex = flipHexByte(wire, 15)
    expect(await service.sidfDecrypt('C')).toContain('[REJECTED')
  }, 120_000)

  it.each(['pure', 'hybrid'] as const)(
    '%s: any altered, truncated or extended envelope is rejected and no SUPI is produced',
    async (mode) => {
      const { service } = await senderThroughAssembly(mode)
      const wire = service.state.psc1WireHex!
      const length = wire.length / 2
      forgetSenderState(service)
      const variants: Record<string, string> = {
        'header byte': flipHexByte(wire, 5),
        'first component': flipHexByte(wire, 15),
        'MSIN ciphertext': flipHexByte(wire, length - 9),
        tag: flipHexByte(wire, length - 1),
        truncated: wire.slice(0, -2),
        trailing: `${wire}00`,
      }
      for (const [name, altered] of Object.entries(variants)) {
        service.state.psc1WireHex = altered
        const result = await service.sidfDecrypt('C')
        expect(result, name).toContain('[REJECTED')
        expect(result, name).not.toContain('[SUCCESS]')
        expect(result, name).not.toContain(SUPI.slice(6))
      }
      service.state.psc1WireHex = wire
      expect(await service.sidfDecrypt('C')).toContain('[SUCCESS]')
    },
    240_000
  )

  it('refuses to run before an envelope exists', async () => {
    const service = new FiveGService()
    service.state.supi = SUPI
    expect(await service.sidfDecrypt('C')).toContain('no PSC1 envelope')
  })

  it('the MAC step refuses to run without the KEM ciphertext instead of inventing one', async () => {
    const { service } = await senderThroughAssembly('pure')
    delete service.state.ciphertextHex
    expect(await service.computeMAC()).toContain('[Error]')
  }, 120_000)
})
