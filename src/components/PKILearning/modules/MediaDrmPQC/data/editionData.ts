// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The four editions this lesson reads, side by side: which public-key mechanisms each
 * one specifies, and whether its text mentions quantum computing.
 *
 * The last column is a statement about the text of one edition. It says nothing about
 * what any organisation plans or has done.
 */

export interface EditionRow {
  id: string
  name: string
  edition: string
  /** Public-key mechanisms this edition specifies (empty when the lesson draws none from it). */
  publicKey: string[]
  /** The symmetric or hash primitives the lesson draws from it. */
  other: string[]
  mentionsQuantum: false
  scope: string
}

export const EDITIONS: EditionRow[] = [
  {
    id: 'aacs',
    name: 'AACS',
    edition:
      'Introduction and Common Cryptographic Elements Book, Revision 0.953 (26 October 2012)',
    publicKey: [
      'ECDSA (FIPS 186-2 / X9.62) for all digital signatures',
      'Elliptic-curve exchange for the Bus Key',
    ],
    other: [
      'AES-128 (ECB and CBC)',
      'AES-G one-way function and AES-H hashing function',
      'CMAC',
      'SHA-1 as the signature hash',
    ],
    mentionsQuantum: false,
    scope:
      'Implementation requires a license from AACS LA. This is the common-elements book; other editions and generations of AACS are not covered.',
  },
  {
    id: 'ci-plus',
    name: 'CI Plus',
    edition: 'Specification v1.3.2 (March 2015)',
    publicKey: ['RSASSA-PSS with 2048-bit RSA', 'Diffie-Hellman with 2048-bit public values'],
    other: [
      'SHA-1 (certificate signatures) and SHA-256 (derived values)',
      'AES-128-CBC and DES-56-ECB scramblers',
    ],
    mentionsQuantum: false,
    scope:
      'This lesson teaches the 2015 edition held in the Library. Other editions are not covered.',
  },
  {
    id: 'ecp',
    name: 'MovieLabs ECP',
    edition: 'Specification for Enhanced Content Protection, Version 1.4 (August 2024)',
    publicKey: [],
    other: ['A cipher of AES 128 or better'],
    mentionsQuantum: false,
    scope:
      'A set of high-level specifications from MovieLabs; each studio decides which practices it requires. The lesson takes from it threat, device-binding, revocation, watermarking, certification and operator points, not a list of public-key algorithms.',
  },
  {
    id: 'c2pa',
    name: 'C2PA',
    edition: 'Technical Specification, Version 2.4',
    publicKey: [
      'ECDSA (ES256, ES384, ES512)',
      'RSASSA-PSS (PS256, PS384, PS512)',
      'EdDSA (Ed25519 only)',
    ],
    other: ['SHA-2 hashes (SHA-3 is not on the allowed list)'],
    mentionsQuantum: false,
    scope: 'Allowed list for generating new claim signatures; the deprecated list is empty.',
  },
]
