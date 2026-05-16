// SPDX-License-Identifier: GPL-3.0-only
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
    pqcTarget: 'Hybrid X25519+ML-KEM-768, or pure ML-KEM-768 once CA chain ready',
    posture: 'yellow',
    notes:
      'Issued by internal or public CA. Migration depends on CA support for ML-DSA leaf certs and client trust-store updates.',
  },
  {
    id: 'codesign-binary',
    label: 'Code-signing binary signatures',
    category: 'Signed binary',
    classical: 'RSA-2048 or ECDSA-P256',
    pqcTarget: 'SLH-DSA-SHA2-128s or ML-DSA-65',
    posture: 'red',
    notes:
      'Long-lived signatures on shipped binaries are HNDL-sensitive. SLH-DSA preferred where signature size is acceptable due to stateless hash-based security margin.',
  },
  {
    id: 'disk-encryption-keys',
    label: 'Disk-encryption keys',
    category: 'Key file',
    classical: 'AES-256 (symmetric)',
    pqcTarget: 'AES-256 retained; rotate key-wrapping keys to ML-KEM-768 envelopes',
    posture: 'green',
    notes:
      'Symmetric AES-256 keeps a 128-bit margin against Grover. Treat the key-encryption-key chain as the migration target, not the data key.',
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
      'OpenPGP PQC profile draft (draft-ietf-openpgp-pqc) defines ML-DSA + SLH-DSA composites. Plan parallel signatures during transition.',
  },
]
