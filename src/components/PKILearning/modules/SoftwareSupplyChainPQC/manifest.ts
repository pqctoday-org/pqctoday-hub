// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'software-supply-chain-pqc',
  contentVersion: 1,
  lm_id: 'LM-078',
  title: 'Software Supply Chain PQC',
  description:
    'How the signature links of a software supply chain stand on post-quantum signatures, read from the documents: a status map across Sigstore, the CA/Browser Forum code signing requirements, UEFI, COSE, CMS, X.509, OpenPGP and SUIT; the TUF and Uptane update frameworks; SLSA v1.2 and in-toto provenance; and what changes when a verifier has already shipped.',
  whyThisMatters:
    'A software update is trusted because of a signature, and the documents that govern signing differ: some specify post-quantum signatures, some are drafts, one registry marks them experimental, and some editions are silent. The useful skill is reading each link from its own document and knowing which role, threshold and verifier a change would have to go through.',
  duration: '40 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
  track: 'Industries',
  trackOrder: 9,
  learnSections: [
    { id: 'chain', label: 'The Chain, One Control per Link' },
    { id: 'status', label: 'Status Map: Signature Links' },
    { id: 'updates', label: 'Update Frameworks: TUF and Uptane' },
    { id: 'provenance', label: 'Provenance and Attestation' },
    { id: 'transition', label: 'Changing an Algorithm After Shipping' },
  ],
  workshopSteps: [
    { id: 'roles-and-thresholds', label: 'Roles and Thresholds' },
    { id: 'provenance-chain-check', label: 'Provenance Chain Check' },
    { id: 'transition-planner', label: 'Transition Planner' },
  ],
  startHere: {
    step: 'roles-and-thresholds',
    text: 'Open Roles and Thresholds, choose how many keys each update role has and how many an attacker holds, and see which roles the attacker can sign for on their own.',
  },
  // Derived from the algorithm and standard ids this module's content.ts declares,
  // restricted to the ALGORITHM_TAXONOMY / STANDARD_TAXONOMY vocabularies. Re-derive
  // from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['ML-DSA', 'SLH-DSA', 'LMS/XMSS', 'ECDSA'],
    standards: ['FIPS 204', 'FIPS 205', 'NIST SP 800-208', 'NSA CNSA 2.0', 'RFC 9580'],
  },
  load: () => import('./index').then((m) => ({ default: m.SoftwareSupplyChainPQCModule })),
}

export default manifest
