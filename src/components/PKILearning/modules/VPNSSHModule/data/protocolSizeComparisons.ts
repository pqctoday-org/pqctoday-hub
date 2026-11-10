// SPDX-License-Identifier: AGPL-3.0-only
import { tlsSample } from './measuredTlsHandshake'
import { sshSample } from './measuredSshHandshake'
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
    kexAlgorithm: 'ECDH ECP-256 (DH Group 19)',
    authAlgorithm: 'RSA-2048 / ECDSA-P256',
    handshakeBytes: 1400,
    roundTrips: 2,
    publicKeyBytes: 64, // RFC 5903 ECP-256 public value (x || y)
    ciphertextBytes: 0,
    notes: 'Standard IKEv2 with DH Group 19',
  },
  {
    protocol: 'IKEv2',
    mode: 'hybrid',
    modeLabel: 'ECP-256 + ML-KEM-768',
    kexAlgorithm: 'ECDH (IKE_SA_INIT) + ML-KEM-768 (Additional KE 1)',
    authAlgorithm: 'RSA-2048 / ECDSA-P256',
    handshakeBytes: 3784,
    roundTrips: 3,
    publicKeyBytes: 1248,
    ciphertextBytes: 1088,
    notes: 'draft-ietf-ipsecme-ikev2-mlkem Appendix A: ML-KEM in RFC 9370 IKE_INTERMEDIATE',
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

  // SSH — captured identification lines and transport packets through both NEWKEYS.
  {
    protocol: 'SSH',
    mode: 'classical',
    modeLabel: 'X25519 · Ed25519 auth',
    kexAlgorithm: 'curve25519-sha256',
    authAlgorithm: 'ssh-ed25519',
    handshakeBytes: sshSample('classical').totalBytes,
    roundTrips: 2,
    publicKeyBytes: sshSample('classical').clientShareBytes,
    ciphertextBytes: 0,
    notes:
      'Measured OQS-OpenSSH 10.3 sample; identification and transport framing included; login excluded.',
  },
  {
    protocol: 'SSH',
    mode: 'hybrid',
    modeLabel: 'ML-KEM + X25519 · Ed25519 auth',
    kexAlgorithm: 'mlkem768x25519-sha256',
    authAlgorithm: 'ssh-ed25519',
    handshakeBytes: sshSample('hybrid').totalBytes,
    roundTrips: 2,
    publicKeyBytes: sshSample('hybrid').clientShareBytes,
    ciphertextBytes: sshSample('hybrid').ciphertextBytes,
    notes:
      'Measured hybrid exchange keeps Ed25519 authentication; 1,120 B server share includes a 1,088 B ML-KEM ciphertext.',
  },
  {
    protocol: 'SSH',
    mode: 'pure-pqc',
    modeLabel: 'ML-KEM · ML-DSA-65 auth',
    kexAlgorithm: 'mlkem768-sha256',
    authAlgorithm: 'ssh-mldsa-65',
    handshakeBytes: sshSample('pure-pqc').totalBytes,
    roundTrips: 2,
    publicKeyBytes: sshSample('pure-pqc').clientShareBytes,
    ciphertextBytes: sshSample('pure-pqc').ciphertextBytes,
    notes:
      'Measured experimental OQS implementation; pure ML-KEM and ML-DSA SSH proposals remain drafts.',
  },

  // WireGuard
  {
    protocol: 'WireGuard',
    mode: 'classical',
    modeLabel: 'X25519 (Noise IK)',
    kexAlgorithm: 'X25519',
    authAlgorithm: 'X25519 (static keys)',
    // Handshake Initiation 148 B + Handshake Response 92 B (WireGuard paper, sections 5.4.2 and
    // 5.4.3: field widths, the hat marks a 16-byte AEAD tag). 272 B with the first empty keepalive
    // (32 B); a 64 B Cookie Reply is added only under load.
    handshakeBytes: 240,
    roundTrips: 1,
    publicKeyBytes: 32,
    ciphertextBytes: 0,
    notes: 'Noise IK pattern: 1-RTT handshake (initiation 148 B + response 92 B)',
  },
  {
    protocol: 'WireGuard',
    mode: 'hybrid',
    modeLabel: 'X25519 + Rosenpass PSK',
    kexAlgorithm: 'X25519 (WireGuard) + Kyber-512 ephemeral (Rosenpass)',
    authAlgorithm: 'X25519 (static) + Classic McEliece-460896 (static, keys exchanged out of band)',
    // Rosenpass messages only: InitHello 1,092 + RespHello 1,132 + InitConf 176 + EmptyData 64
    // = 2,464 B (Rosenpass white paper, Figure 2 "Rosenpass Message Types"). WireGuard's own
    // handshake is not included, and the paper makes no WireGuard comparison.
    handshakeBytes: 2464,
    roundTrips: 2,
    publicKeyBytes: 800, // Kyber-512 ephemeral public key (epki)
    ciphertextBytes: 768, // Kyber-512 ciphertext (ecti); McEliece ciphertexts are 188 B each
    notes:
      'Rosenpass: separate handshake using round-3 Kyber-512 and Classic McEliece-460896 (not FIPS 203 ML-KEM); its output is fed to WireGuard as the PSK. The size shown is the four Rosenpass messages only, not WireGuard’s own handshake',
  },
  {
    protocol: 'WireGuard',
    mode: 'pure-pqc',
    modeLabel: 'ML-KEM-768 (future)',
    kexAlgorithm: 'ML-KEM-768',
    authAlgorithm: 'Static ML-KEM-768 / Classic McEliece',
    handshakeBytes: 5500,
    roundTrips: 2,
    publicKeyBytes: 1184,
    ciphertextBytes: 1088,
    notes: 'Hypothetical; Noise requires static KEM operations for auth, not digital signatures',
  },

  // TLS 1.3
  {
    protocol: 'TLS 1.3',
    mode: 'classical',
    modeLabel: 'X25519 · RSA-2048 auth',
    kexAlgorithm: 'X25519',
    authAlgorithm: 'RSA-2048, RSA-PSS/SHA-256 CertificateVerify',
    handshakeBytes: tlsSample('classical').totalBytes,
    roundTrips: 1,
    publicKeyBytes: tlsSample('classical').clientShareBytes,
    ciphertextBytes: 0,
    notes:
      'Measured OpenSSL 3.6.3 sample: seven handshake-layer messages, leaf + intermediate; record/TCP/IP framing excluded.',
  },
  {
    protocol: 'TLS 1.3',
    mode: 'hybrid',
    modeLabel: 'X25519MLKEM768 · RSA-2048 auth',
    kexAlgorithm: 'X25519 + ML-KEM-768',
    authAlgorithm: 'RSA-2048, RSA-PSS/SHA-256 CertificateVerify',
    handshakeBytes: tlsSample('hybrid').totalBytes,
    roundTrips: 1,
    publicKeyBytes: tlsSample('hybrid').clientShareBytes,
    ciphertextBytes: tlsSample('hybrid').ciphertextBytes,
    notes:
      'RFC 10024 group; measured sample keeps RSA authentication. Client/server key shares are 1,216/1,120 B; the ML-KEM ciphertext component is 1,088 B.',
  },
  {
    protocol: 'TLS 1.3',
    mode: 'pure-pqc',
    modeLabel: 'MLKEM768 · ML-DSA-65 auth',
    kexAlgorithm: 'ML-KEM-768',
    authAlgorithm: 'ML-DSA-65',
    handshakeBytes: tlsSample('pure-pqc').totalBytes,
    roundTrips: 1,
    publicKeyBytes: tlsSample('pure-pqc').clientShareBytes,
    ciphertextBytes: tlsSample('pure-pqc').ciphertextBytes,
    notes:
      'Measured OpenSSL 3.6.3 sample; ML-DSA TLS authentication uses draft-ietf-tls-mldsa-06 (RFC Editor queue). This runtime example does not establish support in other endpoints.',
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
    ikev2: 'draft-ietf-ipsecme-ikev2-mlkem (RFC Editor queue)',
    ssh: 'mlkem768x25519 in OpenSSH 9.9',
    wireguard: 'Rosenpass project (external)',
    tls13: 'RFC 10024 (X25519MLKEM768)',
  },
  {
    feature: 'PQC Integration Method',
    ikev2: 'Additional key exchange (RFC 9370 KE payload in IKE_INTERMEDIATE)',
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
    ikev2: 'draft-ietf-ipsecme-ikev2-pqc-auth (ML-DSA, SLH-DSA; RFC Editor queue)',
    ssh: 'No PQC host key standard yet',
    wireguard: 'Rosenpass authenticates with static Classic McEliece keys',
    tls13: 'draft-ietf-tls-mldsa (ML-DSA certs)',
  },
  {
    feature: 'Crypto Agility',
    ikev2: 'High: negotiated transforms',
    ssh: 'High: negotiated algorithms',
    wireguard: 'None: fixed X25519 + ChaCha20',
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
