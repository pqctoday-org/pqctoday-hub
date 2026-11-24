// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'entropy-randomness',
  whyThisMatters:
    "Every key this curriculum generates depends on entropy — a weak DRBG or predictable seed makes even a perfect PQC algorithm choice worthless, since the attack moves from 'break the math' to 'guess the seed'.",
  learnSections: [
    { id: 'entropy', label: 'Entropy Sources' },
    { id: 'drbg', label: 'SP 800-90 DRBG' },
    { id: 'testing', label: 'Entropy Testing (90B)' },
    { id: 'esv', label: 'CMVP ESV Process' },
    // P0 cleanup (2026-09-24): matches the section heading; the separate
    // QRNG comparison workshop step was removed (P0.7).
    { id: 'qrng', label: 'TRNG vs QRNG' },
    { id: 'combining', label: 'Combining Sources' },
  ],
  learnPaths: [
    {
      id: 'general-practitioner',
      label: 'General practitioner',
      entrySection: 'entropy',
      duration: '45 min',
      audience: 'Security practitioners who need correct design and operating decisions',
      sections: ['entropy', 'drbg', 'testing', 'qrng', 'combining'],
    },
    {
      id: 'certification-engineer',
      label: 'Certification engineer',
      entrySection: 'testing',
      duration: '95 min',
      audience: 'Entropy-source implementers, accredited-lab testers and CMVP reviewers',
      sections: ['entropy', 'drbg', 'testing', 'esv', 'qrng', 'combining'],
    },
  ],
  offPathSections: 'mark',
  workshopSteps: [
    {
      id: 'random-generation',
      label: 'Random Byte Generation',
      paths: ['general-practitioner'],
    },
    { id: 'entropy-testing', label: 'Entropy Testing' },
    {
      id: 'esv-walkthrough',
      label: 'ESV Validation Walkthrough',
      paths: ['certification-engineer'],
    },
    { id: 'drbg-state-machine', label: 'DRBG State Machine' },
    { id: 'source-combining', label: 'Combining Sources' },
    // Slice 1 (2026-09-24): appended LAST so existing ?step= links keep working.
    // Shared by both paths: general practitioners need the evidence-boundary
    // lesson too, while certification engineers use the deeper ESV context.
    {
      id: 'entropy-evidence-lab',
      label: 'Entropy Evidence Lab (SP 800-90B)',
    },
  ],
  // Round 9, wave 2 (2026-09-19): "Start here" — one real workshop step, written from that step's component.
  startHere: {
    step: 'random-generation',
    text: "Toggle the sources — Web Crypto API, OpenSSL WASM, Math.random() and Timestamp LCG — pick a byte count and press Generate: each source's bytes, frequency histogram and lag plot appear side by side.",
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.EntropyModule })),
}

export default resolveManifest(manifest)
