// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  IKE_V2_EXCHANGES,
  IKE_AUTH_SK_BYTES,
  buildIkeV2Exchange,
  KEM_SIZES,
  KEM_PUBKEY_BYTES,
  KEM_CIPHERTEXT_BYTES,
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

  it('classical totals match the ECP-256 model', () => {
    const ex = IKE_V2_EXCHANGES.classical
    expect(ex.totalInitiatorBytes).toBe(708)
    expect(ex.totalResponderBytes).toBe(692)
    expect(ex.totalBytes).toBe(1400)
  })

  it('hybrid totals match the ECP-256 + ML-KEM-768 model', () => {
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

  it('IKE_V2_EXCHANGES is the ML-KEM-768 build of every mode', () => {
    for (const mode of MODES) expect(IKE_V2_EXCHANGES[mode]).toEqual(buildIkeV2Exchange(mode, 768))
  })
})

const keSize = (msg: IKEv2Message): number | undefined =>
  msg.payloads.find((p) => p.abbreviation === 'KE')?.sizeBytes
const skSize = (msg: IKEv2Message): number | undefined =>
  msg.payloads.find((p) => p.abbreviation === 'SK')?.sizeBytes

describe('classical key exchange (ECP-256, RFC 5903)', () => {
  it('both IKE_SA_INIT messages carry a 64 B ECP-256 public value (64 + 8 = 72 B)', () => {
    expect(keSize(IKE_V2_EXCHANGES.classical.ikeSaInit.initiator)).toBe(72)
    expect(keSize(IKE_V2_EXCHANGES.classical.ikeSaInit.responder)).toBe(72)
  })
  it('has no IKE_INTERMEDIATE round', () => {
    expect(IKE_V2_EXCHANGES.classical.ikeIntermediate).toBeUndefined()
  })
})

describe.each(KEM_SIZES)('ML-KEM-%i', (size) => {
  const ek = KEM_PUBKEY_BYTES[size]
  const ct = KEM_CIPHERTEXT_BYTES[size]

  describe('hybrid (draft-ietf-ipsecme-ikev2-mlkem Appendix A order)', () => {
    const ex = buildIkeV2Exchange('hybrid', size)
    it('IKE_SA_INIT carries only the ECP-256 key exchange', () => {
      expect(keSize(ex.ikeSaInit.initiator)).toBe(72)
      expect(keSize(ex.ikeSaInit.responder)).toBe(72)
    })
    it('ML-KEM travels encrypted in IKE_INTERMEDIATE as Additional KE 1', () => {
      expect(ex.ikeIntermediate).toBeDefined()
      expect(skSize(ex.ikeIntermediate!.initiator)).toBe(ek + 16)
      expect(skSize(ex.ikeIntermediate!.responder)).toBe(ct + 16)
      expect(ex.roundTrips).toBe(3)
    })
  })

  describe('pure-pqc', () => {
    const ex = buildIkeV2Exchange('pure-pqc', size)
    it('IKE_SA_INIT carries the ML-KEM key and ciphertext', () => {
      expect(keSize(ex.ikeSaInit.initiator)).toBe(ek + 8)
      expect(keSize(ex.ikeSaInit.responder)).toBe(ct + 8)
      expect(ex.ikeIntermediate).toBeUndefined()
    })
  })

  it('totals add up at this size', () => {
    for (const mode of MODES) {
      const ex = buildIkeV2Exchange(mode, size)
      expect(ex.totalBytes).toBe(ex.totalInitiatorBytes + ex.totalResponderBytes)
    }
  })
})

describe('draft §2.1 limit is visible in the model at a 1,500 B MTU', () => {
  const saInitRequest = (mode: IKEv2Mode, size: 512 | 768 | 1024) =>
    sumMessage(buildIkeV2Exchange(mode, size).ikeSaInit.initiator)
  it('pure ML-KEM-1024 IKE_SA_INIT exceeds 1,500 B (and cannot be fragmented)', () => {
    expect(saInitRequest('pure-pqc', 1024)).toBe(1704)
  })
  it('pure ML-KEM-512 and -768 IKE_SA_INIT fit in 1,500 B', () => {
    expect(saInitRequest('pure-pqc', 512)).toBe(936)
    expect(saInitRequest('pure-pqc', 768)).toBe(1320)
  })
  it('hybrid IKE_SA_INIT stays small at every size', () => {
    for (const size of KEM_SIZES) expect(saInitRequest('hybrid', size)).toBe(216)
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
