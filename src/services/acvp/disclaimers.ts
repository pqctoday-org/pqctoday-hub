// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The ACVP evidence disclaimers beyond the general one, as plain constants with
 * no imports, so the e2e specs can check them verbatim. `evidence.ts` re-exports
 * them; import from there in app code.
 */
/** Plan §2.2, second required disclaimer (prompt import) — verbatim. */
export const DISCLAIMER_IMPORT =
  'Import and response generation do not submit results to NIST and do not establish validation. The laboratory or authorized submitter remains responsible for the ACVTS session and submission.'

/**
 * Third disclaimer of an evidence v3 document (extended plan profile only).
 * Wording approved by the owner on 24 October 2026.
 */
export const DISCLAIMER_TEST_INPUT =
  'Some answers in this run were produced with a test-only input (the random value m of ML-KEM encapsulation, which outside testing FIPS 203 has the module sample itself), with a value computed outside the engine, or from what the engine does when a key is imported. They are teaching evidence that the engine reproduces NIST\u2019s published values; they are not a validation and not an ACVTS response.'
