// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the EMVPaymentPQC module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'emv-payment-pqc',
  version: '1.0.0',
  lastReviewed: '2026-03-28',

  standards: [
    getStandard('FIPS 186-5'),
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 206'),
  ],

  algorithms: [
    getAlgorithm('ECDH P-256'),
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('FN-DSA-512'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('X25519'),
  ],

  deadlines: [
    // No regulatory deadlines detected — add manually if needed
  ],

  narratives: {
    overview:
      "Advanced-level module (120 min, 6 workshop steps) covering post-quantum cryptography migration for the EMV payment ecosystem — the world's largest deployed PKI with 14.7 billion chip cards across Visa, Mastercard, Amex, UnionPay, and Discover.",
    keyConcepts:
      'EMV Card Authentication: SDA (static RSA), DDA (dynamic RSA per-transaction), CDA (combined with application cryptogram). All use RSA-2048 certificate chains vulnerable to quantum computers. Payment Network Comparison: 5 networks compared by scale, crypto stack, PQC posture, and readiness. Mastercard is the only network with active PQC pilots (TLS 1.3 hybrid ML-KEM). UnionPay has the largest card base (9.4B) tied to pending China GB/T standards.',
    workshopSummary:
      'Payment Network Comparator (filter, compare, radar chart). Transaction Simulator (5 modes, play/pause, quantum overlay). Card Provisioning Visualizer (5-phase stepper, RSA/ML-DSA/FN-DSA chain toggle). Tokenization Explorer (TSP + wallet selector, animated flow). POS Crypto Analyzer (terminal specs, DUKPT tree, KIF ceremony). Migration Risk Matrix (2D heatmap, dependency DAG, timeline Gantt)',
  },
}
