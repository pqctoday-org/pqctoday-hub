// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the AISecurityPQC module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'ai-security-pqc',
  version: '1.0.0',
  lastReviewed: '2026-08-10',
  lastEdited: '2026-08-24',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    // RFC 9846 (July 2026) is the current TLS 1.3 specification — its header reads
    // "Obsoletes: 5077, 5246, 6961, 7627, 8422, 8446". Repointed off RFC 8446
    // 2026-08-22; the library row for 8446 already carried 9846 as its
    // supersession pointer.
    getStandard('RFC-9846-The-Transport-Layer-Security-TLS-Protocol-Version-1'),
    // DECLARED 2026-08-23: this module tells a reader that keys live in a FIPS 140-3
    // validated module and cited nothing for it. Found by
    // audit_module_designation_aliases.py — the literal-id check could not match the
    // prose "FIPS 140-3" against a row filed as FIPS-140-3-STANDARD.
    getStandard('FIPS-140-3-STANDARD'),
    // DECLARED 2026-08-23: this module labels a hashing mechanism it describes as conforming to FIPS 180-4
    // (the Secure Hash Standard) and cited nothing for it. Found by
    // audit_module_designation_aliases.py — the literal-id check could not match the
    // prose "FIPS 180-4" against a row filed as FIPS-180-4.
    getStandard('FIPS-180-4'),
    // DECLARED 2026-08-23: this module labels an AES-GCM mechanism it describes as conforming to SP 800-38D
    // and cited nothing for it. Found by
    // audit_module_designation_aliases.py — the literal-id check could not match the
    // prose "SP 800-38D" against a row filed as NIST-SP-800-38D.
    getStandard('NIST-SP-800-38D'),
  ],

  algorithms: [
    getAlgorithm('ECDH P-256'),
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
    getAlgorithm('X25519'),
  ],

  deadlines: [
    // No regulatory deadlines detected — add manually if needed
  ],

  narratives: {
    overview:
      'Quantum threats to AI data pipelines (HNDL on training data, data poisoning via forged signatures). Model collapse from AI-generated training data contamination. Cryptographic data provenance (C2PA content credentials, hash chains, watermark detection). Model weight protection (encryption at rest/transit/use, ML-DSA model signing). AI agent authentication (machine identity, delegation tokens, credential lifecycles).',
    workshopSummary:
      'Data Protection Analyzer — Audit AI pipeline crypto operations for quantum vulnerabilities. Data Authenticity Verifier — Configure verification layers, visualize model collapse, compare signing overheads. Model Weight Vault — Configure model encryption/signing, compare classical vs PQC overhead. Agent Auth Designer — Design delegation chains with PQC credentials. Agentic Commerce Simulator — Step through agent transaction flows with quantum overlay.',
    relatedStandards:
      'FIPS 203 (ML-KEM) — key encapsulation for data and model encryption. FIPS 204 (ML-DSA) — digital signatures for data provenance, model signing, agent credentials. C2PA (Coalition for Content Provenance and Authenticity) — content credentials standard. RFC 9846 (TLS 1.3, July 2026 — obsoletes RFC 8446) — transport security for AI API endpoints. NIST AI RMF — AI risk management framework',
  },
}
