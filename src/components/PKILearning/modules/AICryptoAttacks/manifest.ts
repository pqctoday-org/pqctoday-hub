// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'ai-crypto-attacks',
  contentVersion: 2,
  lm_id: 'LM-087',
  title: 'AI as an Attacker of Cryptography',
  description:
    'Evidence-bounded assessment of AI threats across five cryptographic layers — keys and secrets in software, implementation flaws, side-channel trace learning, KMS/HSM key policy, and mathematical cryptanalysis — separating demonstrated results from reported telemetry and hypothesised risks as of 2026-11-21.',
  whyThisMatters:
    'Published AI results have weakened an unstandardised candidate (HAWK, withdrawn 29 Jul 2026) and 7-round reduced AES-128, but not FIPS 203/204/205 or full AES; separating real implementation and secret-leakage deltas from overclaimed math breaks keeps patching, key governance, and PQC migration timelines grounded in evidence.',
  duration: '50 min',
  difficulty: 'intermediate',
  frameworkPhase: 'foundations',
  track: 'Foundations',
  trackOrder: 4,
  learnSections: [
    { id: 'two-threats', label: 'Two Threats: Quantum vs AI' },
    { id: 'keys-in-software', label: 'Keys & Secrets in Software' },
    { id: 'finding-flaws', label: 'Finding Flaws in Crypto Code' },
    { id: 'side-channels', label: 'AI-Enhanced Side Channels' },
    { id: 'kms-hsm-attacks', label: 'KMS, HSM & Key-Policy Attacks' },
    { id: 'ai-cryptanalysis', label: 'AI Cryptanalysis & Its Limits' },
    { id: 'defences', label: 'Defences & Verification' },
    { id: 'takeaways', label: 'Takeaways & Executive Verdict' },
  ],
  workshopSteps: [
    { id: 'secret-hunt', label: 'Secret Hunt (CI & Repo Hygiene)' },
    { id: 'key-policy-review', label: 'KMS & HSM Key-Policy Review' },
    { id: 'trace-learning', label: 'Synthetic Trace Learning Lab' },
    { id: 'claim-sorter', label: 'Claim & Rubric Sorter' },
    { id: 'defence-planner', label: 'Layered Defence Planner' },
  ],
  startHere: {
    step: 'secret-hunt',
    text: 'Open Secret Hunt (CI & Repo Hygiene), inspect the sample repository files using EXAMPLE_FAKE_ tokens, run pattern-based rules to see what simple regexes miss, and apply the remediation control for each leak class.',
  },
  taxonomy: {
    algorithms: ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'ECDSA'],
    standards: [
      'FIPS 203',
      'FIPS 204',
      'FIPS 205',
      'FIPS 140-3',
      'NIST IR 8547',
      'NSA CNSA 2.0',
      'PKCS#11',
    ],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.AICryptoAttacksModule })),
}

export default manifest
