// SPDX-License-Identifier: GPL-3.0-only
export interface IKEv2Transform {
  type: string
  id: string
  name: string
  keySize: number
  description: string
}

export interface IKEv2Payload {
  name: string
  abbreviation: string
  description: string
  sizeBytes: number
}

export interface IKEv2Message {
  name: string
  direction: 'initiator' | 'responder'
  description: string
  payloads: IKEv2Payload[]
}

export type IKEv2Mode = 'classical' | 'hybrid' | 'pure-pqc'

export interface IKEv2ModeConfig {
  id: IKEv2Mode
  label: string
  description: string
  dhGroup: string
  encAlgorithm: string
  integrityAlgorithm: string
  prfAlgorithm: string
}

export const IKE_V2_MODES: IKEv2ModeConfig[] = [
  {
    id: 'classical',
    label: 'Classical (ECP-256)',
    description:
      'Traditional IKEv2 using elliptic-curve Diffie-Hellman (ECP-256, DH Group 19 — the aes256-sha256-ecp256 proposal this simulator runs). Vulnerable to HNDL (Harvest Now, Decrypt Later): traffic captured today can be decrypted retroactively by a future CRQC. Provides no quantum-safe forward secrecy.',
    dhGroup: 'ECP-256 (DH Group 19)',
    encAlgorithm: 'AES-256-CBC',
    integrityAlgorithm: 'HMAC-SHA-256',
    prfAlgorithm: 'PRF-HMAC-SHA-256',
  },
  {
    id: 'hybrid',
    label: 'Hybrid (ECP-256 + ML-KEM)',
    description:
      'Hybrid IKEv2 per draft-ietf-ipsecme-ikev2-mlkem Appendix A, using RFC 9370 multiple key exchanges over an RFC 9242 IKE_INTERMEDIATE round. Classical ECP-256 runs in IKE_SA_INIT; ML-KEM follows as Additional Key Exchange 1 in IKE_INTERMEDIATE. Because IKE_INTERMEDIATE is encrypted, the large ML-KEM payloads can use RFC 7383 fragmentation, which IKE_SA_INIT cannot. HNDL-safe: the chained SKEYSEED requires breaking both algorithms. Tradeoff: 1 extra round trip.',
    dhGroup: 'ECP-256 (IKE_SA_INIT) + ML-KEM (Additional KE 1, IKE_INTERMEDIATE)',
    encAlgorithm: 'AES-256-CBC',
    integrityAlgorithm: 'HMAC-SHA-256',
    prfAlgorithm: 'PRF-HMAC-SHA-256',
  },
  {
    id: 'pure-pqc',
    label: 'Pure PQC (ML-KEM)',
    description:
      'Pure post-quantum IKEv2 with ML-KEM alone in IKE_SA_INIT — no classical DH (draft-ietf-ipsecme-ikev2-mlkem, Key Exchange Methods 35/36/37). HNDL-safe from the first exchange. Limit: IKE_SA_INIT cannot be fragmented (RFC 7383), so over UDP the draft allows only ML-KEM-512 unconditionally; ML-KEM-768/1024 SHOULD NOT be used there unless the path MTU is guaranteed or IKE runs over TCP. Auth can use ML-DSA per draft-ietf-ipsecme-ikev2-pqc-auth.',
    dhGroup: 'ML-KEM (IKE_SA_INIT, Key Exchange Method 35/36/37)',
    encAlgorithm: 'AES-256-CBC',
    integrityAlgorithm: 'HMAC-SHA-256',
    prfAlgorithm: 'PRF-HMAC-SHA-256',
  },
]

/**
 * Estimated Encrypted (SK) payload size of one IKE_AUTH message per
 * authentication method. PSK carries no CERT payload; cert-based auth is
 * dominated by the DER certificate plus the AUTH signature:
 *   RSA-n:     ~DER cert (1.0–1.5 KB) + n/8-byte signature + IDs/TS
 *   ML-DSA-44: 1,312 B pubkey + 2,420 B sig (FIPS 204) in cert + 2,420 B AUTH
 *   ML-DSA-65: 1,952 B pubkey + 3,309 B sig in cert + 3,309 B AUTH
 *   ML-DSA-87: 2,592 B pubkey + 4,627 B sig in cert + 4,627 B AUTH
 * Values are rounded teaching approximations — real messages vary with
 * cert extensions and padding. IKE_AUTH (not IKE_SA_INIT) is the message
 * that most needs RFC 7383 fragmentation under PQC auth.
 */
export const IKE_AUTH_SK_BYTES: Record<string, number> = {
  PSK: 480,
  'RSA-2048': 1400,
  'RSA-3072': 1750,
  'RSA-4096': 2100,
  'ML-DSA-44': 6600,
  'ML-DSA-65': 9000,
  'ML-DSA-87': 12300,
}

export interface IKEv2ExchangeData {
  mode: IKEv2Mode
  ikeSaInit: {
    initiator: IKEv2Message
    responder: IKEv2Message
  }
  ikeIntermediate?: {
    initiator: IKEv2Message
    responder: IKEv2Message
  }
  ikeAuth: {
    initiator: IKEv2Message
    responder: IKEv2Message
  }
  totalInitiatorBytes: number
  totalResponderBytes: number
  totalBytes: number
  roundTrips: number
}

/** ML-KEM parameter set (FIPS 203). */
export type KemSize = 512 | 768 | 1024
export const KEM_SIZES: readonly KemSize[] = [512, 768, 1024]
export const DEFAULT_KEM_SIZE: KemSize = 768
/** FIPS 203 encapsulation-key (public key) bytes per parameter set. */
export const KEM_PUBKEY_BYTES: Record<KemSize, number> = { 512: 800, 768: 1184, 1024: 1568 }
/** FIPS 203 ciphertext bytes per parameter set. */
export const KEM_CIPHERTEXT_BYTES: Record<KemSize, number> = { 512: 768, 768: 1088, 1024: 1568 }

/** ECP-256 (DH Group 19) public value: x || y, 32 + 32 bytes (RFC 5903). */
const ECP256_PUBLIC_BYTES = 64
/** KE payload = 8-byte header (generic header + method number + reserved) + key data. */
const KE_HEADER_BYTES = 8
/** Simplified SK wrapper overhead used throughout this teaching model. */
const SK_OVERHEAD_BYTES = 8
const IKE_HEADER: IKEv2Payload = {
  name: 'IKE Header',
  abbreviation: 'HDR',
  description: 'SPIs, version, exchange type, flags',
  sizeBytes: 28,
}
const nonce = (abbreviation: 'Ni' | 'Nr'): IKEv2Payload => ({
  name: 'Nonce',
  abbreviation,
  description: 'Random nonce (32 bytes)',
  sizeBytes: 36,
})
const sa = (description: string, sizeBytes: number): IKEv2Payload => ({
  name: 'Security Association',
  abbreviation: 'SA',
  description,
  sizeBytes,
})
const ke = (description: string, dataBytes: number): IKEv2Payload => ({
  name: 'Key Exchange',
  abbreviation: 'KE',
  description,
  sizeBytes: dataBytes + KE_HEADER_BYTES,
})
const ecpKe = ke(
  `ECP-256 public value (DH Group 19, ${ECP256_PUBLIC_BYTES} bytes)`,
  ECP256_PUBLIC_BYTES
)
const ikeAuth = (): IKEv2ExchangeData['ikeAuth'] => ({
  initiator: {
    name: 'IKE_AUTH Request',
    direction: 'initiator',
    description: 'Encrypted: identity, authentication, child SA negotiation.',
    payloads: [
      { ...IKE_HEADER, description: 'Encrypted exchange header' },
      {
        name: 'Encrypted Payload',
        abbreviation: 'SK',
        description: 'IDi, AUTH, SAi2, TSi, TSr (encrypted; PSK auth — no CERT payload)',
        sizeBytes: 480,
      },
    ],
  },
  responder: {
    name: 'IKE_AUTH Response',
    direction: 'responder',
    description: 'Encrypted: identity, authentication, child SA negotiation.',
    payloads: [
      { ...IKE_HEADER, description: 'Encrypted exchange header' },
      {
        name: 'Encrypted Payload',
        abbreviation: 'SK',
        description: 'IDr, AUTH, SAr2, TSi, TSr (encrypted; PSK auth — no CERT payload)',
        sizeBytes: 480,
      },
    ],
  },
})
const msgBytes = (m: IKEv2Message) => m.payloads.reduce((a, p) => a + p.sizeBytes, 0)

/**
 * Builds the teaching model of one IKEv2 handshake (PSK auth) for a mode and
 * ML-KEM parameter set. Byte counts follow FIPS 203 / RFC 5903 key sizes with
 * the simplified header/SK overheads above — real messages differ slightly.
 *
 * Hybrid follows draft-ietf-ipsecme-ikev2-mlkem Appendix A (the order the
 * simulator's strongSwan engine negotiates, verified 2026-09-29): ECP-256 in
 * IKE_SA_INIT, ML-KEM as Additional KE 1 inside the encrypted IKE_INTERMEDIATE,
 * where RFC 7383 fragmentation applies. Pure PQC puts ML-KEM in IKE_SA_INIT,
 * which can never be fragmented (draft §2.1).
 */
export function buildIkeV2Exchange(
  mode: IKEv2Mode,
  kemSize: KemSize = DEFAULT_KEM_SIZE
): IKEv2ExchangeData {
  const ek = KEM_PUBKEY_BYTES[kemSize]
  const ct = KEM_CIPHERTEXT_BYTES[kemSize]
  let ikeSaInit: IKEv2ExchangeData['ikeSaInit']
  let ikeIntermediate: IKEv2ExchangeData['ikeIntermediate']

  if (mode === 'classical') {
    ikeSaInit = {
      initiator: {
        name: 'IKE_SA_INIT Request',
        direction: 'initiator',
        description: 'Initiator proposes SA parameters and sends its ECP-256 public value.',
        payloads: [
          IKE_HEADER,
          sa('Proposed transforms (encryption, integrity, DH group, PRF)', 64),
          ecpKe,
          nonce('Ni'),
        ],
      },
      responder: {
        name: 'IKE_SA_INIT Response',
        direction: 'responder',
        description: 'Responder selects SA and sends its ECP-256 public value.',
        payloads: [IKE_HEADER, sa('Selected transforms', 48), ecpKe, nonce('Nr')],
      },
    }
  } else if (mode === 'hybrid') {
    ikeSaInit = {
      initiator: {
        name: 'IKE_SA_INIT Request',
        direction: 'initiator',
        description: `Initiator proposes SA with ECP-256 as the primary KE plus an Additional Key Exchange (ke1) transform for ML-KEM-${kemSize}, and sends its ECP-256 public value.`,
        payloads: [
          IKE_HEADER,
          sa(`Proposed transforms including Additional KE 1 (ML-KEM-${kemSize})`, 80),
          ecpKe,
          nonce('Ni'),
        ],
      },
      responder: {
        name: 'IKE_SA_INIT Response',
        direction: 'responder',
        description: 'Responder selects SA and returns its ECP-256 public value.',
        payloads: [
          IKE_HEADER,
          sa('Selected transforms with Additional KE 1', 56),
          ecpKe,
          nonce('Nr'),
        ],
      },
    }
    ikeIntermediate = {
      initiator: {
        name: 'IKE_INTERMEDIATE Request',
        direction: 'initiator',
        description: `Additional Key Exchange 1 (RFC 9370): initiator sends its ML-KEM-${kemSize} encapsulation key, encrypted under the ECP-256 keys — so RFC 7383 fragmentation can split it if it exceeds the MTU.`,
        payloads: [
          { ...IKE_HEADER, description: 'Intermediate exchange header' },
          {
            name: 'Encrypted Payload',
            abbreviation: 'SK',
            description: `KE: ML-KEM-${kemSize} encapsulation key (${ek.toLocaleString('en-US')} bytes), Additional Key Exchange 1`,
            sizeBytes: ek + KE_HEADER_BYTES + SK_OVERHEAD_BYTES,
          },
        ],
      },
      responder: {
        name: 'IKE_INTERMEDIATE Response',
        direction: 'responder',
        description: `Responder encapsulates and returns the ML-KEM-${kemSize} ciphertext; both sides chain the ML-KEM secret into SKEYSEED.`,
        payloads: [
          { ...IKE_HEADER, description: 'Intermediate exchange header' },
          {
            name: 'Encrypted Payload',
            abbreviation: 'SK',
            description: `KE: ML-KEM-${kemSize} ciphertext (${ct.toLocaleString('en-US')} bytes), Additional Key Exchange 1`,
            sizeBytes: ct + KE_HEADER_BYTES + SK_OVERHEAD_BYTES,
          },
        ],
      },
    }
  } else {
    ikeSaInit = {
      initiator: {
        name: 'IKE_SA_INIT Request',
        direction: 'initiator',
        description: `Initiator proposes SA with ML-KEM-${kemSize} as the only key exchange and sends its encapsulation key — in plaintext, and not fragmentable.`,
        payloads: [
          IKE_HEADER,
          sa(`Proposed transforms (ML-KEM-${kemSize} as sole KE)`, 64),
          ke(`ML-KEM-${kemSize} encapsulation key (${ek.toLocaleString('en-US')} bytes)`, ek),
          nonce('Ni'),
        ],
      },
      responder: {
        name: 'IKE_SA_INIT Response',
        direction: 'responder',
        description: `Responder selects SA and returns the ML-KEM-${kemSize} ciphertext.`,
        payloads: [
          IKE_HEADER,
          sa('Selected transforms', 48),
          ke(`ML-KEM-${kemSize} ciphertext (${ct.toLocaleString('en-US')} bytes)`, ct),
          nonce('Nr'),
        ],
      },
    }
  }

  const auth = ikeAuth()
  const initMsgs = [ikeSaInit.initiator, ikeIntermediate?.initiator, auth.initiator]
  const respMsgs = [ikeSaInit.responder, ikeIntermediate?.responder, auth.responder]
  const sum = (ms: (IKEv2Message | undefined)[]) =>
    ms.reduce((a, m) => a + (m ? msgBytes(m) : 0), 0)
  const totalInitiatorBytes = sum(initMsgs)
  const totalResponderBytes = sum(respMsgs)
  return {
    mode,
    ikeSaInit,
    ...(ikeIntermediate ? { ikeIntermediate } : {}),
    ikeAuth: auth,
    totalInitiatorBytes,
    totalResponderBytes,
    totalBytes: totalInitiatorBytes + totalResponderBytes,
    roundTrips: ikeIntermediate ? 3 : 2,
  }
}

/** The three modes at the default ML-KEM-768 parameter set. */
export const IKE_V2_EXCHANGES: Record<IKEv2Mode, IKEv2ExchangeData> = {
  classical: buildIkeV2Exchange('classical'),
  hybrid: buildIkeV2Exchange('hybrid'),
  'pure-pqc': buildIkeV2Exchange('pure-pqc'),
}

export const IKE_V2_TRANSFORM_TYPES: IKEv2Transform[] = [
  {
    type: 'Encryption',
    id: 'ENCR_AES_GCM_16',
    name: 'AES-256-GCM-16',
    keySize: 256,
    description: 'Authenticated encryption with associated data (AEAD)',
  },
  {
    type: 'PRF',
    id: 'PRF_HMAC_SHA2_256',
    name: 'PRF-HMAC-SHA-256',
    keySize: 256,
    description: 'Pseudorandom function for key derivation',
  },
  {
    type: 'Integrity',
    id: 'AUTH_HMAC_SHA2_256_128',
    name: 'HMAC-SHA-256-128',
    keySize: 256,
    description: 'Message authentication (unused with GCM)',
  },
  {
    type: 'DH Group',
    id: 'DH_GROUP_19',
    name: 'ECP-256 (secp256r1)',
    keySize: 256,
    description: '256-bit Elliptic Curve Diffie-Hellman',
  },
  {
    type: 'Additional KE',
    id: 'ML_KEM_768',
    name: 'ML-KEM-768',
    keySize: 192,
    description: 'Module-Lattice Key Encapsulation Mechanism (NIST FIPS 203)',
  },
]
