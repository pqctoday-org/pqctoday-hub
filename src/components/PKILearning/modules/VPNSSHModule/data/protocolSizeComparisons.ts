export type ProtocolName = 'IKEv2' | 'SSH' | 'WireGuard' | 'TLS 1.3'
export type CryptoMode = 'classical' | 'hybrid' | 'pure-pqc'

export interface ProtocolSizeEntry {
  protocol: ProtocolName
  mode: CryptoMode
  modeLabel: string
  kexAlgorithm: string
  authAlgorithm: string
  handshakeBytes: number
  roundTrips: number
  publicKeyBytes: number
  ciphertextBytes: number
  notes: string
}

export const PROTOCOL_SIZE_DATA: ProtocolSizeEntry[] = [
  // IKEv2
  {
    protocol: 'IKEv2',
    mode: 'classical',
    modeLabel: 'ECP-256',
    kexAlgorithm: 'ECDH (secp256r1)',
    authAlgorithm: 'RSA-2048 / ECDSA-P256',
    handshakeBytes: 1400,
    roundTrips: 2,
    publicKeyBytes: 64,
    ciphertextBytes: 0,
    notes: 'Standard IKEv2 with DH Group 19',
  },
  {
    protocol: 'IKEv2',
    mode: 'hybrid',
    modeLabel: 'ECP-256 + ML-KEM-768',
    kexAlgorithm: 'ECDH + ML-KEM-768 (AKE)',
    authAlgorithm: 'RSA-2048 / ECDSA-P256',
    handshakeBytes: 3768,
    roundTrips: 3,
    publicKeyBytes: 1248,
    ciphertextBytes: 1088,
    notes: 'draft-ietf-ipsecme-ikev2-mlkem with IKE_INTERMEDIATE',
  },
  {
    protocol: 'IKEv2',
    mode: 'pure-pqc',
    modeLabel: 'ML-KEM-768',
    kexAlgorithm: 'ML-KEM-768',
    authAlgorithm: 'ML-DSA-65',
    handshakeBytes: 3544,
    roundTrips: 2,
    publicKeyBytes: 1184,
    ciphertextBytes: 1088,
    notes: 'Pure PQC key exchange, no classical DH',
  },

  // SSH
  {
    protocol: 'SSH',
    mode: 'classical',
    modeLabel: 'curve25519-sha256',
    kexAlgorithm: 'X25519',
    authAlgorithm: 'Ed25519 / RSA-2048',
    handshakeBytes: 984,
    roundTrips: 2,
    publicKeyBytes: 32,
    ciphertextBytes: 0,
    notes: 'Default since OpenSSH 6.5',
  },
  {
    protocol: 'SSH',
    mode: 'hybrid',
    modeLabel: 'mlkem768x25519-sha256',
    kexAlgorithm: 'ML-KEM-768 + X25519',
    authAlgorithm: 'Ed25519 / RSA-2048',
    handshakeBytes: 3296,
    roundTrips: 2,
    publicKeyBytes: 1216,
    ciphertextBytes: 1120,
    notes: 'OpenSSH 9.9+ (NIST ML-KEM)',
  },
  {
    protocol: 'SSH',
    mode: 'pure-pqc',
    modeLabel: 'ML-KEM-768 (future)',
    kexAlgorithm: 'ML-KEM-768',
    authAlgorithm: 'ML-DSA-65',
    handshakeBytes: 3100,
    roundTrips: 2,
    publicKeyBytes: 1184,
    ciphertextBytes: 1088,
    notes: 'Not yet standardized; projected sizes',
  },

  // WireGuard
  {
    protocol: 'WireGuard',
    mode: 'classical',
    modeLabel: 'X25519 (Noise IK)',
    kexAlgorithm: 'X25519',
    authAlgorithm: 'X25519 (static keys)',
    handshakeBytes: 304,
    roundTrips: 1,
    publicKeyBytes: 32,
    ciphertextBytes: 0,
    notes: 'Noise IK pattern: 1-RTT handshake',
  },
  {
    protocol: 'WireGuard',
    mode: 'hybrid',
    modeLabel: 'X25519 + ML-KEM-768 (Rosenpass)',
    kexAlgorithm: 'X25519 + ML-KEM-768',
    authAlgorithm: 'X25519 (static) + Classic McEliece',
    handshakeBytes: 6800,
    roundTrips: 2,
    publicKeyBytes: 1216,
    ciphertextBytes: 1088,
    notes: 'Rosenpass project: external PQC key negotiation',
  },
  {
    protocol: 'WireGuard',
    mode: 'pure-pqc',
    modeLabel: 'ML-KEM-768 (future)',
    kexAlgorithm: 'ML-KEM-768',
    authAlgorithm: 'ML-DSA-65',
    handshakeBytes: 5500,
    roundTrips: 2,
    publicKeyBytes: 1184,
    ciphertextBytes: 1088,
    notes: 'Hypothetical; Noise protocol modification required',
  },

  // TLS 1.3
  {
    protocol: 'TLS 1.3',
    mode: 'classical',
    modeLabel: 'X25519',
    kexAlgorithm: 'X25519',
    authAlgorithm: 'ECDSA-P256 / RSA-2048',
    handshakeBytes: 1200,
    roundTrips: 1,
    publicKeyBytes: 32,
    ciphertextBytes: 0,
    notes: 'Standard TLS 1.3 with X25519',
  },
  {
    protocol: 'TLS 1.3',
    mode: 'hybrid',
    modeLabel: 'X25519MLKEM768',
    kexAlgorithm: 'X25519 + ML-KEM-768',
    authAlgorithm: 'ECDSA-P256 / RSA-2048',
    handshakeBytes: 3500,
    roundTrips: 1,
    publicKeyBytes: 1216,
    ciphertextBytes: 1120,
    notes: 'RFC 9798; hybrid KEX in Chrome 124 (Kyber draft), final ML-KEM in Chrome 131',
  },
  {
    protocol: 'TLS 1.3',
    mode: 'pure-pqc',
    modeLabel: 'ML-KEM-768',
    kexAlgorithm: 'ML-KEM-768',
    authAlgorithm: 'ML-DSA-65',
    handshakeBytes: 3200,
    roundTrips: 1,
    publicKeyBytes: 1184,
    ciphertextBytes: 1088,
    notes: 'Pure PQC TLS; certificates grow ~3x with ML-DSA',
  },
]

export interface ProtocolFeature {
  feature: string
  ikev2: string
  ssh: string
  wireguard: string
  tls13: string
}

export const PROTOCOL_FEATURE_COMPARISON: ProtocolFeature[] = [
  {
    feature: 'Primary Use Case',
    ikev2: 'Site-to-site & remote access VPN',
    ssh: 'Remote shell & file transfer',
    wireguard: 'Point-to-point VPN tunnels',
    tls13: 'Web, API, general transport security',
  },
  {
    feature: 'Handshake Round-Trips',
    ikev2: '2 (4 messages)',
    ssh: '2 (6 messages)',
    wireguard: '1 (2 messages)',
    tls13: '1 (3 messages, 1-RTT)',
  },
  {
    feature: 'Classical KEX',
    ikev2: 'DH Group 14/19/20/21',
    ssh: 'curve25519-sha256, ecdh-sha2-*',
    wireguard: 'X25519 (fixed)',
    tls13: 'X25519, secp256r1, secp384r1',
  },
  {
    feature: 'PQC KEX Status',
    ikev2: 'draft-ietf-ipsecme-ikev2-mlkem',
    ssh: 'mlkem768x25519 in OpenSSH 9.9',
    wireguard: 'Rosenpass project (external)',
    tls13: 'RFC 9798 (X25519MLKEM768)',
  },
  {
    feature: 'PQC Integration Method',
    ikev2: 'Additional Key Exchange (AKE) payload',
    ssh: 'Concatenated hybrid KEX',
    wireguard: 'Separate Rosenpass handshake',
    tls13: 'Named group in key_share extension',
  },
  {
    feature: 'Auth Mechanism',
    ikev2: 'Certificates, PSK, EAP',
    ssh: 'Public key, password, certificates',
    wireguard: 'Static X25519 key pairs',
    tls13: 'X.509 certificates',
  },
  {
    feature: 'PQC Auth Status',
    ikev2: 'draft-ietf-ipsecme-ikev2-mldsa (ML-DSA)',
    ssh: 'No PQC host key standard yet',
    wireguard: 'Rosenpass uses Classic McEliece for auth',
    tls13: 'draft-ietf-tls-mldsa (ML-DSA certs)',
  },
  {
    feature: 'Crypto Agility',
    ikev2: 'High: negotiated transforms',
    ssh: 'High: negotiated algorithms',
    wireguard: 'Low: fixed X25519 + ChaCha20',
    tls13: 'High: negotiated cipher suites',
  },
  {
    feature: 'Fragmentation Support',
    ikev2: 'IKE fragmentation (RFC 7383)',
    ssh: 'TCP-based (handled by TCP)',
    wireguard: 'None (UDP, may need IP frag)',
    tls13: 'TCP-based (handled by TCP)',
  },
]
