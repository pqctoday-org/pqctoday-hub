import type { QuizQuestion, QuizCategoryMeta } from '@/components/PKILearning/modules/Quiz/types'

export const QUIZ_CATEGORIES: QuizCategoryMeta[] = [
  {
    id: 'pqc-fundamentals',
    label: 'PQC Fundamentals',
    description: 'Quantum threats, HNDL attacks, and the basics of post-quantum cryptography.',
    icon: 'Shield',
    questionCount: 10,
  },
  {
    id: 'algorithm-families',
    label: 'Algorithm Families',
    description:
      'Lattice-based, code-based, and hash-based PQC algorithms — names, properties, and trade-offs.',
    icon: 'Layers',
    questionCount: 12,
  },
  {
    id: 'nist-standards',
    label: 'NIST Standards',
    description: 'FIPS standards, security levels, and the NIST PQC standardization process.',
    icon: 'FileCheck',
    questionCount: 10,
  },
  {
    id: 'migration-planning',
    label: 'Migration Planning',
    description: 'Migration frameworks, crypto agility, CBOM, and hybrid deployment strategies.',
    icon: 'Route',
    questionCount: 10,
  },
  {
    id: 'compliance',
    label: 'Compliance & Regulations',
    description: 'CNSA 2.0, ANSSI, eIDAS 2.0, and global PQC compliance deadlines.',
    icon: 'Scale',
    questionCount: 10,
  },
  {
    id: 'protocol-integration',
    label: 'Protocol Integration',
    description: 'PQC in TLS, IPsec, CMS/S/MIME, OpenPGP, 5G, and SSH protocols.',
    icon: 'Network',
    questionCount: 10,
  },
  {
    id: 'industry-threats',
    label: 'Industry Threats',
    description: 'Sector-specific quantum risks across finance, healthcare, telecom, and more.',
    icon: 'AlertTriangle',
    questionCount: 8,
  },
  {
    id: 'crypto-operations',
    label: 'Crypto Operations',
    description:
      'KEMs vs signatures, key sizes, encapsulation, performance, and practical trade-offs.',
    icon: 'Key',
    questionCount: 10,
  },
]

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // ═══════════════════════════════════════════════════════════════
  // PQC FUNDAMENTALS (10 questions)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'fund-001',
    category: 'pqc-fundamentals',
    type: 'multiple-choice',
    difficulty: 'beginner',
    question:
      'Which quantum algorithm poses the primary threat to RSA and elliptic-curve cryptography?',
    options: [
      { id: 'a', text: "Grover's Algorithm" },
      { id: 'b', text: "Shor's Algorithm" },
      { id: 'c', text: 'Deutsch-Jozsa Algorithm' },
      { id: 'd', text: 'Bernstein-Vazirani Algorithm' },
    ],
    correctAnswer: 'b',
    explanation:
      "Shor's Algorithm can factor large integers and compute discrete logarithms in polynomial time on a quantum computer, breaking RSA, ECDSA, ECDH, and other public-key algorithms. Grover's Algorithm only provides a quadratic speedup for symmetric key search, effectively halving the bit-security of symmetric ciphers.",
    learnMorePath: '/learn/pqc-101',
  },
  {
    id: 'fund-002',
    category: 'pqc-fundamentals',
    type: 'multiple-choice',
    difficulty: 'beginner',
    question: 'What does HNDL stand for in the context of quantum threats?',
    options: [
      { id: 'a', text: 'Hash-Normalized Decryption Layer' },
      { id: 'b', text: 'Harvest Now, Decrypt Later' },
      { id: 'c', text: 'Hybrid Network Defense Lattice' },
      { id: 'd', text: 'Hardware-Neutralized Data Lock' },
    ],
    correctAnswer: 'b',
    explanation:
      'Harvest Now, Decrypt Later (HNDL) is a strategy where adversaries intercept and store encrypted data today, planning to decrypt it once a cryptographically relevant quantum computer (CRQC) becomes available. Data with long-term sensitivity (10+ years) is especially at risk.',
    learnMorePath: '/learn/pqc-101',
  },
  {
    id: 'fund-003',
    category: 'pqc-fundamentals',
    type: 'true-false',
    difficulty: 'beginner',
    question:
      'True or False: Quantum computers threaten symmetric encryption algorithms like AES-256 just as severely as they threaten RSA.',
    options: [
      { id: 'true', text: 'True' },
      { id: 'false', text: 'False' },
    ],
    correctAnswer: 'false',
    explanation:
      "False. Grover's Algorithm reduces symmetric key security by half (e.g., AES-256 becomes ~128-bit equivalent), but this is manageable by doubling key sizes. Shor's Algorithm, in contrast, completely breaks public-key algorithms like RSA and ECC. Symmetric encryption remains relatively safe with sufficient key lengths.",
    learnMorePath: '/learn/pqc-101',
  },
  {
    id: 'fund-004',
    category: 'pqc-fundamentals',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    question: 'What is a Cryptographically Relevant Quantum Computer (CRQC)?',
    options: [
      { id: 'a', text: 'Any quantum computer with more than 100 qubits' },
      { id: 'b', text: 'A quantum computer capable of breaking current public-key cryptography' },
      { id: 'c', text: 'A quantum computer that can only perform hash computations' },
      { id: 'd', text: 'A classical-quantum hybrid used for key generation' },
    ],
    correctAnswer: 'b',
    explanation:
      "A CRQC is a quantum computer powerful enough to run Shor's Algorithm at scale, requiring thousands of stable logical qubits. Estimates for when a CRQC might exist range from 2030 to 2040, with significant uncertainty.",
    learnMorePath: '/threats',
  },
  {
    id: 'fund-005',
    category: 'pqc-fundamentals',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    question: 'What is the primary purpose of hybrid cryptography in the PQC transition?',
    options: [
      { id: 'a', text: 'To reduce key sizes by combining two algorithms' },
      { id: 'b', text: 'To maintain security even if one algorithm is broken' },
      { id: 'c', text: 'To speed up encryption by parallelizing operations' },
      { id: 'd', text: 'To comply with FIPS 140-3 requirements' },
    ],
    correctAnswer: 'b',
    explanation:
      'Hybrid cryptography combines a classical algorithm (e.g., X25519) with a PQC algorithm (e.g., ML-KEM-768). If either algorithm is later found to be insecure, the other still provides protection. This is a recommended transition strategy during the migration period.',
    learnMorePath: '/learn/pqc-101',
  },
  {
    id: 'fund-006',
    category: 'pqc-fundamentals',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    question: 'What is crypto agility?',
    options: [
      { id: 'a', text: 'The speed at which a cryptographic algorithm runs' },
      {
        id: 'b',
        text: 'The ability to quickly swap cryptographic algorithms without redesigning systems',
      },
      { id: 'c', text: 'A metric for measuring quantum computer performance' },
      { id: 'd', text: 'The process of compressing encrypted data' },
    ],
    correctAnswer: 'b',
    explanation:
      'Crypto agility is the ability of a system to switch cryptographic algorithms, parameters, or protocols with minimal disruption. It is critical for the PQC transition because it allows organizations to adopt new standards as they mature without requiring full system rebuilds.',
    learnMorePath: '/migrate',
  },
  {
    id: 'fund-007',
    category: 'pqc-fundamentals',
    type: 'true-false',
    difficulty: 'beginner',
    question: 'True or False: Post-quantum cryptography requires quantum computers to operate.',
    options: [
      { id: 'true', text: 'True' },
      { id: 'false', text: 'False' },
    ],
    correctAnswer: 'false',
    explanation:
      'False. Post-quantum cryptographic algorithms are designed to run on classical (non-quantum) computers. They are called "post-quantum" because they are resistant to attacks from quantum computers, not because they require quantum hardware.',
    learnMorePath: '/learn/pqc-101',
  },
  {
    id: 'fund-008',
    category: 'pqc-fundamentals',
    type: 'multiple-choice',
    difficulty: 'advanced',
    question:
      'Which mathematical problem forms the security foundation for lattice-based PQC algorithms like ML-KEM and ML-DSA?',
    options: [
      { id: 'a', text: 'Integer Factorization Problem' },
      { id: 'b', text: 'Discrete Logarithm Problem' },
      { id: 'c', text: 'Learning With Errors (LWE)' },
      { id: 'd', text: 'Hash Collision Resistance' },
    ],
    correctAnswer: 'c',
    explanation:
      'Lattice-based PQC algorithms rely on the Learning With Errors (LWE) problem and its structured variant, Module-LWE. These problems are believed to be hard for both classical and quantum computers. Integer factorization and discrete logarithms are the problems broken by quantum computers.',
    learnMorePath: '/algorithms',
  },
  {
    id: 'fund-009',
    category: 'pqc-fundamentals',
    type: 'multi-select',
    difficulty: 'intermediate',
    question:
      "Which of the following classical algorithms are vulnerable to quantum attacks via Shor's Algorithm? (Select all that apply)",
    options: [
      { id: 'a', text: 'RSA' },
      { id: 'b', text: 'AES-256' },
      { id: 'c', text: 'ECDSA' },
      { id: 'd', text: 'ECDH' },
    ],
    correctAnswer: ['a', 'c', 'd'],
    explanation:
      "RSA, ECDSA, and ECDH are all broken by Shor's Algorithm because they rely on integer factorization or discrete logarithm problems. AES-256 is a symmetric cipher and is only weakened (to ~128-bit equivalent) by Grover's Algorithm, not broken.",
    learnMorePath: '/algorithms',
  },
  {
    id: 'fund-010',
    category: 'pqc-fundamentals',
    type: 'multiple-choice',
    difficulty: 'advanced',
    question: 'What does Q-Day refer to?',
    options: [
      { id: 'a', text: 'The day NIST publishes final PQC standards' },
      {
        id: 'b',
        text: 'The day a quantum computer first breaks a widely used public-key algorithm',
      },
      { id: 'c', text: 'The deadline for organizations to complete PQC migration' },
      { id: 'd', text: 'The day quantum key distribution becomes commercially available' },
    ],
    correctAnswer: 'b',
    explanation:
      'Q-Day is the hypothetical future date when a cryptographically relevant quantum computer (CRQC) first breaks a widely deployed public-key cryptographic algorithm like RSA or ECC. It is a critical planning milestone because HNDL attacks mean data must be protected well before Q-Day arrives.',
    learnMorePath: '/threats',
  },

  // ═══════════════════════════════════════════════════════════════
  // ALGORITHM FAMILIES (12 questions)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'algo-001',
    category: 'algorithm-families',
    type: 'multiple-choice',
    difficulty: 'beginner',
    question: 'What was ML-KEM formerly known as during the NIST PQC competition?',
    options: [
      { id: 'a', text: 'Falcon' },
      { id: 'b', text: 'SPHINCS+' },
      { id: 'c', text: 'CRYSTALS-Kyber' },
      { id: 'd', text: 'NTRU' },
    ],
    correctAnswer: 'c',
    explanation:
      'ML-KEM (Module-Lattice-Based Key Encapsulation Mechanism) was originally known as CRYSTALS-Kyber during the NIST PQC standardization competition. It was standardized as FIPS 203 in August 2024.',
    learnMorePath: '/algorithms',
  },
  {
    id: 'algo-002',
    category: 'algorithm-families',
    type: 'multiple-choice',
    difficulty: 'beginner',
    question: 'Which PQC algorithm family does SLH-DSA (formerly SPHINCS+) belong to?',
    options: [
      { id: 'a', text: 'Lattice-based' },
      { id: 'b', text: 'Code-based' },
      { id: 'c', text: 'Hash-based' },
      { id: 'd', text: 'Multivariate' },
    ],
    correctAnswer: 'c',
    explanation:
      'SLH-DSA (Stateless Hash-Based Digital Signature Algorithm) is hash-based. Its security relies solely on the properties of hash functions, making it one of the most conservative PQC signature schemes. It was standardized as FIPS 205.',
    learnMorePath: '/algorithms',
  },
  {
    id: 'algo-003',
    category: 'algorithm-families',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    question:
      'Which PQC algorithm was selected by NIST in March 2025 as a backup KEM to provide algorithmic diversity from ML-KEM?',
    options: [
      { id: 'a', text: 'FrodoKEM' },
      { id: 'b', text: 'Classic McEliece' },
      { id: 'c', text: 'HQC' },
      { id: 'd', text: 'BIKE' },
    ],
    correctAnswer: 'c',
    explanation:
      'HQC (Hamming Quasi-Cyclic) was selected in March 2025 as the 5th PQC standard. As a code-based KEM, it provides algorithmic diversity from the lattice-based ML-KEM, serving as a backup if lattice-based vulnerabilities are discovered.',
    learnMorePath: '/algorithms',
  },
  {
    id: 'algo-004',
    category: 'algorithm-families',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    question: 'What is the key advantage of FN-DSA (formerly Falcon) over ML-DSA?',
    options: [
      { id: 'a', text: 'Stronger security at the same parameter level' },
      { id: 'b', text: 'Much more compact signatures' },
      { id: 'c', text: 'Faster key generation' },
      { id: 'd', text: 'Simpler implementation requirements' },
    ],
    correctAnswer: 'b',
    explanation:
      'FN-DSA produces extremely compact signatures (~0.65KB for FN-DSA-512 vs ~2.4KB for ML-DSA-44). This makes it ideal for certificates and constrained devices. However, it requires careful floating-point implementation to resist side-channel attacks.',
    learnMorePath: '/algorithms',
  },
  {
    id: 'algo-005',
    category: 'algorithm-families',
    type: 'multiple-choice',
    difficulty: 'advanced',
    question:
      'What is the approximate public key size of Classic McEliece-8192128, and why does this limit its deployment?',
    options: [
      { id: 'a', text: '~1.3MB — too large for most network protocols and constrained devices' },
      { id: 'b', text: '~64KB — manageable but requires protocol adjustments' },
      { id: 'c', text: '~256 bytes — comparable to classical algorithms' },
      { id: 'd', text: '~10KB — similar to FrodoKEM' },
    ],
    correctAnswer: 'a',
    explanation:
      'Classic McEliece-8192128 has public keys of approximately 1.3MB, making it impractical for most network protocols (TLS, SSH) and constrained environments. However, it is one of the oldest and most conservative PQC proposals (dating to 1978) with extremely fast decapsulation.',
    learnMorePath: '/algorithms',
  },
  {
    id: 'algo-006',
    category: 'algorithm-families',
    type: 'true-false',
    difficulty: 'beginner',
    question: 'True or False: ML-KEM is a digital signature algorithm.',
    options: [
      { id: 'true', text: 'True' },
      { id: 'false', text: 'False' },
    ],
    correctAnswer: 'false',
    explanation:
      'False. ML-KEM (FIPS 203) is a Key Encapsulation Mechanism (KEM) used for key exchange, not for digital signatures. ML-DSA (FIPS 204) is the corresponding lattice-based digital signature algorithm.',
    learnMorePath: '/algorithms',
  },
  {
    id: 'algo-007',
    category: 'algorithm-families',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    question: 'What distinguishes FrodoKEM from ML-KEM in terms of security assumptions?',
    options: [
      { id: 'a', text: 'FrodoKEM uses code-based security while ML-KEM uses lattice-based' },
      {
        id: 'b',
        text: 'FrodoKEM uses "plain" LWE while ML-KEM uses structured Module-LWE',
      },
      { id: 'c', text: 'FrodoKEM uses hash-based security while ML-KEM uses lattice-based' },
      { id: 'd', text: 'They have identical security assumptions with different key sizes' },
    ],
    correctAnswer: 'b',
    explanation:
      'FrodoKEM is based on the "plain" Learning With Errors (LWE) problem, which makes fewer structural assumptions than ML-KEM\'s Module-LWE. This makes FrodoKEM more conservative but significantly slower (10-20x) and with much larger keys (9-21KB vs 0.8-1.6KB).',
    learnMorePath: '/algorithms',
  },
  {
    id: 'algo-008',
    category: 'algorithm-families',
    type: 'multi-select',
    difficulty: 'intermediate',
    question: 'Which of the following are lattice-based PQC algorithms? (Select all that apply)',
    options: [
      { id: 'a', text: 'ML-KEM' },
      { id: 'b', text: 'HQC' },
      { id: 'c', text: 'ML-DSA' },
      { id: 'd', text: 'FN-DSA' },
    ],
    correctAnswer: ['a', 'c', 'd'],
    explanation:
      'ML-KEM, ML-DSA, and FN-DSA are all lattice-based. ML-KEM and ML-DSA use Module-LWE, while FN-DSA uses NTRU lattices. HQC is code-based, using Hamming quasi-cyclic codes for its security.',
    learnMorePath: '/algorithms',
  },
  {
    id: 'algo-009',
    category: 'algorithm-families',
    type: 'multiple-choice',
    difficulty: 'advanced',
    question: 'What is the main trade-off between SLH-DSA "small" (s) and "fast" (f) variants?',
    options: [
      { id: 'a', text: 'Small variants have larger keys but faster verification' },
      {
        id: 'b',
        text: 'Small variants produce smaller signatures but are much slower to sign',
      },
      { id: 'c', text: 'Fast variants use weaker hash functions for speed' },
      { id: 'd', text: 'There is no meaningful difference — they are interchangeable' },
    ],
    correctAnswer: 'b',
    explanation:
      'SLH-DSA "small" (s) variants produce compact signatures but are 50-500x slower at signing. "Fast" (f) variants sign much faster (~5x relative) but produce larger signatures (~17KB for SHA2-128f). Verification speed is similar for both.',
    learnMorePath: '/algorithms',
  },
  {
    id: 'algo-010',
    category: 'algorithm-families',
    type: 'multiple-choice',
    difficulty: 'beginner',
    question: 'What was ML-DSA formerly known as during the NIST PQC competition?',
    options: [
      { id: 'a', text: 'CRYSTALS-Dilithium' },
      { id: 'b', text: 'CRYSTALS-Kyber' },
      { id: 'c', text: 'SPHINCS+' },
      { id: 'd', text: 'Rainbow' },
    ],
    correctAnswer: 'a',
    explanation:
      'ML-DSA (Module-Lattice-Based Digital Signature Algorithm) was originally known as CRYSTALS-Dilithium. It is the primary PQC digital signature algorithm, standardized as FIPS 204 in August 2024.',
    learnMorePath: '/algorithms',
  },
  {
    id: 'algo-011',
    category: 'algorithm-families',
    type: 'multiple-choice',
    difficulty: 'advanced',
    question:
      'Which stateful hash-based signature schemes are recommended by NIST SP 800-208 for firmware and software signing?',
    options: [
      { id: 'a', text: 'SLH-DSA and ML-DSA' },
      { id: 'b', text: 'XMSS and LMS/HSS' },
      { id: 'c', text: 'FN-DSA and HQC' },
      { id: 'd', text: 'Ed25519 and ECDSA' },
    ],
    correctAnswer: 'b',
    explanation:
      'NIST SP 800-208 recommends XMSS (eXtended Merkle Signature Scheme, RFC 8391) and LMS/HSS (Leighton-Micali Signature / Hierarchical Signature System) for firmware and software signing. These are stateful schemes that require careful key state management.',
    learnMorePath: '/algorithms',
  },
  {
    id: 'algo-012',
    category: 'algorithm-families',
    type: 'true-false',
    difficulty: 'intermediate',
    question: 'True or False: HQC is a lattice-based key encapsulation mechanism.',
    options: [
      { id: 'true', text: 'True' },
      { id: 'false', text: 'False' },
    ],
    correctAnswer: 'false',
    explanation:
      'False. HQC (Hamming Quasi-Cyclic) is a code-based KEM, not lattice-based. It was specifically selected to provide algorithmic diversity from the lattice-based ML-KEM, ensuring a fallback exists if lattice-based approaches are compromised.',
    learnMorePath: '/algorithms',
  },

  // ═══════════════════════════════════════════════════════════════
  // NIST STANDARDS (10 questions)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'nist-001',
    category: 'nist-standards',
    type: 'multiple-choice',
    difficulty: 'beginner',
    question: 'Which FIPS standard defines ML-KEM?',
    options: [
      { id: 'a', text: 'FIPS 203' },
      { id: 'b', text: 'FIPS 204' },
      { id: 'c', text: 'FIPS 205' },
      { id: 'd', text: 'FIPS 206' },
    ],
    correctAnswer: 'a',
    explanation:
      'FIPS 203 defines ML-KEM (Module-Lattice-Based Key Encapsulation Mechanism). FIPS 204 is ML-DSA, FIPS 205 is SLH-DSA, and FIPS 206 (draft) is FN-DSA.',
    learnMorePath: '/compliance',
  },
  {
    id: 'nist-002',
    category: 'nist-standards',
    type: 'multiple-choice',
    difficulty: 'beginner',
    question: 'When were FIPS 203, 204, and 205 published?',
    options: [
      { id: 'a', text: 'January 2023' },
      { id: 'b', text: 'August 2024' },
      { id: 'c', text: 'March 2025' },
      { id: 'd', text: 'January 2026' },
    ],
    correctAnswer: 'b',
    explanation:
      'FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), and FIPS 205 (SLH-DSA) were all published by NIST in August 2024, marking a historic milestone in post-quantum cryptography standardization.',
    learnMorePath: '/timeline',
  },
  {
    id: 'nist-003',
    category: 'nist-standards',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    question: 'NIST Security Level 3 is comparable to breaking which symmetric cipher?',
    options: [
      { id: 'a', text: 'AES-128' },
      { id: 'b', text: 'AES-192' },
      { id: 'c', text: 'AES-256' },
      { id: 'd', text: '3DES' },
    ],
    correctAnswer: 'b',
    explanation:
      'NIST Security Level 3 provides security comparable to breaking AES-192. Level 1 corresponds to AES-128, and Level 5 corresponds to AES-256. Level 3 is the recommended minimum for most general-use applications.',
    learnMorePath: '/algorithms',
  },
  {
    id: 'nist-004',
    category: 'nist-standards',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    question:
      'According to NIST IR 8547, by which year will classical public-key algorithms like RSA and ECDSA be deprecated?',
    options: [
      { id: 'a', text: '2027' },
      { id: 'b', text: '2030' },
      { id: 'c', text: '2033' },
      { id: 'd', text: '2035' },
    ],
    correctAnswer: 'b',
    explanation:
      'NIST IR 8547 establishes a two-phase timeline: RSA, ECDSA, ECDH, EdDSA, DH, and DSA will be deprecated by 2030, and entirely disallowed by 2035.',
    learnMorePath: '/compliance',
  },
  {
    id: 'nist-005',
    category: 'nist-standards',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    question: 'What is the current status of FIPS 206 (FN-DSA)?',
    options: [
      { id: 'a', text: 'Published and finalized' },
      { id: 'b', text: 'Draft standard, expected finalization in 2026-2027' },
      { id: 'c', text: 'Withdrawn from consideration' },
      { id: 'd', text: 'Replaced by a different algorithm' },
    ],
    correctAnswer: 'b',
    explanation:
      'FIPS 206 (FN-DSA, formerly Falcon) is currently in draft status. It was submitted as a draft in August 2025 and is expected to be finalized in late 2026 or 2027. It provides compact signatures valuable for certificates and constrained devices.',
    learnMorePath: '/compliance',
  },
  {
    id: 'nist-006',
    category: 'nist-standards',
    type: 'true-false',
    difficulty: 'beginner',
    question:
      'True or False: NIST Security Level 5 provides the highest level of post-quantum security defined by NIST.',
    options: [
      { id: 'true', text: 'True' },
      { id: 'false', text: 'False' },
    ],
    correctAnswer: 'true',
    explanation:
      'True. NIST Security Level 5 is the highest, comparable to breaking AES-256. It is typically recommended for government, defense, and scenarios requiring maximum long-term security. Level 3 (AES-192 equivalent) is generally recommended for most applications.',
    learnMorePath: '/algorithms',
  },
  {
    id: 'nist-007',
    category: 'nist-standards',
    type: 'multiple-choice',
    difficulty: 'advanced',
    question: 'What does NIST SP 800-227 provide guidance on?',
    options: [
      { id: 'a', text: 'Digital signature algorithm selection' },
      { id: 'b', text: 'Key Encapsulation Mechanism (KEM) recommendations' },
      { id: 'c', text: 'Hash function security requirements' },
      { id: 'd', text: 'Random number generation standards' },
    ],
    correctAnswer: 'b',
    explanation:
      'NIST SP 800-227, published in September 2025, provides recommendations for Key Encapsulation Mechanisms (KEMs), including guidance on ML-KEM parameter selection and hybrid key exchange approaches.',
    learnMorePath: '/compliance',
  },
  {
    id: 'nist-008',
    category: 'nist-standards',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    question: 'Which ML-KEM variant does NIST recommend for general-use applications?',
    options: [
      { id: 'a', text: 'ML-KEM-512 (Level 1)' },
      { id: 'b', text: 'ML-KEM-768 (Level 3)' },
      { id: 'c', text: 'ML-KEM-1024 (Level 5)' },
      { id: 'd', text: 'All variants are equally recommended' },
    ],
    correctAnswer: 'b',
    explanation:
      'ML-KEM-768 (NIST Security Level 3) is recommended for general-use applications. It provides a balance of security and performance. ML-KEM-1024 (Level 5) is reserved for government/defense use cases requiring the highest security.',
    learnMorePath: '/algorithms',
  },
  {
    id: 'nist-009',
    category: 'nist-standards',
    type: 'multi-select',
    difficulty: 'intermediate',
    question:
      'Which PQC algorithms were standardized by NIST in the first batch (August 2024)? (Select all that apply)',
    options: [
      { id: 'a', text: 'ML-KEM (FIPS 203)' },
      { id: 'b', text: 'ML-DSA (FIPS 204)' },
      { id: 'c', text: 'SLH-DSA (FIPS 205)' },
      { id: 'd', text: 'FN-DSA (FIPS 206)' },
    ],
    correctAnswer: ['a', 'b', 'c'],
    explanation:
      'ML-KEM (FIPS 203), ML-DSA (FIPS 204), and SLH-DSA (FIPS 205) were all published in August 2024. FN-DSA (FIPS 206) remains a draft standard expected for finalization in 2026-2027.',
    learnMorePath: '/timeline',
  },
  {
    id: 'nist-010',
    category: 'nist-standards',
    type: 'multiple-choice',
    difficulty: 'advanced',
    question:
      'According to NIST IR 8547, what is the difference between "deprecated" and "disallowed" for legacy algorithms?',
    options: [
      { id: 'a', text: 'They mean the same thing — the algorithm cannot be used' },
      {
        id: 'b',
        text: 'Deprecated means discouraged but still permitted; disallowed means prohibited entirely',
      },
      { id: 'c', text: 'Deprecated applies to software; disallowed applies to hardware' },
      { id: 'd', text: 'Deprecated is a warning; disallowed means fines are imposed' },
    ],
    correctAnswer: 'b',
    explanation:
      'Deprecated (2030) means the algorithm is strongly discouraged for new deployments but may still be used for legacy compatibility. Disallowed (2035) means the algorithm must not be used under any circumstances in systems subject to NIST guidelines.',
    learnMorePath: '/compliance',
  },

  // ═══════════════════════════════════════════════════════════════
  // MIGRATION PLANNING (10 questions)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'migr-001',
    category: 'migration-planning',
    type: 'multiple-choice',
    difficulty: 'beginner',
    question: 'What is a Cryptographic Bill of Materials (CBOM)?',
    options: [
      { id: 'a', text: 'A list of cryptographic hardware prices' },
      {
        id: 'b',
        text: 'An inventory of all cryptographic algorithms, protocols, and keys used in a system',
      },
      { id: 'c', text: 'A government mandate for cryptographic compliance' },
      { id: 'd', text: 'A quantum computer component specification' },
    ],
    correctAnswer: 'b',
    explanation:
      'A CBOM is a comprehensive inventory of cryptographic assets — algorithms, key lengths, certificates, protocols, and libraries — used across an organization. It is the essential first step in PQC migration planning, similar to a Software Bill of Materials (SBOM) for cryptography.',
    learnMorePath: '/migrate',
  },
  {
    id: 'migr-002',
    category: 'migration-planning',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    question: 'In the 7-phase PQC migration framework, what is the recommended first step?',
    options: [
      { id: 'a', text: 'Deploy hybrid certificates to production' },
      { id: 'b', text: 'Assessment & Inventory — build a CBOM and identify vulnerable algorithms' },
      { id: 'c', text: 'Purchase quantum-safe HSMs' },
      { id: 'd', text: 'Notify regulators of migration plans' },
    ],
    correctAnswer: 'b',
    explanation:
      'The first phase is Assessment & Inventory (4-8 weeks): building a Cryptographic Bill of Materials (CBOM), identifying quantum-vulnerable algorithms, assessing HNDL risk for long-lived data, and mapping certificate chains.',
    learnMorePath: '/migrate',
  },
  {
    id: 'migr-003',
    category: 'migration-planning',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    question: 'During PQC migration, which systems should be prioritized first for protection?',
    options: [
      { id: 'a', text: 'Internal development tools' },
      { id: 'b', text: 'External-facing systems handling long-lived sensitive data' },
      { id: 'c', text: 'Marketing websites' },
      { id: 'd', text: 'Employee email (internal only)' },
    ],
    correctAnswer: 'b',
    explanation:
      'External-facing systems (TLS endpoints, VPNs) handling data with long confidentiality lifetimes should be prioritized because they are most vulnerable to HNDL attacks. Data intercepted today from these systems could be decrypted by future quantum computers.',
    learnMorePath: '/migrate',
  },
  {
    id: 'migr-004',
    category: 'migration-planning',
    type: 'true-false',
    difficulty: 'beginner',
    question:
      'True or False: Organizations should wait until a CRQC exists before beginning their PQC migration.',
    options: [
      { id: 'true', text: 'True' },
      { id: 'false', text: 'False' },
    ],
    correctAnswer: 'false',
    explanation:
      'False. Due to HNDL attacks, organizations must begin migration now. Data intercepted today can be stored and decrypted later. Additionally, large-scale migrations take years to complete, so starting early is essential to meet 2030/2035 deprecation deadlines.',
    learnMorePath: '/migrate',
  },
  {
    id: 'migr-005',
    category: 'migration-planning',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    question: 'What is the recommended approach for initial PQC deployment in production TLS?',
    options: [
      { id: 'a', text: 'Replace all classical algorithms immediately with PQC-only' },
      { id: 'b', text: 'Deploy hybrid key exchange (e.g., X25519 + ML-KEM-768)' },
      { id: 'c', text: 'Disable TLS until PQC is fully mature' },
      { id: 'd', text: 'Use quantum key distribution instead' },
    ],
    correctAnswer: 'b',
    explanation:
      'Hybrid key exchange (combining classical + PQC algorithms) is the recommended initial approach. It maintains security even if one algorithm is broken and ensures backward compatibility. X25519MLKEM768 is already deployed in major browsers like Chrome and Firefox.',
    learnMorePath: '/migrate',
  },
  {
    id: 'migr-006',
    category: 'migration-planning',
    type: 'multiple-choice',
    difficulty: 'advanced',
    question: 'Why is re-encrypting archived data an important part of PQC migration?',
    options: [
      { id: 'a', text: 'To reduce storage costs' },
      { id: 'b', text: 'To counter HNDL threats against already-stored encrypted data' },
      { id: 'c', text: 'To improve data compression ratios' },
      { id: 'd', text: 'To comply with GDPR right-to-be-forgotten' },
    ],
    correctAnswer: 'b',
    explanation:
      'Archived data encrypted with quantum-vulnerable algorithms is susceptible to HNDL attacks — adversaries may have already captured copies. Re-encrypting with PQC algorithms ensures this data remains protected even when quantum computers become available.',
    learnMorePath: '/migrate',
  },
  {
    id: 'migr-007',
    category: 'migration-planning',
    type: 'multi-select',
    difficulty: 'intermediate',
    question:
      'Which of the following are key activities in the "Testing & Validation" phase of PQC migration? (Select all that apply)',
    options: [
      { id: 'a', text: 'Pilot hybrid TLS/SSH with ML-KEM + X25519' },
      { id: 'b', text: 'Test VPN PQC tunnels with IKEv2' },
      { id: 'c', text: 'Measure performance impact on production workloads' },
      { id: 'd', text: 'Submit final compliance reports to regulators' },
    ],
    correctAnswer: ['a', 'b', 'c'],
    explanation:
      'The Testing & Validation phase (2-4 months) focuses on piloting hybrid TLS/SSH, testing VPN PQC tunnels, validating certificate chain interoperability, and measuring performance impact. Compliance reporting comes later during monitoring and optimization.',
    learnMorePath: '/migrate',
  },
  {
    id: 'migr-008',
    category: 'migration-planning',
    type: 'multiple-choice',
    difficulty: 'beginner',
    question:
      'Which framework document provides the formal PQC transition timeline with deprecation and disallowment dates?',
    options: [
      { id: 'a', text: 'FIPS 203' },
      { id: 'b', text: 'NIST IR 8547' },
      { id: 'c', text: 'RFC 9629' },
      { id: 'd', text: 'ETSI TR 103 619' },
    ],
    correctAnswer: 'b',
    explanation:
      'NIST IR 8547 (Transition to Post-Quantum Cryptography Standards) establishes the formal timeline: classical public-key algorithms deprecated by 2030 and disallowed by 2035.',
    learnMorePath: '/compliance',
  },
  {
    id: 'migr-009',
    category: 'migration-planning',
    type: 'multiple-choice',
    difficulty: 'advanced',
    question:
      'What is the estimated duration for the full "Hybrid Migration & Rollout" phase in a typical PQC migration?',
    options: [
      { id: 'a', text: '1-2 weeks' },
      { id: 'b', text: '1-2 months' },
      { id: 'c', text: '6-12 months' },
      { id: 'd', text: '3-5 years' },
    ],
    correctAnswer: 'c',
    explanation:
      'The Hybrid Migration & Rollout phase typically takes 6-12 months. This includes deploying hybrid certificates, migrating code signing to PQC, and rolling out hybrid key exchange to production TLS/SSH systems across the organization.',
    learnMorePath: '/migrate',
  },
  {
    id: 'migr-010',
    category: 'migration-planning',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    question: 'What role do HSMs play in PQC migration planning?',
    options: [
      { id: 'a', text: 'HSMs are unnecessary for PQC — software-only solutions are sufficient' },
      {
        id: 'b',
        text: 'HSM firmware must be upgraded to support PQC algorithms before they can generate or store PQC keys',
      },
      { id: 'c', text: 'HSMs automatically detect and block quantum attacks' },
      { id: 'd', text: 'HSMs only store classical keys and cannot support PQC' },
    ],
    correctAnswer: 'b',
    explanation:
      'Hardware Security Modules (HSMs) require firmware upgrades to support PQC key generation, storage, and operations. This is a critical dependency in migration planning, as many HSM vendors are still developing PQC-capable firmware.',
    learnMorePath: '/migrate',
  },

  // ═══════════════════════════════════════════════════════════════
  // COMPLIANCE & REGULATIONS (10 questions)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'comp-001',
    category: 'compliance',
    type: 'multiple-choice',
    difficulty: 'beginner',
    question: 'What does CNSA 2.0 stand for?',
    options: [
      { id: 'a', text: 'Certified National Security Architecture' },
      { id: 'b', text: 'Commercial National Security Algorithm Suite 2.0' },
      { id: 'c', text: 'Cryptographic NIST Standard Algorithm' },
      { id: 'd', text: 'Central Network Security Authority' },
    ],
    correctAnswer: 'b',
    explanation:
      "CNSA 2.0 is the NSA's Commercial National Security Algorithm Suite 2.0. It mandates the transition to quantum-resistant algorithms for National Security Systems (NSS), with a phased timeline from 2025 to 2035.",
    learnMorePath: '/compliance',
  },
  {
    id: 'comp-002',
    category: 'compliance',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    question:
      'By what year does CNSA 2.0 require all National Security Systems software to use PQC signatures exclusively?',
    options: [
      { id: 'a', text: '2025' },
      { id: 'b', text: '2027' },
      { id: 'c', text: '2030' },
      { id: 'd', text: '2035' },
    ],
    correctAnswer: 'c',
    explanation:
      'CNSA 2.0 requires all deployed NSS software to use CNSA 2.0 signatures exclusively by 2030. The phased timeline starts with new software acquisitions in 2025, new networking equipment by 2026, and full deployment by 2030, with legacy cryptography entirely disallowed by 2035.',
    learnMorePath: '/compliance',
  },
  {
    id: 'comp-003',
    category: 'compliance',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    question:
      'Which country has set the most aggressive PQC transition deadline, prohibiting traditional asymmetric cryptography by 2030?',
    options: [
      { id: 'a', text: 'United States' },
      { id: 'b', text: 'United Kingdom' },
      { id: 'c', text: 'Australia' },
      { id: 'd', text: 'France' },
    ],
    correctAnswer: 'c',
    explanation:
      "Australia (ASD) has set a 2030 deadline for prohibiting traditional asymmetric cryptography — 5 years ahead of the US NIST IR 8547 disallowment date of 2035. This makes Australia's timeline one of the most aggressive globally.",
    learnMorePath: '/compliance',
  },
  {
    id: 'comp-004',
    category: 'compliance',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    question: "What is ANSSI's phased approach to PQC transition?",
    options: [
      { id: 'a', text: 'Immediate PQC-only deployment with no transition period' },
      {
        id: 'b',
        text: 'Phase 1: Optional PQC (2024-2025), Phase 2: Hybrid required (2025-2030), Phase 3: Standalone PQC optional (2030+)',
      },
      { id: 'c', text: 'Full transition by 2025 with no hybrid period' },
      { id: 'd', text: 'ANSSI has not issued any PQC guidance' },
    ],
    correctAnswer: 'b',
    explanation:
      "France's ANSSI (Agence nationale de la sécurité des systèmes d'information) follows a three-phase approach: Phase 1 (2024-2025) where PQC is optional, Phase 2 (2025-2030) requiring hybrid cryptography, and Phase 3 (2030-2035) where standalone PQC becomes optional.",
    learnMorePath: '/compliance',
  },
  {
    id: 'comp-005',
    category: 'compliance',
    type: 'true-false',
    difficulty: 'beginner',
    question:
      'True or False: PCI DSS 4.0.1 currently mandates the use of PQC algorithms for payment card systems.',
    options: [
      { id: 'true', text: 'True' },
      { id: 'false', text: 'False' },
    ],
    correctAnswer: 'false',
    explanation:
      'False. PCI DSS 4.0.1 requires "strong cryptography" but does not yet specifically mandate PQC algorithms. However, as NIST deprecation deadlines approach (2030), PCI DSS is expected to follow NIST guidance.',
    learnMorePath: '/compliance',
  },
  {
    id: 'comp-006',
    category: 'compliance',
    type: 'multiple-choice',
    difficulty: 'advanced',
    question: 'What is eIDAS 2.0 and how does it relate to PQC?',
    options: [
      { id: 'a', text: 'A quantum computing standard for European banks' },
      {
        id: 'b',
        text: 'The EU Digital Identity framework requiring quantum-safe digital wallets by 2027+',
      },
      { id: 'c', text: 'An encryption standard for European military systems' },
      { id: 'd', text: 'A testing framework for PQC algorithm performance' },
    ],
    correctAnswer: 'b',
    explanation:
      'eIDAS 2.0 is the updated EU regulation for electronic identification and trust services. It mandates European Digital Identity (EUDI) wallets with deployments starting in 2027+. These wallets will need quantum-safe cryptography to maintain long-term trust in digital signatures and credentials.',
    learnMorePath: '/compliance',
  },
  {
    id: 'comp-007',
    category: 'compliance',
    type: 'multiple-choice',
    difficulty: 'advanced',
    question: 'What is FIPS 140-3 and why is it relevant to PQC migration?',
    options: [
      { id: 'a', text: 'It defines PQC algorithm parameters' },
      {
        id: 'b',
        text: 'It is the standard for validating cryptographic modules — PQC implementations need CMVP certification',
      },
      { id: 'c', text: 'It mandates quantum key distribution for government systems' },
      { id: 'd', text: 'It is a deprecated standard replaced by FIPS 203' },
    ],
    correctAnswer: 'b',
    explanation:
      'FIPS 140-3 is the government standard for Cryptographic Module Validation Program (CMVP) certification. PQC algorithm implementations (FIPS 203/204/205) must undergo CMVP validation before use in federal systems. This certification process is a key dependency in migration timelines.',
    learnMorePath: '/compliance',
  },
  {
    id: 'comp-008',
    category: 'compliance',
    type: 'multi-select',
    difficulty: 'intermediate',
    question:
      'Which of the following compliance frameworks have explicit PQC transition requirements or guidance? (Select all that apply)',
    options: [
      { id: 'a', text: 'CNSA 2.0 (NSA)' },
      { id: 'b', text: 'ANSSI (France)' },
      { id: 'c', text: 'NIST IR 8547' },
      { id: 'd', text: 'Common Criteria (ISO/IEC 15408)' },
    ],
    correctAnswer: ['a', 'b', 'c', 'd'],
    explanation:
      'All four frameworks address PQC transition: CNSA 2.0 mandates PQC for National Security Systems, ANSSI provides phased PQC guidance for France, NIST IR 8547 sets deprecation/disallowment timelines, and Common Criteria is developing emerging PQC protection profiles for international security evaluation.',
    learnMorePath: '/compliance',
  },
  {
    id: 'comp-009',
    category: 'compliance',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    question: "By what year does Canada's CCCS require PQC clauses in new contracts?",
    options: [
      { id: 'a', text: '2025' },
      { id: 'b', text: '2026' },
      { id: 'c', text: '2030' },
      { id: 'd', text: '2035' },
    ],
    correctAnswer: 'b',
    explanation:
      "Canada's CCCS (Canadian Centre for Cyber Security) requires PQC clauses in new contracts by 2026, with high-priority systems migrated by 2031, and all systems fully transitioned by 2035.",
    learnMorePath: '/compliance',
  },
  {
    id: 'comp-010',
    category: 'compliance',
    type: 'multiple-choice',
    difficulty: 'advanced',
    question: 'What is the EU Coordinated Implementation Roadmap for PQC?',
    options: [
      { id: 'a', text: 'A binding regulation requiring immediate PQC deployment' },
      {
        id: 'b',
        text: 'A coordinated guidance document targeting high-risk systems secured by 2030 and full transition by 2035',
      },
      { id: 'c', text: 'A funding program for quantum computer development' },
      { id: 'd', text: 'An EU-only alternative to NIST PQC standards' },
    ],
    correctAnswer: 'b',
    explanation:
      'The EU Coordinated Implementation Roadmap (v1.1, published June 2025) provides guidance for member states to secure high-risk systems by 2030 and complete full PQC transition by 2035, aligned with NIST timelines but adapted for European regulatory contexts.',
    learnMorePath: '/compliance',
  },

  // ═══════════════════════════════════════════════════════════════
  // PROTOCOL INTEGRATION (10 questions)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'prot-001',
    category: 'protocol-integration',
    type: 'multiple-choice',
    difficulty: 'beginner',
    question: 'Which hybrid key exchange combination is already deployed in major web browsers?',
    options: [
      { id: 'a', text: 'RSA-4096 + ML-KEM-512' },
      { id: 'b', text: 'X25519 + ML-KEM-768 (X25519MLKEM768)' },
      { id: 'c', text: 'P-521 + FrodoKEM-1344' },
      { id: 'd', text: 'DH-2048 + HQC-256' },
    ],
    correctAnswer: 'b',
    explanation:
      'X25519MLKEM768 combines classical X25519 (ECDH) with ML-KEM-768 (NIST Level 3) for hybrid key exchange. It is already deployed in Chrome, Firefox, and other major browsers for TLS 1.3 connections.',
    learnMorePath: '/algorithms',
  },
  {
    id: 'prot-002',
    category: 'protocol-integration',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    question: 'Which RFC defines the use of multiple key exchanges in IKEv2 (IPsec)?',
    options: [
      { id: 'a', text: 'RFC 8446' },
      { id: 'b', text: 'RFC 9370' },
      { id: 'c', text: 'RFC 9629' },
      { id: 'd', text: 'RFC 8391' },
    ],
    correctAnswer: 'b',
    explanation:
      'RFC 9370 defines support for multiple key exchanges in IKEv2, enabling hybrid PQC key exchange (e.g., ML-KEM combined with classical ECDH) for IPsec VPN tunnels.',
    learnMorePath: '/algorithms',
  },
  {
    id: 'prot-003',
    category: 'protocol-integration',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    question: 'Which RFC defines the use of KEMs in Cryptographic Message Syntax (CMS)?',
    options: [
      { id: 'a', text: 'RFC 9370' },
      { id: 'b', text: 'RFC 9629' },
      { id: 'c', text: 'RFC 8391' },
      { id: 'd', text: 'RFC 7748' },
    ],
    correctAnswer: 'b',
    explanation:
      'RFC 9629 defines the use of Key Encapsulation Mechanisms (KEMs) in CMS, enabling PQC key exchange for S/MIME email encryption and other CMS-based applications.',
    learnMorePath: '/algorithms',
  },
  {
    id: 'prot-004',
    category: 'protocol-integration',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    question: 'How is PQC being integrated into 5G authentication?',
    options: [
      { id: 'a', text: 'By replacing the entire 5G protocol stack' },
      {
        id: 'b',
        text: 'Through PQC upgrades to 5G-AKA authentication and SUCI subscriber identity protection',
      },
      { id: 'c', text: '5G already uses PQC by default' },
      { id: 'd', text: 'PQC is not applicable to 5G networks' },
    ],
    correctAnswer: 'b',
    explanation:
      '5G security relies on 3GPP authentication protocols (5G-AKA) and SUCI (Subscriber Concealed Identifier) for subscriber identity protection. These protocols use RSA/ECDSA today and are being upgraded to support PQC algorithms, particularly for protecting the subscriber concealment mechanism.',
    learnMorePath: '/learn/5g-security',
  },
  {
    id: 'prot-005',
    category: 'protocol-integration',
    type: 'true-false',
    difficulty: 'beginner',
    question:
      'True or False: The Signal messaging protocol has already adopted post-quantum cryptography.',
    options: [
      { id: 'true', text: 'True' },
      { id: 'false', text: 'False' },
    ],
    correctAnswer: 'true',
    explanation:
      'True. Signal upgraded its protocol to include PQXDH (Post-Quantum Extended Diffie-Hellman) using ML-KEM for quantum-resistant key agreement, making it one of the first major messaging platforms to adopt PQC.',
    learnMorePath: '/timeline',
  },
  {
    id: 'prot-006',
    category: 'protocol-integration',
    type: 'multiple-choice',
    difficulty: 'advanced',
    question:
      'Which RFC defines the use of ML-DSA signatures in CMS for email and document signing?',
    options: [
      { id: 'a', text: 'RFC 9629' },
      { id: 'b', text: 'RFC 9882' },
      { id: 'c', text: 'RFC 9370' },
      { id: 'd', text: 'RFC 8032' },
    ],
    correctAnswer: 'b',
    explanation:
      'RFC 9882 defines the use of ML-DSA (Module-Lattice-Based Digital Signature Algorithm) in Cryptographic Message Syntax (CMS) for S/MIME email signing and other document signature applications.',
    learnMorePath: '/algorithms',
  },
  {
    id: 'prot-007',
    category: 'protocol-integration',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    question:
      'What is the primary challenge of integrating PQC into TLS compared to classical algorithms?',
    options: [
      { id: 'a', text: 'PQC algorithms are too slow for real-time connections' },
      { id: 'b', text: 'Larger key and ciphertext sizes increase handshake overhead' },
      { id: 'c', text: 'TLS does not support algorithm negotiation' },
      { id: 'd', text: 'PQC requires a completely new protocol version' },
    ],
    correctAnswer: 'b',
    explanation:
      'PQC algorithms generally have larger public keys, ciphertexts, and signatures than classical algorithms. For example, ML-KEM-768 public keys are ~1.2KB vs ~32 bytes for X25519. This increases TLS handshake size and can cause issues with network MTU limits and packet fragmentation.',
    learnMorePath: '/learn/tls-basics',
  },
  {
    id: 'prot-008',
    category: 'protocol-integration',
    type: 'multi-select',
    difficulty: 'advanced',
    question:
      'Which protocols have published RFCs or drafts for PQC integration? (Select all that apply)',
    options: [
      { id: 'a', text: 'IKEv2 / IPsec (RFC 9370)' },
      { id: 'b', text: 'CMS / S/MIME (RFC 9629, 9882)' },
      { id: 'c', text: 'DNS (DNSSEC)' },
      { id: 'd', text: 'OpenPGP' },
    ],
    correctAnswer: ['a', 'b', 'd'],
    explanation:
      'IKEv2 (RFC 9370), CMS/S/MIME (RFC 9629 for KEMs, RFC 9882 for ML-DSA), and OpenPGP all have published or draft specifications for PQC integration. DNSSEC PQC integration remains a significant challenge due to DNS packet size constraints.',
    learnMorePath: '/algorithms',
  },
  {
    id: 'prot-009',
    category: 'protocol-integration',
    type: 'multiple-choice',
    difficulty: 'beginner',
    question:
      'Which version of OpenSSL first included full PQC algorithm support (ML-KEM, ML-DSA, SLH-DSA)?',
    options: [
      { id: 'a', text: 'OpenSSL 1.1.1' },
      { id: 'b', text: 'OpenSSL 3.0' },
      { id: 'c', text: 'OpenSSL 3.5' },
      { id: 'd', text: 'OpenSSL 4.0' },
    ],
    correctAnswer: 'c',
    explanation:
      'OpenSSL 3.5, released in April 2025, was the first version with full PQC support including ML-KEM, ML-DSA, SLH-DSA, and the X25519MLKEM768 hybrid key exchange. Earlier versions required external providers (like the OQS provider) for PQC support.',
    learnMorePath: '/openssl',
  },
  {
    id: 'prot-010',
    category: 'protocol-integration',
    type: 'multiple-choice',
    difficulty: 'advanced',
    question: 'In the context of PQC protocol integration, what is a "composite" certificate?',
    options: [
      { id: 'a', text: 'A certificate signed by multiple certificate authorities' },
      {
        id: 'b',
        text: 'A certificate containing both classical and PQC public keys and signatures',
      },
      { id: 'c', text: 'A certificate that expires and renews automatically' },
      { id: 'd', text: 'A certificate used exclusively for testing' },
    ],
    correctAnswer: 'b',
    explanation:
      'A composite certificate contains both classical (e.g., RSA/ECDSA) and PQC (e.g., ML-DSA) public keys and signatures. This enables hybrid trust during the transition period — verifiers that support PQC use the quantum-safe signature, while legacy systems fall back to the classical one.',
    learnMorePath: '/learn/pki-workshop',
  },

  // ═══════════════════════════════════════════════════════════════
  // INDUSTRY THREATS (8 questions)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'thrt-001',
    category: 'industry-threats',
    type: 'multiple-choice',
    difficulty: 'beginner',
    question:
      'Which industry is most vulnerable to HNDL attacks due to lifetime data sensitivity (e.g., genomic data)?',
    options: [
      { id: 'a', text: 'Retail' },
      { id: 'b', text: 'Healthcare' },
      { id: 'c', text: 'Entertainment' },
      { id: 'd', text: 'Hospitality' },
    ],
    correctAnswer: 'b',
    explanation:
      'Healthcare data — especially genomic data, mental health records, and patient histories — has lifetime sensitivity. This makes healthcare particularly vulnerable to HNDL attacks, where encrypted data intercepted today could be decrypted decades later.',
    learnMorePath: '/threats',
  },
  {
    id: 'thrt-002',
    category: 'industry-threats',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    question:
      'Approximately how many EMV payment cards worldwide use RSA-based offline authentication?',
    options: [
      { id: 'a', text: '~500 million' },
      { id: 'b', text: '~2 billion' },
      { id: 'c', text: '~14.7 billion' },
      { id: 'd', text: '~50 billion' },
    ],
    correctAnswer: 'c',
    explanation:
      'Approximately 14.7 billion EMV cards worldwide use RSA-based offline authentication (RSA-1024 or RSA-2048). Migrating this massive installed base to PQC represents one of the largest cryptographic transitions in history.',
    learnMorePath: '/threats',
  },
  {
    id: 'thrt-003',
    category: 'industry-threats',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    question: 'Why are aviation and aerospace systems particularly challenging for PQC migration?',
    options: [
      { id: 'a', text: 'They use quantum computers already' },
      { id: 'b', text: 'They have 30-40 year service lives with limited crypto-agility' },
      { id: 'c', text: 'They do not use any cryptography currently' },
      { id: 'd', text: 'International aviation law prohibits cryptographic changes' },
    ],
    correctAnswer: 'b',
    explanation:
      'Aircraft and avionics systems have extremely long service lives (30-40 years) and are governed by strict certification standards (RTCA DO-326A). Updating cryptographic systems in certified avionics requires extensive re-certification, making rapid migration very difficult.',
    learnMorePath: '/threats',
  },
  {
    id: 'thrt-004',
    category: 'industry-threats',
    type: 'true-false',
    difficulty: 'intermediate',
    question:
      'True or False: Bitcoin is vulnerable to quantum attacks because it uses ECDSA (secp256k1) for transaction signing.',
    options: [
      { id: 'true', text: 'True' },
      { id: 'false', text: 'False' },
    ],
    correctAnswer: 'true',
    explanation:
      "True. Bitcoin uses ECDSA with the secp256k1 curve for transaction signing. Shor's Algorithm can break ECDSA, potentially allowing quantum attackers to forge transactions. Approximately $718 billion in quantum-vulnerable P2PK addresses exist, including ~1.1 million BTC attributed to Satoshi Nakamoto.",
    learnMorePath: '/threats',
  },
  {
    id: 'thrt-005',
    category: 'industry-threats',
    type: 'multiple-choice',
    difficulty: 'advanced',
    question: 'What unique quantum threat does blockchain immutability create?',
    options: [
      { id: 'a', text: 'Blockchains can be deleted by quantum computers' },
      {
        id: 'b',
        text: 'On-chain encrypted data is permanently exposed — it cannot be re-encrypted after the fact',
      },
      { id: 'c', text: 'Quantum computers can reverse blockchain consensus' },
      { id: 'd', text: 'Mining becomes impossible with quantum hardware' },
    ],
    correctAnswer: 'b',
    explanation:
      'Blockchain immutability means encrypted data stored on-chain remains permanently accessible. Unlike centralized systems where archived data can be re-encrypted, blockchain data cannot be modified. Any HNDL-harvested on-chain encrypted data remains vulnerable indefinitely.',
    learnMorePath: '/threats',
  },
  {
    id: 'thrt-006',
    category: 'industry-threats',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    question:
      'Which critical infrastructure sector faces unique challenges due to 20-30 year equipment lifecycles and IEC 62443 standards?',
    options: [
      { id: 'a', text: 'Retail' },
      { id: 'b', text: 'Energy and utilities (SCADA systems)' },
      { id: 'c', text: 'Media and entertainment' },
      { id: 'd', text: 'Education' },
    ],
    correctAnswer: 'b',
    explanation:
      'Energy and utility systems (power grids, SCADA, nuclear facilities) have equipment lifecycles of 20-30 years governed by IEC 62443 standards. Nuclear plants are licensed for 60+ years (with 80-year extensions). These extremely long lifecycles make PQC migration particularly complex.',
    learnMorePath: '/threats',
  },
  {
    id: 'thrt-007',
    category: 'industry-threats',
    type: 'multiple-choice',
    difficulty: 'advanced',
    question:
      'Why did the Ethereum Foundation establish a dedicated PQC team with $2M in research prizes in January 2026?',
    options: [
      { id: 'a', text: 'To develop a quantum computer' },
      {
        id: 'b',
        text: 'To research quantum-safe upgrades for Ethereum, as its secp256k1/BLS12-381 cryptography is vulnerable',
      },
      { id: 'c', text: 'To create a competing PQC standard' },
      { id: 'd', text: 'To build quantum mining hardware' },
    ],
    correctAnswer: 'b',
    explanation:
      'Ethereum uses secp256k1 ECDSA and BLS12-381 cryptography, both vulnerable to quantum attacks. The Foundation established a dedicated PQC team to research quantum-safe account abstraction, signature scheme upgrades, and consensus mechanism protections.',
    learnMorePath: '/threats',
  },
  {
    id: 'thrt-008',
    category: 'industry-threats',
    type: 'multi-select',
    difficulty: 'intermediate',
    question: 'Which automotive systems are vulnerable to quantum attacks? (Select all that apply)',
    options: [
      { id: 'a', text: 'V2X (vehicle-to-everything) PKI communications' },
      { id: 'b', text: 'OTA (over-the-air) firmware update code signing' },
      { id: 'c', text: 'Windshield wiper controls' },
      { id: 'd', text: 'In-vehicle network ECU authentication' },
    ],
    correctAnswer: ['a', 'b', 'd'],
    explanation:
      'V2X communications use ECDSA P-256 certificates (IEEE 1609.2), OTA firmware updates use RSA/ECDSA code signing, and ECU authentication uses cryptographic protocols — all quantum-vulnerable. Windshield wipers do not involve cryptographic operations.',
    learnMorePath: '/threats',
  },

  // ═══════════════════════════════════════════════════════════════
  // CRYPTO OPERATIONS (10 questions)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cryp-001',
    category: 'crypto-operations',
    type: 'multiple-choice',
    difficulty: 'beginner',
    question: 'What is a Key Encapsulation Mechanism (KEM)?',
    options: [
      { id: 'a', text: 'A method for digitally signing documents' },
      {
        id: 'b',
        text: 'A mechanism for securely establishing a shared secret key between two parties',
      },
      { id: 'c', text: 'A technique for compressing encryption keys' },
      { id: 'd', text: 'A hardware device for storing private keys' },
    ],
    correctAnswer: 'b',
    explanation:
      "A KEM securely establishes a shared secret key between two parties. Unlike Diffie-Hellman key exchange, a KEM works by having one party generate a shared secret and encapsulate it using the other party's public key. The recipient then decapsulates to recover the shared secret.",
    learnMorePath: '/algorithms',
  },
  {
    id: 'cryp-002',
    category: 'crypto-operations',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    question: 'What is the approximate public key size of ML-KEM-768 compared to X25519?',
    options: [
      { id: 'a', text: 'About the same (~32 bytes each)' },
      { id: 'b', text: 'ML-KEM-768 is ~37x larger (~1184 bytes vs ~32 bytes)' },
      { id: 'c', text: 'ML-KEM-768 is ~1000x larger (~32KB vs ~32 bytes)' },
      { id: 'd', text: 'X25519 is actually larger than ML-KEM-768' },
    ],
    correctAnswer: 'b',
    explanation:
      'ML-KEM-768 public keys are approximately 1184 bytes, compared to 32 bytes for X25519. While significantly larger, this is still manageable for most applications. The trade-off is worthwhile for quantum resistance, and ML-KEM-768 is still very fast (~80x faster keygen than RSA-2048).',
    learnMorePath: '/algorithms',
  },
  {
    id: 'cryp-003',
    category: 'crypto-operations',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    question: 'What are the three core operations of a KEM?',
    options: [
      { id: 'a', text: 'Encrypt, Decrypt, Verify' },
      { id: 'b', text: 'KeyGen, Encapsulate, Decapsulate' },
      { id: 'c', text: 'Sign, Verify, Exchange' },
      { id: 'd', text: 'Generate, Distribute, Revoke' },
    ],
    correctAnswer: 'b',
    explanation:
      'The three operations of a KEM are: KeyGen (generate a public/private key pair), Encapsulate (use the public key to produce a ciphertext and shared secret), and Decapsulate (use the private key to recover the shared secret from the ciphertext).',
    learnMorePath: '/playground',
  },
  {
    id: 'cryp-004',
    category: 'crypto-operations',
    type: 'true-false',
    difficulty: 'beginner',
    question:
      'True or False: ML-KEM key generation is approximately 80x faster than RSA-2048 key generation.',
    options: [
      { id: 'true', text: 'True' },
      { id: 'false', text: 'False' },
    ],
    correctAnswer: 'true',
    explanation:
      "True. ML-KEM key generation is dramatically faster than RSA-2048 because it uses simple linear algebra operations over polynomial rings, rather than RSA's computationally expensive prime number generation.",
    learnMorePath: '/playground',
  },
  {
    id: 'cryp-005',
    category: 'crypto-operations',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    question: 'How does ML-DSA signature size compare to RSA-2048 signature size?',
    options: [
      { id: 'a', text: 'ML-DSA-65 signatures are smaller than RSA-2048 signatures' },
      { id: 'b', text: 'They are approximately the same size (~256 bytes)' },
      {
        id: 'c',
        text: 'ML-DSA-65 signatures are larger (~3.3KB vs ~256 bytes for RSA-2048)',
      },
      { id: 'd', text: 'RSA-2048 does not produce signatures' },
    ],
    correctAnswer: 'c',
    explanation:
      "ML-DSA-65 produces signatures of approximately 3,309 bytes compared to RSA-2048's ~256 bytes. This larger size is a key trade-off for quantum resistance and impacts applications with bandwidth constraints, such as TLS handshakes and certificate chains.",
    learnMorePath: '/algorithms',
  },
  {
    id: 'cryp-006',
    category: 'crypto-operations',
    type: 'multiple-choice',
    difficulty: 'advanced',
    question: 'Why does FN-DSA require careful implementation to resist side-channel attacks?',
    options: [
      { id: 'a', text: 'It uses extremely large key sizes' },
      {
        id: 'b',
        text: 'Its signing algorithm relies on floating-point arithmetic that can leak timing information',
      },
      { id: 'c', text: 'It requires internet connectivity during signing' },
      { id: 'd', text: 'It stores private keys in plaintext' },
    ],
    correctAnswer: 'b',
    explanation:
      'FN-DSA (formerly Falcon) uses fast Fourier transforms over NTRU lattices, which require floating-point arithmetic. Variations in floating-point computation timing can leak information about the private key through side-channel attacks, requiring constant-time implementation techniques.',
    learnMorePath: '/algorithms',
  },
  {
    id: 'cryp-007',
    category: 'crypto-operations',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    question:
      'For multi-select questions about correctness: in ML-KEM, what does the encapsulation operation produce?',
    options: [
      { id: 'a', text: 'A digital signature and verification key' },
      { id: 'b', text: 'A ciphertext and a shared secret' },
      { id: 'c', text: 'An encrypted message and decryption key' },
      { id: 'd', text: 'A hash digest and salt' },
    ],
    correctAnswer: 'b',
    explanation:
      'ML-KEM encapsulation takes a public key and produces two outputs: a ciphertext (sent to the recipient) and a shared secret (kept by the sender). The recipient uses their private key to decapsulate the ciphertext and recover the same shared secret.',
    learnMorePath: '/playground',
  },
  {
    id: 'cryp-008',
    category: 'crypto-operations',
    type: 'multi-select',
    difficulty: 'advanced',
    question:
      'Which of the following are valid hybrid key exchange combinations deployed or specified in standards? (Select all that apply)',
    options: [
      { id: 'a', text: 'X25519MLKEM768' },
      { id: 'b', text: 'SecP256r1MLKEM768' },
      { id: 'c', text: 'SecP384r1MLKEM1024' },
      { id: 'd', text: 'RSA2048MLKEM512' },
    ],
    correctAnswer: ['a', 'b', 'c'],
    explanation:
      'X25519MLKEM768, SecP256r1MLKEM768, and SecP384r1MLKEM1024 are all standardized or deployed hybrid key exchange combinations. RSA-based hybrid KEMs are not standard — hybrid approaches pair ECDH variants with ML-KEM variants.',
    learnMorePath: '/algorithms',
  },
  {
    id: 'cryp-009',
    category: 'crypto-operations',
    type: 'multiple-choice',
    difficulty: 'beginner',
    question: 'What is the fundamental difference between a KEM and a digital signature algorithm?',
    options: [
      { id: 'a', text: 'KEMs are faster; signatures are slower' },
      {
        id: 'b',
        text: 'KEMs establish shared secrets for encryption; signatures prove authenticity and integrity',
      },
      { id: 'c', text: 'KEMs are quantum-safe; signatures are not' },
      { id: 'd', text: 'There is no difference — they are interchangeable' },
    ],
    correctAnswer: 'b',
    explanation:
      'KEMs (like ML-KEM) establish a shared secret key between parties for subsequent encryption. Digital signature algorithms (like ML-DSA) prove that a message was created by a known sender (authenticity) and was not altered (integrity). They serve different cryptographic purposes.',
    learnMorePath: '/algorithms',
  },
  {
    id: 'cryp-010',
    category: 'crypto-operations',
    type: 'multiple-choice',
    difficulty: 'advanced',
    question: 'Which SLH-DSA variant family does NIST prefer for long-term quantum resilience?',
    options: [
      { id: 'a', text: 'SHA2 variants (SLH-DSA-SHA2-*)' },
      { id: 'b', text: 'SHAKE variants (SLH-DSA-SHAKE-*)' },
      { id: 'c', text: 'Both are equally preferred' },
      { id: 'd', text: 'Neither — SLH-DSA is not recommended for long-term use' },
    ],
    correctAnswer: 'b',
    explanation:
      'NIST prefers SHAKE variants (SLH-DSA-SHAKE-*) over SHA2 variants for long-term quantum resilience. SHAKE (from the SHA-3/Keccak family) provides a different mathematical foundation from SHA-2, offering additional algorithm diversity for defense-in-depth.',
    learnMorePath: '/algorithms',
  },
]
