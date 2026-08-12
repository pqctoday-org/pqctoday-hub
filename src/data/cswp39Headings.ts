// SPDX-License-Identifier: GPL-3.0-only
/**
 * The real section headings of NIST CSWP 39-upd1, "Considerations for Achieving
 * Crypto Agility: Strategies and Practices" (published 2025-12-19; CSWP 39 was
 * withdrawn 2026-06-29 and superseded in its entirety by -upd1).
 *
 * Extracted verbatim from the publication PDF, not paraphrased. This exists so
 * that every §-reference the app renders can be checked against the document
 * instead of against another hand-authored file.
 *
 * Why: a 2026-08-10 audit found `cswp39Data.ts` attributing invented titles to
 * real section numbers — "§5.2 Inventory — CBOM and Information Repository"
 * when §5.2 is "Crypto Security Policy Enforcement", plus a "§5.5" that does
 * not exist (§5 runs 5.1–5.4). Full-text search of the publication returns zero
 * occurrences of "repository", "CBOM", "SBOM" or "bill of materials".
 *
 * NOTE ON METHOD: Fig. 3's box labels are a raster image and are NOT in the
 * extracted text. Searching the text alone will report them as absent when
 * they are present — see CSWP39_FIG3_LABELS below.
 *
 * Source: https://doi.org/10.6028/NIST.CSWP.39-upd1
 * Local evidence: pqctoday-priv/local-evidence-cache/library/NIST_CSWP_39.pdf
 * Extracted: 2026-08-10
 */

/** Every numbered heading in CSWP 39-upd1, ref → verbatim title. */
export const CSWP39_REAL_HEADINGS: Readonly<Record<string, string>> = {
  '§1': 'Introduction',
  '§2': 'Historic Transitions and Challenges',
  '§2.1': 'Long Period for a Transition',
  '§2.2': 'Backward Compatibility and Interoperability Challenges',
  '§2.3': 'Constant Needs of Transition',
  '§2.4': 'Resource and Performance Challenges',
  '§3': 'Crypto Agility for Security Protocols',
  '§3.1': 'Algorithm Identification',
  '§3.1.1': 'Mandatory-to-Implement Algorithms',
  '§3.1.2': 'Dependent Specifications',
  '§3.2': 'Algorithm Transitions',
  '§3.2.1': 'Preserving Protocol Interoperability',
  '§3.2.2': 'Providing Notices of Expected Changes',
  '§3.2.3': 'Integrity for Algorithm Negotiation',
  '§3.2.4': 'Hybrid Cryptographic Algorithms',
  '§3.3': 'Cryptographic Key Establishment',
  '§3.4': 'Balancing Security Strength and Protocol Complexity',
  '§3.4.1': 'Balancing the Security Strength of Algorithms in a Cipher Suite',
  '§3.4.2': 'Balancing Protocol Complexity',
  '§4': 'Crypto Agility in System Implementations',
  '§4.1': 'Using an API in a Crypto Library Application',
  '§4.2': 'Using APIs in the Operating System Kernel',
  '§4.3': 'Using Service Mesh in Cloud-Native Environments',
  '§4.4': 'Embedded Systems',
  '§4.5': 'Hardware',
  '§4.6': 'Using a Crypto Gateway for Legacy Systems',
  '§5': "Crypto Agility Strategic Plan for Managing Organizations' Crypto Risks",
  '§5.1': 'Cryptographic Standards, Regulations, and Mandates',
  '§5.2': 'Crypto Security Policy Enforcement',
  '§5.3': 'Technology Supply Chains',
  '§5.4': 'Cryptographic Architecture',
  '§6': 'Considerations for Future Works',
  '§6.1': 'Resource Considerations',
  '§6.2': 'Agility-Aware Design',
  '§6.3': 'Complexity and Security',
  '§6.4': 'Crypto Agility in the Cloud',
  '§6.5': 'Maturity Assessment for Crypto Agility',
  '§6.6': 'Common Crypto API',
  '§7': 'Conclusion',
}

/**
 * Box labels in Fig. 3 ("Crypto agility strategic plan for managing an
 * organization's cryptographic risks", p.22/27). These are REAL CSWP.39
 * content and are safe to attribute to it.
 *
 * They are listed explicitly because they are invisible to text extraction —
 * Fig. 3 is a raster image, so `pdftotext`-style searching returns zero hits
 * for every one of them. A 2026-08-10 audit concluded from exactly that that
 * "Information Repository" was fabricated, which was wrong: it is a labelled
 * box in the Data-Centric Risk Management zone. Checking a claim against the
 * extracted text ALONE is not sufficient for this document — open the figure.
 */
export const CSWP39_FIG3_LABELS: readonly string[] = [
  // Governance zone
  'Standards',
  'Regulations Mandates',
  'Technology Supply Chains',
  'Threats',
  'Processes',
  'Business Requirements',
  'Partner Ecosystem',
  'Stakeholders',
  'Crypto Policies',
  'Crypto Architecture',
  // Assets zone
  'Code',
  'Libraries',
  'Applications',
  'Files',
  'Protocols',
  'Systems',
  // Management Tools zone (Discovery, Assessment, Configuration, Enforcement)
  'Data',
  'Crypto',
  'Vulnerability',
  'Assets',
  'Log',
  'Zero-Trust',
  // Data-Centric Risk Management zone
  'Information Repository',
  'Risk Analysis Prioritization Engine',
  'Monitoring',
  'Dashboards',
  'Reports',
  'Measurements/Metrics (KPI)',
  // Outcomes
  'Mitigation',
  'Migration',
]

/**
 * Terms that genuinely do not appear anywhere in CSWP 39-upd1 — not in the
 * body text, and not as a Fig. 3 box label (the figure was read directly, see
 * CSWP39_FIG3_LABELS). Guarded by test so they cannot be reintroduced as
 * attributed content.
 *
 * `CBOM` / `SBOM` / `bill of materials`: the document never uses any of them;
 * it says "inventory the use of cryptography" and "inventory of assets".
 * `§5.5`: §5 runs 5.1-5.4.
 */
export const CSWP39_ABSENT_TERMS: readonly string[] = ['CBOM', 'SBOM', 'bill of materials', '§5.5']

/** True when `ref` (e.g. "§5.2") is a real numbered heading in CSWP 39-upd1. */
export function isRealCswp39Ref(ref: string): boolean {
  return ref in CSWP39_REAL_HEADINGS
}

/**
 * Passages quoted verbatim in the tools, transcribed from the PDF on
 * 2026-08-11 (NIST-CSWP-39.pdf, 47pp, in the private evidence cache).
 *
 * The 2026-08-10 audit called these quote constants "the strongest grounding
 * pattern in the codebase" and scored four tools A-/A largely on their
 * presence. Nobody had compared them to the document. Checking them found two
 * that SILENTLY DROPPED WORDS from inside a sentence rendered on screen and in
 * exports as `> "..."`:
 *
 *   §3.1.1 omitted "(i.e., to be supported by all implementations)"
 *   §4.1   omitted "(e.g., email and web apps)"
 *
 * Neither elision changes the meaning, and that is exactly why it survived: a
 * quotation that reads plausibly is never re-checked. Both are restored.
 *
 * A third apparent mismatch, §6.4, was a FALSE ALARM in the checking method,
 * not a defect — the PDF's text layer injects a running page header
 * ("...data, applications, and NIST CSWP 39 ... 29 configurations.") mid
 * sentence, which breaks a naive substring comparison. The shipped quote was
 * correct.
 *
 * Anything quoted as CSWP.39 must appear here character for character.
 */
export const CSWP39_VERBATIM_QUOTES: Readonly<Record<string, string>> = {
  '§3.1.1':
    'To ensure that interoperation is possible for all implementations, an SDO will often choose at least one set of algorithms with properly selected security strengths based on state-of-the-art cryptanalysis results as mandatory-to-implement (i.e., to be supported by all implementations). Of course, local policy may select an algorithm other than the mandatory-to-implement one.',
  '§3.2.4':
    'One use case for hybrid public-key algorithms is to continue using the well-tested, traditional public-key algorithms while study of the new PQC algorithms continues and implementations mature. Choosing a hybrid algorithm may lead to a second transition when the traditional algorithm is disallowed.',
  '§4.1-a':
    'A cryptographic application programming interface (crypto API) separates the implementation of applications that use cryptographic algorithms (e.g., email and web apps) from implementation of the cryptographic algorithms themselves.',
  '§4.1-b':
    'To achieve crypto agility, system designers must introduce mechanisms that simplify the replacement of cryptographic algorithms in software, libraries, hardware, firmware, and infrastructures.',
  '§6.4':
    'The main security model used in the cloud is the shared responsibility model, which clearly divides security duties between the cloud provider and the customer. The cloud provider secures the underlying infrastructure, including physical facilities, hardware, networking, and virtualization. The customer manages the security of their data, applications, and configurations.',
}
