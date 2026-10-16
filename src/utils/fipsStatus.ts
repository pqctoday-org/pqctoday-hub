// SPDX-License-Identifier: AGPL-3.0-only
/**
 * One reading of a catalog product's free-text `fips_validated` field.
 *
 * The field holds ~200 different phrasings ("Yes (FIPS 140-3 CMVP #5313 …)",
 * "No (implements FIPS 203 algorithm; no NIST CMVP validation)", "Yes
 * (FedRAMP)", "CAVP Project A7489 …"). Four components used to classify it
 * with four different substring rules, and each got a different set wrong:
 * "No (implements FIPS 203 …)" showed as FIPS, real certificates written as
 * "FIPS 140-3, Status Active …" showed as Partial. This module is the only
 * classifier; render code maps its state to a label.
 *
 * The states keep apart what a reader must not confuse:
 *   - module      the product (or its named module) holds a CMVP certificate
 *   - embedded    the product relies on someone else's validated module
 *   - cavp        algorithm validation only — no validated module boundary
 *   - in-process  submitted / in test / on the IUT list — not validated yet
 *   - claim       a non-FIPS assurance (FedRAMP, WebTrust, "FIPS mode", …)
 *                 or a bare vendor "Yes" with no certificate
 *   - none        the text says it is not validated
 *   - unknown     the field is empty or says nothing usable
 */

export type FipsState = 'module' | 'embedded' | 'cavp' | 'in-process' | 'claim' | 'none' | 'unknown'

/** Whether the post-quantum algorithms sit inside a validated module boundary. */
export type PqcBoundary = 'yes' | 'no' | 'not-stated'

export const FIPS_STATE_LABEL: Record<FipsState, string> = {
  module: 'FIPS 140 validated',
  embedded: 'Uses a validated module',
  cavp: 'Algorithms only (CAVP)',
  'in-process': 'FIPS in process',
  claim: 'Not FIPS validated (other claim)',
  none: 'Not FIPS validated',
  unknown: 'FIPS status not stated',
}

/** Short form for compact badges. */
export const FIPS_STATE_SHORT: Record<FipsState, string> = {
  module: 'FIPS',
  embedded: 'FIPS (via module)',
  cavp: 'CAVP only',
  'in-process': 'FIPS pending',
  claim: 'No FIPS',
  none: 'No FIPS',
  unknown: 'FIPS ?',
}

const NEGATED = /^(no\b|not\b|none\b)/
// A CMVP module certificate: "FIPS 140-2/140-3", "CMVP #1234", "Certificate #1234",
// or "validated (software) cryptographic module". CAVP certificates are
// "A1234" and never carry a 4-digit '#'.
const MODULE =
  /fips 140-[23]|cmvp #?\d|certificate #\d|validated (software only )?cryptographic module/
const MODULE_CERT_NO = /#\s?\d{4}/
const CAVP_CERT_NO = /\ba\d{4}\b/
// Positive evidence of algorithm validation. A bare "CAVP" is not enough:
// "No formal CMVP/CAVP certification" and "CAVP/CMVP certification not yet
// published" mention it only to deny it.
const CAVP =
  // claims-lint-allow: a pattern that recognises CAVP wording in catalogue text; it claims nothing
  /cavp[- ](validated|certified|project|pqc|algorithm|:)|cavp,|nist cavp|algorithm validation (a\d|only|\()|validated by nist cavp|cryptographic algorithm validation program|first validated|\ba\d{4}\b|cavp-validated|algorithm validation a\d/
const IN_PROCESS =
  /pending|in process|in progress|submitted|submission|iut list|under review|lab testing/
// "in process" that refers to the PQC part, not the module the product holds.
const PQC_IN_PROCESS =
  /pqc[^;)]*(under review|in process|in progress|pending)|(in process|in progress|pending)[^;)]*pqc/
const FIPS_CONTEXT = /fips|cmvp|nist|^no \(pending\)$/
const EMBEDDED =
  /\bvia\b|\bcng fips\b|component modules only|\(components\)|\buses\b.*\bmodule\b|fips module\b/
const NAMED_MODULE_PRODUCT = /boringcrypto|corecrypto|aws-lc fips/

export function classifyFips(raw: string | null | undefined): FipsState {
  const t = (raw ?? '').trim().toLowerCase()
  if (!t) return 'unknown'

  if (NEGATED.test(t)) {
    // "No (CAVP algorithm validation, not a CMVP module validation)" and
    // "No CMVP module validation linked; CAVP algorithm validation A6960"
    // still carry real algorithm validation.
    if (CAVP.test(t)) return 'cavp'
    if (IN_PROCESS.test(t) && FIPS_CONTEXT.test(t) && !/pqc certification details pending/.test(t))
      return 'in-process'
    return 'none'
  }

  if (/^not specified|validation status not stated/.test(t)) return 'unknown'
  if (/^pending\b/.test(t)) return 'in-process'

  const inProcess = IN_PROCESS.test(t) && !PQC_IN_PROCESS.test(t)

  if (MODULE.test(t)) {
    // "Yes, FIPS 140-3 (implied by CAVP listing …), Certificate A7514" names
    // only a CAVP certificate.
    if (CAVP_CERT_NO.test(t) && !MODULE_CERT_NO.test(t)) return 'cavp'
    // "Partial (NIST CAVP certified; FIPS 140-3 in progress)" names 140-3 only
    // as a goal; a real certificate comes with a number, a level or a status.
    const hasEvidence =
      /#\s?\d|level \d|\bl\d\b|status:? active|\bactive\b|\bvalidated\b|fips 140-2/.test(t)
    if (inProcess && !hasEvidence) return CAVP.test(t) ? 'cavp' : 'in-process'
    return EMBEDDED.test(t) ? 'embedded' : 'module'
  }

  if (CAVP.test(t)) return 'cavp'
  if (inProcess) return 'in-process'
  if (EMBEDDED.test(t) || NAMED_MODULE_PRODUCT.test(t)) return 'embedded'
  // FedRAMP, WebTrust, BSI, PCI, SP 800-90B, CC, "FIPS mode", bare "Yes":
  // none of these is a FIPS 140 validation.
  return 'claim'
}

const PQC_OUT =
  /classical algorithms only|classical algorithms[;)]|pqc not in fips (scope|module)|lists? no pqc|not yet in a module certificate|is not among the module's approved algorithms|^yes \(classical\)|pqc[^;)]*(under review|in process|in progress)/
const PQC_IN = /(ml-kem|ml-dsa|slh-dsa|lms|xmss)[^.;]*approved (in the module|algorithm)/

export interface XrefLike {
  certType: string
  classicalOnly: boolean
}

/**
 * Is the PQC part inside a validated boundary? Certificate cross-reference
 * rows win over prose; prose wins over silence; silence is "not stated",
 * never "yes".
 */
export function pqcBoundary(raw: string | null | undefined, certs: XrefLike[] = []): PqcBoundary {
  const moduleCerts = certs.filter((c) => /fips 140/i.test(c.certType))
  if (moduleCerts.some((c) => !c.classicalOnly)) return 'yes'
  const t = (raw ?? '').toLowerCase()
  // Negative prose first: "ML-KEM is not among the module's approved
  // algorithms" also matches the positive pattern.
  if (PQC_OUT.test(t)) return 'no'
  if (PQC_IN.test(t)) return 'yes'
  if (moduleCerts.length > 0) return 'no'
  return 'not-stated'
}
