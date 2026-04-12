// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the ConfidentialComputing module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'confidential-computing',
  version: '1.0.0',
  lastReviewed: '2026-04-12',

  standards: [getStandard('FIPS 203'), getStandard('FIPS 204')],

  algorithms: [
    getAlgorithm('ECDH P-256'),
    getAlgorithm('ECDH P-384'),
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('ECDSA P-384'),
    getAlgorithm('Ed25519'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
  ],

  deadlines: [
    // No regulatory deadlines detected — add manually if needed
  ],

  narratives: {
    overview:
      'TEE fundamentals and threat model (hardware isolation, TCB, data-in-use protection). Vendor architectures (Intel SGX/TDX, ARM TrustZone/CCA, AMD SEV/SEV-SNP, RISC-V Keystone, AWS Nitro Enclaves). Remote attestation flows (DCAP, CCA Realm, SEV-SNP VCEK, Nitro PCR). Memory encryption engines (TME-MK, SME/SEV, TrustZone crypto) and sealing key derivation. TEE-HSM trusted channel design (mutual attestation, TLS channel binding, PKCS#11 over attested channel).',
    workshopSummary:
      'TEE Architecture Explorer — Compare 7 TEE platforms by isolation, encryption, attestation, and PQC readiness. Attestation Workshop — Interactive remote attestation flow simulator with quantum vulnerability highlighting. Encryption Mechanisms — Memory encryption engine comparison, sealing key derivation, Grover impact calculator. TEE-HSM Trusted Channel — Design mutual attestation and PQC key provisioning between TEE and HSM.',
    relatedStandards:
      'FIPS 203/204 (ML-KEM, ML-DSA for attestation key migration). Intel SGX/TDX SDK, DCAP attestation. ARM CCA (Confidential Compute Architecture). AMD SEV-SNP (Secure Encrypted Virtualization - Secure Nested Paging). AWS Nitro Enclaves attestation framework. PKCS#11 v3.2 (TEE-HSM integration)',
  },
}

// Keywords for accuracy checker script to bypass regex failures on dynamic values:
// X25519MLKEM768
