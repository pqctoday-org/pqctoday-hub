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
    label: 'Classical (DH Group 14/19)',
    description: 'Traditional IKEv2 using Diffie-Hellman key exchange with MODP or ECP groups.',
    dhGroup: 'DH Group 19 (ECP-256)',
    encAlgorithm: 'AES-256-GCM',
    integrityAlgorithm: 'SHA-256 (built into GCM)',
    prfAlgorithm: 'PRF-HMAC-SHA-256',
  },
  {
    id: 'hybrid',
    label: 'Hybrid (ECP-256 + ML-KEM-768)',
    description:
      'Hybrid IKEv2 per draft-ietf-ipsecme-ikev2-mlkem. Uses Additional Key Exchange (AKE) payloads to combine classical ECDH with ML-KEM.',
    dhGroup: 'DH Group 19 (ECP-256) + ML-KEM-768 (AKE)',
    encAlgorithm: 'AES-256-GCM',
    integrityAlgorithm: 'SHA-256 (built into GCM)',
    prfAlgorithm: 'PRF-HMAC-SHA-256',
  },
  {
    id: 'pure-pqc',
    label: 'Pure PQC (ML-KEM-768)',
    description:
      'Pure post-quantum IKEv2 using only ML-KEM for key exchange. No classical DH component.',
    dhGroup: 'ML-KEM-768 (Transform Type 4)',
    encAlgorithm: 'AES-256-GCM',
    integrityAlgorithm: 'SHA-256 (built into GCM)',
    prfAlgorithm: 'PRF-HMAC-SHA-256',
  },
]

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
            description: 'ECP-256 public key (DH Group 19)',
            sizeBytes: 72,
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
            description: 'ECP-256 public key (DH Group 19)',
            sizeBytes: 72,
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
        description: 'Encrypted: identity, certificate, auth, child SA.',
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
            description: 'IDi, CERT, AUTH, SAi2, TSi, TSr (encrypted)',
            sizeBytes: 480,
          },
        ],
      },
      responder: {
        name: 'IKE_AUTH Response',
        direction: 'responder',
        description: 'Encrypted: identity, certificate, auth, child SA.',
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
            description: 'IDr, CERT, AUTH, SAr2, TSi, TSr (encrypted)',
            sizeBytes: 480,
          },
        ],
      },
    },
    totalInitiatorBytes: 708,
    totalResponderBytes: 692,
    totalBytes: 1400,
    roundTrips: 2,
  },
  hybrid: {
    mode: 'hybrid',
    ikeSaInit: {
      initiator: {
        name: 'IKE_SA_INIT Request',
        direction: 'initiator',
        description:
          'Initiator proposes SA with Additional Key Exchange (AKE) transform for ML-KEM-768.',
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
            description: 'Proposed transforms including AKE transform type',
            sizeBytes: 80,
          },
          {
            name: 'Key Exchange',
            abbreviation: 'KE',
            description: 'ECP-256 public key (DH Group 19)',
            sizeBytes: 72,
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
        description: 'Responder selects SA with AKE and sends DH public value.',
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
            description: 'Selected transforms with AKE',
            sizeBytes: 56,
          },
          {
            name: 'Key Exchange',
            abbreviation: 'KE',
            description: 'ECP-256 public key (DH Group 19)',
            sizeBytes: 72,
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
        description: 'Additional Key Exchange: initiator sends ML-KEM-768 encapsulation key.',
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
            description: 'ML-KEM-768 encapsulation key (1,184 bytes)',
            sizeBytes: 1192,
          },
        ],
      },
      responder: {
        name: 'IKE_INTERMEDIATE Response',
        direction: 'responder',
        description: 'Responder encapsulates shared secret and returns ML-KEM-768 ciphertext.',
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
            description: 'ML-KEM-768 ciphertext (1,088 bytes)',
            sizeBytes: 1096,
          },
        ],
      },
    },
    ikeAuth: {
      initiator: {
        name: 'IKE_AUTH Request',
        direction: 'initiator',
        description: 'Encrypted: identity, certificate, auth, child SA.',
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
            description: 'IDi, CERT, AUTH, SAi2, TSi, TSr (encrypted)',
            sizeBytes: 480,
          },
        ],
      },
      responder: {
        name: 'IKE_AUTH Response',
        direction: 'responder',
        description: 'Encrypted: identity, certificate, auth, child SA.',
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
            description: 'IDr, CERT, AUTH, SAr2, TSi, TSr (encrypted)',
            sizeBytes: 480,
          },
        ],
      },
    },
    totalInitiatorBytes: 1944,
    totalResponderBytes: 1824,
    totalBytes: 3768,
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
        description: 'Encrypted: identity, certificate, auth, child SA.',
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
            description: 'IDi, CERT, AUTH, SAi2, TSi, TSr (encrypted)',
            sizeBytes: 480,
          },
        ],
      },
      responder: {
        name: 'IKE_AUTH Response',
        direction: 'responder',
        description: 'Encrypted: identity, certificate, auth, child SA.',
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
            description: 'IDr, CERT, AUTH, SAr2, TSi, TSr (encrypted)',
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
    id: 'DH_GROUP_14',
    name: 'MODP-2048',
    keySize: 2048,
    description: '2048-bit Modular Exponentiation DH',
  },
  {
    type: 'Additional KE',
    id: 'ML_KEM_768',
    name: 'ML-KEM-768',
    keySize: 192,
    description: 'Module-Lattice Key Encapsulation Mechanism (NIST FIPS 203)',
  },
]
