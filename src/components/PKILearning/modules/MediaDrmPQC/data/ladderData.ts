// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The key ladders of two content-protection schemes, as their specifications describe them.
 *
 *  - AACS Introduction and Common Cryptographic Elements Book, Revision 0.953 (26 October
 *    2012) -> library `AACS-Introduction-and-Common-Cryptographic-Elements-Book-Rev`
 *  - CI Plus Specification v1.3.2 (March 2015) -> library `CI-Plus-Spec-v1.3.2`
 *
 * Other editions and generations of either scheme are not covered.
 * Neither edition mentions quantum computing, so the "NIST table" column is the lesson's
 * own pairing of each primitive with the NIST IR 8547 tables, not something either
 * specification says.
 */

export type PrimitiveKind = 'symmetric' | 'public-key' | 'hash'

/** The NIST IR 8547 (October 2026) table that lists this kind of public-key primitive. */
export type NistTable = 'Table 2 (signatures)' | 'Table 4 (key establishment)' | null

export interface LadderRung {
  id: string
  scheme: 'AACS' | 'CI Plus'
  order: number
  name: string
  what: string
  primitive: string
  kind: PrimitiveKind
  nistTable: NistTable
  where: string
}

export const AACS_EDITION =
  'AACS Introduction and Common Cryptographic Elements Book, Revision 0.953'
export const AACS_DATE = '26 October 2012'
export const CI_PLUS_EDITION = 'CI Plus Specification v1.3.2'
export const CI_PLUS_DATE = 'March 2015'

export const LADDER_RUNGS: LadderRung[] = [
  // ---- AACS
  {
    id: 'aacs-device-keys',
    scheme: 'AACS',
    order: 1,
    name: 'Device Keys',
    what: 'Each compliant device is given a set of secret Device Keys when it is manufactured. The keys come from AACS LA and are 128 bits each.',
    primitive: '128-bit keys',
    kind: 'symmetric',
    nistTable: null,
    where: '3.1 Device Keys; Table 3-1',
  },
  {
    id: 'aacs-processing-keys',
    scheme: 'AACS',
    order: 2,
    name: 'Subsidiary Device Keys and Processing Keys',
    what: 'A device calculates subsidiary Device Keys and Processing Keys from its Device Keys with the AES-G3 function, which is built from AES-128.',
    primitive: 'AES-G3 (AES-128)',
    kind: 'symmetric',
    nistTable: null,
    where: '3.2.2',
  },
  {
    id: 'aacs-media-key',
    scheme: 'AACS',
    order: 3,
    name: 'Media Key Block and Media Key',
    what: 'AACS LA generates the Media Key Block. A device decrypts one or more elements of it with its Device Keys to extract the 128-bit Media Key: AES-128D of the encrypted key data under a Processing Key, combined by XOR with a mask built from the uv number. The encrypted key data is in the Media Key Data Record of the block.',
    primitive: 'AES-128D',
    kind: 'symmetric',
    nistTable: null,
    where: '3.2 Media Key Block; Km equation in 3.2.4',
  },
  {
    id: 'aacs-revocation',
    scheme: 'AACS',
    order: 4,
    name: 'Revocation by a new Media Key Block',
    what: 'If a set of Device Keys is compromised, an updated Media Key Block can be released that stops devices with those Device Keys from calculating the correct Media Key. The block of a subset-difference tree system is of the same order in size as a public-key certificate revocation list, which the document says makes it equivalent in revocation power to a public-key system (an informative section).',
    primitive: 'Subset-difference tree of 128-bit keys',
    kind: 'symmetric',
    nistTable: null,
    where: '3.2 and 3.2.1',
  },
  {
    id: 'aacs-mkb-signature',
    scheme: 'AACS',
    order: 5,
    name: 'Signature on the Media Key Block',
    what: 'Devices are required to check the signature on the Media Key Block. The End of Media Key Block record carries the AACS LA signature on the data in the block.',
    primitive: 'ECDSA, with SHA-1 as the signature hash',
    kind: 'public-key',
    nistTable: 'Table 2 (signatures)',
    where: '2.1.5 and 2.3; revision history; End of Media Key Block record',
  },
  {
    id: 'aacs-bus-key',
    scheme: 'AACS',
    order: 6,
    name: 'Drive authentication and Bus Key',
    what: 'The drive and the host each generate a 160-bit nonce, exchange the matching points on the elliptic curve with signatures, and each derives the same Bus Key from its own nonce and the other side’s point.',
    primitive: 'Elliptic-curve exchange, signed with ECDSA',
    kind: 'public-key',
    nistTable: 'Table 4 (key establishment)',
    where: '4.3 Drive Authentication (steps 17 to 29)',
  },
  // ---- CI Plus
  {
    id: 'ci-certificates',
    scheme: 'CI Plus',
    order: 1,
    name: 'Authentication signatures',
    what: 'The CICAM and the host sign their authentication messages with RSASSA-PSS. The RSA public exponent is 65537, the modulus length is 2048 bits, and the signatures are 2048 bits long. The certificate signatures use SHA-1: Table 9.1 sets the hash algorithm to SHA-1, mask generation to MGF1 using SHA-1 and the salt to 20 bytes, and Annex I describes the scheme as RSA + SHA1.',
    primitive: 'RSASSA-PSS, 2048-bit RSA, SHA-1',
    kind: 'public-key',
    nistTable: 'Table 2 (signatures)',
    where: 'Authentication tables; RSA key format clause; 9.3.3 Table 9.1; Annex I',
  },
  {
    id: 'ci-dh',
    scheme: 'CI Plus',
    order: 2,
    name: 'Diffie-Hellman key negotiation',
    what: 'Key negotiation uses Diffie-Hellman with 2048-bit public values. The Diffie-Hellman parameters are not defined in the specification; they are in the CI Plus Licensee Specification.',
    primitive: 'Diffie-Hellman, 2048-bit values',
    kind: 'public-key',
    nistTable: 'Table 4 (key establishment)',
    where: '6.2.3.1 Diffie Hellman Parameters; field-size table',
  },
  {
    id: 'ci-hash',
    scheme: 'CI Plus',
    order: 3,
    name: 'SHA-256 for derived values',
    what: 'The CICAM and the host both contain algorithms for Diffie-Hellman key negotiation, SHA-256 hashing, DES and AES. SHA-256 is used for derived values such as the UCK (UCK = SHA256(SAK)); the certificate signatures use SHA-1, as above.',
    primitive: 'SHA-256',
    kind: 'hash',
    nistTable: null,
    where: '4 System Overview; key derivation clauses',
  },
  {
    id: 'ci-scrambler-des',
    scheme: 'CI Plus',
    order: 4,
    name: 'Scrambler option: DES-56 in ECB mode',
    what: 'After authentication the system has determined whether the AES or DES cipher protects the content returning to the host. Table 5.5 makes DES-56-ECB mandatory for the CICAM and for both SD and HD hosts.',
    primitive: 'DES-56-ECB',
    kind: 'symmetric',
    nistTable: null,
    where: 'Table 5.5 Host and CICAM Capabilities',
  },
  {
    id: 'ci-scrambler-aes',
    scheme: 'CI Plus',
    order: 5,
    name: 'Scrambler option: AES-128 in CBC mode',
    what: 'Transport Stream payloads may be encrypted with AES-128 in CBC mode under a Content Control key. Table 5.5 makes AES-128-CBC optional for the CICAM and mandatory for HD hosts only.',
    primitive: 'AES-128-CBC',
    kind: 'symmetric',
    nistTable: null,
    where: 'Table 5.5; scrambling section',
  },
]

export const RUNGS_BY_SCHEME = (scheme: LadderRung['scheme']): LadderRung[] =>
  LADDER_RUNGS.filter((r) => r.scheme === scheme).sort((a, b) => a.order - b.order)

/** What NIST IR 8547 (October 2026) says about the public-key families in its two tables. */
export const NIST_TRANSITION = {
  document: 'NIST IR 8547, Transition to Post-Quantum Cryptography Standards',
  date: 'October 2026',
  summary:
    'NIST will deprecate quantum-vulnerable public-key cryptography after 2030 and disallow its use under NIST standards and guidelines after 2035.',
  table2: 'Table 2 lists ECDSA, EdDSA and RSA signatures.',
  table4:
    'Table 4 lists finite-field Diffie-Hellman and MQV, elliptic-curve Diffie-Hellman and MQV, and RSA key establishment.',
  table3:
    'Table 3 lists the post-quantum signature families ML-DSA (FIPS 204), SLH-DSA (FIPS 205), LMS and HSS, and XMSS and XMSS^MT (SP 800-208).',
  scope:
    'These dates are NIST’s schedule for NIST standards and guidelines. They are not a deadline set by any media licensing body or studio.',
}
