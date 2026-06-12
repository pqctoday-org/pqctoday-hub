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
    label: 'Classical (DH Group 15)',
    description:
      'Traditional IKEv2 using Diffie-Hellman key exchange (MODP-3072, DH Group 15 — matching the aes256-sha256-modp3072 proposal this simulator runs). Vulnerable to HNDL (Harvest Now, Decrypt Later): traffic captured today can be decrypted retroactively by a future CRQC. Provides no quantum-safe forward secrecy.',
    dhGroup: 'DH Group 15 (MODP-3072)',
    encAlgorithm: 'AES-256-CBC',
    integrityAlgorithm: 'HMAC-SHA-256',
    prfAlgorithm: 'PRF-HMAC-SHA-256',
  },
  {
    id: 'hybrid',
    label: 'Hybrid (ML-KEM-768 + ECP-256)',
    description:
      'Hybrid IKEv2 per draft-ietf-ipsecme-ikev2-mlkem with RFC 9370 multiple key exchanges over RFC 9242 IKE_INTERMEDIATE. ML-KEM-768 (NIST Level 3) runs in the primary KE slot of IKE_SA_INIT; classical ECDH (ECP-256) follows as Additional Key Exchange 1 in IKE_INTERMEDIATE. HNDL-safe: the chained SKEYSEED requires breaking both algorithms. Tradeoff: 1 extra round-trip and a larger handshake.',
    dhGroup: 'ML-KEM-768 (primary) + ECP-256 (Additional KE 1)',
    encAlgorithm: 'AES-256-CBC',
    integrityAlgorithm: 'HMAC-SHA-384',
    prfAlgorithm: 'PRF-HMAC-SHA-384',
  },
  {
    id: 'pure-pqc',
    label: 'Pure PQC (ML-KEM-768)',
    description:
      'Pure post-quantum IKEv2 using ML-KEM-768 in the primary KE slot — no classical DH. Specified in draft-ietf-ipsecme-ikev2-mlkem (IANA Key Exchange Method 36). HNDL-safe: session key material is fully quantum-resistant from the first exchange. Auth uses ML-DSA-65 (draft-sfluhrer-ipsecme-ikev2-mldsa) — awaiting IANA AUTH method assignment.',
    dhGroup: 'ML-KEM-768 (primary KE slot, Key Exchange Method 36)',
    encAlgorithm: 'AES-256-CBC',
    integrityAlgorithm: 'HMAC-SHA-384',
    prfAlgorithm: 'PRF-HMAC-SHA-384',
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

export const IKE_V2_EXCHANGES: Record<IKEv2Mode, IKEv2ExchangeData> = {
  classical: {
    mode: 'classical',
    ikeSaInit: {
      initiator: {
        name: 'IKE_SA_INIT Request',
        direction: 'initiator',
        description: 'Initiator proposes SA parameters and sends DH public value.',
        payloads: [
          {
            name: 'IKE Header',
            abbreviation: 'HDR',
            description: 'SPIs, version, exchange type, flags',
            sizeBytes: 28,
          },
          {
            name: 'Security Association',
            abbreviation: 'SA',
            description: 'Proposed transforms (encryption, integrity, DH group, PRF)',
            sizeBytes: 64,
          },
          {
            name: 'Key Exchange',
            abbreviation: 'KE',
            description: 'MODP-3072 public value (DH Group 15, 256 bytes)',
            sizeBytes: 264,
          },
          {
            name: 'Nonce',
            abbreviation: 'Ni',
            description: 'Random nonce (32 bytes)',
            sizeBytes: 36,
          },
        ],
      },
      responder: {
        name: 'IKE_SA_INIT Response',
        direction: 'responder',
        description: 'Responder selects SA and sends its DH public value.',
        payloads: [
          {
            name: 'IKE Header',
            abbreviation: 'HDR',
            description: 'SPIs, version, exchange type, flags',
            sizeBytes: 28,
          },
          {
            name: 'Security Association',
            abbreviation: 'SA',
            description: 'Selected transforms',
            sizeBytes: 48,
          },
          {
            name: 'Key Exchange',
            abbreviation: 'KE',
            description: 'MODP-3072 public value (DH Group 15, 256 bytes)',
            sizeBytes: 264,
          },
          {
            name: 'Nonce',
            abbreviation: 'Nr',
            description: 'Random nonce (32 bytes)',
            sizeBytes: 36,
          },
        ],
      },
    },
    ikeAuth: {
      initiator: {
        name: 'IKE_AUTH Request',
        direction: 'initiator',
        description: 'Encrypted: identity, authentication, child SA negotiation.',
        payloads: [
          {
            name: 'IKE Header',
            abbreviation: 'HDR',
            description: 'Encrypted exchange header',
            sizeBytes: 28,
          },
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
          {
            name: 'IKE Header',
            abbreviation: 'HDR',
            description: 'Encrypted exchange header',
            sizeBytes: 28,
          },
          {
            name: 'Encrypted Payload',
            abbreviation: 'SK',
            description: 'IDr, AUTH, SAr2, TSi, TSr (encrypted; PSK auth — no CERT payload)',
            sizeBytes: 480,
          },
        ],
      },
    },
    totalInitiatorBytes: 900,
    totalResponderBytes: 884,
    totalBytes: 1784,
    roundTrips: 2,
  },
  hybrid: {
    mode: 'hybrid',
    ikeSaInit: {
      initiator: {
        name: 'IKE_SA_INIT Request',
        direction: 'initiator',
        description:
          'Initiator proposes SA with ML-KEM-768 as primary KE plus an Additional Key Exchange (ke1) transform for ECP-256.',
        payloads: [
          {
            name: 'IKE Header',
            abbreviation: 'HDR',
            description: 'SPIs, version, exchange type, flags',
            sizeBytes: 28,
          },
          {
            name: 'Security Association',
            abbreviation: 'SA',
            description: 'Proposed transforms including Additional KE 1 (ECP-256)',
            sizeBytes: 80,
          },
          {
            name: 'Key Exchange',
            abbreviation: 'KE',
            description: 'ML-KEM-768 encapsulation key (1,184 bytes)',
            sizeBytes: 1192,
          },
          {
            name: 'Nonce',
            abbreviation: 'Ni',
            description: 'Random nonce (32 bytes)',
            sizeBytes: 36,
          },
        ],
      },
      responder: {
        name: 'IKE_SA_INIT Response',
        direction: 'responder',
        description: 'Responder selects SA and returns the ML-KEM-768 ciphertext.',
        payloads: [
          {
            name: 'IKE Header',
            abbreviation: 'HDR',
            description: 'SPIs, version, exchange type, flags',
            sizeBytes: 28,
          },
          {
            name: 'Security Association',
            abbreviation: 'SA',
            description: 'Selected transforms with Additional KE 1',
            sizeBytes: 56,
          },
          {
            name: 'Key Exchange',
            abbreviation: 'KE',
            description: 'ML-KEM-768 ciphertext (1,088 bytes)',
            sizeBytes: 1096,
          },
          {
            name: 'Nonce',
            abbreviation: 'Nr',
            description: 'Random nonce (32 bytes)',
            sizeBytes: 36,
          },
        ],
      },
    },
    ikeIntermediate: {
      initiator: {
        name: 'IKE_INTERMEDIATE Request',
        direction: 'initiator',
        description:
          'Additional Key Exchange 1 (RFC 9370): initiator sends its ECP-256 ephemeral public key, encrypted under the keys derived so far.',
        payloads: [
          {
            name: 'IKE Header',
            abbreviation: 'HDR',
            description: 'Intermediate exchange header',
            sizeBytes: 28,
          },
          {
            name: 'Encrypted Payload',
            abbreviation: 'SK',
            description: 'ECP-256 public key (64 bytes), Additional Key Exchange 1',
            sizeBytes: 80,
          },
        ],
      },
      responder: {
        name: 'IKE_INTERMEDIATE Response',
        direction: 'responder',
        description: 'Responder returns its ECP-256 public key; both sides derive the ECDH secret.',
        payloads: [
          {
            name: 'IKE Header',
            abbreviation: 'HDR',
            description: 'Intermediate exchange header',
            sizeBytes: 28,
          },
          {
            name: 'Encrypted Payload',
            abbreviation: 'SK',
            description: 'ECP-256 public key (64 bytes), Additional Key Exchange 1',
            sizeBytes: 80,
          },
        ],
      },
    },
    ikeAuth: {
      initiator: {
        name: 'IKE_AUTH Request',
        direction: 'initiator',
        description: 'Encrypted: identity, authentication, child SA negotiation.',
        payloads: [
          {
            name: 'IKE Header',
            abbreviation: 'HDR',
            description: 'Encrypted exchange header',
            sizeBytes: 28,
          },
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
          {
            name: 'IKE Header',
            abbreviation: 'HDR',
            description: 'Encrypted exchange header',
            sizeBytes: 28,
          },
          {
            name: 'Encrypted Payload',
            abbreviation: 'SK',
            description: 'IDr, AUTH, SAr2, TSi, TSr (encrypted; PSK auth — no CERT payload)',
            sizeBytes: 480,
          },
        ],
      },
    },
    totalInitiatorBytes: 1952,
    totalResponderBytes: 1832,
    totalBytes: 3784,
    roundTrips: 3,
  },
  'pure-pqc': {
    mode: 'pure-pqc',
    ikeSaInit: {
      initiator: {
        name: 'IKE_SA_INIT Request',
        direction: 'initiator',
        description: 'Initiator proposes SA with ML-KEM-768 as the primary key exchange.',
        payloads: [
          {
            name: 'IKE Header',
            abbreviation: 'HDR',
            description: 'SPIs, version, exchange type, flags',
            sizeBytes: 28,
          },
          {
            name: 'Security Association',
            abbreviation: 'SA',
            description: 'Proposed transforms with ML-KEM group',
            sizeBytes: 64,
          },
          {
            name: 'Key Exchange',
            abbreviation: 'KE',
            description: 'ML-KEM-768 encapsulation key (1,184 bytes)',
            sizeBytes: 1192,
          },
          {
            name: 'Nonce',
            abbreviation: 'Ni',
            description: 'Random nonce (32 bytes)',
            sizeBytes: 36,
          },
        ],
      },
      responder: {
        name: 'IKE_SA_INIT Response',
        direction: 'responder',
        description: 'Responder selects SA and sends ML-KEM ciphertext.',
        payloads: [
          {
            name: 'IKE Header',
            abbreviation: 'HDR',
            description: 'SPIs, version, exchange type, flags',
            sizeBytes: 28,
          },
          {
            name: 'Security Association',
            abbreviation: 'SA',
            description: 'Selected transforms with ML-KEM group',
            sizeBytes: 48,
          },
          {
            name: 'Key Exchange',
            abbreviation: 'KE',
            description: 'ML-KEM-768 ciphertext (1,088 bytes)',
            sizeBytes: 1096,
          },
          {
            name: 'Nonce',
            abbreviation: 'Nr',
            description: 'Random nonce (32 bytes)',
            sizeBytes: 36,
          },
        ],
      },
    },
    ikeAuth: {
      initiator: {
        name: 'IKE_AUTH Request',
        direction: 'initiator',
        description: 'Encrypted: identity, authentication, child SA negotiation.',
        payloads: [
          {
            name: 'IKE Header',
            abbreviation: 'HDR',
            description: 'Encrypted exchange header',
            sizeBytes: 28,
          },
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
          {
            name: 'IKE Header',
            abbreviation: 'HDR',
            description: 'Encrypted exchange header',
            sizeBytes: 28,
          },
          {
            name: 'Encrypted Payload',
            abbreviation: 'SK',
            description: 'IDr, AUTH, SAr2, TSi, TSr (encrypted; PSK auth — no CERT payload)',
            sizeBytes: 480,
          },
        ],
      },
    },
    totalInitiatorBytes: 1828,
    totalResponderBytes: 1716,
    totalBytes: 3544,
    roundTrips: 2,
  },
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
    type: 'DH Group',
    id: 'DH_GROUP_15',
    name: 'MODP-3072',
    keySize: 3072,
    description: '3072-bit Modular Exponentiation DH',
  },
  {
    type: 'Additional KE',
    id: 'ML_KEM_768',
    name: 'ML-KEM-768',
    keySize: 192,
    description: 'Module-Lattice Key Encapsulation Mechanism (NIST FIPS 203)',
  },
]
