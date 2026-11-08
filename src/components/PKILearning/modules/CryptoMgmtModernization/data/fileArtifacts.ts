// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Cryptographically-protected file artifacts inventory.
 *
 * Covers the "Files" asset class from NIST CSWP.39 Fig.3 (Assets row):
 * Code, Libraries, Applications, Files, Protocols, Systems.
 *
 * NOTE: Rows are illustrative defaults for teaching. Replace with the
 * actual file artifacts in your environment before quoting.
 */

import type { RiskColor } from './cryptoLibraries'

export interface FileArtifactRecord {
  id: string
  label: string
  category: string
  classical: string
  pqcTarget: string
  posture: RiskColor
  notes: string
}

export const FILE_ARTIFACTS: FileArtifactRecord[] = [
  {
    id: 'tls-server-cert',
    label: 'TLS server certificate (PEM/DER)',
    category: 'Certificate file',
    classical: 'RSA-2048 or ECDSA-P256',
    pqcTarget:
      'A post-quantum signature in the certificate (for example ML-DSA, FIPS 204) once the CA chain and client trust stores support it',
    posture: 'yellow',
    notes:
      'Issued by internal or public CA. The certificate authenticates the server with a signature, so its migration target is a signature algorithm, not a KEM group. The TLS key exchange (for example the hybrid X25519MLKEM768 group, RFC 10024) is a separate dependency, configured in the TLS stack, and it is the part exposed to harvest-now-decrypt-later; RFC 9954 notes that session authentication cannot be retroactively broken. Certificate migration depends on CA support for ML-DSA leaf certs and client trust-store updates.',
  },
  {
    id: 'codesign-binary',
    label: 'Code-signing binary signatures',
    category: 'Signed binary',
    classical: 'RSA-2048 or ECDSA-P256',
    pqcTarget: 'SLH-DSA-SHA2-128s or ML-DSA-65',
    posture: 'red',
    notes:
      'A signature on a shipped binary is checked long after it was made, so the risk is forgery and loss of trust in old signatures once a cryptographically relevant quantum computer exists. It is not harvest-now-decrypt-later: there is no recorded ciphertext to decrypt. Assess the verification policy instead: which verifiers check the signature, how long it must stay trusted, and whether timestamps or re-signing can extend that trust. SLH-DSA is an option where signature size is acceptable; its security rests on hash functions rather than lattice problems.',
  },
  {
    id: 'disk-encryption-keys',
    label: 'Disk-encryption keys',
    category: 'Key file',
    classical: 'AES-256 (symmetric)',
    pqcTarget: 'AES-256 retained; rotate key-wrapping keys to ML-KEM-768 envelopes',
    posture: 'green',
    notes:
      'In the idealized Grover model, AES-256 keeps a margin of about 128 bits. Treat the key-encryption-key chain as the migration target, not the data key.',
  },
  {
    id: 'archive-at-rest',
    label: 'Encrypted data-at-rest archives',
    category: 'Encrypted archive',
    classical: 'AES-256-GCM',
    pqcTarget: 'AES-256-GCM retained; wrap DEKs with ML-KEM envelopes via HSM',
    posture: 'yellow',
    notes:
      'Archive payloads stay symmetric. The audit risk is the wrapping key path: bind to HSM-resident ML-KEM key-wrapping keys.',
  },
  {
    id: 'pgp-release-sig',
    label: 'PGP/GPG signed release packages',
    category: 'Signed archive',
    classical: 'RSA-4096 or Ed25519',
    pqcTarget: 'ML-DSA-65 or SLH-DSA-SHA2-128s',
    posture: 'red',
    notes:
      'RFC 9980 (June 2026) defines composite ML-DSA + EdDSA signature schemes (with Ed25519 or Ed448) and the standalone SLH-DSA signature scheme. Plan parallel signatures during transition.',
  },
]
