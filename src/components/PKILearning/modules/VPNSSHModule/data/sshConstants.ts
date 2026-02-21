export type SSHKexAlgorithm =
  | 'curve25519-sha256'
  | 'sntrup761x25519-sha512'
  | 'mlkem768x25519-sha256'

export interface SSHKexConfig {
  id: SSHKexAlgorithm
  label: string
  description: string
  classicalComponent: string | null
  pqcComponent: string | null
  hashFunction: string
  opensshVersion: string
  rfcOrDraft: string
  quantumSafe: boolean
}

export interface SSHKexSizes {
  id: SSHKexAlgorithm
  clientKexInitBytes: number
  serverKexInitBytes: number
  clientKexDHInitBytes: number
  serverKexDHReplyBytes: number
  publicKeyBytes: number
  ciphertextOrShareBytes: number
  sharedSecretBytes: number
  totalHandshakeBytes: number
}

export const SSH_KEX_ALGORITHMS: SSHKexConfig[] = [
  {
    id: 'curve25519-sha256',
    label: 'curve25519-sha256',
    description:
      'Classical Curve25519 ECDH key exchange (RFC 8731). The default in OpenSSH since 6.5. Fast and widely deployed, but vulnerable to quantum computers.',
    classicalComponent: 'X25519 (Curve25519 ECDH)',
    pqcComponent: null,
    hashFunction: 'SHA-256',
    opensshVersion: '6.5+',
    rfcOrDraft: 'RFC 8731',
    quantumSafe: false,
  },
  {
    id: 'sntrup761x25519-sha512',
    label: 'sntrup761x25519-sha512',
    description:
      'Hybrid NTRU Prime + X25519 key exchange. Available since OpenSSH 8.5, enabled by default in 9.0+. Uses the Streamlined NTRU Prime lattice-based KEM combined with X25519.',
    classicalComponent: 'X25519 (Curve25519 ECDH)',
    pqcComponent: 'sntrup761 (Streamlined NTRU Prime)',
    hashFunction: 'SHA-512',
    opensshVersion: '8.5+ (default in 9.0+)',
    rfcOrDraft: 'draft-josefsson-ntruprime-ssh',
    quantumSafe: true,
  },
  {
    id: 'mlkem768x25519-sha256',
    label: 'mlkem768x25519-sha256',
    description:
      'Hybrid ML-KEM-768 + X25519 key exchange. Added in OpenSSH 9.9 (October 2024). Uses the NIST-standardized ML-KEM (FIPS 203) combined with X25519 for quantum resistance with NIST compliance.',
    classicalComponent: 'X25519 (Curve25519 ECDH)',
    pqcComponent: 'ML-KEM-768 (FIPS 203)',
    hashFunction: 'SHA-256',
    opensshVersion: '9.9+',
    rfcOrDraft: 'draft-kampanakis-curdle-ssh-pq-ke',
    quantumSafe: true,
  },
]

export const SSH_KEX_SIZES: SSHKexSizes[] = [
  {
    id: 'curve25519-sha256',
    clientKexInitBytes: 220,
    serverKexInitBytes: 220,
    clientKexDHInitBytes: 44,
    serverKexDHReplyBytes: 500,
    publicKeyBytes: 32,
    ciphertextOrShareBytes: 32,
    sharedSecretBytes: 32,
    totalHandshakeBytes: 984,
  },
  {
    id: 'sntrup761x25519-sha512',
    clientKexInitBytes: 240,
    serverKexInitBytes: 240,
    clientKexDHInitBytes: 1190,
    serverKexDHReplyBytes: 1574,
    publicKeyBytes: 1190,
    ciphertextOrShareBytes: 1039,
    sharedSecretBytes: 64,
    totalHandshakeBytes: 3244,
  },
  {
    id: 'mlkem768x25519-sha256',
    clientKexInitBytes: 240,
    serverKexInitBytes: 240,
    clientKexDHInitBytes: 1228,
    serverKexDHReplyBytes: 1588,
    publicKeyBytes: 1216,
    ciphertextOrShareBytes: 1120,
    sharedSecretBytes: 64,
    totalHandshakeBytes: 3296,
  },
]

export interface SSHHandshakeStep {
  id: string
  label: string
  direction: 'client' | 'server'
  description: string
}

export const SSH_HANDSHAKE_STEPS: SSHHandshakeStep[] = [
  {
    id: 'version',
    label: 'Protocol Version Exchange',
    direction: 'client',
    description: 'Client and server exchange SSH-2.0 version strings.',
  },
  {
    id: 'kex-init',
    label: 'SSH_MSG_KEXINIT',
    direction: 'client',
    description:
      'Client sends supported KEX algorithms, host key types, ciphers, MACs, and compression.',
  },
  {
    id: 'kex-init-reply',
    label: 'SSH_MSG_KEXINIT',
    direction: 'server',
    description: 'Server sends its supported algorithms. Both sides select the best match.',
  },
  {
    id: 'kex-dh-init',
    label: 'SSH_MSG_KEX_ECDH_INIT',
    direction: 'client',
    description:
      'Client sends its ephemeral public key (or hybrid public key: classical + PQC concatenated).',
  },
  {
    id: 'kex-dh-reply',
    label: 'SSH_MSG_KEX_ECDH_REPLY',
    direction: 'server',
    description:
      'Server sends its host key, ephemeral public share (or ciphertext), and exchange hash signature.',
  },
  {
    id: 'newkeys',
    label: 'SSH_MSG_NEWKEYS',
    direction: 'client',
    description: 'Both sides switch to the negotiated encryption keys. Handshake complete.',
  },
]
