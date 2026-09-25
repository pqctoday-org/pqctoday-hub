// SPDX-License-Identifier: GPL-3.0-only
/**
 * Primary sources for the ACVP Lab Workflow module (acvp-lab-workflow).
 *
 * Every factual statement in this module about ACVP, ACVTS, CAVP, CMVP,
 * FIPS 140-3, FIPS 203/204/205 or PKCS#11 v3.2 cites one of these entries
 * through <Cite>. Rules:
 *
 *  - `libraryRefId` is set only when the document is a row of the Hub
 *    Library (src/data/library_*.csv). sources.test.ts proves each one
 *    resolves through the standards registry.
 *  - A source WITHOUT `libraryRefId` is a primary source the Library does not
 *    carry yet. It is cited by its immutable URL (a pinned git commit where
 *    one exists) and is listed in the WS-I report as a "Library addition
 *    needed" — this module never adds Library rows itself.
 *  - `hubPolicy` marks PQC Today's own rules (the evidence taxonomy, the
 *    claim ladder). They are not NIST requirements and the UI says so.
 *
 * Section locators were checked against the cached copies read on
 * 2026-09-24 (FIPS 203/204/205, FIPS 140-3, the CMVP Management Manual v2.7,
 * PKCS#11 v3.2 OASIS Standard, draft-ietf-acvp-spec-01) and against the
 * usnistgov/ACVP sub-specification files at the pinned commits below.
 */

export interface ModuleSource {
  id: string
  /** Short label shown inside the bracketed citation. */
  short: string
  title: string
  url: string
  /** Hub Library reference_id, when the document is in the Library. */
  libraryRefId?: string
  /** Pinned revision / version actually read. */
  revision?: string
  /** PQC Today's own policy, not an external requirement. */
  hubPolicy?: boolean
}

const ACVP_SPEC_COMMIT = '892fd14710f3a7edbea230d0aecc5511e0257f8e'
const ACVP_MLKEM_COMMIT = 'bccef3648f6c05b224a051188ffe66f447cfdb6d'
const ACVP_SERVER_COMMIT = '975de31eb83d87039ec88934fdc47d8c312b892d'

const acvpFile = (commit: string, path: string) =>
  `https://github.com/usnistgov/ACVP/blob/${commit}/${path}`

export const SOURCES = {
  fips1403: {
    id: 'fips1403',
    short: 'FIPS 140-3',
    title: 'FIPS 140-3, Security Requirements for Cryptographic Modules',
    url: 'https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.140-3.pdf',
    libraryRefId: 'FIPS-140-3-STANDARD',
    revision: '2019-03-22',
  },
  cmvpMM: {
    id: 'cmvpMM',
    short: 'CMVP Management Manual',
    title: 'FIPS 140-3 CMVP Management Manual',
    // The v2.7 document itself. (On this branch the Library row still points
    // at the FIPS 140-2-era CMVPMM.pdf; feat/cert-ws1-library repoints it.)
    url: 'https://csrc.nist.gov/csrc/media/Projects/cryptographic-module-validation-program/documents/fips%20140-3/FIPS-140-3-CMVP%20Management%20Manual.pdf',
    libraryRefId: 'CMVP-MGMT-MANUAL',
    revision: 'v2.7, 2026-04-09',
  },
  sp800140c: {
    id: 'sp800140c',
    short: 'SP 800-140Cr2',
    title: 'NIST SP 800-140C Rev. 2, CMVP-Approved Security Functions',
    url: 'https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-140Cr2.pdf',
    libraryRefId: 'NIST-SP-800-140C',
  },
  cavp: {
    id: 'cavp',
    short: 'CAVP',
    title: 'NIST Cryptographic Algorithm Validation Program — overview page',
    url: 'https://csrc.nist.gov/Projects/cryptographic-algorithm-validation-program',
    revision: 'read 2026-09-24',
  },
  acvtsAccess: {
    id: 'acvtsAccess',
    short: 'Accessing the ACVTS',
    title: 'NIST CAVP — Accessing the ACVTS (Demo and Prod environments)',
    url: 'https://csrc.nist.gov/Projects/cryptographic-algorithm-validation-program/how-to-access-acvts',
    revision: 'read 2026-09-24',
  },
  acvpSpec: {
    id: 'acvpSpec',
    short: 'ACVP spec',
    title: 'Automated Cryptographic Validation Protocol (ACVP) JSON Specification',
    url: 'https://pages.nist.gov/ACVP/draft-fussell-acvp-spec.html',
    libraryRefId: 'NIST-ACVP',
    revision: 'draft-ietf-acvp-spec-01 (14 Aug 2026), as cached',
  },
  acvpMlKem: {
    id: 'acvpMlKem',
    short: 'ACVP ML-KEM sub-spec',
    title: 'ACVP ML-KEM JSON Specification — Test Types and Test Coverage',
    url: acvpFile(ACVP_MLKEM_COMMIT, 'src/ml-kem/sections/04-testtypes.adoc'),
    revision: `usnistgov/ACVP @ ${ACVP_MLKEM_COMMIT.slice(0, 7)}`,
  },
  acvpMlDsa: {
    id: 'acvpMlDsa',
    short: 'ACVP ML-DSA sub-spec',
    title: 'ACVP ML-DSA JSON Specification — Test Types and Test Coverage',
    url: acvpFile(ACVP_SPEC_COMMIT, 'src/ml-dsa/sections/04-testtypes.adoc'),
    revision: `usnistgov/ACVP @ ${ACVP_SPEC_COMMIT.slice(0, 7)}`,
  },
  acvpMlDsaCaps: {
    id: 'acvpMlDsaCaps',
    short: 'ACVP ML-DSA sigGen registration',
    title: 'ACVP ML-DSA JSON Specification — sigGen Registration Properties',
    url: acvpFile(ACVP_SPEC_COMMIT, 'src/ml-dsa/sections/05-ml-dsa-siggen-capabilities.adoc'),
    revision: `usnistgov/ACVP @ ${ACVP_SPEC_COMMIT.slice(0, 7)}`,
  },
  acvpMlDsaSupported: {
    id: 'acvpMlDsaSupported',
    short: 'ACVP ML-DSA supported revisions',
    title: 'ACVP ML-DSA JSON Specification — Supported ML-DSA Algorithms',
    url: acvpFile(ACVP_SPEC_COMMIT, 'src/ml-dsa/sections/03-supported.adoc'),
    revision: `usnistgov/ACVP @ ${ACVP_SPEC_COMMIT.slice(0, 7)}`,
  },
  acvpSlhDsa: {
    id: 'acvpSlhDsa',
    short: 'ACVP SLH-DSA sub-spec',
    title: 'ACVP SLH-DSA JSON Specification — Test Types and Test Coverage',
    url: acvpFile(ACVP_SPEC_COMMIT, 'src/slh-dsa/sections/04-testtypes.adoc'),
    revision: `usnistgov/ACVP @ ${ACVP_SPEC_COMMIT.slice(0, 7)}`,
  },
  acvpSha: {
    id: 'acvpSha',
    short: 'ACVP SHA sub-spec',
    title: 'ACVP SHA-1/SHA-2 JSON Specification — Test Types (AFT, MCT, LDT)',
    url: acvpFile(ACVP_SPEC_COMMIT, 'src/sha/sections/04-testtypes.adoc'),
    revision: `usnistgov/ACVP @ ${ACVP_SPEC_COMMIT.slice(0, 7)}`,
  },
  acvpServer: {
    id: 'acvpServer',
    short: 'NIST ACVP-Server',
    title: 'usnistgov/ACVP-Server — gen-val sample vector sets',
    url: `https://github.com/usnistgov/ACVP-Server/tree/${ACVP_SERVER_COMMIT}/gen-val/json-files`,
    revision: `usnistgov/ACVP-Server @ ${ACVP_SERVER_COMMIT.slice(0, 7)}`,
  },
  fips203: {
    id: 'fips203',
    short: 'FIPS 203',
    title: 'FIPS 203, Module-Lattice-Based Key-Encapsulation Mechanism Standard',
    url: 'https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.203.pdf',
    libraryRefId: 'FIPS 203',
  },
  fips204: {
    id: 'fips204',
    short: 'FIPS 204',
    title: 'FIPS 204, Module-Lattice-Based Digital Signature Standard',
    url: 'https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf',
    libraryRefId: 'FIPS 204',
  },
  fips205: {
    id: 'fips205',
    short: 'FIPS 205',
    title: 'FIPS 205, Stateless Hash-Based Digital Signature Standard',
    url: 'https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.205.pdf',
    libraryRefId: 'FIPS 205',
  },
  pkcs11: {
    id: 'pkcs11',
    short: 'PKCS#11 v3.2',
    title: 'PKCS #11 Specification Version 3.2 (OASIS Standard)',
    url: 'https://docs.oasis-open.org/pkcs11/pkcs11-spec/v3.2/os/pkcs11-spec-v3.2-os.html',
    libraryRefId: 'PKCS11-V32-OS-OASIS',
  },
  pkcs11Profiles: {
    id: 'pkcs11Profiles',
    short: 'PKCS#11 Profiles v3.2',
    title: 'PKCS #11 Cryptographic Token Interface Profiles Version 3.2 (OASIS Standard)',
    url: 'https://docs.oasis-open.org/pkcs11/pkcs11-profiles/v3.2/os/pkcs11-profiles-v3.2-os.pdf',
    libraryRefId: 'PKCS-11-Cryptographic-Token-Interface-Profiles-Version-3-2-O',
  },
  hubPolicy: {
    id: 'hubPolicy',
    short: 'PQC Today evidence policy',
    title:
      'PQC Today validation evidence policy — evidence classes, claim ladder and tested-scope rule (src/data/validation/evidenceClasses.ts)',
    url: 'https://github.com/pqctoday-org/pqctoday-hub/blob/main/src/data/validation/evidenceClasses.ts',
    hubPolicy: true,
  },
} as const satisfies Record<string, ModuleSource>

export type SourceId = keyof typeof SOURCES

/** Sources cited by this module that the Hub Library does not carry yet. */
export const LIBRARY_ADDITIONS_NEEDED: SourceId[] = (Object.keys(SOURCES) as SourceId[]).filter(
  (k) => {
    const s: ModuleSource = SOURCES[k]
    return !s.libraryRefId && !s.hubPolicy
  }
)
