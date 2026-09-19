// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'crypto-dev-apis',
  contentVersion: 5,
  lm_id: 'LM-021',
  title: 'Cryptographic APIs & Developer Languages',
  description:
    'Compare JCA/JCE, OpenSSL EVP, PKCS#11, Windows CNG, and Bouncy Castle across 7 languages. Provider patterns, PQC library selection, support matrix, crypto agility patterns, and migration decision lab.',
  whyThisMatters:
    'The crypto API your language calls determines how hard your PQC migration will be — JCA sends you down a different path than raw OpenSSL EVP, and getting that provider choice wrong early means rewriting integration code twice.',
  duration: '80 min',
  difficulty: 'intermediate',
  frameworkPhase: 'foundations',
  track: 'Software Infrastructure',
  trackOrder: 3,
  learnSections: [
    { id: 'landscape', label: 'The Crypto API Landscape' },
    { id: 'principles', label: 'Common API Principles' },
    { id: 'jca-bc', label: 'JCA/JCE & Bouncy Castle' },
    { id: 'openssl', label: 'OpenSSL & libcrypto' },
    { id: 'pkcs11', label: 'PKCS#11 Abstraction' },
    { id: 'cng', label: 'KSP & Windows CNG' },
    { id: 'build-buy', label: 'Build vs Buy vs OSS' },
    { id: 'pqc-libs', label: 'Open-Source PQC Libraries' },
    { id: 'languages', label: 'Language Ecosystem' },
    { id: 'pqc-roadmap', label: 'PQC Readiness & Roadmap' },
  ],
  workshopSteps: [
    { id: 'api-architecture-explorer', label: 'API Architecture Explorer' },
    { id: 'language-ecosystem', label: 'Language Ecosystem Comparator' },
    { id: 'provider-patterns', label: 'Provider Pattern Workshop' },
    { id: 'build-buy-oss', label: 'Build vs Buy vs Open Source' },
    { id: 'pqc-library-explorer', label: 'PQC Library Explorer' },
    { id: 'pqc-support-matrix', label: 'PQC Support Matrix' },
    { id: 'crypto-agility-patterns', label: 'Crypto Agility Patterns' },
    { id: 'migration-decision-lab', label: 'Migration Decision Lab' },
  ],
  startHere: {
    step: 'provider-patterns',
    text: 'Open the Provider Pattern Workshop: KeyGen, Sign, Verify, Encrypt and KEM Encapsulate shown side by side across JCA/JCE, OpenSSL, PKCS#11, CNG and Bouncy Castle.',
  },
  // Wave B (2026-09-18): derived from the algorithm and standard ids this
  // module's content.ts declares (the References tab's own data), restricted to
  // the STANDARD_TAXONOMY vocabulary so the researcher browse axis and the
  // related-modules engine see it. Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['Falcon', 'HQC', 'ML-DSA', 'ML-KEM', 'SLH-DSA'],
    standards: ['FIPS 186-5', 'RFC 9846', 'NIST SP 800-208', 'FIPS 140-3'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.CryptoDevAPIsModule })),
}

export default manifest
