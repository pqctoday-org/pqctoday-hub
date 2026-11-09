// SPDX-License-Identifier: AGPL-3.0-only
import type { PersonaId } from '@/data/learningPersonas'

/**
 * The one status record for FIPS 206 (FN-DSA), used by every answer that mentions it and
 * mirrored by the About page's data-foundation label. Source: NIST's post-quantum
 * standardization page (updated 27 October 2026: Falcon "will be published in FIPS 206
 * (in development)") and NIST's list of FIPS publications and drafts, checked 5 November
 * 2026, which has no FIPS 206 entry. Update the date and wording here when that changes.
 */
export const FIPS_206_STATUS =
  "FIPS 206 is planned, not published: NIST's post-quantum standardization page (updated 27 October 2026) lists it as in development, and NIST's FIPS list (checked 5 November 2026) shows no draft or final text."

export interface FAQItem {
  question: string
  answer: string
  deepLink: string
  /** Persona this Q&A is written for — used only to float/highlight matching
   *  entries in the "Role-Specific Guidance" category for the active persona.
   *  Never used to hide questions from other viewers. */
  persona?: PersonaId
}

export interface FAQCategory {
  id: string
  title: string
  items: FAQItem[]
}

export const FAQ_DATA: FAQCategory[] = [
  // ---------------------------------------------------------------------------
  // 1. PQC Fundamentals
  // ---------------------------------------------------------------------------
  {
    id: 'fundamentals',
    title: 'PQC Fundamentals',
    items: [
      {
        question: 'What is post-quantum cryptography (PQC)?',
        answer:
          'Post-quantum cryptography refers to cryptographic algorithms designed to resist attacks from both classical and quantum computers. These algorithms rely on mathematical problems — such as lattice structures, hash functions, and error-correcting codes — that remain hard even for quantum computers. The PQC 101 module walks through the core concepts and why migration is urgent.',
        deepLink: '/learn/pqc-101',
      },
      {
        question: 'What is ML-KEM and what FIPS standard covers it?',
        answer:
          'ML-KEM (Module-Lattice-Based Key-Encapsulation Mechanism) is standardized in FIPS 203, published by NIST in August 2024. It is a lattice-based KEM that replaces classical ECDH and RSA key exchange for establishing shared secrets. The Algorithms page provides parameter details for ML-KEM-512, ML-KEM-768, and ML-KEM-1024.',
        deepLink: '/algorithms?highlight=ml-kem',
      },
      {
        question: 'What is ML-DSA and what FIPS standard covers it?',
        answer:
          'ML-DSA (Module-Lattice-Based Digital Signature Algorithm) is standardized in FIPS 204, published by NIST in August 2024. It is a lattice-based digital signature scheme that replaces RSA and ECDSA for authentication and integrity. The Algorithms page compares ML-DSA-44, ML-DSA-65, and ML-DSA-87 across security levels and performance.',
        deepLink: '/algorithms?highlight=ml-dsa',
      },
      {
        question: 'What is SLH-DSA (SPHINCS+)?',
        answer:
          'SLH-DSA (Stateless Hash-Based Digital Signature Algorithm), formerly known as SPHINCS+, is standardized in FIPS 205, published in August 2024. It offers 12 parameter variants across three security levels with fast and small optimization profiles, serving as a conservative hash-based fallback. The Algorithms page details all 12 variants with their signature and key sizes.',
        deepLink: '/algorithms?highlight=slh-dsa',
      },
      {
        question: 'What is FN-DSA (Falcon)?',
        answer:
          'FN-DSA (FFT over NTRU-Lattice-Based Digital Signature Algorithm) is the name NIST plans to use for a standard based on Falcon. ' +
          FIPS_206_STATUS +
          ' Falcon produces more compact signatures than ML-DSA, making it attractive for bandwidth-constrained environments like smart cards, though its implementation is more complex due to floating-point arithmetic. The Algorithms page compares the Falcon-512 and Falcon-1024 candidate parameters.',
        deepLink: '/algorithms?highlight=fn-dsa',
      },
      {
        question: 'What is a hybrid cryptographic approach?',
        answer:
          'A hybrid cryptographic approach combines a classical algorithm (such as ECDH) with a post-quantum algorithm (such as ML-KEM). For key establishment, a well-built combiner (for example, concatenating both shared secrets and deriving keys from them with a key derivation function, as the TLS 1.3 design does) aims for a result that stays secure as long as at least one component is unbroken; that property rests on the combiner and on the component KEMs, and the TLS specification states that one cannot assume a similar hybridization is secure in other protocols. Acceptance policy matters as much as construction: if connections may complete with classical-only key exchange when a peer lacks hybrid support, you gain compatibility but not post-quantum protection, and hybrid key exchange alone does not make authentication hybrid (with ordinary single-algorithm certificates, authentication still relies on one algorithm). Likewise, a hybrid signature guards against the failure of either component only if verifiers require both to verify; accepting either one trades that protection for interoperability. ANSSI and BSI both recommend hybrid key establishment during the transition while confidence in PQC algorithms matures. The Hybrid Crypto module covers composite certificates, dual key exchange, and deployment patterns.',
        deepLink: '/learn/hybrid-crypto',
      },
      {
        question: 'What is the difference between a KEM and traditional key exchange?',
        answer:
          "A Key Encapsulation Mechanism (KEM) uses a recipient's public key to encapsulate a randomly generated shared secret, producing a ciphertext that only the private key holder can decapsulate. Traditional Diffie-Hellman key exchange, by contrast, derives a shared secret through an interactive exchange of public values. The Algorithms page explains how KEMs simplify protocol design and why NIST chose the KEM paradigm for post-quantum key establishment.",
        deepLink: '/algorithms',
      },
      {
        question: 'What NIST security levels exist?',
        answer:
          'NIST defines five post-quantum security categories (often called levels) by reference primitives: Category 1 is at least as hard to break as key search on AES-128, Category 2 as collision search on SHA-256, Category 3 as key search on AES-192, Category 4 as collision search on SHA3-384, and Category 5 as key search on AES-256. The FIPS standards assign parameter sets to these categories: ML-KEM-512, ML-KEM-768 and ML-KEM-1024 are categories 1, 3 and 5 (FIPS 203), and ML-DSA-44, ML-DSA-65 and ML-DSA-87 are categories 2, 3 and 5 (FIPS 204). Note that ML-DSA-44 is Category 2, not Category 1. A category is a security-strength claim, not a deployment recommendation: which parameter set to use is set by the policy or profile that governs your system. For example, the Australian Information Security Manual approves ML-KEM-768 or ML-KEM-1024 and prefers ML-KEM-1024, and approves ML-DSA-65 or ML-DSA-87 and prefers ML-DSA-87, while the X25519MLKEM768 TLS group is built on ML-KEM-768. The Algorithms page maps each algorithm variant to its security level and includes side-by-side performance benchmarks that compare each PQC algorithm directly against its classical counterpart (e.g., ML-KEM-768 versus X25519, ML-DSA-65 versus ECDSA P-256).',
        deepLink: '/algorithms',
      },
      {
        question: 'What classical algorithms are quantum-vulnerable?',
        answer:
          "RSA, ECDSA, ECDH, DSA, and Diffie-Hellman are all vulnerable to quantum attack because they rely on the hardness of integer factoring or the discrete logarithm problem, both of which Shor's algorithm solves efficiently. Symmetric algorithms like AES and hash functions like SHA-256 are weakened but not broken by Grover's algorithm. The Quantum Threats module explains the mathematical basis and timelines for each vulnerability.",
        deepLink: '/learn/quantum-threats',
      },
      {
        question: 'Why is RSA vulnerable but AES is not?',
        answer:
          "Shor's algorithm can factor large integers and compute discrete logarithms in polynomial time on a sufficiently large quantum computer, directly breaking RSA and elliptic curve cryptography. Grover's algorithm, the generic quantum key-search attack, gives at most a quadratic speedup: in the idealized query-count model, searching a 256-bit key takes on the order of 2^128 Grover iterations. That idealized count is not a practical security level, because the full speedup needs the iterations to run in series, while real attacks rely on massive parallelism, so NIST considers it quite likely that Grover's algorithm gives little or no advantage against AES. Which AES key size to use is a separate policy choice: NIST says current applications can continue to use 128-, 192- or 256-bit keys, while BSI advises 256-bit keys for applications with high or long-term protection needs. The Quantum Threats module illustrates these attack complexities side by side.",
        deepLink: '/learn/quantum-threats',
      },
      {
        question: 'When should I use ML-KEM vs ML-DSA vs SLH-DSA?',
        answer:
          'Choose the algorithm based on operation type: ML-KEM (FIPS 203) is the right choice for key exchange and establishing shared secrets — it replaces ECDH and RSA key encapsulation. ML-DSA (FIPS 204) is the primary choice for digital signatures, offering the best balance of signature speed, key size, and security; prefer it for general-purpose authentication, code signing, and certificate issuance. SLH-DSA (FIPS 205) is a conservative hash-based fallback when algorithm diversity matters more than performance — its security relies only on hash function properties, providing a hedge if lattice assumptions are weakened. FN-DSA (planned FIPS 206, not yet published) is the option being standardized for cases where compact signatures are critical, such as smart cards or bandwidth-constrained IoT devices. The Algorithms page provides a side-by-side comparison of all parameter sets.',
        deepLink: '/algorithms?highlight=ML-KEM,ML-DSA,SLH-DSA',
      },
      {
        question: 'What are LMS and XMSS, and how do they differ from SLH-DSA?',
        answer:
          'LMS (Leighton-Micali Signature) and XMSS (eXtended Merkle Signature Scheme) are stateful hash-based signature schemes standardized in NIST SP 800-208. They are highly efficient but require the signer to maintain reliable state — each private key can only be used a fixed number of times, and reusing a state breaks security. This makes them well-suited for controlled environments like firmware signing where state tracking is manageable. SLH-DSA (FIPS 205), by contrast, is stateless — it derives one-time keys internally and has no reuse risk, making it safer for general-purpose use at the cost of larger signatures. The Reference Library includes SP 800-208 alongside the FIPS 205 specification.',
        deepLink: '/algorithms?highlight=LMS,XMSS,SLH-DSA',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. Quantum Threats
  // ---------------------------------------------------------------------------
  {
    id: 'threats',
    title: 'Quantum Threats',
    items: [
      {
        question: 'What is a "Harvest Now, Decrypt Later" (HNDL) attack?',
        answer:
          'In an HNDL attack, an adversary intercepts and stores encrypted communications today with the intent of decrypting them once a sufficiently powerful quantum computer becomes available. Data with long confidentiality requirements — such as state secrets, health records, and financial data — is especially at risk. The Threats dashboard quantifies HNDL exposure windows across industries.',
        deepLink: '/threats',
      },
      {
        question: 'What is HNFL (Harvest Now, Forge Later)?',
        answer:
          'Harvest Now, Forge Later (HNFL) is a threat where an adversary collects signed artifacts and public keys today, waiting until a quantum computer can forge valid digital signatures to impersonate trusted entities. This threatens long-lived code signing certificates, firmware authentication, and legal non-repudiation. The Threats dashboard models HNFL risk timelines alongside HNDL.',
        deepLink: '/threats',
      },
      {
        question: 'What is a CRQC and when might one exist?',
        answer:
          "A Cryptographically Relevant Quantum Computer (CRQC) can run an attack such as Shor's algorithm against a specified production key size. GRI's 2025 Quantum Threat Timeline survey averages the lower and upper ends of experts' likelihood bins to about 28-49% within 10 years of the survey (around 2035) and 51-70% within 15 years (around 2040). The survey's reference task is breaking RSA-2048 within 24 hours. These are uncertain, opinion-based ranges, not measured arrival probabilities or a most-likely year. For migration planning, compare your data's confidentiality lifetime and migration lead time with multiple threat scenarios rather than wait for a predicted Q-Day. The Threats dashboard provides the source and scenario context.",
        deepLink: '/threats',
      },
      {
        question: 'What industries face the highest quantum risk?',
        answer:
          'Financial services, healthcare, government and defense, and critical infrastructure face the highest quantum risk due to their combination of long data confidentiality requirements, strict regulatory obligations, and high-value targets. Industries handling data with decades-long sensitivity windows are most exposed to HNDL attacks. The Threats dashboard ranks industry-specific risk levels with mitigation strategies.',
        deepLink: '/threats',
      },
      {
        question: 'What is the quantum threat to Bitcoin and Ethereum?',
        answer:
          "Bitcoin and Ethereum rely on ECDSA signatures (secp256k1) for transaction authorization, which Shor's algorithm would break by recovering private keys from exposed public keys. Ethereum co-founder Vitalik Buterin has published a defense roadmap that includes account abstraction and PQC signature migration. The Digital Assets module covers the specific vulnerabilities and proposed countermeasures for both blockchains.",
        deepLink: '/learn/digital-assets',
      },
      {
        question: "How does Grover's algorithm affect symmetric encryption?",
        answer:
          "Grover's algorithm gives a quadratic speedup for brute-force key search. In the idealized query-count model that is the often-quoted halving: about 2^64 Grover iterations for a 128-bit key and 2^128 for a 256-bit key. That idealized count is not an operational security level. To get the full speedup the iterations must run in series (Zalka, 1997), real attacks use massive parallelism, and quantum hardware is expected to cost more than classical hardware, so NIST considers it quite likely that Grover's algorithm gives little or no advantage against AES and expects AES-128 to remain secure for decades. The key-size recommendation is a separate, conservative policy choice: NIST says current applications can continue to use AES with 128-, 192- or 256-bit keys, while BSI advises 256-bit keys for applications with high or long-term protection needs and ANSSI encourages parameters at least as strong as AES-256 as a conservative measure. The Quantum Threats module explains Shor's and Grover's algorithms and includes a key-size analyzer.",
        deepLink: '/learn/quantum-threats',
      },
      {
        question: "What is Mosca's Theorem?",
        answer:
          "Mosca's Theorem states that if the sum of your data's required confidentiality period and your organization's migration timeline exceeds the estimated time until a CRQC is available, then you must begin migrating now. It provides a simple inequality — shelf life + migration time > time to quantum — for deciding migration urgency. The PQC 101 module includes an interactive Mosca calculator.",
        deepLink: '/learn/pqc-101',
      },
      {
        question: 'How many industries does the PQC Today Threats dashboard cover?',
        answer:
          'The Threats dashboard covers over 20 industries, each with detailed threat criticality levels, HNDL and HNFL risk assessments, and actionable mitigation strategies. Industries span financial services, healthcare, government, telecom, energy, automotive, aerospace, IoT, payment card, supply chain, media/DRM, legal/eSignature, and more. The dashboard allows filtering by industry to see sector-specific threat profiles and compliance requirements.',
        deepLink: '/threats',
      },
      {
        question: 'What is the difference between physical and logical qubits?',
        answer:
          "Physical qubits are hardware units; logical qubits use quantum error correction to make computations reliable. There is no universal physical-to-logical conversion ratio: code, physical error rate, connectivity, algorithm and target runtime matter. For a concrete comparison, Gidney's 2025 RSA-2048 resource estimate uses fewer than one million noisy physical qubits for less than a week, whereas the earlier Gidney-Ekera 2019 estimate used 20 million for eight hours. Both assume a square nearest-neighbor grid, 0.1% gate errors, 1 microsecond surface-code cycles and 10 microsecond control reaction time; the newer design changes arithmetic, storage codes and magic-state production. These are fault-tolerant resource estimates, not executed RSA attacks or hardware thresholds. Compare the full assumptions and runtime tradeoff when evaluating a resource claim; raw device qubit counts alone do not establish a CRQC.",
        deepLink: '/threats',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 3. NIST Standards & Timeline
  // ---------------------------------------------------------------------------
  {
    id: 'standards',
    title: 'NIST Standards & Timeline',
    items: [
      {
        question: 'What are the four FIPS standards for PQC?',
        answer:
          'NIST has published three PQC FIPS standards: FIPS 203 (ML-KEM, lattice-based key encapsulation), FIPS 204 (ML-DSA, lattice-based digital signatures), and FIPS 205 (SLH-DSA, stateless hash-based signatures). All three were published in August 2024. A fourth standard, for FN-DSA, is planned. ' +
          FIPS_206_STATUS +
          ' The Reference Library has the published standards and related source material.',
        deepLink: '/library',
      },
      {
        question: 'What is NIST IR 8547?',
        answer:
          'NIST IR 8547 (Interagency Report) provides transition guidance for migrating federal cryptographic systems to post-quantum algorithms, deprecating quantum-vulnerable public-key algorithms such as RSA and ECDSA after 2030 and disallowing them under NIST standards after 2035, at every key size of 112 bits of security or more. NIST published the final report on 27 October 2026, replacing the November 2024 initial public draft. It is the most widely referenced US government transition timeline and complements the FIPS algorithm standards. The Reference Library links to the full document with implementation details.',
        deepLink: '/library?ref=NIST%20IR%208547',
      },
      {
        question: 'What is CNSA 2.0?',
        answer:
          'CNSA 2.0 (Commercial National Security Algorithm Suite 2.0) is NSA guidance for protecting National Security Systems. The current FAQ version 2.2 requires compliant new NSS acquisitions from 1 January 2027, phase-out of equipment and services that cannot support CNSA 2.0 by 31 December 2030 unless excepted, and CNSA 2.0 algorithms by 31 December 2031 unless otherwise noted. Earlier category guidance places exclusive use for software and firmware signing and traditional networking at 2030. The separate 2035 date is the broader NSM-10 quantum-risk objective, not the current CNSA 2.0 algorithm mandate. The Compliance Tracker shows these milestones alongside other frameworks.',
        deepLink: '/compliance?framework=CNSA-2',
      },
      {
        question: 'What is SP 800-208?',
        answer:
          'NIST Special Publication 800-208 standardizes the use of LMS (Leighton-Micali Signature) and XMSS (eXtended Merkle Signature Scheme) stateful hash-based signature algorithms. These schemes are suitable for firmware signing and other use cases where the signer can reliably maintain state to prevent key reuse. The Reference Library provides the full SP 800-208 text and related implementation guidance.',
        deepLink: '/library?ref=NIST%20SP%20800-208',
      },
      {
        question: 'What does RFC 9629 cover?',
        answer:
          'RFC 9629 defines the generic KEMRecipientInfo mechanism for using any KEM within the Cryptographic Message Syntax (CMS); the ML-KEM-specific CMS profile is RFC 9936, enabling PQC-protected S/MIME email encryption. ML-DSA digital signatures in CMS are covered separately by RFC 9882. The Reference Library includes these RFCs alongside related email security standards.',
        deepLink: '/library?ref=RFC%209629',
      },
      {
        question: 'What is ETSI TS 103 744?',
        answer:
          'ETSI TS 103 744 (Quantum-safe Hybrid Key Establishment, V1.2.2, February 2026) is a European Telecommunications Standards Institute specification of methods for deriving cryptographic keys from multiple shared secrets, where the secrets come from an existing traditional key agreement such as ECDH and from a quantum-safe key encapsulation mechanism. It defines a concatenation combiner (CatKDF) and a cascade combiner (CasKDF). Its scope is the construction of hybrid key exchange, not telecom migration planning. For telecom-specific migration questions, such as 5G core network security and subscriber identity concealment, see GSMA PQ.03 (Post-Quantum Cryptography Guidelines for Telecom Use Cases), and see ETSI TR 103 619 for general migration strategies. The Reference Library catalogs these alongside other ETSI PQC publications.',
        deepLink: '/library?ref=ETSI%20TS%20103%20744',
      },
      {
        question: 'What does BSI TR-02102 recommend?',
        answer:
          "BSI Technical Guideline TR-02102 is the German Federal Office for Information Security's cryptographic recommendations, which include PQC algorithm guidance and transition timelines for German government and critical infrastructure systems. It recommends hybrid classical-plus-PQC approaches during the transition and specifies minimum key sizes for each security level. The Reference Library provides the guideline alongside BSI's broader PQC program.",
        deepLink: '/library?ref=BSI%20TR-02102-1',
      },
      {
        question: 'What is the ANSSI PQC position?',
        answer:
          "France's ANSSI (Agence nationale de la securite des systemes d'information) requires hybrid classical-plus-PQC deployment for all lattice-based algorithms as a transitional security measure, reflecting caution about the maturity of lattice hardness assumptions. ANSSI has set some of the most aggressive European timelines, requiring PQC support in qualified products. The Reference Library links to ANSSI's published position papers and technical guidance.",
        deepLink: '/library?ref=ANSSI%20PQC%20Position%20Paper',
      },
      {
        question: 'What is NIST CSWP 39?',
        answer:
          'NIST Cybersecurity White Paper 39 provides practical guidance for organizations preparing their migration to post-quantum cryptography, covering cryptographic inventory, risk assessment, and phased transition planning. It complements the FIPS algorithm standards by addressing organizational and operational readiness. The Reference Library includes CSWP 39 with cross-references to related NIST publications.',
        deepLink: '/library?ref=NIST%20CSWP%2039',
      },
      {
        question: 'What are RFC 9881 and RFC 9882?',
        answer:
          'RFC 9881 defines algorithm identifiers for ML-DSA within the X.509 Public Key Infrastructure — specifying OIDs and SubjectPublicKeyInfo encodings for ML-DSA public keys and signatures in certificates. RFC 9882 covers the use of ML-DSA within the Cryptographic Message Syntax (CMS), enabling ML-DSA digital signatures in S/MIME, code signing, and timestamping. Together they provide the interoperability foundation for ML-DSA across PKI and messaging protocols. The Reference Library catalogs both alongside the broader suite of PQC-related RFCs.',
        deepLink: '/library',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 4. Migration Timeline
  // ---------------------------------------------------------------------------
  {
    id: 'timeline',
    title: 'Migration Timeline',
    items: [
      {
        question: 'When does NIST plan to deprecate classical algorithms?',
        answer:
          'According to NIST IR 8547 (final, October 2026), quantum-vulnerable public-key algorithms such as RSA and ECDSA are deprecated after 2030 and disallowed after 2035 for systems that follow NIST standards. These dates create a roughly 10-year window for organizations to complete their post-quantum migration. The Timeline view plots these milestones alongside country-specific deadlines.',
        deepLink: '/timeline',
      },
      {
        question: 'Which country has the most aggressive PQC deadline?',
        answer:
          'France, through ANSSI, has set some of the most aggressive PQC timelines in Europe, requiring PQC support in qualified security products and mandating hybrid deployment as an immediate transitional measure. South Korea (KISA) and the United States (CNSA 2.0 for national security systems) also have aggressive timelines. The Timeline view lets you compare country deadlines side by side.',
        deepLink: '/timeline',
      },
      {
        question: "What is the EU's PQC transition target?",
        answer:
          'EU Recommendation 2024/1101 calls on member states to develop coordinated national strategies for transitioning to post-quantum cryptography, emphasizing crypto agility and hybrid approaches during the migration period. The recommendation aligns with the broader NIS2 and eIDAS 2.0 frameworks to ensure interoperability across the EU. The Timeline view shows EU-level milestones and member state progress.',
        deepLink: '/timeline?country=European%20Union',
      },
      {
        question: 'When does the UK plan to complete PQC transition?',
        answer:
          "The UK's National Cyber Security Centre (NCSC) has published a PQC migration roadmap with a target completion date of 2035, aligned with NIST's disallowance timeline. NCSC recommends organizations begin with a cryptographic inventory and prioritize systems handling long-lived sensitive data. The Timeline view shows the UK's phased approach alongside other countries.",
        deepLink: '/timeline?country=United%20Kingdom',
      },
      {
        question: "What are Canada's PQC migration phases?",
        answer:
          "The Canadian Centre for Cyber Security published ITSM.40.001, which defines a phased PQC migration approach including discovery (cryptographic inventory), planning (risk assessment and roadmap), and migration (implementation and validation). Canada's guidance emphasizes alignment with NIST standards while accommodating Canadian-specific regulatory requirements. The Timeline view details Canada's phase structure and key milestones.",
        deepLink: '/timeline?country=Canada',
      },
      {
        question: "What is Germany's QUANTITY initiative?",
        answer:
          "QUANTITY is a joint BSI and DLR (German Aerospace Center) initiative launched in March 2025 focused on quantum cryptanalysis — stress-testing PQC algorithm candidates to validate their security assumptions and inform algorithm selection, rather than deploying quantum-safe infrastructure directly. Its findings complement BSI's broader PQC transition guidance (TR-02102) and strengthen confidence in standardized algorithms. The Timeline view shows Germany's milestone dates within the European context.",
        deepLink: '/timeline?country=Germany',
      },
      {
        question: 'What is the CNSA 2.0 exclusive phase deadline?',
        answer:
          'There is no single current deadline accurately described as a 2033 CNSA 2.0 exclusive phase. FAQ version 2.2 requires compliant new NSS acquisitions from 1 January 2027, phases out unsupported equipment and services by 31 December 2030 unless excepted, and mandates CNSA 2.0 algorithms by 31 December 2031 unless otherwise noted. Earlier category guidance sets 2030 exclusive-use milestones for software and firmware signing and traditional networking. The separate 2035 NSM-10 objective and the NIST IR 8547 disallowance date have different scope and authority.',
        deepLink: '/timeline',
      },
      {
        question: 'What web browsers support ML-KEM for TLS?',
        answer:
          'Chrome (default since version 131, November 2024; version 124 shipped the earlier draft X25519Kyber768Draft00), Microsoft Edge, and Firefox all support the X25519MLKEM768 hybrid key exchange in TLS 1.3, combining classical X25519 ECDH with ML-KEM-768 for post-quantum protection. Safari added X25519MLKEM768 support in Safari 26 / iOS 26 / macOS Tahoe 26 (fall 2025). The Migrate catalog tracks browser PQC support alongside other infrastructure categories.',
        deepLink: '/migrate',
      },
      {
        question: 'What is the G7 financial sector PQC target?',
        answer:
          'The G7 Cyber Expert Group has recommended that financial sector institutions begin PQC transition planning, recognizing the systemic risk that quantum computing poses to the global financial system. This recommendation influences national regulators and aligns with parallel efforts by the BIS (Bank for International Settlements) and FSB (Financial Stability Board). The Timeline view shows financial sector milestones across G7 nations.',
        deepLink: '/timeline',
      },
      {
        question: 'When did Microsoft announce PQC transition?',
        answer:
          "Microsoft has announced the integration of ML-KEM across its core infrastructure including Azure cloud services, Windows, and Microsoft 365, with hybrid PQC key exchange already available in some services. The rollout covers TLS, code signing, and internal authentication systems. The Timeline view tracks Microsoft's milestones alongside other major vendor announcements.",
        deepLink: '/timeline',
      },
      {
        question: 'What PQC timelines exist for Japan, Singapore, and Australia?',
        answer:
          "These three countries each publish dated milestones, but from different authorities and for different audiences, so they should not be lumped together. Japan: an interim summary issued in November 2025 by the inter-ministerial liaison conference on PQC use in government agencies sets, as a rule, a target of migrating government agencies to PQC by around 2035, with earlier migration considered system by system for especially sensitive or very long-lived information and a roadmap to be drawn up in fiscal 2026. Singapore: the Cyber Security Agency's Quantum-Safe Migration Handbook (version 1, 16 July 2026) lists milestones for Critical Information Infrastructure (CII) owners: a quantum-safe migration plan submitted to CSA by 31 March 2027, new CII systems with a digital component supporting quantum-safe algorithms or being quantum-safe ready from 1 January 2028, and migration completed by 31 December 2031. The handbook describes itself as informational and not mandatory overall, yet lists these as requirements for CII owners; for financial institutions, the Monetary Authority of Singapore's February 2024 advisory (Circular MAS/TCRS/2024/01) says they need crypto-agility to migrate away from vulnerable algorithms. Australia: the Australian Signals Directorate's Information Security Manual (September 2026 release), a framework that organisations apply through their own risk management, says DH, ECDH, ECDSA and RSA will not be approved beyond 2030, and its control ISM-1917 covers the development and procurement of new cryptographic equipment, applications and libraries so that they support ML-DSA-87, ML-KEM-1024, SHA-384, SHA-512 and AES-256 by no later than 2030. Whether a given milestone binds a particular organisation depends on its sector and regulator, so check the authority named for each country. The Timeline view tracks APAC milestones alongside Western deadlines.",
        deepLink: '/timeline',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 5. Compliance & Regulation
  // ---------------------------------------------------------------------------
  {
    id: 'compliance',
    title: 'Compliance & Regulation',
    items: [
      {
        question: 'What is FIPS 140-3 and why does the validation backlog matter?',
        answer:
          "FIPS 140-3 is the US standard for cryptographic module security certification, required for federal procurement and widely adopted in regulated industries. The validation backlog at NIST's CMVP (Cryptographic Module Validation Program) means that PQC module certifications can take 18 months or longer, creating a gap between algorithm standardization and deployable certified products. The Compliance Tracker shows validation status across PQC products.",
        deepLink: '/compliance?framework=FIPS-140-3',
      },
      {
        question: "What is eIDAS 2.0's PQC requirement?",
        answer:
          'eIDAS 2.0 (Regulation (EU) 2024/1183, amending Regulation (EU) No 910/2014) is the updated EU regulation governing electronic identification and trust services, including the European Digital Identity Wallet (EUDI Wallet). Its text does not mention post-quantum cryptography or quantum computing and names no algorithms. What it says about cryptography is general: recital 73 says trust service providers should use cryptographic methods reflecting current best practices and trustworthy implementations, and Article 24(2)(e) requires qualified trust service providers to use trustworthy systems and products, including suitable cryptographic techniques. The EU position on PQC readiness sits in a separate, non-binding instrument, Commission Recommendation (EU) 2024/1101, which encourages Member States to move public administrations and critical infrastructures to post-quantum cryptography as soon as possible and to follow a coordinated implementation roadmap. Treat PQC readiness for trust services as recommended migration practice, not as a PQC provision of eIDAS 2.0 itself, and check the implementing rules and technical standards that apply to your service. The Compliance Tracker details eIDAS 2.0 requirements alongside other EU frameworks.',
        deepLink: '/compliance?framework=EIDAS',
      },
      {
        question: 'What is DORA and when did it take effect?',
        answer:
          'The Digital Operational Resilience Act (DORA) is an EU regulation that took effect in January 2025, requiring financial institutions to address ICT risk management including cryptographic resilience. DORA mandates that organizations assess and mitigate risks from emerging technologies, which includes the quantum computing threat to current encryption. The Compliance Tracker maps DORA requirements to PQC migration actions.',
        deepLink: '/compliance?framework=DORA',
      },
      {
        question: 'What does NIS2 require for PQC?',
        answer:
          'The EU NIS2 Directive (Network and Information Security Directive 2) mandates comprehensive risk management for essential and important entities, requiring them to adopt appropriate and proportionate technical measures — which increasingly includes quantum-resilient cryptography. NIS2 applies to energy, transport, health, digital infrastructure, and other critical sectors. The Compliance Tracker shows how NIS2 intersects with PQC migration requirements.',
        deepLink: '/compliance?framework=NIS2',
      },
      {
        question: 'What is Executive Order 14306?',
        answer:
          "Executive Order 14306 (June 2025) streamlined its predecessor EO 14144 and removed the binding PQC procurement requirement for federal agencies. CISA's PQC product-category list (January 2026) remains advisory, while National Security System acquisitions must be CNSA 2.0-compliant from January 1, 2027 under CNSSP-15. Binding civilian deadlines now come from the June 2026 PQC Executive Order: post-quantum key establishment by 2030 and signatures by 2031. The Compliance Tracker tracks these US federal requirements and their intersection with NIST IR 8547 migration timelines.",
        deepLink: '/compliance?framework=EO-14306-TLS-1-3-AGENCY-SUPPOR',
      },
      {
        question: "What is NERC-CIP's relevance to PQC?",
        answer:
          'NERC-CIP (North American Electric Reliability Corporation — Critical Infrastructure Protection) standards set mandatory security requirements for the bulk electric system, including electronic security perimeters and communications between control centers. The published text of CIP-003-9, CIP-005-7, CIP-007-6, CIP-012-1, CIP-012-2 and CIP-015-1 does not mention quantum computing or PQC and does not name cryptographic algorithms; CIP-012, for example, requires a documented plan to mitigate unauthorized disclosure and modification of real-time assessment and monitoring data in transit between control centers. So none of these adopted standards requires PQC today, and whether later revisions will address it is not settled. Upgrading energy-sector encryption and authentication to quantum-safe algorithms is a readiness recommendation for your own risk planning, and a prediction about future rules should not be read as a current obligation; check NERC for newer versions of these standards. The Compliance Tracker shows energy sector requirements.',
        deepLink: '/compliance?framework=NERC-CIP',
      },
      {
        question: "What is Common Criteria's role in PQC?",
        answer:
          'Common Criteria (ISO/IEC 15408) is the international framework for evaluating IT product security, and the Common Criteria Recognition Arrangement (CCRA) supports recognition of certificates among participating nations (check the Common Criteria portal for the current member list). The framework is an evaluation method; which cryptographic mechanisms a certification scheme accepts is set by that scheme. In EU cybersecurity certification (EUCC), for example, the ECCG Agreed Cryptographic Mechanisms document recommends the mechanisms that should preferably be used in ICT products submitted to certification; version 2.0 was adopted in mid-2025 and a version 3 was under public review until the end of July 2026. Whether and when a scheme or protection profile will ask products to demonstrate quantum resilience is a prediction, not a settled requirement, so check the scheme you certify under rather than assuming a general PQC obligation. The Compliance Tracker includes Common Criteria PQC developments.',
        deepLink: '/compliance?framework=COMMON-CRITERIA',
      },
      {
        question: 'What is ISO/SAE 21434?',
        answer:
          'ISO/SAE 21434 is the international standard for automotive cybersecurity engineering: it specifies engineering requirements for cybersecurity risk management across the concept, development, production, operation, maintenance and decommissioning of road-vehicle electrical and electronic systems, and it states that it does not prescribe specific technology or solutions. It therefore does not by itself mandate crypto agility or any particular algorithm-upgrade mechanism. What it gives you is a lifecycle risk process that cryptographic components fall under: for each one, evaluate how long it must stay in service, whether its algorithms can be updated after deployment, and what the risk is if they cannot. Designing for software-updatable cryptography is design guidance that supports that risk management, not a clause of the standard. The Compliance Tracker lists ISO 21434 alongside PQC-related frameworks.',
        deepLink: '/compliance?framework=ISO-SAE-21434',
      },
      {
        question: 'What does PCI DSS 4.0 require for PQC?',
        answer:
          'PCI DSS v4.0.1 is the only active version of the standard (v4.0 retired on 31 December 2024) and the new requirements of v4.0 have been effective since 31 March 2025 (PCI SSC announcement, 11 June 2024). The public PCI SSC pages used for this FAQ state no PQC algorithm, parameter set or deadline for PCI DSS, so organizations subject to PCI DSS should treat a cryptographic inventory as a sensible starting point for PQC migration planning. The Compliance Tracker cross-references PCI DSS requirements with NIST migration guidance.',
        deepLink: '/compliance?framework=PCI-DSS',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 6. Migration Planning
  // ---------------------------------------------------------------------------
  {
    id: 'migration',
    title: 'Migration Planning',
    items: [
      {
        question: 'What are the seven phases of PQC migration?',
        answer:
          'The PQC migration lifecycle consists of seven phases: Discover (cryptographic inventory), Assess (risk evaluation), Prepare (architecture and planning), Test (validation and interoperability), Deploy/Launch (production rollout), Ramp Up (expand coverage), and Stay Agile (ongoing monitoring and algorithm updates). Each phase has specific deliverables and success criteria. The Migrate catalog organizes products and guidance by migration phase.',
        deepLink: '/migrate',
      },
      {
        question: 'What infrastructure layers does the Migrate catalog cover?',
        answer:
          'The Migrate catalog covers nine infrastructure layers — Cloud, Network, Application Servers, Libraries, Security Software, Database, Security Stack, OS, and Hardware. Each layer includes products with PQC readiness status and FIPS validation tiers. The catalog also tracks web browser PQC support as a separate category.',
        deepLink: '/migrate',
      },
      {
        question: 'What do the FIPS badges in the Migrate catalog mean?',
        answer:
          'A badge appears only where a certification record backs it. "FIPS 140-3" means the product holds a FIPS 140-3 module certificate; "FIPS 140-3 in process" means NIST lists the module as in process; "CAVP only" means its algorithms are CAVP-validated — the prerequisite for a certificate, not a certificate. No badge means no FIPS 140-3 record is linked. Open a product to see whether its certificate covers the PQC algorithms or classical ones only.',
        deepLink: '/migrate',
      },
      {
        question: 'What should organizations do first for PQC migration?',
        answer:
          'The first step in PQC migration is conducting a comprehensive cryptographic inventory — identifying every place your organization uses cryptography across code, configuration files, certificates, protocols, and third-party dependencies. This inventory becomes the foundation for risk assessment and migration prioritization. The Crypto Agility module includes tools for building a Cryptography Bill of Materials (CBOM).',
        deepLink: '/learn/crypto-agility',
      },
      {
        question: 'How does the PQC Risk Assessment wizard work?',
        answer:
          'The PQC Risk Assessment is a 13-step wizard that evaluates your organization across dimensions including industry, country, cryptographic usage, data sensitivity, compliance requirements, migration readiness, infrastructure maturity, and vendor dependencies. It produces a scored report with risk categories, compliance gap analysis, and a prioritized migration roadmap. The report can be exported as a PDF.',
        deepLink: '/assess',
      },
      {
        question: 'How many PQC-ready products does the catalog track?',
        answer:
          'The Migrate catalog tracks hundreds of products across nine infrastructure layers, each assessed for PQC readiness with specific algorithm support details and FIPS validation status. Products range from open-source libraries like OpenSSL and liboqs to commercial HSMs and cloud services from AWS, Azure, and GCP. The catalog is regularly updated as vendors announce new PQC capabilities.',
        deepLink: '/migrate',
      },
      {
        question: 'Can the assessment report be exported as PDF?',
        answer:
          'Yes, the PQC Risk Assessment report can be printed or saved as a PDF directly from your browser, preserving the full compliance gap analysis, threat landscape visualization, and prioritized migration roadmap. The print layout includes a professional header with your assessment parameters and a methodology explanation. The report is designed for board-level and audit presentations.',
        deepLink: '/assess',
      },
      {
        question: 'What is the Migration Workbench?',
        answer:
          'The Migrate page is an asset-first workbench: you start from what you actually run, pick quantum-safe replacement products, and assemble a sequenced plan aligned to NIST IR 8547 and CNSA 2.0. Tabs cover "Replace what you own", "Plan & sequence", "Vendor roadmaps", and "Vendor risk". Your selection is saved in your browser, and a Share link lets a colleague open the same plan — they can restore their own selection with one click.',
        deepLink: '/migrate?tab=plan',
      },
      {
        question: 'What is a Cryptography Bill of Materials (CBOM)?',
        answer:
          'A CBOM is a structured, machine-readable inventory of where and how your systems use cryptography — algorithms, key lengths, certificates, protocols, and libraries — typically formatted using the CycloneDX standard, analogous to a software bill of materials (SBOM). It enables automated detection of quantum-vulnerable components and is the foundation of crypto-agility: you cannot migrate what you cannot see. The Cryptography Bill of Materials (CBOM) module walks through building one and using it to drive a prioritized migration.',
        deepLink: '/learn/cbom',
      },
      {
        question: 'How do I safely retire legacy cryptography at the end of a migration?',
        answer:
          'The Decommissioning & Program Closure module covers the final phase: verifying that quantum-vulnerable algorithms are fully removed, retiring classical crypto without breaking interoperability, capturing evidence that the work is complete, and handing the program over to business-as-usual operations. It closes the loop so a migration does not quietly leave vulnerable cryptography in place.',
        deepLink: '/learn/verification-closure',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 7. Protocols & TLS
  // ---------------------------------------------------------------------------
  {
    id: 'protocols',
    title: 'Protocols & TLS',
    items: [
      {
        question: 'How does ML-KEM change the TLS 1.3 handshake?',
        answer:
          'For the X25519MLKEM768 group specified in RFC 10024, the client share is 1,216 bytes (32 X25519 + 1,184 ML-KEM encapsulation-key bytes), and the server share is 1,120 bytes (32 X25519 + 1,088 ML-KEM ciphertext bytes). The X25519-only baseline is 32 bytes in each direction, so the additional key-share data is 2,272 bytes: (1,216 + 1,120) - (32 + 32). This counts both directions, before other TLS framing, certificate-chain and signature data; it is not a total-handshake or fixed latency estimate. Measure the actual negotiated group, transcript and transport behavior with your TLS tools. The TLS Basics module demonstrates the message roles.',
        deepLink: '/learn/tls-basics',
      },
      {
        question: 'What is X25519MLKEM768?',
        answer:
          'X25519MLKEM768 is a hybrid key exchange method for TLS 1.3 that combines the classical X25519 ECDH key exchange with ML-KEM-768 (NIST Level 3 security), producing a combined shared secret that is secure against both classical and quantum attacks. It is already supported in Chrome, Firefox, and Edge, making it the most widely deployed PQC mechanism on the internet today. The TLS Basics module demonstrates this handshake interactively.',
        deepLink: '/learn/tls-basics',
      },
      {
        question: 'What PQC algorithms work for VPN/IPsec?',
        answer:
          'For VPN and IPsec, RFC 9370 lets IKEv2 run multiple key exchanges when it builds a security association, which is how a post-quantum key exchange such as ML-KEM is added alongside a classical Diffie-Hellman group (strongSwan, for example, includes an ML-KEM key-exchange plugin). The ML-KEM profile for IKEv2 and PQC signature authentication for IKEv2 were still Internet-Drafts in the RFC Editor queue when this answer was last reviewed (November 2026), so check the IETF datatracker and your vendor for current status before relying on interoperability of ML-DSA certificate authentication for tunnel endpoints. A hybrid configuration lets peers that support only the classical exchange still connect: RFC 9370 notes that unless both peers support and agree to use the additional key exchanges, the result is the same shared secret as plain IKEv2. That is compatibility, not post-quantum protection, so confirm in testing that the additional exchange was actually negotiated and set policy to require it where you need it. The VPN/SSH module covers configuration for strongSwan, WireGuard, and OpenVPN.',
        deepLink: '/learn/vpn-ssh-pqc',
      },
      {
        question: 'What OpenSSH version supports PQC?',
        answer:
          "OpenSSH 8.5 (2021) introduced the sntrup761x25519-sha512 hybrid key exchange, which combines the NTRU Prime lattice-based KEM with classical X25519 ECDH, and OpenSSH 9.0 made it the default. More recent OpenSSH development includes support for ML-KEM-768-based hybrid key exchange, aligning with NIST's standardized algorithms. The VPN/SSH module explains host key migration and client configuration for PQC.",
        deepLink: '/learn/vpn-ssh-pqc',
      },
      {
        question: 'How does S/MIME support PQC?',
        answer:
          'RFC 9629 defines the generic KEMRecipientInfo mechanism for using a KEM such as ML-KEM (not ML-DSA) within the CMS framework that underpins S/MIME email security. Hybrid mode is especially important for email because archived messages must remain confidential for years or decades after encryption. The Email Signing module covers S/MIME PQC deployment and backward compatibility.',
        deepLink: '/learn/email-signing',
      },
      {
        question: 'What is the JWT size problem with PQC?',
        answer:
          "For ML-DSA-65, the raw signature is 3,309 bytes (FIPS 204). In a compact JWS with the usual base64url-encoded signature, the base64url signature segment is 4,412 bytes (4,412 ASCII characters), before the encoded header, payload and two dots. That is distinct from a 64-byte ES256 signature or a 256-byte RSA-2048 signature. The existing Token Size Analyzer's worked payload produces a 4,711-byte complete HTTP/1 Authorization field line for its ML-DSA-65 sample versus 379 bytes for ES256, including 24 bytes for the 'Authorization: Bearer ' prefix and terminating CRLF. Those are that sample's sizes, not universal JWT or server limits. Open the analyzer, change the payload and configured per-line budget, and compare the actual serialized line at and beyond the boundary. Assess the real proxy/gateway limits and verifier profile; reference tokens are a separate deployment option, not a size guarantee.",
        deepLink: '/learn/api-security-jwt?tab=workshop&step=4',
      },
      {
        question: 'How do PQC certificates affect TLS chain size?',
        answer:
          'A typical ML-DSA certificate chain (root, intermediate, and leaf) totals approximately 14KB compared to about 3KB for an equivalent RSA chain, due to the larger public keys and signatures in PQC algorithms. This increased size is significant for IoT devices with limited bandwidth and for mobile connections with high latency. The PKI Workshop module quantifies the overhead and explores mitigation strategies.',
        deepLink: '/learn/pki-workshop',
      },
      {
        question: 'What is a Merkle Tree Certificate?',
        answer:
          'Merkle Tree Certificates are a compact certificate format that replaces full certificate chains with short Merkle inclusion proofs, dramatically reducing the TLS handshake overhead caused by large PQC signatures and public keys. Instead of transmitting the full chain, the server provides a proof that its certificate is included in a trusted Merkle tree maintained by a transparency log. The Merkle Tree Certificates module explores this emerging approach to PQC deployment.',
        deepLink: '/learn/merkle-tree-certs',
      },
      {
        question: 'Where can I see which protocols support post-quantum cryptography?',
        answer:
          'The Algorithms page has a Protocol Support tab — a matrix showing post-quantum readiness across protocols (TLS 1.2/1.3, SSH, IKEv2/IPsec, S/MIME, DNSSEC, KMIP, MLS, and more) along four dimensions: pure and hybrid KEM, and pure and hybrid signatures. Open any protocol for a detail view of its standardization status and available implementations — each opens with its own shareable link.',
        deepLink: '/algorithms?tab=support',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 8. Infrastructure & Operations
  // ---------------------------------------------------------------------------
  {
    id: 'infrastructure',
    title: 'Infrastructure & Operations',
    items: [
      {
        question: 'How does PKCS#11 v3.2 support PQC?',
        answer:
          'PKCS#11 version 3.2 introduces native PQC support through new mechanism types (CKM_ML_KEM, CKM_ML_DSA, CKM_SLH_DSA) and two new functions — C_EncapsulateKey and C_DecapsulateKey — for the KEM paradigm that does not fit the traditional encrypt/decrypt model. It also adds key type constants and parameter set identifiers for all NIST-standardized PQC algorithms. The HSM module provides a hands-on PKCS#11 v3.2 simulator.',
        deepLink: '/learn/hsm-pqc',
      },
      {
        question: 'What HSMs support ML-KEM and ML-DSA?',
        answer:
          'Major HSM vendors including Thales (Luna), Entrust (nShield) and Utimaco have announced or delivered PQC algorithm support including ML-KEM and ML-DSA, with varying levels of FIPS 140-3 validation status. Cloud HSMs differ: AWS CloudHSM documents ML-DSA key generation and signing (in FIPS mode on hsm2m.medium clusters from 1 September 2026) but no ML-KEM command. Some vendors offer firmware upgrades for existing hardware while others require new PQC-capable models. The Migrate catalog tracks HSM PQC support and FIPS validation status.',
        deepLink: '/migrate?domain=hsm',
      },
      {
        question: 'What is the OpenSSL provider architecture for PQC?',
        answer:
          'OpenSSL 3.x uses a loadable provider architecture, so cryptographic algorithms can be added without modifying the core library. Loading a provider does not by itself make an application quantum-safe: what an application uses depends on the OpenSSL version, the API it calls and the protocol it negotiates. OpenSSL 3.5.0 (April 2025) implements ML-KEM, ML-DSA and SLH-DSA natively in its default provider and puts the hybrid X25519MLKEM768 group first in its default TLS group list. On earlier 3.x releases the Open Quantum Safe provider (oqsprovider, built on liboqs) can add algorithms, but its documentation describes it as meant for research and prototyping and recommends against relying on it in production; it also needs OpenSSL 3.2 or later for TLS 1.3 signature algorithms. An application only uses a new algorithm if it asks for it, for example through the supported-groups setting or by naming the algorithm, so verify the negotiated behavior with a handshake test, for example by reading the negotiated group with SSL_get0_group_name (OpenSSL 3.2 and later) on a test client and server, instead of assuming it. The OS PQC module covers provider configuration and system-wide crypto policy management.',
        deepLink: '/learn/os-pqc',
      },
      {
        question: 'How do you configure PQC TLS on Linux?',
        answer:
          'The setup depends on the distribution and on the TLS library an application uses. On RHEL 10.1 and later, the DEFAULT system-wide crypto policy enables and prefers post-quantum key exchange for TLS and SSH for applications that use OpenSSL, GnuTLS, NSS or Go; on RHEL 9.7, applications based on OpenSSL or NSS can use PQC in TLS once update-crypto-policies --set DEFAULT:PQ is run. The mechanism is hybrid key-exchange groups in TLS 1.3, such as X25519MLKEM768, not new cipher suites. Elsewhere, availability follows the library version and build: OpenSSL 3.5 and later include PQC natively, older OpenSSL releases can load oqsprovider for testing, and GnuTLS release notes say its PQC support is provided through leancrypto, so it depends on how your distribution builds it. Each application also has to use the library setting that offers the hybrid group, so check applications one by one and confirm with a test connection that the negotiated group is hybrid. The OS PQC module provides configuration examples for several operating systems.',
        deepLink: '/learn/os-pqc',
      },
      {
        question: "What is HashiCorp Vault's PQC migration path?",
        answer:
          "HashiCorp Vault's PQC migration is easier to plan if you separate its mechanisms. Vault encrypts the data it writes to storage with a 256-bit AES-GCM cipher behind its security barrier, and the transit engine's default key type is aes256-gcm96; these symmetric mechanisms are not what Shor's algorithm breaks. Unseal keys are split with Shamir's Secret Sharing, which divides a key into shares and does not itself use public-key encryption; the quantum-exposed parts are around it, for example shares encrypted to recipients' public keys with the init pgp-keys option, and the TLS connections to Vault. With auto-unseal, Vault asks an external HSM or KMS to decrypt the root key, so trace whether that service protects it with a symmetric or an asymmetric key and how Vault reaches it. Signatures and certificates are the other exposed area: transit keys of type rsa, ecdsa and ed25519, and PKI issuers with those key types, are quantum-vulnerable. Vault's documentation lists ML-DSA keys for the PKI secrets engine and ML-DSA, SLH-DSA and hybrid signature key types for transit (Enterprise), but no ML-KEM key type, so ML-KEM-based wrapping of transit keys or of the seal would be a proposed integration through an external KMS, HSM or plugin, not a built-in Vault feature. The Secrets Management module's Vault Transit Simulator models such a design.",
        deepLink: '/learn/secrets-management-pqc',
      },
      {
        question: 'What database encryption changes need PQC?',
        answer:
          'Start by tracing what actually protects the data in each database, because only some of those dependencies are quantum-exposed. Bulk encryption in Transparent Data Encryption (TDE) uses symmetric keys (SQL Server, for example, documents its database encryption key as a symmetric key using AES), and symmetric standards are not expected to need replacing for the PQC migration (NIST IR 8547), so that layer stays unchanged apart from choosing 256-bit keys where policy asks for them. The exposed pieces are the asymmetric dependencies around it: a wrapper for the data encryption key that is itself an asymmetric key or certificate (SQL Server protects its database encryption key with a certificate or with an asymmetric key held by an EKM module), BYOK key-import wrapping that uses RSA (AWS KMS, for instance, wraps imported key material with an RSA public key), and the TLS or KMIP channel to the key manager. Only those asymmetric wrappers and transports need a quantum-safe replacement, such as a key-encapsulation-based wrapper; a symmetric master key held in an HSM or KMS needs no algorithm change. Treat column-level encryption the same way: check whether each client library uses symmetric encryption only or also wraps keys with an asymmetric algorithm. The Database Encryption module walks through each layer.',
        deepLink: '/learn/database-encryption-pqc',
      },
      {
        question: 'What is the UEFI Secure Boot PQC migration path?',
        answer:
          'UEFI Secure Boot migration requires replacing the Platform Key (PK), Key Exchange Key (KEK), and signature database (db) entries from RSA-2048 signatures to ML-DSA, which involves coordinated firmware vendor updates across the entire boot chain. The migration must be carefully sequenced to avoid bricking devices — a failed Secure Boot update can render systems unbootable. The Secure Boot module provides an interactive chain analysis tool.',
        deepLink: '/learn/secure-boot-pqc',
      },
      {
        question: 'How does Zero Trust architecture change with PQC?',
        answer:
          'Zero Trust architecture relies heavily on cryptographic authentication at every access point — device attestation certificates, mutual TLS, JWT and SAML token signatures, and API gateway authentication all use algorithms that are quantum-vulnerable and need PQC upgrades. The transition is especially complex because Zero Trust systems often involve multiple identity providers, device management platforms, and micro-segmentation controllers. The IAM PQC module covers the identity and authentication layer migration.',
        deepLink: '/learn/iam-pqc',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 9. Industry-Specific
  // ---------------------------------------------------------------------------
  {
    id: 'industries',
    title: 'Industry-Specific',
    items: [
      {
        question: 'What is the PQC impact on payment systems (EMV)?',
        answer:
          'EMV payment systems face PQC questions at several separate layers, and they should not be merged. DUKPT (derived unique key per transaction, ANSI X9.24-3) derives per-transaction keys from an initial terminal key using symmetric cryptography, so the derivation itself is not what a quantum computer breaks and should not be described as migrating to ML-KEM. The exposed part is how the initial keys reach terminals: where keys are injected or loaded remotely using public-key techniques (ANSI X9.24-2 covers using asymmetric techniques to distribute symmetric keys), those asymmetric steps are the quantum-vulnerable part and need a quantum-safe design; a KEM such as ML-KEM is one candidate for that transport step only. Card authentication (SDA, DDA, CDA) is a third, separate layer: which post-quantum signature algorithm and parameter set card platforms will use is decided by EMVCo and payment-network specifications, so treat any specific choice, including for constrained smart card chips, as unsettled rather than as a recommendation. Tokenization services (Visa VTS, Mastercard MDES) are a fourth layer to take up with the service provider. The EMV Payment module simulates these migration scenarios.',
        deepLink: '/learn/emv-payment-pqc',
      },
      {
        question: 'How does PQC affect 5G telecom security?',
        answer:
          '5G security is affected in several areas: SUCI (Subscription Concealed Identifier) privacy protection needs a PQC encryption Profile C, SIM/eSIM provisioning key exchange must migrate to ML-KEM, and network slice authentication needs PQC-capable certificates. The 5G-AKA authentication protocol itself uses AES and is quantum-safe, but the surrounding PKI infrastructure is not. The 5G Security module covers the 3GPP standards and migration path.',
        deepLink: '/learn/5g-security',
      },
      {
        question: 'What is the PQC challenge for IoT devices?',
        answer:
          'IoT devices face severe constraints for PQC adoption: limited memory (often under 256KB RAM), slow processors (Cortex-M class), and low bandwidth connections make full ML-DSA certificate chains impractical. ML-KEM-512 and SLH-DSA-128s (small variant) are the most viable algorithms for Cortex-M4 class devices, but certificate chain bloat remains the single biggest challenge. The IoT/OT module includes a certificate chain bloat analyzer.',
        deepLink: '/learn/iot-pqc',
      },
      {
        question: 'How does PQC affect healthcare data?',
        answer:
          'Healthcare data faces among the highest HNDL risk because biometric records and genomic data have effective confidentiality requirements of 75 years or more — far exceeding the expected time until a CRQC is available. HIPAA security requirements will need to encompass PQC migration, and HL7 FHIR API security needs PQC-capable TLS and token signing. The Healthcare PQC module assesses sector-specific risks and regulatory requirements.',
        deepLink: '/learn/healthcare-pqc',
      },
      {
        question: 'What PQC challenges does aerospace face?',
        answer:
          'Aerospace faces unique PQC challenges including 20-year or longer mission lifecycles for satellites and aircraft, DO-178C and DO-326A airworthiness certification costs for crypto updates, and bandwidth-constrained satellite links where compact signatures are critical. Space-based systems deployed today will still be operating well into the post-quantum era. The Aerospace module covers satellite communications, avionics firmware signing, and ground station security.',
        deepLink: '/learn/aerospace-pqc',
      },
      {
        question: 'How does the automotive industry approach PQC?',
        answer:
          'The automotive industry must address PQC across V2X (Vehicle-to-Everything) PKI certificates, in-vehicle network authentication, and over-the-air software update signing, all complicated by vehicles that stay in service for a long time. ISO/SAE 21434 asks for cybersecurity risk management across the vehicle lifecycle but does not prescribe technology, so whether a component can have its algorithms updated without hardware replacement is something to evaluate in that risk assessment, as design guidance rather than a clause of the standard. The Automotive module explores V2X PKI migration and ECU firmware signing.',
        deepLink: '/learn/automotive-pqc',
      },
      {
        question: 'What is the energy sector PQC migration?',
        answer:
          'The energy sector must migrate PQC across SCADA and ICS protocols (including DNP3 and IEC 61850 Secure Authentication), substation automation (IEC 62351), and grid management systems, while managing long equipment lifecycles. The NERC-CIP standards named in the NERC-CIP entry above do not mention PQC, so quantum-resilient cryptography for bulk electric system protection is a readiness recommendation based on those lifecycles, not a NERC-CIP requirement today. The Energy and Utilities module covers the specific protocols and regulatory requirements.',
        deepLink: '/learn/ot-pqc',
      },
      {
        question: 'How does PQC protect AI systems?',
        answer:
          'AI systems have PQC-relevant exposure at several separate points: model weight encryption protecting intellectual property in transit and at rest, secure channels between federated learning participants and the aggregation server, and inference API authentication ensuring only authorized clients can access model endpoints. Channel security (for example, TLS with quantum-resistant key exchange and authentication) protects updates from eavesdropping and tampering in transit and identifies participants, but it does not prevent model poisoning: NIST notes that compromised clients can send malicious updates that poison the global model. Defenses against poisoning are separate controls, such as robust (Byzantine-resilient) aggregation, limits on how much any one participant can influence the global model (NIST mentions gradient clipping and differential privacy), controls on which clients take part, and validation of training data and models (NIST describes training-data sanitization and model inspection). NIST also notes that motivated adversaries can bypass these defenses and that clipping and differential privacy only mitigate to some extent. As AI models become high-value targets, the cryptographic infrastructure protecting them must be quantum-resilient. The AI Security module covers these threat vectors and migration approaches.',
        deepLink: '/learn/ai-security-pqc',
      },
      {
        question: 'What PQC changes do code signing pipelines need?',
        answer:
          'Code signing pipelines need to migrate from RSA or ECDSA to ML-DSA for signing container images (cosign/Notation), operating system packages (RPM, Debian, npm), and SLSA supply chain attestations. The larger ML-DSA signatures increase registry storage and download overhead, and CI/CD systems need updated toolchains and key management. The Code Signing module covers the migration for each signing ecosystem.',
        deepLink: '/learn/code-signing',
      },
      {
        question: 'How does PQC affect digital identity?',
        answer:
          'Digital identity systems including the EU Digital Identity Wallet (EUDI), mobile driver licenses (mDL via ISO 18013-5), and FIDO2/WebAuthn passwordless authentication all rely on digital signatures that are quantum-vulnerable. These systems issue long-lived credentials that must remain trustworthy for years, making early PQC adoption critical. The Digital Identity module explores the PQC migration for each identity framework.',
        deepLink: '/learn/digital-id',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 10. PQC Today Platform
  // ---------------------------------------------------------------------------
  {
    id: 'platform',
    title: 'PQC Today Platform',
    items: [
      {
        question: 'Can I test PQC algorithms in my browser?',
        answer:
          "Yes, PQC Today's Playground runs ML-KEM, ML-DSA, SLH-DSA, and over 40 additional algorithms directly in your browser using WebAssembly, performing real cryptographic operations without sending any data to a server. You can generate keys, encapsulate/decapsulate shared secrets, sign and verify messages, and compare algorithm performance. The Playground supports both the liboqs library and a PKCS#11 v3.2 HSM simulator.",
        deepLink: '/playground',
      },
      {
        question: 'What is OpenSSL WASM Studio?',
        answer:
          'OpenSSL WASM Studio lets you run OpenSSL 3.6 commands directly in your browser via WebAssembly, enabling you to generate PQC key pairs, create X.509 certificates, perform hybrid encryption, and test algorithm performance without installing anything locally. All operations happen client-side — no keys or data leave your browser. The Studio includes pre-built command templates for common PQC workflows.',
        deepLink: '/openssl',
      },
      {
        question: 'How many learning modules does PQC Today offer?',
        answer:
          'PQC Today offers dozens of interactive learning modules organized across nine tracks: Foundations, Protocols, Applications, Hardware Infrastructure, Software Infrastructure, Strategy, Industries, Governance & Risk, and Role Guides. Each module includes an introduction with glossary-linked terms, interactive workshop exercises, and knowledge assessment questions. Module durations range from 10 minutes to 120 minutes depending on complexity.',
        deepLink: '/learn',
      },
      {
        question: 'How does the PQC Risk Assessment work?',
        answer:
          'The PQC Risk Assessment is a 13-step comprehensive wizard (with a 6-step quick path) that evaluates your organization across industry context, country-specific regulations, cryptographic usage patterns, data sensitivity levels, compliance requirements, and infrastructure maturity. It produces a scored report with a risk classification (Critical, High, Moderate, or Low), compliance gap analysis, threat landscape visualization, and a prioritized migration roadmap. The report can be exported as a PDF for stakeholder presentations.',
        deepLink: '/assess',
      },
      {
        question: 'Is PQC Today open source?',
        answer:
          'Yes, PQC Today is fully open source under the AGPL-3.0 license, with source code available on GitHub at pqctoday-org/pqctoday-hub. Community contributions are welcome for new modules, data updates, and platform improvements. The codebase is a React SPA built with TypeScript, Vite, and Tailwind CSS.',
        deepLink: '/about',
      },
      {
        question: 'What is the PQC Reference Library?',
        answer:
          'The PQC Reference Library is a curated collection of hundreds of standards, RFCs, research papers, and migration guides relevant to post-quantum cryptography, with cross-references linking related documents and enrichment metadata providing summaries and PQC relevance assessments. Documents are categorized by type, issuing organization, and relevance to specific algorithms and use cases. The Library supports full-text search and filtering.',
        deepLink: '/library',
      },
      {
        question: 'What does the Compliance Tracker show?',
        answer:
          "The Compliance Tracker aggregates PQC mandates and recommendations with framework timelines, source references and industry context. Its records come from dated dataset snapshots updated through a maintainer-run checking and review process. This view reads those snapshots; it does not scrape the linked authorities while you browse. A record can lag its source until the next pass. Check the dataset version, source date and last-verified date, then read the linked authority for the rule's actual subject and scope. The About page explains maintenance and freshness, and the Changelog records published updates. Country, industry and framework filters help you find the relevant records; a filtered view does not establish compliance.",
        deepLink: '/compliance',
      },
      {
        question: 'How does the PQC Assistant chatbot work?',
        answer:
          'The PQC Assistant retrieves relevant Hub content to support answers with citations and deep links. In Local LLM (WebLLM) mode, inference runs in your browser and your chat prompts are not sent to an external AI inference service; model files still need network downloads before local use. If you choose the Gemini cloud mode and provide your Google AI API key, chat messages, retrieved Hub context and page context are sent to Google for processing. Local storage of the key does not make that cloud inference local. Choose the mode deliberately and check its data-use terms before entering sensitive information. Source citations help you verify an answer; they do not themselves prove it correct. The About and Terms pages describe both modes.',
        deepLink: '/about',
      },
      {
        question: "Where should I start if I'm new to PQC?",
        answer:
          "Start with PQC 101 — a 30-minute foundational module covering what quantum computers can break, why migration is urgent, and how to use Mosca's Theorem to gauge your own deadline. If you prefer context by role: executives should visit the Executive Quantum Impact module, developers the Developer Quantum Impact module, and architects the Architect module. For an organization-specific starting point, run the PQC Risk Assessment wizard — it takes about 15 minutes and produces a prioritized action list based on your industry, country, and data profile. Use this FAQ's search bar to jump directly to any specific topic.",
        deepLink: '/learn/pqc-101',
      },
      {
        question: 'What is the Business Center (GRC Command Center)?',
        answer:
          'The Business Center is a governance, risk, and compliance command center aligned to NIST CSWP.39, with 34 board-ready planning tools — including an ROI Calculator, Board Pitch builder, CRQC Scenario, Risk Register, Risk Treatment Plan, RACI Builder, Roadmap Builder, KPI dashboards, Vendor Scorecard, and Deployment Playbook. Each tool produces a downloadable artifact (DOCX, PDF, or CSV) you can take into stakeholder and audit conversations.',
        deepLink: '/business',
      },
      {
        question: 'What is the PQC Migration Simulation?',
        answer:
          "The Simulation is a playable, end-to-end walkthrough of a quantum-safe migration. You run an organization through the framework's nine phases (P0–P7 plus program closure), make decisions at each step, watch your Mosca clock (X+Y>Z) and crypto-maturity level respond, and gather the evidence needed to clear each phase gate. It turns the migration framework into a hands-on exercise rather than a checklist.",
        deepLink: '/simulation',
      },
      {
        question: 'Does PQC Today track the PQC patent landscape?',
        answer:
          'Yes. The Patents page is a searchable landscape of post-quantum cryptography patents, scored for quantum relevance and crypto-agility and tagged by assignee, region, protocol, replaced classical algorithm, hardware component, and NIST standardization status. It also serves as CSWP.39 maturity evidence. Use the Insights, Explore, and Search tabs to filter, and open any patent record directly with a shareable link.',
        deepLink: '/patents',
      },
      {
        question: 'Can I bookmark or share a specific view?',
        answer:
          'Yes. Most pages put their state in the URL, so the link in your address bar recreates what you see — an opened item (a specific algorithm protocol, leader, patent, library document, threat, or timeline milestone), a filtered result set, or an active tab. On the Migration Workbench, a Share link even carries your product selection to a colleague. Bookmarking or sharing any of these links reopens the same view, and the browser Back button closes an opened item.',
        deepLink: '/migrate',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 11. Role-Specific Guidance
  // ---------------------------------------------------------------------------
  {
    id: 'roles',
    title: 'Role-Specific Guidance',
    items: [
      {
        question: 'What should executives know about quantum risk?',
        answer:
          'The Executive Quantum Impact module is a 30-minute briefing covering the Harvest Now Decrypt Later threat to corporate data, dated guidance and requirements with their scope (the draft NIST 2030/2035 horizon, CNSA 2.0 NSS milestones in 2027/2030/2031, and EU roadmap milestones), budget implications of infrastructure-wide crypto migration, and board-level action items for starting a PQC program. It includes a risk assessment framework calibrated for business decision-makers rather than technical staff. The module provides a board-ready presentation template.',
        deepLink: '/learn/exec-quantum-impact',
        persona: 'executive',
      },
      {
        question: 'What PQC libraries should developers use?',
        answer:
          "Treat sample and research libraries and production libraries as two different decisions. For learning, prototypes and interoperability tests, liboqs (C, with wrappers such as liboqs-python) and oqsprovider for OpenSSL are sample and research options: their own documentation says not to rely on them in a production environment or to protect sensitive data. For production, evaluate the supported library already in your platform and language stack. For example, OpenSSL 3.5 and later include ML-KEM, ML-DSA and SLH-DSA natively; Go's standard library has had crypto/mlkem since Go 1.24 and enables X25519MLKEM768 by default in crypto/tls; and Bouncy Castle for Java and AWS-LC include ML-KEM and ML-DSA implementations. The Rust pqcrypto crates are marked unmaintained by their maintainers, who advise against using them in new projects. For any library, evaluate before production: whether the release is supported and maintained, what validation applies (a FIPS 140-3 certificate covers a specific validated module, as with the FIPS module of AWS-LC, not every feature of a library), and whether the protocols you need interoperate with your peers. The Developer Quantum Impact module covers library API transitions across OpenSSL, Bouncy Castle and liboqs bindings.",
        deepLink: '/learn/dev-quantum-impact',
        persona: 'developer',
      },
      {
        question: 'How should architects design for PQC?',
        answer:
          'PQC-ready architecture requires crypto-agility patterns that abstract algorithm selection behind configuration, hybrid deployment strategies that combine classical and PQC algorithms during the transition, and infrastructure migration sequencing that prioritizes the highest-risk components. Architects should design for algorithm replaceability from day one rather than treating PQC as a drop-in replacement. The Architect module includes algorithm decision trees and reference architectures.',
        deepLink: '/learn/arch-quantum-impact',
        persona: 'architect',
      },
      {
        question: 'What PQC operations tasks should IT teams plan?',
        answer:
          'IT operations teams should plan for automated certificate rotation, HSM firmware upgrades to support PKCS#11 v3.2 PQC mechanisms, system-wide crypto-policy updates via tools like update-crypto-policies, and monitoring dashboards to track algorithm deprecation across the infrastructure. Treat the drivers of rotation as separate: ecosystem and policy rules (for example, the CA/Browser Forum schedule that reduces the maximum validity of publicly trusted TLS server certificates from 398 days to 47 days between March 2026 and March 2029), key compromise or other revocation reasons (RFC 5280 defines reasons such as keyCompromise and superseded), the validity period your own CA policy sets, algorithm transitions that replace classical or hybrid certificates, and the sheer number of certificates you issue. Choosing a PQC algorithm does not by itself set a rotation interval, and a CRL entry carries a certificate serial number and revocation date rather than the certificate key or signature, so larger PQC certificates do not by themselves make revocation lists a reason to rotate more often. The Operations module provides runbooks and automation templates.',
        deepLink: '/learn/ops-quantum-impact',
        persona: 'ops',
      },
      {
        question: 'What PQC research areas are active?',
        answer:
          'Active PQC research areas include tightening lattice security proofs (especially for ML-KEM and ML-DSA), developing side-channel-resistant implementations for constrained devices, exploring alternative paradigms such as multivariate, code-based, and isogeny-based cryptography, and integrating quantum random number generators (QRNG) for enhanced key generation. The Research module surveys the frontiers and open questions in post-quantum cryptography.',
        deepLink: '/learn/research-quantum-impact',
        persona: 'researcher',
      },
      {
        question: 'How do I build a PQC business case for the board?',
        answer:
          'The PQC Business Case module provides an ROI calculator that estimates the cost of delayed migration versus proactive investment, a breach cost model incorporating quantum-specific scenarios, compliance penalty exposure analysis based on your regulatory environment, and a board-ready investment memo generator. It frames PQC migration as risk mitigation with quantifiable metrics rather than a pure technology upgrade. The module produces a downloadable executive summary.',
        deepLink: '/learn/pqc-business-case',
      },
      {
        question: 'What governance framework supports PQC migration?',
        answer:
          "The PQC Governance module provides a RACI (Responsible, Accountable, Consulted, Informed) matrix builder for PQC migration stakeholders, policy templates covering four organizational layers (board, executive, management, operational), governance model selection guidance, and a KPI dashboard for tracking migration progress at the board level. It integrates with the Risk Assessment to align governance decisions with your organization's specific risk profile.",
        deepLink: '/learn/pqc-governance',
      },
      {
        question: 'How do I assess vendor PQC readiness?',
        answer:
          'The Vendor Risk module provides six-dimension vendor scorecards evaluating PQC algorithm support, FIPS validation status, migration roadmap maturity, CBOM (Cryptography Bill of Materials) availability, contractual crypto-agility commitments, and supply chain dependencies. It includes a contract clause generator for PQC readiness requirements and a supply chain risk mapping tool. The module helps procurement teams make informed decisions about vendor quantum readiness.',
        deepLink: '/learn/vendor-risk',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 12. Interactive Tools
  // ---------------------------------------------------------------------------
  {
    id: 'tools',
    title: 'Interactive Tools',
    items: [
      {
        question: 'What is the SoftHSM WASM mode?',
        answer:
          'SoftHSM WASM mode is a browser-based PKCS#11 version 3.2 HSM emulation featuring a dual-engine architecture with both C++ and Rust implementations for cross-check verification. It supports the full PQC algorithm suite — ML-KEM, ML-DSA, SLH-DSA, LMS/HSS, and XMSS — alongside classical algorithms including EC (P-256/384/521), secp256k1, X25519/X448, BIP32 HD keys, AES-256-GCM, and HKDF/PBKDF2/KBKDF, all running entirely in WebAssembly. You can generate key pairs, perform key encapsulation/decapsulation, sign and verify messages, inspect PKCS#11 parameters with real-time decoders, and run classical versus PQC benchmarks side by side.',
        deepLink: '/playground',
      },
      {
        question: 'What is the BB84 QKD simulator?',
        answer:
          'The BB84 QKD simulator is an interactive demonstration of the BB84 quantum key distribution protocol with a configurable Eve (eavesdropper) interception slider that shows how increasing interception rates raise the quantum bit error rate and trigger eavesdropper detection. It visualizes the full protocol: basis selection, qubit transmission, basis reconciliation, error estimation, and privacy amplification. The simulator uses real deployment parameters from documented QKD networks.',
        deepLink: '/learn/qkd',
      },
      {
        question: 'What is the TLS Handshake Simulator?',
        answer:
          'The TLS Handshake Simulator lets you step through a complete TLS 1.3 handshake in classical (X25519), hybrid (X25519MLKEM768), and pure PQC (ML-KEM-768) modes, showing the byte-level content of each message and a side-by-side comparison of handshake size overhead. It visualizes the ClientHello key shares, ServerHello encapsulation, and the resulting shared secret derivation. The simulator is part of the TLS Basics workshop.',
        deepLink: '/learn/tls-basics',
      },
      {
        question: 'What is the PQC Configuration Generator?',
        answer:
          'The PQC Configuration Generator produces ready-to-use server configuration snippets for deploying hybrid PQC TLS on nginx, Apache, and HAProxy, including the correct cipher suite strings, SSL/TLS protocol versions, and certificate paths. It accounts for your chosen security level and whether you want hybrid or pure PQC mode. The generator is accessible from the TLS Basics workshop tab.',
        deepLink: '/learn/tls-basics?tab=workshop',
      },
      {
        question: 'What is the Risk Heatmap?',
        answer:
          "The Risk Heatmap is a 5-by-5 likelihood-versus-impact matrix for visualizing and prioritizing PQC migration actions across different asset types, threat scenarios, and infrastructure components. You can place risks on the grid based on your organization's specific exposure and generate a prioritized remediation list. The heatmap is part of the PQC Risk Management workshop.",
        deepLink: '/learn/pqc-risk-management?tab=workshop',
      },
      {
        question: 'What is the Crypto Agility Framework?',
        answer:
          'The Crypto Agility Framework is an interactive workshop that guides you through CBOM scanning to inventory cryptographic usage, algorithm abstraction layer design for isolating crypto implementations from business logic, and a 12-category remediation prioritization system. It produces an actionable migration backlog organized by risk severity and implementation complexity. The framework is part of the Crypto Agility module workshop.',
        deepLink: '/learn/crypto-agility?tab=workshop',
      },
      {
        question: 'How does the PKCS#11 Simulator work?',
        answer:
          'The PKCS#11 Simulator walks you through eight PQC operations using the PKCS#11 v3.2 API: token initialization, session management, ML-KEM key generation, key encapsulation, key decapsulation, ML-DSA signing, signature verification, and key attribute inspection. It compares on-premises HSM and cloud HSM behavior for each operation. The simulator runs real WASM-compiled PKCS#11 operations in your browser.',
        deepLink: '/learn/hsm-pqc?tab=workshop',
      },
      {
        question: 'How do I navigate the PQC Risk Assessment wizard?',
        answer:
          'The Risk Assessment wizard walks through 13 sequential steps, starting with your industry and country to anchor regulatory context, then progressing through cryptographic usage patterns, data sensitivity levels (you can select multiple), compliance frameworks you must meet, infrastructure maturity, vendor dependencies, and migration timeline constraints. Each step has an informational tooltip explaining why the question matters. Your answers are auto-saved to localStorage so you can pause and resume — no account needed. The final step previews your risk tier before generating the full scored report.',
        deepLink: '/assess',
      },
      {
        question: 'What is the Entropy & Randomness module?',
        answer:
          'The Entropy & Randomness module covers the foundations of cryptographic randomness: entropy sources (hardware noise sources, OS entropy, QRNGs), NIST SP 800-90A deterministic random bit generators (DRBGs), SP 800-90B entropy-source validation and health tests, SP 800-90C RBG constructions, and the conditions under which combining sources adds assurance. Its workshops generate and check random bytes, walk through entropy-source validation, step through an HMAC_DRBG state machine, and health-test raw sources before conditioning. The module is especially relevant for teams deploying HSMs and PQC key generation at scale.',
        deepLink: '/learn/entropy-randomness',
      },
    ],
  },
]

/**
 * "Your three questions" — B+ remediation 4.1 (2026-08-10).
 *
 * The page already floats a persona's own Q&A to the top of its category
 * ("float, don't filter"), but a reader still meets twelve category headings
 * before the first thing they came for: "a researcher's first question is about
 * method, an executive's is about deadlines, a newcomer's is whether any of
 * this reaches them — and the page leads with none of the three."
 *
 * These are QUESTION STRINGS, not new content. Each one must match a question
 * already in `FAQ_DATA` verbatim; `faqData.test.ts` fails the build otherwise,
 * so this list can never drift into promising an answer the page does not have.
 * That constraint is deliberate — it makes the lead block a reordering of the
 * existing page rather than a second, divergent FAQ.
 */
export const PERSONA_FAQ_LEAD: Record<PersonaId, string[]> = {
  executive: [
    'What should executives know about quantum risk?',
    'When does NIST plan to deprecate classical algorithms?',
    'How do I build a PQC business case for the board?',
  ],
  grc: [
    'What does the Compliance Tracker show?',
    'What governance framework supports PQC migration?',
    'How do I assess vendor PQC readiness?',
  ],
  developer: [
    'What PQC libraries should developers use?',
    'How does ML-KEM change the TLS 1.3 handshake?',
    'When should I use ML-KEM vs ML-DSA vs SLH-DSA?',
  ],
  architect: [
    'How should architects design for PQC?',
    'What is a hybrid cryptographic approach?',
    'How does Zero Trust architecture change with PQC?',
  ],
  researcher: [
    // Method first — the researcher's actual first question, and the one the
    // page previously answered twelfth if at all.
    'What PQC research areas are active?',
    'What are the four FIPS standards for PQC?',
    'Is PQC Today open source?',
  ],
  'cert-engineer': [
    'What is FIPS 140-3 and why does the validation backlog matter?',
    "What is Common Criteria's role in PQC?",
    'What HSMs support ML-KEM and ML-DSA?',
  ],
  ops: [
    'What PQC operations tasks should IT teams plan?',
    'What HSMs support ML-KEM and ML-DSA?',
    'How do you configure PQC TLS on Linux?',
  ],
  curious: [
    "Where should I start if I'm new to PQC?",
    'What is post-quantum cryptography (PQC)?',
    'What is a "Harvest Now, Decrypt Later" (HNDL) attack?',
  ],
}

/** The lead questions for a persona, resolved to their real FAQ items. Returns
 *  an empty array for no persona — a visitor we know nothing about gets the
 *  page in its natural order, which is the honest default. */
export function personaLeadItems(persona: PersonaId | null): FAQItem[] {
  if (!persona) return []
  // eslint-disable-next-line security/detect-object-injection -- typed PersonaId union
  const wanted = PERSONA_FAQ_LEAD[persona]
  const all = FAQ_DATA.flatMap((c) => c.items)
  return wanted
    .map((q) => all.find((item) => item.question === q))
    .filter((item): item is FAQItem => item !== undefined)
}
