// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the DNSSECPQC module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'dnssec-pqc',
  version: '1.0.0',
  // No lastReviewed yet — nobody has independently reviewed this brand-new
  // module's factual claims via record_module_review.py. Leave it unset
  // (see ModuleContentTypes.ts) rather than claim a review that hasn't
  // happened; ModuleReferencesTab renders nothing when it's absent.
  lastEdited: '2026-09-19',

  standards: [
    getStandard('RFC 4034'),
    getStandard('RFC 9364'),
    // draft-westerbaan-dnssec-mldsa-04 — library reference_id derived from its
    // own title by add_row.py, not the draft slug (verified against the CSV,
    // not guessed).
    getStandard('Module-Lattice-Digital-Signature-Algorithm-for-DNSSEC'),
    getStandard('draft-sheth-pqc-dnssec-strategy-01'),
    getStandard('draft-fregly-dnsop-slh-dsa-mtl-dnssec-06'),
    getStandard('Module-Lattice-Based-Signatures-with-Merkle-Tree-Ladders-ML'),
  ],

  algorithms: [
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('Ed25519'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
  ],

  deadlines: [
    // No regulatory deadlines discussed in this module — confirmed via review.
    // Cloudflare's own ~2029 full-PQ-DNSSEC target and the separate,
    // broader DNS-root-zone algorithm rollover estimate (mid-2030s, per
    // Verisign, cited in pqcProtocolMatrix.ts) are vendor/ecosystem roadmap
    // narratives, not regulatory deadlines, and are kept explicitly distinct
    // in the prose rather than modeled here.
  ],

  narratives: {
    mldsa44PublicKeyBytes: '1,312 bytes',
    mldsa44SigBytes: '2,420 bytes',
    ecdsaP256SigBytes: '64 bytes',
    slhDsa128sSigBytes: '7,856 bytes',
    dnsUdpPracticalLimit: '~1,232 bytes',
    ianaAlgorithmNumber: '18',
    ianaMnemonic: 'MLDSA44',
    cloudflareBlogDate: '2026-09-10',
    testZone: 'dnstest.dev',
    cloudflareTarget:
      '~2029 (Cloudflare’s company-wide post-quantum security target, not a DNSSEC-specific completion date)',
    rootZoneRollover: 'mid-2030s (Verisign estimate, separate from Cloudflare’s roadmap)',
  },
}
