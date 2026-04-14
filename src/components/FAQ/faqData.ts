// SPDX-License-Identifier: GPL-3.0-only

export interface FAQItem {
  question: string
  answer: string
  deepLink: string
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
          'FN-DSA (FFT over NTRU-Lattice-Based Digital Signature Algorithm), formerly known as Falcon, is expected to be standardized as FIPS 206 in 2025. It produces more compact signatures than ML-DSA, making it attractive for bandwidth-constrained environments like smart cards, though its implementation is more complex due to floating-point arithmetic. The Algorithms page compares FN-DSA-512 and FN-DSA-1024 parameters.',
        deepLink: '/algorithms?highlight=fn-dsa',
      },
      {
        question: 'What is a hybrid cryptographic approach?',
        answer:
          'A hybrid cryptographic approach combines a classical algorithm (such as ECDH or RSA) with a post-quantum algorithm (such as ML-KEM) so that the combined scheme remains secure as long as either algorithm is unbroken. This hedging strategy is recommended by ANSSI, BSI, and other agencies during the transition period while confidence in PQC algorithms matures. The Hybrid Crypto module covers composite certificates, dual key exchange, and deployment patterns.',
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
          'NIST defines five security levels for PQC algorithms: Level 1 targets at least AES-128 equivalent security, Level 2 targets SHA-256 collision resistance, Level 3 targets AES-192, Level 4 targets SHA-384, and Level 5 targets AES-256. Most deployments use Level 1 (ML-KEM-512, ML-DSA-44) or Level 3 (ML-KEM-768, ML-DSA-65) to balance security and performance. The Algorithms page maps each algorithm variant to its security level and includes side-by-side performance benchmarks that compare each PQC algorithm directly against its classical counterpart (e.g., ML-KEM-768 versus X25519, ML-DSA-65 versus ECDSA P-256).',
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
          "Shor's algorithm can factor large integers and compute discrete logarithms in polynomial time on a quantum computer, directly breaking RSA and elliptic curve cryptography. Grover's algorithm, the best known quantum attack on symmetric ciphers, only provides a quadratic speedup — halving the effective key length — so AES-256 retains 128-bit security even against a quantum adversary. The Quantum Threats module illustrates these attack complexities side by side.",
        deepLink: '/learn/quantum-threats',
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
          "A Cryptographically Relevant Quantum Computer (CRQC) is a quantum computer capable of running Shor's algorithm against production key sizes, requiring on the order of thousands of stable logical qubits. Expert estimates for a CRQC range from the early 2030s to beyond 2040, with a rough consensus of 15 to 20 years from now, though breakthroughs could accelerate this. The Threats dashboard tracks expert timeline estimates and updated forecasts.",
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
          "Grover's algorithm provides a quadratic speedup for brute-force search, effectively halving the security level of symmetric ciphers — AES-128 drops to 64-bit security and AES-256 drops to 128-bit security. Because 128-bit security remains computationally infeasible, AES-256 is considered quantum-safe, while AES-128 may need to be phased out for high-security applications. The Quantum Threats module visualizes these security reductions.",
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
          'The Threats dashboard covers 12 or more industries, each with detailed threat criticality levels, HNDL and HNFL risk assessments, and actionable mitigation strategies. Industries include financial services, healthcare, government, telecom, energy, automotive, aerospace, and more. The dashboard allows filtering by industry to see sector-specific threat profiles and compliance requirements.',
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
          'NIST has published three PQC FIPS standards and is finalizing a fourth: FIPS 203 (ML-KEM, lattice-based key encapsulation), FIPS 204 (ML-DSA, lattice-based digital signatures), FIPS 205 (SLH-DSA, stateless hash-based signatures), and the forthcoming FIPS 206 (FN-DSA, NTRU-lattice signatures). FIPS 203, 204, and 205 were all published in August 2024. The Reference Library has the full text and cross-references for each standard.',
        deepLink: '/library',
      },
      {
        question: 'What is NIST IR 8547?',
        answer:
          'NIST IR 8547 (Interagency Report) provides transition guidance for migrating federal cryptographic systems to post-quantum algorithms, recommending that classical algorithms like RSA and ECDSA be deprecated by 2030 and disallowed by 2035. It serves as the authoritative US government transition timeline and complements the FIPS algorithm standards. The Reference Library links to the full document with implementation details.',
        deepLink: '/library?ref=NIST-IR-8547',
      },
      {
        question: 'What is CNSA 2.0?',
        answer:
          'CNSA 2.0 (Commercial National Security Algorithm Suite 2.0) is NSA guidance for protecting national security systems, mandating ML-KEM and ML-DSA adoption by 2025 and the complete disallowance of all classical public-key algorithms by 2033. It is more aggressive than civilian timelines and applies to defense, intelligence, and classified environments. The Compliance Tracker shows CNSA 2.0 milestones alongside other frameworks.',
        deepLink: '/compliance',
      },
      {
        question: 'What is SP 800-208?',
        answer:
          'NIST Special Publication 800-208 standardizes the use of LMS (Leighton-Micali Signature) and XMSS (eXtended Merkle Signature Scheme) stateful hash-based signature algorithms. These schemes are suitable for firmware signing and other use cases where the signer can reliably maintain state to prevent key reuse. The Reference Library provides the full SP 800-208 text and related implementation guidance.',
        deepLink: '/library',
      },
      {
        question: 'What does RFC 9629 cover?',
        answer:
          'RFC 9629 specifies how to use post-quantum algorithms within the Cryptographic Message Syntax (CMS), enabling PQC-protected S/MIME email encryption and digital signatures. It defines algorithm identifiers and encoding rules for ML-KEM and ML-DSA within the existing CMS framework. The Reference Library includes this RFC alongside related email security standards.',
        deepLink: '/library',
      },
      {
        question: 'What is ETSI TS 103 744?',
        answer:
          'ETSI TS 103 744 is a European Telecommunications Standards Institute specification providing migration guidance for adopting post-quantum cryptography in telecom networks. It addresses the specific challenges of network function virtualization, 5G infrastructure, and subscriber identity protection during the PQC transition. The Reference Library catalogs this alongside other ETSI PQC publications.',
        deepLink: '/library',
      },
      {
        question: 'What does BSI TR-02102 recommend?',
        answer:
          "BSI Technical Guideline TR-02102 is the German Federal Office for Information Security's cryptographic recommendations, which include PQC algorithm guidance and transition timelines for German government and critical infrastructure systems. It recommends hybrid classical-plus-PQC approaches during the transition and specifies minimum key sizes for each security level. The Reference Library provides the guideline alongside BSI's broader PQC program.",
        deepLink: '/library',
      },
      {
        question: 'What is the ANSSI PQC position?',
        answer:
          "France's ANSSI (Agence nationale de la securite des systemes d'information) requires hybrid classical-plus-PQC deployment for all lattice-based algorithms as a transitional security measure, reflecting caution about the maturity of lattice hardness assumptions. ANSSI has set some of the most aggressive European timelines, requiring PQC support in qualified products. The Reference Library links to ANSSI's published position papers and technical guidance.",
        deepLink: '/library',
      },
      {
        question: 'What is NIST CSWP 39?',
        answer:
          'NIST Cybersecurity White Paper 39 provides practical guidance for organizations preparing their migration to post-quantum cryptography, covering cryptographic inventory, risk assessment, and phased transition planning. It complements the FIPS algorithm standards by addressing organizational and operational readiness. The Reference Library includes CSWP 39 with cross-references to related NIST publications.',
        deepLink: '/library',
      },
      {
        question: 'What are RFC 9881 and RFC 9882?',
        answer:
          'RFC 9881 and RFC 9882 are IETF standards that define the algorithm identifiers and encoding rules for using ML-KEM and ML-DSA within CMS (Cryptographic Message Syntax), enabling their use in protocols like S/MIME, code signing, and timestamping. They provide the wire format and OID assignments needed for interoperability across implementations. The Reference Library catalogs these alongside the broader suite of PQC-related RFCs.',
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
          'According to NIST IR 8547, classical public-key algorithms such as RSA and ECDSA should be deprecated by 2030 and fully disallowed by 2035 in federal systems. This creates a clear 10-year window for organizations to complete their post-quantum migration. The Timeline view plots these milestones alongside country-specific deadlines.',
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
          "QUANTITY is a BSI-led initiative to deploy quantum-safe cryptography across German government infrastructure, covering both federal IT systems and critical infrastructure operators. The program coordinates with broader EU efforts and emphasizes hybrid deployment and crypto agility as transitional measures. The Timeline view shows Germany's milestone dates within the European context.",
        deepLink: '/timeline?country=Germany',
      },
      {
        question: 'What is the CNSA 2.0 exclusive phase deadline?',
        answer:
          'The CNSA 2.0 exclusive-use phase deadline is 2033, after which all classical public-key algorithms will be disallowed for national security systems — only post-quantum algorithms will be permitted. This is two years earlier than the NIST IR 8547 civilian disallowance date of 2035, reflecting the higher security posture required for classified systems. The Timeline view plots the CNSA 2.0 phases against civilian timelines.',
        deepLink: '/timeline',
      },
      {
        question: 'What web browsers support ML-KEM for TLS?',
        answer:
          'Chrome (since version 124), Microsoft Edge, and Firefox all support the X25519MLKEM768 hybrid key exchange in TLS 1.3, combining classical X25519 ECDH with ML-KEM-768 for post-quantum protection. Safari support is still pending as of early 2026. The Migrate catalog tracks browser PQC support alongside other infrastructure categories.',
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
        deepLink: '/compliance',
      },
      {
        question: "What is eIDAS 2.0's PQC requirement?",
        answer:
          'eIDAS 2.0 is the updated EU regulation governing electronic identification and trust services, including the European Digital Identity Wallet (EUDI Wallet). While it does not mandate specific PQC algorithms yet, it requires crypto agility and quantum-readiness in qualified trust services to ensure long-term signature validity. The Compliance Tracker details eIDAS 2.0 requirements alongside other EU frameworks.',
        deepLink: '/compliance',
      },
      {
        question: 'What is DORA and when did it take effect?',
        answer:
          'The Digital Operational Resilience Act (DORA) is an EU regulation that took effect in January 2025, requiring financial institutions to address ICT risk management including cryptographic resilience. DORA mandates that organizations assess and mitigate risks from emerging technologies, which includes the quantum computing threat to current encryption. The Compliance Tracker maps DORA requirements to PQC migration actions.',
        deepLink: '/compliance',
      },
      {
        question: 'What does NIS2 require for PQC?',
        answer:
          'The EU NIS2 Directive (Network and Information Security Directive 2) mandates comprehensive risk management for essential and important entities, requiring them to adopt appropriate and proportionate technical measures — which increasingly includes quantum-resilient cryptography. NIS2 applies to energy, transport, health, digital infrastructure, and other critical sectors. The Compliance Tracker shows how NIS2 intersects with PQC migration requirements.',
        deepLink: '/compliance',
      },
      {
        question: 'What is Executive Order 14306?',
        answer:
          'Executive Order 14306 directs US federal agencies to migrate their cryptographic systems to post-quantum algorithms, referencing NIST standards and establishing timelines for inventory, assessment, and migration. It builds on NSM-10 (National Security Memorandum 10) and mandates annual progress reporting by agency CISOs. The Compliance Tracker tracks the EO 14306 milestones and agency compliance status.',
        deepLink: '/compliance',
      },
      {
        question: "What is NERC-CIP's relevance to PQC?",
        answer:
          'NERC-CIP (North American Electric Reliability Corporation — Critical Infrastructure Protection) standards mandate security controls for the bulk electric system, including the protection of electronic security perimeters and communications. As quantum computing threatens the cryptographic foundations of these protections, NERC-CIP compliance will require PQC upgrades to encryption and authentication. The Compliance Tracker shows energy sector requirements.',
        deepLink: '/compliance',
      },
      {
        question: "What is Common Criteria's role in PQC?",
        answer:
          'Common Criteria (ISO/IEC 15408) is the international framework for evaluating IT product security, and the Common Criteria Recognition Arrangement (CCRA) enables mutual recognition across 31 member nations. Protection profiles for PQC-capable products are under development, and future evaluations will require demonstrating quantum resilience. The Compliance Tracker includes Common Criteria PQC developments.',
        deepLink: '/compliance',
      },
      {
        question: 'What is ISO/SAE 21434?',
        answer:
          'ISO/SAE 21434 is the international standard for automotive cybersecurity engineering, requiring threat analysis and risk assessment throughout the vehicle lifecycle including cryptographic components. It mandates crypto agility — the ability to update algorithms without hardware replacement — which is critical given 15-year vehicle lifetimes spanning the quantum transition. The Compliance Tracker maps ISO 21434 to PQC requirements.',
        deepLink: '/compliance',
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
          'The Migrate catalog covers seven infrastructure layers: cryptographic libraries, PKI and certificate authorities, network and VPN appliances, web servers and load balancers, cloud services and KMS, hardware security modules (HSMs), and application frameworks and SDKs. Each layer includes products with PQC readiness status and FIPS validation tiers. The catalog also tracks web browser PQC support as a separate category.',
        deepLink: '/migrate',
      },
      {
        question: 'What do the three FIPS badge tiers mean?',
        answer:
          'The Migrate catalog uses three FIPS badge tiers: Validated (green) means the product has achieved FIPS 140-3 certification with PQC algorithms; Partial (amber) means the vendor claims FIPS-mode operation, FedRAMP authorization, or WebTrust audit but full PQC validation is pending; No (gray) means no FIPS validation is available. The catalog shows these badges on every product entry.',
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
          'The PQC Risk Assessment is a 14-step wizard that evaluates your organization across dimensions including industry, country, cryptographic usage, data sensitivity, compliance requirements, migration readiness, infrastructure maturity, and vendor dependencies. It produces a scored report with risk categories, compliance gap analysis, and a prioritized migration roadmap. The report can be exported as a PDF.',
        deepLink: '/assess',
      },
      {
        question: 'What is a CBOM (Cryptography Bill of Materials)?',
        answer:
          'A Cryptography Bill of Materials (CBOM) is a machine-readable inventory of all cryptographic algorithms, keys, certificates, and protocols used in a system, typically formatted using the CycloneDX standard. It enables automated detection of quantum-vulnerable components and tracking of migration progress across an organization. The Crypto Agility module includes a CBOM scanning workshop.',
        deepLink: '/learn/crypto-agility',
      },
      {
        question: 'How many PQC-ready products does the catalog track?',
        answer:
          'The Migrate catalog tracks over 140 products across seven infrastructure layers, each assessed for PQC readiness with specific algorithm support details and FIPS validation status. Products range from open-source libraries like OpenSSL and liboqs to commercial HSMs and cloud services from AWS, Azure, and GCP. The catalog is regularly updated as vendors announce new PQC capabilities.',
        deepLink: '/migrate',
      },
      {
        question: 'Can the assessment report be exported as PDF?',
        answer:
          'Yes, the PQC Risk Assessment report can be printed or saved as a PDF directly from your browser, preserving the full compliance gap analysis, threat landscape visualization, and prioritized migration roadmap. The print layout includes a professional header with your assessment parameters and a methodology explanation. The report is designed for board-level and audit presentations.',
        deepLink: '/assess',
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
          'In a PQC TLS 1.3 handshake, the client includes an ML-KEM public key (or hybrid key share) in the ClientHello message, and the server encapsulates a shared secret in the ServerHello response. This adds approximately 1KB to the handshake compared to classical ECDH, primarily from the larger key and ciphertext sizes. The TLS Basics module includes a step-through handshake simulator comparing classical, hybrid, and pure PQC modes.',
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
          'For VPN and IPsec, ML-KEM provides post-quantum key exchange within IKEv2 (supported by strongSwan and other implementations), while ML-DSA provides PQC certificate authentication for tunnel endpoints. Hybrid modes combining classical and PQC algorithms are recommended during the transition to ensure backward compatibility and defense in depth. The VPN/SSH module covers configuration for strongSwan, WireGuard, and OpenVPN.',
        deepLink: '/learn/vpn-ssh-pqc',
      },
      {
        question: 'What OpenSSH version supports PQC?',
        answer:
          "OpenSSH 9.x introduced the sntrup761x25519-sha512 hybrid key exchange, which combines the NTRU Prime lattice-based KEM with classical X25519 ECDH. More recent OpenSSH development includes support for ML-KEM-768-based hybrid key exchange, aligning with NIST's standardized algorithms. The VPN/SSH module explains host key migration and client configuration for PQC.",
        deepLink: '/learn/vpn-ssh-pqc',
      },
      {
        question: 'How does S/MIME support PQC?',
        answer:
          'RFC 9629 defines how to use ML-KEM for key encapsulation and ML-DSA for digital signatures within the CMS framework that underpins S/MIME email security. Hybrid mode is especially important for email because archived messages must remain confidential for years or decades after encryption. The Email Signing module covers S/MIME PQC deployment and backward compatibility.',
        deepLink: '/learn/email-signing',
      },
      {
        question: 'What is the JWT size problem with PQC?',
        answer:
          'ML-DSA-65 digital signatures are approximately 3.3KB compared to only 256 bytes for an ECDSA P-256 signature, which causes JWT tokens signed with PQC algorithms to exceed many API gateway and HTTP header size limits. This impacts OAuth 2.0 flows, microservice authentication, and any system that passes signed tokens in HTTP headers. The API Security module explores mitigation strategies including token compression and reference tokens.',
        deepLink: '/learn/api-security-jwt',
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
          'Major HSM vendors including Thales (Luna), Entrust (nShield), Utimaco, and AWS CloudHSM have announced or delivered PQC algorithm support including ML-KEM and ML-DSA, with varying levels of FIPS 140-3 validation status. Some vendors offer firmware upgrades for existing hardware while others require new PQC-capable models. The Migrate catalog tracks HSM PQC support and FIPS validation status.',
        deepLink: '/migrate?layer=hsm',
      },
      {
        question: 'What is the OpenSSL provider architecture for PQC?',
        answer:
          'OpenSSL 3.x uses a loadable provider architecture where PQC algorithms can be added without modifying the core library — the OQS provider (oqsprovider) adds over 50 post-quantum algorithms to any OpenSSL 3.x installation. Applications using the EVP API automatically gain access to PQC algorithms when the provider is loaded. The OS PQC module covers provider configuration and system-wide crypto policy management.',
        deepLink: '/learn/os-pqc',
      },
      {
        question: 'How do you configure PQC TLS on Linux?',
        answer:
          'On RHEL and Fedora, the update-crypto-policies command can enable hybrid PQC cipher suites system-wide for all applications that use the system TLS libraries. On Debian and Ubuntu, GnuTLS priority strings in /etc/gnutls/config control the available cipher suites, while applications using OpenSSL can load the oqsprovider for PQC support. The OS PQC module provides configuration walkthroughs for each distribution.',
        deepLink: '/learn/os-pqc',
      },
      {
        question: "What is HashiCorp Vault's PQC migration path?",
        answer:
          "HashiCorp Vault's PQC migration involves upgrading the transit encryption engine to use ML-KEM for key wrapping, migrating auto-unseal integrations to PQC-capable KMS endpoints, and updating dynamic secret generation to issue PQC-algorithm certificates. The seal/unseal keys and shamir shares also need PQC-compatible encryption for long-term security. The Secrets Management module simulates a complete Vault PQC migration.",
        deepLink: '/learn/secrets-management-pqc',
      },
      {
        question: 'What database encryption changes need PQC?',
        answer:
          'Database encryption migration involves upgrading Transparent Data Encryption (TDE) master key wrapping from RSA to ML-KEM, migrating column-level encryption (CLE) to PQC-aware client libraries, and updating BYOK/HYOK key import workflows to use post-quantum key encapsulation. Queryable encryption schemes that depend on deterministic or order-preserving encryption face additional research challenges. The Database Encryption module walks through each layer.',
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
          'EMV payment systems face PQC challenges at multiple layers: card authentication schemes (SDA, DDA, CDA) need compact signatures where FN-DSA-512 is preferred for constrained smart card chips, DUKPT terminal key injection must migrate to ML-KEM, and tokenization services (Visa VTS, Mastercard MDES) need PQC-wrapped keys. The payment networks Visa, Mastercard, Amex, UnionPay, and Discover are each developing migration roadmaps. The EMV Payment module simulates these migration scenarios.',
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
        deepLink: '/learn/iot-ot-pqc',
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
          'The automotive industry must address PQC across V2X (Vehicle-to-Everything) PKI certificates, in-vehicle network authentication, and over-the-air software update signing, all complicated by 15-year vehicle lifetimes that span the quantum transition. ISO/SAE 21434 requires cryptographic agility, meaning vehicles must be capable of algorithm upgrades without hardware replacement. The Automotive module explores V2X PKI migration and ECU firmware signing.',
        deepLink: '/learn/automotive-pqc',
      },
      {
        question: 'What is the energy sector PQC migration?',
        answer:
          'The energy sector must migrate PQC across SCADA and ICS protocols (including DNP3 and IEC 61850 Secure Authentication), substation automation (IEC 62351), and grid management systems, while managing equipment lifecycles of 30 years or more. NERC-CIP compliance will increasingly require quantum-resilient cryptography for bulk electric system protection. The Energy and Utilities module covers the specific protocols and regulatory requirements.',
        deepLink: '/learn/energy-utilities-pqc',
      },
      {
        question: 'How does PQC protect AI systems?',
        answer:
          'AI systems need PQC protection across three primary vectors: model weight encryption protecting intellectual property in transit and at rest, federated learning channel security preventing model poisoning, and inference API authentication ensuring only authorized clients can access model endpoints. As AI models become high-value targets, the cryptographic infrastructure protecting them must be quantum-resilient. The AI Security module covers these threat vectors and migration approaches.',
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
          'PQC Today offers 50 interactive learning modules organized across nine tracks: Foundations, Protocols, Applications, Hardware Infrastructure, Software Infrastructure, Strategy, Industries, Executive, and Role Guides. Each module includes an introduction with glossary-linked terms, interactive workshop exercises, and knowledge assessment questions. Module durations range from 30 minutes to 120 minutes depending on complexity.',
        deepLink: '/learn',
      },
      {
        question: 'How does the PQC Risk Assessment work?',
        answer:
          'The PQC Risk Assessment is a 14-step wizard that evaluates your organization across industry context, country-specific regulations, cryptographic usage patterns, data sensitivity levels, compliance requirements, and infrastructure maturity. It produces a scored report with a risk classification (Critical, High, Moderate, or Low), compliance gap analysis, threat landscape visualization, and a prioritized migration roadmap. The report can be exported as a PDF for stakeholder presentations.',
        deepLink: '/assess',
      },
      {
        question: 'Is PQC Today open source?',
        answer:
          'Yes, PQC Today is fully open source under the GPL-3.0 license, with source code available on GitHub at pqctoday/pqc-timeline-app. Community contributions are welcome for new modules, data updates, and platform improvements. The codebase is a React SPA built with TypeScript, Vite, and Tailwind CSS.',
        deepLink: '/about',
      },
      {
        question: 'What is the PQC Reference Library?',
        answer:
          'The PQC Reference Library is a curated collection of over 375 standards, RFCs, research papers, and migration guides relevant to post-quantum cryptography, with cross-references linking related documents and enrichment metadata providing summaries and PQC relevance assessments. Documents are categorized by type, issuing organization, and relevance to specific algorithms and use cases. The Library supports full-text search and filtering.',
        deepLink: '/library',
      },
      {
        question: 'What does the Compliance Tracker show?',
        answer:
          'The Compliance Tracker aggregates PQC mandates and recommendations from NIST, ANSSI, BSI, NCSC, Common Criteria, and other regulatory bodies, showing framework timelines, deadline dates, and industry-specific requirements in a unified view. It scrapes authoritative sources daily and cross-references compliance frameworks with the Reference Library and Migration catalog. The tracker supports filtering by country, industry, and compliance framework.',
        deepLink: '/compliance',
      },
      {
        question: 'How does the PQC Assistant chatbot work?',
        answer:
          'The PQC Assistant is a RAG-powered (Retrieval-Augmented Generation) AI chatbot that searches over 6,500 content chunks aggregated from all 22 data sources in the application — including modules, standards, compliance frameworks, and enrichment data — to provide verified answers with source references and deep-links. It runs entirely client-side and does not send your questions to any external AI service. Answers include citations to specific modules, library entries, and compliance frameworks.',
        deepLink: '/about',
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
          'The Executive Quantum Impact module is a 30-minute briefing covering the Harvest Now Decrypt Later threat to corporate data, regulatory compliance deadlines (NIST 2030/2035, CNSA 2.0 2033, EU directives), budget implications of infrastructure-wide crypto migration, and board-level action items for starting a PQC program. It includes a risk assessment framework calibrated for business decision-makers rather than technical staff. The module provides a board-ready presentation template.',
        deepLink: '/learn/exec-quantum-impact',
      },
      {
        question: 'What PQC libraries should developers use?',
        answer:
          'The recommended PQC libraries depend on your language ecosystem: liboqs for C/C++, Bouncy Castle for Java, oqsprovider for OpenSSL-based applications, pqcrypto for Rust, and aws-lc (AWS LibCrypto) for AWS-integrated systems. For Python, oqs-python wraps liboqs, and for Go, the standard library is adding PQC support. The Developer Quantum Impact module compares these libraries across security level support, FIPS validation status, and API ergonomics.',
        deepLink: '/learn/dev-quantum-impact',
      },
      {
        question: 'How should architects design for PQC?',
        answer:
          'PQC-ready architecture requires crypto-agility patterns that abstract algorithm selection behind configuration, hybrid deployment strategies that combine classical and PQC algorithms during the transition, and infrastructure migration sequencing that prioritizes the highest-risk components. Architects should design for algorithm replaceability from day one rather than treating PQC as a drop-in replacement. The Architect module includes algorithm decision trees and reference architectures.',
        deepLink: '/learn/arch-quantum-impact',
      },
      {
        question: 'What PQC operations tasks should IT teams plan?',
        answer:
          'IT operations teams should plan for automated certificate rotation (PQC certificates may need more frequent rotation due to larger revocation lists), HSM firmware upgrades to support PKCS#11 v3.2 PQC mechanisms, system-wide crypto-policy updates via tools like update-crypto-policies, and monitoring dashboards to track algorithm deprecation across the infrastructure. The Operations module provides runbooks and automation templates.',
        deepLink: '/learn/ops-quantum-impact',
      },
      {
        question: 'What PQC research areas are active?',
        answer:
          'Active PQC research areas include tightening lattice security proofs (especially for ML-KEM and ML-DSA), developing side-channel-resistant implementations for constrained devices, exploring alternative paradigms such as multivariate, code-based, and isogeny-based cryptography, and integrating quantum random number generators (QRNG) for enhanced key generation. The Research module surveys the frontiers and open questions in post-quantum cryptography.',
        deepLink: '/learn/research-quantum-impact',
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
        question: 'What is the Migration Readiness Assessment?',
        answer:
          "The Migration Readiness Assessment is a 14-step wizard that evaluates your organization's PQC preparedness across industry context, regulatory exposure, cryptographic inventory maturity, data sensitivity classification, compliance framework alignment, and infrastructure readiness. It produces a scored report with four risk categories, a compliance gap matrix, a threat landscape visualization, and a prioritized list of action items. The report can be printed or saved as PDF.",
        deepLink: '/assess',
      },
      {
        question: 'What is the Entropy & Randomness module?',
        answer:
          'The Entropy & Randomness module covers the foundations of cryptographic randomness: entropy sources (hardware TRNGs, OS entropy pools, QRNGs), NIST SP 800-90A/B/C deterministic random bit generators (DRBGs), entropy testing and health checks, and strategies for combining sources for defense-in-depth. It includes interactive exercises for visualizing entropy collection, configuring DRBG parameters, and comparing TRNG versus QRNG output quality. The module is especially relevant for teams deploying HSMs and PQC key generation at scale.',
        deepLink: '/learn/entropy-randomness',
      },
    ],
  },
]
