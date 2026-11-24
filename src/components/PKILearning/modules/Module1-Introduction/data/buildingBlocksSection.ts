// SPDX-License-Identifier: AGPL-3.0-only
import type { SourcedSectionData } from '@/components/PKILearning/common/SourcedSection'

/** Every sentence reports what the named Library document says, at the place given. */
export const BUILDING_BLOCKS_SECTION: SourcedSectionData = {
  id: 'building-blocks',
  title: 'The building blocks in plain words',
  lead: 'This section introduces the core cryptographic building blocks—keys, encryption, hash functions, digital signatures, and key establishment—in plain language. Knowing what each piece does makes it easier to follow how post-quantum cryptography fits into real systems.',
  blocks: [
    {
      heading: 'Keys: symmetric and asymmetric',
      sentences: [
        {
          id: 'PRM-01',
          text: 'A cryptographic key is a parameter used with a cryptographic algorithm so that someone who knows the key can repeat or reverse the operation, while someone without it cannot.',
          sourceId: 'NIST-SP-800-175B',
          edition:
            'Guideline for Using Cryptographic Standards in the Federal Government: Cryptographic Mechanisms, 2020-03',
          locator: 'Section 1.5 Terms and Definitions, PDF page 13',
        },
        {
          id: 'PRM-02',
          text: 'Symmetric-key algorithms, sometimes called secret-key algorithms, use a single key for a cryptographic operation and its inverse, both applying protection and removing or checking it.',
          sourceId: 'NIST-SP-800-175B',
          edition:
            'Guideline for Using Cryptographic Standards in the Federal Government: Cryptographic Mechanisms, 2020-03',
          locator: 'Section 3.2 Symmetric-Key Algorithms, PDF page 30',
        },
        {
          id: 'PRM-03',
          text: 'Asymmetric-key algorithms, often called public-key algorithms, use a mathematically related public key and private key; the public key may be shared openly, and the private key cannot efficiently be determined from it.',
          sourceId: 'NIST-SP-800-175B',
          edition:
            'Guideline for Using Cryptographic Standards in the Federal Government: Cryptographic Mechanisms, 2020-03',
          locator: 'Section 3.3 Asymmetric-Key Algorithms, PDF page 34',
        },
        {
          id: 'PRM-04',
          text: 'Symmetric-key algorithms are generally significantly faster and use shorter keys at the same security strength; asymmetric-key algorithms are used for digital signatures and initial key establishment, while symmetric-key algorithms serve other purposes, including encryption.',
          sourceId: 'NIST-SP-800-175B',
          edition:
            'Guideline for Using Cryptographic Standards in the Federal Government: Cryptographic Mechanisms, 2020-03',
          locator: 'Section 4.5 Symmetric vs. Asymmetric Cryptography, PDF page 48',
        },
      ],
    },
    {
      heading: 'Encryption and hash functions',
      bridge:
        'With the two key families in mind, the next building blocks cover encryption, hash functions, and how these tools are expected to hold up in a quantum era.',
      sentences: [
        {
          id: 'PRM-05',
          text: 'Encryption provides confidentiality for data by transforming unprotected data, called plaintext, into ciphertext, while decryption transforms ciphertext back into plaintext.',
          sourceId: 'NIST-SP-800-175B',
          edition:
            'Guideline for Using Cryptographic Standards in the Federal Government: Cryptographic Mechanisms, 2020-03',
          locator: 'Section 4.1 Data Confidentiality, PDF page 40',
        },
        {
          id: 'PRM-07',
          text: 'NIST SP 800-175B states that the Advanced Encryption Standard (AES), specified in FIPS 197, is the preferred block cipher for new products and operates on 128-bit blocks using 128-, 192-, or 256-bit keys.',
          sourceId: 'NIST-SP-800-175B',
          edition:
            'Guideline for Using Cryptographic Standards in the Federal Government: Cryptographic Mechanisms, 2020-03',
          locator: 'Section 3.2.1.4 Advanced Encryption Standard (AES), PDF page 33',
        },
        {
          id: 'PRM-09',
          text: 'With a secure hash algorithm, it is computationally infeasible to find a message matching a given digest or two different messages with the same digest, and any message change will very likely change the digest.',
          sourceId: 'FIPS-180-4',
          edition:
            'Secure Hash Standard (SHS) — SHA-1, SHA-224, SHA-256, SHA-384, SHA-512, 2015-08',
          locator: 'Announcement Section 3 Explanation, PDF page 4',
        },
        {
          id: 'PRM-21',
          text: 'NIST IR 8105 explains that because an exponential speedup for search algorithms is impossible, symmetric algorithms and hash functions should remain usable in a quantum era.',
          sourceId: 'NIST IR 8105',
          edition: 'Report on Post-Quantum Cryptography, 2016-04',
          locator: 'Section 2 An Overview of Quantum-Resistant Cryptography, PDF page 8',
        },
      ],
    },
    {
      heading: 'Digital signatures',
      bridge:
        'Next are digital signatures, which address how recipients verify the origin and integrity of data.',
      sentences: [
        {
          id: 'PRM-11',
          text: "A digital signature is a string of bits computed on stored or transmitted data so that a verifier can check the signer's identity and the data's integrity.",
          sourceId: 'FIPS 186-5',
          edition: 'Digital Signature Standard (DSS), 2023-02',
          locator: 'Announcement Section 3 Explanation, PDF page 4',
        },
        {
          id: 'PRM-12',
          text: 'Only the holder of the private key can generate a digital signature, while anyone with the matching public key can verify it; FIPS 186-5 states that private keys must be kept secret.',
          sourceId: 'FIPS 186-5',
          edition: 'Digital Signature Standard (DSS), 2023-02',
          locator: 'Announcement Section 3 Explanation, PDF page 4',
        },
        {
          id: 'PRM-13',
          text: "Digital signatures detect unauthorized changes to data, authenticate the signer's identity, and provide non-repudiation by giving the recipient evidence for a third party that the claimed signer generated the signature.",
          sourceId: 'FIPS 186-5',
          edition: 'Digital Signature Standard (DSS), 2023-02',
          locator: 'Abstract, PDF page 3',
        },
      ],
    },
    {
      heading: 'Establishing a shared key',
      bridge:
        'Finally, key-establishment methods address how separate parties arrive at a shared secret key to protect their communications.',
      sentences: [
        {
          id: 'PRM-14',
          text: 'A key-establishment scheme is a set of algorithms that lets two or more parties securely establish a shared secret key, which can then be used with symmetric-key cryptography for efficient confidential communication.',
          sourceId: 'NIST SP 800-227',
          edition: 'Recommendations for Key-Encapsulation Mechanisms, 2025-09',
          locator: 'Section 1.1 Background, PDF page 9',
        },
        {
          id: 'PRM-15',
          text: "In key agreement, the resulting keying material depends on information contributed by all participants, so no single participant can predetermine the key's value on its own.",
          sourceId: 'NIST-SP-800-175B',
          edition:
            'Guideline for Using Cryptographic Standards in the Federal Government: Cryptographic Mechanisms, 2020-03',
          locator: 'Section 5.3.3 Key Agreement, PDF page 60',
        },
        {
          id: 'PRM-16',
          text: 'In key transport, one party generates a key and distributes it to one or more receivers, either through manual methods such as a courier or through automated protocols.',
          sourceId: 'NIST-SP-800-175B',
          edition:
            'Guideline for Using Cryptographic Standards in the Federal Government: Cryptographic Mechanisms, 2020-03',
          locator: 'Section 5.3.4 Key Transport/Key Distribution, PDF page 62',
        },
        {
          id: 'PRM-17',
          text: "In a key-encapsulation mechanism (KEM), one party uses the other's encapsulation key to generate a shared secret key and ciphertext, and the receiver uses that ciphertext with a private decapsulation key to compute the same key.",
          sourceId: 'FIPS 203',
          edition: 'Module-Lattice-Based Key-Encapsulation Mechanism Standard (ML-KEM), 2024-08',
          locator: 'Announcement Section 3 Explanation, PDF page 4',
        },
      ],
    },
  ],
}
