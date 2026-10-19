// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Learner-facing evidence contract for browser Playground tools.
 *
 * These labels describe what the operation demonstrates. They are deliberately
 * separate from algorithm names and from standards/certification status.
 */
import {
  EVIDENCE_CLASS_LABEL,
  NON_CERTIFICATION_NOTICE,
  type ToolEvidenceClass,
} from '@/data/evidenceClassification'

export { EVIDENCE_CLASS_LABEL, NON_CERTIFICATION_NOTICE, type ToolEvidenceClass }

export interface ToolEvidenceProfile {
  primary: ToolEvidenceClass
  secondary?: ToolEvidenceClass
  summary: string
  /** Results can resemble laboratory or certification evidence. */
  certificationBoundary?: boolean
}

export const BROWSER_TOOL_EVIDENCE: Record<string, ToolEvidenceProfile> = {
  'cacp-kmip': {
    primary: 'real-crypto',
    secondary: 'protocol-model',
    summary: 'Real in-browser HSM and KMIP operations inside a modelled control-plane workflow.',
    certificationBoundary: true,
  },
  'hsm-capacity': {
    primary: 'calculator',
    summary:
      'Assumption-driven fleet sizing; results are estimates, not measured product capacity.',
  },
  'hybrid-encrypt': {
    primary: 'real-crypto',
    summary: 'Real browser cryptographic operations using the named implementation and parameters.',
  },
  'envelope-encrypt': {
    primary: 'real-crypto',
    summary:
      'Real key establishment, derivation, wrapping, and authenticated encryption in-browser.',
  },
  'token-migration': {
    primary: 'real-crypto',
    summary:
      'Real signatures over controlled sample tokens; size comparisons are limited to those inputs.',
  },
  'firmware-signing': {
    primary: 'real-crypto',
    secondary: 'deterministic-demo',
    summary: 'Real signing and verification over a supplied educational firmware image.',
    certificationBoundary: true,
  },
  'slh-dsa': {
    primary: 'real-crypto',
    summary: 'Real SLH-DSA key generation, signing, and verification in the browser.',
  },
  'lms-hss': {
    primary: 'real-crypto',
    secondary: 'protocol-model',
    summary: 'Real signature operations with a modelled state-management and recovery workflow.',
  },
  'hybrid-sigs': {
    primary: 'real-crypto',
    summary: 'Real component signatures combined using the displayed educational construction.',
  },
  'kdf-derivation': {
    primary: 'real-crypto',
    summary: 'Real KDF operations with learner-supplied or generated demonstration inputs.',
  },
  'tee-channel': {
    primary: 'protocol-model',
    secondary: 'real-crypto',
    summary: 'A modelled enclave channel whose cryptographic primitives execute in-browser.',
  },
  'tls-simulator': {
    primary: 'protocol-model',
    secondary: 'real-crypto',
    summary:
      'A browser-local TLS peer model with real cryptographic operations, not an external network handshake.',
  },
  'vpn-sim': {
    primary: 'protocol-model',
    secondary: 'real-crypto',
    summary:
      'A browser-local IKE/IPsec state model with real cryptographic operations, not a deployed VPN peer.',
  },
  'pqc-ssh-sim': {
    primary: 'protocol-model',
    secondary: 'real-crypto',
    summary: 'A mixed REAL/MODEL SSH experience; each result identifies which path produced it.',
  },
  'suci-flow': {
    primary: 'protocol-model',
    secondary: 'real-crypto',
    summary:
      'A modelled 5G SUCI workflow using real cryptographic primitives on synthetic subscriber data.',
  },
  'mls-group-messaging': {
    primary: 'protocol-model',
    secondary: 'real-crypto',
    summary:
      'Real ML-DSA, ML-KEM, and AES operations around a TreeKEM visual model; no external OpenMLS interoperability is tested.',
  },
  'tpm-playground': {
    primary: 'real-crypto',
    secondary: 'protocol-model',
    summary:
      'Real operations in a browser TPM emulator derived from the stated engine snapshot, not physical TPM evidence.',
    certificationBoundary: true,
  },
  'rng-demo': {
    primary: 'deterministic-demo',
    secondary: 'synthetic-simulation',
    summary:
      'Controlled random-source comparisons for learning; they do not characterize a physical entropy source.',
    certificationBoundary: true,
  },
  'qrng-demo': {
    primary: 'synthetic-simulation',
    summary: 'Simulated QRNG samples compared with browser randomness and deliberately weak data.',
    certificationBoundary: true,
  },
  'entropy-test': {
    primary: 'deterministic-demo',
    summary:
      'Real statistical checks over a small educational sample, not a complete SP 800-90B assessment.',
    certificationBoundary: true,
  },
  'drbg-demo': {
    primary: 'real-crypto',
    secondary: 'deterministic-demo',
    summary:
      'Real DRBG state transitions over controlled inputs; a passing run is not an implementation validation.',
    certificationBoundary: true,
  },
  'source-combining': {
    primary: 'deterministic-demo',
    secondary: 'real-crypto',
    summary:
      'Real conditioning primitives applied to simulated sources under explicit entropy assumptions.',
    certificationBoundary: true,
  },
  'pki-workshop': {
    primary: 'deterministic-demo',
    secondary: 'real-crypto',
    summary:
      'Real certificate operations in a controlled educational PKI, not a public or enterprise CA.',
  },
  'cert-capacity': {
    primary: 'calculator',
    summary:
      'Certificate and transport sizing from documented inputs and assumptions, not a benchmark.',
  },
  'hybrid-certs': {
    primary: 'real-crypto',
    secondary: 'deterministic-demo',
    summary: 'Real certificate construction and inspection in a controlled browser-local example.',
  },
  'merkle-proof': {
    primary: 'real-crypto',
    summary: 'Real hashing and proof verification over learner-visible demonstration data.',
  },
  'digital-id': {
    primary: 'protocol-model',
    secondary: 'real-crypto',
    summary:
      'A modelled digital-identity lifecycle with real browser cryptography; no government wallet conformance is tested.',
    certificationBoundary: true,
  },
  'bitcoin-flow': {
    primary: 'deterministic-demo',
    secondary: 'real-crypto',
    summary:
      'Real primitives in a controlled wallet/transaction demonstration; no asset or live network is used.',
  },
  'hd-wallet': {
    primary: 'real-crypto',
    summary:
      'Real deterministic key derivation from synthetic learner inputs; never use a live wallet seed.',
  },
  'solana-flow': {
    primary: 'deterministic-demo',
    secondary: 'real-crypto',
    summary:
      'Real primitives in a controlled transaction demonstration; no asset or live network is used.',
  },
  'openssl-studio': {
    primary: 'real-crypto',
    summary: 'Real OpenSSL WebAssembly commands running locally in the browser.',
  },
  'api-security-jwt': {
    primary: 'real-crypto',
    secondary: 'deterministic-demo',
    summary: 'Real signing, verification, and encryption over controlled API-token examples.',
  },
  'pki-enrollment': {
    primary: 'protocol-model',
    secondary: 'real-crypto',
    summary:
      'Real key and CMP operations with an in-process mock CA; EST transport is simulated and external interoperability is not tested.',
  },
  'email-signing': {
    primary: 'real-crypto',
    secondary: 'deterministic-demo',
    summary: 'Real CMS/S/MIME operations over controlled messages in OpenSSL WebAssembly.',
  },
}

export function evidenceForTool(toolId: string): ToolEvidenceProfile | undefined {
  return BROWSER_TOOL_EVIDENCE[toolId]
}
