// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'crypto-dev-apis',
  whyThisMatters:
    'The crypto API your language calls determines how hard your PQC migration will be — JCA sends you down a different path than raw OpenSSL EVP, and getting that provider choice wrong early means rewriting integration code twice.',
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
    { id: 'tailoring-code-analysis', label: 'Tailoring Code Analysis' },
    { id: 'static-code-analysis', label: 'Static Code Analysis' },
    { id: 'dynamic-analysis', label: 'Dynamic Analysis' },
    { id: 'open-source-security', label: 'Open-Source Software Security' },
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
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.CryptoDevAPIsModule })),
}

export default manifest
