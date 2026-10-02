// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'talking-about-pqc',
  contentVersion: 2,
  lm_id: 'LM-073',
  title: 'Talking About PQC Accurately',
  description:
    'For anyone who has to say something about post-quantum cryptography at work — sales, marketing, communications, procurement, policy or press: what is true today, which dates are real, what a certificate proves, and which words to avoid.',
  whyThisMatters:
    'Customers, buyers and journalists can now check a quantum claim against public records. A sentence that overstates a deadline or a certificate costs more trust than it ever wins.',
  duration: '30 min',
  difficulty: 'beginner',
  // 2026-10-01: draft until a reviewer with a product-marketing or compliance
  // background signs it off — same convention as acvp-lab-workflow.
  workInProgress: true,
  frameworkPhase: 'foundations',
  track: 'Role Guides',
  trackOrder: 5,
  learnSections: [
    { id: 'one-minute', label: 'The One-Minute Version' },
    { id: 'real-dates', label: 'Dates That Are Real' },
    { id: 'certificates', label: 'What a Certificate Proves' },
    { id: 'words', label: 'Words to Check' },
    { id: 'customer-questions', label: 'Answering the Question' },
  ],
  workshopSteps: [
    { id: 'claim-checker', label: 'Claim Checker' },
    { id: 'question-practice', label: 'Customer Questions' },
  ],
  startHere: {
    step: 'claim-checker',
    text: 'Pick the most accurate version of each claim in the Claim Checker: six sentences you will hear in pitches and press releases, each with the reason one version holds up and the others do not.',
  },
  taxonomy: {
    standards: ['FIPS 203', 'NIST IR 8547', 'NSA CNSA 2.0'],
  },
  load: () => import('./index').then((m) => ({ default: m.TalkingAboutPQCModule })),
}

export default manifest
