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
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Q-Day',
    definition:
      'The hypothetical future date when a quantum computer becomes powerful enough to break current public-key cryptography (RSA, ECC).',
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
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Private Key',
    definition:
      'A cryptographic key kept secret by its owner. Used to decrypt data or create digital signatures.',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Key Pair',
    definition:
      'A mathematically linked public key and private key used together for encryption/decryption or signing/verification.',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Hybrid Cryptography',
    definition:
      'Using both classical and post-quantum algorithms together during the transition period, providing security even if one algorithm is broken.',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Crypto Agility',
    definition:
      'The ability of a system to quickly switch between cryptographic algorithms without major redesign, critical for adapting to PQC.',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Qubit',
    definition:
      'The basic unit of quantum information, analogous to a classical bit but capable of existing in superposition of 0 and 1 simultaneously.',
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Superposition',
    definition:
      'A quantum property where a qubit can represent both 0 and 1 at the same time, enabling quantum computers to explore many solutions simultaneously.',
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
      'FFT over NTRU-Lattice-Based Digital Signature Algorithm (formerly Falcon), a compact PQC signature scheme. Defined in the draft FIPS 206.',
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
    complexity: 'advanced',
    category: 'algorithm',
  },
  {
    term: 'HQC',
    definition:
      'Hamming Quasi-Cyclic, a code-based KEM selected by NIST as an additional standard. Uses error-correcting codes for security.',
    complexity: 'advanced',
    category: 'algorithm',
  },
  {
    term: 'Classic McEliece',
    definition:
      'A code-based KEM with very large public keys but extremely conservative security assumptions. One of the oldest post-quantum proposals.',
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
    relatedModule: '/library',
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
    complexity: 'beginner',
    category: 'algorithm',
  },
  {
    term: "Shor's Algorithm",
    definition:
      'A quantum algorithm that can efficiently factor large numbers and compute discrete logarithms, breaking RSA and ECC.',
    complexity: 'intermediate',
    category: 'algorithm',
  },
  {
    term: "Grover's Algorithm",
    definition:
      'A quantum algorithm that speeds up brute-force searches, effectively halving the security level of symmetric ciphers and hash functions.',
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
    relatedModule: '/library',
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
    relatedModule: '/threats',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'S/MIME',
    acronym: 'S/MIME',
    definition:
      'Secure/Multipurpose Internet Mail Extensions, a standard for email encryption and digital signing. PQC integration via ML-KEM and ML-DSA.',
    relatedModule: '/library',
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
    relatedModule: '/library',
    complexity: 'advanced',
    category: 'protocol',
  },
  {
    term: 'OpenPGP',
    definition:
      'An open standard for email encryption and signing based on PGP. PQC integration adds composite ML-KEM+ECC encryption and ML-DSA+ECC signatures.',
    relatedModule: '/library',
    complexity: 'intermediate',
    category: 'protocol',
  },
  {
    term: 'Signal Protocol',
    acronym: 'PQXDH',
    definition:
      'The encryption protocol used by Signal, WhatsApp, and other messengers. Updated with PQXDH to add ML-KEM-1024 for post-quantum security.',
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
    term: 'FIPS 203',
    definition:
      'The NIST standard defining ML-KEM (Module-Lattice-Based Key Encapsulation Mechanism), published August 2024.',
    relatedModule: '/library',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'FIPS 204',
    definition:
      'The NIST standard defining ML-DSA (Module-Lattice-Based Digital Signature Algorithm), published August 2024.',
    relatedModule: '/library',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'FIPS 205',
    definition:
      'The NIST standard defining SLH-DSA (Stateless Hash-Based Digital Signature Algorithm), published August 2024.',
    relatedModule: '/library',
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
    definition:
      'An international standard (ISO/IEC 15408) for evaluating the security properties of IT products, used globally for government procurement.',
    relatedModule: '/compliance',
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
      'The draft NIST standard defining FN-DSA (FFT over NTRU-Lattice-Based Digital Signature Algorithm, formerly Falcon). Expected finalization in 2025-2026.',
    relatedModule: '/library',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'FIPS 186-5',
    definition:
      'The NIST Digital Signature Standard defining RSA, ECDSA, and EdDSA. Being deprecated in favor of PQC signature algorithms per NIST IR 8547.',
    relatedModule: '/library',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'NIST IR 8547',
    definition:
      'NIST Internal Report establishing the PQC transition timeline: deprecation of classical asymmetric crypto by 2030, disallowment by 2035.',
    technicalNote:
      'Covers RSA, ECDSA, ECDH, EdDSA, DH, and DSA. The most authoritative U.S. government PQC migration deadline document.',
    relatedModule: '/library',
    complexity: 'intermediate',
    category: 'standard',
  },
  {
    term: 'NIST SP 800-208',
    definition:
      'NIST recommendation for stateful hash-based signature schemes LMS and XMSS, used for firmware signing and secure boot.',
    relatedModule: '/library',
    complexity: 'advanced',
    category: 'standard',
  },
  {
    term: 'RFC 9629',
    definition:
      'IETF standard defining how to use Key Encapsulation Mechanisms (KEMs) in the Cryptographic Message Syntax (CMS) for encrypted messaging.',
    relatedModule: '/library',
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
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Hash-Based Signatures',
    definition:
      'Digital signature schemes whose security relies only on the properties of hash functions. Very conservative security but can be stateful.',
    technicalNote:
      'Stateful: LMS/XMSS (must track which keys are used). Stateless: SLH-DSA/SPHINCS+ (larger signatures).',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Code-Based Cryptography',
    definition:
      'PQC algorithms based on the hardness of decoding random linear error-correcting codes. Used by Classic McEliece and HQC.',
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
    complexity: 'beginner',
    category: 'concept',
  },
  {
    term: 'Quantum Advantage',
    definition:
      'The point at which a quantum computer can solve a specific problem faster than any classical computer. Also called "quantum supremacy."',
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
      'An X.509 certificate containing both classical and PQC keys/signatures, enabling backward compatibility while providing post-quantum security.',
    technicalNote:
      'Defined in IETF drafts: composite ML-KEM (draft-ietf-lamps-pq-composite-kem) and composite ML-DSA (draft-ietf-lamps-pq-composite-sigs).',
    relatedModule: '/library',
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
    relatedModule: '/threats',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'V2X Communication',
    acronym: 'V2X',
    definition:
      'Vehicle-to-Everything communication, enabling cars to exchange safety data with infrastructure and other vehicles. Uses ECDSA P-256 certificates that are quantum-vulnerable.',
    relatedModule: '/threats',
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
    relatedModule: '/migrate',
    complexity: 'intermediate',
    category: 'concept',
  },
  {
    term: 'Secure Boot',
    definition:
      'A hardware-enforced chain of trust that verifies each component in the boot process is signed by a trusted authority. Requires PQC-capable signature verification.',
    relatedModule: '/migrate',
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
    relatedModule: '/library',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'Cryptographic Inventory',
    definition:
      'A comprehensive catalog of all cryptographic algorithms, protocols, keys, and certificates in an organization, essential for planning PQC migration.',
    relatedModule: '/assess',
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
    relatedModule: '/threats',
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
    relatedModule: '/migrate',
    complexity: 'advanced',
    category: 'concept',
  },
  {
    term: 'DUKPT',
    acronym: 'DUKPT',
    definition:
      'Derived Unique Key Per Transaction, a key management scheme for payment terminals that derives a unique encryption key for each transaction. Currently uses Triple-DES.',
    relatedModule: '/threats',
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
    complexity: 'intermediate',
    category: 'algorithm',
  },
  {
    term: 'SHAKE',
    definition:
      'Extendable-Output Functions from the SHA-3 family (SHAKE128, SHAKE256). Unlike fixed-length hashes, SHAKE can produce output of any desired length.',
    technicalNote:
      'Used in SLH-DSA-SHAKE parameter sets and as a key derivation mechanism in several PQC algorithms.',
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
    relatedModule: '/library',
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
    relatedModule: '/library',
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
    relatedModule: '/library',
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
    relatedModule: '/library',
    complexity: 'intermediate',
    category: 'protocol',
  },

  // === Standards (additional) ===
  {
    term: 'NIST SP 800-227',
    definition:
      'NIST Special Publication providing recommendations for Key Encapsulation Mechanism (KEM) implementation, including guidance on parameter selection and secure use of ML-KEM.',
    relatedModule: '/library',
    complexity: 'advanced',
    category: 'standard',
  },
  {
    term: 'NIST IR 8545',
    definition:
      'NIST Internal Report documenting the selection of HQC as an additional KEM standard, providing a code-based alternative to lattice-based ML-KEM.',
    relatedModule: '/library',
    complexity: 'advanced',
    category: 'standard',
  },
  {
    term: 'RFC 9370',
    definition:
      'IETF standard defining multiple key exchanges in IKEv2, enabling hybrid classical + PQC key exchange for IPsec VPNs.',
    technicalNote:
      'Allows adding ML-KEM alongside classical Diffie-Hellman in a single IKEv2 handshake without breaking backward compatibility.',
    relatedModule: '/library',
    complexity: 'advanced',
    category: 'standard',
  },
  {
    term: 'RFC 9881',
    definition:
      'IETF standard defining how to use ML-DSA digital signatures in X.509 certificates and Certificate Revocation Lists (CRLs).',
    relatedModule: '/library',
    complexity: 'advanced',
    category: 'standard',
  },
  {
    term: 'RFC 9882',
    definition:
      'IETF standard defining the use of ML-DSA signatures in the Cryptographic Message Syntax (CMS), enabling PQC-signed messages and documents.',
    relatedModule: '/library',
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
    relatedModule: '/library',
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
    relatedModule: '/assess',
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
]
