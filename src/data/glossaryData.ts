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
    term: 'Ed25519',
    definition:
      'A high-performance digital signature algorithm using the Edwards curve Curve25519. Used in SSH, TLS, and Solana.',
    relatedModule: '/learn/digital-assets',
    complexity: 'intermediate',
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
]
