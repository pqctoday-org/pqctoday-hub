// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the CloudPqc module (LM-080).
 * New module: do not set lastReviewed until an editorial review entry exists in revisions.jsonl.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0, NIST_DEPRECATION } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'cloud-pqc',
  version: '1.0.0',
  lastEdited: '2026-11-18',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('NIST IR 8547'),
    getStandard('RFC-10024'),
    getStandard('RFC-9846-The-Transport-Layer-Security-TLS-Protocol-Version-1'),
    getStandard('EO-2026-06-22-Securing-the-Nation'),
    getStandard('OMB-M-26-15'),
    getStandard('FIPS-140-3-STANDARD'),
    getStandard('RFC 9180'),
    getStandard('NIST-SP-800-210-General-Access-Control-Guidance-for-Cloud-Sy'),
    getStandard('AWS-KMS-Post-Quantum-Keys'),
    getStandard('AWS-KMS-ML-KEM-Launch-2026-10'),
    getStandard('AWS-KMS-Import-Wrapping-Keys'),
    getStandard('AWS-KMS-API-Decapsulate'),
    getStandard('AWS-KMS-Hybrid-PQ-TLS'),
    getStandard('AWS-PQ-Readiness-Confidentiality'),
    getStandard('Google-Cloud-KMS-Quantum-Safe-Key-Import'),
    getStandard('Google-Cloud-KMS-Release-Notes'),
    getStandard('Azure-Key-Vault-BYOK-Specification'),
    getStandard('Azure-Managed-HSM-BYOK'),
  ],

  algorithms: [
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
    getAlgorithm('X25519'),
  ],

  deadlines: [
    {
      label: 'FIPS 140-2 moved to Historical status; new acquisitions require FIPS 140-3',
      year: 2026,
      source: 'NIST CMVP (Sept 2026)',
    },
    {
      label: 'CNSA 2.0 required in new NSS acquisitions',
      year: CNSA_2_0.networkingRequired,
      source: 'CNSA 2.0 FAQ v2.2 (Oct 2026)',
    },
    {
      label: 'NIST: deprecate quantum-vulnerable public-key cryptography (RSA, ECC)',
      year: NIST_DEPRECATION.deprecateClassical,
      source: 'NIST IR 8547 (final, Oct 2026)',
    },
    {
      label: 'CNSA 2.0 mandated for National Security Systems unless otherwise noted',
      year: CNSA_2_0.fullEnforcement,
      source: 'CNSA 2.0 FAQ v2.2 (Oct 2026)',
    },
    {
      label: 'NIST: disallow classical public-key cryptography',
      year: NIST_DEPRECATION.disallowClassical,
      source: 'NIST IR 8547 (final, Oct 2026)',
    },
  ],

  narratives: {
    overview:
      'Cloud-Native & SaaS PQC Migration equips architects, platform engineers, developers, and GRC leads to separate customer-controlled cryptographic surfaces from provider-managed layers across AWS, Azure, GCP, and third-party SaaS. Rather than assuming a cloud provider migrates everything automatically, teams learn to verify edge and origin TLS negotiation, cloud KMS/BYOK boundaries, regional feature availability, and SaaS federation evidence.',
    sharedResponsibility:
      'Cloud shared responsibility for PQC splits along control planes, data planes, and key custodianship. Always distinguish the business or cloud service (for example, an object-storage or records-archiving service) from the protected asset (the long-lived encrypted records stored inside it). Providers control underlying hardware, hypervisors, and default service endpoints; customers still select TLS security policies, configure origin-leg TLS, choose KMS key specs and rotation, design BYOK/HYOK transport, and verify SaaS vendor posture.',
    edgeAndTls:
      'Hybrid post-quantum key exchange for TLS 1.3 (RFC 9846 and RFC 10024, led by X25519MLKEM768 codepoint 0x11EC) mitigates harvest-now-decrypt-later (HNDL) risk on public and inter-region traffic. Enabling hybrid TLS on a CDN or load balancer only protects the client-to-edge leg; origin-leg TLS, API gateways, service meshes, and middleboxes that truncate oversized ClientHello messages must be tested and verified independently.',
    kmsByokStorage:
      'Late-2026 cloud KMS capabilities differ sharply by provider, region, and import path. AWS KMS supports ML-DSA signing keys (June 2025) and ML-KEM key-establishment keys (launched 26 October 2026, excluding China, Middle East UAE, and Middle East Bahrain Regions), but BYOK import wrapping remains RSA-only, there is no KMIP endpoint, Decapsulate returns the 32-byte shared secret in plaintext to the caller, and no key policy condition can require post-quantum TLS. Google Cloud KMS offers GA ML-DSA and SLH-DSA signing (July 2026) and Preview HPKE quantum-safe key import (RFC 9180) for software-protected keys. Azure Key Vault and Managed HSM use CKM_RSA_AES_KEY_WRAP for BYOK under RSA-HSM wrapping keys. Verify each capability in the target region and confirm FIPS 140-3 validation status following the September 2026 FIPS 140-2 Historical transition.',
    saasAndGovernance:
      'SaaS applications and identity providers (OIDC/SAML) sit outside direct customer cryptographic control. Governance teams must scope vendor evidence requests around negotiated TLS NamedGroups, KMS/BYOK key custody, token-signing roadmaps, FIPS 140-3 certificates, and subprocessor inheritance. Unanswered or unknown vendor fields represent an evidence gap — never low exposure.',
    workshopSummary:
      'Four interactive steps: (1) Cloud Estate Mapper separating customer-controlled vs. provider-managed crypto and services vs. protected assets; (2) Provider Capability Matrix filtering AWS, Azure, and GCP PQC status with exact production verification commands; (3) Edge TLS & KMS Cutover Lab testing middlebox ClientHello truncation, edge-vs-origin TLS mismatch, RSA-only BYOK import, and FIPS 140-2 Historical cutover; (4) SaaS Boundary Checklist enforcing Yes/No/Unknown evidence scoping where unknown never equals low exposure.',
    relatedStandards:
      'FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), NIST IR 8547 (final Oct 2026), RFC 9846 (TLS 1.3), RFC 10024 (TLS 1.3 PQ/T hybrid key agreement, X25519MLKEM768 0x11EC), RFC 9180 (HPKE), FIPS 140-3 (CMVP; FIPS 140-2 Historical Sept 2026), NIST SP 800-210 (Cloud Access Control), EO 14412 & OMB M-26-15.',
  },
}
