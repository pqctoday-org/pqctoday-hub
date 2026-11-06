// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Reads the NIST security category (1, 2, 3 or 5) from the algorithm and parameter
 * set named in a filename. Used for the category badge in the file list.
 *
 * Only a recognised algorithm name followed by its own parameter token counts: a bare
 * number such as 512, 768 or 1024 elsewhere in a filename says nothing about the key,
 * and a file whose name does not carry a recognised algorithm and parameter gets no
 * badge (null), so an unknown file never inherits a standards-based category.
 *
 * Categories (FIPS 203 Sec. 8, FIPS 204 Table 1, FIPS 205 Sec. 11; FN-DSA, FrodoKEM and
 * HQC as in the algorithm reference data):
 * - ML-KEM-512 / Kyber512 = 1, ML-KEM-768 = 3, ML-KEM-1024 = 5
 * - ML-DSA-44 / Dilithium2 = 2, ML-DSA-65 / Dilithium3 = 3, ML-DSA-87 / Dilithium5 = 5
 * - Falcon-512 / FN-DSA-512 = 1, Falcon-1024 / FN-DSA-1024 = 5
 * - SLH-DSA / SPHINCS+ with 128 = 1, 192 = 3, 256 = 5
 * - FrodoKEM-640 = 1, -976 = 3, -1344 = 5
 * - HQC-128 = 1, HQC-192 = 3, HQC-256 = 5
 */
export type SecurityCategory = 1 | 2 | 3 | 5

interface ParameterRule {
  /** Algorithm name followed by a parameter token; group 1 is the token. */
  pattern: RegExp
  categories: Record<string, SecurityCategory>
}

// The algorithm name must start at a word boundary (start of name or a non-alphanumeric
// character) and the parameter token must not run into more digits.
const START = '(?:^|[^a-z0-9])'
const SEP = '[-_ ]?'

const PARAMETER_RULES: ParameterRule[] = [
  {
    pattern: new RegExp(`${START}(?:ml-?kem|kyber)${SEP}(512|768|1024)(?![0-9])`),
    categories: { '512': 1, '768': 3, '1024': 5 },
  },
  {
    pattern: new RegExp(`${START}ml-?dsa${SEP}(44|65|87)(?![0-9])`),
    categories: { '44': 2, '65': 3, '87': 5 },
  },
  {
    pattern: new RegExp(`${START}dilithium${SEP}([235])(?![0-9])`),
    categories: { '2': 2, '3': 3, '5': 5 },
  },
  {
    pattern: new RegExp(`${START}(?:falcon|fn-?dsa)${SEP}(512|1024)(?![0-9])`),
    categories: { '512': 1, '1024': 5 },
  },
  {
    pattern: new RegExp(
      `${START}(?:slh-?dsa|sphincs\\+?)${SEP}(?:sha2|sha-?256|shake-?(?:256)?)?${SEP}(128|192|256)(?![0-9])`
    ),
    categories: { '128': 1, '192': 3, '256': 5 },
  },
  {
    pattern: new RegExp(`${START}frodokem${SEP}(640|976|1344)(?![0-9])`),
    categories: { '640': 1, '976': 3, '1344': 5 },
  },
  {
    pattern: new RegExp(`${START}hqc${SEP}(128|192|256)(?![0-9])`),
    categories: { '128': 1, '192': 3, '256': 5 },
  },
]

export const getSecurityLevel = (filename: string): SecurityCategory | null => {
  const lowerName = filename.toLowerCase()
  for (const rule of PARAMETER_RULES) {
    const token = rule.pattern.exec(lowerName)?.[1]
    // eslint-disable-next-line security/detect-object-injection
    if (token) return rule.categories[token] ?? null
  }
  return null
}
