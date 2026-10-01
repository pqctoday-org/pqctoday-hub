// SPDX-License-Identifier: GPL-3.0-only
/**
 * Drill data for the TalkingAboutPQC workshop. Dates come from
 * regulatoryTimelines.ts so a change on the Timeline flows through here.
 */
import { EO_14412, NIST_DEPRECATION } from '@/data/regulatoryTimelines'

export interface DrillOption {
  text: string
  correct: boolean
}

export interface DrillItem {
  id: string
  /** The sentence or question the learner starts from. */
  prompt: string
  /** Optional situation that decides which answer is accurate. */
  context?: string
  options: DrillOption[]
  /** Why the accurate option holds up and the others do not. */
  why: string
}

const KEY_EST_YEAR = EO_14412.keyEstablishment ?? 2030

export const CLAIMS: DrillItem[] = [
  {
    id: 'quantum-proof',
    prompt: '“Our product is quantum-proof.”',
    context: 'Version 5.2 of the product added ML-KEM for key exchange.',
    options: [
      { text: 'Our product is quantum-proof.', correct: false },
      {
        text: 'From version 5.2, our product uses ML-KEM (FIPS 203), NIST’s post-quantum standard for key exchange.',
        correct: true,
      },
      { text: 'Our product can never be broken by a quantum computer.', correct: false },
    ],
    why: 'No cryptography is proven unbreakable, and standards bodies do not use the word “quantum-proof”. Naming the standard and the version gives the customer something they can check.',
  },
  {
    id: 'fips-in-process',
    prompt: '“Our module is FIPS 140-3 certified for PQC.”',
    context:
      'The module appears on NIST’s Modules In Process list. It has no FIPS 140-3 certificate yet.',
    options: [
      { text: 'Our module is FIPS 140-3 validated.', correct: false },
      {
        text: 'Our module is in process for FIPS 140-3 validation and appears on NIST’s Modules In Process list.',
        correct: true,
      },
      { text: 'Our module is NIST-approved.', correct: false },
    ],
    why: 'Being on the Modules In Process list means validation has started, not that it has finished. Only a completed validation has a certificate number, and anyone can look that number up.',
  },
  {
    id: 'nist-approved',
    prompt: '“NIST approved our product.”',
    context: 'The product’s ML-DSA implementation passed algorithm testing (a CAVP certificate).',
    options: [
      { text: 'NIST approved our product.', correct: false },
      {
        text: 'Our ML-DSA implementation (FIPS 204) has passed NIST algorithm testing and has a CAVP certificate.',
        correct: true,
      },
      { text: 'NIST recommends our product.', correct: false },
    ],
    why: 'NIST standardizes algorithms; it does not approve or recommend products. A CAVP certificate covers one implementation of one algorithm, not the product around it.',
  },
  {
    id: 'us-deadline',
    prompt: `“The US requires everyone to switch by ${KEY_EST_YEAR}.”`,
    options: [
      { text: `The US requires everyone to switch by ${KEY_EST_YEAR}.`, correct: false },
      {
        text: `Under Executive Order 14412, US federal civilian high-value and high-impact systems, and the contractors serving them must use post-quantum key establishment by the end of ${KEY_EST_YEAR}.`,
        correct: true,
      },
      {
        text: `Quantum computers arrive in ${KEY_EST_YEAR}, so everyone must switch.`,
        correct: false,
      },
    ],
    why: 'Every real deadline belongs to someone and applies to specific systems. US national security systems follow a different schedule (CNSA 2.0), and private companies outside those scopes have no US deadline at all.',
  },
  {
    id: 'q-day',
    prompt: '“Quantum computers will break encryption in 2029.”',
    options: [
      { text: 'Quantum computers will break encryption in 2029.', correct: false },
      {
        text: 'Nobody knows when. Published estimates vary widely, and data copied today could be read once such a computer exists.',
        correct: true,
      },
      { text: 'Quantum computers can already break today’s encryption.', correct: false },
    ],
    why: 'The arrival date of a code-breaking quantum computer is an estimate, and experts disagree. The risk to data copied today (“harvest now, decrypt later”) does not depend on the exact year.',
  },
  {
    id: 'rsa-ban',
    prompt: `“NIST will ban RSA in ${NIST_DEPRECATION.deprecateClassical}.”`,
    options: [
      {
        text: `NIST will ban RSA in ${NIST_DEPRECATION.deprecateClassical}.`,
        correct: false,
      },
      {
        text: `In a draft report (NIST IR 8547), NIST proposes deprecating the weakest of today’s quantum-vulnerable algorithms, such as RSA-2048, after ${NIST_DEPRECATION.deprecateClassical}, and disallowing all of them after ${NIST_DEPRECATION.disallowClassical}.`,
        correct: true,
      },
      { text: 'RSA is already banned.', correct: false },
    ],
    why: 'NIST IR 8547 is still a draft, so its dates are proposals. “Deprecated” means allowed but discouraged; “disallowed” comes later.',
  },
]

export const QUESTIONS: DrillItem[] = [
  {
    id: 'are-you-safe',
    prompt: 'A customer asks: “Are you quantum-safe?”',
    options: [
      { text: 'Yes, fully.', correct: false },
      {
        text: 'Here is what is protected today, what is planned and when, and the evidence for each: our roadmap page and our certificate numbers.',
        correct: true,
      },
      { text: 'Quantum is not a real risk yet, so it does not matter.', correct: false },
    ],
    why: 'A good answer splits the product into what is done, what is planned and what is unknown, and links evidence for each part. A single “yes” cannot be checked, and dismissing the risk contradicts published government guidance.',
  },
  {
    id: 'fips-for-pqc',
    prompt: 'A buyer asks: “Is your product FIPS-validated for PQC?”',
    options: [
      { text: 'Yes, we are FIPS.', correct: false },
      {
        text: 'Our FIPS 140-3 certificate number covers a specific version. Whether that version includes the post-quantum algorithms is on the certificate, so let us check it together.',
        correct: true,
      },
      { text: 'FIPS does not apply to post-quantum cryptography.', correct: false },
    ],
    why: 'A certificate covers a specific version and configuration. Post-quantum algorithms added later are only covered once a validation that includes them is complete.',
  },
  {
    id: 'replace-now',
    prompt: 'A customer asks: “Do we need to replace everything now?”',
    options: [
      { text: 'Yes, immediately, or you will be breached.', correct: false },
      {
        text: 'Start by finding where you use cryptography. Replacements roll out over years, starting with data that must stay secret for a long time.',
        correct: true,
      },
      { text: 'No, wait until quantum computers exist.', correct: false },
    ],
    why: 'Finding the cryptography is usually the longest step. Panic overstates the risk, and waiting ignores data being copied today.',
  },
  {
    id: 'what-is-hybrid',
    prompt: 'Someone asks: “What does hybrid mean?”',
    options: [
      { text: 'A halfway step that is less secure than full PQC.', correct: false },
      {
        text: 'It uses a traditional and a post-quantum algorithm together, so the connection stays protected as long as either one holds.',
        correct: true,
      },
      { text: 'It is just a marketing term.', correct: false },
    ],
    why: 'Hybrid is a deliberate design that many standards bodies recommend during the transition, not a compromise. It is a good word to use once you have explained it.',
  },
]
