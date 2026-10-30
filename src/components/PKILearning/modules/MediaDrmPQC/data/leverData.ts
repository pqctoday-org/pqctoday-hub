// SPDX-License-Identifier: AGPL-3.0-only
/**
 * For each link in the lesson: which public-key primitive it uses, which NIST IR 8547 table
 * lists that kind of primitive, and who the held documents say holds the lever for changing
 * or revoking something on it.
 *
 * The lesson states the levers and gives no timeline: none of the held editions states a
 * migration timeline, and none mentions quantum computing.
 */

export interface LinkRow {
  id: string
  link: string
  primitive: string
  nist: string
  levers: string[]
}

export const LINKS: LinkRow[] = [
  {
    id: 'aacs',
    link: 'AACS key management and drive authentication',
    primitive:
      'ECDSA signatures (SHA-1); elliptic-curve exchange for the Bus Key; AES-128 for the key tree',
    nist: 'ECDSA: Table 2. Elliptic-curve Diffie-Hellman: Table 4. AES-128 is not in Table 2 or Table 4.',
    levers: [
      'AACS LA generates the Media Key Block, and an updated block is how compromised Device Keys are revoked.',
      'Implementing the specification requires a license from AACS LA LLC.',
    ],
  },
  {
    id: 'ci-plus',
    link: 'CI Plus authentication and Host Revocation',
    primitive:
      'RSASSA-PSS (2048-bit RSA, SHA-1); Diffie-Hellman (2048-bit values); DES-56 or AES-128 scrambling',
    nist: 'RSA signatures: Table 2. Diffie-Hellman: Table 4. DES, AES, SHA-1 and SHA-256 are not in Table 2 or Table 4.',
    levers: [
      'A Service Operator asks the Root-of-Trust to create a revocation list for its own operation, and revocation is tied to that operator.',
      'The exact rules for revoking a device are set by the CI Plus license.',
    ],
  },
  {
    id: 'ecp',
    link: 'ECP-level services and devices',
    primitive: 'Not drawn from this edition',
    nist: 'Not applicable: the lesson takes no public-key algorithm from ECP.',
    levers: [
      'MovieLabs publishes the specification, and each studio decides which practices it requires.',
      'ECP asks that operators be able to restrict content when devices stop receiving security updates, and lists operator practices: separate content keys and content kept off public CDNs until needed.',
      'ECP asks for certification by third parties and trusted implementers.',
    ],
  },
  {
    id: 'tls',
    link: 'Transport (TLS 1.3) for license and content delivery',
    primitive: 'TLS 1.3 key agreement, with the hybrid mechanisms of RFC 10024 as one option',
    nist: 'The ECDHE part of each RFC 10024 mechanism is elliptic-curve Diffie-Hellman (Table 4); ML-KEM (FIPS 203) is the post-quantum part.',
    levers: ['RFC 10024 is an IETF Standards Track document (August 2026).'],
  },
  {
    id: 'c2pa',
    link: 'C2PA claim signatures',
    primitive: 'ECDSA, RSASSA-PSS or EdDSA (Ed25519) in a COSE_Sign1 structure',
    nist: 'ECDSA, EdDSA and RSA signatures: Table 2.',
    levers: [
      'The C2PA specification sets the allowed list for new signatures.',
      'C2PA keeps a signer Trust List and a time-stamp authority Trust List, and validation checks the signer credential’s revocation information.',
    ],
  },
]
