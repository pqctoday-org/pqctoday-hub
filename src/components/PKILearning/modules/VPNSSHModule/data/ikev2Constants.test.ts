// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  IKE_V2_EXCHANGES,
  IKE_AUTH_SK_BYTES,
  IKE_V2_MODES,
  type IKEv2Message,
  type IKEv2Mode,
} from './ikev2Constants'

const sumMessage = (msg: IKEv2Message): number =>
  msg.payloads.reduce((sum, p) => sum + p.sizeBytes, 0)

const MODES: IKEv2Mode[] = ['classical', 'hybrid', 'pure-pqc']

describe('IKE_V2_EXCHANGES byte accounting', () => {
  for (const mode of MODES) {
    describe(mode, () => {
      const ex = IKE_V2_EXCHANGES[mode]

      it('totalInitiatorBytes equals the sum of all initiator message payloads', () => {
        let expected = sumMessage(ex.ikeSaInit.initiator) + sumMessage(ex.ikeAuth.initiator)
        if (ex.ikeIntermediate) expected += sumMessage(ex.ikeIntermediate.initiator)
        expect(ex.totalInitiatorBytes).toBe(expected)
      })

      it('totalResponderBytes equals the sum of all responder message payloads', () => {
        let expected = sumMessage(ex.ikeSaInit.responder) + sumMessage(ex.ikeAuth.responder)
        if (ex.ikeIntermediate) expected += sumMessage(ex.ikeIntermediate.responder)
        expect(ex.totalResponderBytes).toBe(expected)
      })

      it('totalBytes equals totalInitiatorBytes + totalResponderBytes', () => {
        expect(ex.totalBytes).toBe(ex.totalInitiatorBytes + ex.totalResponderBytes)
      })

      it('roundTrips matches the presence of an IKE_INTERMEDIATE exchange', () => {
        expect(ex.roundTrips).toBe(ex.ikeIntermediate ? 3 : 2)
      })
    })
  }

  it('classical totals match the documented MODP-3072 model', () => {
    const ex = IKE_V2_EXCHANGES.classical
    expect(ex.totalInitiatorBytes).toBe(900)
    expect(ex.totalResponderBytes).toBe(884)
    expect(ex.totalBytes).toBe(1784)
  })

  it('hybrid totals match the ML-KEM-768 + ECP-256 model', () => {
    const ex = IKE_V2_EXCHANGES.hybrid
    expect(ex.totalInitiatorBytes).toBe(1952)
    expect(ex.totalResponderBytes).toBe(1832)
    expect(ex.totalBytes).toBe(3784)
  })

  it('pure-pqc totals match the ML-KEM-768 model', () => {
    const ex = IKE_V2_EXCHANGES['pure-pqc']
    expect(ex.totalInitiatorBytes).toBe(1828)
    expect(ex.totalResponderBytes).toBe(1716)
    expect(ex.totalBytes).toBe(3544)
  })
})

describe('ML-KEM-768 key-exchange payload sizes', () => {
  const keSize = (msg: IKEv2Message): number | undefined =>
    msg.payloads.find((p) => p.abbreviation === 'KE')?.sizeBytes

  it('hybrid IKE_SA_INIT carries the ML-KEM-768 encapsulation key (1184 + 8 = 1192 B)', () => {
    expect(keSize(IKE_V2_EXCHANGES.hybrid.ikeSaInit.initiator)).toBe(1192)
  })

  it('hybrid IKE_SA_INIT response carries the ML-KEM-768 ciphertext (1088 + 8 = 1096 B)', () => {
    expect(keSize(IKE_V2_EXCHANGES.hybrid.ikeSaInit.responder)).toBe(1096)
  })

  it('pure-pqc IKE_SA_INIT carries the ML-KEM-768 encapsulation key (1184 + 8 = 1192 B)', () => {
    expect(keSize(IKE_V2_EXCHANGES['pure-pqc'].ikeSaInit.initiator)).toBe(1192)
  })

  it('pure-pqc IKE_SA_INIT response carries the ML-KEM-768 ciphertext (1088 + 8 = 1096 B)', () => {
    expect(keSize(IKE_V2_EXCHANGES['pure-pqc'].ikeSaInit.responder)).toBe(1096)
  })

  it('classical IKE_SA_INIT carries a MODP-3072 KE payload (256 + 8 = 264 B)', () => {
    expect(keSize(IKE_V2_EXCHANGES.classical.ikeSaInit.initiator)).toBe(264)
    expect(keSize(IKE_V2_EXCHANGES.classical.ikeSaInit.responder)).toBe(264)
  })
})

describe('IKE_AUTH_SK_BYTES', () => {
  const EXPECTED: Record<string, number> = {
    PSK: 480,
    'RSA-2048': 1400,
    'RSA-3072': 1750,
    'RSA-4096': 2100,
    'ML-DSA-44': 6600,
    'ML-DSA-65': 9000,
    'ML-DSA-87': 12300,
  }

  it('has exactly the 7 expected auth methods', () => {
    expect(Object.keys(IKE_AUTH_SK_BYTES).sort()).toEqual(Object.keys(EXPECTED).sort())
  })

  for (const [alg, bytes] of Object.entries(EXPECTED)) {
    it(`${alg} → ${bytes} B`, () => {
      expect(IKE_AUTH_SK_BYTES[alg]).toBe(bytes)
    })
  }

  it('ML-DSA methods are strictly larger than every RSA method', () => {
    const rsaMax = Math.max(
      ...Object.entries(IKE_AUTH_SK_BYTES)
        .filter(([k]) => k.startsWith('RSA'))
        .map(([, v]) => v)
    )
    for (const [alg, bytes] of Object.entries(IKE_AUTH_SK_BYTES)) {
      if (alg.startsWith('ML-DSA')) expect(bytes).toBeGreaterThan(rsaMax)
    }
  })
})

describe('IKE_V2_MODES', () => {
  it('exposes one config per exchange mode', () => {
    expect(IKE_V2_MODES.map((m) => m.id).sort()).toEqual([...MODES].sort())
  })
})
