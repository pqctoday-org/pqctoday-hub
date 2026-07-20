// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the MerkleTreeCerts module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'merkle-tree-certs',
  version: '1.2.0',
  lastReviewed: '2026-07-19',

  standards: [
    // The MTC spec itself — cited by section (§2.1 roles, §5.3 TreeHead, §6.2-6.4
    // sizing) throughout MTCIntroduction.tsx, CTLogSimulator.tsx and mtcConstants.ts.
    // Was missing from the ledger even though it's the module's core subject.
    getStandard('draft-ietf-plants-merkle-tree-certs'),
    getStandard('FIPS 204'), // ML-DSA — CA batch-signing algorithm used in every workshop step
    getStandard('FIPS 205'), // SLH-DSA (SPHINCS+) — size-comparison algorithm; nested Merkle trees discussed in Related Resources
    // SHA-256 — the leaf/internal node hash function; cited by name ("FIPS 180-4 ACVP")
    // in MerkleTreeBuilder.tsx's Known-Answer-Test panel.
    getStandard('FIPS-180-4'),
    // Certificate Transparency v2.0 — the MTH/SubProof consistency-proof algorithm is
    // implemented verbatim (with section numbers) in utils/merkleTree.ts and rendered
    // in Step 5's CT Log Simulator. RFC 6962 (removed) is never cited by number anywhere
    // in the module — only "Certificate Transparency" generically — and RFC 9162
    // obsoletes it, so RFC 9162 alone is the accurate citation.
    getStandard('RFC-9162'),
  ],

  algorithms: [
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
  ],

  deadlines: [
    // Confirmed: no regulatory deadline is discussed anywhere in this module.
    // MTC is an in-progress IETF draft (not yet an RFC), not tied to a compliance mandate.
  ],

  narratives: {
    // 3x sig+key sum for ML-DSA-44 — matches the "Sigs + Keys" traditional-chain figure
    // (11,196 B) shown in MTCIntroduction.tsx's ML-DSA-44 Handshake Size Comparison table.
    mlDsa44Chain: `${(
      (3 *
        (getAlgorithm('ML-DSA-44').signatureOrCiphertextBytes +
          getAlgorithm('ML-DSA-44').publicKeyBytes)) /
      1024
    ).toFixed(1)} KB`,
    // 3x sig+key sum for SLH-DSA-SHA2-128s — same traditional-chain calculation, used for
    // the "hash-based" comparison row in workshop/SizeComparison.tsx.
    slhDsaChain: `${(
      (3 *
        (getAlgorithm('SLH-DSA-SHA2-128s').signatureOrCiphertextBytes +
          getAlgorithm('SLH-DSA-SHA2-128s').publicKeyBytes)) /
      1024
    ).toFixed(0)} KB`,
    // Matches MTC_INCLUSION_PROOF_BYTES in data/mtcConstants.ts (23 sibling hashes x 32
    // bytes) and the "736 bytes" figure quoted directly in MTCIntroduction.tsx for a
    // ~4.4M-certificate batch. Was previously an unverifiable "900 bytes" approximation.
    mtcOverhead: '736 bytes',
    // Single sig+key for ML-DSA-65 — the default CA algorithm in CTLogSimulator.tsx,
    // illustrating MTC's "one signature covers the whole batch" model (vs. the 3x sums above).
    mlDsa65Chain: `${(
      (1 * getAlgorithm('ML-DSA-65').signatureOrCiphertextBytes +
        1 * getAlgorithm('ML-DSA-65').publicKeyBytes) /
      1024
    ).toFixed(1)} KB`,
  },
}
