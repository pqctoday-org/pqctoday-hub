// SPDX-License-Identifier: GPL-3.0-only
/**
 * "Try it" questions for routed reference pages, rendered under the page by
 * RoutePageExercise (desktop: the shared ToolExercise with family 'page';
 * phone: MobilePageExercise). Keyed by route.
 *
 * Rule (2026-09-19, after the round-9 wave-2 set was cut from 19 to 5): a page
 * question tests a DOMAIN concept the page presents — a threat class, a FIPS
 * tier, an algorithm, a governance role — and `concept` names it. A question
 * about the page's own controls ("which chip", "what does the export button
 * download", "which tab hides the filter") is not an understanding check and
 * is not allowed; pages with no concept of their own (home, report, explore,
 * revisions, leaders, the playground hubs …) carry no question rather than a
 * trivia one. Every prompt and `why` is written from the page's own visible
 * text (file + line in the evidence record beside the priv tracker), so it is
 * answerable from the page. pageExercises.test.ts pins shape and the rule.
 */
import type { StepExercise } from '@/data/stepExercises'

export interface PageExercise extends StepExercise {
  /** The domain concept the question tests — never a page control. */
  concept: string
}

export const PAGE_EXERCISES: Record<string, PageExercise[]> = {
  '/threats': [
    {
      concept: 'HNDL vs HNFL/TNFL threat classes',
      prompt:
        'An adversary records your encrypted traffic today so it can be decrypted once a quantum computer exists. Which threat class is that, and which security property does it attack?',
      options: [
        'HNDL (Harvest Now, Decrypt Later) — confidentiality',
        'HNFL / TNFL (Harvest/Tamper Now, Forge Later) — authenticity',
        'Severity: Critical — availability',
        'Unclassified — integrity',
      ],
      answer: 0,
      why: "HNDL's clock is the data's secrecy lifetime: anything that must stay secret past the day a CRQC exists is exposed by traffic captured now. HNFL/TNFL is the mirror image for signatures — a credential still valid when a CRQC arrives can be forged — so it threatens authenticity, on the credential's validity clock.",
    },
  ],
  '/openssl': [
    {
      concept: 'Generating an ML-DSA (FIPS 204) key with OpenSSL genpkey',
      prompt:
        'Which OpenSSL command generates an ML-DSA-65 private key — a post-quantum signature key?',
      options: [
        'openssl genpkey -algorithm ml-dsa-65 -out ml_dsa.key',
        'openssl genpkey -algorithm ed25519 -out ed25519.key',
        'openssl version',
      ],
      answer: 0,
      why: 'genpkey with -algorithm ml-dsa-65 asks the library for a FIPS 204 (ML-DSA) signature key at security category 3. The ed25519 variant is the classical comparison — an elliptic-curve key that a CRQC breaks — and openssl version only prints the build.',
    },
  ],
  '/faq': [
    {
      concept: 'FIPS validation tiers — a vendor claim is not a validation',
      prompt:
        "The Migrate catalog marks a product's FIPS status as 'Partial'. What does that mean?",
      options: [
        'The product has achieved FIPS 140-3 certification with PQC algorithms',
        'The vendor claims FIPS-mode operation, FedRAMP authorization or a WebTrust audit, but full PQC validation is still pending',
        'No FIPS validation is available for the product',
        'The certificate covers only some of the product’s editions',
      ],
      answer: 1,
      why: 'The three tiers encode certainty. Validated is FIPS 140-3 certification that covers PQC algorithms; Partial is a vendor claim (FIPS mode, FedRAMP, WebTrust) that has not yet been validated for PQC; No is nothing at all. Treat Partial as a claim to verify with the vendor, not as evidence of a validated PQC module.',
    },
  ],
  '/business': [
    {
      concept: 'RACI — accountability as the governance question',
      prompt:
        'The Command Center frames a PQC programme as four board-level questions. Which one does a RACI chart answer?',
      options: ["What's at risk?", "What's the deadline?", 'What will it cost?', 'Who owns it?'],
      answer: 3,
      why: 'RACI assigns each activity one Accountable owner plus the Responsible, Consulted and Informed parties — it is the governance instrument for who owns the programme. Risk is sized by the assessment, the deadline by the compliance mandates, and cost by the ROI model; none of those names an owner.',
    },
  ],
  '/compliance': [
    {
      concept: 'A FIPS certificate can cover classical algorithms only',
      prompt:
        'On the Compliance page, a product you run holds a FIPS 140-3 certificate. What else does the Products view tell you about that certificate, beyond the fact that it exists?',
      options: [
        'Under which scheme it was issued, and whether it covers post-quantum algorithms or only classical ones',
        'How much the product costs per seat',
        'Whether the vendor has signed the PQC pledge',
        'How many other customers run the same version',
      ],
      answer: 0,
      why: 'A FIPS 140-3 certificate validates a specific module and a specific algorithm list. Most certificates in circulation cover only classical algorithms, so "has a certificate" does not mean "PQC-ready" — the scheme and the algorithm scope are what tell you whether the validation covers ML-KEM, ML-DSA or SLH-DSA.',
    },
  ],
}

export const PAGE_EXERCISE_ROUTES: ReadonlySet<string> = new Set(Object.keys(PAGE_EXERCISES))

export function pageExercisesFor(route: string): PageExercise[] | undefined {
  // eslint-disable-next-line security/detect-object-injection -- route is the router's pathname, matched against our own keys
  return PAGE_EXERCISES[route]
}
