// SPDX-License-Identifier: GPL-3.0-only
/**
 * Cross-reference overlay: sandbox scenario → PQC Protocol Matrix row.
 *
 * The 2026-06-17 audit flagged that sandbox scenarios had no authored link into
 * the Protocol Matrix even when a scenario clearly exercises a protocol the
 * matrix already tracks. This overlay supplies that breadcrumb so a learner can
 * jump from "run the TLS 1.3 handshake" to "see the TLS 1.3 PQC readiness row".
 *
 * Keyed by scenario id STRING (not SandboxTrackId) so adding a scenario/track
 * never turns this into a compile error — coverage is intentionally partial
 * (only scenarios whose primary protocol is a matrix row are mapped). A unit
 * test asserts every protocolId here resolves to a real PROTOCOL_MATRIX row.
 */
export interface SandboxProtocolRef {
  /** Top-level id of a PROTOCOL_MATRIX row (see pqcProtocolMatrix.ts). */
  protocolId: string
  /** Human label for the breadcrumb chip. */
  label: string
}

const SANDBOX_PROTOCOL_MAP: Record<string, SandboxProtocolRef> = {
  // TLS 1.3 transport scenarios
  tls: { protocolId: 'tls-1-3', label: 'TLS 1.3' },
  'browser-tls': { protocolId: 'tls-1-3', label: 'TLS 1.3' },
  'migration-impact': { protocolId: 'tls-1-3', label: 'TLS 1.3' },
  haproxy: { protocolId: 'tls-1-3', label: 'TLS 1.3' },
  'ab-handshake-bench': { protocolId: 'tls-1-3', label: 'TLS 1.3' },
  'database-postgres': { protocolId: 'tls-1-3', label: 'TLS 1.3' },
  'iot-mqtt': { protocolId: 'tls-1-3', label: 'TLS 1.3' },
  // SSH
  ssh: { protocolId: 'ssh', label: 'SSH' },
  // IKEv2 / IPsec
  vpn: { protocolId: 'ike-ipsec', label: 'IKEv2 / IPsec' },
  // X.509 / PKI
  pki: { protocolId: 'x509', label: 'X.509' },
  'cert-validation': { protocolId: 'x509', label: 'X.509' },
  'hybrid-certs': { protocolId: 'x509', label: 'X.509' },
  // Certificate enrollment
  stepca: { protocolId: 'est-cmp', label: 'EST / CMP' },
  // S/MIME
  smime: { protocolId: 'smime', label: 'S/MIME' },
  // OpenPGP
  sequoia: { protocolId: 'openpgp', label: 'OpenPGP' },
  // KMIP
  'pqctoday-kmip': { protocolId: 'kmip', label: 'KMIP' },
  // PKCS#11 — the benchmark drives the softhsmv3 PKCS#11 v3.2 engine directly,
  // which is the matrix's `pkcs11` row rather than any wire protocol.
  'hsm-perf-bench': { protocolId: 'pkcs11', label: 'PKCS#11' },
  // NOTE — `wireguard` was mapped here until 2026-07-28, when the sandbox
  // scenario was deleted. Rosenpass, the only PQ-WireGuard we could ship, uses
  // pre-standardisation Kyber-512 (FIPS 203 superseded it with ML-KEM, and the
  // two are not interoperable), upstream has no ML-KEM release, and Mullvad's
  // ML-KEM implementation is client-only and account-gated. The matrix's
  // `wireguard` row therefore has NO scenario again — a real coverage gap, kept
  // visible here rather than silently dropped.
  // NOTE — `mtc` (Merkle Tree Certificates) is deliberately NOT mapped here.
  // The hub does track it, but as a TRANSPORT_ISSUES entry (`merkle-tree-certs`),
  // not as a PROTOCOL_MATRIX row — MTC is a certificate-size mitigation, not a
  // protocol. Mapping it to a matrix row would fail the unit test below. If a
  // sandbox↔transport-issue overlay is ever wanted, it needs its own map.
  // Software supply-chain signing
  'supply-chain-signing': { protocolId: 'sigstore', label: 'Sigstore' },
  // JOSE / JWT
  'api-security-jwt': { protocolId: 'jose', label: 'JOSE / JWT' },
  // TPM 2.0
  'tpm-playground': { protocolId: 'tpm', label: 'TPM 2.0' },
  'tpm-pqc-migration': { protocolId: 'tpm', label: 'TPM 2.0' },
  // Firmware / UEFI
  'firmware-hss': { protocolId: 'uefi', label: 'UEFI' },
}

export function getSandboxProtocolRef(scenarioId: string): SandboxProtocolRef | undefined {
  return SANDBOX_PROTOCOL_MAP[scenarioId] // eslint-disable-line security/detect-object-injection
}

/** Deep-link to the Protocol Matrix page with the row's detail modal preselected. */
export function protocolMatrixHref(ref: SandboxProtocolRef): string {
  return `/algorithms?protocol=${encodeURIComponent(ref.protocolId)}`
}
