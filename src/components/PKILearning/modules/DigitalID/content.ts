// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the DigitalID module.
 * AUTO-GENERATED SKELETON — review and refine manually.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'digital-id',
  version: '1.1.0',
  lastReviewed: '2026-04-12',

  standards: [
    // Core digital identity standards
    getStandard('eIDAS-2-Regulation'),
    getStandard('EUDI-Wallet-ARF'),
    getStandard('ISO-18013-5-mDL'),
    getStandard('RFC-9901-SD-JWT-VC'),
    getStandard('OpenID4VCI-Spec'),
    getStandard('OpenID4VP-Spec'),
    getStandard('IETF-Token-Status-List'),
    getStandard('CSC-API-v2-Spec'),
    getStandard('ETSI-EN-319-411'),
    // Post-quantum migration targets
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
  ],

  algorithms: [
    getAlgorithm('Ed25519'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('FN-DSA-512'),
  ],

  deadlines: [
    {
      label: 'EUDI Wallet mandatory availability (≥80% of citizens per member state)',
      year: 2026,
      source: 'eIDAS 2.0 Regulation (EU 2024/1183) Art. 5a',
    },
  ],

  narratives: {
    classicalOidcSize: '300 bytes',
    pqcOidcSize: '4.7 KB',
    mlDsa65SigSize: '3,309 bytes',
    mlDsa65PubKeySize: '1,952 bytes',
    fnDsa512SigSize: '666 bytes',
  },
}
