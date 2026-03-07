// SPDX-License-Identifier: GPL-3.0-only
export interface GlossaryTerm {
  term: string
  acronym?: string
  definition: string
  technicalNote?: string
  relatedModule?: string
  complexity: 'beginner' | 'intermediate' | 'advanced'
  category: 'algorithm' | 'protocol' | 'standard' | 'concept' | 'organization'
}

export const glossaryTerms: GlossaryTerm[] = [
  // === Concepts (Beginner) ===
  {
    term: 'Post-Quantum Cryptography',
    acronym: 'PQC',
    definition:
      'Cryptographic algorithms designed to be secure against attacks by both classical and quantum computers.',
    technicalNote:
      'PQC algorithms are based on mathematical problems believed to be hard for quantum computers, such as lattice problems, hash functions, and error-correcting codes.',
    relatedModule: '/learn/pqc-101',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Quantum Computing',
    definition:
      'A type of computing that uses quantum-mechanical phenomena like superposition and entanglement to perform calculations exponentially faster than classical computers for certain problems.',
    relatedModule: '/learn/pqc-101',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Q-Day',
    definition:
      'The hypothetical future date when a quantum computer becomes powerful enough to break current public-key cryptography (RSA, ECC).',
    relatedModule: '/threats',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Harvest Now, Decrypt Later',
    acronym: 'HNDL',
    definition:
      'An attack strategy where adversaries collect encrypted data today with the intention of decrypting it once quantum computers become available.',
    relatedModule: '/threats',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Encryption',
    definition:
      'The process of converting readable data (plaintext) into an unreadable format (ciphertext) using an algorithm and a key, so only authorized parties can read it.',
    relatedModule: '/learn/pqc-101',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Digital Signature',
    definition:
      'A mathematical scheme that proves the authenticity and integrity of a digital message or document, analogous to a handwritten signature.',
    relatedModule: '/learn/pki-workshop',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Public Key',
    definition:
      'A cryptographic key that can be shared openly. Used to encrypt data or verify digital signatures.',
    relatedModule: '/learn/pki-workshop',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Private Key',
    definition:
      'A cryptographic key kept secret by its owner. Used to decrypt data or create digital signatures.',
    relatedModule: '/learn/pki-workshop',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Key Pair',
    definition:
      'A mathematically linked public key and private key used together for encryption/decryption or signing/verification.',
    relatedModule: '/learn/pki-workshop',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Hybrid Cryptography',
    definition:
      'Using both classical and post-quantum algorithms together during the transition period, providing security even if one algorithm is broken.',
    relatedModule: '/learn/hybrid-crypto',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Crypto Agility',
    definition:
      'The ability of a system to quickly switch between cryptographic algorithms without major redesign, critical for adapting to PQC.',
    relatedModule: '/learn/crypto-agility',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Qubit',
    definition:
      'The basic unit of quantum information, analogous to a classical bit but capable of existing in superposition of 0 and 1 simultaneously.',
    relatedModule: '/learn/pqc-101',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Superposition',
    definition:
      'A quantum property where a qubit can represent both 0 and 1 at the same time, enabling quantum computers to explore many solutions simultaneously.',
    relatedModule: '/learn/pqc-101',
    complexity: 'beginner',
    category: 'concept',
  },

  // === Algorithms (Beginner / Intermediate) ===
  {
    term: 'Diffie-Hellman',
    acronym: 'DH',
    definition:
      'The original public-key key exchange protocol, allowing two parties to establish a shared secret over an insecure channel. Quantum-vulnerable.',
    technicalNote:
      "Broken by quantum computers via Shor's algorithm. Being replaced by Key Encapsulation Mechanisms (KEMs) such as ML-KEM.",
    relatedModule: '/algorithms',
    complexity: 'beginner',
    category: 'algorithm',
  },
  {
    term: 'RSA',
    definition:
      "A widely used classical public-key algorithm based on the difficulty of factoring large numbers. Vulnerable to quantum attacks via Shor's algorithm.",
    technicalNote:
      'Common key sizes: 2048, 3072, 4096 bits. Being replaced by ML-DSA for signatures and ML-KEM for key exchange.',
    relatedModule: '/algorithms',
    complexity: 'beginner',
    category: 'algorithm',
  },
  {
    term: 'DSA',
    acronym: 'DSA',
    definition:
      'Digital Signature Algorithm, a classical FIPS 186 signature scheme based on discrete logarithms. Deprecated by NIST IR 8547 alongside RSA and ECDSA due to quantum vulnerability.',
    technicalNote:
      "Broken by Shor's algorithm. Common key sizes: 1024–3072 bits. No longer approved for new systems after 2030 per NIST IR 8547.",
    relatedModule: '/algorithms',
    complexity: 'beginner',
    category: 'algorithm',
  },
  {
    term: 'Elliptic Curve Cryptography',
    acronym: 'ECC',
    definition:
      'A classical public-key algorithm using the mathematics of elliptic curves. More efficient than RSA but equally vulnerable to quantum attacks.',
    technicalNote: 'Common curves: P-256, P-384, P-521, secp256k1 (Bitcoin), Curve25519.',
    relatedModule: '/algorithms',
    complexity: 'intermediate',
    category: 'algorithm',
  },
  {
    term: 'ML-KEM',
    definition:
      'Module-Lattice-Based Key Encapsulation Mechanism, the NIST-standardized PQC algorithm for key exchange (formerly Kyber). Defined in FIPS 203.',
    technicalNote:
      'Variants: ML-KEM-512 (128-bit security), ML-KEM-768 (192-bit), ML-KEM-1024 (256-bit).',
    relatedModule: '/playground',
    complexity: 'intermediate',
    category: 'algorithm',
  },
  {
    term: 'ML-DSA',
    definition:
      'Module-Lattice-Based Digital Signature Algorithm, the NIST-standardized PQC algorithm for digital signatures (formerly Dilithium). Defined in FIPS 204.',
    technicalNote:
      'Variants: ML-DSA-44, ML-DSA-65, ML-DSA-87 corresponding to security levels 2, 3, 5.',
    relatedModule: '/playground',
    complexity: 'intermediate',
    category: 'algorithm',
  },
  {
    term: 'SLH-DSA',
    definition:
      'Stateless Hash-Based Digital Signature Algorithm, a conservative NIST-standardized hash-based PQC signature scheme (formerly SPHINCS+). Defined in FIPS 205.',
    technicalNote:
      '12 variants: combinations of SHA-256/SHAKE, 128/192/256-bit security, and fast/small trade-offs.',
    relatedModule: '/algorithms',
    complexity: 'advanced',
    category: 'algorithm',
  },
  {
    term: 'FN-DSA',
    definition:
      'FFT over NTRU-Lattice-Based Digital Signature Algorithm (formerly Falcon), a compact PQC signature scheme. Defined in FIPS 206, published October 2024.',
    technicalNote:
      'Variants: FN-DSA-512 (Level 1) and FN-DSA-1024 (Level 5). Known for very small signatures but requires careful floating-point implementation.',
    relatedModule: '/algorithms',
    complexity: 'advanced',
    category: 'algorithm',
  },
  {
    term: 'FrodoKEM',
    definition:
      'A conservative lattice-based KEM algorithm based on the "plain" Learning With Errors problem, offering strong security guarantees at the cost of larger key sizes.',
    relatedModule: '/algorithms',
    complexity: 'advanced',
    category: 'algorithm',
  },
  {
    term: 'HQC',
    definition:
      'Hamming Quasi-Cyclic, a code-based KEM selected by NIST as an additional standard. Uses error-correcting codes for security.',
    relatedModule: '/learn/pqc-101',
    complexity: 'advanced',
    category: 'algorithm',
  },
  {
    term: 'Classic McEliece',
    definition:
      'A code-based KEM with very large public keys but extremely conservative security assumptions. One of the oldest post-quantum proposals.',
    relatedModule: '/learn/pqc-101',
    complexity: 'advanced',
    category: 'algorithm',
  },
  {
    term: 'XMSS',
    acronym: 'XMSS',
    definition:
      'eXtended Merkle Signature Scheme, a stateful hash-based digital signature algorithm standardized in RFC 8391 and NIST SP 800-208.',
    technicalNote:
      'Like LMS, XMSS is stateful and each key can only sign a limited number of messages. Required by CNSA 2.0 for firmware and software signing.',
    relatedModule: '/learn/stateful-signatures',
    complexity: 'advanced',
    category: 'algorithm',
  },
  {
    term: 'LMS/HSS',
    acronym: 'LMS',
    definition:
      'Leighton-Micali Signature / Hierarchical Signature System. A stateful hash-based signature scheme for firmware and software signing.',
    technicalNote:
      'Standardized in RFC 8554. "Stateful" means each key can only sign a limited number of messages.',
    relatedModule: '/openssl',
    complexity: 'advanced',
    category: 'algorithm',
  },
  {
    term: 'AES',
    acronym: 'AES',
    definition:
      'Advanced Encryption Standard, a symmetric encryption algorithm. Relatively safe from quantum attacks (just double the key size: AES-256).',
    technicalNote:
      "Quantum attacks via Grover's algorithm halve the effective security level, so AES-128 becomes ~64-bit. AES-256 remains secure.",
    relatedModule: '/learn/pqc-101',
    complexity: 'beginner',
    category: 'algorithm',
  },
  {
    term: "Shor's Algorithm",
    definition:
      'A quantum algorithm that can efficiently factor large numbers and compute discrete logarithms, breaking RSA and ECC.',
    relatedModule: '/learn/quantum-threats',
    complexity: 'intermediate',
    category: 'algorithm',
  },
  {
    term: "Grover's Algorithm",
    definition:
      'A quantum algorithm that speeds up brute-force searches, effectively halving the security level of symmetric ciphers and hash functions.',
    relatedModule: '/learn/quantum-threats',
    complexity: 'intermediate',
    category: 'algorithm',
  },
  {
    term: 'ECDSA',
    acronym: 'ECDSA',
    definition:
      'Elliptic Curve Digital Signature Algorithm, a classical signature scheme used in TLS, Bitcoin, and many other systems. Quantum-vulnerable.',
    relatedModule: '/learn/digital-assets',
    complexity: 'intermediate',
    category: 'algorithm',
  },
  {
    term: 'ECDH',
    acronym: 'ECDH',
    definition:
      'Elliptic Curve Diffie-Hellman, a classical key agreement protocol. Quantum-vulnerable and being replaced by ML-KEM.',
    complexity: 'intermediate',
    category: 'algorithm',
  },
  {
    term: 'X25519',
    definition:
      'An elliptic curve Diffie-Hellman key exchange function using Curve25519. Widely used in TLS 1.3 and the basis for hybrid PQC key exchange.',
    technicalNote:
      'Combined with ML-KEM-768 to form the X25519MLKEM768 hybrid key exchange, now deployed by major browsers and cloud providers.',
    relatedModule: '/algorithms',
    complexity: 'intermediate',
    category: 'algorithm',
  },
  {
    term: 'X448',
    definition:
      'An elliptic curve Diffie-Hellman key exchange function using Curve448, providing higher security than X25519. Quantum-vulnerable.',
    relatedModule: '/algorithms',
    complexity: 'advanced',
    category: 'algorithm',
  },
  {
    term: 'Ed25519',
    definition:
      'A high-performance digital signature algorithm using the Edwards curve Curve25519. Used in SSH, TLS, and Solana.',
    relatedModule: '/learn/digital-assets',
    complexity: 'intermediate',
    category: 'algorithm',
  },
  {
    term: 'Ed448',
    definition:
      'An EdDSA signature algorithm using the Edwards curve Curve448, providing 224-bit security. Quantum-vulnerable.',
    relatedModule: '/algorithms',
    complexity: 'advanced',
    category: 'algorithm',
  },
  {
    term: 'SHA-256',
    definition:
      'Secure Hash Algorithm producing a 256-bit digest. Used extensively in Bitcoin and TLS. Quantum-safe at current key sizes.',
    relatedModule: '/learn/digital-assets',
    complexity: 'beginner',
    category: 'algorithm',
  },
  {
    term: 'HKDF',
    acronym: 'HKDF',
    definition:
      'HMAC-based Key Derivation Function, used to derive cryptographic keys from a shared secret. Essential in TLS 1.3.',
    relatedModule: '/learn/tls-basics',
    complexity: 'intermediate',
    category: 'algorithm',
  },

  // === Protocols ===
  {
    term: 'TLS',
    acronym: 'TLS',
    definition:
      'Transport Layer Security, the protocol that secures HTTPS web traffic. TLS 1.3 is the current version.',
    technicalNote:
      'PQC integration uses hybrid key exchange (e.g., X25519 + ML-KEM-768) to maintain backward compatibility.',
    relatedModule: '/learn/tls-basics',
    complexity: 'beginner',
    category: 'protocol',
  },
  {
    term: 'X.509',
    definition:
      'The standard format for public key certificates used in TLS, email signing, and code signing.',
    relatedModule: '/learn/pki-workshop',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'Public Key Infrastructure',
    acronym: 'PKI',
    definition:
      'The system of Certificate Authorities, digital certificates, and registration authorities that manages public keys and enables secure communication.',
    relatedModule: '/learn/pki-workshop',
    complexity: 'beginner',
    category: 'protocol',
  },
  {
    term: 'Certificate Signing Request',
    acronym: 'CSR',
    definition:
      'A message sent to a Certificate Authority to request a digital certificate. Contains the public key and identity information.',
    relatedModule: '/learn/pki-workshop',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'Certificate Authority',
    acronym: 'CA',
    definition:
      'A trusted organization that issues digital certificates, verifying the identity of certificate holders.',
    relatedModule: '/learn/pki-workshop',
    complexity: 'beginner',
    category: 'protocol',
  },
  {
    term: 'Key Encapsulation Mechanism',
    acronym: 'KEM',
    definition:
      'A method to securely establish a shared secret key between two parties. The PQC replacement for traditional key exchange.',
    technicalNote:
      'Unlike Diffie-Hellman, KEMs work via encapsulation (encrypt a random secret with a public key) and decapsulation (decrypt with the private key).',
    relatedModule: '/playground',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: '5G-AKA',
    definition:
      '5G Authentication and Key Agreement protocol, the primary authentication mechanism in 5G networks.',
    relatedModule: '/learn/5g-security',
    complexity: 'advanced',
    category: 'protocol',
  },
  {
    term: 'SUCI',
    acronym: 'SUCI',
    definition:
      "Subscription Concealed Identifier, a privacy-protecting identifier used in 5G that encrypts the subscriber's permanent identity.",
    relatedModule: '/learn/5g-security',
    complexity: 'advanced',
    category: 'protocol',
  },
  {
    term: 'OpenID4VCI',
    definition:
      'OpenID for Verifiable Credential Issuance, a protocol for issuing digital credentials to wallets.',
    relatedModule: '/learn/digital-id',
    complexity: 'advanced',
    category: 'protocol',
  },
  {
    term: 'OpenID4VP',
    definition:
      'OpenID for Verifiable Presentations, a protocol for presenting digital credentials from a wallet to a verifier.',
    relatedModule: '/learn/digital-id',
    complexity: 'advanced',
    category: 'protocol',
  },

  // === Protocols (additional) ===
  {
    term: 'SSH',
    acronym: 'SSH',
    definition:
      'Secure Shell, a protocol for encrypted remote login and command execution. PQC integration adds ML-KEM hybrid key exchange.',
    relatedModule: '/migrate',
    complexity: 'beginner',
    category: 'protocol',
  },
  {
    term: 'IPsec',
    acronym: 'IPsec',
    definition:
      'Internet Protocol Security, a protocol suite for encrypting and authenticating IP traffic. Used in VPNs and site-to-site connections.',
    technicalNote:
      'PQC integration via IKEv2 multiple key exchange (RFC 9370) adds ML-KEM alongside classical DH.',
    relatedModule: '/migrate',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'IKEv2',
    acronym: 'IKEv2',
    definition:
      'Internet Key Exchange version 2, the protocol used to establish security associations in IPsec VPNs. PQC migration adds ML-KEM key exchange.',
    relatedModule: '/library?ref=IETF RFC 9370',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'EMV',
    acronym: 'EMV',
    definition:
      'Europay/Mastercard/Visa, the global standard for chip-based payment card authentication. Uses RSA and ECC signatures that are quantum-vulnerable.',
    technicalNote:
      'Over 14 billion EMV cards are in circulation globally. Offline authentication relies on RSA/ECC signatures vulnerable to quantum forgery.',
    relatedModule: '/learn/emv-payment-pqc',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'S/MIME',
    acronym: 'S/MIME',
    definition:
      'Secure/Multipurpose Internet Mail Extensions, a standard for email encryption and digital signing. PQC integration via ML-KEM and ML-DSA.',
    relatedModule: '/library?ref=RFC 9882',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'CMS',
    acronym: 'CMS',
    definition:
      'Cryptographic Message Syntax, a standard for digitally signed, encrypted, or authenticated data. Foundation for S/MIME and code signing.',
    technicalNote:
      'Multiple IETF RFCs define PQC integration: RFC 9629 (KEM in CMS), RFC 9882 (ML-DSA in CMS), RFC 9814 (SLH-DSA in CMS).',
    relatedModule: '/library?ref=RFC 9629',
    complexity: 'advanced',
    category: 'protocol',
  },
  {
    term: 'OpenPGP',
    definition:
      'An open standard for email encryption and signing based on PGP. PQC integration adds composite ML-KEM+ECC encryption and ML-DSA+ECC signatures.',
    relatedModule: '/library?ref=RFC 9580',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'Signal Protocol',
    definition:
      'The encryption protocol used by Signal, WhatsApp, and other messengers. Updated with PQXDH to add ML-KEM-1024 for post-quantum security.',
    relatedModule: '/migrate',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'PQXDH',
    acronym: 'PQXDH',
    definition:
      'Post-Quantum Extended Diffie-Hellman, the post-quantum key agreement protocol used by Signal (and optionally WhatsApp). Combines X25519 with ML-KEM-1024 to establish session keys.',
    technicalNote:
      'Deployed by Signal in September 2023. The shared secret is derived from both the classical X25519 exchange and an ML-KEM-1024 encapsulation, ensuring security if either algorithm is broken.',
    relatedModule: '/migrate',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'FIDO2 / WebAuthn',
    definition:
      'Web authentication standards enabling passwordless login using public-key cryptography. Currently relies on quantum-vulnerable ECDSA/EdDSA.',
    relatedModule: '/migrate',
    complexity: 'intermediate',
    category: 'protocol',
  },

  // === Standards ===
  {
    term: 'RFC 8446',
    definition:
      'The IETF standard defining TLS version 1.3, published August 2018. TLS 1.3 removed legacy cipher suites, mandated forward secrecy, and reduced the handshake to 1 round-trip.',
    technicalNote:
      'TLS 1.3 is the foundation for PQC key exchange integration. RFC 8446 defines the "key_share" extension that hybrid PQC groups (e.g., X25519MLKEM768) plug into without protocol changes.',
    relatedModule: '/learn/tls-basics',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'FIPS 203',
    definition:
      'The NIST standard defining ML-KEM (Module-Lattice-Based Key Encapsulation Mechanism), published August 2024.',
    relatedModule: '/library?ref=FIPS 203',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'FIPS 204',
    definition:
      'The NIST standard defining ML-DSA (Module-Lattice-Based Digital Signature Algorithm), published August 2024.',
    relatedModule: '/library?ref=FIPS 204',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'FIPS 205',
    definition:
      'The NIST standard defining SLH-DSA (Stateless Hash-Based Digital Signature Algorithm), published August 2024.',
    relatedModule: '/library?ref=FIPS 205',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'FIPS 140-3',
    definition:
      'The U.S. government standard for validating cryptographic modules. Hardware and software must pass FIPS 140-3 testing to be used in federal systems.',
    relatedModule: '/compliance',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'CNSA 2.0',
    definition:
      "NSA's Commercial National Security Algorithm Suite 2.0, mandating PQC adoption timelines for national security systems.",
    relatedModule: '/timeline',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'Common Criteria',
    acronym: 'CC',
    definition:
      'An international standard (ISO/IEC 15408) for evaluating the security properties of IT products, used globally for government procurement.',
    technicalNote:
      'The Common Criteria Recognition Arrangement (CCRA) is a 31-nation mutual recognition agreement: national Certification Bodies (e.g., BSI for Germany, ANSSI for France, NIAP for the US) issue CC certificates that are accepted across all member states. The EUCC is the EU-specific adaptation managed by ENISA.',
    relatedModule: '/learn/standards-bodies',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'CCRA',
    acronym: 'CCRA',
    definition:
      'Common Criteria Recognition Arrangement — a 31-nation mutual recognition agreement under which national Certification Bodies issue and accept IT product security certificates based on ISO/IEC 15408 (Common Criteria).',
    technicalNote:
      'CCRA member nations include the US (NIAP), UK (NCSC), Germany (BSI), France (ANSSI), Japan, South Korea, Australia, and Canada. A CC certificate issued by any national CA is valid across all member states. The EU operates the EUCC as a stricter harmonized adaptation managed by ENISA.',
    relatedModule: '/learn/standards-bodies',
    complexity: 'intermediate',
    category: 'organization',
  },
  {
    term: 'EUCC',
    acronym: 'EUCC',
    definition:
      "EU Cybersecurity Certification Scheme — the European Union's harmonized product security certification scheme based on Common Criteria, managed by ENISA under the EU Cybersecurity Act (2019).",
    technicalNote:
      'EUCC certificates are valid across all 27 EU member states, eliminating the need for per-country certification. ENISA maintains the Agreed Cryptographic Mechanisms (ACM) list specifying which PQC algorithms are approved for EUCC-certified products. National Certification Authorities (e.g., BSI, ANSSI) issue EUCC certificates.',
    relatedModule: '/learn/standards-bodies',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'eIDAS 2.0',
    definition:
      'The EU regulation establishing a framework for electronic identification and trust services, including the European Digital Identity Wallet.',
    relatedModule: '/learn/digital-id',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'NIS2 Directive',
    definition:
      'The EU Network and Information Security Directive 2 (Directive 2022/2555), requiring operators of essential services and digital service providers to implement strong cryptographic controls. Transposed into national law across EU member states by October 2024.',
    technicalNote:
      'NIS2 mandates risk-based security measures including encryption and cryptographic key management. ENISA guidance links NIS2 obligations directly to PQC migration timelines, making it a key compliance driver for EU organisations.',
    relatedModule: '/compliance',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'ACVP',
    acronym: 'ACVP',
    definition:
      'Automated Cryptographic Validation Protocol, used by NIST to test that cryptographic implementations produce correct results.',
    relatedModule: '/compliance',
    complexity: 'advanced',
    category: 'standard',
  },
  {
    term: 'PKCS#12',
    definition:
      'A file format for storing a private key together with its X.509 certificate, commonly used for importing/exporting credentials.',
    relatedModule: '/openssl',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'FIPS 206',
    definition:
      'The NIST standard defining FN-DSA (FFT over NTRU-Lattice-Based Digital Signature Algorithm, formerly Falcon), published October 2024.',
    relatedModule: '/library?ref=FIPS 206',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'FIPS 186-5',
    definition:
      'The NIST Digital Signature Standard defining RSA, ECDSA, and EdDSA. Being deprecated in favor of PQC signature algorithms per NIST IR 8547.',
    relatedModule: '/library?ref=FIPS 186-5',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'NIST IR 8547',
    definition:
      'NIST Internal Report establishing the PQC transition timeline: deprecation of classical asymmetric crypto by 2030, disallowment by 2035.',
    technicalNote:
      'Covers RSA, ECDSA, ECDH, EdDSA, DH, and DSA. The most authoritative U.S. government PQC migration deadline document.',
    relatedModule: '/library?ref=NIST IR 8547',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'NIST SP 800-131A',
    definition:
      'NIST Special Publication providing guidance on transitioning the use of cryptographic algorithms and key lengths. Defines which algorithms are approved, deprecated, or disallowed for federal use.',
    technicalNote:
      'Revision 3 (2019) deprecated SHA-1 and 2TDEA. A future revision is expected to align with NIST IR 8547 timelines, formally disallowing RSA, ECDSA, and DH after 2035.',
    relatedModule: '/library?ref=NIST-SP-800-131A-Rev3',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'NIST SP 800-208',
    definition:
      'NIST recommendation for stateful hash-based signature schemes LMS and XMSS, used for firmware signing and secure boot.',
    relatedModule: '/library?ref=NIST SP 800-208',
    complexity: 'advanced',
    category: 'standard',
  },
  {
    term: 'RFC 9629',
    definition:
      'IETF standard defining how to use Key Encapsulation Mechanisms (KEMs) in the Cryptographic Message Syntax (CMS) for encrypted messaging.',
    relatedModule: '/library?ref=RFC 9629',
    complexity: 'advanced',
    category: 'standard',
  },
  {
    term: 'PCI DSS',
    acronym: 'PCI DSS',
    definition:
      'Payment Card Industry Data Security Standard, requiring strong cryptography for cardholder data protection. Quantum threatens its RSA/ECC foundations.',
    relatedModule: '/threats',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'HIPAA',
    acronym: 'HIPAA',
    definition:
      'Health Insurance Portability and Accountability Act, the U.S. law requiring encryption of protected health information. Patient data faces HNDL risk.',
    relatedModule: '/threats',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'CMVP',
    acronym: 'CMVP',
    definition:
      'Cryptographic Module Validation Program, the NIST/CSE program that tests and certifies cryptographic modules for government use under FIPS 140-3.',
    relatedModule: '/compliance',
    complexity: 'advanced',
    category: 'standard',
  },
  {
    term: 'IEC 62443',
    definition:
      'International standard series for industrial automation and control systems (IACS) cybersecurity. Critical for IoT and energy sector PQC migration.',
    relatedModule: '/threats',
    complexity: 'advanced',
    category: 'standard',
  },

  // === Organizations ===
  {
    term: 'NIST',
    acronym: 'NIST',
    definition:
      'National Institute of Standards and Technology, the U.S. agency leading PQC standardization through its Post-Quantum Cryptography project.',
    relatedModule: '/timeline',
    complexity: 'beginner',
    category: 'organization',
  },
  {
    term: 'ETSI',
    acronym: 'ETSI',
    definition:
      'European Telecommunications Standards Institute, producing PQC migration guides and standards for European industry.',
    relatedModule: '/timeline',
    complexity: 'intermediate',
    category: 'organization',
  },
  {
    term: 'IETF',
    acronym: 'IETF',
    definition:
      'Internet Engineering Task Force, developing PQC integration into internet protocols like TLS, SSH, and IKEv2.',
    relatedModule: '/library',
    complexity: 'intermediate',
    category: 'organization',
  },
  {
    term: 'ANSSI',
    acronym: 'ANSSI',
    definition:
      'French National Cybersecurity Agency, publishing PQC recommendations and cryptographic certifications for France and Europe.',
    relatedModule: '/compliance',
    complexity: 'intermediate',
    category: 'organization',
  },
  {
    term: 'BSI',
    acronym: 'BSI',
    definition:
      'German Federal Office for Information Security, providing PQC migration guidelines and recommendations for German government systems.',
    relatedModule: '/timeline',
    complexity: 'intermediate',
    category: 'organization',
  },
  {
    term: '3GPP',
    acronym: '3GPP',
    definition:
      'The partnership project that develops specifications for mobile telecommunications including 5G security architecture.',
    relatedModule: '/learn/5g-security',
    complexity: 'intermediate',
    category: 'organization',
  },
  {
    term: 'NSA',
    acronym: 'NSA',
    definition:
      'National Security Agency, the U.S. intelligence agency that publishes CNSA 2.0 and mandates PQC adoption timelines for national security systems.',
    relatedModule: '/timeline',
    complexity: 'beginner',
    category: 'organization',
  },
  {
    term: 'CISA',
    acronym: 'CISA',
    definition:
      'Cybersecurity and Infrastructure Security Agency, the U.S. agency coordinating PQC migration for critical infrastructure and publishing product category lists.',
    relatedModule: '/threats',
    complexity: 'beginner',
    category: 'organization',
  },
  {
    term: 'ENISA',
    acronym: 'ENISA',
    definition:
      'European Union Agency for Cybersecurity, publishing PQC guidelines and coordinating quantum-safe transitions across EU member states.',
    relatedModule: '/library',
    complexity: 'intermediate',
    category: 'organization',
  },
  {
    term: 'GSMA',
    acronym: 'GSMA',
    definition:
      'Global System for Mobile Communications Association, leading the Post-Quantum Telco Network Taskforce for PQC integration in mobile networks.',
    relatedModule: '/threats',
    complexity: 'intermediate',
    category: 'organization',
  },
  {
    term: 'CA/Browser Forum',
    definition:
      'An industry body of Certificate Authorities and browser vendors that governs Web PKI certificate standards, including PQC certificate adoption rules.',
    relatedModule: '/library',
    complexity: 'intermediate',
    category: 'organization',
  },
  {
    term: 'NCSC',
    acronym: 'NCSC',
    definition:
      'UK National Cyber Security Centre, publishing PQC migration guidance and a 2035 deadline for full transition to quantum-safe cryptography.',
    relatedModule: '/library',
    complexity: 'intermediate',
    category: 'organization',
  },
  {
    term: 'OSCCA',
    acronym: 'OSCCA',
    definition:
      "China's Office of State Commercial Cryptography Administration, managing China's independent cryptographic standards including SM2 and PQC competitions.",
    relatedModule: '/library',
    complexity: 'advanced',
    category: 'organization',
  },
  {
    term: 'ISO/IEC JTC 1',
    definition:
      'Joint Technical Committee 1 of ISO and IEC, the international standards body for information technology including cryptographic standards (SC 27).',
    relatedModule: '/library',
    complexity: 'advanced',
    category: 'organization',
  },

  // === Concepts (Intermediate/Advanced) ===
  {
    term: 'Lattice-Based Cryptography',
    definition:
      'A family of PQC algorithms based on the hardness of problems involving mathematical lattices. The basis for ML-KEM and ML-DSA.',
    technicalNote:
      'Key problems: Learning With Errors (LWE), Module-LWE, Ring-LWE. Offer good performance and key sizes.',
    relatedModule: '/algorithms',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Hash-Based Signatures',
    definition:
      'Digital signature schemes whose security relies only on the properties of hash functions. Very conservative security but can be stateful.',
    technicalNote:
      'Stateful: LMS/XMSS (must track which keys are used). Stateless: SLH-DSA/SPHINCS+ (larger signatures).',
    relatedModule: '/learn/stateful-signatures',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Code-Based Cryptography',
    definition:
      'PQC algorithms based on the hardness of decoding random linear error-correcting codes. Used by Classic McEliece and HQC.',
    relatedModule: '/algorithms',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Security Level',
    definition:
      'NIST defines 5 security levels for PQC algorithms. Level 1 ≈ AES-128, Level 3 ≈ AES-192, Level 5 ≈ AES-256.',
    technicalNote:
      'Level 1: comparable to breaking AES-128. Level 5: comparable to breaking AES-256. Most deployments use Level 3.',
    relatedModule: '/algorithms',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Key Exchange',
    definition:
      'The process by which two parties establish a shared secret key over an insecure channel. In PQC, replaced by Key Encapsulation Mechanisms.',
    relatedModule: '/learn/tls-basics',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Quantum Advantage',
    definition:
      'The point at which a quantum computer can solve a specific problem faster than any classical computer. Also called "quantum supremacy."',
    relatedModule: '/learn/quantum-threats',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'WebAssembly',
    acronym: 'WASM',
    definition:
      'A binary instruction format that enables near-native performance in web browsers. Used by PQC Today to run OpenSSL and liboqs in-browser.',
    relatedModule: '/openssl',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'HSM',
    acronym: 'HSM',
    definition:
      'Hardware Security Module, a dedicated physical device for managing and protecting cryptographic keys. Must be updated for PQC support.',
    relatedModule: '/threats',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Entanglement',
    definition:
      'A quantum phenomenon where two qubits become correlated so measuring one instantly determines the state of the other, regardless of distance.',
    relatedModule: '/learn/pqc-101',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'HD Wallet',
    acronym: 'HD',
    definition:
      'Hierarchical Deterministic Wallet, a cryptocurrency wallet that generates all key pairs from a single seed phrase using BIP32/39/44 standards.',
    relatedModule: '/learn/digital-assets',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'BIP39',
    definition:
      'Bitcoin Improvement Proposal 39 defines mnemonic seed phrases (12 or 24 words) used to back up and restore cryptocurrency wallets.',
    relatedModule: '/learn/digital-assets',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'EUDI Wallet',
    definition:
      'European Union Digital Identity Wallet, a mobile wallet for storing and presenting digital credentials under the eIDAS 2.0 framework.',
    relatedModule: '/learn/digital-id',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Qualified Electronic Signature',
    acronym: 'QES',
    definition:
      'A digital signature with the legal equivalence of a handwritten signature under EU law, requiring a qualified certificate and a secure creation device.',
    relatedModule: '/learn/digital-id',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'MILENAGE',
    definition:
      'The set of cryptographic functions (f1–f5) used in 5G authentication. Based on AES and generates authentication vectors.',
    relatedModule: '/learn/5g-security',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Encapsulation / Decapsulation',
    definition:
      'The two operations of a Key Encapsulation Mechanism. Encapsulation creates a shared secret using a public key; decapsulation recovers it using the private key.',
    technicalNote:
      'Unlike Diffie-Hellman key exchange, KEMs are asymmetric: the sender encapsulates, the receiver decapsulates. This is the core operation of ML-KEM.',
    relatedModule: '/playground',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Learning With Errors',
    acronym: 'LWE',
    definition:
      'A mathematical problem believed to be hard for quantum computers, forming the security foundation of ML-KEM, ML-DSA, and FrodoKEM.',
    technicalNote:
      'Variants include Ring-LWE (structured, faster) and Module-LWE (used in ML-KEM/ML-DSA, balancing security and performance).',
    relatedModule: '/algorithms',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'NTRU Lattice',
    acronym: 'NTRU',
    definition:
      'A lattice-based cryptographic family using polynomial rings, providing the mathematical basis for FN-DSA (Falcon). One of the earliest PQC proposals (1996).',
    relatedModule: '/algorithms',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Hybrid Key Exchange',
    definition:
      'Combining a classical key exchange (e.g., X25519) with a PQC KEM (e.g., ML-KEM-768) in a single handshake, ensuring security even if one algorithm is broken.',
    technicalNote:
      'Deployed today as X25519MLKEM768 in Chrome, Firefox, and major cloud providers. IETF draft-ietf-tls-ecdhe-mlkem defines the TLS 1.3 integration.',
    relatedModule: '/algorithms',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Composite Certificate',
    definition:
      'An X.509 certificate encoding both a classical and a PQC key/signature under a single composite OID. Both signatures must verify. Requires all relying parties to support the composite OID — legacy-incompatible.',
    technicalNote:
      'Defined in IETF drafts: composite ML-KEM (draft-ietf-lamps-pq-composite-kem) and composite ML-DSA (draft-ietf-lamps-pq-composite-sigs). OpenSSL 3.6 does not yet support composite OIDs natively.',
    relatedModule: '/learn/hybrid-crypto',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Related Certificate',
    acronym: 'RFC 9763',
    definition:
      'A binding mechanism (RFC 9763) that links two independent X.509 certificates — one classical, one PQC — to the same end entity via a SHA-256 hash. Also known as the NSA "catalyst" approach. Legacy systems only process the classical cert; PQC-aware verifiers check the binding.',
    technicalNote:
      'The RelatedCertificate extension (OID 1.3.6.1.5.5.7.1.35) carries a hash of the related cert and a pointer. Each certificate is individually valid, enabling backward compatibility — unlike composite certificates which require composite OID support.',
    relatedModule: '/learn/hybrid-crypto',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Chameleon Certificate',
    definition:
      'A single X.509 certificate that encodes a classical "delta" variant inside a DeltaCertificateDescriptor extension (OID 2.16.840.1.114027.80.6.1). PQC-aware verifiers reconstruct the classical certificate from the delta; legacy systems see a standard classical cert.',
    technicalNote:
      'Defined in draft-bonnell-lamps-chameleon-certs (DigiCert, Entrust). More bandwidth-efficient than related certs (RFC 9763) because only one certificate is transmitted. However, as a draft standard, adoption is still emerging.',
    relatedModule: '/learn/hybrid-crypto',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'TBSCertificate',
    definition:
      '"To Be Signed" certificate — the core unsigned structure inside an X.509 certificate containing version, serial number, issuer/subject DNs, validity period, SubjectPublicKeyInfo, and extensions. The CA signs this structure to produce the final certificate.',
    technicalNote:
      'In DER encoding, TBSCertificate is a SEQUENCE. The outer Certificate SEQUENCE wraps TBSCertificate + signatureAlgorithm + signatureValue. PQC algorithms like ML-DSA and SLH-DSA are specified in the outer signatureAlgorithm AlgorithmIdentifier.',
    relatedModule: '/learn/hybrid-crypto',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'AlgorithmIdentifier',
    definition:
      'An ASN.1 SEQUENCE containing an OID that identifies a cryptographic algorithm, plus optional parameters. Appears in X.509 certificates to specify signature algorithms (signatureAlgorithm field) and public key algorithms (SubjectPublicKeyInfo.algorithm).',
    technicalNote:
      'PQC algorithms defined in FIPS 203/204/205 use absent parameters (no NULL) per their respective X.509 profile RFCs (RFC 9881, RFC 9909). The OID for ML-DSA-65 is 2.16.840.1.101.3.4.3.18; SLH-DSA-SHA2-128s is 2.16.840.1.101.3.4.3.20.',
    relatedModule: '/learn/hybrid-crypto',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Hybrid Certificate',
    definition:
      'An X.509 certificate using both classical and PQC algorithms during the transition period, maintaining interoperability with legacy systems.',
    relatedModule: '/migrate',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'SCADA',
    acronym: 'SCADA',
    definition:
      'Supervisory Control and Data Acquisition, industrial control systems used in power grids, water treatment, and manufacturing. Quantum-vulnerable via legacy crypto.',
    relatedModule: '/learn/iot-ot-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'V2X Communication',
    acronym: 'V2X',
    definition:
      'Vehicle-to-Everything communication, enabling cars to exchange safety data with infrastructure and other vehicles. Uses ECDSA P-256 certificates that are quantum-vulnerable.',
    relatedModule: '/learn/automotive-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'CBDC',
    acronym: 'CBDC',
    definition:
      'Central Bank Digital Currency, a digital form of fiat money issued by central banks. Requires quantum-safe cryptography for long-term trust.',
    relatedModule: '/threats',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'CBOM',
    acronym: 'CBOM',
    definition:
      'Cryptographic Bill of Materials, a comprehensive inventory of all cryptographic algorithms, keys, and certificates used in an organization or product.',
    technicalNote:
      'Essential first step in PQC migration. Enables organizations to identify quantum-vulnerable crypto and prioritize replacements.',
    relatedModule: '/migrate',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'DRM',
    acronym: 'DRM',
    definition:
      'Digital Rights Management, technology protecting copyrighted content through encryption. Systems like Widevine, PlayReady, and FairPlay face quantum threats to their key hierarchies.',
    relatedModule: '/threats',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'KMS',
    acronym: 'KMS',
    definition:
      'Key Management System, software for generating, storing, rotating, and auditing cryptographic keys. Must be upgraded to support PQC key sizes and algorithms.',
    relatedModule: '/migrate',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'TPM',
    acronym: 'TPM',
    definition:
      'Trusted Platform Module, a hardware chip providing secure key storage, platform integrity measurement, and cryptographic operations. PQC support being added via TCG specifications.',
    relatedModule: '/migrate',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Code Signing',
    definition:
      'Digitally signing software executables and scripts to verify their authenticity and integrity. PQC migration replaces RSA/ECDSA signatures with ML-DSA or SLH-DSA.',
    relatedModule: '/learn/code-signing',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Secure Boot',
    definition:
      'A hardware-enforced chain of trust that verifies each component in the boot process is signed by a trusted authority. Requires PQC-capable signature verification.',
    relatedModule: '/learn/code-signing',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'UEFI',
    acronym: 'UEFI',
    definition:
      'Unified Extensible Firmware Interface — the modern firmware interface between hardware and OS. UEFI Secure Boot enforces signature verification on bootloaders and drivers before execution.',
    relatedModule: '/learn/code-signing',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'QKD',
    acronym: 'QKD',
    definition:
      'Quantum Key Distribution, a method of distributing encryption keys using quantum physics rather than mathematical hardness. Distinct from PQC and requires specialized hardware.',
    technicalNote:
      'QKD (e.g., BB84 protocol) uses photons to detect eavesdropping. Unlike PQC, it requires dedicated fiber or satellite links and cannot run on standard networks.',
    relatedModule: '/learn/qkd',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'BB84',
    definition:
      'The first quantum key distribution protocol, proposed by Bennett and Brassard in 1984. Uses four quantum states in two conjugate bases to establish a shared secret key.',
    technicalNote:
      'Alice encodes random bits in rectilinear (+) or diagonal (x) bases. Bob measures in a randomly chosen basis. After basis reconciliation over a classical channel, only matching-basis bits form the sifted key.',
    relatedModule: '/learn/qkd',
    complexity: 'advanced',
    category: 'protocol',
  },
  {
    term: 'QBER',
    acronym: 'QBER',
    definition:
      'Quantum Bit Error Rate, the fraction of sifted key bits where Alice and Bob disagree despite using the same measurement basis. A QBER above ~11% indicates eavesdropping.',
    technicalNote:
      'In BB84, an eavesdropper measuring in the wrong basis introduces a 25% error rate on intercepted qubits. The theoretical QBER threshold for secure key generation is approximately 11%.',
    relatedModule: '/learn/qkd',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Sifted Key',
    definition:
      'The subset of raw key bits where both parties used the same measurement basis during QKD. Typically about half the transmitted bits survive sifting.',
    relatedModule: '/learn/qkd',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Privacy Amplification',
    definition:
      'A post-processing step in QKD that uses universal hash functions to distill a shorter, provably secret key from a partially compromised key by removing any information an eavesdropper may have obtained.',
    technicalNote:
      "The output key length depends on the estimated information leakage. Uses hash functions (e.g., SHA-256) to compress the corrected key, reducing Eve's knowledge to negligible levels.",
    relatedModule: '/learn/qkd',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'No-Cloning Theorem',
    definition:
      'A fundamental quantum mechanics result proving it is impossible to create an identical copy of an unknown quantum state, providing the theoretical basis for QKD security.',
    relatedModule: '/learn/qkd',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Trusted Node',
    definition:
      'A physically secured relay point in a QKD network where keys are decrypted and re-encrypted to extend range beyond single-link limits (typically ~100 km for fiber).',
    technicalNote:
      'Trusted nodes are a practical necessity but a security concern: compromising any node reveals all keys routed through it. This is a major architectural limitation of current QKD networks.',
    relatedModule: '/learn/qkd',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'EuroQCI',
    acronym: 'EuroQCI',
    definition:
      'The European Quantum Communication Infrastructure initiative, a pan-EU program to deploy a quantum communication network across all 27 member states combining terrestrial fiber and satellite links.',
    relatedModule: '/learn/qkd',
    complexity: 'intermediate',
    category: 'organization',
  },
  {
    term: 'Cryptographic Inventory',
    definition:
      'A comprehensive catalog of all cryptographic algorithms, protocols, keys, and certificates in an organization, essential for planning PQC migration.',
    relatedModule: '/learn/migration-program',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'OTA Updates',
    acronym: 'OTA',
    definition:
      'Over-the-Air updates, the process of remotely delivering firmware or software to devices. Signature verification must be quantum-safe to prevent forgery.',
    relatedModule: '/threats',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'EHR',
    acronym: 'EHR',
    definition:
      'Electronic Health Records, digital patient medical records that require long-term confidentiality. Prime targets for Harvest Now, Decrypt Later attacks.',
    relatedModule: '/threats',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'SBOM',
    acronym: 'SBOM',
    definition:
      'Software Bill of Materials, a formal inventory of all components in a software product. Increasingly required alongside CBOM for security compliance.',
    relatedModule: '/learn/vendor-risk',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'ADS-B',
    acronym: 'ADS-B',
    definition:
      'Automatic Dependent Surveillance-Broadcast, the primary aircraft surveillance technology. Currently lacks cryptographic authentication, making it a quantum-era concern.',
    relatedModule: '/threats',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'TEE',
    acronym: 'TEE',
    definition:
      'Trusted Execution Environment, an isolated processing environment on a processor that protects code and data. Must be updated for PQC algorithm support.',
    relatedModule: '/learn/confidential-computing',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'DUKPT',
    acronym: 'DUKPT',
    definition:
      'Derived Unique Key Per Transaction, a key management scheme for payment terminals that derives a unique symmetric encryption key for each transaction from a Base Derivation Key.',
    technicalNote:
      'The symmetric DUKPT derivation chain is quantum-safe. The quantum vulnerability is at the Key Injection Facility where RSA-2048 key transport wraps the BDK. Compromising the BDK exposes all past and future transaction keys.',
    relatedModule: '/learn/emv-payment-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Keccak-256',
    definition:
      'The hash function used by Ethereum, based on the SHA-3 algorithm family. Produces 256-bit digests.',
    relatedModule: '/learn/digital-assets',
    complexity: 'intermediate',
    category: 'algorithm',
  },
  {
    term: 'secp256k1',
    definition:
      'The elliptic curve used by Bitcoin for digital signatures. Quantum-vulnerable and a key concern for cryptocurrency PQC migration.',
    relatedModule: '/learn/digital-assets',
    complexity: 'intermediate',
    category: 'algorithm',
  },

  // ======================================================================
  // NEW TERMS — Gap-fill from site-wide audit (Feb 2026)
  // ======================================================================

  // === Algorithms (pre-standardization names & additional) ===
  {
    term: 'Kyber',
    definition:
      'The original name (CRYSTALS-Kyber) for the lattice-based KEM standardized by NIST as ML-KEM in FIPS 203. Often still referenced in older documents and libraries.',
    technicalNote:
      'Kyber was selected from the NIST PQC competition Round 3. It was renamed to ML-KEM for the final standard.',
    relatedModule: '/algorithms',
    complexity: 'beginner',
    category: 'algorithm',
  },
  {
    term: 'Dilithium',
    definition:
      'The original name (CRYSTALS-Dilithium) for the lattice-based signature scheme standardized by NIST as ML-DSA in FIPS 204.',
    technicalNote:
      'Dilithium was selected from the NIST PQC competition Round 3. It was renamed to ML-DSA for the final standard.',
    relatedModule: '/algorithms',
    complexity: 'beginner',
    category: 'algorithm',
  },
  {
    term: 'Falcon',
    definition:
      'The original name for the NTRU-lattice-based signature scheme standardized by NIST as FN-DSA in the draft FIPS 206. Known for compact signatures.',
    technicalNote:
      'Falcon uses fast Fourier transforms over NTRU lattices. Renamed to FN-DSA for the final standard.',
    relatedModule: '/algorithms',
    complexity: 'intermediate',
    category: 'algorithm',
  },
  {
    term: 'SPHINCS+',
    definition:
      'The original name for the stateless hash-based signature scheme standardized by NIST as SLH-DSA in FIPS 205. Very conservative security assumptions.',
    technicalNote:
      'SPHINCS+ relies only on the security of its underlying hash function, making it a strong fallback if lattice assumptions are broken.',
    relatedModule: '/algorithms',
    complexity: 'intermediate',
    category: 'algorithm',
  },
  {
    term: 'BIKE',
    acronym: 'BIKE',
    definition:
      'Bit Flipping Key Encapsulation, a code-based KEM that was a NIST PQC Round 4 candidate. Uses quasi-cyclic moderate-density parity-check codes.',
    relatedModule: '/algorithms',
    complexity: 'advanced',
    category: 'algorithm',
  },
  {
    term: 'SHA-3',
    definition:
      'The third generation Secure Hash Algorithm standard (FIPS 202), based on the Keccak sponge construction. Includes SHA3-256, SHA3-512, and SHAKE variants.',
    technicalNote:
      'SHA-3 provides an independent alternative to SHA-2 with different mathematical foundations. Used in SLH-DSA parameter sets.',
    relatedModule: '/algorithms',
    complexity: 'intermediate',
    category: 'algorithm',
  },
  {
    term: 'SHAKE',
    definition:
      'Extendable-Output Functions from the SHA-3 family (SHAKE128, SHAKE256). Unlike fixed-length hashes, SHAKE can produce output of any desired length.',
    technicalNote:
      'Used in SLH-DSA-SHAKE parameter sets and as a key derivation mechanism in several PQC algorithms.',
    relatedModule: '/algorithms',
    complexity: 'intermediate',
    category: 'algorithm',
  },
  {
    term: 'EdDSA',
    definition:
      'Edwards-curve Digital Signature Algorithm, the family of signature schemes including Ed25519 and Ed448. Offers high performance and resistance to side-channel attacks.',
    technicalNote:
      "EdDSA is deterministic (no random nonce), reducing implementation risks. Quantum-vulnerable via Shor's algorithm.",
    relatedModule: '/algorithms',
    complexity: 'intermediate',
    category: 'algorithm',
  },
  {
    term: 'ChaCha20-Poly1305',
    definition:
      'A modern authenticated encryption with associated data (AEAD) cipher combining the ChaCha20 stream cipher with the Poly1305 authenticator. Quantum-safe at current key sizes.',
    technicalNote:
      'Widely used in TLS 1.3, WireGuard, and SSH as an alternative to AES-GCM. Efficient in software without hardware AES acceleration.',
    relatedModule: '/learn/tls-basics',
    complexity: 'intermediate',
    category: 'algorithm',
  },
  {
    term: 'Triple-DES',
    acronym: '3DES',
    definition:
      'A legacy symmetric cipher that applies DES three times to each block. Being phased out in favor of AES due to its small 64-bit block size.',
    technicalNote:
      'Still found in legacy payment systems (DUKPT) and some government systems. NIST deprecated 3DES after December 31, 2023.',
    relatedModule: '/learn/pqc-101',
    complexity: 'intermediate',
    category: 'algorithm',
  },
  {
    term: 'P-256',
    definition:
      'A NIST standard elliptic curve (also called secp256r1 or prime256v1) widely used in TLS, FIDO2, and government systems. Quantum-vulnerable.',
    technicalNote:
      'Part of the Suite B / CNSA 1.0 algorithms. Combined with ML-KEM-768 in the SecP256r1MLKEM768 hybrid key exchange.',
    relatedModule: '/algorithms',
    complexity: 'intermediate',
    category: 'algorithm',
  },
  {
    term: 'P-384',
    definition:
      'A NIST standard elliptic curve (secp384r1) offering 192-bit security. Used in high-security TLS configurations and government systems. Quantum-vulnerable.',
    technicalNote:
      'Combined with ML-KEM-1024 in the SecP384r1MLKEM1024 hybrid key exchange for NIST Level 5 security.',
    relatedModule: '/algorithms',
    complexity: 'intermediate',
    category: 'algorithm',
  },
  {
    term: 'Ascon',
    definition:
      'A lightweight authenticated encryption cipher selected by NIST as the standard for constrained environments (IoT, embedded devices). Very low resource requirements.',
    relatedModule: '/learn/iot-ot-pqc',
    complexity: 'advanced',
    category: 'algorithm',
  },
  {
    term: 'RIPEMD-160',
    definition:
      'A 160-bit cryptographic hash function used in Bitcoin address generation (combined with SHA-256). Quantum-safe at current output sizes.',
    relatedModule: '/learn/digital-assets',
    complexity: 'advanced',
    category: 'algorithm',
  },
  {
    term: 'SM2',
    definition:
      "China's national standard elliptic curve public-key algorithm for digital signatures and key exchange, managed by OSCCA. Quantum-vulnerable.",
    technicalNote:
      'Combined with ML-KEM-768 in the curveSM2MLKEM768 hybrid key exchange for Chinese PQC migration.',
    relatedModule: '/library?ref=China OSCCA GM/T 0108-2021',
    complexity: 'advanced',
    category: 'algorithm',
  },
  {
    term: 'PBKDF2',
    definition:
      'Password-Based Key Derivation Function 2, used to derive cryptographic keys from passwords. Applies a pseudorandom function (typically HMAC-SHA) iteratively.',
    technicalNote:
      'Used in BIP39 to derive seed bytes from mnemonic phrases (2048 iterations of HMAC-SHA512).',
    relatedModule: '/learn/digital-assets',
    complexity: 'intermediate',
    category: 'algorithm',
  },

  // === Protocols (additional) ===
  {
    term: 'QUIC',
    definition:
      'A modern transport protocol built on UDP, providing encrypted connections with lower latency than TCP+TLS. The foundation of HTTP/3.',
    technicalNote:
      'QUIC integrates TLS 1.3 directly, so PQC migration via hybrid key exchange (X25519MLKEM768) applies to QUIC connections as well.',
    relatedModule: '/library',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'WireGuard',
    definition:
      'A modern, high-performance VPN protocol using state-of-the-art cryptography (ChaCha20, Curve25519). PQC integration is being developed.',
    technicalNote:
      'PQC migration involves adding ML-KEM hybrid key exchange to the Noise protocol framework used by WireGuard.',
    relatedModule: '/migrate',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'DTLS',
    acronym: 'DTLS',
    definition:
      'Datagram Transport Layer Security, the UDP equivalent of TLS. Used in IoT (CoAP), WebRTC, and VPN protocols. DTLS 1.3 adds PQC support.',
    relatedModule: '/learn/iot-ot-pqc',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'mTLS',
    definition:
      'Mutual TLS, a TLS mode where both client and server present certificates for authentication. Common in microservices, zero-trust architectures, and API security.',
    technicalNote:
      'PQC migration for mTLS requires updating both client and server certificates to PQC or hybrid algorithms.',
    relatedModule: '/learn/tls-basics',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'OCSP',
    acronym: 'OCSP',
    definition:
      'Online Certificate Status Protocol, used to check whether an X.509 certificate has been revoked. An alternative to Certificate Revocation Lists (CRLs).',
    relatedModule: '/learn/pki-workshop',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'DNSSEC',
    acronym: 'DNSSEC',
    definition:
      'DNS Security Extensions, a suite of protocols that add cryptographic authentication to DNS responses. Uses digital signatures to prevent DNS spoofing.',
    technicalNote:
      'PQC migration is challenging due to DNS packet size limits. Larger PQC signatures may require protocol changes or new transport mechanisms.',
    relatedModule: '/migrate',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'ACME',
    acronym: 'ACME',
    definition:
      "Automatic Certificate Management Environment, the protocol used by Let's Encrypt and other CAs to automate certificate issuance and renewal.",
    technicalNote:
      'ACME will need updates to support PQC certificate types as the Web PKI transitions to quantum-safe algorithms.',
    relatedModule: '/library',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'PQ3',
    definition:
      "Apple's post-quantum secure messaging protocol for iMessage, providing Level 3 security with ML-KEM key exchange and periodic re-keying.",
    technicalNote:
      'PQ3 uses a ratcheting design that regularly re-establishes quantum-safe shared secrets, protecting past and future messages.',
    relatedModule: '/migrate',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'MACsec',
    acronym: 'MACsec',
    definition:
      'IEEE 802.1AE Media Access Control Security, providing Layer 2 encryption for Ethernet frames. Used to secure LAN traffic between switches and endpoints.',
    technicalNote:
      'MACsec relies on AES-GCM (quantum-safe) for encryption but uses ECDH/ECDSA for key agreement, requiring PQC migration for the key exchange.',
    relatedModule: '/migrate',
    complexity: 'advanced',
    category: 'protocol',
  },
  {
    term: 'KMIP',
    acronym: 'KMIP',
    definition:
      'Key Management Interoperability Protocol, an OASIS standard for communication between key management systems and cryptographic clients.',
    technicalNote: 'KMIP 2.1+ includes support for post-quantum key types and algorithms.',
    relatedModule: '/migrate',
    complexity: 'advanced',
    category: 'protocol',
  },
  {
    term: 'CMP',
    acronym: 'CMP',
    definition:
      'Certificate Management Protocol (RFC 4210), used for managing X.509 certificates including enrollment, updates, and revocation. PQC support via RFC 9810.',
    relatedModule: '/library?ref=RFC 9810',
    complexity: 'advanced',
    category: 'protocol',
  },
  {
    term: 'JWT',
    acronym: 'JWT',
    definition:
      'JSON Web Token, a compact token format for securely transmitting claims between parties. Widely used in API authentication and OAuth 2.0.',
    technicalNote:
      'JWTs typically use RSA or ECDSA signatures which are quantum-vulnerable. PQC JWT support (ML-DSA) is being standardized via JOSE working group.',
    relatedModule: '/learn/api-security-jwt',
    complexity: 'intermediate',
    category: 'protocol',
  },

  // === API Security / JOSE ===
  {
    term: 'JSON Web Signature',
    acronym: 'JWS',
    definition:
      'A standard (RFC 7515) for digitally signing JSON payloads. JWS is the mechanism that makes JWTs tamper-proof — the signature covers the JOSE header and payload.',
    technicalNote:
      'PQC migration requires new JWS algorithm identifiers (e.g., ML-DSA-44, ML-DSA-65) registered via the IETF JOSE PQC draft. Signature sizes grow from 64 bytes (ES256) to ~2,420 bytes (ML-DSA-44).',
    relatedModule: '/learn/api-security-jwt',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'JSON Web Encryption',
    acronym: 'JWE',
    definition:
      'A standard (RFC 7516) for encrypting JSON payloads. JWE provides confidentiality for JWT claims using a two-layer encryption model: a Key Encryption Key (KEK) wraps a Content Encryption Key (CEK).',
    technicalNote:
      'PQC migration replaces ECDH-ES key agreement with ML-KEM encapsulation. The KEM ciphertext replaces the encrypted key in JWE compact serialization.',
    relatedModule: '/learn/api-security-jwt',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'JOSE',
    definition:
      'JSON Object Signing and Encryption, the IETF framework encompassing JWS, JWE, JWK, and JWA specifications. JOSE defines how to sign, encrypt, and represent cryptographic keys in JSON format.',
    technicalNote:
      'The IETF JOSE working group is standardizing PQC algorithm identifiers (ML-DSA, ML-KEM, SLH-DSA) for use in JOSE headers. The framework was designed for algorithm agility — only the "alg" header value changes.',
    relatedModule: '/learn/api-security-jwt',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'OpenID Connect',
    acronym: 'OIDC',
    definition:
      'An identity layer built on OAuth 2.0 that provides authentication via ID tokens (JWTs). Widely used for single sign-on across web and mobile applications.',
    technicalNote:
      'OIDC ID tokens are signed JWTs. PQC migration requires authorization servers to sign ID tokens with ML-DSA and clients to verify PQC signatures. JWKS endpoints must serve PQC public keys.',
    relatedModule: '/learn/api-security-jwt',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'Demonstrating Proof-of-Possession',
    acronym: 'DPoP',
    definition:
      'An OAuth 2.0 extension (RFC 9449) that binds access tokens to a specific client by requiring a proof-of-possession JWT with each API request, preventing token theft and replay attacks.',
    technicalNote:
      "Each DPoP proof is a JWS signed with the client's key. With PQC, every API request includes a ~4 KB ML-DSA signature in addition to the access token, potentially exceeding HTTP header size limits.",
    relatedModule: '/learn/api-security-jwt',
    complexity: 'advanced',
    category: 'protocol',
  },
  {
    term: 'JSON Web Key Set',
    acronym: 'JWKS',
    definition:
      'A JSON document (RFC 7517) containing a set of public keys used to verify JWTs. Authorization servers publish JWKS endpoints so resource servers can fetch signing keys.',
    technicalNote:
      'ML-DSA public keys are ~2 KB each (vs 32 bytes for EC). JWKS payloads grow significantly during PQC migration, especially with key rotation maintaining multiple active keys.',
    relatedModule: '/learn/api-security-jwt',
    complexity: 'intermediate',
    category: 'protocol',
  },
  // === Code Signing (additional) ===
  {
    term: 'Root CA',
    definition:
      'The top-level Certificate Authority in a PKI trust hierarchy. A Root CA issues a self-signed certificate that serves as the trust anchor — all certificates in the chain ultimately derive their trust from it.',
    technicalNote:
      'Root CAs are installed in OS and browser trust stores. PQC migration for Root CAs is highest priority since a compromised root breaks the entire chain. CNSA 2.0 requires Root CAs to use ML-DSA-87 by 2030.',
    relatedModule: '/learn/code-signing',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Sigstore',
    definition:
      'An open-source project (Linux Foundation) for keyless code signing. Developers authenticate with their existing identity (GitHub, Google) and receive short-lived certificates, eliminating long-term key management.',
    technicalNote:
      'Sigstore centralizes crypto in two services: Fulcio (CA) and Rekor (transparency log). Upgrading these to ML-DSA automatically provides PQC protection to all downstream ecosystems (npm, PyPI, Kubernetes).',
    relatedModule: '/learn/code-signing',
    complexity: 'intermediate',
    category: 'organization',
  },
  {
    term: 'Fulcio',
    definition:
      'The Certificate Authority component of Sigstore. Fulcio issues short-lived (~20 minute) X.509 certificates that bind an OIDC identity to an ephemeral signing key.',
    technicalNote:
      'Fulcio is the primary PQC upgrade point in the Sigstore ecosystem. Migrating Fulcio to ML-DSA certificates automatically protects all downstream consumers without developer intervention.',
    relatedModule: '/learn/code-signing',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Rekor',
    definition:
      'The transparency log component of Sigstore. Rekor is an immutable, append-only log that records every signing event — signature, certificate, and artifact hash — for public auditability.',
    technicalNote:
      'PQC migration increases Rekor entry sizes significantly (~200 bytes for ECDSA vs ~3,600 bytes for ML-DSA-65). Storage overhead is the primary cost of PQC migration in Sigstore.',
    relatedModule: '/learn/code-signing',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Keyless Signing',
    definition:
      'A code signing approach where no long-term private keys are managed by the developer. Identity-based trust (via OIDC) replaces key-based trust, with ephemeral keys generated per-signing event.',
    relatedModule: '/learn/code-signing',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Time Stamping Authority',
    acronym: 'TSA',
    definition:
      'A trusted service (RFC 3161) that proves a digital signature was created at a specific time. Essential for code signing, where signatures must remain valid after certificate expiration.',
    technicalNote:
      'PQC migration requires TSAs to issue timestamps signed with quantum-safe algorithms. A quantum-vulnerable timestamp means an attacker could backdate forged signatures.',
    relatedModule: '/learn/code-signing',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Extended Key Usage',
    acronym: 'EKU',
    definition:
      'An X.509 certificate extension that restricts the purposes for which a certificate can be used — for example, Code Signing (OID 1.3.6.1.5.5.7.3.3), Server Authentication, or Client Authentication.',
    relatedModule: '/learn/code-signing',
    complexity: 'intermediate',
    category: 'concept',
  },

  // === Supply Chain Security ===
  {
    term: 'Software Supply Chain',
    definition:
      'The entire pipeline from source code to deployed software, including dependencies, build systems, artifact registries, signing infrastructure, and distribution channels. Every link in this chain is a potential attack surface.',
    relatedModule: '/learn/code-signing',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'SLSA',
    acronym: 'SLSA',
    definition:
      'Supply-chain Levels for Software Artifacts \u2014 a security framework (originally from Google) that defines increasing levels of supply chain integrity guarantees, from basic build provenance to fully hermetic, reproducible builds.',
    technicalNote:
      'SLSA levels depend on cryptographic attestations signed during the build process. If those signatures use quantum-vulnerable algorithms (ECDSA, RSA), the entire SLSA guarantee collapses once quantum computers can forge attestations.',
    relatedModule: '/learn/code-signing',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'in-toto',
    definition:
      'An open-source framework for securing the integrity of software supply chains by defining and cryptographically verifying each step of the build and release process. Each step produces a signed attestation (a "link") forming a verifiable chain.',
    technicalNote:
      "in-toto link metadata is signed with the functionary's private key. PQC migration requires upgrading all functionary keys to ML-DSA to prevent quantum forgery of supply chain attestations.",
    relatedModule: '/learn/code-signing',
    complexity: 'advanced',
    category: 'standard',
  },
  {
    term: 'Build Provenance',
    definition:
      'A cryptographically signed attestation documenting how a software artifact was built \u2014 including the source repository, build system, entry point, and build parameters. Answers the question "who built this and how?"',
    technicalNote:
      'Build provenance is a core requirement of SLSA Level 1+. Without quantum-safe signatures on provenance attestations, an adversary with a quantum computer could forge provenance for malicious artifacts.',
    relatedModule: '/learn/code-signing',
    complexity: 'intermediate',
    category: 'concept',
  },

  // === Standards (additional) ===
  {
    term: 'NIST SP 800-227',
    definition:
      'NIST Special Publication providing recommendations for Key Encapsulation Mechanism (KEM) implementation, including guidance on parameter selection and secure use of ML-KEM.',
    relatedModule: '/library?ref=NIST SP 800-227',
    complexity: 'advanced',
    category: 'standard',
  },
  {
    term: 'NIST IR 8545',
    definition:
      'NIST Internal Report documenting the selection of HQC as an additional KEM standard, providing a code-based alternative to lattice-based ML-KEM.',
    relatedModule: '/library?ref=NIST IR 8545',
    complexity: 'advanced',
    category: 'standard',
  },
  {
    term: 'RFC 9370',
    definition:
      'IETF standard defining multiple key exchanges in IKEv2, enabling hybrid classical + PQC key exchange for IPsec VPNs.',
    technicalNote:
      'Allows adding ML-KEM alongside classical Diffie-Hellman in a single IKEv2 handshake without breaking backward compatibility.',
    relatedModule: '/library?ref=IETF RFC 9370',
    complexity: 'advanced',
    category: 'standard',
  },
  {
    term: 'RFC 9881',
    definition:
      'IETF standard defining how to use ML-DSA digital signatures in X.509 certificates and Certificate Revocation Lists (CRLs).',
    relatedModule: '/library?ref=RFC 9881',
    complexity: 'advanced',
    category: 'standard',
  },
  {
    term: 'RFC 9882',
    definition:
      'IETF standard defining the use of ML-DSA signatures in the Cryptographic Message Syntax (CMS), enabling PQC-signed messages and documents.',
    relatedModule: '/library?ref=RFC 9882',
    complexity: 'advanced',
    category: 'standard',
  },
  {
    term: 'ISO/IEC 18013-5',
    definition:
      'International standard for mobile driving licences (mDL), defining the data model, security mechanisms, and device engagement protocols for digital identity documents.',
    relatedModule: '/learn/digital-id',
    complexity: 'advanced',
    category: 'standard',
  },
  {
    term: 'BSI TR-02102',
    definition:
      'German Federal Office for Information Security (BSI) Technical Guideline series on cryptographic recommendations, covering TLS, IPsec, SSH, and general algorithms.',
    technicalNote:
      'TR-02102-1 covers general recommendations; TR-02102-2 through TR-02102-4 provide protocol-specific PQC migration guidance.',
    relatedModule: '/library?ref=BSI TR-02102-1',
    complexity: 'intermediate',
    category: 'standard',
  },

  // === Organizations (additional) ===
  {
    term: 'PQCA',
    acronym: 'PQCA',
    definition:
      'Post-Quantum Cryptographic Alliance, a Linux Foundation project bringing together industry and academia to advance PQC adoption through open-source software.',
    relatedModule: '/library',
    complexity: 'intermediate',
    category: 'organization',
  },
  {
    term: 'OQS',
    acronym: 'OQS',
    definition:
      'Open Quantum Safe, an open-source project providing C library (liboqs) implementations of post-quantum algorithms and integrations with OpenSSL, BoringSSL, and other libraries.',
    relatedModule: '/library',
    complexity: 'intermediate',
    category: 'organization',
  },
  {
    term: 'ASD',
    acronym: 'ASD',
    definition:
      "Australian Signals Directorate, Australia's national cybersecurity agency. Published aggressive PQC migration timelines with a 2030 deadline for full transition — five years ahead of the US.",
    relatedModule: '/timeline',
    complexity: 'intermediate',
    category: 'organization',
  },
  {
    term: 'CCCS',
    acronym: 'CCCS',
    definition:
      "Canadian Centre for Cyber Security, Canada's technical authority on cybersecurity. Published the ITSM.40.001 PQC migration roadmap for the Government of Canada.",
    relatedModule: '/timeline',
    complexity: 'intermediate',
    category: 'organization',
  },
  {
    term: 'CRYPTREC',
    acronym: 'CRYPTREC',
    definition:
      "Cryptography Research and Evaluation Committees, Japan's organization for evaluating and recommending cryptographic algorithms for government use.",
    relatedModule: '/timeline',
    complexity: 'intermediate',
    category: 'organization',
  },
  {
    term: 'KpqC',
    acronym: 'KpqC',
    definition:
      "Korean Post-Quantum Cryptography project, South Korea's national initiative to develop and standardize its own PQC algorithms including HAETAE, AIMer, SMAUG-T, and NTRU+.",
    relatedModule: '/timeline',
    complexity: 'intermediate',
    category: 'organization',
  },
  {
    term: 'ITU-T',
    acronym: 'ITU-T',
    definition:
      'International Telecommunication Union — Telecommunication Standardization Sector. Study Group 17 (SG17) is developing PQC standards for telecommunications infrastructure.',
    relatedModule: '/library',
    complexity: 'intermediate',
    category: 'organization',
  },
  {
    term: 'NCCoE',
    acronym: 'NCCoE',
    definition:
      'NIST National Cybersecurity Center of Excellence, collaborating with industry to develop practical PQC migration guidance and reference architectures.',
    relatedModule: '/migrate',
    complexity: 'intermediate',
    category: 'organization',
  },
  {
    term: 'BIS',
    acronym: 'BIS',
    definition:
      'Bank for International Settlements, the international financial institution that published the quantum-readiness roadmap (Paper 158) for the global financial system.',
    relatedModule: '/timeline',
    complexity: 'intermediate',
    category: 'organization',
  },
  {
    term: 'CACR',
    acronym: 'CACR',
    definition:
      "Chinese Association for Cryptologic Research, the organization that ran China's independent PQC competition and is shaping the NGCC (Next-Generation Commercial Cryptographic) standards program.",
    relatedModule: '/timeline',
    complexity: 'advanced',
    category: 'organization',
  },

  // === Concepts (additional) ===
  {
    term: 'CRQC',
    acronym: 'CRQC',
    definition:
      'Cryptographically Relevant Quantum Computer, a hypothetical future quantum computer powerful enough to break RSA, ECC, and other classical public-key cryptography.',
    technicalNote:
      'Estimates vary, but a CRQC would need thousands of stable logical qubits. Most timelines estimate 2030-2040 for CRQC capability.',
    relatedModule: '/learn/pqc-risk-management',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Forward Secrecy',
    definition:
      'A property of key exchange protocols where compromise of long-term keys does not compromise past session keys. Each session uses ephemeral keys that are discarded.',
    technicalNote:
      'Also called Perfect Forward Secrecy (PFS). Critical for TLS 1.3 and a reason hybrid PQC key exchange is preferred over static key transport.',
    relatedModule: '/learn/tls-basics',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Side-Channel Attack',
    definition:
      'An attack that exploits physical characteristics of a cryptographic implementation (timing, power consumption, electromagnetic emissions) rather than mathematical weaknesses.',
    technicalNote:
      'PQC algorithms like FN-DSA require careful floating-point implementation to resist side-channel attacks. Constant-time implementations are essential.',
    relatedModule: '/algorithms',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Certificate Chain',
    definition:
      'A linked sequence of X.509 certificates from a leaf (end-entity) certificate up through intermediates to a trusted root CA, establishing a chain of trust.',
    relatedModule: '/learn/pki-workshop',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Root of Trust',
    definition:
      'A foundational component (hardware or software) that is inherently trusted and used as the starting point for a chain of trust in a system.',
    technicalNote:
      'PQC migration requires updating roots of trust (TPM, secure boot firmware, root CA certificates) to quantum-safe algorithms.',
    relatedModule: '/migrate',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Key Rotation',
    definition:
      'The practice of periodically replacing cryptographic keys with new ones, limiting the exposure window if a key is compromised.',
    technicalNote:
      'PQC migration involves key rotation from classical to hybrid or pure PQC keys across all cryptographic infrastructure.',
    relatedModule: '/migrate',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Non-Repudiation',
    definition:
      'A property of digital signatures that prevents a signer from denying they signed a message. Essential for legal documents, contracts, and financial transactions.',
    relatedModule: '/learn/pki-workshop',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'SD-JWT',
    acronym: 'SD-JWT',
    definition:
      'Selective Disclosure JSON Web Token, a credential format that allows holders to reveal only specific claims from a signed token without exposing all data.',
    technicalNote:
      'Used in the EUDI Wallet ecosystem alongside mdoc format. Each claim is individually salted and hashed for privacy.',
    relatedModule: '/learn/digital-id',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'mDL',
    acronym: 'mDL',
    definition:
      "Mobile Driver's License, a digital credential stored on a smartphone conforming to ISO/IEC 18013-5. Uses mdoc format with cryptographic device binding.",
    relatedModule: '/learn/digital-id',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'mdoc',
    definition:
      'Mobile Document, a CBOR-based verifiable credential format defined in ISO/IEC 18013-5. Uses Mobile Security Objects (MSO) for issuer-signed data integrity.',
    relatedModule: '/learn/digital-id',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'CBOR',
    acronym: 'CBOR',
    definition:
      'Concise Binary Object Representation, a compact binary data serialization format (RFC 8949). Used in mdoc credentials, IoT protocols, and WebAuthn attestations.',
    relatedModule: '/learn/digital-id',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Verifiable Credential',
    acronym: 'VC',
    definition:
      'A tamper-proof digital credential that can be cryptographically verified. Issued by a trusted authority and held in a digital wallet for presentation to verifiers.',
    technicalNote:
      'W3C Verifiable Credentials and ISO mdoc are the two major formats. PQC migration requires updating the signature algorithms used by issuers.',
    relatedModule: '/learn/digital-id',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Selective Disclosure',
    definition:
      'The ability to reveal only specific attributes from a digital credential without exposing all contained data. A key privacy feature of SD-JWT and mdoc formats.',
    relatedModule: '/learn/digital-id',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'BIP32',
    definition:
      'Bitcoin Improvement Proposal 32, defining Hierarchical Deterministic (HD) wallets. Enables deriving an entire tree of key pairs from a single master seed.',
    technicalNote:
      "Uses HMAC-SHA512 for key derivation. Supports hardened and normal derivation paths (e.g., m/44'/0'/0'/0/0).",
    relatedModule: '/learn/digital-assets',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'UTXO',
    acronym: 'UTXO',
    definition:
      "Unspent Transaction Output, Bitcoin's model for tracking coin ownership. Each transaction consumes existing UTXOs and creates new ones.",
    technicalNote:
      'PQC migration for Bitcoin must handle UTXOs locked by quantum-vulnerable ECDSA scripts, potentially requiring a network-wide migration.',
    relatedModule: '/learn/digital-assets',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'SUPI',
    acronym: 'SUPI',
    definition:
      "Subscription Permanent Identifier, a 5G subscriber's permanent identity (usually based on IMSI). Protected by encrypting it as SUCI before transmission.",
    technicalNote:
      'SUCI conceals the SUPI using ECIES (Profile A/B) or ML-KEM (Profile C) to prevent IMSI-catching attacks.',
    relatedModule: '/learn/5g-security',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Fully Homomorphic Encryption',
    acronym: 'FHE',
    definition:
      'An encryption scheme that allows computations to be performed on ciphertext, producing encrypted results that match operations on the plaintext.',
    technicalNote:
      'FHE is lattice-based and believed to be quantum-safe. Used for privacy-preserving cloud computing, but remains computationally expensive.',
    relatedModule: '/algorithms',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Zero-Knowledge Proof',
    acronym: 'ZKP',
    definition:
      'A cryptographic method where one party proves knowledge of a value without revealing the value itself. Used in privacy-preserving authentication and blockchain.',
    technicalNote:
      'PQC-compatible ZKP constructions (e.g., lattice-based, hash-based) are active areas of research for quantum-safe privacy systems.',
    relatedModule: '/algorithms',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'DER',
    acronym: 'DER',
    definition:
      'Distinguished Encoding Rules, a binary encoding format for ASN.1 data structures. The standard encoding for X.509 certificates, keys, and ECDSA signatures.',
    relatedModule: '/learn/pki-workshop',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'PEM',
    acronym: 'PEM',
    definition:
      'Privacy Enhanced Mail, a Base64-encoded format for storing cryptographic objects (certificates, keys, CSRs). Recognized by "-----BEGIN CERTIFICATE-----" headers.',
    relatedModule: '/openssl',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Derivation Path',
    definition:
      "A hierarchical path notation (e.g., m/44'/0'/0'/0/0) used in HD wallets to deterministically derive child keys from a master key following BIP32/BIP44 standards.",
    relatedModule: '/learn/digital-assets',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Quantum Error Correction',
    definition:
      'Techniques to protect quantum information from decoherence and errors during computation. Essential for building practical, large-scale quantum computers.',
    technicalNote:
      'Current quantum computers lack sufficient error correction for cryptanalysis. Advances in error correction directly affect CRQC timelines.',
    relatedModule: '/learn/quantum-threats',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Interoperability',
    definition:
      'The ability of different cryptographic implementations, libraries, and systems to work together correctly. Critical during PQC migration when classical and quantum-safe systems must coexist.',
    relatedModule: '/migrate',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Hybrid Mode',
    definition:
      'An operational mode where both classical and post-quantum cryptographic algorithms run in parallel, ensuring security even if one algorithm is broken.',
    technicalNote:
      'Recommended by NIST, BSI, and ANSSI as the preferred transition strategy. Applied to key exchange, signatures, and certificates.',
    relatedModule: '/migrate',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'QTSP',
    acronym: 'QTSP',
    definition:
      'Qualified Trust Service Provider, an organization authorized under eIDAS 2.0 to issue qualified electronic signatures, seals, timestamps, and certificates.',
    relatedModule: '/learn/digital-id',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Attestation',
    definition:
      'A cryptographically signed statement vouching for the authenticity or properties of a device, key, or credential. Used in FIDO2, TPM, and digital identity systems.',
    relatedModule: '/learn/digital-id',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Key Binding',
    definition:
      "Cryptographic proof that a credential is bound to a specific holder's key, preventing unauthorized transfer or replay of digital credentials.",
    relatedModule: '/learn/digital-id',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Crypto Discovery',
    definition:
      "The automated process of scanning an organization's systems to identify all cryptographic algorithms, keys, certificates, and protocols in use. The first step in PQC migration.",
    technicalNote:
      'Tools like SandboxAQ AQtive Guard and IBM Guardium automate crypto discovery to build a Cryptographic Bill of Materials (CBOM).',
    relatedModule: '/learn/migration-program',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'RLP',
    acronym: 'RLP',
    definition:
      "Recursive Length Prefix, Ethereum's serialization encoding for transactions, blocks, and account state. Used to encode transaction data before signing with ECDSA.",
    relatedModule: '/learn/digital-assets',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Base58Check',
    definition:
      'A Bitcoin-specific encoding format that converts binary data to a human-readable alphanumeric string with a built-in checksum for error detection.',
    technicalNote:
      'Omits confusable characters (0, O, I, l). Used for Bitcoin addresses, WIF private keys, and extended public/private keys.',
    relatedModule: '/learn/digital-assets',
    complexity: 'advanced',
    category: 'concept',
  },

  // === Terms covering Learn Module content gaps ===

  // PQC 101
  {
    term: 'Harvest Now, Forge Later',
    acronym: 'HNFL',
    definition:
      'An attack strategy where adversaries record digitally signed data today, planning to forge signatures once quantum computers can break the signing algorithm.',
    technicalNote:
      'While HNDL targets confidentiality (encrypted data), HNFL targets authenticity and integrity — firmware updates, certificates, and legal documents signed with RSA/ECDSA become forgeable.',
    relatedModule: '/learn/pqc-101',
    complexity: 'beginner',
    category: 'concept',
  },

  // Hybrid Crypto
  {
    term: 'X25519MLKEM768',
    definition:
      'A hybrid key exchange algorithm combining X25519 (classical ECDH) with ML-KEM-768 (post-quantum KEM). Both shared secrets are combined via HKDF so the result is secure if either algorithm holds.',
    technicalNote:
      'Deployed in Chrome, Firefox, and Cloudflare TLS 1.3. Uses concatenated shared secrets fed through HKDF-SHA256 for the final key.',
    relatedModule: '/learn/hybrid-crypto',
    complexity: 'intermediate',
    category: 'algorithm',
  },

  // TLS Basics
  {
    term: 'Cipher Suite',
    definition:
      'A named combination of cryptographic algorithms used together in a TLS connection — specifying the key exchange, authentication, bulk encryption, and hash algorithms.',
    technicalNote:
      'TLS 1.3 cipher suites (e.g., TLS_AES_256_GCM_SHA384) are simpler than TLS 1.2, separating key exchange from the cipher suite. PQC adds new key exchange groups like X25519MLKEM768.',
    relatedModule: '/learn/tls-basics',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'TLS Handshake',
    definition:
      'The initial negotiation between client and server that establishes a secure TLS connection — agreeing on cipher suites, exchanging keys, and authenticating the server.',
    technicalNote:
      'TLS 1.3 completes in 1 round-trip (1-RTT). PQC key exchange increases ClientHello size significantly (ML-KEM public keys are ~1,184 bytes vs 32 bytes for X25519).',
    relatedModule: '/learn/tls-basics',
    complexity: 'beginner',
    category: 'concept',
  },

  // VPN/SSH
  {
    term: 'Rosenpass',
    definition:
      'A post-quantum key exchange protocol designed as a companion to WireGuard VPN. Performs a separate ML-KEM key exchange and feeds the resulting key into WireGuard.',
    technicalNote:
      'Rosenpass runs alongside WireGuard rather than modifying it, adding PQC protection without changing the WireGuard protocol itself.',
    relatedModule: '/learn/vpn-ssh-pqc',
    complexity: 'advanced',
    category: 'protocol',
  },
  {
    term: 'sntrup761',
    definition:
      'A lattice-based key encapsulation mechanism used in OpenSSH hybrid key exchange. Combined with X25519 to provide post-quantum protection for SSH connections.',
    technicalNote:
      'Available in OpenSSH since version 9.0 as sntrup761x25519-sha512. Being superseded by mlkem768x25519-sha256 in newer OpenSSH versions.',
    relatedModule: '/learn/vpn-ssh-pqc',
    complexity: 'advanced',
    category: 'algorithm',
  },

  // Email Signing
  {
    term: 'SignedData',
    definition:
      'A CMS (Cryptographic Message Syntax) structure defined in RFC 5652 that carries digitally signed content. The foundation of S/MIME email signatures.',
    technicalNote:
      'Contains the original content, signer certificates, and one or more SignerInfo structures with the actual signatures. PQC migration requires updating the signature algorithms.',
    relatedModule: '/learn/email-signing',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'EnvelopedData',
    definition:
      'A CMS structure for encrypted content using key transport (RSA) or key agreement (ECDH). Being superseded by AuthEnvelopedData with KEM-based encryption for PQC.',
    technicalNote:
      'Traditional EnvelopedData uses RSA key transport, which is vulnerable to quantum attacks. RFC 9629 defines KEMRecipientInfo as the PQC replacement.',
    relatedModule: '/learn/email-signing',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'KEMRecipientInfo',
    definition:
      'A CMS recipient info type defined in RFC 9629 that uses Key Encapsulation Mechanisms (KEMs) instead of RSA key transport for encrypting content-encryption keys.',
    technicalNote:
      "Enables ML-KEM-based encryption in S/MIME and CMS. The sender encapsulates a shared secret to the recipient's KEM public key, then derives the content-encryption key.",
    relatedModule: '/learn/email-signing',
    complexity: 'advanced',
    category: 'protocol',
  },

  // PKI Workshop
  {
    term: 'Certificate Revocation List',
    acronym: 'CRL',
    definition:
      'A signed list published by a Certificate Authority containing the serial numbers of certificates that have been revoked before their expiration date.',
    technicalNote:
      'CRLs are periodically published and can become large. OCSP provides real-time revocation checking as an alternative. PQC migration requires CRLs to be signed with quantum-safe algorithms.',
    relatedModule: '/learn/pki-workshop',
    complexity: 'beginner',
    category: 'protocol',
  },

  // Key Management & HSM
  {
    term: 'NIST SP 800-57',
    definition:
      'NIST Special Publication 800-57: Recommendation for Key Management. Defines the seven-stage key lifecycle (pre-operational, operational, post-operational, etc.) and cryptoperiod guidance.',
    complexity: 'intermediate',
    category: 'standard',
    relatedModule: '/learn/kms-pqc',
  },
  {
    term: 'PKCS#11',
    definition:
      'A standard API (also called Cryptoki) for accessing cryptographic hardware like Hardware Security Modules (HSMs), smart cards, and tokens.',
    technicalNote:
      'Defines C-language function calls for key generation, signing, encryption, and object management. PKCS#11 v3.2 adds CKM_ML_KEM_* and CKM_ML_DSA_* mechanisms for PQC.',
    relatedModule: '/learn/hsm-pqc',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'Key Lifecycle',
    definition:
      'The complete management process for cryptographic keys from creation to destruction, typically comprising 7 stages: generation, storage, activation, rotation, deactivation, compromise response, and destruction.',
    technicalNote:
      'Defined by NIST SP 800-57. PQC migration adds complexity — organizations must plan parallel classical and PQC key lifecycles during the transition period.',
    relatedModule: '/learn/kms-pqc',
    complexity: 'beginner',
    category: 'concept',
  },

  // Stateful Signatures
  {
    term: 'Merkle Tree',
    definition:
      'A binary tree of hash values where each leaf contains a hash of a data block and each internal node contains a hash of its children. The foundation of stateful hash-based signature schemes.',
    technicalNote:
      'In LMS/XMSS, each leaf holds a one-time signature key pair. The tree height determines the maximum number of signatures (2^h). The root hash serves as the public key.',
    relatedModule: '/learn/stateful-signatures',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Winternitz One-Time Signature',
    acronym: 'WOTS+',
    definition:
      'A hash-based one-time signature scheme used as the building block for LMS and XMSS. Each key pair can only sign one message safely.',
    technicalNote:
      'The Winternitz parameter (w) controls the trade-off between signature size and computation time. Larger w = smaller signatures but more hash operations.',
    relatedModule: '/learn/stateful-signatures',
    complexity: 'advanced',
    category: 'algorithm',
  },
  {
    term: 'One-Time Signature',
    acronym: 'OTS',
    definition:
      'A signature scheme where each private key must be used to sign exactly one message. Reusing a key leaks information that allows signature forgery.',
    technicalNote:
      'LMS and XMSS use Merkle trees of OTS keys to enable multiple signatures from a single public key. Strict state management is required to prevent key reuse.',
    relatedModule: '/learn/stateful-signatures',
    complexity: 'intermediate',
    category: 'concept',
  },

  // Digital Assets
  {
    term: 'P2PKH',
    definition:
      'Pay-to-Public-Key-Hash, a Bitcoin address format (starting with "1") that hides the public key behind a hash until the first spending transaction.',
    technicalNote:
      'Provides some quantum protection for unspent outputs since the public key is not exposed. Once spent, the public key is revealed on the immutable blockchain and becomes harvestable.',
    relatedModule: '/learn/digital-assets',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'BIP44',
    definition:
      "Bitcoin Improvement Proposal 44, defining a multi-account hierarchy for deterministic wallets using derivation paths like m/44'/0'/0'/0/0 (purpose/coin/account/change/index).",
    technicalNote:
      'Builds on BIP32 (HD wallets) and BIP43 (purpose field). Enables standard derivation paths across different cryptocurrencies and wallet implementations.',
    relatedModule: '/learn/digital-assets',
    complexity: 'intermediate',
    category: 'standard',
  },

  // 5G Security
  {
    term: 'ECIES',
    acronym: 'ECIES',
    definition:
      'Elliptic Curve Integrated Encryption Scheme, used in 5G networks to conceal subscriber identity (SUCI). Combines ECDH key agreement with symmetric encryption.',
    technicalNote:
      '5G defines three SUCI protection profiles: Profile A (ECIES with Curve25519), Profile B (ECIES with P-256), and Profile C (ML-KEM for post-quantum protection).',
    relatedModule: '/learn/5g-security',
    complexity: 'intermediate',
    category: 'algorithm',
  },
  {
    term: 'AUSF',
    acronym: 'AUSF',
    definition:
      'Authentication Server Function, a 5G core network function that handles subscriber authentication using the 5G-AKA protocol and interfaces with the UDM for credential verification.',
    relatedModule: '/learn/5g-security',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'SIDF',
    acronym: 'SIDF',
    definition:
      'Subscription Identifier De-concealing Function, the 5G core component that decrypts the SUCI (concealed subscriber ID) back to the SUPI (permanent ID) using the home network private key.',
    technicalNote:
      'SIDF uses ECIES (Profile A/B) or ML-KEM (Profile C) decapsulation to recover the subscriber identity. A key target for PQC migration in 5G networks.',
    relatedModule: '/learn/5g-security',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'UDM',
    acronym: 'UDM',
    definition:
      'Unified Data Management, a 5G core network function that stores subscriber profiles, authentication credentials, and subscription data. Works with the AUSF for 5G-AKA authentication.',
    relatedModule: '/learn/5g-security',
    complexity: 'advanced',
    category: 'concept',
  },

  // Digital Identity
  {
    term: 'Person Identification Data',
    acronym: 'PID',
    definition:
      'The foundational digital identity credential in the EUDI Wallet ecosystem, containing core attributes like name, date of birth, and nationality issued by a national authority.',
    technicalNote:
      "PID is the prerequisite for all other attestations (diplomas, driving licenses). Must be cryptographically bound to the wallet holder's key to prevent transfer.",
    relatedModule: '/learn/digital-id',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Relying Party',
    definition:
      'An entity (organization, service, or application) that relies on a digital credential presented by a holder to make trust decisions — such as granting access or completing a transaction.',
    technicalNote:
      'In the EUDI ecosystem, relying parties use OpenID4VP to request and verify credentials. They can only request attributes they are authorized to see (selective disclosure).',
    relatedModule: '/learn/digital-id',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Wallet Instance Attestation',
    acronym: 'WIA',
    definition:
      'A cryptographic proof that a digital identity wallet app is a genuine, certified instance running on a secure device. Required by issuers before they will provision credentials.',
    technicalNote:
      "Attests to the wallet's integrity, certification status, and device security. Prevents credential issuance to compromised or counterfeit wallet applications.",
    relatedModule: '/learn/digital-id',
    complexity: 'advanced',
    category: 'concept',
  },

  // === Entropy & Randomness ===
  {
    term: 'Entropy',
    definition:
      'A measure of unpredictability or randomness in data. In cryptography, high entropy means data is difficult to predict, which is essential for secure key generation and nonce creation.',
    technicalNote:
      'Min-entropy is the most conservative measure: -log2(max probability of any single outcome). NIST SP 800-90B defines methods for estimating entropy of physical noise sources.',
    relatedModule: '/learn/entropy-randomness',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'CSPRNG',
    acronym: 'CSPRNG',
    definition:
      'Cryptographically Secure Pseudo-Random Number Generator. A PRNG whose output is computationally indistinguishable from true randomness, suitable for cryptographic key generation.',
    technicalNote:
      'Typically implemented as DRBGs (SP 800-90A) seeded from hardware entropy sources. Examples: /dev/urandom (Linux), CryptGenRandom (Windows), crypto.getRandomValues (Web Crypto API).',
    relatedModule: '/learn/entropy-randomness',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'DRBG',
    acronym: 'DRBG',
    definition:
      'Deterministic Random Bit Generator. An algorithm that produces a sequence of pseudorandom bits from a secret seed value. NIST SP 800-90A defines three approved mechanisms: CTR_DRBG, Hash_DRBG, and HMAC_DRBG.',
    technicalNote:
      'CTR_DRBG (AES-based) is the most widely deployed, used by OpenSSL and the Linux kernel. All three mechanisms use symmetric primitives and are quantum-safe.',
    relatedModule: '/learn/entropy-randomness',
    complexity: 'advanced',
    category: 'algorithm',
  },
  {
    term: 'TRNG',
    acronym: 'TRNG',
    definition:
      'True Random Number Generator. A hardware device that generates random numbers from physical phenomena such as thermal noise, shot noise, or clock jitter.',
    technicalNote:
      'Intel RDRAND/RDSEED, ARM RNDR, and TPM RNG are common TRNG implementations. TRNG output is not affected by quantum computers since it relies on physical processes, not computational assumptions.',
    relatedModule: '/learn/entropy-randomness',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'QRNG',
    acronym: 'QRNG',
    definition:
      'Quantum Random Number Generator. A device that generates random numbers from quantum mechanical phenomena such as photon detection, vacuum fluctuations, or quantum beam splitting.',
    technicalNote:
      'QRNG randomness is guaranteed by the laws of quantum physics (Born rule). Commercial products are available from ID Quantique, Toshiba, and others. The Australian National University (ANU) operates a public QRNG service.',
    relatedModule: '/learn/entropy-randomness',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Min-Entropy',
    definition:
      'The most conservative measure of entropy, defined as the negative base-2 logarithm of the probability of the most likely outcome. Used by NIST SP 800-90B for entropy source validation.',
    technicalNote:
      'For a uniform byte distribution, min-entropy = 8 bits per byte. Real entropy sources typically achieve 6-8 bits per byte before conditioning. The NIST SP 800-90B EntropyAssessment tool computes min-entropy estimates.',
    relatedModule: '/learn/entropy-randomness',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'SP 800-90A',
    definition:
      'NIST Special Publication defining three Deterministic Random Bit Generator (DRBG) mechanisms: CTR_DRBG (AES-based), Hash_DRBG (SHA-based), and HMAC_DRBG. Published June 2015 (Rev. 1).',
    technicalNote:
      'All three DRBGs use symmetric primitives and are quantum-safe. CTR_DRBG is the default in OpenSSL. Rev. 2 is in draft, adding XOF_DRBG (SHAKE-based) and removing TDES/SHA-1.',
    relatedModule: '/learn/entropy-randomness',
    complexity: 'advanced',
    category: 'standard',
  },
  {
    term: 'SP 800-90B',
    definition:
      'NIST Special Publication providing methods for validating entropy sources used as input to DRBGs. Defines health tests (repetition count, adaptive proportion) and min-entropy estimation procedures. Published January 2018.',
    technicalNote:
      'The NIST Entropy Source Validation (ESV) program under CMVP uses SP 800-90B to certify hardware entropy sources. The NIST EntropyAssessment tool on GitHub implements the min-entropy assessment methods.',
    relatedModule: '/learn/entropy-randomness',
    complexity: 'advanced',
    category: 'standard',
  },
  {
    term: 'SP 800-90C',
    definition:
      'NIST Special Publication describing constructions for Random Bit Generators (RBGs) that combine entropy sources with DRBGs. Defines RBG1, RBG2, RBG3, and RBGC construction classes. Published September 2025.',
    technicalNote:
      'Completes the SP 800-90 series. Specifies how to combine multiple independent entropy sources for defense-in-depth, using XOR and conditioning functions to ensure combined output retains entropy even if one source is compromised.',
    relatedModule: '/learn/entropy-randomness',
    complexity: 'advanced',
    category: 'standard',
  },

  // === TLS Infrastructure ===
  {
    term: 'Certificate Transparency',
    acronym: 'CT',
    definition:
      'An open framework (RFC 9162) that requires all publicly-trusted TLS certificates to be logged in publicly auditable logs, enabling detection of misissued certificates.',
    technicalNote:
      'CT logs are Merkle trees of certificate records. The Merkle Tree Certificate (MTC) design builds directly on CT infrastructure, replacing individual certificate signatures with batch Merkle inclusion proofs.',
    relatedModule: '/learn/merkle-tree-certs',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'Hybrid Public Key Encryption',
    acronym: 'HPKE',
    definition:
      'A standardized framework (RFC 9180) for hybrid public-key encryption that combines a KEM, a key derivation function, and an AEAD cipher into a composable primitive.',
    technicalNote:
      'HPKE is used in TLS ECH (Encrypted Client Hello), MLS messaging, and several IETF PQC drafts. It can be instantiated with ML-KEM for post-quantum security by substituting the KEM component.',
    relatedModule: '/library',
    complexity: 'advanced',
    category: 'protocol',
  },

  // === Merkle Tree Certificates ===
  {
    term: 'SCT',
    acronym: 'SCT',
    definition:
      'Signed Certificate Timestamp — a cryptographic proof from a Certificate Transparency log server that a certificate has been submitted and will be publicly logged. Required by Chrome for all TLS certificates since 2018.',
    technicalNote:
      "SCTs are embedded in certificates (via a TLS extension or OCSP stapling) and signed by the CT log's private key. In the Merkle Tree Certificate (MTC) design, SCTs are replaced by Merkle inclusion proofs, which also prove CT log membership without a separate signature.",
    relatedModule: '/learn/merkle-tree-certs',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Merkle Tree Certificate',
    acronym: 'MTC',
    definition:
      'A certificate format that replaces individual per-certificate digital signatures with a compact inclusion proof in a Merkle tree. A single CA signature on the tree root covers the entire batch, dramatically reducing TLS handshake sizes for post-quantum algorithms.',
    technicalNote:
      'For a batch of ~4.4 million certificates, the inclusion proof is 736 bytes (23 sibling hashes × 32 bytes). This achieves 63–74% size reduction compared to traditional X.509 certificate chains with ML-DSA signatures.',
    relatedModule: '/learn/merkle-tree-certs',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Merkle Tree Certificate Authority',
    acronym: 'MTCA',
    definition:
      'A Certificate Authority that collects certificate assertions into a Merkle tree, signs the root hash, and distributes inclusion proofs to subscribers. The MTCA replaces individual certificate signatures with batch-level tree signing.',
    technicalNote:
      'The MTCA role is defined in draft-ietf-plants-merkle-tree-certs. Unlike traditional CAs that sign each certificate individually, an MTCA signs once per batch. A transparency service publishes signed roots for client synchronization.',
    relatedModule: '/learn/merkle-tree-certs',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Inclusion Proof',
    definition:
      'A compact chain of sibling hashes from a leaf to the root of a Merkle tree, proving that a specific item (such as a certificate) is part of the committed batch. Verification requires only hash recomputation, not signature verification.',
    technicalNote:
      'The proof size is O(log₂ N) where N is the number of leaves. For 2²³ (~8.4 million) leaves, the proof contains 23 sibling hashes (736 bytes at 32 bytes per SHA-256 hash). Domain-separated hashing (0x00 for leaves, 0x01 for internal nodes per RFC 9162) prevents second-preimage attacks.',
    relatedModule: '/learn/merkle-tree-certs',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Certificate Bloat',
    definition:
      'The significant increase in TLS certificate chain sizes caused by post-quantum signature algorithms. An ML-DSA-44 signature is 2,420 bytes compared to 64 bytes for ECDSA P-256, leading to 18–36 KB PQC TLS chain overhead that can break constrained clients and degrade connection setup times.',
    relatedModule: '/learn/merkle-tree-certs',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Batch Signing',
    definition:
      'A cryptographic technique where a single digital signature covers multiple items simultaneously by signing a hash that commits to the entire set. In Merkle Tree Certificates, the CA signs the tree root once to authenticate potentially millions of certificates.',
    relatedModule: '/learn/merkle-tree-certs',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Domain-Separated Hashing',
    definition:
      'A technique that prepends a unique prefix byte to hash inputs depending on their type, preventing one type of hash from being confused with another. In Merkle trees, leaf hashes use prefix 0x00 and internal node hashes use prefix 0x01, as specified in RFC 9162.',
    technicalNote:
      'Without domain separation, an attacker could construct a leaf whose hash matches an internal node, enabling second-preimage attacks. The 0x00/0x01 prefix convention is defined in RFC 9162 (Certificate Transparency v2).',
    relatedModule: '/learn/merkle-tree-certs',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'IETF PLANTS Working Group',
    acronym: 'PLANTS',
    definition:
      'The IETF working group responsible for standardizing Merkle Tree Certificates and related post-quantum PKI infrastructure. Adopted draft-ietf-plants-merkle-tree-certs in January 2026.',
    relatedModule: '/learn/merkle-tree-certs',
    complexity: 'intermediate',
    category: 'organization',
  },
  {
    term: 'Cosigner Quorum',
    definition:
      'A trust mechanism in Merkle Tree Certificate deployments where relying parties accept a signed subtree only after a configured set of external witnesses (cosigners) have co-signed it, preventing a compromised CA from silently issuing fraudulent certificates.',
    relatedModule: '/learn/merkle-tree-certs',
    complexity: 'advanced',
    category: 'concept',
  },

  // === Digital Assets PQC Migration ===
  {
    term: 'BIP-360',
    definition:
      'Pay to Quantum Resistant Hash, a proposed Bitcoin soft fork that introduces a new native SegWit v3 output type using NIST PQC signature algorithms (ML-DSA or FN-DSA) instead of secp256k1 ECDSA. Proposed by Hunter Beast in 2024.',
    technicalNote:
      'P2QRH addresses use bech32m encoding (bc1r…). The PQC public key is hashed (SHA-256 then HASH160) until spending time, when the full public key and PQC signature are revealed in the witness data. Transaction witness sizes increase 9–46× depending on the algorithm.',
    relatedModule: '/learn/digital-assets',
    complexity: 'advanced',
    category: 'standard',
  },
  {
    term: 'Account Abstraction',
    acronym: 'AA',
    definition:
      'An Ethereum protocol feature (EIP-4337) that enables smart contract wallets with arbitrary signature verification logic. This allows users to switch from ECDSA to PQC signatures (ML-DSA or FN-DSA) today without a protocol hard fork.',
    technicalNote:
      'EIP-4337 smart accounts verify PQC signatures on-chain at higher gas cost (~300k–500k gas per PQC signature vs ~21k for ECDSA). Combined with EIP-7702 (code delegation for EOAs), this provides a two-phase PQC migration path for Ethereum.',
    relatedModule: '/learn/digital-assets',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Solana Improvement Document',
    acronym: 'SIMD',
    definition:
      "The formal proposal process for Solana protocol changes, analogous to Bitcoin BIPs and Ethereum EIPs. As of early 2026, no SIMD for PQC has been ratified, making Solana's quantum migration path the least defined of the three major blockchains.",
    relatedModule: '/learn/digital-assets',
    complexity: 'intermediate',
    category: 'standard',
  },

  // === QKD ===
  {
    term: 'Information-Theoretic Security',
    definition:
      "A security guarantee that holds regardless of the adversary's computational power, including quantum computers. QKD achieves this for key distribution because its security is derived from the laws of quantum physics rather than mathematical hardness assumptions.",
    technicalNote:
      'Distinguished from computational security (used by PQC), which assumes the adversary has bounded computational resources. Information-theoretic security means that even with unlimited computing power, an attacker cannot break the scheme.',
    relatedModule: '/learn/qkd',
    complexity: 'advanced',
    category: 'concept',
  },
  // === IoT & OT Security ===
  {
    term: 'MQTT',
    acronym: 'MQTT',
    definition:
      'Message Queuing Telemetry Transport, a lightweight publish/subscribe messaging protocol for IoT. MQTT 5.0 supports TLS 1.3 transport security.',
    relatedModule: '/learn/iot-ot-pqc',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'LoRaWAN',
    definition:
      'Long Range Wide Area Network, a low-power WAN protocol for IoT. Uses AES-128 pre-shared keys. Maximum payload of 222 bytes makes PQC KEM infeasible inline.',
    relatedModule: '/learn/iot-ot-pqc',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'Matter',
    definition:
      'Smart home interoperability standard (formerly Project CHIP). Uses the CASE protocol with ECDSA P-256 for device attestation. PQC migration requires protocol specification update.',
    relatedModule: '/learn/iot-ot-pqc',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'SUIT',
    acronym: 'SUIT',
    definition:
      'Software Updates for Internet of Things (RFC 9019). A CBOR-based manifest format for secure firmware updates, providing metadata, conditions, and signature verification for OTA delivery.',
    relatedModule: '/learn/iot-ot-pqc',
    complexity: 'advanced',
    category: 'standard',
  },
  {
    term: 'RFC 7228',
    definition:
      'Terminology for Constrained-Node Networks. Defines device Class 0/1/2 based on RAM and Flash memory constraints, used to categorize IoT device capabilities for protocol selection.',
    relatedModule: '/learn/iot-ot-pqc',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'Purdue Model',
    definition:
      'Reference architecture for industrial control system (ICS) networks. Defines 6 levels from physical process (Level 0) to enterprise network (Level 5), guiding security zone segmentation and PQC migration priority.',
    relatedModule: '/learn/iot-ot-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'CoAP',
    acronym: 'CoAP',
    definition:
      'Constrained Application Protocol, a lightweight RESTful protocol designed for IoT devices. Runs over UDP with DTLS for security. Maximum payload of ~1,024 bytes makes PQC key exchange challenging.',
    relatedModule: '/learn/iot-ot-pqc',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'NB-IoT',
    acronym: 'NB-IoT',
    definition:
      'Narrowband IoT, a cellular connectivity standard for low-power wide-area (LPWA) devices. Offers 62.5 kbps uplink bandwidth, making PQC handshake overhead a significant concern.',
    relatedModule: '/learn/iot-ot-pqc',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'Programmable Logic Controller',
    acronym: 'PLC',
    definition:
      'An industrial computer that controls manufacturing processes, assembly lines, and infrastructure equipment. PLCs sit at Purdue Level 1 and typically use pre-shared keys or DNP3-SA for authentication.',
    relatedModule: '/learn/iot-ot-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Remote Terminal Unit',
    acronym: 'RTU',
    definition:
      'A microprocessor-controlled device that interfaces field devices (sensors, actuators) to a SCADA system. RTUs sit at Purdue Level 1 with asset lifecycles of 15\u201325 years.',
    relatedModule: '/learn/iot-ot-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Human-Machine Interface',
    acronym: 'HMI',
    definition:
      'A user interface panel or software application that allows operators to monitor and control industrial processes. HMIs sit at Purdue Level 2, typically using RSA-2048 or TLS 1.2.',
    relatedModule: '/learn/iot-ot-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Electronic Control Unit',
    acronym: 'ECU',
    definition:
      'An embedded computer in a vehicle that controls one or more electrical systems (engine, brakes, infotainment). Automotive ECUs communicate via CAN bus and face PQC migration challenges for V2X and firmware signing.',
    relatedModule: '/learn/automotive-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },

  // === Concepts (Executive / Governance) ===
  {
    term: 'Key Performance Indicator',
    acronym: 'KPI',
    definition:
      'A quantifiable metric used to measure progress toward organizational objectives. In PQC programs, KPIs track inventory completion, migration progress, vendor readiness, compliance gaps, and budget utilization.',
    relatedModule: '/learn/pqc-governance',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'RACI Matrix',
    acronym: 'RACI',
    definition:
      'A responsibility assignment matrix (Responsible, Accountable, Consulted, Informed) used in project governance to clarify roles and decision rights across stakeholders. Essential for cross-functional PQC migration programs.',
    technicalNote:
      'In PQC governance, a typical RACI covers activities like crypto inventory, algorithm selection, vendor assessment, testing, and deployment across roles such as CISO, CTO, Enterprise Architect, and Compliance Officer.',
    relatedModule: '/learn/pqc-governance',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Total Cost of Ownership',
    acronym: 'TCO',
    definition:
      'The complete cost of a technology investment over its lifetime, including acquisition, deployment, training, maintenance, and operational expenses. Critical for PQC migration business case development.',
    relatedModule: '/learn/pqc-business-case',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Return on Investment',
    acronym: 'ROI',
    definition:
      'A financial metric measuring the benefit generated relative to costs invested. For PQC migration, calculated as breach avoidance savings, compliance penalty avoidance, and operational efficiency gains minus migration costs.',
    relatedModule: '/learn/pqc-business-case',
    complexity: 'beginner',
    category: 'concept',
  },

  // === Data Asset Sensitivity ===
  {
    term: 'Data Asset Sensitivity',
    definition:
      'A classification of how much harm would result if a data asset were exposed, altered, or made unavailable. Sensitivity tiers (Low, Medium, High, Critical) drive prioritisation of PQC migration effort and determine which assets face the greatest HNDL risk.',
    technicalNote:
      'Sensitivity is distinct from classification labels (e.g. Confidential) — it is a risk-facing score that combines data type, retention period, regulatory scope, and cryptographic exposure.',
    relatedModule: '/learn/data-asset-sensitivity',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Data Retention Period',
    definition:
      'The duration for which data must remain confidential or legally protected. Combined with the expected CRQC arrival year, the retention period determines the HNDL risk window: assets retained past the CRQC threshold are at immediate harvest risk.',
    technicalNote:
      'HNDL Risk Year = CRQC Arrival Year − Retention Period. Assets with HNDL Risk Year ≤ current year are in the critical migration band.',
    relatedModule: '/learn/data-asset-sensitivity',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Asset Inventory',
    definition:
      'A structured catalog of all data assets, cryptographic dependencies, and communication channels within an organisation. The foundation of any PQC migration programme — you cannot migrate what you cannot see.',
    technicalNote:
      "A cryptographic asset inventory (sometimes called a CBOM — Cryptography Bill of Materials) records each asset's type, sensitivity tier, retention period, owning team, and current algorithm so migration priority can be calculated systematically.",
    relatedModule: '/learn/data-asset-sensitivity',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'CBOM',
    acronym: 'CBOM',
    definition:
      'Cryptography Bill of Materials — a structured inventory of all cryptographic assets, algorithms, keys, certificates, and protocols in use within a system or organisation. Analogous to a software BOM (SBOM) but focused on cryptographic dependencies.',
    technicalNote:
      'A CBOM enables automated discovery of quantum-vulnerable algorithms (RSA, ECC, DH) and drives migration roadmap prioritisation. NIST SP 1800-38 and CISA guidance recommend CBOM as the first step in PQC readiness.',
    relatedModule: '/learn/data-asset-sensitivity',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Sensitivity Scoring',
    definition:
      'A composite scoring method that combines multiple risk dimensions — data type, regulatory scope, cryptographic exposure, and retention period — into a single numeric score used to rank migration urgency across data assets.',
    technicalNote:
      'Typical weightings: data type (30%), regulatory requirements (25%), cryptographic exposure (25%), retention period (20%). Scores above the critical threshold trigger immediate PQC migration planning regardless of other factors.',
    relatedModule: '/learn/data-asset-sensitivity',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'HNDL Risk Window',
    definition:
      "The period during which data harvested today could realistically be decrypted by a future CRQC. Calculated as the gap between the estimated CRQC arrival year and the data's required confidentiality end date.",
    technicalNote:
      'Formula: HNDL Risk Year = CRQC Arrival Year − Data Retention Years. If this value is ≤ the current year, data is already inside the risk window. Most guidance uses 2030–2035 as a conservative CRQC bound.',
    relatedModule: '/learn/data-asset-sensitivity',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'NIST RMF',
    acronym: 'RMF',
    definition:
      'NIST Risk Management Framework (SP 800-37) — a six-step lifecycle process (Categorise, Select, Implement, Assess, Authorise, Monitor) for managing information security and privacy risk in federal and commercial systems.',
    technicalNote:
      'Step 1 (Categorise) uses FIPS 199 impact levels (Low/Moderate/High) to classify systems. For PQC, categorisation directly informs which controls from SP 800-53 apply, including post-quantum cryptographic requirements.',
    relatedModule: '/learn/data-asset-sensitivity',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'ISO 27005',
    definition:
      'ISO/IEC 27005 — the international standard for information security risk management. Provides a structured methodology for identifying assets, assessing threats and vulnerabilities, evaluating risk, and selecting risk treatment options.',
    technicalNote:
      'ISO 27005 uses a likelihood × consequence matrix to produce a risk level. For PQC, the threat is a CRQC; the vulnerability is use of RSA/ECC; the consequence is full plaintext exposure of harvested data. Risk treatment options: mitigate (migrate to PQC), accept, transfer, or avoid.',
    relatedModule: '/learn/data-asset-sensitivity',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'FIPS 199',
    definition:
      "Federal Information Processing Standard 199 — NIST's standard for categorising federal information and information systems. Defines three impact levels (Low, Moderate, High) for confidentiality, integrity, and availability that drive control selection in the NIST RMF.",
    technicalNote:
      'High confidentiality impact (per FIPS 199) triggers the most stringent cryptographic requirements. Under CNSA 2.0, High-impact systems face the earliest PQC migration deadlines.',
    relatedModule: '/learn/data-asset-sensitivity',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'FAIR Model',
    acronym: 'FAIR',
    definition:
      'Factor Analysis of Information Risk — a quantitative risk methodology that models cybersecurity risk in financial terms. Decomposes risk into Threat Event Frequency (TEF) and Loss Magnitude to produce Annualized Loss Expectancy (ALE).',
    technicalNote:
      'For PQC, FAIR enables CFOs to compare the cost of migrating now versus the expected financial loss from a post-CRQC breach of harvested data. Key inputs: probability of CRQC by year X, value of data at risk, probability of adversary having collected it.',
    relatedModule: '/learn/data-asset-sensitivity',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Threat Event Frequency',
    acronym: 'TEF',
    definition:
      "A FAIR model component representing how often a threat agent is likely to act against an asset in a given time period. For quantum threats, TEF reflects the probability of a capable CRQC existing and being wielded against a specific organisation's harvested data.",
    relatedModule: '/learn/data-asset-sensitivity',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Annualized Loss Expectancy',
    acronym: 'ALE',
    definition:
      'A FAIR and traditional risk management metric representing the expected financial loss from a risk over a one-year period. Calculated as Annual Rate of Occurrence × Single Loss Expectancy. Used in PQC business cases to justify migration investment.',
    relatedModule: '/learn/data-asset-sensitivity',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'ePHI',
    acronym: 'ePHI',
    definition:
      'Electronic Protected Health Information — individually identifiable health information in electronic form, regulated by HIPAA. Any encryption of ePHI using RSA or ECC is vulnerable to HNDL attacks, making ePHI datasets a high-priority PQC migration target.',
    technicalNote:
      'HIPAA does not mandate specific algorithms, but HHS guidance and NIST SP 800-66 recommend using FIPS-validated cryptography. Once FIPS 140-3 validation for ML-KEM and ML-DSA is available, healthcare organisations should adopt them for ePHI at rest and in transit.',
    relatedModule: '/learn/data-asset-sensitivity',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'GDPR',
    acronym: 'GDPR',
    definition:
      'General Data Protection Regulation — EU Regulation 2016/679 requiring appropriate technical and organisational measures to protect personal data. The "appropriate technical measures" clause is interpreted to require state-of-the-art encryption, creating an implicit obligation to migrate to PQC as quantum threats mature.',
    technicalNote:
      'GDPR Art. 32 ("Security of processing") obliges controllers and processors to implement encryption commensurate with the risk. As CRQC timelines become clearer, regulators are expected to interpret Art. 32 as mandating PQC readiness for long-retained personal data.',
    relatedModule: '/learn/data-asset-sensitivity',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'PIPL',
    acronym: 'PIPL',
    definition:
      "Personal Information Protection Law — China's primary data privacy law (effective November 2021), requiring data processors to adopt security measures protecting personal information. Mandates localisation of certain data and restricts cross-border transfers, making PQC migration relevant for multinational organisations with Chinese data subjects.",
    relatedModule: '/learn/data-asset-sensitivity',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'CCPA',
    acronym: 'CCPA',
    definition:
      'California Consumer Privacy Act — U.S. state law (effective 2020, amended by CPRA in 2023) granting California residents rights over their personal data. Data breaches of unencrypted personal information trigger mandatory notification, incentivising strong cryptography including PQC for long-retained data.',
    relatedModule: '/learn/data-asset-sensitivity',
    complexity: 'beginner',
    category: 'standard',
  },
  {
    term: 'LGPD',
    acronym: 'LGPD',
    definition:
      "Lei Geral de Proteção de Dados — Brazil's data protection law (Law 13.709/2018), modelled on GDPR. Requires appropriate technical security measures for personal data. Brazilian DPA (ANPD) guidance on cryptographic adequacy is expected to align with global PQC migration timelines.",
    relatedModule: '/learn/data-asset-sensitivity',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'PDPA',
    acronym: 'PDPA',
    definition:
      "Personal Data Protection Act — Singapore's primary data protection law administered by the PDPC. Requires reasonable security arrangements to protect personal data. Singapore's CSA has published PQC guidance referencing PDPA obligations for organisations managing long-retained personal data.",
    relatedModule: '/learn/data-asset-sensitivity',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'DORA',
    acronym: 'DORA',
    definition:
      "Digital Operational Resilience Act — EU Regulation 2022/2554, applying to financial entities and their ICT service providers from January 2025. Requires ICT risk management, resilience testing, and third-party risk oversight. PQC migration readiness is expected to be assessed under DORA's ICT risk management chapter.",
    technicalNote:
      'DORA Art. 6 mandates a comprehensive ICT risk management framework including cryptographic controls. EBA and ESMA technical standards under DORA are expected to reference ENISA PQC guidance as it matures.',
    relatedModule: '/learn/data-asset-sensitivity',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'Risk Treatment',
    definition:
      'The process of selecting and implementing options to address an identified risk. ISO 27005 defines four treatment options: Mitigate (implement controls), Accept (tolerate the risk), Transfer (insurance/outsource), Avoid (cease the activity). For quantum risk, "Mitigate" means migrating to PQC; "Accept" is only defensible for non-sensitive, short-lived data.',
    relatedModule: '/learn/data-asset-sensitivity',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'PQC Migration Priority',
    definition:
      'A ranked ordering of data assets and cryptographic dependencies by urgency of migration to post-quantum algorithms. Priority is computed from sensitivity tier, HNDL risk window, regulatory obligations, and migration effort, enabling organisations to sequence their migration roadmap rationally.',
    technicalNote:
      'High-priority assets (Critical sensitivity + current HNDL window + regulatory mandate) should be targeted for PQC migration within 12–18 months. Low-priority assets (Low sensitivity + short retention + no mandate) can follow later roadmap phases.',
    relatedModule: '/learn/data-asset-sensitivity',
    complexity: 'intermediate',
    category: 'concept',
  },

  // === Crypto Agility ===
  {
    term: 'ECC',
    acronym: 'ECC',
    definition:
      "Elliptic Curve Cryptography — a public-key cryptosystem based on the algebraic structure of elliptic curves over finite fields. Offers smaller key sizes than RSA for equivalent classical security, but like RSA it is fully broken by Shor's algorithm on a CRQC.",
    technicalNote:
      'Common curves: P-256, P-384, P-521 (NIST), Curve25519 (X25519/Ed25519). ECC is used extensively in TLS, SSH, code signing, and PKI. NIST SP 800-186 and CNSA 2.0 mandate migration away from ECC to ML-KEM and ML-DSA before 2030.',
    relatedModule: '/learn/crypto-agility',
    complexity: 'intermediate',
    category: 'algorithm',
  },
  {
    term: 'Provider Model',
    definition:
      'A software architecture pattern that abstracts cryptographic operations behind an interchangeable provider interface, enabling algorithm substitution without changing application code. Examples: Java JCA/JCE providers, OpenSSL provider API (3.x), PKCS#11 as an HSM provider.',
    technicalNote:
      'The provider model is the primary enabler of crypto agility at the implementation layer. Migrating to PQC in a provider-model architecture requires only a provider swap; migrating in a hard-coded crypto stack requires touching every call site.',
    relatedModule: '/learn/crypto-agility',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Hybrid Migration',
    definition:
      'A PQC transition strategy in which both a classical algorithm and a post-quantum algorithm operate together in the same protocol, providing security even if one algorithm is broken. Hybrid mode is recommended by NIST, ANSSI, BSI, and NCSC for the transition period.',
    technicalNote:
      'In TLS 1.3, hybrid key exchange combines X25519 (classical ECDH) with ML-KEM-768 into the X25519MLKEM768 key share. Security is the stronger of the two algorithms — neither alone can break the session.',
    relatedModule: '/learn/crypto-agility',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'CycloneDX',
    definition:
      'An OWASP standard for Software and Cryptography Bills of Materials (SBOM/CBOM). CycloneDX v1.6 introduced the Cryptography Asset type, enabling machine-readable inventory of all cryptographic algorithms, keys, certificates, and protocols in a system.',
    technicalNote:
      'CycloneDX CBOM components include: algorithms (name, parameterSets, primitive), certificates (subject, validity, signatureAlgorithm), keys (algorithm, size), and protocols (type, version, cipher suites). Tooling: IBM Quantum Safe Explorer, Keyfactor.',
    relatedModule: '/learn/crypto-agility',
    complexity: 'intermediate',
    category: 'standard',
  },

  // === Vendor Risk ===
  {
    term: 'Vendor PQC Readiness',
    definition:
      "An assessment of a technology vendor's progress toward supporting post-quantum cryptographic algorithms across their product portfolio. Evaluated across dimensions: algorithm support, FIPS validation status, CBOM availability, migration documentation, SLA commitments, and estimated delivery timeline.",
    technicalNote:
      'A vendor readiness scorecard typically weights: PQC algorithm support (30%), FIPS 140-3 validation status (25%), migration tooling (20%), contractual commitments (15%), and timeline certainty (10%). Low vendor readiness is itself a supply chain risk.',
    relatedModule: '/learn/vendor-risk',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'CMVP',
    acronym: 'CMVP',
    definition:
      'Cryptographic Module Validation Program — a joint NIST and CCCS program that tests cryptographic modules against FIPS 140-3 requirements. Validated modules appear on the NIST CMVP Active Validations list with a certificate number, providing formal assurance of implementation correctness.',
    technicalNote:
      'PQC FIPS 140-3 validation for ML-KEM (FIPS 203) and ML-DSA (FIPS 204) modules began in 2024. Validation cycles take 12–18 months; procurement requiring FIPS 140-3 validated PQC must account for this lag. Check: csrc.nist.gov/projects/cmvp.',
    relatedModule: '/learn/vendor-risk',
    complexity: 'intermediate',
    category: 'organization',
  },
  {
    term: 'Supply Chain Cryptographic Risk',
    definition:
      "The risk that a third-party component, library, or service introduces quantum-vulnerable cryptography into an organisation's systems. When a vendor's HSM, TLS terminator, or signing service lacks PQC support, the organisation's own migration is blocked regardless of internal readiness.",
    technicalNote:
      'Mitigation requires: (1) CBOM from all critical vendors, (2) contractual PQC migration milestones and SLAs, (3) infrastructure layer dependency mapping to identify single points of failure, (4) alternate vendor qualification where PQC timelines are misaligned.',
    relatedModule: '/learn/vendor-risk',
    complexity: 'intermediate',
    category: 'concept',
  },

  // === HSM PQC ===
  {
    term: 'LMS',
    acronym: 'LMS',
    definition:
      'Leighton-Micali Signature — a stateful hash-based signature scheme standardised in NIST SP 800-208 and RFC 8554. Based on one-time Lamport signatures aggregated via a Merkle tree. Approved by CNSA 2.0 for firmware and software signing.',
    technicalNote:
      'LMS is stateful: each leaf in the Merkle tree can only be used once. An HSM must persist the current leaf index in NVRAM and never reuse it — failure leads to catastrophic key compromise. LMS key sizes: ~1,616 bytes (pub) to 64 bytes (priv). PKCS#11 v3.2 mechanism: CKM_LMS.',
    relatedModule: '/learn/hsm-pqc',
    complexity: 'advanced',
    category: 'algorithm',
  },
  {
    term: 'Stateful Signature State Management',
    definition:
      'The operational requirement to persist and atomically update the one-time-key index used by stateful hash-based signature schemes (LMS/HSS, XMSS). If state is lost (power failure, backup restore, HSM cloning) or reused, the signing key is permanently compromised.',
    technicalNote:
      'HSMs address this with NVRAM write-ahead logging and strict prohibition on key export. Cloud HSMs introduce additional complexity: multi-replica deployments must use a single authoritative state source, not distributed state. NIST SP 800-208 §6 covers state management requirements.',
    relatedModule: '/learn/hsm-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Hedged Signing',
    definition:
      'A signing mode for ML-DSA (FIPS 204) that incorporates additional randomness alongside the deterministic component, providing protection against fault injection and side-channel attacks that attempt to recover the private key by manipulating the signing process.',
    technicalNote:
      'FIPS 204 §3.5.2 defines both deterministic and hedged signing. Hedged mode uses a random seed r in addition to the message and key. HSM implementations should prefer hedged mode for ML-DSA to protect against physical attack vectors that are in-scope for FIPS 140-3 Level 3/4.',
    relatedModule: '/learn/hsm-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Tamper Resistance',
    definition:
      'A hardware security property where a device actively detects and responds to physical intrusion attempts by zeroising sensitive key material. Defined at FIPS 140-3 Security Levels 3 and 4. An HSM with tamper resistance destroys keys if the enclosure is breached.',
    technicalNote:
      'Level 3: tamper-evident seals plus voltage/temperature attack response. Level 4: full environmental attack protection including X-ray and focused ion beam. PQC keys in Level 3+ HSMs are protected even under sophisticated laboratory attacks.',
    relatedModule: '/learn/hsm-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'CAVP',
    acronym: 'CAVP',
    definition:
      'Cryptographic Algorithm Validation Program — the NIST/CCCS program that tests algorithm-level correctness of cryptographic implementations using the ACVP protocol. CAVP validation is a prerequisite for FIPS 140-3 module validation under CMVP.',
    technicalNote:
      'ML-KEM (FIPS 203), ML-DSA (FIPS 204), and SLH-DSA (FIPS 205) algorithm test vectors are available via ACVP since 2024. Vendors must pass CAVP algorithm tests before submitting a module for full CMVP evaluation.',
    relatedModule: '/learn/hsm-pqc',
    complexity: 'advanced',
    category: 'standard',
  },

  // === PQC Risk Management ===
  {
    term: 'Risk Register',
    definition:
      'A structured document that records identified risks, their likelihood, potential impact, current controls, and treatment decisions. For PQC, the risk register captures each quantum-vulnerable cryptographic asset, the HNDL exposure window, and the planned migration action with owner and deadline.',
    technicalNote:
      'A PQC risk register entry typically includes: asset name, algorithm in use, data sensitivity, retention period, HNDL risk year, likelihood score (1–5), impact score (1–5), risk level (L×I), treatment decision, target migration date, and responsible owner.',
    relatedModule: '/learn/pqc-risk-management',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Risk Heatmap',
    definition:
      'A 5×5 grid visualisation plotting risks by likelihood (y-axis) and impact (x-axis). Cells are colour-coded green to red to indicate overall risk level. Used in PQC risk management to communicate prioritisation of quantum-vulnerable assets to executive stakeholders.',
    technicalNote:
      'Standard thresholds: Low (1–4), Medium (5–9), High (10–16), Critical (17–25). Quantum risks trend toward high impact (full plaintext exposure) with increasing likelihood as CRQC timelines advance. The heatmap should be reassessed annually as CRQC estimates evolve.',
    relatedModule: '/learn/pqc-risk-management',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Cryptographic Exposure Window',
    definition:
      "The period during which an organisation's classically-encrypted data is at risk of retrospective decryption, spanning from the date of data collection to the date PQC migration is complete. Adversaries exploiting HNDL attacks capture data now to decrypt once a CRQC is available.",
    technicalNote:
      'Reducing the exposure window requires either (a) completing PQC migration before the CRQC arrives, or (b) ensuring data reaches end-of-life before the CRQC arrives. Long-lived assets (health records, intellectual property, identity credentials) have the widest windows.',
    relatedModule: '/learn/pqc-risk-management',
    complexity: 'intermediate',
    category: 'concept',
  },
  // === Confidential Computing ===
  {
    term: 'SGX',
    acronym: 'SGX',
    definition:
      'Intel Software Guard Extensions, a set of CPU instructions for creating hardware-isolated enclaves within user-space processes. Provides process-level TEE with encrypted memory (EPC).',
    technicalNote:
      'SGX uses DCAP attestation with ECDSA P-256, which is quantum-vulnerable. PQC attestation key migration is planned for 2027.',
    relatedModule: '/learn/confidential-computing',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'SEV-SNP',
    acronym: 'SEV-SNP',
    definition:
      'AMD Secure Encrypted Virtualization with Secure Nested Paging, providing VM-level memory encryption and integrity protection with a Reverse Map Table to prevent hypervisor-based attacks.',
    technicalNote:
      'Uses ECDSA P-384 VCEK certificates for attestation (quantum-vulnerable). AES-XTS-128 memory encryption is subject to Grover halving.',
    relatedModule: '/learn/confidential-computing',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'ARM CCA',
    acronym: 'CCA',
    definition:
      'ARM Confidential Compute Architecture, introducing Realms as isolated VM-like execution environments. Reduces TCB by separating the hypervisor from trusted firmware via a Realm Management Monitor.',
    relatedModule: '/learn/confidential-computing',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Enclave',
    definition:
      'An isolated execution environment within a TEE where code and data are protected from the operating system, hypervisor, and other processes. Memory is encrypted and inaccessible to external entities.',
    relatedModule: '/learn/confidential-computing',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Remote Attestation',
    definition:
      'A cryptographic protocol that proves to a remote verifier that software is running inside a genuine TEE with specific measurements (code identity, configuration). All current implementations use ECDSA, which is quantum-vulnerable.',
    relatedModule: '/learn/confidential-computing',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Sealing Key',
    definition:
      'A TEE-derived encryption key used to persist data outside the enclave boundary. Derived from platform root keys and enclave identity measurements, ensuring only the same enclave on the same platform can unseal the data.',
    relatedModule: '/learn/confidential-computing',
    complexity: 'advanced',
    category: 'concept',
  },

  // === Platform Engineering & PQC ===
  {
    term: 'cosign',
    definition:
      'An OCI-native container image signing tool from the Sigstore project. Signs images by attaching ECDSA P-256 (currently) or ML-DSA (roadmap 2026) signatures as OCI referrers in the registry. Supports keyless signing via OIDC identity binding with the Rekor transparency log.',
    relatedModule: '/learn/platform-eng-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Notation',
    definition:
      'A CNCF OCI artifact signing tool that supports any OCI artifact (images, Helm charts, SBOMs) using X.509 certificate-backed signatures. Notation v1.3+ supports ML-DSA-65 via the AWS Crypto Tools plugin, making it the first production-grade PQC container signing solution.',
    relatedModule: '/learn/platform-eng-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Sigstore',
    definition:
      'An open-source project and Linux Foundation initiative providing free, transparent software signing infrastructure. Components include cosign (signing), Rekor (transparency log), and Fulcio (certificate authority). All components are being migrated to ML-DSA for quantum safety.',
    relatedModule: '/learn/platform-eng-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'SLSA',
    acronym: 'Supply chain Levels for Software Artifacts',
    definition:
      'A NIST-aligned security framework for software supply chain integrity. Four levels of build provenance requirements. SLSA Level 3+ requires ML-DSA or SLH-DSA signatures for build provenance attestations in the post-quantum era.',
    relatedModule: '/learn/platform-eng-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'SBOM',
    acronym: 'Software Bill of Materials',
    definition:
      'A machine-readable inventory of all software components in an artifact. SBOMs are attested with cryptographic signatures using DSSE format. SLH-DSA is preferred for SBOM signatures due to its stateless nature and suitability for 20+ year validity periods.',
    relatedModule: '/learn/platform-eng-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'OPA (Open Policy Agent)',
    definition:
      'A general-purpose policy engine that evaluates decisions against a defined policy (written in Rego). In Kubernetes, OPA Gatekeeper uses ConstraintTemplates to block admission of resources with quantum-vulnerable algorithm identifiers in cert-manager Certificate or Deployment resources.',
    relatedModule: '/learn/platform-eng-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Kyverno',
    definition:
      'A Kubernetes-native policy engine that validates, mutates, and generates resources using YAML-based ClusterPolicies. Used to enforce PQC requirements: blocking unsigned or ECDSA-only container images, requiring ML-DSA image signatures, and enforcing X-Wing cipher suites on Ingress resources.',
    relatedModule: '/learn/platform-eng-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Crypto Posture',
    definition:
      "A continuous measure of an organization's cryptographic health — the proportion of systems using quantum-safe algorithms versus quantum-vulnerable ones. Tracked via Prometheus metrics, SIEM queries, and CBOM scans. Degrades over time as new classical-algorithm resources are provisioned without PQC config.",
    relatedModule: '/learn/platform-eng-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Algorithm Drift',
    definition:
      'The gradual re-introduction of quantum-vulnerable algorithms into infrastructure after initial PQC migration — caused by CA fallback, operator error, or default IaC configurations. Detected via Prometheus alert rules and SIEM queries targeting classical algorithm identifiers.',
    relatedModule: '/learn/platform-eng-pqc',
    complexity: 'advanced',
    category: 'concept',
  },

  // === Web Gateway PQC ===
  {
    term: 'TLS Termination',
    definition:
      'The process of decrypting TLS-encrypted traffic at a gateway device (load balancer, reverse proxy, WAF, or CDN edge) rather than at the origin server. The gateway handles certificate management, handshake processing, and re-encryption for backend connections.',
    technicalNote:
      'PQC migration at the TLS termination point is the highest-impact upgrade path because it protects the most exposed network segment (client-to-edge) without requiring changes to backend infrastructure.',
    relatedModule: '/learn/web-gateway-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Reverse Proxy',
    definition:
      'A server that sits between clients and origin servers, forwarding client requests and returning responses on behalf of the origin. It provides TLS termination, load balancing, caching, and security filtering.',
    technicalNote:
      'Common reverse proxies include NGINX, HAProxy, Envoy, and Traefik. PQC readiness varies by product — NGINX Plus R32+ and HAProxy 3.1+ support ML-KEM hybrid TLS via OpenSSL 3.5.',
    relatedModule: '/learn/web-gateway-pqc',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Edge PoP',
    acronym: 'PoP',
    definition:
      'A Point of Presence — a physical data center location at the network edge where CDN or cloud providers deploy servers to cache content and terminate TLS connections close to end users.',
    technicalNote:
      'Major CDNs operate 200-300+ PoPs globally. PQC deployment at edge PoPs requires coordinated key material distribution and certificate rotation across all locations simultaneously.',
    relatedModule: '/learn/web-gateway-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Origin Shielding',
    definition:
      'A CDN architecture pattern where a designated intermediate cache layer sits between edge PoPs and the origin server, reducing direct origin requests and providing a single point for TLS termination upgrades.',
    technicalNote:
      'Origin shielding simplifies PQC migration by limiting the number of connections to the origin that need PQC upgrade — only the shield-to-origin link requires immediate attention.',
    relatedModule: '/learn/web-gateway-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Cipher Proxy',
    definition:
      'A network device that transparently translates between different cipher suites on each side of a connection, enabling PQC on the external-facing side while maintaining classical TLS on internal connections.',
    technicalNote:
      'Palo Alto PAN-OS 12.1+ implements cipher proxy for PQC, automatically translating ML-KEM hybrid handshakes to classical TLS for backend servers without requiring application changes.',
    relatedModule: '/learn/web-gateway-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Connection Coalescing',
    definition:
      'An HTTP/2 and HTTP/3 optimization where a single TLS connection is reused for requests to multiple hostnames sharing the same IP address and TLS certificate, amortizing PQC handshake overhead across domains.',
    technicalNote:
      'With PQC hybrid handshakes adding 10-20KB overhead, connection coalescing becomes a critical mitigation — reducing the number of handshakes proportionally reduces total bandwidth impact.',
    relatedModule: '/learn/web-gateway-pqc',
    complexity: 'advanced',
    category: 'protocol',
  },
  {
    term: 'TLS Interception',
    definition:
      'A security technique where a middlebox (WAF, DLP, IDS) terminates, inspects, and re-establishes TLS connections to examine encrypted traffic for threats. Also called TLS inspection or SSL inspection.',
    technicalNote:
      'TLS interception devices must support the same cipher suites as both client and server. PQC hybrid handshakes require all inspection boxes in the path to be upgraded simultaneously.',
    relatedModule: '/learn/web-gateway-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'SASE',
    acronym: 'SASE',
    definition:
      'Secure Access Service Edge — a cloud-delivered architecture combining network security functions (SWG, CASB, ZTNA, FWaaS) with WAN capabilities, delivered as a unified service at the network edge.',
    technicalNote:
      'SASE platforms like Zscaler and Palo Alto Prisma Access terminate and inspect TLS at cloud PoPs. PQC migration requires the SASE provider to upgrade their inspection infrastructure to support hybrid handshakes.',
    relatedModule: '/learn/web-gateway-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },

  // === Energy & Utilities ===
  {
    term: 'NERC CIP',
    acronym: 'NERC CIP',
    definition:
      'North American Electric Reliability Corporation Critical Infrastructure Protection standards. Mandatory cybersecurity requirements for bulk electric system operators.',
    technicalNote:
      'CIP-012 mandates encrypted inter-control-center communications (ICCP/TASE.2) — the highest-priority PQC migration target in the energy sector. CIP-013 requires supply chain risk management including vendor PQC readiness.',
    relatedModule: '/learn/energy-utilities-pqc',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'IEC 61850',
    definition:
      'International standard for communication networks and systems in substations. Defines GOOSE, MMS, and Sampled Values protocols for protection and control.',
    technicalNote:
      'GOOSE messages have a 4ms delivery requirement for protection relay tripping. HMAC authentication is quantum-safe, but asymmetric key distribution for HMAC seeds requires PQC migration.',
    relatedModule: '/learn/energy-utilities-pqc',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'IEC 62351',
    definition:
      'Power systems management and associated information exchange — security standard. Covers TLS profiles, GOOSE authentication, and key management for power systems.',
    technicalNote:
      'Part 3 covers TCP/IP security (TLS for MMS/ICCP), Part 6 covers GOOSE peer-to-peer authentication using HMAC, and Part 9 defines key management architecture for power systems.',
    relatedModule: '/learn/energy-utilities-pqc',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'GOOSE',
    acronym: 'GOOSE',
    definition:
      'Generic Object Oriented Substation Event. A high-speed multicast protocol in IEC 61850 for protection relay tripping with 4ms delivery requirements.',
    technicalNote:
      'GOOSE uses HMAC-SHA256 for per-message authentication (quantum-safe). The quantum vulnerability lies in the RSA-based key distribution channel that seeds the HMAC keys.',
    relatedModule: '/learn/energy-utilities-pqc',
    complexity: 'advanced',
    category: 'protocol',
  },
  {
    term: 'DNP3-SA',
    acronym: 'DNP3-SA',
    definition:
      'DNP3 Secure Authentication (IEEE 1815.1). Challenge-response authentication for SCADA using HMAC-SHA256 with pre-shared Update Keys.',
    technicalNote:
      'Session authentication uses HMAC (quantum-safe). PQC impacts the RSA-based Update Key distribution. ML-KEM-768 ciphertext (1088 bytes) fits within DNP3 2048-byte fragment limit — a clean single-fragment migration.',
    relatedModule: '/learn/energy-utilities-pqc',
    complexity: 'advanced',
    category: 'protocol',
  },
  {
    term: 'DLMS/COSEM',
    acronym: 'DLMS/COSEM',
    definition:
      'Device Language Message Specification / Companion Specification for Energy Metering. Used globally for smart meter communication with security suites based on AES and ECDSA/ECDH.',
    technicalNote:
      'Security Suite 1 uses AES-GCM-128 + ECDSA P-256 + ECDH P-256. PQC key exchange (ML-KEM-768 at 1088 bytes vs ECDH at 33 bytes) creates a 33x bandwidth increase that is significant at scale for millions of meters.',
    relatedModule: '/learn/energy-utilities-pqc',
    complexity: 'advanced',
    category: 'protocol',
  },
  {
    term: 'IEEE 2030.5',
    definition:
      'Smart Energy Profile 2.0 standard for distributed energy resource communication using certificate-based device authentication.',
    technicalNote:
      'Each DER (solar inverter, battery, EV charger) has a unique IEEE 2030.5 device certificate signed by the utility CA. Fleet-wide PQC certificate reissuance is required for migration.',
    relatedModule: '/learn/energy-utilities-pqc',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'BES',
    acronym: 'BES',
    definition:
      'Bulk Electric System. The interconnected electrical generation and transmission resources subject to NERC reliability standards.',
    relatedModule: '/learn/energy-utilities-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'IED',
    acronym: 'IED',
    definition:
      'Intelligent Electronic Device. Microprocessor-based controllers in substations (protection relays, bay controllers) with 20-25 year lifecycles.',
    technicalNote:
      'IEDs deployed in 2026 will operate until 2046-2051. Any cryptographic algorithms selected today must survive CRQC arrival. Firmware updates often require physical site visits.',
    relatedModule: '/learn/energy-utilities-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'ICCP/TASE.2',
    acronym: 'ICCP',
    definition:
      'Inter-Control Center Communications Protocol. Used for real-time data exchange between utility control centers, secured via TLS.',
    technicalNote:
      'ICCP links are internet-facing and carry real-time grid state data — the highest-priority PQC migration target under NERC CIP-012.',
    relatedModule: '/learn/energy-utilities-pqc',
    complexity: 'advanced',
    category: 'protocol',
  },
  {
    term: 'DER',
    acronym: 'DER',
    definition:
      'Distributed Energy Resource. Solar inverters, battery storage systems, and EV chargers connected to the distribution grid.',
    technicalNote:
      'DERs authenticate via IEEE 2030.5 certificates (ECDSA P-256). PQC migration requires fleet-wide certificate reissuance to ML-DSA-65.',
    relatedModule: '/learn/energy-utilities-pqc',
    complexity: 'beginner',
    category: 'concept',
  },
  // ── Healthcare PQC Module Terms ──────────────────────────────────────────
  {
    term: 'Biometric Template',
    definition:
      'A mathematical representation of a biometric characteristic (fingerprint minutiae, iris code, facial feature vector) stored for matching. Unlike passwords, biometric templates cannot be revoked or reissued if compromised, making them the highest-priority target for Harvest Now, Decrypt Later attacks.',
    relatedModule: '/learn/healthcare-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Biometric Permanence',
    definition:
      'The property that distinguishes biometric data from all other credentials: once compromised, the underlying biometric characteristic cannot be changed. A quantum-decrypted fingerprint template is permanently exposed, unlike a password or certificate that can be rotated.',
    relatedModule: '/learn/healthcare-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'GINA',
    acronym: 'GINA',
    definition:
      'Genetic Information Nondiscrimination Act (2008). US federal law prohibiting discrimination based on genetic information in health insurance and employment. Genetic data decrypted via HNDL attacks could enable discrimination that GINA was designed to prevent.',
    relatedModule: '/learn/healthcare-pqc',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: '42 CFR Part 2',
    definition:
      'US federal regulation providing additional privacy protections for substance use disorder patient records beyond HIPAA. Records protected under Part 2 carry heightened stigma risk if quantum-decrypted, as disclosure can lead to criminal prosecution, employment loss, and social ostracism.',
    relatedModule: '/learn/healthcare-pqc',
    complexity: 'advanced',
    category: 'standard',
  },
  {
    term: 'IoMT',
    acronym: 'IoMT',
    definition:
      'Internet of Medical Things. Network-connected medical devices including infusion pumps, cardiac monitors, and surgical robots. IoMT devices combine the constrained-resource challenges of IoT with the safety-critical requirements of medical devices, creating unique PQC migration challenges.',
    relatedModule: '/learn/healthcare-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'DICOM',
    acronym: 'DICOM',
    definition:
      'Digital Imaging and Communications in Medicine. The standard protocol for transmitting, storing, and sharing medical images (X-ray, CT, MRI). DICOM supports TLS for transport security; PQC migration requires updating both the transport layer and any encrypted archives of imaging data.',
    relatedModule: '/learn/healthcare-pqc',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: '21 CFR Part 11',
    definition:
      'FDA regulation establishing criteria for electronic records and electronic signatures in the pharmaceutical industry. Requires validated cryptographic controls for data integrity. Any PQC migration in pharma must maintain Part 11 compliance throughout the transition.',
    relatedModule: '/learn/healthcare-pqc',
    complexity: 'advanced',
    category: 'standard',
  },
  // ── EMV Payment PQC Module Terms ──────────────────────────────────────────
  {
    term: 'SDA',
    acronym: 'SDA',
    definition:
      'Static Data Authentication. The simplest EMV card authentication method where the issuer pre-signs static card data with RSA. Vulnerable to card cloning since the signature never changes.',
    technicalNote:
      'SDA uses a single RSA signature over static data. A terminal verifies this signature against the issuer CA certificate chain. Being deprecated in favor of DDA/CDA.',
    relatedModule: '/learn/emv-payment-pqc',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'DDA',
    acronym: 'DDA',
    definition:
      'Dynamic Data Authentication. An EMV card authentication method where the card generates a unique RSA signature per transaction, preventing cloning attacks.',
    technicalNote:
      'DDA requires the card chip to perform RSA signing using its private key. The terminal verifies via the EMVCo CA certificate chain (Root \u2192 Network CA \u2192 Issuer CA \u2192 ICC).',
    relatedModule: '/learn/emv-payment-pqc',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'CDA',
    acronym: 'CDA',
    definition:
      'Combined Data Authentication. The strongest EMV offline authentication method, combining dynamic RSA signature with the application cryptogram in a single operation.',
    technicalNote:
      'CDA binds the authentication and transaction authorization into one cryptographic operation, preventing man-in-the-middle attacks between card and terminal. Most modern EMV cards use CDA.',
    relatedModule: '/learn/emv-payment-pqc',
    complexity: 'advanced',
    category: 'protocol',
  },
  {
    term: 'Token Service Provider',
    acronym: 'TSP',
    definition:
      'A payment network service that replaces primary account numbers with unique tokens for mobile and e-commerce transactions. Major TSPs include Visa VTS, Mastercard MDES, and Amex EST.',
    technicalNote:
      'TSPs use TLS for enrollment, ECDSA for device attestation, RSA/AES for key wrapping, and AES-256 for per-transaction cryptogram generation. PQC migration must address the asymmetric crypto touchpoints.',
    relatedModule: '/learn/emv-payment-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'ARQC',
    acronym: 'ARQC',
    definition:
      'Authorization Request Cryptogram. A symmetric MAC generated by the EMV card chip using a shared secret with the issuer, proving the card is genuine during online authorization.',
    technicalNote:
      'ARQC uses 3DES or AES-based MAC computation with issuer-derived session keys. Being a symmetric operation, ARQC generation is inherently quantum-safe.',
    relatedModule: '/learn/emv-payment-pqc',
    complexity: 'advanced',
    category: 'protocol',
  },
  {
    term: 'ARPC',
    acronym: 'ARPC',
    definition:
      'Authorization Response Cryptogram. A symmetric MAC generated by the issuer in response to an ARQC, proving the issuer authorized the transaction.',
    technicalNote:
      'ARPC is the issuer-to-card counterpart of ARQC. Together they form a mutual authentication mechanism. Both use symmetric crypto and are quantum-safe.',
    relatedModule: '/learn/emv-payment-pqc',
    complexity: 'advanced',
    category: 'protocol',
  },
  {
    term: 'Key Injection Facility',
    acronym: 'KIF',
    definition:
      'A physically secured facility where cryptographic keys are loaded into payment terminals under dual-control, split-knowledge procedures.',
    technicalNote:
      'The KIF is the primary quantum-vulnerable point in the DUKPT chain. RSA-2048 key transport wraps the BDK for transfer to injection stations. PQC migration replaces this with ML-KEM-768 key encapsulation.',
    relatedModule: '/learn/emv-payment-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Base Derivation Key',
    acronym: 'BDK',
    definition:
      'The master symmetric key in the DUKPT key management scheme, stored in a payment HSM. All per-terminal and per-transaction keys are derived from it.',
    technicalNote:
      'The BDK never leaves the HSM in cleartext. Compromising the RSA-wrapped BDK at the Key Injection Facility would allow derivation of all past and future transaction keys for terminals sharing that BDK.',
    relatedModule: '/learn/emv-payment-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'PAN',
    acronym: 'PAN',
    definition:
      'Primary Account Number. The 16-19 digit card number on a payment card, used to identify the cardholder account.',
    technicalNote:
      'Tokenization replaces the PAN with a non-sensitive token for mobile and e-commerce transactions, reducing the attack surface if intercepted.',
    relatedModule: '/learn/emv-payment-pqc',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: '3-D Secure',
    acronym: '3DS',
    definition:
      'A payment authentication protocol for card-not-present (e-commerce) transactions. Version 2.0 uses ECDSA challenge signing and risk-based authentication.',
    technicalNote:
      '3DS 2.0 challenge signatures use ECDSA P-256, which is quantum-vulnerable. The frictionless flow relies on device fingerprinting and behavioral analysis (quantum-safe). PQC migration targets the challenge signing component.',
    relatedModule: '/learn/emv-payment-pqc',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'SoftPOS',
    definition:
      'Software-based point-of-sale that turns a standard smartphone into a contactless payment terminal using NFC, without dedicated payment hardware.',
    technicalNote:
      'SoftPOS relies on TEE (TrustZone) and device attestation (ECDSA) for security. With abundant compute resources, it is the easiest terminal type to migrate to PQC via app updates.',
    relatedModule: '/learn/emv-payment-pqc',
    complexity: 'beginner',
    category: 'concept',
  },
  // === Aerospace & Space PQC ===
  {
    term: 'ACARS',
    acronym: 'ACARS',
    definition:
      'Aircraft Communications Addressing and Reporting System. A digital data link for transmitting short messages between aircraft and ground stations via VHF radio or SATCOM.',
    technicalNote:
      'ACARS messages are limited to 220-byte blocks. ML-DSA-65 signatures (3,309 bytes) require 15+ blocks, making in-band PQC authentication infeasible without protocol redesign or gateway-mediated signing.',
    relatedModule: '/learn/aerospace-space-pqc',
    complexity: 'advanced',
    category: 'protocol',
  },
  {
    term: 'ARINC 653',
    definition:
      'Avionics Application Standard Software Interface (ARINC 653). An RTOS partitioning standard that isolates safety-critical software functions in separate memory/time partitions on shared hardware.',
    technicalNote:
      'Each ARINC 653 partition has a fixed memory budget (typically 1-4 MB) and CPU time window. PQC libraries must fit within these constraints alongside existing avionics functions, limiting algorithm choice.',
    relatedModule: '/learn/aerospace-space-pqc',
    complexity: 'advanced',
    category: 'standard',
  },
  {
    term: 'DO-178C',
    definition:
      'Software Considerations in Airborne Systems and Equipment Certification. The primary standard for certifying safety-critical avionics software, defining five Design Assurance Levels (DAL A through E).',
    technicalNote:
      'Adding a PQC cryptographic library to a DAL-A system (e.g., Flight Management System) requires MC/DC test coverage, traceability, and independent verification. Recertification costs $2-10M and takes 12-24 months.',
    relatedModule: '/learn/aerospace-space-pqc',
    complexity: 'advanced',
    category: 'standard',
  },
  {
    term: 'DO-326A',
    definition:
      'Airworthiness Security Process Specification. The FAA/EASA standard for addressing cybersecurity threats to airborne systems, requiring threat assessment and security controls for type certification.',
    technicalNote:
      'DO-326A mandates that cryptographic protections be evaluated against evolving threats including quantum computing. Aircraft manufacturers must demonstrate PQC readiness as part of the airworthiness security risk assessment.',
    relatedModule: '/learn/aerospace-space-pqc',
    complexity: 'advanced',
    category: 'standard',
  },
  {
    term: 'CPDLC',
    acronym: 'CPDLC',
    definition:
      'Controller-Pilot Data Link Communications. A text-based ATC communication system replacing voice with structured data messages between pilots and air traffic controllers.',
    technicalNote:
      'CPDLC operates over SATCOM with 600ms RTT and supports up to 1,024-byte messages. PQC signature authentication is feasible (ML-DSA-44 fits in 3 blocks) but adds latency to safety-critical ATC clearances.',
    relatedModule: '/learn/aerospace-space-pqc',
    complexity: 'advanced',
    category: 'protocol',
  },
  {
    term: 'Single-Event Upset',
    acronym: 'SEU',
    definition:
      'A change of state in a digital circuit caused by a single ionizing particle (cosmic ray or solar proton) striking a sensitive node, flipping one or more bits in memory or registers.',
    technicalNote:
      'SEUs can corrupt PQC private key material stored in spacecraft memory. Lattice-based keys (ML-KEM, ML-DSA) are particularly vulnerable due to large key sizes. Hash-based signatures (LMS/XMSS) are more resilient because verification reconstructs from public data.',
    relatedModule: '/learn/aerospace-space-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Rad-Hardened Processor',
    definition:
      'A microprocessor designed to operate in high-radiation environments (space, nuclear facilities) with protection against single-event effects, total ionizing dose, and latch-up.',
    technicalNote:
      'Rad-hard processors (RAD750 at 200 MHz, GR740 at 250 MHz) lag commercial silicon by 2-4 generations. Their limited clock speed, RAM (256 KB to 256 MB), and instruction sets constrain PQC algorithm performance.',
    relatedModule: '/learn/aerospace-space-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Line-Replaceable Unit',
    acronym: 'LRU',
    definition:
      'A modular avionics component designed to be quickly swapped on an aircraft during maintenance without extensive disassembly, enabling field-level repairs.',
    technicalNote:
      'LRU replacement is the primary mechanism for upgrading aircraft crypto hardware. Legacy LRUs certified under DO-178B may lack the flash/RAM capacity for PQC libraries. New LRUs require full DO-178C recertification.',
    relatedModule: '/learn/aerospace-space-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'International Traffic in Arms Regulations',
    acronym: 'ITAR',
    definition:
      'US export control regulations (22 CFR 120-130) governing the export and transfer of defense articles and services, including military cryptographic systems listed on the US Munitions List.',
    technicalNote:
      'ITAR Category XI covers military cryptographic equipment. PQC implementations for military aircraft or defense satellites require State Department export licenses. No license exceptions exist for embargoed destinations.',
    relatedModule: '/learn/aerospace-space-pqc',
    complexity: 'advanced',
    category: 'standard',
  },
  {
    term: 'ADS-B',
    acronym: 'ADS-B',
    definition:
      'Automatic Dependent Surveillance-Broadcast. A surveillance system where aircraft broadcast their GPS-derived position, altitude, and velocity on 1090 MHz, receivable by ground stations and other aircraft.',
    technicalNote:
      'ADS-B transmits unauthenticated 112-bit messages (14 bytes payload) with no encryption or signing. The message size is far too small for any PQC signature. Authentication requires out-of-band verification or protocol redesign.',
    relatedModule: '/learn/aerospace-space-pqc',
    complexity: 'advanced',
    category: 'protocol',
  },
  // === AI Security & PQC ===
  {
    term: 'Training Data Poisoning',
    definition:
      "An attack where adversaries inject malicious or manipulated samples into an AI model's training dataset to corrupt its behavior, produce biased outputs, or introduce backdoors.",
    technicalNote:
      'PQC relevance: ML-DSA signatures on training data manifests create tamper-evident data pipelines. Without cryptographic provenance, poisoned data is indistinguishable from legitimate data. HNDL attackers could harvest encrypted training data today and reconstruct proprietary datasets once quantum computers arrive.',
    relatedModule: '/learn/ai-security-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Model Weights',
    definition:
      "The learned numerical parameters of a neural network that encode the model's knowledge. For large language models, weights can number in the hundreds of billions and represent millions of dollars in compute investment.",
    technicalNote:
      'Model weights are the crown jewels of AI IP. Protection requires encryption at rest (ML-KEM key wrapping), in transit (hybrid TLS), and potentially in use (TEE inference). ML-DSA model signing provides integrity verification analogous to code signing.',
    relatedModule: '/learn/ai-security-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Model Collapse',
    definition:
      'A degenerative process where AI models trained on AI-generated data progressively lose quality, diversity, and accuracy over successive generations, eventually producing incoherent or repetitive outputs.',
    technicalNote:
      'Model collapse is a statistical inevitability when synthetic data contaminates training corpora without provenance verification. Cryptographic content credentials (C2PA) and ML-DSA-signed data manifests can distinguish human-created from AI-generated training data, preserving model quality.',
    relatedModule: '/learn/ai-security-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Content Credentials',
    acronym: 'C2PA',
    definition:
      'A technical standard by the Coalition for Content Provenance and Authenticity that embeds cryptographically signed metadata into digital content to verify its origin, creation method, and edit history.',
    technicalNote:
      'C2PA uses X.509 certificates and CMS signatures to create tamper-evident provenance chains. Current implementations use ECDSA/RSA — quantum-vulnerable. Migration to ML-DSA signatures is needed to ensure provenance claims remain trustworthy beyond Q-Day.',
    relatedModule: '/learn/ai-security-pqc',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'Agentic AI',
    definition:
      'AI systems that can autonomously plan, make decisions, and take actions in the real world — including accessing services, making purchases, and communicating with other AI agents on behalf of users.',
    technicalNote:
      'Agentic AI requires machine identity credentials (X.509 certs or JWT tokens) for authentication, delegation tokens for authority chaining, and signed transaction records for non-repudiation. All classical signing schemes are quantum-vulnerable; PQC migration must cover agent credential lifecycles.',
    relatedModule: '/learn/ai-security-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Delegation Token',
    definition:
      'A cryptographically signed credential that grants an AI agent limited authority to act on behalf of a user or another agent, with specified scope, duration, and capability constraints.',
    technicalNote:
      'Delegation chains (Human → Agent → Sub-agent → Service) require each link to be signed. Classical ECDSA delegation tokens are quantum-vulnerable for their entire validity period. ML-DSA delegation tokens provide quantum-safe authority chaining with larger but acceptable signature sizes.',
    relatedModule: '/learn/ai-security-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Agent-to-Agent Authentication',
    acronym: 'A2A',
    definition:
      'Mutual authentication between autonomous AI agents using cryptographic credentials, enabling secure communication, task delegation, and transaction execution without human intermediation.',
    technicalNote:
      'A2A authentication typically uses mTLS with PQC certificates (ML-DSA for signing, ML-KEM for key exchange). Per-message signing adds bandwidth overhead — at 10K messages/second, ML-DSA-65 signatures add significant bandwidth compared to ECDSA, requiring careful protocol design.',
    relatedModule: '/learn/ai-security-pqc',
    complexity: 'advanced',
    category: 'protocol',
  },
  {
    term: 'Federated Learning',
    definition:
      'A machine learning approach where models are trained across multiple decentralized devices or servers holding local data samples, without exchanging raw data — only encrypted model updates are shared.',
    technicalNote:
      'Federated learning reduces data exposure but model updates (gradients) can leak information. PQC protections: ML-KEM encryption of gradient updates, ML-DSA signing of aggregation results, and lattice-based homomorphic encryption for secure aggregation.',
    relatedModule: '/learn/ai-security-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Homomorphic Encryption',
    acronym: 'HE',
    definition:
      'An encryption scheme that allows computations to be performed directly on encrypted data without decrypting it first, producing encrypted results that match what would be obtained from the plaintext.',
    technicalNote:
      'Most practical HE schemes (BGV, CKKS, TFHE) are lattice-based — the same mathematical foundation as ML-KEM and ML-DSA. This makes them inherently quantum-resistant, unlike RSA or ECC-based approaches. HE enables privacy-preserving AI inference on encrypted patient data or financial records.',
    relatedModule: '/learn/ai-security-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Secure Multi-Party Computation',
    acronym: 'MPC',
    definition:
      "A cryptographic technique allowing multiple parties to jointly compute a function over their combined inputs while keeping each party's input private from the others.",
    technicalNote:
      'MPC enables collaborative AI model training across organizations without revealing proprietary data. Quantum impact varies by protocol: garbled circuits rely on symmetric crypto (Grover-resistant with larger keys), while secret-sharing schemes may need PQC for the communication channels.',
    relatedModule: '/learn/ai-security-pqc',
    complexity: 'advanced',
    category: 'protocol',
  },
  {
    term: 'Model Provenance',
    definition:
      "The complete documented history of an AI model's creation — including training data sources, hyperparameters, training infrastructure, fine-tuning steps, and evaluation results — cryptographically signed to ensure integrity.",
    technicalNote:
      'Model provenance chains use hash chains and digital signatures to create tamper-evident audit trails. ECDSA-signed provenance is quantum-vulnerable for the entire model lifetime (potentially decades). ML-DSA provenance signatures ensure long-term verifiability beyond Q-Day.',
    relatedModule: '/learn/ai-security-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },

  // === Automotive PQC ===
  {
    term: 'ASIL',
    acronym: 'ASIL',
    definition:
      'Automotive Safety Integrity Level, a risk classification defined by ISO 26262 ranging from QM (quality management, no safety requirement) to ASIL-D (most stringent). Higher ASIL levels demand tighter crypto verification latency budgets and redundancy requirements.',
    technicalNote:
      'ASIL-D systems (braking, steering) require fail-operational crypto with dual-path verification (PQC primary + classical backup) and hardware watchdog timers. Verification must complete within 10-15ms. ASIL-A/B systems can tolerate fail-safe degradation with relaxed timing.',
    relatedModule: '/learn/automotive-pqc',
    complexity: 'advanced',
    category: 'standard',
  },
  {
    term: 'CCC Digital Key',
    definition:
      'A specification by the Car Connectivity Consortium (CCC) enabling smartphones to function as vehicle keys via NFC, BLE, or UWB. CCC Digital Key 3.0 uses ECDH P-256 key agreement and ECDSA P-256 certificates, both quantum-vulnerable.',
    technicalNote:
      'NFC transport limits APDUs to 256 bytes, making ML-KEM-768 ciphertext (1,088 bytes) require 5 APDUs per key exchange. BLE (512-byte L2CAP frames) and UWB (symmetric ranging, quantum-safe) handle PQC migration more gracefully. Owner-to-friend key sharing adds another quantum-vulnerable certificate chain.',
    relatedModule: '/learn/automotive-pqc',
    complexity: 'advanced',
    category: 'protocol',
  },
  {
    term: 'TISAX',
    acronym: 'TISAX',
    definition:
      'Trusted Information Security Assessment Exchange, a standard for information security assessments in the automotive supply chain governed by VDA (German Association of the Automotive Industry) and ENX.',
    technicalNote:
      'TISAX v7 (expected 2027) is anticipated to add PQC readiness criteria. OEMs requiring TISAX compliance from Tier-1 and Tier-2 suppliers will cascade PQC requirements through the supply chain. Assessment scope will likely cover key management, firmware signing, and cryptographic inventory.',
    relatedModule: '/learn/automotive-pqc',
    complexity: 'advanced',
    category: 'standard',
  },
  {
    term: 'AUTOSAR',
    definition:
      'AUTomotive Open System ARchitecture, a standardized software architecture for automotive ECUs. AUTOSAR Classic Platform provides the SHE-based Crypto Service Manager (limited to AES/CMAC). AUTOSAR Adaptive Platform offers a flexible Crypto Service Manager that can integrate PQC algorithms.',
    technicalNote:
      'AUTOSAR Adaptive Platform is the key enabler for automotive crypto-agility. Its Crypto Service Manager abstracts algorithm selection behind a provider interface, allowing OEMs to swap ECDSA for ML-DSA without modifying application software. Classic Platform ECUs (80%+ of deployed fleet) cannot be upgraded to PQC without hardware replacement.',
    relatedModule: '/learn/automotive-pqc',
    complexity: 'advanced',
    category: 'standard',
  },
  {
    term: 'Zonal Architecture',
    definition:
      'A vehicle E/E (electrical/electronic) architecture that replaces domain-based ECU organization (powertrain, chassis, body, ADAS) with zone-based controllers that manage all functions within a physical region of the vehicle.',
    technicalNote:
      'Zonal architecture reduces total ECU count by 30-40% and consolidates crypto operations in powerful zone controllers. These zone controllers can run PQC algorithms on automotive-grade SoCs (NXP S32G, Infineon AURIX TC4x), whereas legacy domain ECUs often lack the compute and memory for PQC.',
    relatedModule: '/learn/automotive-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'ISO 15118',
    definition:
      'An international standard for vehicle-to-grid communication enabling Plug & Charge: automatic mutual authentication between electric vehicles and charging stations using X.509 certificates over TLS.',
    technicalNote:
      'ISO 15118 uses a PKI hierarchy (OEM Root CA → Vehicle Sub-CA → Vehicle Leaf Cert) with ECDSA P-256. PQC migration requires updating the entire Plug & Charge PKI to hybrid certificates, affecting vehicle OEMs, Charge Point Operators (CPOs), and eMobility Service Providers (eMSPs).',
    relatedModule: '/learn/automotive-pqc',
    complexity: 'advanced',
    category: 'standard',
  },
  {
    term: 'Sensor Fusion',
    definition:
      'The process of combining data from multiple sensors (LiDAR, radar, cameras, ultrasonic, GPS/IMU) to create a unified, accurate representation of the vehicle environment for autonomous driving decisions.',
    technicalNote:
      'Sensor fusion pipelines must authenticate data integrity to prevent adversarial injection. LiDAR generates 300+ MB/s requiring per-frame signing. ML-DSA-44 signing (0.8ms) fits ADAS latency budgets; FN-DSA-512 offers more compact signatures (666 bytes vs 2,420) for bandwidth-constrained CAN FD buses.',
    relatedModule: '/learn/automotive-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'A/B Partition',
    definition:
      'A firmware update strategy where an ECU maintains two complete firmware images (partition A and partition B). Updates are written to the inactive partition while the active partition continues running, enabling instant rollback on failure.',
    technicalNote:
      'A/B partitioning doubles storage requirements but provides atomic updates critical for safety-critical ECUs (ASIL-C/D). Each partition is independently signed — PQC migration requires verifying both classical and PQC signatures during the transition period. Gateway ECUs and ADAS controllers typically use A/B; body ECUs may use cheaper in-place updates.',
    relatedModule: '/learn/automotive-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'CAN Bus',
    acronym: 'CAN',
    definition:
      'Controller Area Network, the dominant in-vehicle serial bus protocol with an 8-byte (CAN 2.0) or 64-byte (CAN FD) payload per frame. CAN buses connect ECUs for powertrain, chassis, and body functions.',
    technicalNote:
      'CAN 2.0 payload (8 bytes) cannot carry any PQC signature in a single frame — even the smallest ML-DSA-44 signature (2,420 bytes) requires 303 CAN frames. CAN FD (64 bytes) is slightly better but still impractical for per-message PQC signing. Automotive Ethernet (1,500-byte MTU) is the PQC-feasible bus for ADAS and infotainment zones.',
    relatedModule: '/learn/automotive-pqc',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'IEEE 1609.2',
    definition:
      'The security standard for Wireless Access in Vehicular Environments (WAVE), defining V2X message signing, certificate formats, and the Security Credential Management System (SCMS) for pseudonym certificate issuance.',
    technicalNote:
      'IEEE 1609.2 currently mandates ECDSA P-256 for V2X message signing and ECIES for encryption. A PQC amendment (expected 2025-2026) will add ML-DSA and ML-KEM support. The SCMS uses butterfly key expansion to generate millions of unlinkable pseudonym certificates — this mechanism must be adapted for PQC key sizes.',
    relatedModule: '/learn/automotive-pqc',
    complexity: 'advanced',
    category: 'standard',
  },
  {
    term: 'JCA/JCE',
    acronym: 'JCA/JCE',
    definition:
      'Java Cryptography Architecture / Extension — the standard Java framework for cryptographic operations. JCA provides the provider model and key management; JCE extends it with cipher and key agreement operations.',
    technicalNote:
      'JCA uses string-based algorithm selection (e.g., KeyPairGenerator.getInstance("ML-DSA-65", "BC")) with pluggable providers. Bouncy Castle registers as a JCA provider via Security.addProvider(new BouncyCastleProvider()), giving immediate access to all NIST PQC algorithms without waiting for Oracle JDK support.',
    relatedModule: '/learn/crypto-dev-apis',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Bouncy Castle',
    definition:
      'Open-source cryptography library available for Java and .NET. Plays a dual role: as a JCA provider and as a standalone lightweight API. Has the widest PQC algorithm coverage of any open-source library.',
    technicalNote:
      'Since BC 1.78 (January 2024), Bouncy Castle supports all NIST PQC algorithms: ML-KEM, ML-DSA, SLH-DSA, FN-DSA. Also supports LMS/XMSS (SP 800-208), HQC, and Classic McEliece. The BC C# port provides equivalent coverage for .NET environments.',
    relatedModule: '/learn/crypto-dev-apis',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'KSP',
    acronym: 'KSP',
    definition:
      'Key Storage Provider — a Windows CNG component that manages private key isolation and storage. KSPs abstract over software (MS_KEY_STORAGE_PROVIDER), TPM (MS_PLATFORM_KEY_STORAGE_PROVIDER), and HSM-backed storage.',
    technicalNote:
      'Applications use NCryptOpenStorageProvider() to select a KSP at initialization time. The key isolation architecture means private key material never leaves the KSP boundary, even in software mode. PQC key support in Microsoft KSPs is planned for Windows Server 2026+.',
    relatedModule: '/learn/crypto-dev-apis',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'CNG',
    acronym: 'CNG',
    definition:
      "Cryptography Next Generation — Microsoft's modern Windows cryptographic API, introduced in Windows Vista. Separates algorithm providers (BCrypt) from key storage providers (NCrypt) for better security isolation.",
    technicalNote:
      'BCryptOpenAlgorithmProvider() opens algorithm providers for hash/symmetric operations. NCryptOpenStorageProvider() opens key storage providers for asymmetric key management. CNG is the foundation of Windows FIPS mode and integrates with the Windows certificate store.',
    relatedModule: '/learn/crypto-dev-apis',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'JCProv',
    definition:
      'A Java PKCS#11 wrapper library from Thales/SafeNet that bridges JCA/JCE and PKCS#11 hardware security modules. Enables standard Java crypto calls to transparently use HSM-backed keys.',
    technicalNote:
      'JCProv registers as a JCA provider. Once registered, Signature.getInstance("ML-DSA-65", "JCProv") routes the operation through PKCS#11 to the Luna HSM. Key handles remain opaque — private key material never enters JVM memory.',
    relatedModule: '/learn/crypto-dev-apis',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'oqsprovider',
    definition:
      'An OpenSSL 3.x provider plugin that adds post-quantum cryptography algorithm support via the liboqs library. Enables all NIST PQC algorithms in any OpenSSL 3.x application without code changes.',
    technicalNote:
      'Loaded via OSSL_PROVIDER_load(NULL, "oqsprovider"). Requires OpenSSL 3.2+ and liboqs 0.10.0+. Supports ML-KEM, ML-DSA, SLH-DSA, FN-DSA, and hybrid composite algorithms (e.g., "p256_mlkem512"). Version 0.7.0+ is production-ready for non-FIPS environments.',
    relatedModule: '/learn/crypto-dev-apis',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'RustCrypto',
    definition:
      'A community-maintained collection of cryptographic algorithm implementations in Rust, published as modular crates on crates.io. Emphasizes type safety, zero-dependency design, and no_std compatibility.',
    technicalNote:
      'Key crates: aes, sha2, p256, x25519-dalek. PQC is emerging: pqcrypto crate wraps PQClean reference implementations. The aws-lc-rs crate provides FIPS-validated crypto via AWS-LC bindings. RustCrypto traits (digest::Digest, signature::Signer) define common interfaces across implementations.',
    relatedModule: '/learn/crypto-dev-apis',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Crypto Agility Pattern',
    definition:
      'A software design pattern that decouples cryptographic algorithm selection from application business logic, enabling algorithms to be swapped without code changes. Essential for PQC migration.',
    technicalNote:
      'Five main patterns: (1) Provider Abstraction — use JCA/OpenSSL provider swap. (2) Config-Driven Selection — algorithm name from YAML/env var. (3) Hybrid/Composite — run classical + PQC in parallel. (4) Algorithm Negotiation — TLS-style capability advertisement. (5) Feature Flags — gradual PQC rollout per service.',
    relatedModule: '/learn/crypto-dev-apis',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'liboqs',
    definition:
      'Open Quantum Safe C library — the reference implementation hub for post-quantum cryptographic algorithms. Maintained by the Open Quantum Safe project and serves as the foundation for oqsprovider, oqs-go, liboqs-python, and other language bindings.',
    technicalNote:
      'Supports all NIST PQC algorithms plus additional candidates (HQC, FrodoKEM, Classic McEliece, BIKE). Provides both reference (portable C) and optimized (AVX2/NEON) implementations. Version 0.10.0+ uses the FIPS 203/204/205 API naming. Not FIPS-validated itself — use AWS-LC for FIPS requirements.',
    relatedModule: '/learn/crypto-dev-apis',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'PQClean',
    definition:
      'A collection of audited, clean-room post-quantum cryptographic reference implementations in C. Provides the source implementations that feed into liboqs, pqcrypto (Rust), and other libraries.',
    technicalNote:
      'PQClean implementations are written for readability and auditability rather than performance. They use no platform-specific code, no dynamic allocation, and have fixed stack bounds. The project is used by NIST and academic auditors as the canonical reference for algorithm correctness.',
    relatedModule: '/learn/crypto-dev-apis',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'AWS-LC',
    acronym: 'AWS-LC',
    definition:
      "Amazon's FIPS-validated cryptographic library, forked from BoringSSL. Provides FIPS 140-3 validated cryptography for AWS services and is available as open source. The aws-lc-rs Rust crate provides safe bindings.",
    technicalNote:
      "AWS-LC's FIPS module (BoringCrypto successor) includes ML-KEM-768 as of 2024. ML-DSA is on the roadmap. The aws-lc-rs crate is a drop-in replacement for the ring crate in many use cases. AWS uses AWS-LC internally for all TLS in its infrastructure.",
    relatedModule: '/learn/crypto-dev-apis',
    complexity: 'advanced',
    category: 'concept',
  },
  // ── Secrets Management & PQC ──────────────────────────────────────────────
  {
    term: 'Secret Zero',
    definition:
      'The bootstrapping secret used to authenticate to a secrets manager — the root credential that unlocks all other credentials. Protecting Secret Zero is the foundational security challenge in any secrets management architecture.',
    technicalNote:
      'Common Secret Zero approaches: (1) Cloud IAM role binding (instance identity). (2) Vault AppRole with RoleID + SecretID. (3) TPM-based attestation (most secure). (4) SPIFFE/SPIRE workload identity. For PQC: the TLS channel carrying Secret Zero requires ML-KEM protection to prevent HNDL capture of all downstream secrets.',
    relatedModule: '/learn/secrets-management-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Dynamic Secrets',
    definition:
      'Secrets generated on-demand with a short TTL and automatically revoked when the lease expires. Replaces long-lived static credentials with ephemeral ones that expire after the requesting workload is done.',
    technicalNote:
      'HashiCorp Vault dynamic secrets engines include: database (PostgreSQL, MySQL), AWS IAM, Azure AD, GCP service accounts, SSH OTP, PKI certificates. Each credential has a lease_id and lease_duration. Renewing extends the TTL; revoking terminates early. PQC note: the lease signing key and TLS channel are the quantum-vulnerable components, not the dynamic credential itself.',
    relatedModule: '/learn/secrets-management-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Transit Encryption Engine',
    definition:
      "A secrets manager service that performs encryption/decryption operations on behalf of applications without ever exposing the key material. Acts as an 'encryption as a service' — applications send plaintext in, get ciphertext back.",
    technicalNote:
      'HashiCorp Vault Transit engine supports AES-GCM-256, ChaCha20-Poly1305, RSA-OAEP, and ECDSA. Each named key has a versioned key ring — encrypting uses the latest version, decrypting accepts any version. PQC migration: update the key type to ml-kem-768 (KEM) or ml-dsa-65 (signatures) when Vault adds FIPS 203/204 support. Existing ciphertexts must be re-encrypted (Rewrap operation).',
    relatedModule: '/learn/secrets-management-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Lease/Renewal',
    definition:
      'The time-bounded validity period of a secret or token in a secrets manager. Every dynamically generated secret has a lease — it expires unless explicitly renewed before the TTL elapses.',
    technicalNote:
      'Vault lease mechanics: lease_id identifies the secret, lease_duration is the TTL in seconds, renewable indicates whether renewal is allowed. Renewal resets the TTL up to the max_lease_ttl. Automated renewal via Vault Agent Sidecar or the Vault SDK. PQC note: the lease management API channel must be TLS with PQC hybrid KEX to prevent interception.',
    relatedModule: '/learn/secrets-management-pqc',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Secret Sprawl',
    definition:
      "The uncontrolled proliferation of secrets across an organization's systems — hardcoded in source code, scattered across config files, duplicated in environment variables, and stored in wikis or chat tools.",
    technicalNote:
      'Common sprawl vectors: (1) .env files committed to git. (2) Secrets in CI/CD YAML. (3) Hardcoded in Dockerfiles or K8s manifests. (4) Exported to S3 / GCS buckets. (5) Shared via Slack or Confluence. Remediation: secret scanning tools (GitLeaks, TruffleHog, GitHub Secret Scanning) + secrets centralisation into a secrets manager. PQC relevance: sprawled secrets stored encrypted with RSA/AES-128 are HNDL targets.',
    relatedModule: '/learn/secrets-management-pqc',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'BYOK',
    acronym: 'BYOK',
    definition:
      'Bring Your Own Key — a cloud encryption model where the customer provides and manages the root encryption key rather than using a key generated and managed by the cloud provider. Gives customers control over key lifecycle and access.',
    technicalNote:
      'BYOK implementations: AWS KMS Customer Managed Keys (CMK) imported via WrappingKey; Azure Key Vault BYOK via HSM-protected key transfer; GCP Cloud KMS BYOK via key import API. All use an RSA-3072 or ECDH wrapping key for key import — this is the PQC-vulnerable step (must migrate to ML-KEM-768 wrapping). Post-import, the customer key wraps DEKs using AES-256 which is quantum-safe.',
    relatedModule: '/learn/secrets-management-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Envelope Encryption',
    definition:
      'A two-level encryption scheme: a data encryption key (DEK) encrypts the data, and a key encryption key (KEK) encrypts the DEK. The encrypted DEK is stored alongside the ciphertext. Only the KEK needs to be protected in a KMS.',
    technicalNote:
      'Used by every major cloud KMS (AWS, Azure, GCP). PQC migration: only the KEK wrapping operation is quantum-vulnerable (RSA-OAEP or ECDH for DEK wrapping). The DEK itself is AES-256-GCM which is quantum-safe. Hybrid approach: wrap the DEK with both classical KEK and ML-KEM-768 encapsulation — store both wrapped DEK versions until classical deprecation.',
    relatedModule: '/learn/secrets-management-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Secrets Manager',
    definition:
      'A dedicated service for storing, rotating, and auditing application secrets such as database passwords, API keys, TLS certificates, and SSH keys. Provides centralized access control, automatic rotation, and audit logging.',
    technicalNote:
      'Key products: HashiCorp Vault (open source + enterprise), AWS Secrets Manager, Azure Key Vault, GCP Secret Manager, Delinea Secret Server, CyberArk Conjur. Core capabilities: versioning, rotation triggers (AWS Lambda), access policies (IAM or Vault policies), audit logs, replication. PQC requirements: TLS channel to the API must use hybrid KEM; signing tokens (Vault JWT) must use ML-DSA.',
    relatedModule: '/learn/secrets-management-pqc',
    complexity: 'beginner',
    category: 'concept',
  },
  // ── Network Security & PQC ────────────────────────────────────────────────
  {
    term: 'Deep Packet Inspection',
    acronym: 'DPI',
    definition:
      'A network traffic analysis technique that examines packet payloads (not just headers) to classify, filter, or log traffic. Used by firewalls, IDS/IPS, and network monitoring tools to enforce security policies.',
    technicalNote:
      'PQC impact on DPI: ML-KEM-768 hybrid key exchanges produce significantly larger TLS ClientHello messages (2–4× increase). ML-DSA certificates are 2–5× larger than ECDSA. Many inline DPI appliances have fixed packet buffer sizes that will need firmware/hardware upgrades. Network taps must accommodate increased session state for hybrid key exchanges.',
    relatedModule: '/learn/network-security-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'TLS Inspection',
    definition:
      'A network security technique where a proxy or firewall decrypts, inspects, and re-encrypts TLS traffic inline. Also called SSL/TLS interception or man-in-the-middle inspection. Used for DLP, malware scanning, and policy enforcement.',
    technicalNote:
      'PQC breaks many TLS inspection architectures: (1) The inspection proxy must support hybrid ML-KEM key exchange on both the client-facing and server-facing TLS sessions. (2) PQC certificate chains are larger — hardware SSL offload cards may need replacement. (3) Session ticket caching overhead increases with hybrid KEM state. Vendors: Zscaler, Palo Alto, Cisco Umbrella, Fortinet all have PQC TLS inspection roadmaps for 2026–2028.',
    relatedModule: '/learn/network-security-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'NGFW',
    acronym: 'NGFW',
    definition:
      'Next-Generation Firewall — a stateful network firewall that integrates application-layer inspection, user identity awareness, TLS inspection, IDS/IPS, and threat intelligence. Replaces traditional port-based packet filters with application-aware policies.',
    technicalNote:
      'Major NGFW vendors and their PQC timelines (as of 2026): Palo Alto PAN-OS 12+ (ML-KEM hybrid KEX in TLS 1.3, 2027 target); Cisco FTD 7.6+ (NIST PQC algorithms via Cisco TrustSec update, 2027); Fortinet FortiOS 7.8+ (quantum-safe VPN phase 1, 2026); Check Point R82+ (PQC TLS inspection plugin, 2027). All require hardware upgrades for inline PQC at line rate.',
    relatedModule: '/learn/network-security-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'IDS/IPS',
    acronym: 'IDS/IPS',
    definition:
      'Intrusion Detection System / Intrusion Prevention System — network security tools that monitor traffic for known attack patterns (signature-based) or anomalous behaviour (anomaly-based). IPS operates inline and can block traffic; IDS is passive.',
    technicalNote:
      "PQC impact on IDS/IPS: (1) Signature updates needed for PQC-protocol-aware rules (detecting ML-KEM TLS extensions, PQC certificate OIDs). (2) Anomaly baseline recalibration required — PQC increases normal traffic sizes significantly, triggering false positives on size-based anomaly rules. (3) Encrypted traffic analysis (ETA) tools can't inspect ML-KEM sessions without TLS inspection proxy. Snort 3.x and Suricata 7.x have PQC-aware protocol parsers on their roadmaps.",
    relatedModule: '/learn/network-security-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Zero Trust Network Access',
    acronym: 'ZTNA',
    definition:
      'A security model that grants access to specific applications based on verified identity, device posture, and context — rather than network location. Replaces implicit trust based on being inside the corporate network perimeter.',
    technicalNote:
      'ZTNA PQC requirements: (1) Mutual TLS with ML-DSA certificates for device authentication. (2) ML-KEM hybrid key exchange in the secure tunnel. (3) Device attestation via TPM Quote or DICE (see attestation PQC migration). (4) Identity tokens (JWT) signed with ML-DSA-65. Major ZTNA vendors: Zscaler ZPA, Palo Alto Prisma, Cloudflare Access, Cisco Duo — all have PQC on 2027–2028 roadmaps.',
    relatedModule: '/learn/network-security-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'SSL/TLS Offload',
    definition:
      'Terminating TLS connections at a dedicated hardware appliance or load balancer, rather than at the application server. Reduces CPU load on application servers and centralises certificate management.',
    technicalNote:
      'PQC impact on TLS offload: ML-DSA-65 operations require ~3× more compute than ECDSA P-256 per operation. ML-KEM-768 key exchange is ~5× the data size of X25519. Hardware SSL accelerators (Intel QAT, Marvell NITROX, Broadcom BCM585xx) will require firmware/hardware refresh for PQC-accelerated operations. Software offload (HAProxy, nginx, Envoy) can be patched to support hybrid TLS via OQS-OpenSSL.',
    relatedModule: '/learn/network-security-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'East-West Traffic',
    definition:
      'Network traffic that flows laterally between servers, containers, or services within a data centre or cloud environment — as opposed to north-south traffic which flows between users and services across the network perimeter.',
    technicalNote:
      'East-west PQC urgency: service mesh mTLS (Istio, Linkerd) uses short-lived certificates with ECDSA — high rotation frequency partially mitigates HNDL, but long-lived session keys are still vulnerable. Migrate service mesh CA to ML-DSA-65 certificates and tunnel KEM to ML-KEM-768. Container workloads use SPIFFE/SPIRE for certificate provisioning — update SPIRE server signing key to ML-DSA.',
    relatedModule: '/learn/network-security-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Micro-Segmentation',
    definition:
      'A network security technique that creates fine-grained security zones within a data centre, isolating individual workloads or applications from each other. Limits blast radius when an attacker gains access to one segment.',
    technicalNote:
      'Micro-segmentation policy enforcement relies on workload identity (via TLS certificates or hardware attestation). PQC migration: (1) Policy engine certificates must use ML-DSA-65. (2) Workload identity tokens must be ML-DSA signed. (3) Policy distribution channels must use hybrid TLS. VMware NSX, Illumio, and Guardicore all have PQC-aware agent updates on their 2026–2027 roadmaps.',
    relatedModule: '/learn/network-security-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  // ── Database Encryption & PQC ─────────────────────────────────────────────
  {
    term: 'Transparent Data Encryption',
    acronym: 'TDE',
    definition:
      'A database encryption feature that automatically encrypts data files at rest without requiring application changes. The database engine handles encryption and decryption transparently on read/write operations.',
    technicalNote:
      'TDE implementations: SQL Server (AES-256 with certificate or EKM), Oracle (AES-256 with Oracle Wallet or external KMS), PostgreSQL pgcrypto + pg_tde extension. PQC migration: the TDE master key is typically protected by RSA-2048 or ECDSA — this is the HNDL-vulnerable component. Migrate master key protection to ML-KEM-768 (for key wrapping) when KMS supports FIPS 203.',
    relatedModule: '/learn/database-encryption-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Column-Level Encryption',
    acronym: 'CLE',
    definition:
      'Database encryption applied to individual columns rather than the entire database or table. Allows selective protection of sensitive fields (SSN, credit card, health records) while leaving non-sensitive data unencrypted and queryable.',
    technicalNote:
      'SQL Server Always Encrypted uses two keys: Column Master Key (CMK, stored in Key Vault or certificate store) + Column Encryption Key (CEK, stored in database metadata, encrypted by CMK). Oracle TDE column encryption uses similar hierarchy. PostgreSQL pgcrypto provides column encryption via SQL functions. PQC note: CMK wrapping is the RSA-vulnerable step — migrate CMK to ML-KEM-768 unwrap before quantum threat.',
    relatedModule: '/learn/database-encryption-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Always Encrypted',
    definition:
      "Microsoft SQL Server's client-side encryption feature that ensures sensitive data is never exposed in plaintext to the database engine — only the client application holds the Column Master Key. The server stores and queries only ciphertext.",
    technicalNote:
      'Always Encrypted uses a two-tier key hierarchy: Column Master Key (RSA-2048 or ECDSA) protects Column Encryption Keys (AES-256 randomised or deterministic). Deterministic encryption supports equality queries; randomised encryption is more secure but only supports full-column retrieval. PQC migration: update CMK type to ML-KEM-768 using SQL Server key rotation wizard. Client driver must also support ML-KEM unwrap (ODBC 18+, JDBC 12+ on roadmap).',
    relatedModule: '/learn/database-encryption-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Queryable Encryption',
    definition:
      "An encryption scheme that allows a database server to execute certain queries over encrypted data without decrypting it first. MongoDB's Queryable Encryption and PostgreSQL pg_tde support equality and range queries on encrypted fields.",
    technicalNote:
      'MongoDB Queryable Encryption v2 (2023+) uses Structured Encryption (SE) and MC-AEAD-AES-SHA512 ECDH-based key encapsulation for query token generation. PQC migration: replace the ECDH token key derivation with ML-KEM-768 encapsulation when MongoDB adds FIPS 203 support (roadmap: 2027). Note: quantum computers would break the query privacy guarantees (reveal which documents match a query) before breaking the data confidentiality.',
    relatedModule: '/learn/database-encryption-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'HYOK',
    acronym: 'HYOK',
    definition:
      'Hold Your Own Key — a cloud encryption model where the customer holds a key that never leaves their on-premises HSM. The cloud service requests encryption operations from the customer HSM rather than using cloud-side keys.',
    technicalNote:
      "HYOK implementations: Azure Information Protection HYOK (AD RMS key on-prem), Google Workspace Client-Side Encryption (CSE). Contrast with BYOK: in BYOK the customer imports the key into the cloud KMS; in HYOK the key never leaves the customer HSM. PQC migration: the HSM must support ML-KEM for key wrapping and ML-DSA for signing before HYOK's quantum safety can be claimed.",
    relatedModule: '/learn/database-encryption-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Data Encryption Key',
    acronym: 'DEK',
    definition:
      'A symmetric key used to directly encrypt data. In envelope encryption architectures, the DEK is a short-lived, per-object AES key that encrypts actual data, while a Key Encryption Key (KEK) protects the DEK.',
    technicalNote:
      'DEK sizing: AES-256 for data confidentiality (quantum-safe against Grover — 128-bit quantum security). DEK rotation frequency varies by compliance regime: PCI DSS recommends annual rotation; GDPR requires prompt rotation on personnel changes; some HSM policies enforce 90-day DEK rotation. PQC note: DEKs themselves are AES-256 and quantum-safe — the vulnerability is in how the KEK protects the DEK (typically RSA or ECDH wrapping).',
    relatedModule: '/learn/database-encryption-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Column Master Key',
    acronym: 'CMK',
    definition:
      'The top-level key in SQL Server Always Encrypted that protects Column Encryption Keys (CEKs). The CMK is typically stored in Azure Key Vault, Windows Certificate Store, or an HSM — never in the database itself.',
    technicalNote:
      "CMK operations: CMK encrypts CEK metadata stored in sys.column_encryption_key_values. CMK rotation requires re-encrypting all CEK metadata with the new CMK (SQL Server 'rotate CMK' wizard or PowerShell New-SqlColumnEncryptionKeyEncryptedValue). PQC migration path: create new ML-KEM-768 CMK → use SQL Server CMK rotation to re-wrap all CEKs → drop old RSA CMK. Client driver must support ML-KEM-768 for new CMK unwrap operations.",
    relatedModule: '/learn/database-encryption-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Key Rotation (Database)',
    definition:
      'The process of replacing an active database encryption key with a new one, re-encrypting data (or key metadata) under the new key, and retiring the old key. Critical for limiting cryptographic exposure over time.',
    technicalNote:
      'Three rotation strategies: (1) Master key rotation only — re-encrypt DEKs/CEKs under new master key without touching data. (2) DEK rotation — generate new DEK, re-encrypt all data (expensive). (3) Combined — new master key + new DEKs simultaneously. SQL Server uses strategy 1 for TDE and Always Encrypted. Oracle uses a similar approach. PQC migration is essentially a forced master key rotation from RSA-wrapped to ML-KEM-768-wrapped keys.',
    relatedModule: '/learn/database-encryption-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  // ── Identity & Access Management with PQC ─────────────────────────────────
  {
    term: 'Identity Provider',
    acronym: 'IdP',
    definition:
      'A system that creates, maintains, and manages digital identities and their authentication. The IdP authenticates users and issues tokens (SAML assertions, JWT, OIDC ID tokens) that allow access to service providers.',
    technicalNote:
      'PQC impact on IdPs: (1) SAML assertion signatures — migrate from RSA-SHA256 to ML-DSA-65. (2) OIDC/JWT signing — migrate from RS256/ES256 to ML-DSA-65 (JOSE PQC draft). (3) TLS channel to IdP — hybrid ML-KEM. (4) PKI certificates for IdP servers — ML-DSA-65 or hybrid. Major IdPs: Okta, Microsoft Entra (Azure AD), PingFederate, ForgeRock, Shibboleth. All have PQC roadmaps targeting 2027–2030.',
    relatedModule: '/learn/iam-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Service Provider',
    acronym: 'SP',
    definition:
      'In federated identity, the system that provides a service or resource and relies on an Identity Provider to authenticate users. The SP trusts the IdP and validates tokens presented by users.',
    technicalNote:
      'SP-IdP trust: in SAML, the SP stores the IdP public key/certificate for assertion verification — this is the RSA/ECDSA-vulnerable point. In OIDC, the SP fetches the IdP JWKS (JSON Web Key Set) at runtime for JWT verification. PQC migration: IdP must update its signing key to ML-DSA-65 and advertise it in the JWKS endpoint. SPs need updated JWT libraries that support ML-DSA verification.',
    relatedModule: '/learn/iam-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'SAML 2.0',
    acronym: 'SAML',
    definition:
      'Security Assertion Markup Language 2.0 — an XML-based open standard for exchanging authentication and authorization data between identity providers and service providers. The dominant enterprise SSO federation protocol.',
    technicalNote:
      'SAML assertions are XML documents signed with RSA-SHA256 (xmldsig). The PQC migration challenge: XML Signature standard (XMLDSig) does not yet define ML-DSA algorithm identifiers. W3C and OASIS are working on PQC XMLDSig extensions. Interim approach: wrap SAML assertion in a JWS envelope signed with ML-DSA-65. Long-term: SAML 3.0 specification expected to include native PQC signature support.',
    relatedModule: '/learn/iam-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'OIDC',
    acronym: 'OIDC',
    definition:
      'OpenID Connect — an identity layer built on top of OAuth 2.0 that allows clients to verify user identity based on authentication performed by an authorization server. Issues ID tokens (JWTs) containing user identity claims.',
    technicalNote:
      'OIDC PQC migration: JWTs are signed using JOSE algorithms (RS256, ES256, EdDSA). JOSE PQC draft (IETF draft-ietf-jose-pqc-signatures) adds ML-DSA-44/65/87 as alg values. ID tokens signed with ML-DSA-65 are ~3KB vs ~1KB for RS256 — HTTP header size limits may need adjustment. OIDC discovery document (/.well-known/openid-configuration) JWKS endpoint must expose ML-DSA public keys.',
    relatedModule: '/learn/iam-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Kerberos',
    definition:
      'A network authentication protocol that uses symmetric key cryptography and a trusted third party (Key Distribution Center) to authenticate service requests. The dominant authentication protocol in Microsoft Active Directory environments.',
    technicalNote:
      'Kerberos PQC challenges: (1) Ticket Granting Tickets (TGTs) and Service Tickets are encrypted with AES-256 (quantum-safe for confidentiality). (2) Pre-authentication uses AS-REQ with client long-term key — migrating to PQC requires Kerberos PKINIT (RFC 4556) with ML-DSA client certificates. (3) Cross-realm trust uses shared symmetric keys (AES-256, quantum-safe). Microsoft Active Directory Kerberos PQC support is on the Windows Server roadmap post-2028.',
    relatedModule: '/learn/iam-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Zero Trust Architecture',
    definition:
      "A security model based on the principle of 'never trust, always verify' — no implicit trust is granted based on network location. Every access request must be authenticated, authorized, and continuously validated regardless of origin.",
    technicalNote:
      'NIST SP 800-207 defines ZTA principles. Core pillars: Identity (ML-DSA certificates), Device (TPM attestation with PQC), Network (micro-segmentation with ML-DSA-signed policies), Application (mutual TLS with PQC certificates), Data (encryption with ML-KEM-protected keys). ZTA PQC dependency chain: identity proofing → ML-DSA credential issuance → PQC-secured policy engine → ML-KEM-protected data.',
    relatedModule: '/learn/iam-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Device Attestation',
    definition:
      "The process of cryptographically proving a device's identity and integrity to a remote verifier. Allows a server to verify that a device is what it claims to be and that its firmware/software has not been tampered with.",
    technicalNote:
      'Attestation mechanisms: TPM 2.0 Quote (RSA/ECDSA AIK signs PCR measurements — quantum-vulnerable), DICE (ML-DSA-44 on roadmap), FIDO Device Onboarding (ML-DSA-65 in FDO v1.2), Intel TDX/AMD SEV-SNP hardware attestation (ECDSA P-384 today). IAM systems increasingly require device attestation for Zero Trust — all attestation chains must migrate to PQC before quantum threat materialises.',
    relatedModule: '/learn/iam-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Federation',
    definition:
      "An identity trust relationship between two or more organizations that allows users from one organization to authenticate with another's services using their home organization's credentials. Enables SSO across organizational boundaries.",
    technicalNote:
      'Federation protocols: SAML 2.0 (XML-based, enterprise), OIDC (JSON-based, modern web), WS-Federation (Microsoft legacy). Federation trust anchors: SAML metadata signing certificates (RSA-2048/ECDSA, 3-year TTL typical). PQC migration: federation metadata must be re-signed with ML-DSA-65 certificates, and metadata signing certificates published via HTTPS with ML-DSA-secured TLS. eduGAIN, InCommon, and Azure AD B2B federation are high-priority PQC migration targets.',
    relatedModule: '/learn/iam-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  // ── Secure Boot & Firmware PQC ────────────────────────────────────────────
  {
    term: 'UEFI',
    acronym: 'UEFI',
    definition:
      'Unified Extensible Firmware Interface — the modern replacement for BIOS that defines a software interface between an operating system and platform firmware. UEFI Secure Boot uses a cryptographic chain of trust to verify firmware and bootloader integrity.',
    technicalNote:
      'UEFI Secure Boot key hierarchy: Platform Key (PK, RSA-2048 or RSA-4096) → Key Exchange Keys (KEK) → Signature Databases (db/dbx). All keys are X.509 certificates. PQC migration: UEFI Forum is standardising ML-DSA-65 support in UEFI 2.11. Interim approach: dual-sign binaries with both ECDSA and ML-DSA until hardware supports PQC verification. SBAT (Secure Boot Advanced Targeting) metadata must also be updated.',
    relatedModule: '/learn/secure-boot-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Platform Key',
    acronym: 'PK',
    definition:
      'The root of trust in UEFI Secure Boot — a single owner certificate that signs the Key Exchange Key (KEK) database. The Platform Key is typically set by the OEM at manufacturing time and establishes the chain of trust for all Secure Boot keys.',
    technicalNote:
      'PK characteristics: only one PK at a time; updating PK requires physical presence or existing PK signature; loss of PK requires physical presence to reset. Current algorithm: RSA-2048 or RSA-4096. PQC migration: replace PK with ML-DSA-65 certificate — requires OEM/BIOS vendor support (UEFI 2.11+). Microsoft Shim and MOK (Machine Owner Key) system for Linux adds another trust layer.',
    relatedModule: '/learn/secure-boot-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Key Exchange Key',
    acronym: 'KEK',
    definition:
      'A UEFI Secure Boot key that is trusted to update the Signature Database (db) and Revocation Database (dbx). The KEK is signed by the Platform Key (PK) and allows OS vendors to add their own signing certificates to the Secure Boot databases.',
    technicalNote:
      'KEK signers: Microsoft holds a KEK that allows updating the Windows db; OEM holds another KEK. Multiple KEKs can coexist. KEK updates require a valid PK signature. PQC migration path: add ML-DSA-65 KEK alongside existing RSA KEK during transition; deprecate RSA KEK after all db certs are PQC-signed.',
    relatedModule: '/learn/secure-boot-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'DICE',
    acronym: 'DICE',
    definition:
      'Device Identifier Composition Engine — a hardware security architecture that uses a secret Unique Device Secret (UDS) and firmware measurement to derive a Compound Device Identifier (CDI), creating a hardware root of trust that is unique per device and firmware state.',
    technicalNote:
      'DICE layers: DICE layer 0 (hardware) derives CDI = HKDF(UDS, H(firmware)). Each subsequent layer generates a key pair from its CDI and issues a certificate binding the key to a firmware measurement. PQC migration: DICE specification update in 2025 adds ML-DSA-44 for constrained devices. Key derivation uses HKDF-SHA-256 which is already quantum-safe.',
    relatedModule: '/learn/secure-boot-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'TPM PCR',
    definition:
      'Platform Configuration Register — a hash accumulator inside a TPM that holds extended measurements of system components. PCRs cannot be written directly; they can only be extended (PCR_new = SHA-256(PCR_old || new_value)), creating a tamper-evident log of the boot process.',
    technicalNote:
      'Standard PCR assignments (UEFI): PCR[0]=Core firmware, PCR[4]=bootloader, PCR[7]=Secure Boot state, PCR[11]=BitLocker/LUKS keys. PCR extend uses SHA-256 (quantum-safe). The quantum-vulnerable operation is the TPM Quote — the AIK signs PCR values using RSA or ECDSA for remote attestation. PQC migration: software ML-DSA co-sign of TPM Quotes until TPM hardware supports PQC AIKs.',
    relatedModule: '/learn/secure-boot-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Measured Boot',
    definition:
      'A boot integrity mechanism where each stage of the boot process measures (hashes) the next stage and extends the measurement into TPM PCRs. Unlike Secure Boot which enforces policy by blocking unsigned code, Measured Boot records what ran for later attestation.',
    technicalNote:
      'Measured Boot phases: UEFI firmware → PCR[0]; Secure Boot variables → PCR[7]; bootloader → PCR[4]; OS kernel → PCR[8–10]. The PCR log (TCG Event Log) records what was measured. Remote attestation uses PCR values + event log. PQC note: SHA-256 PCR extend is quantum-safe; only the attestation quote signature requires PQC migration.',
    relatedModule: '/learn/secure-boot-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Firmware Signing',
    definition:
      'The process of cryptographically signing firmware images before distribution and verifying the signature before execution. Ensures that firmware has not been tampered with since it was signed by the vendor.',
    technicalNote:
      'Firmware signing formats: UEFI Authenticated Variable (X.509 + RSA-2048/ECDSA), PKCS#7 SignedData, FIT (Flat Image Tree for embedded/ARM). PQC migration: ML-DSA-65 signature is 3,309 bytes — larger than BIOS flash partitions in some legacy designs. Dual-signing (ECDSA + ML-DSA) allows transition without breaking compatibility. UEFI capsule updates are the primary firmware update mechanism.',
    relatedModule: '/learn/secure-boot-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Boot Guard',
    definition:
      "Intel's hardware root of trust technology that verifies the authenticity of initial UEFI firmware using RSA-2048 keys fused into the CPU during manufacturing. Provides hardware-enforced protection against firmware tampering before the OS loads.",
    technicalNote:
      'Boot Guard key structure: Key Manifest contains RSA-2048 public key hash, fused into ME Flash at manufacture. Boot Policy Manifest signed by Key Manifest key, contains hash of Initial Boot Block. PQC migration: Intel has not published a Boot Guard v3 PQC roadmap as of 2026 — supply chain risk. AMD has AMD-SP (AMD Secure Processor) with similar RSA-2048 dependency.',
    relatedModule: '/learn/secure-boot-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  // ── Operating System & Platform Crypto PQC ────────────────────────────────
  {
    term: 'Crypto Policy',
    definition:
      'A system-wide configuration that sets the default cryptographic algorithm preferences for all supported applications and libraries. Red Hat-based systems use update-crypto-policies; Debian-based systems configure algorithm preferences via OpenSSL and GnuTLS configuration files.',
    technicalNote:
      "Red Hat crypto-policies (RHEL 8+): update-crypto-policies --set FUTURE disables SHA-1 and RSA-2048. A custom PQC policy flows to OpenSSL, GnuTLS, NSS, Kerberos, and Java via /etc/crypto-policies/back-ends/ symlinks. Create a PQC policy: echo '[alg_policy] cipher = AES-256-GCM hybrid-ml-kem' > /etc/crypto-policies/policies/PQC.pol; update-crypto-policies --set PQC.",
    relatedModule: '/learn/os-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'SChannel',
    definition:
      "Microsoft's Secure Channel cryptographic package — the TLS/SSL implementation built into Windows. SChannel is used by IIS, WinHTTP, and most Windows network services. It uses CNG (Cryptography API: Next Generation) for algorithm implementations.",
    technicalNote:
      'SChannel PQC migration: ML-KEM-768 hybrid key exchange available in Windows 11 24H2+ via registry key HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\KeyExchangeAlgorithms. ML-DSA certificate verification requires a CNG provider update planned for Windows 12 / Server 2028. Group Policy: Computer Configuration → Administrative Templates → Network → SSL Configuration Settings.',
    relatedModule: '/learn/os-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'SSH Host Key',
    definition:
      "A long-term asymmetric key pair used to authenticate an SSH server to connecting clients. When a client connects for the first time, it receives and stores the server's host key fingerprint in known_hosts. Future connections verify against this stored fingerprint.",
    technicalNote:
      'SSH host key algorithms: RSA-4096 (rsa-sha2-512), ECDSA P-256 (ecdsa-sha2-nistp256), Ed25519. PQC migration: OpenSSH 9.0+ supports ML-DSA-65 (ssh-mldsa65) as experimental. Generate: ssh-keygen -t mldsa65 -f /etc/ssh/ssh_host_mldsa65_key. Add HostKey /etc/ssh/ssh_host_mldsa65_key to sshd_config. ML-DSA signatures are ~3KB vs 64 bytes for Ed25519.',
    relatedModule: '/learn/os-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'FIPS 140-3 Mode',
    definition:
      'An OS operating mode that restricts the cryptographic algorithms to only those validated under FIPS 140-3. Required for US federal systems and many regulated industries. In FIPS mode, all cryptographic operations must use FIPS-approved algorithms and validated implementations.',
    technicalNote:
      'FIPS 140-3 and PQC: ML-KEM, ML-DSA, and SLH-DSA are FIPS 203/204/205 approved — but only implementations with a CMVP certificate are FIPS-validated. AWS-LC and OpenSSL FIPS Provider 3.0.9 (CMVP #4282) include ML-KEM-768/1024. Enable on Linux: dracut-fips kernel parameter + update-crypto-policies --set FIPS. Test applications before enforcing — FIPS mode disables TLS < 1.2, SHA-1, and MD5.',
    relatedModule: '/learn/os-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'GnuTLS Priority String',
    definition:
      'A configuration syntax used in GnuTLS to specify which TLS protocol versions, cipher suites, and key exchange algorithms are acceptable. Used in Linux systems as the TLS policy configuration for applications using the GnuTLS library.',
    technicalNote:
      'GnuTLS priority examples: NORMAL enables system defaults; SECURE256 enforces AES-256 and ECDHE. PQC hybrid: NORMAL:+MLKEM768 (experimental in GnuTLS 3.9+). Full PQC string: SECURE256:+MLKEM768:+MLKEM1024:-VERS-TLS1.2:-SHA1. GnuTLS is used by curl, wget, Dovecot, Postfix, and many system daemons on Linux.',
    relatedModule: '/learn/os-pqc',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'OpenSSL Provider',
    definition:
      'A dynamically loadable module that extends OpenSSL with additional cryptographic algorithm implementations. In OpenSSL 3.x, all algorithm implementations are providers — the default provider supplies standard algorithms, and third-party providers (like oqsprovider) add PQC algorithms.',
    technicalNote:
      'PQC via oqsprovider: install liboqs + oqs-openssl-provider, configure in /etc/ssl/openssl.cnf: [provider_sect] oqsprovider = oqsprovider_sect. OpenSSL 3.5+ includes ML-KEM and ML-DSA in the default provider without needing oqsprovider. TLS PQC: openssl s_server -groups x25519:mlkem768 starts a hybrid TLS 1.3 server. Applications using OpenSSL 3.x via libssl inherit PQC support automatically.',
    relatedModule: '/learn/os-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'CNG',
    acronym: 'CNG',
    definition:
      "Cryptography API: Next Generation — Microsoft's cryptographic framework that replaced the older CryptoAPI (CAPI). CNG provides a plugin architecture where algorithm implementations are supplied by CNG providers (KSPs), allowing hardware HSMs and software implementations to be swapped transparently.",
    technicalNote:
      'CNG PQC migration: ML-DSA algorithms require a new CNG provider — Microsoft ML-DSA KSP (planned for Windows 12 / Server 2028) or a third-party provider from Thales, Entrust, or nCipher. CNG is used by .NET, PowerShell, CertUtil, IIS, and most Windows cryptographic operations. The certificate template in ADCS must also support ML-DSA key type.',
    relatedModule: '/learn/os-pqc',
    complexity: 'intermediate',
    category: 'concept',
  },
  // === Role Guide & Compliance Strategy coverage ===
  {
    term: 'FedRAMP',
    acronym: 'FedRAMP',
    definition:
      'Federal Risk and Authorization Management Program — a U.S. government-wide program that provides a standardized approach to security assessment, authorization, and continuous monitoring for cloud products and services used by federal agencies.',
    technicalNote:
      'FedRAMP authorization requires FIPS 140-2/140-3 validated cryptographic modules. As NIST finalizes PQC standards, FedRAMP-authorized cloud service providers will need to migrate to quantum-resistant algorithms to maintain their Authority to Operate (ATO). Timeline aligns with CNSA 2.0 milestones.',
    relatedModule: '/learn/compliance-strategy',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'Compliance Gap Analysis',
    definition:
      "A systematic comparison of an organization's current cryptographic posture against regulatory requirements, identifying where PQC migration is needed to meet compliance deadlines. Evaluates frameworks like CNSA 2.0, DORA, NIS2, and sector-specific mandates across multiple jurisdictions.",
    technicalNote:
      'A PQC compliance gap analysis typically covers: (1) algorithm inventory vs. approved algorithms, (2) certificate lifecycle vs. regulatory deadlines, (3) vendor PQC readiness vs. contractual obligations, (4) data retention periods vs. HNDL exposure windows. Multi-jurisdiction organizations must reconcile overlapping requirements.',
    relatedModule: '/learn/compliance-strategy',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Quantum Risk Exposure',
    definition:
      "A measure of an organization's vulnerability to quantum computing threats, combining data sensitivity, cryptographic algorithm usage, data retention periods, and the estimated timeline to a cryptographically relevant quantum computer (CRQC).",
    technicalNote:
      'Quantum risk exposure is typically assessed across four dimensions: Quantum Exposure (HNDL/HNFL window overlap), Migration Complexity (infrastructure depth and algorithm diversity), Regulatory Pressure (compliance deadline proximity), and Organizational Readiness (crypto-agility maturity and team capability).',
    relatedModule: '/learn/exec-quantum-impact',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Board Fiduciary Duty',
    definition:
      'The legal obligation of corporate board members and executives to exercise due care in protecting organizational assets, including digital assets threatened by quantum computing. Failure to plan for known cryptographic risks may constitute a breach of fiduciary responsibility.',
    relatedModule: '/learn/exec-quantum-impact',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'PQC Migration Budget',
    definition:
      "The estimated total cost of transitioning an organization's cryptographic infrastructure to post-quantum algorithms, including hardware upgrades, software updates, staff training, compliance certification, and operational overhead during the hybrid transition period.",
    technicalNote:
      'Key cost drivers: HSM firmware upgrades ($50K–$500K per cluster), certificate re-issuance across PKI hierarchy, application code changes for larger key/signature sizes, re-certification costs (FIPS 140-3, Common Criteria), and potential performance infrastructure upgrades to handle increased computational and bandwidth requirements.',
    relatedModule: '/learn/exec-quantum-impact',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Key Size Impact',
    definition:
      'The significant increase in cryptographic key and signature sizes when migrating from classical to post-quantum algorithms. ML-KEM public keys are 800–1568 bytes (vs. 32–91 for ECC), and ML-DSA signatures are 2420–4627 bytes (vs. 64–72 for ECDSA), affecting APIs, protocols, and storage.',
    technicalNote:
      'Practical impacts: JWT tokens may exceed HTTP header limits, TLS handshakes require additional round trips, certificate chains grow 10–50x, PKCS#11 buffer sizes need adjustment, and database column widths for stored keys must be expanded. Performance budgets for latency-sensitive applications (payments, IoT) require careful re-evaluation.',
    relatedModule: '/learn/dev-quantum-impact',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Middlebox Compatibility',
    definition:
      'The ability of network intermediary devices (firewalls, load balancers, DPI appliances, TLS inspection proxies) to correctly process PQC-sized TLS handshakes and certificates without dropping, truncating, or rejecting connections due to unexpected packet sizes.',
    technicalNote:
      'ML-KEM-768 adds ~1100 bytes to TLS ClientHello; some middleboxes with hardcoded buffer limits will drop oversized handshakes. Testing strategy: deploy hybrid TLS (X25519+ML-KEM-768) in monitoring mode before enforcement, use QUIC where possible to avoid TCP middlebox issues, and coordinate with network security vendors on firmware updates.',
    relatedModule: '/learn/dev-quantum-impact',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Cryptographic Debt',
    definition:
      'The accumulated technical risk from hardcoded algorithm choices, missing abstraction layers, and tight coupling between application logic and specific cryptographic implementations, making PQC migration more difficult and costly.',
    technicalNote:
      'Common sources: hardcoded "RSA-2048" strings in config files, direct OpenSSL API calls without provider abstraction, fixed-size key buffers, algorithm-specific serialization formats, and certificate templates that assume specific key types. Crypto-agile architecture eliminates this debt by design.',
    relatedModule: '/learn/arch-quantum-impact',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Performance Budget',
    definition:
      'The allocation of computational resources (CPU cycles, memory, bandwidth, latency) for cryptographic operations within an application or system. PQC algorithms have different performance profiles than classical algorithms, requiring budget redesign during migration.',
    technicalNote:
      'ML-KEM-768 encapsulation is ~5x faster than ECDH P-256 but produces larger ciphertexts. ML-DSA-65 signing is comparable to Ed25519 but verification is slower and signatures are ~36x larger. SLH-DSA is orders of magnitude slower for signing but provides hash-based security without lattice assumptions. Architecture decisions must balance security level, performance, and bandwidth constraints per use case.',
    relatedModule: '/learn/arch-quantum-impact',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Fleet Migration',
    definition:
      'The coordinated process of upgrading cryptographic configurations across an entire fleet of servers, endpoints, IoT devices, and network appliances to support post-quantum algorithms, typically executed in phased rollouts with rollback capability.',
    technicalNote:
      'Fleet migration phases: (1) inventory and dependency mapping, (2) canary deployment to 1–5% of fleet, (3) staged rollout with health checks, (4) enforcement with monitoring, (5) legacy algorithm sunset. Configuration management tools (Ansible, Terraform, Chef) must be updated to manage PQC-specific parameters like hybrid key exchange groups and larger certificate chains.',
    relatedModule: '/learn/ops-quantum-impact',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Certificate Rotation at Scale',
    definition:
      'The operational challenge of replacing certificates across large infrastructure deployments when migrating to PQC algorithms, complicated by larger certificate sizes, new CA hierarchies, and the need to maintain backward compatibility during the transition period.',
    technicalNote:
      'Key considerations: ACME/cert-manager automation must support PQC certificate types, multi-CA coordination when different CAs adopt PQC at different rates, certificate transparency (CT) log compatibility with larger PQC certificates, and monitoring for mixed classical/PQC certificate environments. Expect 10–50x increase in certificate chain sizes affecting TLS handshake latency.',
    relatedModule: '/learn/ops-quantum-impact',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Quantum-Safe Research Data',
    definition:
      'Research datasets, publications, and intellectual property that require long-term confidentiality (20–50+ years) and integrity protection, making them particularly vulnerable to Harvest Now, Decrypt Later attacks and requiring early PQC adoption.',
    technicalNote:
      'High-risk research domains: genomics and bioinformatics (patient privacy regulations extend decades), classified defense research (50+ year confidentiality), pharmaceutical R&D (patent-sensitive data during 20-year exclusivity periods), and financial modeling (proprietary algorithms with long competitive value). Research institutions should prioritize encrypting data at rest with hybrid PQC schemes.',
    relatedModule: '/learn/research-quantum-impact',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Formal Verification',
    definition:
      'Mathematical proof techniques used to verify that cryptographic algorithm implementations correctly conform to their specifications, providing stronger assurance than testing alone. Critical for PQC algorithms where implementation subtleties can introduce vulnerabilities.',
    technicalNote:
      'Active PQC formal verification efforts: NIST PQC standards are being verified using tools like EasyCrypt, Jasmin, and CryptoVerif. Lattice-based schemes require careful verification of polynomial arithmetic and sampling. Side-channel resistance claims also benefit from formal verification of constant-time implementation properties.',
    relatedModule: '/learn/research-quantum-impact',
    complexity: 'advanced',
    category: 'concept',
  },
]
