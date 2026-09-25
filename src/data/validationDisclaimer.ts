// SPDX-License-Identifier: GPL-3.0-only
/**
 * The one required validation disclaimer (ACVP validation remediation plan
 * 2026-09-24, §2.2 / WS-A item A-4). It must appear, verbatim, on the
 * validation workbench, the Algorithms validation view and every exported
 * result/report — so it lives in exactly one place and every surface imports
 * it rather than paraphrasing it. Do not edit the wording without updating the
 * plan; `validationDisclaimer.test.ts` pins it.
 */
export const VALIDATION_DISCLAIMER =
  'PQC Today executes selected public reference vectors, standards tests, conformance cases, and implementation probes. A passing result is evidence only for the identified test, operation, parameters, implementation build, and target. It is not an ACVTS verdict, a CAVP/CMVP certificate, or proof of exhaustive conformance.'

/**
 * Plain-text form for exported artifacts (logs, generated scripts, downloads):
 * the same sentence, prefixed so it reads as a notice in a text file.
 */
export const VALIDATION_DISCLAIMER_TEXT = `Notice: ${VALIDATION_DISCLAIMER}`
