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
