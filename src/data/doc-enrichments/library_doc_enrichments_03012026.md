---
generated: 2026-03-01
collection: library
documents_processed: 195
---

## BIP-32

- **Reference ID**: BIP-32
- **Title**: BIP-32: Hierarchical Deterministic Wallets
- **Authors**: Pieter Wuille (Bitcoin Core)
- **Publication Date**: 2012-02-11
- **Last Updated**: 2021-10-05
- **Document Status**: Final
- **Main Topic**: Describes hierarchical deterministic (HD) wallets that allow partial sharing of wallet access and address derivation from a single seed without exposing private keys to webservers or secondary systems.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: None detected; Bodies: None detected
- **Leaders Contributions Mentioned**: Gregory Maxwell, Alan Reiner, Eric Lombrozo, Mike Caldwell
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: HMAC-SHA512, SHA-256, RIPEMD160, ECDSA, secp256k1
- **Infrastructure Layers**: Applications (wallet layer)
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected

---

## BIP-39

- **Reference ID**: BIP-39
- **Title**: BIP-39: Mnemonic Code for Generating Deterministic Keys
- **Authors**: Marek Palatinus; Pavol Rusnak; Aaron Voisine; Sean Bowe
- **Publication Date**: 2013-09-10
- **Last Updated**: 2021-10-05
- **Document Status**: Final
- **Main Topic**: Provides a method to convert random entropy into human-rememberable mnemonic sentences and derive binary seeds using PBKDF2-HMAC-SHA512, intended for use with BIP-32 and similar deterministic wallet implementations.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: None detected; Bodies: None detected
- **Leaders Contributions Mentioned**: Marek Palatinus, Pavol Rusnak, Aaron Voisine, Sean Bowe
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: PBKDF2, HMAC-SHA512, SHA-256, Wordlist standardization
- **Infrastructure Layers**: Applications (wallet layer)
- **Standardization Bodies**: SatoshiLabs (maintains SLIP-0044 coin type registry)
- **Compliance Frameworks Referenced**: None detected

---

## BIP-44

- **Reference ID**: BIP-44
- **Title**: BIP-44: Multi-Account Hierarchy for Deterministic Wallets
- **Authors**: Marek Palatinus; Pavol Rusnak
- **Publication Date**: 2014-04-24
- **Last Updated**: 2021-10-05
- **Document Status**: Final
- **Main Topic**: Establishes a 5-level BIP32 derivation hierarchy (purpose, coin type, account, change, address index) allowing wallets to manage multiple cryptocoins, multiple accounts, and separate internal/external address chains from a single master seed.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: None detected; Bodies: SatoshiLabs (maintains SLIP-0044 coin type registry)
- **Leaders Contributions Mentioned**: Marek Palatinus, Pavol Rusnak
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: BIP-32 key derivation, BIP-43 purpose scheme, hardened/public derivation
- **Infrastructure Layers**: Applications (wallet layer)
- **Standardization Bodies**: SatoshiLabs (SLIP-0044)
- **Compliance Frameworks Referenced**: None detected

---

## Bitcoin-BIP360-P2QRH

- **Reference ID**: Bitcoin-BIP360-P2QRH
- **Title**: Bitcoin BIP-360: Pay to Quantum Resistant Hash (P2QRH)
- **Authors**: Hunter Beast; Bitcoin Core Community
- **Publication Date**: 2024-06-01
- **Last Updated**: 2025-12-18
- **Document Status**: Draft
- **Main Topic**: BIP-360 defines Pay to Quantum Resistant Hash (P2QRH), a Bitcoin taproot-based output type designed to protect against quantum attacks by removing the quantum-vulnerable key-spend path and supporting quantum-resistant signatures via future opcode specifications.
- **PQC Algorithms Covered**: ML-DSA (CRYSTALS-Dilithium), SLH-DSA (SPHINCS+)
- **Quantum Threats Addressed**: Long-exposure attacks, CRQC, Shor's Algorithm
- **Migration Timeline Info**: Milestones: 2025-07-07 | BIP-360 revised to separate PQ signatures into future BIP | 2025-07-14 | Proposal under community discussion for implementation approach
- **Applicable Regions / Bodies**: Regions: None detected; Bodies: Bitcoin community (Delving Bitcoin forum)
- **Leaders Contributions Mentioned**: Ethan Heilman, Steven Roose, Pieter Wuille, Arik Sosman, Andrew Poelstra, Dr. Orlovsky, Murch, Conduition
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Bitcoin, P2QRH (Pay to Quantum Resistant Hash), P2TR (Pay to Taproot), P2TSH (Pay to Tap Script Hash), tapscript, SPHINCS (SLH-DSA), Lamport signatures, WOTS (Winternitz One-Time Signature)
- **Infrastructure Layers**: Bitcoin blockchain, taproot scripting system, witness stack, merkle tree structures
- **Standardization Bodies**: None detected (Bitcoin Improvement Proposals—BIP process, external PQC standards referenced conceptually)
- **Compliance Frameworks Referenced**: None detected

---

## Bitcoin-Whitepaper

- **Reference ID**: Bitcoin-Whitepaper
- **Title**: Bitcoin: A Peer-to-Peer Electronic Cash System
- **Authors**: Satoshi Nakamoto
- **Publication Date**: 2008-10-31
- **Last Updated**: 2008-10-31
- **Document Status**: Published
- **Main Topic**: Bitcoin: A Peer-to-Peer Electronic Cash System — the original whitepaper describing a decentralized digital currency using proof-of-work consensus and ECDSA digital signatures.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: None detected; Bodies: None detected
- **Leaders Contributions Mentioned**: Satoshi Nakamoto
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: ECDSA, SHA-256, Proof-of-Work, Merkle trees
- **Infrastructure Layers**: Blockchain, Peer-to-peer network
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected

---

## CA-B-Forum-Ballot-SMC013

- **Reference ID**: CA-B-Forum-Ballot-SMC013
- **Title**: CA/Browser Forum Ballot SMC013 - Enable PQC Algorithms for S/MIME
- **Authors**: CA/Browser Forum
- **Publication Date**: 2025-07-02
- **Last Updated**: 2025-08-22
- **Document Status**: Adopted
- **Main Topic**: Introduces post-quantum cryptography algorithms ML-DSA and ML-KEM into the S/MIME Baseline Requirements to enable certificate issuers to issue single-key PQC certificates for experimentation without pre-quantum algorithm dependency.
- **PQC Algorithms Covered**: ML-DSA (Module-Lattice-Based Digital Signature Algorithm), ML-KEM (Module-Lattice-Based Key-Encapsulation Mechanism)
- **Quantum Threats Addressed**: Post-Quantum (implicit in context of PQC standardization)
- **Migration Timeline Info**: Milestones: Ballot adopted August 22, 2025 | Voting period completed with final adoption
- **Applicable Regions / Bodies**: Regions: United States (via NIST standards); Bodies: CA/Browser Forum, NIST, Mozilla, Microsoft, DigiCert, Sectigo, GlobalSign, IdenTrust, Asseco Data Systems SA (Certum), Disig, D-TRUST, eMudhra, HARICA, Logius PKIoverheid, MSC Trustgate Sdn Bhd, OISTE Foundation, SECOM Trust Systems, SSL.com, SwissSign, TWCA, VikingCloud, Actalis S.p.A., Carillon Information Security Inc., rundQuadrat
- **Leaders Contributions Mentioned**: Stephen Davidson (DigiCert - proposer), Andreas Henschel (D-Trust - endorser), Martijn Katerbarg (Sectigo - endorser), Client Wilson (Apple), Ashish Dhiman (GlobalSign)
- **PQC Products Mentioned**: None detected (ballot specifies algorithms, not specific products)
- **Protocols Covered**: S/MIME (Secure/Multipurpose Internet Mail Extensions)
- **Infrastructure Layers**: Certificate issuance and management, PKI/CA systems
- **Standardization Bodies**: NIST, CA/Browser Forum
- **Compliance Frameworks Referenced**: S/MIME Baseline Requirements v1.0.11, Federal Information Processing Standards (FIPS)

---

## CISA-PQC-CATEGORY-LIST-2026

- **Reference ID**: CISA-PQC-CATEGORY-LIST-2026
- **Title**: CISA PQC Product Category List (Updated per EO 14306)
- **Authors**: CISA/NSA
- **Publication Date**: 2025-12-01
- **Last Updated**: 2026-01-23
- **Document Status**: Published (Updated)
- **Main Topic**: CISA's response to Executive Order 14306 providing lists of product categories with widely available post-quantum cryptography standards for federal government acquisition, covering hardware and software that use ML-KEM and ML-DSA for encryption and authentication.
- **PQC Algorithms Covered**: ML-KEM (Module-Lattice-Based Key-Encapsulation Mechanism), ML-DSA (Module-Lattice-Based Digital Signature Algorithm), SLH-DSA (Stateless Hash-Based Digital Signature Algorithm), LMS (Leighton-Micali Signature Scheme), HMS (Hierarchical Merkle Signature Scheme), XMSS (eXtended Merkle Signature Scheme), XMSSMT (eXtended Merkle Signature Scheme with Multi-Tree)
- **Quantum Threats Addressed**: CRQC (Cryptographically Relevant Quantum Computer)
- **Migration Timeline Info**: Milestones: Executive Order 14306 issued June 6, 2025 | December 1, 2025 deadline for CISA to release product category lists | Federal agencies should plan acquisitions for PQC-capable products
- **Applicable Regions / Bodies**: Regions: United States; Bodies: CISA, NSA, NIST, General Services Administration (GSA), Federal Civilian Executive Branch (FCEB)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected (document lists product categories, not specific products)
- **Protocols Covered**: Key establishment, Digital signatures (cryptographic functions not specific protocols)
- **Infrastructure Layers**: Cloud Services (PaaS, IaaS, SaaS), Web Software, Endpoint Security, Networking Hardware/Software, Telecommunications Hardware, Computers (Physical/Virtual), Computer Peripherals, Storage Area Network, Identity/Credential/Access Management (ICAM), Collaboration Software, Data/Database, Enterprise Security
- **Standardization Bodies**: NIST, NSA, General Services Administration
- **Compliance Frameworks Referenced**: Executive Order 14306, NIST Internal Report (IR) 8547 (Transition to Post-Quantum Cryptography Standards), FIPS 203, FIPS 204, FIPS 205, NIST SP 800-208

---

## Canada CSE PQC Guidance

- **Reference ID**: Canada CSE PQC Guidance
- **Title**: Guidance on Post-Quantum Cryptography
- **Authors**: CCCS Canada
- **Publication Date**: 2023-09-01
- **Last Updated**: 2023-09-01
- **Document Status**: Guidance
- **Main Topic**: Canadian Centre for Cyber Security's roadmap for Government of Canada non-classified IT system migration to post-quantum cryptography, providing execution phases (Preparation, Identification, Transition), milestones, governance structure, and stakeholder roles through 2031–2035.
- **PQC Algorithms Covered**: NIST standardized PQC algorithms (reference to ITSP.40.111 for specific recommendations on UNCLASSIFIED, PROTECTED A, PROTECTED B information)
- **Quantum Threats Addressed**: HNDL (Harvest Now, Decrypt Later), Post-Quantum (quantum computing threat)
- **Migration Timeline Info**: Milestones: Preparation phase initiated | April 2026: Develop initial departmental PQC migration plan | April 2026 onwards: Annual reporting on progress | End of 2031: Completion of high priority systems migration | End of 2035: Completion of remaining systems migration
- **Applicable Regions / Bodies**: Regions: Canada; Bodies: Canadian Centre for Cyber Security (Cyber Centre), Treasury Board of Canada Secretariat (TBS), Shared Services Canada (SSC), Communications Security Establishment Canada, IT Security Tripartite, GC Enterprise Architecture Review Board (GC EARB)
- **Leaders Contributions Mentioned**: None detected (guidance document with organizational roles, not individuals)
- **PQC Products Mentioned**: None detected (guidance focused on migration methodology, not specific products)
- **Protocols Covered**: Network security protocols (referenced as ITSP.40.062), TLS, VPN, SSH
- **Infrastructure Layers**: Network services, Operating systems, Applications, Development pipelines, Physical IT assets (servers, desktops, laptops, mobile devices), Network appliances, Printers, VoIP telephony, Hardware security modules, Smart cards, Hardware tokens, Cloud services, On-premises hosting
- **Standardization Bodies**: NIST, Canadian Centre for Cyber Security
- **Compliance Frameworks Referenced**: Cryptographic algorithms for UNCLASSIFIED, PROTECTED A, PROTECTED B information (ITSP.40.111), Guidance on securely configuring network protocols (ITSP.40.062), Canada's National Quantum Strategy (NQS), Government of Canada's Enterprise Cyber Security Strategy (2024), Policy on Service and Digital (TBS), Treasury Board Framework for Management of Compliance, IT security risk management (ITSG-33), Baseline security requirements for network security zones (ITSP.80.022)

---

## Cloudflare-MTC-Blog

- **Reference ID**: Cloudflare-MTC-Blog
- **Title**: Keeping the Internet fast and secure: introducing Merkle Tree Certificates
- **Authors**: Cloudflare Research
- **Publication Date**: 2025-10-01
- **Last Updated**: 2025-10-01
- **Document Status**: Published
- **Main Topic**: Cloudflare's announcement of Merkle Tree Certificates (MTCs) proposal to redesign the Web Public-Key Infrastructure (WebPKI) enabling smooth transition to post-quantum authentication through reduction of signatures and public keys in TLS handshakes, with experimental deployment planned in collaboration with Chrome.
- **PQC Algorithms Covered**: ML-DSA-44 (Module-Lattice-Based Digital Signature Algorithm, 44-bit variant), ECDSA (ECDSA-P256, non-PQ for comparison)
- **Quantum Threats Addressed**: HNDL (Harvest Now, Decrypt Later), Q-day (arrival of cryptographically relevant quantum computer)
- **Migration Timeline Info**: Milestones: October 28, 2025 — Blog post publication | Experimental deployment planned early next year (2026) | About 50% of Cloudflare traffic already protected against HNDL threat
- **Applicable Regions / Bodies**: Regions: Global; Bodies: Cloudflare, Google Chrome Security, IETF (Internet Engineering Task Force), Certificate Transparency ecosystem
- **Leaders Contributions Mentioned**: Luke Valenta, Christopher Patton, Vânia Gonçalves, Bas Westerbaan (Cloudflare authors), Maximilian Pohl, Mia Celeste (early MTC draft implementation)
- **PQC Products Mentioned**: Cloudflare 1.1.1.1 (encrypted DNS resolver), Cloudflare One (SASE platform with post-quantum encryption), Chrome browser (implementing MTC support)
- **Protocols Covered**: TLS (Transport Layer Security), TLS 1.3, Certificate Transparency (CT), WebPKI (Web Public-Key Infrastructure), ECDH, X25519
- **Infrastructure Layers**: TLS handshake/authentication, Certificate authorities, PKI/CA systems, Web servers, DNS infrastructure, End-user clients (browsers)
- **Standardization Bodies**: NIST, IETF
- **Compliance Frameworks Referenced**: IETF (PLANTS mailing list for MTC discussion), CA/Browser Forum certificate policy (CT log requirements), Browser trust store policies (Firefox, Chrome, Safari)

---

## Cloudflare-PQ-Internet-2025

- **Reference ID**: Cloudflare-PQ-Internet-2025
- **Title**: State of the Post-Quantum Internet in 2025
- **Authors**: Cloudflare Research
- **Publication Date**: 2025-12-01
- **Last Updated**: 2025-12-01
- **Document Status**: Published
- **Quality Gate**: ACTUAL CONTENT (comprehensive technical blog post on post-quantum cryptography deployment and state of adoption)
- **Main Topic**: Comprehensive analysis of post-quantum cryptography adoption milestones, quantum threat progression, and migration challenges across the Internet as of October 2025, covering both key agreement and signature schemes.
- **PQC Algorithms Covered**: ML-KEM (CRYSTALS-Kyber), ML-DSA (Dilithium), SLH-DSA (SPHINCS+), FN-DSA (Falcon), HQC, MAYO, SNOVA, UOV, SQISign, X25519MLKEM768 (hybrid)
- **Quantum Threats Addressed**: CRQC (Harvest-now/decrypt-later, store-now/decrypt-later attacks), Shor's Algorithm (RSA/ECC breaking), Grover's Algorithm (symmetric key impact discussed and dismissed as impractical)
- **Migration Timeline Info**: Milestones: 2016 | NIST PQC competition launched; 2022 | NIST selects first four schemes (ML-KEM, ML-DSA, SLH-DSA); 2024 | NIST standards finalized (FIPS 203/204/205); March 2024 | Chrome enables PQ by default on Desktop; August 2024 | Go enables PQ by default; October 2025 | 50% of human traffic uses PQ key agreement; 2030–2035 | Global regulatory deadlines (NSA CNSA 2.0 2030-2033, Australia 2030, EU 2030/2035, UK 2035); 2027 | First broad post-quantum certificates expected; 2028+ | Onramp signature schemes standardization expected
- **Applicable Regions / Bodies**: Regions: US, EU, UK, Australia, France, Switzerland, Netherlands, Belgium, Germany, Canada, China; Bodies: NIST, NSA, IETF, CISA, Cloudflare, Google, OpenSSL, Apple, Mozilla, Microsoft
- **Leaders Contributions Mentioned**: Vitalik Buterin (no), Bas Westerbaan (Cloudflare author), Craig Gidney (quantum software optimization breakthrough), Yilei Chen (lattice algorithm), Samuel Jaques (University of Waterloo), Eric Rescorla (TLS 1.3 editor), Jan Schaumann (domain scans)
- **PQC Products Mentioned**: Cloudflare (PQ support enabled), Google (Chrome browser, Willow quantum computer), OpenSSL, Go, Apple iOS/iPadOS/macOS, Mozilla Firefox, Microsoft (topological qubits Majorana 1 chip), QuEra (neutral atoms), Quantinuum (trapped ions), Caddy, Fastly, Squarespace, Amazon, Hetzner, OVHcloud, WARP client, Cloudflare Tunnel
- **Protocols Covered**: TLS 1.3, TLS handshake, X25519MLKEM768 hybrid, IPsec, DNSSEC, QUIC, Wireguard, ClientHello
- **Infrastructure Layers**: Key agreement (X25519, ML-KEM), Symmetric encryption (AES-GCM), Signature schemes (RSA, ECDSA, ML-DSA, SLH-DSA), Certificate authorities, Web browsers, TLS stacks, Origin servers, Internal connections, VPN (WARP)
- **Standardization Bodies**: NIST (US), NSA (US), IETF, CA/Browser Forum, Root Programs, Cloudflare
- **Compliance Frameworks Referenced**: NIST PQC security levels (1-5), FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), CNSA 2.0 (NSA guidelines), Global Risk Institute surveys, Q-day projections (expert consensus 15-20+ years with >50% probability)

---

## EIP-155

- **Reference ID**: EIP-155
- **Title**: EIP-155: Simple Replay Attack Protection
- **Authors**: Vitalik Buterin
- **Publication Date**: 2016-10-14
- **Last Updated**: 2016-10-14
- **Document Status**: Final
- **Quality Gate**: ACTUAL CONTENT (Ethereum technical standard specification for replay attack protection)
- **Main Topic**: Ethereum Improvement Proposal defining simple replay attack protection mechanism using chain ID encoding in transaction signatures for the Spurious Dragon hard fork.
- **PQC Algorithms Covered**: None detected (uses secp256k1 ECDSA, not post-quantum)
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Milestones: 2016 | Hard fork BLKNUM 2,675,000; Fork name: Spurious Dragon
- **Applicable Regions / Bodies**: Regions: None specific; Bodies: Ethereum community, Vitalik Buterin (author)
- **Leaders Contributions Mentioned**: Vitalik Buterin (author/creator)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Ethereum transaction signing, secp256k1 ECDSA signature (v, r, s components), RLP encoding
- **Infrastructure Layers**: Blockchain layer (Ethereum), transaction signing layer
- **Standardization Bodies**: Ethereum Improvement Proposals (EIP), Ethereum community
- **Compliance Frameworks Referenced**: None detected

---

## EIP-55

- **Reference ID**: EIP-55
- **Title**: EIP-55: Mixed-case Checksum Address Encoding
- **Authors**: Vitalik Buterin
- **Publication Date**: 2016-01-14
- **Last Updated**: 2016-01-14
- **Document Status**: Final
- **Quality Gate**: ACTUAL CONTENT (Ethereum technical standard specification for address checksum encoding)
- **Main Topic**: Ethereum Improvement Proposal defining mixed-case checksum address encoding using Keccak256 hashing to detect accidental address typos and prevent transaction errors.
- **PQC Algorithms Covered**: None detected (uses Keccak256 hash, not post-quantum)
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: None specific; Bodies: Ethereum community, Vitalik Buterin and Alex Van de Sande (authors)
- **Leaders Contributions Mentioned**: Vitalik Buterin, Alex Van de Sande (authors)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Ethereum address encoding, Keccak256 hashing, hexadecimal address representation
- **Infrastructure Layers**: Blockchain address layer (Ethereum)
- **Standardization Bodies**: Ethereum Improvement Proposals (EIP), Ethereum community
- **Compliance Frameworks Referenced**: None detected (mentions ICAP for comparison)

---

## ENISA PQC Guidelines

- **Reference ID**: ENISA PQC Guidelines
- **Title**: Post-Quantum Cryptography: Current State and Quantum Mitigation
- **Authors**: ENISA
- **Publication Date**: 2021-07-01
- **Last Updated**: 2024-12-01
- **Document Status**: Position Paper
- **Quality Gate**: ACTUAL CONTENT (ENISA official report on post-quantum cryptography standardization, algorithms, and mitigation strategies)
- **Main Topic**: ENISA report providing comprehensive overview of post-quantum cryptography standardization process, NIST Round 3 finalists for encryption and signature schemes, five families of PQC algorithms, and immediate mitigation recommendations via hybrid implementations and pre-shared key mixing.
- **PQC Algorithms Covered**: Code-based cryptography, Isogeny-based cryptography, Hash-based cryptography, Lattice-based cryptography, Multivariate-based cryptography (five main families); specific NIST Round 3 finalists mentioned but not detailed in provided excerpt
- **Quantum Threats Addressed**: Quantum capable attackers (quantum computers threatening public-key cryptography security)
- **Migration Timeline Info**: Milestones: February 2021 | First version published; May 2021 | Second version with Chapter 3 on Security Notions; NIST process ongoing for "several years" (as of 2021)
- **Applicable Regions / Bodies**: Regions: EU, Europe; Bodies: ENISA (European Union Agency for Cybersecurity), NIST
- **Leaders Contributions Mentioned**: None detected in excerpt
- **PQC Products Mentioned**: None detected in excerpt
- **Protocols Covered**: Public-key cryptography, hybrid implementations (pre-quantum + post-quantum scheme combinations), pre-shared key mixing
- **Infrastructure Layers**: Public-key encryption, Signature schemes, Data confidentiality protection
- **Standardization Bodies**: NIST, ENISA
- **Compliance Frameworks Referenced**: None detected

---

## EO-14306

- **Reference ID**: EO-14306
- **Title**: Executive Order 14306 — Sustaining Select Cybersecurity Efforts (PQC Provisions)
- **Authors**: White House
- **Publication Date**: 2025-06-06
- **Last Updated**: 2025-06-06
- **Document Status**: Executive Order
- **Quality Gate**: ACTUAL CONTENT (CISA press release on Executive Order 14306 requiring product categories list for post-quantum cryptography)
- **Main Topic**: CISA announcement of product categories list identifying hardware and software supporting post-quantum cryptography standards, issued pursuant to President Trump's Executive Order 14306 (June 6, 2025) to facilitate organizational PQC migration strategies.
- **PQC Algorithms Covered**: None detected (reference to generic "PQC standards" without specific algorithm names)
- **Quantum Threats Addressed**: CRQC (quantum computing threat to public-key cryptography, harvest-now/decrypt-later risks)
- **Migration Timeline Info**: Milestones: June 6, 2025 | President Trump issues Executive Order 14306; January 23, 2026 | CISA releases product categories list; Future | List to be regularly updated
- **Applicable Regions / Bodies**: Regions: US; Bodies: CISA (Cybersecurity and Infrastructure Security Agency), DHS (Department of Homeland Security), NSA (National Security Agency), White House, Critical Infrastructure operators, Organizations
- **Leaders Contributions Mentioned**: President Trump (Executive Order 14306), Madhu Gottumukkala (Acting Director of CISA)
- **PQC Products Mentioned**: Cloud services, Web software, Networking hardware and software, Endpoint security products (generic categories, no specific product names)
- **Protocols Covered**: Key establishment (secure encrypted communication), Digital signatures (authenticity and integrity assurance)
- **Infrastructure Layers**: Cloud services, Web applications, Networking layer, Endpoint security
- **Standardization Bodies**: CISA, NSA
- **Compliance Frameworks Referenced**: Executive Order 14306 (Presidential mandate), Post-Quantum Cryptography Initiative

---

## ETSI-GS-QKD-002

- **Reference ID**: ETSI-GS-QKD-002
- **Title**: ETSI GS QKD 002 - QKD Use Cases
- **Authors**: ETSI ISG QKD
- **Publication Date**: 2010-06-01
- **Last Updated**: 2024-01-01
- **Document Status**: Published
- **ACTUAL CONTENT**
- **Main Topic**: Describes QKD as a cryptographic security innovation and presents real-world use cases for quantum key distribution in enterprise and infrastructure networks.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: HNDL (implicit: information-theoretic security against eavesdropping), CRQC (quantum channel security)
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Europe; Bodies: ETSI, European telecommunications standardization
- **Leaders Contributions Mentioned**: C.H. Bennett, G. Brassard, Nicolas Gisin, Grégoire Ribordy, Wolfgang Tittel, Hugo Zbinden, Valerio Scarani, Helle Bechmann-Pasquinucci, Nicolas J. Cerf, Miloslav Dušek, Norbert Lütkenhaus, Momtchil Peev, D. Gottesman, H.-K. Lo, J. Preskill
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: BB84 (Bennett-Brassard 1984), prepare-and-measure protocols, entanglement-based protocols
- **Infrastructure Layers**: Data Link Layer (link encryption), Network Layer (backbone), Transport Layer, Application Layer (key distribution)
- **Standardization Bodies**: ETSI (European Telecommunications Standards Institute), ISG-QKD (Industry Specification Group)
- **Compliance Frameworks Referenced**: None detected

---

## ETSI-GS-QKD-003

- **Reference ID**: ETSI-GS-QKD-003
- **Title**: ETSI GS QKD 003 - Components and Internal Interfaces
- **Authors**: ETSI ISG QKD
- **Publication Date**: 2010-10-01
- **Last Updated**: 2024-01-01
- **Document Status**: Published
- **ACTUAL CONTENT**
- **Main Topic**: Technical specification defining QKD system components, internal interfaces, photon detectors, sources, and modulators for implementing discrete variable, entanglement-based, and continuous-variable QKD protocols.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Photon number splitting attack, eavesdropping (Eve), CRQC (quantum channel monitoring)
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Europe; Bodies: ETSI, ISG-QKD
- **Leaders Contributions Mentioned**: J. F. Dynes, N Gisin, A. Ekert, C. H. Bennett, G. Brassard, N. D. Mermin, J. Clauser, Fossier, Leverrier, Grangier, Dixon, Intallura
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: BB84, Mach-Zehnder implementations (one-way, send-and-return, phase-intensity), entanglement-based QKD, continuous-variable QKD, decoy-state protocols, CHSH-inequalities
- **Infrastructure Layers**: Photon sources, modulators, single-photon detectors, classical electronic systems, optical channels (fiber, free-space)
- **Standardization Bodies**: ETSI, ISG-QKD
- **Compliance Frameworks Referenced**: None detected

---

## ETSI-GS-QKD-004

- **Reference ID**: ETSI-GS-QKD-004
- **Title**: ETSI GS QKD 004 - Application Interface (V2.1.1)
- **Authors**: ETSI ISG QKD
- **Publication Date**: 2020-08-01
- **Last Updated**: 2020-08-01
- **Document Status**: Published
- **ACTUAL CONTENT**
- **Main Topic**: Specifies Application Programming Interface (API) for QKD key managers to deliver synchronized cryptographic keys to applications across QKD links and networks with configurable quality-of-service parameters.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Europe; Bodies: ETSI, ISG-QKD, OASIS (Open Standards initiative), IANA (Internet Assigned Numbers Authority)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: QKD key distribution and management, TLS/HTTPS for transport security, REST-based key delivery (ETSI GS QKD 014)
- **Infrastructure Layers**: Key management layer (distributed key manager architecture), QKD link-level and network-level management, application layer interfaces
- **Standardization Bodies**: ETSI, ISG-QKD, OASIS, IANA
- **Compliance Frameworks Referenced**: KMIP (Key Management Interoperability Protocol), TLS, HTTPS

---

## ETSI-GS-QKD-005

- **Reference ID**: ETSI-GS-QKD-005
- **Title**: ETSI GS QKD 005 - Security Proofs
- **Authors**: ETSI ISG QKD
- **Publication Date**: 2010-12-01
- **Last Updated**: 2024-01-01
- **Document Status**: Published
- **ACTUAL CONTENT**
- **Main Topic**: Defines framework and best practices for security proofs of QKD protocols, establishing rigorous criteria for demonstrating unconditional information-theoretic security and distinguishing between protocol-level and implementation-level security claims.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: HNDL (information-theoretic security), eavesdropping (Eve attacks), photon-number splitting attack, Trojan horse attacks, timing analysis attacks, power analysis attacks
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Europe; Bodies: ETSI, ISG-QKD
- **Leaders Contributions Mentioned**: Norbert Lütkenhaus, Hoi-Kwong Lo, Suhairi Saharudin, Md Yusof Zalhan, Momtchil Peev, Jean-Marc Merolla, Norziana Jamil, Valerio Scarani, Helle Bechmann-Pasquinucci, Nicolas J. Cerf, Miloslav Dušek, M. Peev
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: BB84, prepare-and-measure protocols, entanglement-based protocols, continuous-variable QKD, error correction (reconciliation), privacy amplification, authentication protocols
- **Infrastructure Layers**: Quantum channels (fiber, free-space), authenticated classical channels, random number generators, measurement and detection systems, post-processing and error correction
- **Standardization Bodies**: ETSI, ISG-QKD
- **Compliance Frameworks Referenced**: None detected

---

## ETSI-GS-QKD-008

- **Reference ID**: ETSI-GS-QKD-008
- **Title**: ETSI GS QKD 008 - QKD Module Security Specification
- **Authors**: ETSI ISG QKD
- **Publication Date**: 2010-12-01
- **Last Updated**: 2024-01-01
- **Document Status**: Published
- **ACTUAL CONTENT**
- **Main Topic**: Security specification for QKD modules establishing minimum requirements for physical security, cryptographic boundary protection, operator authentication, environmental failure detection, and critical security parameter management in QKD implementations.
- **PQC Algorithms Covered**: RSA (example), ECDSA (example), AES (example for classical crypto components)
- **Quantum Threats Addressed**: Physical tampering attacks, non-invasive attacks (timing analysis, power analysis, electromagnetic emanation), eavesdropping on optical channels, environmental failure attacks
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Europe; Bodies: ETSI, ISG-QKD, telecommunication systems operators
- **Leaders Contributions Mentioned**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: BB84 (example), approved security functions for cryptographic key management and authentication
- **Infrastructure Layers**: Physical module enclosure, cryptographic boundary, tamper detection circuits, environmental monitoring, operator interfaces, optical/quantum channels, classical electronics
- **Standardization Bodies**: ETSI, ISG-QKD
- **Compliance Frameworks Referenced**: FIPS (Federal Information Processing Standards) implicit through module certification methodology

---

## ETSI-GS-QKD-011

- **Reference ID**: ETSI-GS-QKD-011
- **Title**: ETSI GS QKD 011 - Component Characterization
- **Authors**: ETSI ISG QKD
- **Publication Date**: 2016-05-01
- **Last Updated**: 2024-01-01
- **Document Status**: Published
- **QUALITY GATE**: ACTUAL CONTENT (technical specification standard for QKD component characterization)
- **Main Topic**: ETSI specification for characterizing optical components in Quantum Key Distribution systems, including measurement procedures for weak laser pulse QKD transmitters and single-photon detectors.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected (focuses on technical characterization, not threat mitigation)
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Europe; Bodies: ETSI (European Telecommunications Standards Institute), QKD Industry Specification Group (ISG)
- **Leaders Contributions Mentioned**: None detected (contains authors but within ETSI ISG context, not named individuals)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Weak Laser Pulse QKD, Mach-Zehnder interferometer implementation, BB84 (referenced in QKD systems context)
- **Infrastructure Layers**: Quantum optical channel, optical fiber transmission, QKD transmitter/receiver components, synchronization channel
- **Standardization Bodies**: ETSI (European Telecommunications Standards Institute)
- **Compliance Frameworks Referenced**: ETSI standards, Common Criteria (implicit in QKD component certification context)

---

## ETSI-GS-QKD-012

- **Reference ID**: ETSI-GS-QKD-012
- **Title**: ETSI GS QKD 012 - Device and Communication Channel Parameters
- **Authors**: ETSI ISG QKD
- **Publication Date**: 2019-02-01
- **Last Updated**: 2024-01-01
- **Document Status**: Published
- **QUALITY GATE**: ACTUAL CONTENT (technical specification for QKD deployment parameters)
- **Main Topic**: Defines communication channels, architectures, and deployment parameters for Quantum Key Distribution systems over optical network infrastructure, including device and network parameter specifications for QKD deployment planning.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected (focuses on deployment architecture, not threat models)
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Europe; Bodies: ETSI (European Telecommunications Standards Institute), QKD Industry Specification Group (ISG)
- **Leaders Contributions Mentioned**: Romain Alléaume (Telecom ParisTech, IMT, France), Thomas Chapuran (Applied Communication Sciences, USA), Marco Lucamarini (Toshiba Research Europe Limited, UK), Vicente Martin (University Politécnica de Madrid, Spain), Alan Mink (Applied Communication Sciences - Vencore Labs, USA), Huub van Helvoort (Qunion, Korea), Martin Ward (Toshiba Research Europe Limited, UK)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: BB84 (referenced), QKD protocols (generic), quantum key distribution protocols
- **Infrastructure Layers**: Optical fiber networks, quantum channel, synchronization channel, distillation channel (classical), dedicated links, multiplexed architectures, WDM (Wavelength Division Multiplexing)
- **Standardization Bodies**: ETSI (European Telecommunications Standards Institute)
- **Compliance Frameworks Referenced**: ETSI standards, network infrastructure standards

---

## ETSI-GS-QKD-014

- **Reference ID**: ETSI-GS-QKD-014
- **Title**: ETSI GS QKD 014 - Protocol and Data Format for REST-based Key Delivery API
- **Authors**: ETSI ISG QKD
- **Publication Date**: 2019-02-01
- **Last Updated**: 2024-01-01
- **Document Status**: Published
- **QUALITY GATE**: ACTUAL CONTENT (technical specification for QKD REST-based API)
- **Main Topic**: Specifies a REST-based API protocol and JSON data format for delivering cryptographic keys from Quantum Key Distribution networks to applications, designed for interoperability across different vendor equipment.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected (focuses on key delivery mechanism, not threat mitigation)
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Europe; Bodies: ETSI (European Telecommunications Standards Institute), QKD Industry Specification Group (ISG)
- **Leaders Contributions Mentioned**: Yoshimichi Tanizawa (Toshiba), Martin Ward (Toshiba), Hideaki Sato (Toshiba), Vicente Martin Ayuso (Universidad Politécnica de Madrid), Alejandro Aguado (Universidad Politécnica de Madrid), Oliver Maurhart (Austrian Institute of Technology GmbH), Alan Mink (Applied Communication Sciences - Vencore Labs, Inc.), Norbert Lutkenhaus (University of Waterloo), Momtchil Peev (Huawei Technologies), Bruno Huttner (ID Quantique SA), Catherine White (British Telecommunications plc), Graham Wallace (Senetas Europe Limited), Joo Cho (ADVA Optical Networking SE)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: REST API, HTTPS, TLS 1.2/1.3, JSON data format, HTTP/1.1, QKD key delivery protocols
- **Infrastructure Layers**: Application layer, QKD network, trusted nodes, Key Management Entities (KME), Secure Application Entities (SAE), QKD links, key delivery infrastructure
- **Standardization Bodies**: ETSI (European Telecommunications Standards Institute), IETF (Internet Engineering Task Force)
- **Compliance Frameworks Referenced**: ETSI GS QKD 004 (Application Interface standard), HTTPS/TLS security protocols

---

## ETSI-GS-QKD-015

- **Reference ID**: ETSI-GS-QKD-015
- **Title**: ETSI GS QKD 015 - Control Interface for Software Defined Networks
- **Authors**: ETSI ISG QKD
- **Publication Date**: 2021-03-01
- **Last Updated**: 2024-01-01
- **Document Status**: Published
- **QUALITY GATE**: ACTUAL CONTENT (technical specification for Software-Defined QKD control interface)
- **Main Topic**: Defines management interfaces for integrating Quantum Key Distribution systems into Software-Defined Networking (SDN) architectures, including YANG data models and workflows for centralized QKD resource orchestration and control.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected (focuses on SDN management, not threat models)
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Europe; Bodies: ETSI (European Telecommunications Standards Institute), QKD Industry Specification Group (ISG)
- **Leaders Contributions Mentioned**: None detected (document version history reflects contributors but specific names not listed)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: YANG data modeling language, NETCONF (Network Configuration Protocol), RESTCONF, SDN control protocols, QKD protocols
- **Infrastructure Layers**: SDN controller, QKD nodes, optical network (classical channels), quantum channels, trusted nodes, key management system, QKD applications, QKD interfaces, optical switches, SDN agents
- **Standardization Bodies**: ETSI (European Telecommunications Standards Institute), IETF (Internet Engineering Task Force)
- **Compliance Frameworks Referenced**: IETF RFC 6020 (YANG), IETF RFC 7950 (YANG 1.1), IETF RFC 6241 (NETCONF), IETF RFC 8040 (RESTCONF)

---

## ETSI-GS-QKD-016

- **Reference ID**: ETSI-GS-QKD-016
- **Title**: ETSI GS QKD 016 - Orchestration Interface of Software Defined Networks
- **Authors**: ETSI ISG QKD
- **Publication Date**: 2023-09-01
- **Last Updated**: 2024-01-01
- **Document Status**: Published
- **QUALITY GATE**: ACTUAL CONTENT (technical specification for QKD Common Criteria Protection Profile)
- **Main Topic**: Defines Common Criteria Protection Profile for a pair of Prepare-and-Measure Quantum Key Distribution modules, specifying security requirements, threat models, and conformance claims for QKD devices.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Eavesdropping (T.QKDEave), Manipulation of QKD link data (T.QKDMani), Session hijacking/piggybacking (T.Session), Unauthorized access (T.ServAcc), Exploitation of TOE malfunction (T.ExplMal), Observation of TSF characteristics (T.Observe)
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Europe; Bodies: ETSI (European Telecommunications Standards Institute), QKD Industry Specification Group (ISG), Common Criteria community
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Prepare-and-Measure QKD protocols, Common Criteria evaluation protocols
- **Infrastructure Layers**: QKD modules, quantum channel, trusted nodes, QKD endpoints, security perimeter, cryptographic boundary
- **Standardization Bodies**: ETSI (European Telecommunications Standards Institute), Common Criteria
- **Compliance Frameworks Referenced**: Common Criteria for Information Technology Security Evaluation, ETSI standards for QKD

---

## ETSI-GS-QKD-018

- **Reference ID**: ETSI-GS-QKD-018
- **Title**: ETSI GS QKD 018 - Orchestration Interface of Software Defined Networks
- **Authors**: ETSI ISG QKD
- **Publication Date**: 2022-04-01
- **Last Updated**: 2022-04-01
- **Document Status**: Published
- **Main Topic**: Specification of SDN orchestration interface for QKD networks, defining information models and workflows for resource management, configuration, performance management, and multi-domain QKD network operations.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected (focuses on QKD deployment and orchestration, not post-quantum cryptography)
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: None detected; Bodies: ETSI (European Telecommunications Standards Institute)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: NETCONF (Network Configuration Protocol), RESTCONF, YANG data modeling, QKD protocols
- **Infrastructure Layers**: SDN controllers, SDN orchestrators, QKD nodes, QKD modules, QKD links, Key Management Entities (KMEs), Secure Application Entities (SAEs), Optical Transport Networks (OTN)
- **Standardization Bodies**: ETSI (Industry Specification Group on QKD), IETF (RFC references)
- **Compliance Frameworks Referenced**: FCAPS management (Fault-management, Configuration, Accounting, Performance, and Security), Quality of Service (QoS) constraints

---

## ETSI-TS-104-015

- **Reference ID**: ETSI-TS-104-015
- **Title**: Efficient Quantum-Safe Hybrid Key Exchanges with Hidden Access Policies (Covercrypt)
- **Authors**: ETSI
- **Publication Date**: 2025-02-01
- **Last Updated**: 2025-02-01
- **Document Status**: Published Technical Specification
- **Main Topic**: Technical specification for Quantum-Safe Cryptography using efficient quantum-safe hybrid key exchanges with hidden access policies (Covercrypt), combining pre-quantum and post-quantum security through hybridization with attribute-based encryption features.
- **PQC Algorithms Covered**: ML-KEM (Module-Lattice-Based Key-Encapsulation Mechanism), Learning With Errors (LWE), Elliptic curves (P-256, P-384, P-521, Curve25519, Curve448)
- **Quantum Threats Addressed**: Post-Quantum, Learning With Errors (LWE), Computational Diffie-Hellman (CDH)
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: None detected; Bodies: ETSI (Technical Committee Cyber Security)
- **Leaders Contributions Mentioned**: Théophile Brézot, Paola de Perthuis, David Pointcheval
- **PQC Products Mentioned**: Covercrypt implementation
- **Protocols Covered**: Key Encapsulation Mechanisms (KEMs), Attribute-Based Encryption (ABE), Non-Interactive Key Exchange (NIKE), Ciphertext-Policy ABE
- **Infrastructure Layers**: Access control systems, cryptographic key management, encryption/decryption operations
- **Standardization Bodies**: ETSI, NIST (referenced standards), IETF (RFC references)
- **Compliance Frameworks Referenced**: FIPS PUB 180-4, FIPS PUB 202, FIPS PUB 203 (Module-Lattice-Based Key-Encapsulation Mechanism Standard), NIST SP800-185, NIST SP 800-186

---

## ETSI TR 103 619

- **Reference ID**: ETSI TR 103 619
- **Title**: Migration Strategies and Recommendations for Quantum-Safe Schemes
- **Authors**: ETSI QSC
- **Publication Date**: 2020-07-01
- **Last Updated**: 2020-07-01
- **Document Status**: Published Technical Report
- **Main Topic**: Technical report providing migration strategies and recommendations for transitioning from classical cryptography to quantum-safe cryptography schemes, covering a staged approach with inventory compilation, migration planning, and execution.
- **PQC Algorithms Covered**: None explicitly named (references quantum-safe cryptography generally, RSA, ECC, Identity Based Encryption)
- **Quantum Threats Addressed**: HNDL (Harvest Now, Decrypt Later), Shor's Algorithm, Grover's Algorithm
- **Migration Timeline Info**: Milestones: Orderly, planned migration (versus emergency migration) | X + Y + T > Z decision framework (where X=protection duration needed, Y=migration time, T=trust development time, Z=time to break with quantum computers)
- **Applicable Regions / Bodies**: Regions: EU (European Union context); Bodies: ETSI (Technical Committee Cyber Security), ISO/IEC (International Standards)
- **Leaders Contributions Mentioned**: Bob Blakley (CITI Group)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS (Transport Layer Security), VPN (Virtual Private Networks), IPSec, SSH, PKI (Public Key Infrastructure), HSM (Hardware Security Module) operations
- **Infrastructure Layers**: PKI systems, Key Management Systems (KMS), Certificate Authorities (CAs), Hardware Security Modules (HSM), Trusted Platform Module (TPM), Trust anchors, Root of Trust (RTV, RTS, RTM, RTR)
- **Standardization Bodies**: ETSI, ISO/IEC, IETF, ITU-T (Recommendation X.509), Trusted Computing Group (TCG)
- **Compliance Frameworks Referenced**: X.509 certificate framework, TPM specifications (ISO/IEC 11889 parts 1-4), XACML (eXtensible Access Control Markup Language)

---

## ETSI TS 103 744

- **Reference ID**: ETSI TS 103 744
- **Title**: Quantum-Safe Hybrid Key Exchanges
- **Authors**: ETSI QSC
- **Publication Date**: 2023-02-01
- **Last Updated**: 2025-03-01
- **Document Status**: Published Technical Specification
- **Main Topic**: Technical specification defining methods for deriving cryptographic keys from multiple shared secrets using hybrid key establishment combining traditional elliptic curve Diffie-Hellman (ECDH) with quantum-safe key encapsulation mechanisms (KEMs) for migration to quantum-safe technology.
- **PQC Algorithms Covered**: ML-KEM (ML-KEM-512, ML-KEM-768, ML-KEM-1024), Elliptic curves (P-256, P-384, P-521, Curve25519, Curve448, brainpoolP256r1, brainpoolP384r1)
- **Quantum Threats Addressed**: Post-Quantum, Shor's Algorithm, Grover's Algorithm
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: None detected; Bodies: ETSI (Technical Committee Cyber Security), NIST (referenced standards)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Hybrid Key Establishment schemes, ECDH (Elliptic Curve Diffie-Hellman), ECDHE (Elliptic Curve Diffie-Hellman Ephemeral), KEM (Key Encapsulation Mechanism), TLS 1.3, SSH
- **Infrastructure Layers**: Key derivation functions, hash functions, key establishment mechanisms, cryptographic primitives
- **Standardization Bodies**: ETSI, NIST (SP 800 series), IETF (RFC series), Trusted Computing Group
- **Compliance Frameworks Referenced**: FIPS PUB 180-4 (Secure Hash Standard), FIPS PUB 202 (SHA-3 Standard), FIPS PUB 203 (Module-Lattice-Based Key-Encapsulation Mechanism Standard), NIST SP800-56Ar3, NIST SP800-56Cr2, NIST SP800-185

---

## Ethereum-EIP4337-AA

- **Reference ID**: Ethereum-EIP4337-AA
- **Title**: EIP-4337: Account Abstraction Using Alt Mempool
- **Authors**: Vitalik Buterin; Yoav Weiss; Ethereum Foundation
- **Publication Date**: 2021-09-29
- **Last Updated**: 2024-01-01
- **Document Status**: Final
- **Main Topic**: Ethereum Improvement Proposal 4337 specifies account abstraction using an alternative mempool without consensus-layer changes. Enables smart contract accounts with arbitrary verification logic.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected (Ethereum ecosystem context only)
- **Leaders Contributions Mentioned**: Vitalik Buterin, Yoav Weiss, Dror Tirosh, Shahaf Nacson, Alex Forshtat, Kristof Gazso, Tjaden Hess
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: EIP-712, EIP-7702, EIP-2718
- **Infrastructure Layers**: EVM (Ethereum Virtual Machine), EntryPoint contract, bundlers, block builders
- **Standardization Bodies**: Ethereum (EIPs)
- **Compliance Frameworks Referenced**: None detected

---

## Ethereum-EIP7702

- **Reference ID**: Ethereum-EIP7702
- **Title**: EIP-7702: Set Code for EOA
- **Authors**: Vitalik Buterin; Sam Wilson; Ansgar Dietrichs; Ethereum Foundation
- **Publication Date**: 2024-05-07
- **Last Updated**: 2025-01-01
- **Document Status**: Final
- **Main Topic**: Ethereum Improvement Proposal 7702 introduces a new transaction type that allows Externally Owned Accounts (EOAs) to set code in their account by attaching authorization tuples. Enables batching, sponsorship, and privilege de-escalation without consensus changes.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected (Ethereum context only)
- **Leaders Contributions Mentioned**: Vitalik Buterin, Sam Wilson, Ansgar Dietrichs, lightclient
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: EIP-2718, EIP-2930, EIP-4844, EIP-1559
- **Infrastructure Layers**: EVM, transaction mempool, delegated code execution
- **Standardization Bodies**: Ethereum (EIPs)
- **Compliance Frameworks Referenced**: None detected

---

## Ethereum-PQC-Tasklist-Ethresearch

- **Reference ID**: Ethereum-PQC-Tasklist-Ethresearch
- **Title**: Tasklist for Post-Quantum Ethereum
- **Authors**: Ethereum Foundation PQC Research Team
- **Publication Date**: 2024-01-01
- **Last Updated**: 2025-06-01
- **Document Status**: Active Research
- **Main Topic**: Forum discussion outlining post-quantum cryptography migration tasks for Ethereum architecture, including signature schemes, address formats, key derivation, hash functions, and consensus layer upgrades needed to address threats from cryptographically relevant quantum computers.
- **PQC Algorithms Covered**: Falcon (FN-DSA / FIPS-206), SLH-DSA (FIPS-205 / Sphincs-plus), lattice-based schemes, HKDF, Blake3, secp256k1, P-256 (secp256r1)
- **Quantum Threats Addressed**: Shor's Algorithm, Grover's Algorithm, CRQC (Cryptographically Relevant Quantum Computer)
- **Migration Timeline Info**: Milestones: Australian ASD prohibition of SHA256, AES-128 after 2030
- **Applicable Regions / Bodies**: Regions: Australia; Bodies: NIST (PQC standardization), ASD (Australian Signals Directorate), FIDO
- **Leaders Contributions Mentioned**: Vitalik Buterin, p_m (original poster), WizardOfMenlo, pcaversaccio, rdubois-crypto, frangio
- **PQC Products Mentioned**: RIP-7212 (P256VERIFY precompile), EIP-7701 (Native Account Abstraction with EOF)
- **Protocols Covered**: BIP39, EIP-2333, BIP32, Keccak (KECCAK256), KZG, ZK-rollups, STARKs, Groth16, PLONK, Marlin, BulletProof, node discovery (DevP2P), Discovery v5, Ethereum Node Records (ENR)
- **Infrastructure Layers**: Consensus layer (signature aggregation), EVM (opcodes, precompiles), Encryption wallets (AES, HMAC), KZG verification (EIP-4844), ZK-rollups
- **Standardization Bodies**: NIST (PQC), ASD (Australian Cyber Security), FIDO/Passkey standards, FIPS-205, FIPS-206
- **Compliance Frameworks Referenced**: NIST-PQC standard recommendations, Australian ASD cryptography guidelines

---

## Ethereum-Yellow-Paper

- **Reference ID**: Ethereum-Yellow-Paper
- **Title**: Ethereum: A Secure Decentralised Generalised Transaction Ledger
- **Authors**: Gavin Wood (Ethereum Foundation)
- **Publication Date**: 2014-01-01
- **Last Updated**: 2024-01-01
- **Document Status**: Published
- **Main Topic**: Technical specification of Ethereum protocol defining blockchain paradigm, transaction model, state transitions, execution layer rules, gas mechanics, EVM instruction set, and cryptographic foundations using ECDSA/SECP-256k1 for transaction signing.
- **PQC Algorithms Covered**: None detected (focuses on ECDSA, Keccak-256)
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected (technical specification, not policy)
- **Leaders Contributions Mentioned**: Gavin Wood (author, founder of Ethereum), Vitalik Buterin (original proposal 2013)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: ECDSA, SECP-256k1, Keccak-256 (KEC/KEC512), EIP-2718, EIP-1559, EIP-2930, EIP-155, RLP, Merkle Patricia tree
- **Infrastructure Layers**: EVM (execution layer), consensus layer (Beacon Chain), transaction mempool, state database, precompiled contracts, gas mechanism
- **Standardization Bodies**: Ethereum (protocol versions: London, Paris, Shanghai)
- **Compliance Frameworks Referenced**: None detected

---

## FIPS 186-5

- **Reference ID**: FIPS 186-5
- **Title**: Digital Signature Standard (DSS)
- **Authors**: NIST
- **Publication Date**: 2023-02-03
- **Last Updated**: 2025-05-12
- **Document Status**: Final Standard
- **Main Topic**: Digital Signature Standard specifying three approved signature algorithms (RSA, ECDSA, EdDSA) for generating and verifying digital signatures with integrity assurance and non-repudiation capabilities.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Post-Quantum (explicitly noted: "algorithms in this standard are not expected to provide resistance to attacks from a large-scale quantum computer; digital signature algorithms that will provide security from quantum computers will be specified in future NIST publications")
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NIST, National Institute of Standards and Technology, Secretary of Commerce, National Security Systems (NSS exempted)
- **Leaders Contributions Mentioned**: Gina M. Raimondo (Secretary of Commerce), Laurie E. Locascio (NIST Director and Under Secretary of Commerce), Charles H. Romine (ITL Director)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: RSA (RFC 8017), ECDSA (ANS X9.62, RFC 6979), EdDSA (RFC 8032), HashEdDSA, RSASSA-PSS, RSASSA-PKCS1-v1.5
- **Infrastructure Layers**: Public Key Infrastructure (PKI), Key establishment, Digital signature systems
- **Standardization Bodies**: NIST, IETF, American National Standards (ANS)
- **Compliance Frameworks Referenced**: FIPS (Federal Information Processing Standards), SP 800-57 (Key Management), SP 800-89 (Assurances for Digital Signature Applications), SP 800-90A (Random Bit Generation), SP 800-102 (Digital Signature Timeliness), SP 800-131A (Cryptographic Algorithms Security Strength), SP 800-186 (Elliptic Curve Domain Parameters), FIPS 180 (Secure Hash Standard), FIPS 202 (SHA3), FIPS 140-3, FISMA

---

## FIPS 203

- **Reference ID**: FIPS 203
- **Title**: Module-Lattice-Based Key-Encapsulation Mechanism Standard (ML-KEM)
- **Authors**: NIST
- **Publication Date**: 2023-08-24
- **Last Updated**: 2024-08-13
- **Document Status**: Final Standard
- **Main Topic**: Module-Lattice-Based Key-Encapsulation Mechanism Standard specifying ML-KEM algorithm for establishing shared secret keys via key encapsulation based on Module Learning With Errors (MLWE) problem, believed secure against quantum computers.
- **PQC Algorithms Covered**: ML-KEM (ML-KEM-512, ML-KEM-768, ML-KEM-1024), CRYSTALS-KYBER
- **Quantum Threats Addressed**: Post-Quantum, CRQC (explicitly stated: "believed to be secure, even against adversaries who possess a quantum computer")
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NIST, National Institute of Standards and Technology, Secretary of Commerce, federal agencies
- **Leaders Contributions Mentioned**: Gina M. Raimondo (Secretary of Commerce), Laurie E. Locascio (NIST Director and Under Secretary of Commerce), Kevin M. Stine (ITL Director)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: ML-KEM key encapsulation mechanism, symmetric-key cryptographic algorithms
- **Infrastructure Layers**: Key establishment, Shared secret key generation, Key-encapsulation mechanisms, Encryption and authentication
- **Standardization Bodies**: NIST, Bureau of Industry and Security (U.S. Department of Commerce)
- **Compliance Frameworks Referenced**: FIPS 203, NIST Special Publications (SP 800-227), FIPS publications, SP 800-140C (approved security functions), Cryptographic Module Validation Program (CMVP), Patent license agreements (open-source licensing for ML-KEM), FISMA

---

## FIPS 204

- **Reference ID**: FIPS 204
- **Title**: Module-Lattice-Based Digital Signature Standard (ML-DSA)
- **Authors**: NIST
- **Publication Date**: 2023-08-24
- **Last Updated**: 2024-08-13
- **Document Status**: Final Standard
- **Main Topic**: Module-Lattice-Based Digital Signature Standard specifying ML-DSA algorithm for generating and verifying digital signatures with security against large-scale quantum computers, applicable to federal systems and commercial use.
- **PQC Algorithms Covered**: ML-DSA (multiple parameter sets)
- **Quantum Threats Addressed**: Post-Quantum, CRQC (explicitly stated: "believed to be secure, even against adversaries in possession of a large-scale quantum computer")
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NIST, National Institute of Standards and Technology, Secretary of Commerce, federal departments and agencies
- **Leaders Contributions Mentioned**: Gina M. Raimondo (Secretary of Commerce), Laurie E. Locascio (NIST Director and Under Secretary of Commerce), Kevin M. Stine (ITL Director)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: ML-DSA digital signature algorithm, signature generation and verification procedures
- **Infrastructure Layers**: Digital signature systems, Public-key-based signature systems, Public key infrastructure
- **Standardization Bodies**: NIST, National Institute of Standards and Technology, Bureau of Industry and Security (U.S. Department of Commerce)
- **Compliance Frameworks Referenced**: FIPS 204, FIPS 205 (alternative signature standard), FIPS 186-5 (traditional signatures), NIST Special Publication 800-208, SP 800-140C (approved security functions), Cryptographic Module Validation Program (CMVP), FISMA

---

## FIPS 205

- **Reference ID**: FIPS 205
- **Title**: Stateless Hash-Based Digital Signature Standard (SLH-DSA)
- **Authors**: NIST
- **Publication Date**: 2023-08-24
- **Last Updated**: 2024-08-13
- **Document Status**: Final Standard
- **Main Topic**: Stateless Hash-Based Digital Signature Standard specifying SLH-DSA algorithm (based on SPHINCS+) for quantum-resistant digital signatures, selected through NIST Post-Quantum Cryptography Standardization process.
- **PQC Algorithms Covered**: SLH-DSA (Stateless Hash-Based Digital Signature Algorithm), SPHINCS+
- **Quantum Threats Addressed**: Post-Quantum (explicitly referenced as "post-quantum" in keywords and document context)
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NIST, National Institute of Standards and Technology, Secretary of Commerce, federal departments and agencies
- **Leaders Contributions Mentioned**: Gina M. Raimondo (Secretary of Commerce), Laurie E. Locascio (NIST Director and Under Secretary of Commerce), Kevin M. Stine (ITL Director)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: SLH-DSA stateless hash-based digital signature scheme, SPHINCS+ signature generation and verification
- **Infrastructure Layers**: Digital signature systems, Public-key-based signature systems, Stateless signature mechanisms
- **Standardization Bodies**: NIST, National Institute of Standards and Technology, Bureau of Industry and Security (U.S. Department of Commerce)
- **Compliance Frameworks Referenced**: FIPS 205, FIPS 204 (lattice-based signatures), FIPS 186-5 (traditional signatures), NIST Special Publication 800-208, SP 800-140C (approved security functions), NIST Post-Quantum Cryptography Standardization process, Cryptographic Module Validation Program (CMVP), FISMA

---

## FRB-FEDS-2025093-Blockchain-PQC

- **Reference ID**: FRB-FEDS-2025093-Blockchain-PQC
- **Title**: Harvest Now Decrypt Later: Post-Quantum Cryptography and Data Privacy Risks for Distributed Ledger Networks
- **Authors**: Federal Reserve Board
- **Publication Date**: 2025-09-01
- **Last Updated**: 2025-09-01
- **Document Status**: Published
- **Main Topic**: Analyzes the "harvest now decrypt later" (HNDL) risk for distributed ledger networks, examining quantum computing threats to cryptocurrency security and data privacy using Bitcoin as an illustrative case study.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: HNDL, Post-Quantum
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: Federal Reserve System
- **Leaders Contributions Mentioned**: Jillian Mascelli, Megan Rodden
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Bitcoin network protocol
- **Infrastructure Layers**: Distributed Ledger Networks, Payment Systems
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected

---

## GSMA PQ.03 PQC Guidelines

- **Reference ID**: GSMA PQ.03 PQC Guidelines
- **Title**: Post-Quantum Cryptography Guidelines for Telecom Use Cases
- **Authors**: GSMA
- **Publication Date**: 2024-10-01
- **Last Updated**: 2024-10-01
- **Document Status**: Permanent Reference Document
- **Main Topic**: Provides comprehensive guidelines for post-quantum cryptography migration in telecommunications, covering planning phases, algorithm standardization, use cases, and implementation challenges specific to telecom industry operators.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, FrodoKEM, Classic McEliece, BIKE, HQC, XMSS, LMS, Falcon
- **Quantum Threats Addressed**: Post-Quantum, CRQC, Grover's Algorithm
- **Migration Timeline Info**: Milestones: NIST standardization timelines | Refresh cycles for hardware and software | Government initiatives multi-country overview
- **Applicable Regions / Bodies**: Regions: Germany, France, United States, Singapore; Bodies: NIST, ETSI, ISO, 3GPP, IETF, BSI, ANSSI, NCSC
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, TLS 1.3, IPSec, IKEv2, 3GPP standards, 4G, 5G
- **Infrastructure Layers**: Base Stations, Security Gateway, Network Functions, Cloud Infrastructure, SIM Provisioning, Remote SIM Provisioning, Firmware Management, VPN, SD-WAN, IoT, Smart Meters, Automotive, 5G Core Network
- **Standardization Bodies**: NIST, ETSI, ISO, 3GPP, IETF, BSI, ANSSI, NCSC, Monetary Authority of Singapore
- **Compliance Frameworks Referenced**: FIPS 140-3, FedRAMP, Common Criteria, NIST SP 800-207, ETSI GR ETI 002

---

## HQC Specification

- **Reference ID**: HQC Specification
- **Title**: Hamming Quasi-Cyclic (HQC) Algorithm Specification
- **Authors**: NIST/HQC Team
- **Publication Date**: 2024-02-23
- **Last Updated**: 2025-08-22
- **Document Status**: NIST Round 4 Selection
- **Main Topic**: Technical specification of Hamming Quasi-Cyclic (HQC), a code-based IND-CCA2 secure Key Exchange Mechanism candidate for NIST's post-quantum cryptography standardization, detailing mathematical foundations, parameter sets, and security analysis.
- **PQC Algorithms Covered**: HQC-PKE, HQC-KEM, Reed-Solomon codes, Reed-Muller codes
- **Quantum Threats Addressed**: Post-Quantum
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: NIST
- **Leaders Contributions Mentioned**: Philippe Gaborit, Carlos Aguilar-Melchor, Nicolas Aragon, Slim Bettaieb, Loïc Bidoux, Olivier Blazy, Jean-Christophe Deneuville, Edoardo Persichetti, Gilles Zémor, Jurjen Bos, Arnaud Dion, Jérôme Lacan, Jean-Marc Robert, Pascal Véron, Paulo L. Barreto, Santosh Ghosh, Shay Gueron, Tim Güneysu, Rafael Misoczki, Jan Richter-Brokmann, Nicolas Sendrier, Jean-Pierre Tillich, Valentin Vasseur
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Fujisaki-Okamoto transformation, HHK framework
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: NIST FIPS standard track

---

## IETF RFC 8391

- **Reference ID**: IETF RFC 8391
- **Title**: XMSS: eXtended Merkle Signature Scheme
- **Authors**: IETF CFRG
- **Publication Date**: 2018-05-01
- **Last Updated**: 2018-05-01
- **Document Status**: Informational
- **Main Topic**: Describes XMSS (eXtended Merkle Signature Scheme), a hash-based stateful digital signature system resistant to quantum-computer-aided attacks, providing specifications for WOTS+, XMSS, and XMSS^MT signature schemes.
- **PQC Algorithms Covered**: XMSS, XMSS^MT, WOTS+, Winternitz One-Time Signature Plus, LMS, SPHINCS
- **Quantum Threats Addressed**: Post-Quantum
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: IETF, IRTF, Crypto Forum Research Group
- **Leaders Contributions Mentioned**: Andreas Huelsing, David Butin, Stefan Gazdag, Jeroen Rijneveld, Aziz Mohaisen
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: WOTS+, XMSS, XMSS^MT, hash-based signature schemes
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: IETF, IRTF, RFC Editor
- **Compliance Frameworks Referenced**: None detected

---

## IETF RFC 8554

- **Reference ID**: IETF RFC 8554
- **Title**: Leighton-Micali Hash-Based Signatures
- **Authors**: IETF CFRG
- **Publication Date**: 2019-04-01
- **Last Updated**: 2019-04-01
- **Document Status**: Informational
- **Main Topic**: Leighton-Micali Hash-Based Signatures (LMS/HSS) — a digital signature system using cryptographic hash functions resistant to quantum computers, with stateful properties for secure multi-message signing.
- **PQC Algorithms Covered**: Leighton-Micali Signatures (LMS), Hierarchical Signature System (HSS), LM-OTS (one-time signatures)
- **Quantum Threats Addressed**: Post-Quantum
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: None detected; Bodies: IETF, Crypto Forum Research Group (CFRG), IRTF
- **Leaders Contributions Mentioned**: David McGrew, Mark Curcio, Scott Fluhrer
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: LMS, HSS, LM-OTS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: IETF, CFRG, IRTF
- **Compliance Frameworks Referenced**: None detected

---

## IETF RFC 8784

- **Reference ID**: IETF RFC 8784
- **Title**: Mixing Preshared Keys in IKEv2 for Post-quantum Security
- **Authors**: IETF IPSECME
- **Publication Date**: 2020-06-01
- **Last Updated**: 2020-06-01
- **Document Status**: Standards Track
- **Main Topic**: Mixing Post-Quantum Pre-Shared Keys (PPK) in IKEv2 — extends IKEv2 to provide quantum-resistant key exchange by combining classical Diffie-Hellman with pre-shared keys to mitigate harvest-and-decrypt attacks.
- **PQC Algorithms Covered**: None detected (uses classical key exchange with PPK mixing)
- **Quantum Threats Addressed**: HNDL, Shor's Algorithm, Grover's Algorithm, Post-Quantum
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: None detected; Bodies: IETF, ELVIS-PLUS
- **Leaders Contributions Mentioned**: Scott Fluhrer, Panos Kampanakis, David McGrew, Valery Smyslov
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: IKEv2, IPsec, IKEv1
- **Infrastructure Layers**: VPN
- **Standardization Bodies**: IETF, IANA
- **Compliance Frameworks Referenced**: None detected

---

## IETF RFC 9370

- **Reference ID**: IETF RFC 9370
- **Title**: Multiple Key Exchanges in IKEv2
- **Authors**: IETF IPSECME
- **Publication Date**: 2023-05-01
- **Last Updated**: 2023-05-01
- **Document Status**: Standards Track
- **Main Topic**: Multiple Key Exchanges in IKEv2 — enables hybrid key exchanges combining classical (EC)DH with post-quantum algorithms via IKE_INTERMEDIATE and IKE_FOLLOWUP_KE exchanges to resist quantum-computer attacks while maintaining backward compatibility.
- **PQC Algorithms Covered**: Post-quantum key exchange algorithms (unspecified in RFC, framework only), classical (EC)DH
- **Quantum Threats Addressed**: Shor's Algorithm, Grover's Algorithm, Post-Quantum, HNDL
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: None detected; Bodies: IETF, Post-Quantum, ISARA Corporation, Quantum Secret, Philips, ELVIS-PLUS
- **Leaders Contributions Mentioned**: CJ. Tjhai, M. Tomlinson, G. Bartlett, Scott Fluhrer, D. Van Geest, O. Garcia-Morchon, Valery Smyslov
- **PQC Products Mentioned**: ISARA Corporation products (implicit)
- **Protocols Covered**: IKEv2, IPsec, IKE_SA_INIT, IKE_INTERMEDIATE, IKE_AUTH, CREATE_CHILD_SA, IKE_FOLLOWUP_KE
- **Infrastructure Layers**: VPN
- **Standardization Bodies**: IETF, IANA
- **Compliance Frameworks Referenced**: RFC 7296, RFC 9242, RFC 7383, RFC 6023, RFC 5723

---

## KMIP-V2-1-OASIS

- **Reference ID**: KMIP-V2-1-OASIS
- **Title**: Key Management Interoperability Protocol (KMIP) Version 2.1
- **Authors**: OASIS KMIP Technical Committee
- **Publication Date**: 2021-06-20
- **Last Updated**: 2021-06-20
- **Document Status**: OASIS Standard
- **Main Topic**: Key Management Interoperability Protocol (KMIP) v2.1 — OASIS standard for interoperable key management operations including generation, storage, and lifecycle management of cryptographic keys and certificates, with explicit quantum-safe support.
- **PQC Algorithms Covered**: None detected (framework-agnostic; supports post-quantum through attributes)
- **Quantum Threats Addressed**: Post-Quantum
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: None detected; Bodies: OASIS, OASIS KMIP TC
- **Leaders Contributions Mentioned**: Tony Cox, Judith Furlong, Charles White, Tim Chevalier, Tim Hudson, Jeff Bartell
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: KMIP, TTLV, HTTPS, JSON, XML, PKCS#11, CMP, CRMF, OpenPGP, X.509, PKCS#1, PKCS#5, PKCS#8, PKCS#10, PKCS#12
- **Infrastructure Layers**: Key Management Systems, PKI
- **Standardization Bodies**: OASIS, NIST, ANSI, ISO/IEC, ITU-T
- **Compliance Frameworks Referenced**: NIST SP 800-57 (Key Management), NIST SP 800-56A (Key Establishment), NIST SP 800-38 (Cipher Modes), FIPS 180-4, FIPS 186-4, FIPS 197, FIPS 198-1, FIPS 202, X.509, X9 standards
- **Summary**: 4 documents with actual content extracted. 1 landing page identified. All actual content documents contain explicit or implicit PQC considerations, with RFCs 8554, 8784, and 9370 focused on standardizing post-quantum cryptographic mechanisms, and KMIP v2.1 introducing quantum-safe key management attributes.

---

## KpqC-Competition-Results

- **Reference ID**: KpqC-Competition-Results
- **Title**: Korean Post-Quantum Cryptography Competition Final Results
- **Authors**: KISA; Ministry of Science and ICT; NIS Korea
- **Publication Date**: 2025-01-31
- **Last Updated**: 2025-01-31
- **Document Status**: Final Results
- **Quality Gate: ACTUAL CONTENT** (substantive competition announcement with algorithm details)
- **Main Topic**: Announcement of Round 1 finalists and Round 2 candidates for South Korea's post-quantum cryptography competition (KpqC) featuring digital signature and public-key encryption algorithm submissions.
- **PQC Algorithms Covered**: NTRU+, HAETAE, PALOMA, MQ-Sign, REDOG, NCC-Sign, SMAUG+TiGER, AIMer, Enhanced pqsigRM, FIBS, GCKSign, Peregrine, SOLMAE
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Milestones: Round 1 (November 2022–November 2023), Round 2 advance announced December 7, 2023
- **Applicable Regions / Bodies**: Regions: South Korea; Bodies: KpqC (Korean Post-Quantum Cryptography) team
- **Leaders Contributions Mentioned**: Jieun Ryu, Yongbhin Kim, Seungtai Yoon, Ju-Sung Kang, Yongjin Yeom, Chanki Kim, Young-Sik Kim, Jonghyun Kim, Jong Hwan Park, Dong-Chan Kim, Chang-Yeol Jeon, Yeonghyo Kim, Minji Kim, Jon-Lark Kim, Jihoon Hong, Terry Shue Chien Lau, YounJae Lim, Chik How Tan, Theo Fanuela Prabowo, Byung-Sun Won, Jung Hee Cheon, Hyeongmin Choe, Dongyeon Hong, Jeongdae Hong, Hyoeun Seong, Junbum Shin, MinJune Yi, Seungwhan Park, Chi-Gon Jung, Aesun Park, Joongeun Choi, Honggoo Kang, Seongkwang Kim, Jincheol Ha, Mincheol Son, Byeonghak Lee, Dukjae Moon, Joohee Lee, Sangyub Lee, Jihoon Kwon, Jihoon Cho, Hyojin Yoon, Jooyoung Lee, Jong-Seon No, Jinkyu Cho, Yongwoo Lee, Zahyun Koo, Suhri Kim, Youngdo Lee, Kisoon Yoon, Kwangsu Lee, Dong-Guk Han, Hwajeong Seo, Joo Woo, Julien Devevey, Tim Güneysu, Markus Krausz, Georg Land, Damien Stehlé, Kyung-Ah Shim, Jeongsu Kim, Youngjoo An, Eun-Young Seo, Joon-Woo Lee, Kwangjo Kim, Mehdi Tibouchi, Alexandre Wallet, Thomas Espitau, Akira Takahashi, Yang Yu, Sylvain Guilley
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: KpqC (Korean Post-Quantum Cryptography)
- **Compliance Frameworks Referenced**: None detected

---

## NIST-FIPS140-3-IG-PQC

- **Reference ID**: NIST-FIPS140-3-IG-PQC
- **Title**: FIPS 140-3 Implementation Guidance for Post-Quantum Cryptography
- **Authors**: NIST CMVP
- **Publication Date**: 2025-09-02
- **Last Updated**: 2025-09-02
- **Document Status**: Published Update
- **Quality Gate: ACTUAL CONTENT** (implementation guidance for FIPS 140-3 cryptographic module validation with PQC sections)
- **Main Topic**: Implementation Guidance for FIPS 140-3 and the Cryptographic Module Validation Program, updated through September 2, 2025, covering cryptographic module specification, validation bindings, and algorithm deployment including post-quantum considerations.
- **PQC Algorithms Covered**: Not explicitly enumerated in preview (document references PQC but full algorithm list requires expanded reading)
- **Quantum Threats Addressed**: None detected (implementation guidance document, not threat-focused)
- **Migration Timeline Info**: Milestones: Document last updated September 2, 2025 (current/ongoing implementation guidance)
- **Applicable Regions / Bodies**: Regions: United States, Canada; Bodies: NIST, Canadian Centre for Cyber Security, Cryptographic Algorithm Validation Program (CAVP), Cryptographic Module Validation Program (CMVP)
- **Leaders Contributions Mentioned**: None detected in preview
- **PQC Products Mentioned**: None detected in preview
- **Protocols Covered**: None detected in preview
- **Infrastructure Layers**: None detected in preview
- **Standardization Bodies**: NIST, Canadian Centre for Cyber Security, CAVP, CMVP
- **Compliance Frameworks Referenced**: FIPS 140-3, FIPS PUB 140

---

## NIST-SP-800-108-R1

- **Reference ID**: NIST-SP-800-108-R1
- **Title**: Recommendation for Key Derivation Using Pseudorandom Functions (Revision 1)
- **Authors**: NIST
- **Publication Date**: 2022-08-01
- **Last Updated**: 2022-08-01
- **Document Status**: Final
- **Quality Gate: ACTUAL CONTENT** (comprehensive technical standard on key derivation using pseudorandom functions)
- **Main Topic**: NIST SP 800-108 Revision 1 (August 2022) specifies key-derivation functions using pseudorandom functions (HMAC, CMAC, KMAC) for deriving additional keying material from secret keys or shared secrets in key-establishment schemes.
- **PQC Algorithms Covered**: None detected (general KDF guidance applicable to both classical and PQC)
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Milestones: Original edition 2008, Revision 1 August 2022, updated to Revision 1 Update 1 February 2024
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NIST (Computer Security Division, Information Technology Laboratory)
- **Leaders Contributions Mentioned**: Lily Chen (NIST author), Elaine Barker (NIST), Meltem Sönmez Turan (NIST), Rich Davis (National Security Agency), Scott Arciszewski (Amazon), Matthew Campagna (Amazon), Panos Kampanakis (Amazon), Adam Petcher (Amazon)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Counter mode KDF, Feedback mode KDF, Double-pipeline mode KDF, KMAC-based KDF
- **Infrastructure Layers**: Key-derivation key (KDK) → key expansion → derived keying material
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: SP 800-56A (key-agreement), SP 800-56B (integer factorization), SP 800-56C (key-derivation methods), SP 800-90A (random bit generation), SP 800-133 (key generation), SP 800-185 (SHA-3 derived functions), FIPS 197 (AES), FIPS 198 (HMAC), FIPS 180 (SHA standards), FIPS 202 (SHA-3)

---

## NIST-SP-800-56C-R2

- **Reference ID**: NIST-SP-800-56C-R2
- **Title**: Recommendation for Key-Derivation Methods in Key-Establishment Schemes (Revision 2)
- **Authors**: NIST
- **Publication Date**: 2020-08-01
- **Last Updated**: 2020-08-01
- **Document Status**: Final
- **Quality Gate: ACTUAL CONTENT** (comprehensive technical standard on key-derivation methods in key-establishment schemes)
- **Main Topic**: NIST SP 800-56C Revision 2 (August 2020) specifies one-step and two-step key-derivation methods for deriving keying material from shared secrets generated in public-key based key-establishment schemes, supporting both classical and hybrid (PQC-integrated) shared secrets.
- **PQC Algorithms Covered**: None explicitly listed; document supports hybrid Z′ = Z || T shared secret concatenation enabling PQC integration
- **Quantum Threats Addressed**: None detected (classical guidance with PQC-hybrid architecture accommodation)
- **Migration Timeline Info**: Milestones: Revision 2 August 2020 (current standard for hybrid PQC migration support)
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NIST (Computer Security Division, Information Technology Laboratory), National Security Agency
- **Leaders Contributions Mentioned**: Elaine Barker (NIST), Lily Chen (NIST), Richard Davis (NSA), Quynh Dang (NIST), Sharon Keller (NIST), John Kelsey (NIST), Allen Roginsky (NIST), Meltem Sonmez Turan (NIST), Apostol Vassilev (NIST), Tim Polk (NIST), Miles Smid (Orion Security Solutions)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: One-step key-derivation functions (hash, HMAC-hash, KMAC-based), two-step extraction-then-expansion procedure (randomness extraction, key expansion)
- **Infrastructure Layers**: Shared secret Z (or hybrid Z′) → key-derivation method → derived keying material; extraction phase → KDK → expansion phase
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: SP 800-56A (discrete logarithm key-establishment), SP 800-56B (integer factorization key-establishment), SP 800-108 (key derivation using pseudorandom functions), SP 800-135 (application-specific KDF), SP 800-57 (key management), SP 800-131A (algorithm transition), FIPS 197 (AES), FIPS 198 (HMAC), FIPS 180 (SHA), FIPS 202 (SHA-3), SP 800-38B (CMAC), SP 800-185 (KMAC)

---

## NIST-SP-800-57-Pt1-R5

- **Reference ID**: NIST-SP-800-57-Pt1-R5
- **Title**: Recommendation for Key Management: Part 1 – General (Revision 5)
- **Authors**: NIST
- **Publication Date**: 2020-05-04
- **Last Updated**: 2020-05-04
- **Document Status**: Final
- **Quality Gate: ACTUAL CONTENT** (comprehensive key management guidance standard covering all cryptographic key lifecycle phases)
- **Main Topic**: NIST SP 800-57 Part 1 Revision 5 (May 2020) provides general cryptographic key management guidance including key types, protection requirements, lifecycle phases, algorithms, cryptoperiods, and security strength considerations for government and organizational systems.
- **PQC Algorithms Covered**: None explicitly identified; document provides framework applicable to future PQC algorithm integration
- **Quantum Threats Addressed**: None detected (general key management framework pre-dating formal PQC standardization deadlines)
- **Migration Timeline Info**: Milestones: Original 1977 (Data Encryption Standard era), Part 1 Revision 5 May 2020; ongoing framework
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NIST (Information Technology Laboratory, Computer Security Division)
- **Leaders Contributions Mentioned**: Elaine Barker (NIST author), William Barker (NIST, previous author), William Burr (NIST, previous author), Timothy Polk (NIST, previous author), Miles Smid (Orion Security), Lydia Zieglar (National Security Agency), Paul Turner (Venafi)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Key agreement, key transport, key establishment, key derivation, encryption, digital signature, authentication
- **Infrastructure Layers**: Key generation → pre-activation → active state → suspended/deactivated → compromised → destroyed; operational, pre-operational, post-operational phases
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS 140 (cryptographic modules), FIPS 197 (AES), FIPS 198 (HMAC), FIPS 180 (SHA), FIPS 202 (SHA-3), SP 800-90A (random bit generation), SP 800-130 (key management system framework), SP 800-152 (federal KMS profile), SP 800-175B (cryptographic standards guidance), SP 800-32 (public-key infrastructure introduction), SP 800-56A (discrete logarithm key establishment), SP 800-56B (integer factorization key establishment), SP 800-56C (key-derivation methods), SP 800-108 (key derivation), SP 800-133 (key generation), SP 800-135 (application-specific KDF)
- **End of Batch 15 Results**

---

## NIST IR 8545

- **Reference ID**: NIST IR 8545
- **Title**: Status Report on the Fourth Round of the NIST PQC Standardization Process
- **Authors**: NIST
- **Publication Date**: 2025-03-11
- **Last Updated**: 2025-03-11
- **Document Status**: Final
- **Main Topic**: Status report on the fourth round of the NIST Post-Quantum Cryptography Standardization Process, evaluating four KEM candidates (BIKE, Classic McEliece, HQC, SIKE) and selecting HQC for standardization based on security, performance, and implementation characteristics.
- **PQC Algorithms Covered**: HQC (Hamming Quasi-Cyclic), BIKE (Bit-Flipping Key Encapsulation), Classic McEliece, SIKE (Supersingular Isogeny Key Encapsulation), ML-KEM (Module-Lattice-Based KEM, from earlier rounds), ML-DSA, SLH-DSA, Falcon (FN-DSA)
- **Quantum Threats Addressed**: Cryptographically Relevant Quantum Computer (CRQC), Shor's Algorithm (against elliptic curves and RSA), Grover's Algorithm (generic speedup of information set decoding)
- **Migration Timeline Info**: Milestones: December 2016 | Call for Submissions | November 2017 | First Submission Deadline | January 2019 | Second Round Announcement | July 2020 | Third Round Finalists | July 2022 | First Standardization Selection (ML-KEM, ML-DSA, SLH-DSA) | April 2024 | Fifth NIST PQC Conference | August 2024 | Final FIPS published | March 2025 | Fourth Round Selection (HQC standardized)
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NIST (National Institute of Standards and Technology), ISO/IEC (International Organization for Standardization/International Electrotechnical Commission)
- **Leaders Contributions Mentioned**: Gorjan Alagic, Maxime Bros, Pierre Ciadoux, David Cooper, Quynh Dang, Thinh Dang, John Kelsey, Jacob Lichtinger, Yi-Kai Liu, Carl Miller, Dustin Moody, Rene Peralta, Ray Perlner, Angela Robinson, Hamilton Silberg, Daniel Smith-Tone, Noah Waller; Support contributors: Zuzana Bajcsy, Lily Chen, Morris Dworkin, Sara Kerman, Andrew Regenscheid
- **PQC Products Mentioned**: None detected (evaluation of academic algorithm submissions, not commercial products)
- **Protocols Covered**: TLS 1.3, QUIC, XML encryption, SAML SSO, Diffie-Hellman procedures, IPSec, SSH
- **Infrastructure Layers**: Key establishment (KEM focus), digital signatures (mentioned as separate standardization track), TLS handshakes, network protocols
- **Standardization Bodies**: NIST (National Institute of Standards and Technology), ISO/IEC, FIPS (Federal Information Processing Standards)
- **Compliance Frameworks Referenced**: FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), SP 800-56A, SP 800-56B, SP 800-227 (guidance for KEMs)

---

## NIST IR 8547

- **Reference ID**: NIST IR 8547
- **Title**: Transition to Post-Quantum Cryptography Standards
- **Authors**: NIST
- **Publication Date**: 2024-11-12
- **Last Updated**: 2024-11-12
- **Document Status**: Initial Public Draft
- **Main Topic**: Initial Public Draft guidance on transitioning from quantum-vulnerable cryptographic standards to post-quantum digital signature and key-establishment algorithms. Establishes migration timeline, identifies vulnerable algorithms (RSA, ECDSA, EdDSA), specifies approved PQC replacements (ML-DSA, SLH-DSA, ML-KEM), and addresses hybrid transition techniques.
- **PQC Algorithms Covered**: ML-KEM (Module-Lattice-Based Key-Encapsulation Mechanism), ML-DSA (Module-Lattice-Based Digital Signature Algorithm), SLH-DSA (Stateless Hash-Based Digital Signature Algorithm), LMS (Leighton-Micali Signature), XMSS (eXtended Merkle Signature Scheme), HSS (Hierarchical Signature System), XMSSMT (multi-tree XMSS), Falcon (planned FIPS in future)
- **Quantum Threats Addressed**: Cryptographically Relevant Quantum Computer (CRQC), "Harvest Now, Decrypt Later" threat, Shor's Algorithm (breaks RSA, ECDSA, EdDSA, elliptic curve cryptography), quantum computing attacks on public-key cryptography
- **Migration Timeline Info**: Milestones: December 2016 | NIST PQC Call for Submissions | 2024 | Three PQC standards published (FIPS 203, 204, 205) | November 2024 | IR 8547 Draft Released | 2030 | Deprecation deadline (112-bit security classical algorithms) | 2035 | Primary target completion per NSM-10 for federal system migration | 2035 | Disallowance deadline for quantum-vulnerable algorithms with ≥128-bit security
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NIST, Federal agencies, CMVP (Cryptographic Module Validation Program), NSM-10 (National Security Memorandum 10)
- **Leaders Contributions Mentioned**: Dustin Moody, Ray Perlner, Andrew Regenscheid, Angela Robinson, David Cooper
- **PQC Products Mentioned**: OpenSSL, BoringSSL, Libsodium, Java Cryptography Architecture (JCA)
- **Protocols Covered**: TLS (Transport Layer Security), SSH (Secure Shell), IPSec (Internet Protocol Security), CMS (Cryptographic Message Syntax), S/MIME (Secure/Multipurpose Internet Mail Extensions), Diffie-Hellman, MQV (Menezes-QuVanstone)
- **Infrastructure Layers**: Key establishment, digital signatures, symmetric cryptography (AES, hash functions), PKI (Public Key Infrastructure), certification authorities, hardware security modules (HSMs), Trusted Platform Modules (TPMs), software cryptographic libraries, network protocols, code signing, user/machine authentication
- **Standardization Bodies**: NIST, FIPS (Federal Information Processing Standards), SP 800-series (NIST Special Publications), SP 800-131A (algorithm transition), SP 800-56A, SP 800-56B, SP 800-56C, SP 800-57, SP 800-208, RFC 8017, RFC 8032, ISO/IEC standards
- **Compliance Frameworks Referenced**: FIPS 186 (classical digital signatures: ECDSA, RSA, EdDSA), FIPS 197 (AES), FIPS 180 (SHA), FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), SP 800-208 (stateful hash-based signatures), CMVP validation framework, NSM-10 federal mandate

---

## NIST NCCoE SP 1800-38C

- **Reference ID**: NIST NCCoE SP 1800-38C
- **Title**: Migration to Post-Quantum Cryptography (Preliminary Draft)
- **Authors**: NIST NCCoE
- **Publication Date**: 2023-12-01
- **Last Updated**: 2023-12-01
- **Document Status**: Preliminary Draft Practice Guide
- **Quality Assessment: ACTUAL CONTENT**
- **Main Topic**: NIST NCCoE's interoperability and performance testing report for post-quantum cryptographic algorithms across SSH, TLS 1.3, QUIC, X.509 certificates, and hardware security modules, demonstrating real-world PQC implementation compatibility.
- **PQC Algorithms Covered**: CRYSTALS-Kyber, CRYSTALS-Dilithium, Falcon, SPHINCS+, Stateful hash-based signatures (LMS/XMSS/HSS), FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA)
- **Quantum Threats Addressed**: CRQC (Cryptanalytically Relevant Quantum Computer), Post-Quantum, Shor's Algorithm
- **Migration Timeline Info**: Milestones: Draft standards testing (December 2023) | Pre-standardized algorithm implementations | OMB M-23-02 alignment (2023)
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NIST, NSA, CISA, NCCoE, IETF
- **Leaders Contributions Mentioned**: William Newhouse, Murugiah Souppaya, William Barker, Chris Brown, Panos Kampanakis, Jim Goodman, Julien Prat, Robin Larrieu, John Gray, Mike Ounsworth, Cleandro Viana, Hubert Le Van Gong, Kris Kwiatkowski, Anthony Hu, Robert Burns, Christian Paquin, Jane Gilbert, Gina Scinta, Eunkyung Kim, Volker Krummel
- **PQC Products Mentioned**: AWS s2n-tls, Samsung SDS PQC-TLS (s-pqc-tls), OQS-OpenSSL, IBM z16, Microsoft quantum-safe solutions, wolfSSL, Entrust quantum-ready infrastructure, Keyfactor PKI solutions, Thales DIS CPL, PQShield quantum-resistant technology, Crypto4A quantum-safe HSM, CryptoNext Security C-QSL/C-QSR, DigiCert, Palo Alto Networks, Verizon, VMware, InfoSec Global, ISARA, SafeLogic, Kudelski IoT, Santander, SSH Communications, QuantumXchange
- **Protocols Covered**: SSH, TLS 1.3, QUIC, X.509 certificates, HSM mechanisms, PKCS#11
- **Infrastructure Layers**: Transport Layer Security, Secure Shell, Network protocols, Certificate authority, Hardware security modules, Key management systems
- **Standardization Bodies**: NIST, IETF, OASIS PKCS#11 TC, X9 Committee, NIAP (National Information Assurance Partnership)
- **Compliance Frameworks Referenced**: FIPS 203, FIPS 204, FIPS 205, OMB M-23-02, NIST Cybersecurity Framework, NIST Post-Quantum Cryptography Standardization process (Rounds 3-4)

---

## NIST SP 800-208

- **Reference ID**: NIST SP 800-208
- **Title**: Recommendation for Stateful Hash-Based Signature Schemes
- **Authors**: NIST
- **Publication Date**: 2020-10-29
- **Last Updated**: 2020-10-29
- **Document Status**: Final
- **Quality Assessment: ACTUAL CONTENT**
- **Main Topic**: NIST Special Publication 800-208 provides recommendations for stateful hash-based signature schemes (LMS, XMSS, HSS, XMSSMT) that are quantum-resistant and suitable for applications requiring long-term deployment and firmware authentication.
- **PQC Algorithms Covered**: Leighton-Micali Signature (LMS), eXtended Merkle Signature Scheme (XMSS), Hierarchical Signature System (HSS), Multi-tree XMSS (XMSSMT), Winternitz One-Time Signature Plus (WOTS+), Merkle tree-based constructions
- **Quantum Threats Addressed**: Post-Quantum, Shor's Algorithm
- **Migration Timeline Info**: Milestones: October 2020 publication | NIST in process of developing post-quantum secure digital signature standards | Suitable for near-future implementations with long lifetime
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NIST, FIPS (Federal Information Processing Standards)
- **Leaders Contributions Mentioned**: David A. Cooper, Daniel C. Apon, Quynh H. Dang, Michael S. Davidson, Morris J. Dworkin, Carl A. Miller
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Digital signature schemes, FIPS 186 (supplemented), Hash-based signatures, RFC 8554 (LMS/HSS), RFC 8391 (XMSS)
- **Infrastructure Layers**: Digital signature infrastructure, Firmware signing, Constrained device authentication, Key management with state
- **Standardization Bodies**: NIST, FIPS, IETF, IRTF, CAVP (Cryptographic Algorithm Validation Program), CMVP (Cryptographic Module Validation Program)
- **Compliance Frameworks Referenced**: FIPS 186, NIST SP 800-208, RFC 8554, RFC 8391, Federal cryptographic module validation, FISMA (Federal Information Security Modernization Act)

---

## NIST SP 800-227

- **Reference ID**: NIST SP 800-227
- **Title**: Recommendations for Key-Encapsulation Mechanisms
- **Authors**: NIST
- **Publication Date**: 2025-09-18
- **Last Updated**: 2025-09-18
- **Document Status**: Final
- **Quality Assessment: ACTUAL CONTENT**
- **Main Topic**: NIST Special Publication 800-227 provides comprehensive recommendations for key-encapsulation mechanisms (KEMs) covering basic definitions, properties, secure implementation, and PQ/traditional (PQ/T) hybrid construction for establishing shared secret keys resistant to quantum computers.
- **PQC Algorithms Covered**: Post-quantum KEMs (specific algorithms referenced in NIST PQC standardization: CRYSTALS-Kyber/ML-KEM), hybrid composite KEMs, Diffie-Hellman variants for KEM construction
- **Quantum Threats Addressed**: Post-Quantum, CRQC (Cryptanalytically Relevant Quantum Computer)
- **Migration Timeline Info**: Milestones: September 2025 publication (final) | NIST developing standards for post-quantum secure mechanisms | Recommendations for secure KEM implementation and deployment
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NIST ITL (Information Technology Laboratory), federal agencies
- **Leaders Contributions Mentioned**: Gorjan Alagic, Elaine Barker, Lily Chen, Dustin Moody, Angela Robinson, Hamilton Silberg, Noah Waller
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Key-encapsulation mechanisms (KEMs), Key establishment, Symmetric-key cryptographic algorithms, NIST PQC standardization suite, Composite/hybrid schemes
- **Infrastructure Layers**: Key establishment layer, Public-key cryptography infrastructure, Secure communications, Encryption protocols, Hybrid cryptography systems
- **Standardization Bodies**: NIST, FISMA, OMB (Office of Management and Budget), NIST PQC Standardization Project
- **Compliance Frameworks Referenced**: NIST SP 800-227, NIST PQC Standardization (FIPS 203/204/205 alignment), Federal cryptographic standards, FISMA requirements, OMB guidance

---

## PKCS11-V3-OASIS

- **Reference ID**: PKCS11-V3-OASIS
- **Title**: PKCS #11 Cryptographic Token Interface Standard Version 3.0
- **Authors**: OASIS PKCS11 Technical Committee
- **Publication Date**: 2020-06-01
- **Last Updated**: 2020-06-01
- **Document Status**: OASIS Standard
- **Quality Assessment: ACTUAL CONTENT**
- **Main Topic**: PKCS #11 Version 3.0 (June 2020, OASIS Standard) specifies data types, functions, and interfaces for accessing cryptographic tokens (hardware security modules, smart cards, software modules), supporting diverse cryptographic operations including signature, encryption, key management, and now extended for quantum-resistant algorithms.
- **PQC Algorithms Covered**: Quantum-resistant algorithm support structure through extended mechanism definitions (FIPS 203/204/205 ready), mechanism framework for PQC integration, post-quantum signature and key encapsulation support planned in profiles
- **Quantum Threats Addressed**: Post-Quantum (implicit through mechanism extensibility)
- **Migration Timeline Info**: Milestones: Version 3.0 released June 2020 | Mechanism specifications being updated for PQC standardization | PQC-aware profile development ongoing
- **Applicable Regions / Bodies**: Regions: International; Bodies: OASIS (Organization for the Advancement of Structured Information Standards), PKCS #11 Technical Committee, cryptographic standardization bodies worldwide
- **Leaders Contributions Mentioned**: Tony Cox (Cryptsoft Pty Ltd), Robert Relyea (Red Hat), Chris Zimman, Dieter Bong (Utimaco IS GmbH)
- **PQC Products Mentioned**: Red Hat, Utimaco, various HSM vendors implementing PKCS#11 v3.0
- **Protocols Covered**: PKCS#11 Cryptoki interface, Object management, Session management, Mechanism specification, Certificate handling (X.509, WTLS), Key generation and management, Signing and verification, Encryption/decryption, Key wrapping
- **Infrastructure Layers**: Hardware Security Module (HSM) interface, Cryptographic token management, PKI infrastructure, Key lifecycle management, Smart cards, Hardware crypto accelerators
- **Standardization Bodies**: OASIS, PKCS (Public Key Cryptography Standards), IETF, X.509 PKI standards bodies
- **Compliance Frameworks Referenced**: OASIS IPR Policy, RFC standards (via reference), X.509 certificate standards, HSM vendor compliance, PKCS#11 v2.40 (predecessor), PKCS#11 Profiles v3.0, PKCS#11 Mechanisms specifications (Current and Historical)

---

## RFC-8032

- **Reference ID**: RFC-8032
- **Title**: RFC 8032: Edwards-Curve Digital Signature Algorithm (EdDSA)
- **Authors**: IETF
- **Publication Date**: 2017-01-01
- **Last Updated**: 2017-01-01
- **Document Status**: Proposed Standard
- **Quality Assessment: ACTUAL CONTENT**
- **Main Topic**: RFC 8032 (January 2017) describes the Edwards-Curve Digital Signature Algorithm (EdDSA) with recommended parameter sets for Ed25519 (128-bit security) and Ed448 (224-bit security), providing implementation guidance, test vectors, and security analysis for elliptic curve-based signatures.
- **PQC Algorithms Covered**: None detected (EdDSA is classical ECC-based, not post-quantum, though mentioned as comparison point for quantum resistance discussion)
- **Quantum Threats Addressed**: Shor's Algorithm (vulnerability discussed), Post-Quantum context (EdDSA acknowledged as quantum-breakable)
- **Migration Timeline Info**: Milestones: January 2017 publication | Post-quantum cryptography discussion mentions that "A sufficiently large quantum computer would be able to break both" Ed25519 and Ed448 | Discusses hedge against analytical attacks on elliptic curves
- **Applicable Regions / Bodies**: Regions: International; Bodies: IETF, IRTF (Internet Research Task Force), CFRG (Crypto Forum Research Group)
- **Leaders Contributions Mentioned**: Simon Josefsson (SJD AB), Ilari Liusvaara
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: EdDSA digital signatures, Ed25519 variant, Ed448 variant, Ed25519ph (prehashed), Ed25519ctx (context-aware), Ed448ph, Schnorr signatures, Curve25519 (key exchange), Edwards curves, ECDSA alternatives
- **Infrastructure Layers**: Digital signature layer, Public-key cryptography, Key generation and management, Signature verification
- **Standardization Bodies**: IETF, IRTF CFRG, RFC publication stream
- **Compliance Frameworks Referenced**: RFC 7748 (Elliptic Curves for Security), RFC 7841 (IRTF publication process), Schnorr signature theory, Hash function standards (SHA-512, SHAKE256), Test vector specifications

---

## RFC-9258

- **Reference ID**: RFC-9258
- **Title**: Importing External Pre-Shared Keys (PSKs) for TLS 1.3
- **Authors**: IETF TLS Working Group
- **Publication Date**: 2022-07-01
- **Last Updated**: 2022-07-01
- **Document Status**: Proposed Standard
- **Main Topic**: Specifies an interface for importing external Pre-Shared Keys (PSKs) into TLS 1.3, including mechanisms for diversifying PSKs and binding them to specific KDF and hash functions via a PSK importer mechanism.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: None explicitly; Bodies: IETF, Internet Engineering Task Force
- **Leaders Contributions Mentioned**: David Benjamin (Google), Christopher A. Wood (Cloudflare); also acknowledged: Eric Rescorla, Martin Thomson, Christian Huitema, John Preuß Mattsson, Hugo Krawczyk
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.3, DTLS 1.3, QUIC v1
- **Infrastructure Layers**: None detected (application layer security protocols)
- **Standardization Bodies**: IETF, Internet Engineering Task Force
- **Compliance Frameworks Referenced**: BCP 14 (RFC 2119/8174), RFC 7841, RFC 5652, RFC 5869 (HKDF)

---

## RFC 8551

- **Reference ID**: RFC 8551
- **Title**: Secure/Multipurpose Internet Mail Extensions (S/MIME) Version 4.0 Message Specification
- **Authors**: IETF LAMPS
- **Publication Date**: 2019-04-01
- **Last Updated**: 2019-04-01
- **Document Status**: Proposed Standard
- **Main Topic**: Defines S/MIME version 4.0 message specification providing cryptographic security services (digital signatures, encryption, compression) for MIME data in email and other transport mechanisms using CMS.
- **PQC Algorithms Covered**: EdDSA (Edwards-curve Digital Signature Algorithm), ECDSA (Elliptic Curve Digital Signature Algorithm) mentioned as modern signature algorithms
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: None explicitly; Bodies: IETF, Internet Engineering Task Force
- **Leaders Contributions Mentioned**: Jim Schaad, August Cellars, B. Ramsdell (Brute Squad Labs), Sean Turner (sn3rd)
- **PQC Products Mentioned**: None detected (but EdDSA/ECDSA are mentioned for modernization)
- **Protocols Covered**: S/MIME, MIME, CMS, TLS, SIP, HTTP
- **Infrastructure Layers**: Email and messaging systems, mail user agents (MUAs)
- **Standardization Bodies**: IETF, Internet Engineering Task Force, ITU-T
- **Compliance Frameworks Referenced**: BCP 14 (RFC 2119/8174), RFC 5652 (CMS), RFC 3370, RFC 4056, RFC 3560, RFC 5754, RFC 5280

---

## RFC 9629

- **Reference ID**: RFC 9629
- **Title**: Using Key Encapsulation Mechanism (KEM) Algorithms in CMS
- **Authors**: IETF LAMPS
- **Publication Date**: 2024-08-01
- **Last Updated**: 2024-08-01
- **Document Status**: Proposed Standard
- **Main Topic**: Defines conventions for using Key Encapsulation Mechanism (KEM) algorithms in CMS, including quantum-secure KEM algorithms. Specifies KEMRecipientInfo structure for enveloped-data and authenticated-enveloped-data content types.
- **PQC Algorithms Covered**: Generic KEM algorithms including quantum-secure KEM algorithms (not specific algorithms named, but framework provided)
- **Quantum Threats Addressed**: Post-Quantum, quantum-secure KEM algorithms, cryptographically relevant quantum computers (CRQCs)
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: None explicitly; Bodies: IETF, Internet Engineering Task Force
- **Leaders Contributions Mentioned**: Russ Housley (Vigil Security), John Gray (Entrust), Tomofumi Okubo (Penguin Securities Pte. Ltd.), Burt Kaliski, Carl Wallace, Hendrik Brockhaus, Jonathan Hammell, Mike Jenkins, David von Oheimb, Francois Rousseau, Linda Dunbar
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: CMS, enveloped-data, authenticated-data, authenticated-enveloped-data
- **Infrastructure Layers**: Cryptographic message syntax, key management
- **Standardization Bodies**: IETF, Internet Engineering Task Force, ITU-T
- **Compliance Frameworks Referenced**: RFC 2119 (BCP 14), RFC 5652 (CMS), RFC 5083, RFC 5280, RFC 5869 (HKDF), RFC 5911, RFC 5912, RFC 6268

---

## RFC 9690

- **Reference ID**: RFC 9690
- **Title**: Use of the RSA-KEM Algorithm in the Cryptographic Message Syntax (CMS)
- **Authors**: IETF LAMPS
- **Publication Date**: 2024-12-01
- **Last Updated**: 2024-12-01
- **Document Status**: Proposed Standard
- **Main Topic**: Specifies conventions for using the RSA Key Encapsulation Mechanism (RSA-KEM) algorithm with CMS using KEMRecipientInfo structure. RSA-KEM is a one-pass key transport mechanism providing higher security assurance than PKCS #1 v1.5.
- **PQC Algorithms Covered**: None detected (RSA-KEM is not post-quantum secure, but the document frames it as alternative to traditional RSA schemes)
- **Quantum Threats Addressed**: None explicitly detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: None explicitly; Bodies: IETF, Internet Engineering Task Force, NIST, ISO/IEC
- **Leaders Contributions Mentioned**: Russ Housley (Vigil Security), Sean Turner (sn3rd)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: CMS, enveloped-data, authenticated-data, authenticated-enveloped-data, RSA-KEM
- **Infrastructure Layers**: Key management, cryptographic message syntax
- **Standardization Bodies**: IETF, Internet Engineering Task Force, NIST, ISO/IEC, ITU-T, ASC X9
- **Compliance Frameworks Referenced**: RFC 2119 (BCP 14), RFC 5652 (CMS), RFC 5083, RFC 5280, RFC 8017 (PKCS #1), RFC 9629 (KEMRecipientInfo), ISO/IEC 18033-2:2006, ANS X9.44, NIST SP 800-57

---

## RFC 9708

- **Reference ID**: RFC 9708
- **Title**: Use of the HSS/LMS Hash-Based Signature Algorithm in CMS
- **Authors**: IETF LAMPS
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Standards Track
- **Main Topic**: Specifies conventions for using Hierarchical Signature System (HSS) / Leighton-Micali Signature (LMS) hash-based signature algorithm with CMS. HSS/LMS is a post-quantum-secure digital signature providing protection against quantum computers and suitable for firmware protection.
- **PQC Algorithms Covered**: HSS/LMS (Hierarchical Signature System / Leighton-Micali Signature), Merkle Tree Signature (MTS), LM-OTS (Leighton-Micali One-Time Signature)
- **Quantum Threats Addressed**: CRQC, Post-Quantum, quantum computers, cryptographically relevant quantum computers (CRQCs)
- **Migration Timeline Info**: Milestones: None detected (but documents post-quantum migration as future need)
- **Applicable Regions / Bodies**: Regions: None explicitly; Bodies: IETF, Internet Engineering Task Force, NIST
- **Leaders Contributions Mentioned**: Russ Housley (Vigil Security); acknowledged: Joe Clarke, Roman Danyliw, Scott Fluhrer, Jonathan Hammell, Ben Kaduk, Panos Kampanakis, Barry Leiba, John Mattsson, Jim Schaad, Sean Turner, Daniel Van Geest, Dale Worley
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: CMS, HSS/LMS, hash-based signatures
- **Infrastructure Layers**: Digital signature schemes, firmware protection, software update mechanisms
- **Standardization Bodies**: IETF, Internet Engineering Task Force, NIST, ITU-T
- **Compliance Frameworks Referenced**: RFC 2119 (BCP 14), RFC 5652 (CMS), RFC 5280, RFC 5911, RFC 5912, RFC 6268, RFC 4086 (randomness), RFC 4108 (firmware protection)

---

## RFC 9794

- **Reference ID**: RFC 9794
- **Title**: Terminology for Post-Quantum Traditional Hybrid Schemes
- **Authors**: IETF PQUIP
- **Publication Date**: 2025-06-01
- **Last Updated**: 2025-06-01
- **Document Status**: Informational
- **Quality Gate:** ACTUAL CONTENT
- **Main Topic**: RFC 9794 defines standardized terminology for post-quantum/traditional (PQ/T) hybrid cryptographic schemes, addressing terminology consistency across protocols and standards during the transition to quantum-resistant algorithms.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA
- **Quantum Threats Addressed**: CRQC, Shor's Algorithm, Post-Quantum
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NIST, ETSI, IETF
- **Leaders Contributions Mentioned**: Florence Driscoll, Michael Parsons, Britta Hale, Mike Ounsworth, John Gray, Tim Hollebeek, Wang Guilin, Rebecca Guthrie, Stephen Farrell, Paul Hoffman, Sofía Celi
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, IKEv2, CMS, RFC 9180, RFC 9370, RFC 9763
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: IETF, NIST, ETSI
- **Compliance Frameworks Referenced**: None detected

---

## RFC 9802

- **Reference ID**: RFC 9802
- **Title**: Use of HSS and XMSS Hash-Based Signature Algorithms in X.509 PKI
- **Authors**: IETF LAMPS
- **Publication Date**: 2025-06-01
- **Last Updated**: 2025-06-01
- **Document Status**: Proposed Standard
- **Quality Gate:** ACTUAL CONTENT
- **Main Topic**: RFC 9802 specifies algorithm identifiers and ASN.1 encoding formats for stateful hash-based signature schemes (HSS, XMSS, XMSS MT) for use in X.509 PKI, particularly for firmware signing, software signing, and CA certificates where signature counts are predictable.
- **PQC Algorithms Covered**: HSS, XMSS, XMSS MT, Merkle tree signatures
- **Quantum Threats Addressed**: Post-Quantum
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Germany, United States; Bodies: BSI, CryptoNext Security, Cisco, Entrust, NIST
- **Leaders Contributions Mentioned**: Dirk van Geest, Kaveh Bashiri, Scott Fluhrer, Stephan Gazdag, Stefan Kousidis
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509, TLS, CMS, CRMF
- **Infrastructure Layers**: PKI
- **Standardization Bodies**: IETF, NIST, ITU-T
- **Compliance Frameworks Referenced**: FIPS, ANSSI, BSI

---

## RFC 9810

- **Reference ID**: RFC 9810
- **Title**: Certificate Management Protocol (CMP) Updates for KEM
- **Authors**: IETF LAMPS
- **Publication Date**: 2025-07-01
- **Last Updated**: 2025-07-01
- **Document Status**: Standards Track
- **Quality Gate:** ACTUAL CONTENT
- **Main Topic**: RFC 9810 describes the Internet X.509 PKI Certificate Management Protocol (CMP) for certificate creation and management, with added support for KEM public keys, EnvelopedData, and post-quantum algorithm considerations.
- **PQC Algorithms Covered**: KEM algorithms, stateless signatures, ML-KEM support
- **Quantum Threats Addressed**: Post-Quantum
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Germany, United States, Canada; Bodies: Siemens, Entrust, NIST
- **Leaders Contributions Mentioned**: Hendrik Brockhaus, Dieter von Oheimb, Mike Ounsworth, John Gray
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: CMP, TLS, DTLS, IPsec, IKE, PKI, X.509
- **Infrastructure Layers**: PKI, Registration Authority, Certification Authority
- **Standardization Bodies**: IETF, NIST, ITU-T, ISO/IEC
- **Compliance Frameworks Referenced**: CT Logs, Certificate Transparency

---

## RFC 9814

- **Reference ID**: RFC 9814
- **Title**: Use of SLH-DSA in CMS
- **Authors**: IETF LAMPS
- **Publication Date**: 2025-07-19
- **Last Updated**: 2025-07-19
- **Document Status**: Proposed Standard
- **Quality Gate:** ACTUAL CONTENT
- **Main Topic**: RFC 9814 specifies conventions for using the SLH-DSA stateless hash-based signature algorithm with the Cryptographic Message Syntax (CMS), including algorithm identifiers and public key syntax with three security levels.
- **PQC Algorithms Covered**: SLH-DSA, hash-based signatures, WOTS+, FORS
- **Quantum Threats Addressed**: CRQC, Post-Quantum, Grover's Algorithm
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: Vigil Security, Cisco, Amazon Web Services, Cloudflare, NIST
- **Leaders Contributions Mentioned**: Russ Housley, Scott Fluhrer, Panos Kampanakis, Bas Westerbaan, Mike Ounsworth, Tomas Gustavsson, Daniel Van Geest, Carl Wallace
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: CMS, TLS, X.509, S/MIME
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST, IETF, ITU-T
- **Compliance Frameworks Referenced**: FIPS 205, FIPS 180, FIPS 202

---

## RFC 9858

- **Reference ID**: RFC 9858
- **Title**: Additional Parameter Sets for HSS/LMS Hash-Based Signatures
- **Authors**: IETF CFRG
- **Publication Date**: 2025-04-01
- **Last Updated**: 2025-04-01
- **Document Status**: Standards Track
- **Quality Gate:** ACTUAL CONTENT
- **Main Topic**: RFC 9858 extends HSS/LMS stateful hash-based signatures with additional parameter sets using alternative hash functions (SHA-256/192, SHAKE256/256, SHAKE256/192) to reduce signature sizes and increase cryptodiversity.
- **PQC Algorithms Covered**: HSS/LMS, LM-OTS, hash-based signatures, SHAKE256, SHA-256
- **Quantum Threats Addressed**: Post-Quantum, Grover's Algorithm
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: Cisco, NIST
- **Leaders Contributions Mentioned**: Scott Fluhrer, Quynh Dang, Carsten Bormann, Russ Housley, Andrey Jivsov, Mallory Knodel, Virendra Kumar, Thomas Pornin, Stanislav Smyshlyaev
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST, IETF, IRTF
- **Compliance Frameworks Referenced**: NIST SP 800-208

---

## RFC 9881

- **Reference ID**: RFC 9881
- **Title**: Algorithm Identifiers for ML-DSA in X.509 PKI
- **Authors**: IETF LAMPS
- **Publication Date**: 2022-06-03
- **Last Updated**: 2025-10-29
- **Document Status**: Proposed Standard
- **Status**: ACTUAL CONTENT
- **Main Topic**: Specifies conventions for using FIPS 204 Module-Lattice-Based Digital Signature Algorithm (ML-DSA) in Internet X.509 public key infrastructure certificates and Certificate Revocation Lists (CRLs).
- **PQC Algorithms Covered**: ML-DSA-44, ML-DSA-65, ML-DSA-87
- **Quantum Threats Addressed**: Post-Quantum (CRQC — Cryptographically Relevant Quantum Computer)
- **Migration Timeline Info**: Milestones: October 2025 | RFC published
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NIST (National Institute of Standards and Technology), IETF (Internet Engineering Task Force)
- **Leaders Contributions Mentioned**: J. Massimo (AWS), P. Kampanakis (AWS), S. Turner (sn3rd), B. E. Westerbaan (Cloudflare)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509 certificates, CRLs, PKIX, ASN.1
- **Infrastructure Layers**: Public Key Infrastructure (PKI), Certificate Authority operations, digital signature infrastructure
- **Standardization Bodies**: NIST, IETF, ITU-T
- **Compliance Frameworks Referenced**: FIPS 204, BCP 14, BCP 78, RFC 2119, RFC 5280, RFC 5912, RFC 5958, RFC 8174

---

## RFC 9882

- **Reference ID**: RFC 9882
- **Title**: Use of ML-DSA in CMS
- **Authors**: IETF LAMPS
- **Publication Date**: 2025-10-29
- **Last Updated**: 2025-10-29
- **Document Status**: Standards Track
- **Status**: ACTUAL CONTENT
- **Main Topic**: Specifies conventions for using ML-DSA signature algorithm with the Cryptographic Message Syntax (CMS), defining algorithm identifier syntax and signed-data conventions for post-quantum digital signatures.
- **PQC Algorithms Covered**: ML-DSA-44, ML-DSA-65, ML-DSA-87, SLH-DSA (mentioned as alternative)
- **Quantum Threats Addressed**: Post-Quantum, CRQC (Cryptographically Relevant Quantum Computer)
- **Migration Timeline Info**: Milestones: October 2025 | RFC published; August 2024 | FIPS 204 standardized
- **Applicable Regions / Bodies**: Regions: United Kingdom, Multiple; Bodies: NIST, UK National Cyber Security Centre, IETF
- **Leaders Contributions Mentioned**: B. Salter (UK National Cyber Security Centre), A. Raine (UK National Cyber Security Centre), D. Van Geest (CryptoNext Security)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: CMS (Cryptographic Message Syntax), S/MIME, CMS SignerInfo, EdDSA, KEMTLS
- **Infrastructure Layers**: Message authentication infrastructure, digital signature in messaging systems, certificate-based communications
- **Standardization Bodies**: NIST, IETF, ITU-T
- **Compliance Frameworks Referenced**: FIPS 204, FIPS 205, FIPS 180, BCP 14, RFC 2119, RFC 5652, RFC 5754, RFC 5911, RFC 6211, RFC 8174, RFC 8419, RFC 9814

---

## Radboud-MTC-Thesis-2025

- **Reference ID**: Radboud-MTC-Thesis-2025
- **Title**: Implementation and Analysis of Merkle Tree Certificates for Post-Quantum Secure Authentication in TLS
- **Authors**: M. Pohl (Radboud University)
- **Publication Date**: 2025-06-01
- **Last Updated**: 2025-06-01
- **Document Status**: Published
- **Status**: ACTUAL CONTENT
- **Main Topic**: Academic thesis analyzing Merkle Tree Certificates (MTCs) as an optimization to X.509 PKI for post-quantum secure TLS authentication, with implementation in the Rustls library demonstrating transmission efficiency and CPU usage improvements.
- **PQC Algorithms Covered**: ML-DSA (CRYSTALS-Dilithium), SLH-DSA, NIST-standardized post-quantum signatures
- **Quantum Threats Addressed**: Post-Quantum, Quantum computers, Harvest now decrypt later attacks
- **Migration Timeline Info**: Milestones: October 2024 | Firefox telemetry shows 83% HTTPS adoption; January 2025 | Thesis completion; Late 2024 | FN-DSA draft expected; 2025 | Let's Encrypt OCSP gradual end
- **Applicable Regions / Bodies**: Regions: Netherlands; Bodies: Radboud University Nijmegen, IETF (Internet-Draft), NIST, Let's Encrypt, Mozilla Firefox, Apple
- **Leaders Contributions Mentioned**: Maximilian Pohl (author), Bart Mennink (supervisor), Peter Schwabe (second reader), Marlon Baeten (daily supervisor)
- **PQC Products Mentioned**: Rustls (TLS library implementation), Mozilla Firefox, Apple, Let's Encrypt
- **Protocols Covered**: TLS 1.3, HTTPS, KEMTLS, X.509 certificates, Merkle Trees, OCSP, ACME, Certificate Transparency
- **Infrastructure Layers**: TLS/HTTPS, PKI, Certificate Authority, client-server authentication, domain name binding
- **Standardization Bodies**: NIST, IETF, Mozilla, Apple, Let's Encrypt
- **Compliance Frameworks Referenced**: FIPS 204, FIPS 205, TLS standards, X.509, IETF Internet-Drafts

---

## SEC2-v2

- **Reference ID**: SEC2-v2
- **Title**: SEC 2 v2: Recommended Elliptic Curve Domain Parameters
- **Authors**: Standards for Efficient Cryptography Group (SECG)
- **Publication Date**: 2010-01-27
- **Last Updated**: 2010-01-27
- **Document Status**: Final Standard
- **Status**: ACTUAL CONTENT
- **Main Topic**: Standards for Efficient Cryptography (SEC 2) document specifying recommended elliptic curve domain parameters for cryptographic operations over prime fields (Fp) and binary fields (F2m).
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Milestones: January 27, 2010 | Version 2.0 published (pre-quantum era standard)
- **Applicable Regions / Bodies**: Regions: Canada (Certicom); Bodies: Certicom Research
- **Leaders Contributions Mentioned**: Daniel R. L. Brown (Certicom Research, contact)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Elliptic Curve Cryptography (ECC), domain parameters over Fp and F2m, secp192k1, secp192r1, secp224k1, secp224r1, secp256k1, secp256r1, secp384r1, secp521r1, sect163k1, sect163r1, sect163r2, sect233k1, sect233r1, sect239k1, sect283k1
- **Infrastructure Layers**: Classical public-key cryptography infrastructure, elliptic curve standards
- **Standardization Bodies**: Certicom, Standards for Efficient Cryptography group
- **Compliance Frameworks Referenced**: SEC 2, intellectual property licensing (Certicom Copyright)

---

## draft-ietf-cose-falcon-03

- **Reference ID**: draft-ietf-cose-falcon-03
- **Title**: FN-DSA for JOSE and COSE
- **Authors**: IETF COSE WG
- **Publication Date**: 2025-10-12
- **Last Updated**: 2025-10-12
- **Document Status**: Internet-Draft
- **Main Topic**: Specifies JSON Object Signing and Encryption (JOSE) and CBOR Object Signing and Encryption (COSE) serializations for FN-DSA (Falcon), a post-quantum lattice-based digital signature algorithm standardized in NIST FIPS 206.
- **PQC Algorithms Covered**: FN-DSA (Falcon), FN-DSA-512, FN-DSA-1024
- **Quantum Threats Addressed**: Post-Quantum
- **Migration Timeline Info**: Milestones: NIST FIPS 206 expected publication late 2026 early 2027
- **Applicable Regions / Bodies**: Regions: US; Bodies: NIST, IETF (COSE WG)
- **Leaders Contributions Mentioned**: Michael Prorock, Orie Steele, Hannes Tschofenig, David Balenson, Michael B. Jones, Rafael Misoczki, Michael Osborne, Christine Cloostermans
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: JOSE (JSON Web Signature), COSE (CBOR Object Signing and Encryption), RFC 7515, RFC 9052, RFC 9053
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST, IETF, IANA
- **Compliance Frameworks Referenced**: US NIST FIPS 206, RFC 2119, RFC 8174

---

## draft-ietf-ipsecme-ikev2-mlkem

- **Reference ID**: draft-ietf-ipsecme-ikev2-mlkem
- **Title**: Post-quantum Hybrid Key Exchange with ML-KEM in IKEv2
- **Authors**: IETF IPSECME WG
- **Publication Date**: 2023-11-01
- **Last Updated**: 2025-09-29
- **Document Status**: Internet-Draft
- **Main Topic**: Specifies how to use ML-KEM (Module-Lattice-Based Key-Encapsulation Mechanism) in IKEv2 for post-quantum hybrid key exchanges, supporting both standalone and combined traditional/quantum-resistant algorithms for IPsec encryption.
- **PQC Algorithms Covered**: ML-KEM, ML-KEM-512, ML-KEM-768, ML-KEM-1024
- **Quantum Threats Addressed**: CRQC (Cryptographically Relevant Quantum Computer)
- **Migration Timeline Info**: Milestones: NIST standardized ML-KEM in 2024 | FIPS 203 published August 2024
- **Applicable Regions / Bodies**: Regions: US; Bodies: NIST, IETF (IPSECME WG)
- **Leaders Contributions Mentioned**: Panos Kampanakis, Valery Smyslov, Graham Bartlett, Scott Fluhrer, Leonie Bruckert, Tero Kivinen, Rebecca Guthrie, Wang Guilin, Michael Richardson, John Mattsson, Gerardo Ravago, Chris Patton
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: IKEv2, IPsec, IKE_SA_INIT, IKE_INTERMEDIATE, CREATE_CHILD_SA, IKE_FOLLOWUP_KE
- **Infrastructure Layers**: IPsec/VPN
- **Standardization Bodies**: NIST, IETF, IANA, RFC Editor
- **Compliance Frameworks Referenced**: FIPS 203, RFC 7296, RFC 9370, RFC 9242, RFC 8784, RFC 9794, NIST SP 800-227

---

## draft-ietf-lamps-cms-kyber-13

- **Reference ID**: draft-ietf-lamps-cms-kyber-13
- **Title**: Use of ML-KEM in the Cryptographic Message Syntax (CMS)
- **Authors**: IETF LAMPS
- **Publication Date**: 2023-01-10
- **Last Updated**: 2025-09-23
- **Document Status**: RFC 9936 Pending (AUTH48)
- **Main Topic**: Specifies conventions for using ML-KEM in the Cryptographic Message Syntax (CMS) through the KEMRecipientInfo structure, covering envelope data, authenticated data, and authenticated-enveloped data content types with three parameter sets (ML-KEM-512, ML-KEM-768, ML-KEM-1024).
- **PQC Algorithms Covered**: ML-KEM, ML-KEM-512, ML-KEM-768, ML-KEM-1024
- **Quantum Threats Addressed**: Post-Quantum
- **Migration Timeline Info**: Milestones: NIST standardized ML-KEM in FIPS 203 August 2024
- **Applicable Regions / Bodies**: Regions: US; Bodies: NIST, IETF (LAMPS WG)
- **Leaders Contributions Mentioned**: Julien Prat, Mike Ounsworth, Daniel Van Geest, Carl Wallace, Jonathan Hammel, Sean Turner, Philippe Cece, Russ Housley
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: CMS (Cryptographic Message Syntax), RFC 5652, RFC 5083, KEMRecipientInfo, HKDF, AES-Wrap
- **Infrastructure Layers**: Email/Messaging (S/MIME)
- **Standardization Bodies**: NIST, IETF, IANA, ITU-T
- **Compliance Frameworks Referenced**: FIPS 203, RFC 9629, RFC 5869, RFC 8619, NIST SP 800-57pt1r5, CMVP

---

## draft-ietf-lamps-kyber-certificates-11

- **Reference ID**: draft-ietf-lamps-kyber-certificates-11
- **Title**: Internet X.509 PKI — Algorithm Identifiers for ML-KEM
- **Authors**: IETF LAMPS
- **Publication Date**: 2022-06-03
- **Last Updated**: 2025-07-22
- **Document Status**: Internet-Draft (RFC Ed Queue, AUTH48)
- **Main Topic**: Specifies conventions for using ML-KEM in X.509 Public Key Infrastructure (PKIX) certificates at three security levels, defining algorithm identifiers, subject public key encoding, key usage, and private key formats for digital certificates.
- **PQC Algorithms Covered**: ML-KEM, ML-KEM-512, ML-KEM-768, ML-KEM-1024
- **Quantum Threats Addressed**: Post-Quantum
- **Migration Timeline Info**: Milestones: NIST standardized ML-KEM in FIPS 203 August 2024
- **Applicable Regions / Bodies**: Regions: US; Bodies: NIST, IETF (LAMPS WG)
- **Leaders Contributions Mentioned**: Sean Turner, Panos Kampanakis, Jake Massimo, Bas Westerbaan, Mallory Knodel, Russ Housley
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509 PKIX, RFC 5280, RFC 5912, RFC 5958, ASN.1 encoding
- **Infrastructure Layers**: PKI/Certificates
- **Standardization Bodies**: NIST, IETF, IANA, ITU-T
- **Compliance Frameworks Referenced**: FIPS 203, RFC 5280, RFC 9629, NIST FIPS 205, NIST PQC Project

---

## draft-ietf-lamps-pq-composite-kem-12

- **Reference ID**: draft-ietf-lamps-pq-composite-kem-12
- **Title**: Composite ML-KEM for Use in X.509 PKI and CMS
- **Authors**: IETF LAMPS
- **Publication Date**: 2023-03-02
- **Last Updated**: 2026-01-08
- **Document Status**: Internet-Draft (In WG Last Call)
- **Quality Gate: ACTUAL CONTENT**
- **Main Topic**: Defines hybrid ML-KEM with RSA-OAEP, ECDH, X25519/X448 for X.509 PKI use, enabling protocol-backward-compatible PQ/T hybrid key encapsulation.
- **PQC Algorithms Covered**: ML-KEM-768, ML-KEM-1024, RSA-OAEP (hybrid component)
- **Quantum Threats Addressed**: Shor's Algorithm, quantum computing threat to RSA/ECDH, Post-Quantum
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: US, Germany, France (via author affiliations); Bodies: IETF LAMPS WG, NIST
- **Leaders Contributions Mentioned**: Mike Ounsworth, John Gray, Massimiliano Pala, Jan Klaußner, Scott Fluhrer
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509, PKIX, PKCS#10, CMP, CMS, RFC5280, RFC5652, RFC5914
- **Infrastructure Layers**: Public Key Infrastructure (PKI), key encapsulation mechanism (KEM)
- **Standardization Bodies**: IETF, NIST (FIPS.203), ISO/IEC standards referenced
- **Compliance Frameworks Referenced**: FIPS certification, FIPS.203 (ML-KEM), BSI guidance, ANSSI guidance

---

## draft-ietf-lamps-pq-composite-sigs-14

- **Reference ID**: draft-ietf-lamps-pq-composite-sigs-14
- **Title**: Composite ML-DSA for Use in X.509 PKI and CMS
- **Authors**: IETF LAMPS
- **Publication Date**: 2023-03-02
- **Last Updated**: 2026-01-07
- **Document Status**: Internet-Draft (In IETF Last Call)
- **Quality Gate: ACTUAL CONTENT**
- **Main Topic**: Defines hybrid ML-DSA composite signatures with RSASSA-PSS/PKCSv1.5, ECDSA, Ed25519/Ed448 for X.509 PKI; enables hybrid-aware signature schemes meeting regulatory guidelines.
- **PQC Algorithms Covered**: ML-DSA-44, ML-DSA-65, ML-DSA-87, Ed25519, Ed448, RSASSA-PSS, RSASSA-PKCSv1.5, ECDSA
- **Quantum Threats Addressed**: Shor's Algorithm, quantum computing threat to RSA/ECDSA, Post-Quantum, CRQC
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: US, Germany, France (via author affiliations); Bodies: IETF LAMPS WG, NIST
- **Leaders Contributions Mentioned**: Mike Ounsworth, John Gray, Massimiliano Pala, Jan Klaußner, Scott Fluhrer, Russ Housley
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509, PKIX, PKCS#10, CMP, CMS, RFC5280, RFC5652, RFC5914, RFC9810
- **Infrastructure Layers**: Public Key Infrastructure (PKI), digital signature schemes, certificate validation
- **Standardization Bodies**: IETF, NIST (FIPS.204), ISO/IEC, BSI, ANSSI
- **Compliance Frameworks Referenced**: FIPS.204 (ML-DSA), BSI/ANSSI hybrid requirements, EUF-CMA security, FIPS certification

---

## draft-ietf-openpgp-pqc-17

- **Reference ID**: draft-ietf-openpgp-pqc-17
- **Title**: Post-Quantum Cryptography in OpenPGP
- **Authors**: IETF OpenPGP WG
- **Publication Date**: 2023-07-01
- **Last Updated**: 2026-01-13
- **Document Status**: Internet-Draft (Submitted to IESG)
- **Quality Gate: ACTUAL CONTENT**
- **Main Topic**: Extends OpenPGP (RFC9580) with PQC support: composite ML-KEM+ECDH encryption, composite ML-DSA+EdDSA signatures, standalone SLH-DSA for long-term secure messages.
- **PQC Algorithms Covered**: ML-KEM-768, ML-KEM-1024, ML-DSA-65, ML-DSA-87, SLH-DSA (SHAKE-128s/128f/256s variants), EdDSA (Ed25519, Ed448), X25519, X448
- **Quantum Threats Addressed**: CRQC, Post-Quantum, store-and-decrypt attacks, quantum computing threats
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Germany, Switzerland, US; Bodies: IETF OpenPGP WG, NIST
- **Leaders Contributions Mentioned**: Stavros Kousidis, Johannes Roth, Falko Strenzke, Aron Wussler, Daniel Kahn Gillmor
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: OpenPGP (RFC9580, RFC9162), CMS/PKIX structures, AES-256 key wrap (RFC3394)
- **Infrastructure Layers**: OpenPGP message format, public key encryption, digital signatures, certificate transparency
- **Standardization Bodies**: IETF, NIST (FIPS.203, FIPS.204, FIPS.205), BSI guidance
- **Compliance Frameworks Referenced**: NIST FIPS (203, 204, 205), NISTIR-8413 (NIST PQC selection)

---

## draft-ietf-pquip-hbs-state

- **Quality Gate: ACTUAL CONTENT**
- **Main Topic**: Guidance on operational and technical state/backup management for stateful hash-based signatures (LMS, HSS, XMSS, XMSS^MT) to prevent OTS key reuse and security failures.
- **PQC Algorithms Covered**: LMS, HSS, XMSS, XMSS^MT, SLH-DSA (stateless alternative), ML-DSA (stateless alternative)
- **Quantum Threats Addressed**: Post-Quantum, quantum-resistant signature schemes, CRQC
- **Migration Timeline Info**: Milestones: Long-term deployment considerations | 10-20+ year lifetimes mentioned for automotive/aerospace
- **Applicable Regions / Bodies**: Regions: UK, US, Germany; Bodies: IETF PQUIP WG, NIST, NSA, ETSI
- **Leaders Contributions Mentioned**: Thom Wiggers, Kaveh Bashiri, Stefan Kölbl, Jim Goodman, Stavros Kousidis, Paul Hoffman
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected (operational/procedural guidance document)
- **Infrastructure Layers**: Hardware security modules (HSM), cryptographic modules, key management, firmware/software signing, IoT ecosystems
- **Standardization Bodies**: IETF, NIST, ETSI, NSA, SUIT WG
- **Compliance Frameworks Referenced**: NIST SP-800-208, RFC8391, RFC8554, RFC9802, NSA CNSA 2.0, ETSI TR-103-692

---

## draft-ietf-pquip-hybrid-signature-spectrums-06

- **Reference ID**: draft-ietf-pquip-hybrid-signature-spectrums-06
- **Title**: Hybrid signature spectrums
- **Authors**: IETF PQUIP
- **Publication Date**: 2024-03-01
- **Last Updated**: 2025-01-15
- **Document Status**: Internet-Draft
- **Quality Gate: ACTUAL CONTENT**
- **Main Topic**: Classifies hybrid digital signature design goals and security properties (composability, non-separability, backwards-compatibility) across spectrum of hybrid approaches (concatenation, nesting, fusion).
- **PQC Algorithms Covered**: ML-DSA, Falcon, Rainbow, GeMSS, SLH-DSA, RSA, ECDSA, EdDSA (general framework, not algorithm-specific)
- **Quantum Threats Addressed**: CRQC, store-and-decrypt attacks, quantum computing transition
- **Migration Timeline Info**: Milestones: Long-term system migrations | root certificates with 20+ year validity | future checks on past authenticity
- **Applicable Regions / Bodies**: Regions: US, UK; Bodies: IETF PQUIP WG, NIST
- **Leaders Contributions Mentioned**: Nina Bindel, Britta Hale, Deirdre Connolly, Flo Driscoll, Paul Hoffman
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected (design framework document)
- **Infrastructure Layers**: Public key infrastructure, certificate chains, protocol-level authentication, system policy
- **Standardization Bodies**: IETF, NIST (NIST Post-Quantum Cryptography Standardization Project), BSI guidance
- **Compliance Frameworks Referenced**: EUF-CMA (existential unforgeability), SUF-CMA (strong unforgeability), NIST QRCSP (Round 1/2 attacks)

---

## draft-ietf-pquip-pqc-engineers-14

- **Reference ID**: draft-ietf-pquip-pqc-engineers-14
- **Title**: Post-Quantum Cryptography for Engineers
- **Authors**: IETF PQUIP
- **Publication Date**: 2023-07-06
- **Last Updated**: 2025-08-26
- **Document Status**: Internet-Draft
- **Status:** ACTUAL CONTENT
- **Main Topic**: Comprehensive educational guide for engineers on post-quantum cryptography fundamentals, including CRQC threats, NIST/ISO PQC algorithms, implementation challenges, and transition strategies from classical to quantum-resistant systems.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, FN-DSA, SLH-DSA, HQC, FrodoKEM, ClassicMcEliece, NTRU, Kyber (predecessor), Dilithium (predecessor), SPHINCS, XMSS, LMS, HSS/LMS
- **Quantum Threats Addressed**: CRQC, Shor's Algorithm, Grover's Algorithm, Harvest Now Decrypt Later (HNDL), Post-Quantum
- **Migration Timeline Info**: Milestones: Organizations should begin transitioning immediately for long-lived sensitive data; migration timeline (y) includes hardware replacement, testing, auditing, certification delays; phased approach recommended starting with hybrid key exchange
- **Applicable Regions / Bodies**: Regions: United States, Germany, France; Bodies: NIST (National Security Agency), BSI (German Federal Office for Information Security), ANSSI (French National Agency for the Security of Information Systems), CNSA 2.0, ISO
- **Leaders Contributions Mentioned**: Peter Shor, Lov Grover, Christof Zalka, Daniel J. Bernstein, Tanja Lange, Matt Campagna
- **PQC Products Mentioned**: OpenSSL, HSMs, TEEs, Secure Enclaves, smartcards
- **Protocols Covered**: TLS, SSH, Certificate Management Protocols, HPKE (Hybrid Public Key Encryption)
- **Infrastructure Layers**: Cryptographic libraries, Network security, Certificate infrastructure, Hardware security modules, Smartcard systems, Key management systems
- **Standardization Bodies**: NIST (National Institute of Standards and Technology), ISO (International Organization for Standardization), IETF (Internet Engineering Task Force), CFRG (Crypto Forum Research Group)
- **Compliance Frameworks Referenced**: NIST FIPS standards, ANSSI recommendations, CNSA 2.0 guidelines, NIST SP 800-90 (randomness), NSA national security algorithm requirements

---

## draft-ietf-tls-ecdhe-mlkem-04

- **Reference ID**: draft-ietf-tls-ecdhe-mlkem-04
- **Title**: Post-quantum hybrid ECDHE-MLKEM Key Agreement for TLSv1.3
- **Authors**: IETF TLS WG
- **Publication Date**: 2024-03-01
- **Last Updated**: 2026-02-08
- **Document Status**: Internet-Draft (Standards Track)
- **Status:** ACTUAL CONTENT
- **Main Topic**: Defines three hybrid post-quantum/traditional key agreement mechanisms for TLS 1.3 combining ML-KEM with ECDH algorithms (X25519MLKEM768, SecP256r1MLKEM768, SecP384r1MLKEM1024) to enable incremental PQC adoption while maintaining classical security guarantees.
- **PQC Algorithms Covered**: ML-KEM-768, ML-KEM-1024
- **Quantum Threats Addressed**: Post-Quantum, CRQC, Harvest Now Decrypt Later (HNDL)
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NIST, FIPS
- **Leaders Contributions Mentioned**: Kris Kwiatkowski, Panos Kampanakis, Bas Westerbaan, Douglas Stebila
- **PQC Products Mentioned**: PQShield, AWS, Cloudflare, University of Waterloo implementations
- **Protocols Covered**: TLS 1.3, X25519 (Curve25519), secp256r1 (NIST P-256), secp384r1 (NIST P-384), ECDHE, HKDF, DTLS
- **Infrastructure Layers**: Transport Layer Security, Key establishment, Cryptographic protocols
- **Standardization Bodies**: NIST (FIPS-203, SP 800-56A, SP 800-56C, SP 800-135, SP 800-227), IETF (RFC standards), IANA
- **Compliance Frameworks Referenced**: NIST FIPS-203 (ML-KEM standard), NIST SP 800-56C (key derivation), NIST SP 800-135 (application-specific KDF), NIST SP 800-227 (KEM guidance)

---

## draft-ietf-tls-hybrid-design-16

- **Reference ID**: draft-ietf-tls-hybrid-design-16
- **Title**: Hybrid key exchange in TLS 1.3
- **Authors**: IETF TLS WG
- **Publication Date**: 2020-08-01
- **Last Updated**: 2025-09-07
- **Document Status**: Internet-Draft
- **Status:** ACTUAL CONTENT
- **Main Topic**: Defines generic framework and construction for hybrid key exchange in TLS 1.3 combining two or more key exchange algorithms (traditional and post-quantum) simultaneously via concatenation approach to maintain security if one component algorithm is broken.
- **PQC Algorithms Covered**: ML-KEM (referenced in examples), post-quantum algorithms generically, Kyber (pre-standard references in revision history)
- **Quantum Threats Addressed**: Post-Quantum, CRQC, Harvest-Now-Decrypt-Later (retroactive decryption), cryptanalytic breakthrough
- **Migration Timeline Info**: Milestones: None detected — framework document; specific timelines in complementary standards
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NIST, IETF
- **Leaders Contributions Mentioned**: Douglas Stebila, Scott Fluhrer, Shay Gueron, Christopher Wood, Matt Campagna, Eric Crockett, Deirdre Connolly, Daniel J. Bernstein, Tanja Lange, Nimrod Aviram
- **PQC Products Mentioned**: Open Quantum Safe (OQS) implementations, Google CECPQ2 project, OQS-OpenSSL variants, OQS Provider for OpenSSL 3
- **Protocols Covered**: TLS 1.3, Diffie-Hellman (DH/ECDH), Key encapsulation mechanisms (KEMs), HPKE, IKEv2, X25519, NIST curves
- **Infrastructure Layers**: Transport Layer Security, Key establishment, Authentication, Protocol design
- **Standardization Bodies**: NIST (FIPS, SP 800 series), IETF (TLS working group, RFC standards), ISO
- **Compliance Frameworks Referenced**: NIST SP 800-56C (key derivation methods), NIST SP 800-135 (KDF recommendations), NIST FIPS-203 (ML-KEM), cryptographic standards from published literature

---

## draft-ietf-tls-mldsa-01

- **Reference ID**: draft-ietf-tls-mldsa-01
- **Title**: ML-DSA for TLS 1.3
- **Authors**: IETF TLS WG
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-09-26
- **Document Status**: Internet-Draft
- **Status:** ACTUAL CONTENT
- **Main Topic**: Specifies ML-DSA (FIPS 204) post-quantum signature scheme usage for authentication in TLS 1.3 via signature_algorithms and signature_algorithms_cert extensions, supporting three parameter sets (ML-DSA-44, ML-DSA-65, ML-DSA-87).
- **PQC Algorithms Covered**: ML-DSA-44, ML-DSA-65, ML-DSA-87
- **Quantum Threats Addressed**: Post-Quantum, CRQC
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NIST, IETF
- **Leaders Contributions Mentioned**: Tim Hollebeek, Sophie Schmieg, Bas Westerbaan, Alicja Kario, John Mattsson, Rebecca Guthrie, Alexander Bokovoy, Niklas Block, Ryan Appel, Loganaden Velvindron
- **PQC Products Mentioned**: DigiCert, Google, Cloudflare (implementations/contributors)
- **Protocols Covered**: TLS 1.3, TLS 1.2 (explicitly excluded), X.509 certificates, Digital signatures, CertificateVerify messages
- **Infrastructure Layers**: Transport Layer Security, Authentication, Certificate infrastructure, Public Key Infrastructure (PKI)
- **Standardization Bodies**: NIST (FIPS 204), IETF (TLS working group, RFC 8446), IANA (signature scheme registry)
- **Compliance Frameworks Referenced**: NIST FIPS 204 (ML-DSA standard), RFC 8446 (TLS 1.3), X.509 algorithm identifiers

---

## draft-ietf-tls-mlkem-07

- **Reference ID**: draft-ietf-tls-mlkem-07
- **Title**: ML-KEM Post-Quantum Key Agreement for TLS 1.3
- **Authors**: IETF TLS WG
- **Publication Date**: 2024-05-01
- **Last Updated**: 2026-02-12
- **Document Status**: Internet-Draft (Revised I-D Needed)
- **Status:** ACTUAL CONTENT
- **Main Topic**: Defines ML-KEM-512, ML-KEM-768, and ML-KEM-1024 as standalone (non-hybrid) post-quantum NamedGroups for TLS 1.3 key establishment, enabling pure PQC key agreement for regulatory frameworks and use cases prioritizing quantum resistance without classical algorithm dependency.
- **PQC Algorithms Covered**: ML-KEM-512, ML-KEM-768, ML-KEM-1024
- **Quantum Threats Addressed**: Post-Quantum, CRQC, quantum-resistant cryptography
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NIST, IETF
- **Leaders Contributions Mentioned**: Deirdre Connolly, Douglas Stebila, Scott Fluhrer, Eric Rescorla, Rebecca Guthrie
- **PQC Products Mentioned**: SandboxAQ (author affiliation)
- **Protocols Covered**: TLS 1.3, Key encapsulation mechanisms (KEMs), HPKE, DTLS
- **Infrastructure Layers**: Transport Layer Security, Key establishment, Lattice-based cryptography
- **Standardization Bodies**: NIST (FIPS 203, SP 800-227), IETF (TLS working group, RFC standards), IANA (Supported Groups registry)
- **Compliance Frameworks Referenced**: NIST FIPS 203 (ML-KEM standard), NIST SP 800-227 (KEM recommendations), RFC 8446 (TLS 1.3), Fujisaki-Okamoto transform (FO) security framework

---

## draft-ietf-uta-pqc-app-00

- **Reference ID**: draft-ietf-uta-pqc-app-00
- **Title**: Post-Quantum Cryptography Recommendations for TLS-based Applications
- **Authors**: IETF UTA
- **Publication Date**: 2025-09-18
- **Last Updated**: 2025-09-18
- **Document Status**: Internet-Draft
- **ACTUAL_CONTENT**
- **Main Topic**: Best practices and recommendations for implementing post-quantum cryptography in TLS-based applications, covering data confidentiality, authentication, and transition strategies.
- **PQC Algorithms Covered**: ML-KEM (ML-KEM-512, ML-KEM-768, ML-KEM-1024), ML-DSA, SLH-DSA, MAYO, UOV, HAWK, SQISign
- **Quantum Threats Addressed**: CRQC, HNDL (Harvest Now Decrypt Later), Post-Quantum, Shor's Algorithm
- **Migration Timeline Info**: Milestones: Immediate action for data confidentiality | Long-term planning for authentication systems | CRQC emergence timeline uncertain
- **Applicable Regions / Bodies**: Regions: None explicit; Bodies: NIST, IETF, IANA
- **Leaders Contributions Mentioned**: Mike Ounsworth, Scott Fluhrer, Russ Housley, Loganaden Velvindron, Bas Westerbaan, Richard Sohn, Andrei Popov, Alan DeKok, Thom Wiggers, Dan Wing, Tirumaleswar Reddy.K, Hannes Tschofenig
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.3, DTLS 1.3, QUIC, DNS-over-HTTPS (DoH), DNS-over-TLS (DoT), DNS-over-QUIC (DoQ), HPKE, Encrypted Client Hello (ECH), DNSSEC
- **Infrastructure Layers**: TLS/DTLS transport layer, application layer (DNS, HPKE), certificate infrastructure (X.509, PKI)
- **Standardization Bodies**: NIST, IETF, IANA
- **Compliance Frameworks Referenced**: FIPS (Federal Information Processing Standard), PCI (Payment Card Industry), NIST PQC Standardization

---

## draft-turner-lamps-cms-fn-dsa-00

- **Reference ID**: draft-turner-lamps-cms-fn-dsa-00
- **Title**: Use of the FN-DSA Signature Algorithm in the Cryptographic Message Syntax (CMS)
- **Authors**: IETF LAMPS
- **Publication Date**: 2025-11-04
- **Last Updated**: 2025-11-04
- **Document Status**: Internet-Draft (Individual Submission)
- **Quality Assessment**: ACTUAL CONTENT
- **Main Topic**: Specifies conventions for using FN-DSA (Fast-Fourier Transform over NTRU-Lattice-Based Digital Signature Algorithm) signature algorithm with CMS for post-quantum cryptographic security in message signing.
- **PQC Algorithms Covered**: FN-DSA-512, FN-DSA-1024, SLH-DSA, ML-DSA, EdDSA
- **Quantum Threats Addressed**: CRQC (Cryptographically Relevant Quantum Computer)
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NIST, IETF, CSOR
- **Leaders Contributions Mentioned**: Daniel Van Geest, Sean Turner
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: CMS (Cryptographic Message Syntax), TLS, S/MIME, X.509
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST, IETF, ITU-T, ISO/IEC
- **Compliance Frameworks Referenced**: FIPS 206, FIPS 205, FIPS 180, FIPS 204, RFC 5652, RFC 8419, RFC 9814, RFC 9881, RFC 9882

---

## draft-wang-ipsecme-hybrid-kem-ikev2-frodo-03

- **Reference ID**: draft-wang-ipsecme-hybrid-kem-ikev2-frodo-03
- **Title**: Post-quantum Hybrid Key Exchange in IKEv2 with FrodoKEM
- **Authors**: IETF IPSECME WG
- **Publication Date**: 2024-12-24
- **Last Updated**: 2026-01-12
- **Document Status**: Internet-Draft (Call for WG Adoption)
- **Quality Assessment**: ACTUAL CONTENT
- **Main Topic**: Specifies how FrodoKEM (unstructured lattice-based KEM) can be instantiated as an additional post-quantum key exchange mechanism in IKEv2 to mitigate harvest-now-and-decrypt-later attacks.
- **PQC Algorithms Covered**: FrodoKEM-976-AES, FrodoKEM-976-SHAKE, FrodoKEM-1344-AES, FrodoKEM-1344-SHAKE, ML-KEM-768, ML-KEM-1024, Classic McEliece
- **Quantum Threats Addressed**: HNDL (harvest-now-and-decrypt-later), CRQC
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Global; Bodies: IETF, NIST, ISO
- **Leaders Contributions Mentioned**: Guilin Wang, Leonie Bruckert, Valery Smyslov
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: IKEv2, RFC 9370, RFC 9242, IKE_INTERMEDIATE, IKE_FOLLOWUP_KE
- **Infrastructure Layers**: IPsec VPN
- **Standardization Bodies**: IETF, NIST, ISO, IANA
- **Compliance Frameworks Referenced**: RFC 7296, RFC 7383, RFC 9370, RFC 9242, RFC 9794, FIPS 203

---

## draft-wang-ipsecme-kem-auth-ikev2-01

- **Reference ID**: draft-wang-ipsecme-kem-auth-ikev2-01
- **Title**: KEM based Authentication for IKEv2 with Post-quantum Security
- **Authors**: IETF Individual Submission
- **Publication Date**: 2025-03-03
- **Last Updated**: 2025-07-07
- **Document Status**: Internet-Draft
- **Quality Assessment**: ACTUAL CONTENT
- **Main Topic**: Proposes KEM-based authentication mechanism for IKEv2 as alternative to signature-based authentication, leveraging ML-KEM efficiency advantage over ML-DSA for post-quantum secure peer authentication.
- **PQC Algorithms Covered**: ML-KEM-512, ML-KEM-768, ML-KEM-1024, ML-DSA-44, ML-DSA-65, ML-DSA-87, SLH-DSA
- **Quantum Threats Addressed**: CRQC, HNDL (harvest-now-and-decrypt-later)
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Global; Bodies: IETF, NIST
- **Leaders Contributions Mentioned**: Guilin Wang, Valery Smyslov
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: IKEv2, TLS 1.3, IKE_SA_INIT, IKE_INTERMEDIATE, IKE_AUTH, RFC 7296, RFC 9242, RFC 9370
- **Infrastructure Layers**: IPsec, TLS
- **Standardization Bodies**: IETF, NIST, IANA
- **Compliance Frameworks Referenced**: FIPS 203, FIPS 204, FIPS 205, RFC 7296, RFC 9242, RFC 9370, RFC 9593, RFC 5280, RFC 9794

---

## draft-yang-tls-hybrid-sm2-mlkem-03

- **Reference ID**: draft-yang-tls-hybrid-sm2-mlkem-03
- **Title**: Hybrid Post-quantum Key Exchange SM2-MLKEM for TLSv1.3
- **Authors**: IETF Individual Submission
- **Publication Date**: 2024-08-01
- **Last Updated**: 2025-11-15
- **Document Status**: Internet-Draft
- **Quality Assessment**: ACTUAL CONTENT
- **Main Topic**: Specifies hybrid key exchange combining SM2 elliptic curve (CurveSM2) with ML-KEM768 for TLS 1.3, introducing NamedGroup curveSM2MLKEM768 for post-quantum security in Chinese domestic applications.
- **PQC Algorithms Covered**: ML-KEM-768, ML-KEM
- **Quantum Threats Addressed**: Post-Quantum (implicit)
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: China; Bodies: IETF, NIST, ISO, China Standardization Administration
- **Leaders Contributions Mentioned**: Paul Yang, Cong Peng, Jin Hu, Shine Sun
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.3, ECDHE, RFC 8446, RFC 8998
- **Infrastructure Layers**: Transport Layer Security (TLS)
- **Standardization Bodies**: IETF, NIST, ISO, China Standardization Administration
- **Compliance Frameworks Referenced**: FIPS 203, RFC 8446, RFC 8998, ISO/IEC 14888-3, GB/T 32918.2-2016, GB/T 32918.5-2016

---

## ISO/IEC 14888-4:2024

- **Reference ID**: ISO/IEC 14888-4:2024
- **Title**: ISO/IEC 14888-4:2024 — Information Security — Digital Signatures with Appendix — Part 4: Stateful Hash-Based Mechanisms
- **Authors**: ISO/IEC JTC 1/SC 27
- **Publication Date**: 2024-06-24
- **Last Updated**: 2024-06-24
- **Document Status**: International Standard
- **Main Topic**: Specifies stateful digital signature mechanisms whose security depends on hash function properties, standardizing both XMSS and LMS/HSS schemes at ISO international level. Also provides state management requirements for the secure deployment of these stateful hash-based signature schemes, complementing NIST SP 800-208 with global ISO/IEC normative status.
- **PQC Algorithms Covered**: XMSS, LMS, HSS, SP 800-208 (LMS/XMSS)
- **Quantum Threats Addressed**: Shor's Algorithm, Post-Quantum
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: International; Bodies: NIST
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: PKI, Code Signing, Key Management
- **Standardization Bodies**: ISO/IEC
- **Compliance Frameworks Referenced**: SP 800-208 (LMS/XMSS)

---

## BIP-141

- **Reference ID**: BIP-141
- **Title**: BIP-141: Segregated Witness (Consensus Layer)
- **Authors**: Eric Lombrozo; Johnson Lau; Pieter Wuille (Bitcoin Core)
- **Publication Date**: 2015-12-21
- **Last Updated**: 2021-10-05
- **Document Status**: Final
- **Main Topic**: Defines Segregated Witness (SegWit) as a Bitcoin consensus soft fork that separates signature data (the witness) from transaction inputs, fixing transaction malleability and enabling an extensible witness versioning system (v0 P2WPKH/P2WSH). The witness versioning mechanism is a prerequisite for Taproot (BIP-341) and future script upgrades including potential quantum-resistant signature schemes (BIP-360).
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Eric Lombrozo, Johnson Lau, Pieter Wuille
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: P2WPKH, P2WSH
- **Infrastructure Layers**: Blockchain
- **Standardization Bodies**: Bitcoin Core
- **Compliance Frameworks Referenced**: None detected

---

## BIP-340

- **Reference ID**: BIP-340
- **Title**: BIP-340: Schnorr Signatures for secp256k1
- **Authors**: Pieter Wuille; Jonas Nick; Tim Ruffing (Bitcoin Core)
- **Publication Date**: 2020-01-19
- **Last Updated**: 2022-03-01
- **Document Status**: Final
- **Main Topic**: Defines a standard for 64-byte Schnorr signatures over the secp256k1 elliptic curve, providing provable security, linear signature aggregation enabling MuSig2 multisignature, and efficient batch verification. Required foundation for Taproot (BIP-341) and the classical signature baseline that hybrid PQC schemes for Bitcoin must eventually replace.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Shor's Algorithm
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Pieter Wuille, Jonas Nick, Tim Ruffing
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Blockchain
- **Standardization Bodies**: Bitcoin Core
- **Compliance Frameworks Referenced**: None detected

---

## BIP-341

- **Reference ID**: BIP-341
- **Title**: BIP-341: Taproot: SegWit Version 1 Spending Rules
- **Authors**: Pieter Wuille; Jonas Nick; Anthony Towns (Bitcoin Core)
- **Publication Date**: 2020-01-19
- **Last Updated**: 2022-03-01
- **Document Status**: Final
- **Main Topic**: Defines SegWit version 1 output spending rules for Bitcoin based on Taproot, Schnorr signatures (BIP-340), and Merklized Abstract Syntax Trees (MAST), activated at block 709632. Provides both a key-spend path and a script-spend path, and its witness versioning (from BIP-141) enables the future upgrade path for quantum-resistant output types (BIP-360 P2QRH).
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Shor's Algorithm
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Pieter Wuille, Jonas Nick, Anthony Towns
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Blockchain
- **Standardization Bodies**: Bitcoin Core
- **Compliance Frameworks Referenced**: None detected

---

## IEEE-802-1AE-2018

- **Reference ID**: IEEE-802-1AE-2018
- **Title**: IEEE 802.1AE-2018: MAC Security (MACsec)
- **Authors**: IEEE 802.1 Working Group
- **Publication Date**: 2006-08-01
- **Last Updated**: 2018-12-01
- **Document Status**: IEEE Standard
- **Main Topic**: Defines MACsec (Media Access Control Security), the IEEE Layer 2 encryption standard for Ethernet networks that provides confidentiality, integrity, and authenticity using AES-GCM-128 or AES-GCM-256 via the MACsec Key Agreement (MKA) protocol. QKD-derived pre-shared keys or PQC-based key establishment can replace traditional MKA to achieve quantum-safe Layer 2 encryption.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest Now Decrypt Later (HNDL), Post-Quantum
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: IEEE
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: IEEE
- **Compliance Frameworks Referenced**: None detected

---

## IETF RFC 4253

- **Reference ID**: IETF RFC 4253
- **Title**: The Secure Shell (SSH) Transport Layer Protocol
- **Authors**: T. Ylonen (SSH Communications Security); C. Lonvick (Cisco Systems)
- **Publication Date**: 2006-01-01
- **Last Updated**: 2006-01-01
- **Document Status**: Standards Track RFC
- **Main Topic**: Defines the SSH transport layer protocol, specifying key exchange, server authentication, encryption, and integrity mechanisms running over TCP/IP. The key exchange phase — where Diffie-Hellman (diffie-hellman-group14-sha1) is specified — is the primary integration point for PQC KEMs and QKD-derived pre-shared keys in post-quantum SSH deployments.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Shor's Algorithm, Harvest Now Decrypt Later (HNDL)
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: IETF
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: SSH
- **Infrastructure Layers**: Key Management, VPN
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: None detected

---

## IETF RFC 8731

- **Reference ID**: IETF RFC 8731
- **Title**: Use of Curve25519 and Curve448 in the Secure Shell (SSH) Protocol
- **Authors**: Aris Adamantiadis; Simon Josefsson; Mark D. Baushke (IETF CURDLE WG)
- **Publication Date**: 2020-02-01
- **Last Updated**: 2020-02-01
- **Document Status**: Standards Track RFC
- **Main Topic**: Specifies the curve25519-sha256 and curve448-sha512 key exchange methods for SSH, formalizing the widely deployed curve25519-sha256@libssh.org method from libssh and OpenSSH. These methods define the classical KEX baseline that hybrid PQC schemes such as mlkem768x25519-sha256 extend to achieve post-quantum SSH key exchange.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Shor's Algorithm, Harvest Now Decrypt Later (HNDL)
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: IETF
- **Leaders Contributions Mentioned**: Aris Adamantiadis, Simon Josefsson
- **PQC Products Mentioned**: libssh, OpenSSH
- **Protocols Covered**: SSH
- **Infrastructure Layers**: Key Management, VPN
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: None detected

---

## GRI-Quantum-Threat-Timeline-2024

- **Reference ID**: GRI-Quantum-Threat-Timeline-2024
- **Title**: 2024 Quantum Threat Timeline Report
- **Authors**: Dr. Michele Mosca (evolutionQ Inc.); Dr. Marco Piani (evolutionQ Inc.); Global Risk Institute
- **Publication Date**: 2024-11-14
- **Last Updated**: 2024-11-14
- **Document Status**: Final Report
- **Main Topic**: Annual expert survey aggregating projections from 32 global experts on the probability and timeline for a cryptographically-relevant quantum computer (CRQC) capable of breaking current public-key encryption. The 2024 edition indicates the threat is closer than previously assessed, with 5–15% probability by 2030, stressing urgency for proactive quantum-safe transitions.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: CRQC (Cryptographically Relevant Quantum Computer), Harvest Now Decrypt Later (HNDL), Shor's Algorithm, Post-Quantum
- **Migration Timeline Info**: Milestones: 5–15% probability of CRQC by 2030 per expert survey | Proactive migration recommended to avoid hasty late adoption
- **Applicable Regions / Bodies**: Bodies: Global Risk Institute
- **Leaders Contributions Mentioned**: Michele Mosca, Marco Piani
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected

---

## India-DST-Quantum-Safe-Roadmap-2026

- **Reference ID**: India-DST-Quantum-Safe-Roadmap-2026
- **Title**: Implementation of Quantum Safe Ecosystem in India — Report of the Task Force
- **Authors**: India Department of Science & Technology (DST); Task Force chaired by Dr. Rajkumar Upadhyay (CEO, C-DOT)
- **Publication Date**: 2026-02-04
- **Last Updated**: 2026-02-04
- **Document Status**: Published
- **Main Topic**: India's national roadmap for transitioning to a quantum-safe cryptographic ecosystem, produced by a DST Task Force under the National Quantum Mission (NQM). The report surveys the global quantum threat landscape, defines India-specific migration timelines for Critical Information Infrastructure, and recommends phased PQC adoption including hybrid PQC-QKD pilots, a National PQC Testing & Certification Program, and indigenous quantum-safe product development.
- **PQC Algorithms Covered**: ML-KEM
- **Quantum Threats Addressed**: CRQC (Cryptographically Relevant Quantum Computer), Harvest Now Decrypt Later (HNDL), Shor's Algorithm, Grover's Algorithm, Quantum Computer, Post-Quantum
- **Migration Timeline Info**: Milestones: RSA-2048 and ECC-256 deprecated around 2030 per US/global alignment | EU high-risk systems migrated by 2030 | UK high-priority systems migrated by 2031 | Australia critical systems RSA/ECC ceased by end of 2030 | Canada high-priority systems completed by end of 2031 | South Korea nationwide transition by 2035 | India to launch PQC/hybrid pilots in high-priority systems immediately | India NQM budget ₹6003.65 crore for 2023–2031
- **Applicable Regions / Bodies**: Regions: India, United States, European Union, United Kingdom, Australia, Canada, Singapore, South Korea; Bodies: NIST, CISA, NCSC
- **Leaders Contributions Mentioned**: Rajkumar Upadhyay, Kamal Kumar Agarwal, Vinayak Godse
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, QKD
- **Infrastructure Layers**: PKI, Key Management, IoT, Cloud, Satellite, OT/ICS/SCADA, 5G
- **Standardization Bodies**: NIST, CISA, NCSC
- **Compliance Frameworks Referenced**: CCCS ITSM.40.001, ASD ISM

---

## NIST-SP-800-131A-Rev3

- **Reference ID**: NIST-SP-800-131A-Rev3
- **Title**: Transitioning the Use of Cryptographic Algorithms and Key Lengths (Rev 3)
- **Authors**: Elaine Barker (NIST); Allen Roginsky (NIST)
- **Publication Date**: 2024-11-01
- **Last Updated**: 2024-11-01
- **Document Status**: Initial Public Draft
- **Main Topic**: NIST guidance specifying the federal algorithm and key-length retirement calendar, including deprecation of SHA-1, 224-bit hash functions, ECB mode, and DSA for signature generation after 2030, and establishing transition requirements to 128-bit minimum security strength. The document aligns the classical algorithm sunset dates with the broader PQC migration timeline, directing federal systems to transition to quantum-resistant algorithms for digital signatures and key establishment.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Post-Quantum, Quantum Computer
- **Migration Timeline Info**: Milestones: SHA-1 disallowed for digital signatures after 2030 | RSA and ECC below 128-bit security strength disallowed after 2030 | ECB mode retirement proposed | DSA for signature generation to be retired | Transition to quantum-resistant algorithms for digital signatures and key establishment
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NIST
- **Leaders Contributions Mentioned**: Elaine Barker, Allen Roginsky
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management, PKI
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: NIST IR 8547 (Transition), SP 800-57 (Key Mgmt), FIPS 140-3

---

## NIST-SP-800-63-3

- **Reference ID**: NIST-SP-800-63-3
- **Title**: NIST SP 800-63-3 — Digital Identity Guidelines
- **Authors**: NIST
- **Publication Date**: 2017-06-22
- **Last Updated**: 2017-06-22
- **Document Status**: Published
- **Main Topic**: Four-volume NIST framework defining requirements for digital identity management in US federal systems, covering identity proofing and enrollment (SP 800-63A, Identity Assurance Levels IAL1–3), authenticator management and lifecycle (SP 800-63B, AAL1–3), and federation and assertions (SP 800-63C). This pre-quantum-era baseline establishes the identity infrastructure that PQC migration must protect; superseded by SP 800-63-4 in August 2025.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NIST
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: OpenID Connect, SAML
- **Infrastructure Layers**: Key Management, PKI
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FedRAMP

---

## Rosenpass-Protocol

- **Reference ID**: Rosenpass-Protocol
- **Title**: Rosenpass: Formally Verified Post-Quantum Protocol for WireGuard
- **Authors**: Karolin Varner; Benjamin Lipp; Wanja Zaeske; Lisa Schmidt; Prabhpreet Dua (Rosenpass e.V.; Max Planck Institute for Security and Privacy)
- **Publication Date**: 2023-02-01
- **Last Updated**: 2024-06-01
- **Document Status**: White Paper
- **Main Topic**: Specification of the Rosenpass authenticated key exchange protocol that adds post-quantum security to WireGuard VPNs by running a parallel PQC handshake using Classic McEliece (static KEM) and ML-KEM-512/Kyber-512 (ephemeral KEM) and injecting the resulting output shared key into WireGuard's pre-shared key slot. The protocol is formally verified using ProVerif and defeats state disruption attacks absent in the earlier Post-Quantum WireGuard (PQWG) scheme.
- **PQC Algorithms Covered**: ML-KEM, Classic McEliece
- **Quantum Threats Addressed**: Post-Quantum, Quantum Computer
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: NIST
- **Leaders Contributions Mentioned**: Karolin Varner, Benjamin Lipp
- **PQC Products Mentioned**: Rosenpass, liboqs
- **Protocols Covered**: WireGuard, IPsec, VPN
- **Infrastructure Layers**: VPN, Key Management
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected

---

## draft-ietf-jose-pqc-kem

- **Reference ID**: draft-ietf-jose-pqc-kem
- **Title**: Use of Post-Quantum Key Encapsulation Mechanisms in JOSE
- **Authors**: T. Reddy; A. Banerjee (Nokia); H. Tschofenig (H-BRS); IETF JOSE Working Group
- **Publication Date**: 2024-01-01
- **Last Updated**: 2025-11-01
- **Document Status**: Internet-Draft
- **Main Topic**: IETF Internet-Draft defining how ML-KEM (FIPS 203) is used within JOSE and COSE for quantum-safe token and payload encryption, specifying Direct Key Agreement and Key Agreement with Key Wrapping modes and introducing algorithm identifiers for ML-KEM-512, ML-KEM-768, and ML-KEM-1024, with KMAC256 (NIST SP 800-108r1) for key derivation. This is the primary specification enabling quantum-safe JWE encryption for OAuth 2.0 and OpenID Connect ecosystems.
- **PQC Algorithms Covered**: ML-KEM-512, ML-KEM-768, ML-KEM-1024, FIPS 203 (ML-KEM)
- **Quantum Threats Addressed**: Post-Quantum, Quantum Computer
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: IETF, NIST
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: JOSE, JWE, COSE
- **Infrastructure Layers**: API Security, Key Management
- **Standardization Bodies**: IETF, NIST
- **Compliance Frameworks Referenced**: FIPS 203 (ML-KEM)

---

## eIDAS-2-Regulation

- **Reference ID**: eIDAS-2-Regulation
- **Title**: eIDAS 2.0 Regulation (EU 2024/1183)
- **Authors**: European Parliament; Council of the European Union
- **Publication Date**: 2024-05-30
- **Last Updated**: 2024-05-30
- **Document Status**: In Force
- **Main Topic**: EU Regulation 2024/1183 amends eIDAS (910/2014) to establish the European Digital Identity Framework, mandating that every EU Member State provide EUDI Wallets to citizens and residents by late 2026 and requiring large private-sector platforms to accept them. The cryptographic trust infrastructure underpinning EUDI Wallets and qualified trust services (QES, QEAAs) must remain secure long-term, making quantum-resistant algorithm choices a necessary consideration during implementation.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Milestones: Regulation entered into force 2024-05-20 | Member States must issue EUDI Wallets by approximately late 2026 | Digital identity targets set for wide EU deployment by 2030
- **Applicable Regions / Bodies**: Regions: European Union; Bodies: ENISA
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509, TLS
- **Infrastructure Layers**: PKI, Certificate Authority (CA), Smart Card, Electronic Passport
- **Standardization Bodies**: ETSI
- **Compliance Frameworks Referenced**: eIDAS 2.0, NIS2, GDPR

---

## EUDI-Wallet-ARF

- **Reference ID**: EUDI-Wallet-ARF
- **Title**: EUDI Wallet Architecture and Reference Framework (ARF)
- **Authors**: European Commission; eIDAS Expert Group
- **Publication Date**: 2023-01-01
- **Last Updated**: 2025-06-01
- **Document Status**: Living Document
- **Main Topic**: Specifies the technical architecture and interoperability requirements for the European Digital Identity Wallet, defining credential formats (mso_mdoc per ISO 18013-5 and SD-JWT VC), trust infrastructure components (PID providers, QTSP-issued QEAAs, relying party registration), and security requirements for wallet providers. PQC migration is an implicit requirement as the cryptographic algorithms used for credential signing and wallet attestation must evolve to remain quantum-resistant.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Milestones: EUDI Wallet deployment target late 2026
- **Applicable Regions / Bodies**: Regions: European Union; Bodies: ENISA, ETSI
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: OpenID4VCI, OpenID4VP, OAuth 2.0, TLS, X.509
- **Infrastructure Layers**: PKI, Certificate Authority (CA), Smart Card, Electronic Passport
- **Standardization Bodies**: ETSI, ISO/IEC, OpenID Foundation, IETF
- **Compliance Frameworks Referenced**: eIDAS 2.0, ISO/IEC 15408 (CC)

---

## ISO-18013-5-mDL

- **Reference ID**: ISO-18013-5-mDL
- **Title**: ISO/IEC 18013-5:2021 — Mobile Driving Licence (mDL) Application
- **Authors**: ISO/IEC JTC1 SC17
- **Publication Date**: 2021-09-01
- **Last Updated**: 2021-09-01
- **Document Status**: Published Standard
- **Main Topic**: Defines interface specifications for implementing a driving licence on a mobile device, including the mso_mdoc credential format encoded in CBOR, the interface between the mDL and mDL reader, and holder consent mechanisms with secure storage of mDL private keys. Foundational to EUDI Wallet implementations, this standard's classical cryptography will eventually require PQC-capable signing for long-term credential integrity.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: International; Bodies: ETSI
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509
- **Infrastructure Layers**: Smart Card, Electronic Passport, PKI
- **Standardization Bodies**: ISO/IEC
- **Compliance Frameworks Referenced**: eIDAS 2.0

---

## RFC-9162

- **Reference ID**: RFC-9162
- **Title**: Certificate Transparency Version 2.0
- **Authors**: B. Laurie (Google); E. Messeri (Google); R. Stradling (Sectigo)
- **Publication Date**: 2021-12-01
- **Last Updated**: 2021-12-01
- **Document Status**: Standards Track RFC
- **Main Topic**: Defines Certificate Transparency Version 2.0, a protocol for publicly logging TLS server certificates in append-only Merkle tree logs so that anyone can audit CA activity and detect mis-issued certificates, obsoleting RFC 6962. The CT log infrastructure — including Signed Certificate Timestamps (SCTs), Signed Tree Heads (STHs), and log signing keys — must transition to quantum-resistant signature algorithms as PQC certificates begin to be issued at scale.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: IETF, CA/Browser Forum
- **Leaders Contributions Mentioned**: Ben Laurie
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, X.509, OCSP
- **Infrastructure Layers**: PKI, Certificate Authority (CA), Root CA, Web PKI
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: CA/Browser Forum

---

## OpenID4VCI-Spec

- **Reference ID**: OpenID4VCI-Spec
- **Title**: OpenID for Verifiable Credential Issuance (OpenID4VCI)
- **Authors**: T. Lodderstedt; K. Yasuda; T. Looker; P. Bastian
- **Publication Date**: 2023-01-01
- **Last Updated**: 2025-06-01
- **Document Status**: Final
- **Main Topic**: OpenID Foundation specification defining how credential issuers expose APIs for digital credential issuance, specifying the Credential Offer endpoint, pre-authorized code flow and authorization code flow, Credential Endpoint, and format profiles including SD-JWT VC and mso_mdoc. A key enabler for EUDI Wallet issuance infrastructure that will need to support PQC key binding and PQC-signed credentials as quantum-resistant algorithms are adopted.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: European Union; Bodies: ETSI, IETF
- **Leaders Contributions Mentioned**: Torsten Lodderstedt, Kristina Yasuda
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: OpenID4VCI, OAuth 2.0, TLS
- **Infrastructure Layers**: PKI, Smart Card, Electronic Passport
- **Standardization Bodies**: OpenID Foundation, IETF
- **Compliance Frameworks Referenced**: eIDAS 2.0

---

## OpenID4VP-Spec

- **Reference ID**: OpenID4VP-Spec
- **Title**: OpenID for Verifiable Presentations (OpenID4VP)
- **Authors**: O. Terbu; T. Lodderstedt; K. Yasuda; D. Fett; J. Heenan
- **Publication Date**: 2022-01-01
- **Last Updated**: 2025-06-01
- **Document Status**: Final
- **Main Topic**: OpenID Foundation specification defining how holders present Verifiable Credentials to relying parties by extending OAuth 2.0 authorization requests with a presentation_definition or Digital Credentials Query Language (DCQL) query, specifying vp_token response handling and holder binding proof mechanisms for both SD-JWT VC and ISO mdoc formats. PQC adoption will require quantum-resistant signature algorithms for holder binding proofs and presentation security.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: European Union; Bodies: ETSI, IETF
- **Leaders Contributions Mentioned**: Torsten Lodderstedt, Kristina Yasuda, Daniel Fett
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: OpenID4VP, OAuth 2.0, TLS
- **Infrastructure Layers**: PKI, Smart Card, Electronic Passport
- **Standardization Bodies**: OpenID Foundation, IETF
- **Compliance Frameworks Referenced**: eIDAS 2.0

---

## IETF-SD-JWT-Draft

- **Reference ID**: IETF-SD-JWT-Draft
- **Title**: Selective Disclosure for JWTs (SD-JWT) — draft-ietf-oauth-selective-disclosure-jwt
- **Authors**: Daniel Fett; Kristina Yasuda; Brian Campbell
- **Publication Date**: 2022-01-01
- **Last Updated**: 2025-06-01
- **Document Status**: IETF Draft Standard
- **Main Topic**: Defines the selective disclosure mechanism for JWT claims using salted SHA-256 hash commitments, enabling holders to reveal only specific claims to verifiers via separate per-claim Disclosure objects, with optional Key Binding JWTs for holder authentication. Foundational to EUDI Wallet credential formats (SD-JWT VC); the issuer-signed JWT signatures must transition to PQC algorithms as quantum computing threatens ECDSA/RSA.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: European Union; Bodies: IETF
- **Leaders Contributions Mentioned**: Daniel Fett, Kristina Yasuda, Brian Campbell
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: SD-JWT, JWT, JWS, OAuth 2.0
- **Infrastructure Layers**: PKI, Smart Card, Electronic Passport
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: eIDAS 2.0

---

## RFC 7515

- **Reference ID**: RFC 7515
- **Title**: JSON Web Signature (JWS)
- **Authors**: M. Jones (Microsoft); J. Bradley (Ping Identity); N. Sakimura (NRI)
- **Publication Date**: 2015-05-01
- **Last Updated**: 2015-05-01
- **Document Status**: Proposed Standard
- **Main Topic**: Defines the JSON Web Signature (JWS) standard for representing digitally signed or MAC-protected content using JSON data structures, specifying both compact (header.payload.signature) and full JSON serializations used in every JWT. As the foundational signing layer for JWT-based authentication, JWS is a critical PQC migration target: all registered algorithms (RSA, ECDSA, HMAC) must be replaced with ML-DSA or SLH-DSA when IETF JOSE PQC drafts are finalized.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: IETF
- **Leaders Contributions Mentioned**: M. Jones, J. Bradley, N. Sakimura
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: JOSE, JWS, JWT, TLS
- **Infrastructure Layers**: API Security, Identity & Access Management
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: None detected

---

## RFC 7516

- **Reference ID**: RFC 7516
- **Title**: JSON Web Encryption (JWE)
- **Authors**: M. Jones (Microsoft); J. Hildebrand (Cisco)
- **Publication Date**: 2015-05-01
- **Last Updated**: 2015-05-01
- **Document Status**: Proposed Standard
- **Main Topic**: Defines the JSON Web Encryption (JWE) standard for representing encrypted content using JSON data structures, supporting five-part compact serialization and multiple key management modes including ECDH-ES, RSA-OAEP, and AES-KW. All key agreement and encryption algorithms in JWE rely on classical asymmetric cryptography vulnerable to Shor's algorithm; PQC migration requires replacement with ML-KEM-based key encapsulation as being standardized in draft-ietf-jose-pqc-kem.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: IETF
- **Leaders Contributions Mentioned**: M. Jones, J. Hildebrand
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: JOSE, JWE, JWS, TLS
- **Infrastructure Layers**: API Security, Identity & Access Management
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: None detected

---

## RFC 7517

- **Reference ID**: RFC 7517
- **Title**: JSON Web Key (JWK)
- **Authors**: M. Jones (Microsoft)
- **Publication Date**: 2015-05-01
- **Last Updated**: 2015-05-01
- **Document Status**: Proposed Standard
- **Main Topic**: Defines the JSON Web Key (JWK) format for representing cryptographic keys as JSON objects and JWK Sets for publishing collections of keys at JWKS endpoints used for JWT signature verification. PQC migration requires new key type registrations (for ML-DSA and SLH-DSA) and JWKS endpoint updates to serve post-quantum public keys, since the current kty values (RSA, EC, oct) cover only quantum-vulnerable algorithms.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: IETF
- **Leaders Contributions Mentioned**: M. Jones
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: JOSE, JWK, JWS, JWE
- **Infrastructure Layers**: API Security, Identity & Access Management, PKI
- **Standardization Bodies**: IETF, IANA
- **Compliance Frameworks Referenced**: None detected

---

## RFC 7518

- **Reference ID**: RFC 7518
- **Title**: JSON Web Algorithms (JWA)
- **Authors**: M. Jones (Microsoft)
- **Publication Date**: 2015-05-01
- **Last Updated**: 2015-05-01
- **Document Status**: Proposed Standard
- **Main Topic**: Defines the complete algorithm registry for the JOSE suite, specifying all cryptographic algorithms and identifiers for JWS, JWE, and JWK — including RS256, ES256, PS256, ECDH-ES, RSA-OAEP, AES-GCM, and AES-CBC-HMAC-SHA2. Every registered signature and key agreement algorithm relies on integer factorization or elliptic curve discrete logarithm problems broken by Shor's algorithm, making JWA the primary specification that must be extended with ML-DSA, SLH-DSA, and ML-KEM algorithm identifiers via PQC JOSE drafts.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Post-Quantum
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: IETF, NIST
- **Leaders Contributions Mentioned**: M. Jones
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: JOSE, JWS, JWE, JWK, JWA
- **Infrastructure Layers**: API Security, Identity & Access Management
- **Standardization Bodies**: IETF, IANA, NIST
- **Compliance Frameworks Referenced**: None detected

---

## RFC 7519

- **Reference ID**: RFC 7519
- **Title**: JSON Web Token (JWT)
- **Authors**: M. Jones (Microsoft); J. Bradley (Ping Identity); N. Sakimura (NRI)
- **Publication Date**: 2015-05-01
- **Last Updated**: 2015-05-01
- **Document Status**: Proposed Standard
- **Main Topic**: Defines JWT as a compact, URL-safe format for representing claims between parties as a JSON object signed via JWS or encrypted via JWE, using three-part base64url encoding and registered claim names (iss, sub, aud, exp, nbf, iat, jti). JWTs underpin virtually all modern authentication and API authorization flows (OAuth 2.0, OpenID Connect), making every deployed JWT a quantum-vulnerable migration surface that requires new PQC algorithm identifiers and updated key types.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: IETF
- **Leaders Contributions Mentioned**: M. Jones, J. Bradley, N. Sakimura
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: JOSE, JWT, JWS, JWE, OAuth 2.0, OpenID Connect
- **Infrastructure Layers**: API Security, Identity & Access Management
- **Standardization Bodies**: IETF, IANA
- **Compliance Frameworks Referenced**: None detected

---

## RFC 8725

- **Reference ID**: RFC 8725
- **Title**: JSON Web Token Best Current Practices
- **Authors**: Yaron Sheffer; Dick Hardt; Michael B. Jones
- **Publication Date**: 2020-02-01
- **Last Updated**: 2020-02-01
- **Document Status**: Best Current Practice
- **Main Topic**: Updates RFC 7519 with actionable security guidance for JWT implementation, documenting known attack vectors including algorithm confusion (RS256 vs HS256), the "none" algorithm vulnerability, missing audience validation, and key confusion attacks. The algorithm-whitelisting guidance and explicit algorithm specification requirements will apply directly when migrating JWT deployments to PQC signing algorithms such as ML-DSA and SLH-DSA.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: IETF
- **Leaders Contributions Mentioned**: Yaron Sheffer, Dick Hardt, Michael B. Jones
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: JOSE, JWT, JWS, JWE, OAuth 2.0, OpenID Connect
- **Infrastructure Layers**: API Security, Identity & Access Management
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: None detected

---

## RFC 6749

- **Reference ID**: RFC 6749
- **Title**: The OAuth 2.0 Authorization Framework
- **Authors**: D. Hardt (Microsoft)
- **Publication Date**: 2012-10-01
- **Last Updated**: 2012-10-01
- **Document Status**: Proposed Standard
- **Main Topic**: Defines the OAuth 2.0 authorization framework enabling third-party applications to obtain limited HTTP service access via tokens issued by an authorization server, defining four grant types: authorization code, implicit, resource owner password credentials, and client credentials. OAuth 2.0 is the dominant API authorization protocol; access tokens and ID tokens are typically JWTs signed with classical algorithms, making the entire OAuth 2.0 token infrastructure a quantum-vulnerable migration surface.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: IETF
- **Leaders Contributions Mentioned**: D. Hardt
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: OAuth 2.0, HTTPS, TLS, JWT, JOSE
- **Infrastructure Layers**: API Security, Identity & Access Management
- **Standardization Bodies**: IETF, IANA
- **Compliance Frameworks Referenced**: None detected

---

## RFC-9901-SD-JWT-VC

- **Reference ID**: RFC-9901-SD-JWT-VC
- **Title**: RFC 9901 — SD-JWT-based Verifiable Credentials (SD-JWT VC)
- **Authors**: Daniel Fett (Authlete); Kristina Yasuda (Keio University); Brian Campbell (Ping Identity)
- **Publication Date**: 2025-06-01
- **Last Updated**: 2025-06-01
- **Document Status**: Published RFC
- **Main Topic**: Defines the SD-JWT-based Verifiable Credentials format (vc+sd-jwt), specifying credential structure, selective disclosure mechanism using salted SHA-256 hash commitments, and key binding. The issuer-signed JWT component relies on quantum-vulnerable signature algorithms (ECDSA/EdDSA) that must be replaced with ML-DSA or SLH-DSA when PQC JOSE algorithms are finalized.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: IETF
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: SD-JWT, JWT, JWS, OAuth 2.0
- **Infrastructure Layers**: PKI, Smart Card, Electronic Passport
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: None detected

---

## IETF-Token-Status-List

- **Reference ID**: IETF-Token-Status-List
- **Title**: OAuth Status List — draft-ietf-oauth-status-list
- **Authors**: Tobias Looker (MATTR); Paul Bastian (BDR); Christian Bormann
- **Publication Date**: 2023-01-01
- **Last Updated**: 2025-06-01
- **Document Status**: IETF Draft Standard
- **Main Topic**: Defines the Token Status List (TSL), a compact bit-array mechanism for representing and communicating the revocation or suspension status of tokens secured by JOSE or COSE, including JWT, SD-JWT, CBOR Web Token (CWT), and ISO mdoc credentials. Status list tokens are signed credentials whose signing keys must be migrated to PQC algorithms to prevent quantum forgery of revocation data.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: IETF
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: JWT, SD-JWT, JOSE, COSE, OAuth 2.0
- **Infrastructure Layers**: PKI, Smart Card, Electronic Passport
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: None detected

---

## RFC 5652

- **Reference ID**: RFC 5652
- **Title**: Cryptographic Message Syntax (CMS)
- **Authors**: R. Housley (Vigil Security)
- **Publication Date**: 2009-09-01
- **Last Updated**: 2009-09-01
- **Document Status**: Internet Standard
- **Main Topic**: Defines the Cryptographic Message Syntax (CMS), an ASN.1-based encapsulation syntax for digital signatures, digests, authentication, and encryption of arbitrary content via six content types including SignedData, EnvelopedData, and AuthenticatedData. CMS is the foundational standard for S/MIME email security and all PQC CMS extensions being developed by the IETF LAMPS Working Group build directly on this specification.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Post-Quantum
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: IETF
- **Leaders Contributions Mentioned**: R. Housley
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: CMS, S/MIME, PKCS#7
- **Infrastructure Layers**: PKI, Email, Code Signing
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: None detected

---

## RFC 5083

- **Reference ID**: RFC 5083
- **Title**: Using AES-CCM and AES-GCM in the Cryptographic Message Syntax (CMS)
- **Authors**: R. Housley (Vigil Security)
- **Publication Date**: 2007-11-01
- **Last Updated**: 2007-11-01
- **Document Status**: Proposed Standard
- **Main Topic**: Defines the AuthEnvelopedData content type for CMS that enables AEAD modes (AES-GCM, AES-CCM) to provide simultaneous confidentiality and integrity protection in a single CMS structure. Relevant to PQC migration because the key-transport and key-agreement mechanisms within AuthEnvelopedData rely on quantum-vulnerable RSA and ECDH that LAMPS WG drafts are replacing with ML-KEM-based key encapsulation.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: IETF
- **Leaders Contributions Mentioned**: R. Housley
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: CMS, S/MIME
- **Infrastructure Layers**: PKI, Email
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: None detected

---

## CSC-API-v2-Spec

- **Reference ID**: CSC-API-v2-Spec
- **Title**: Cloud Signature Consortium API v2 Specification
- **Authors**: Cloud Signature Consortium
- **Publication Date**: 2022-01-01
- **Last Updated**: 2024-01-01
- **Document Status**: Published
- **Main Topic**: Defines the Cloud Signature Consortium (CSC) RESTful API for remote digital signature services, specifying endpoints for credential listing, credential authorization via RSSP or OAuth2/OAUTHZ flows, and qualified electronic signature creation. All remote signing operations rely on asymmetric key pairs held in cloud HSMs that must be migrated to PQC algorithms when eIDAS 2.0 transitions to post-quantum requirements.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: European Union; Bodies: ETSI
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: OAuth 2.0, X.509, TLS
- **Infrastructure Layers**: PKI, Certificate Authority (CA), Cloud, HSM
- **Standardization Bodies**: ETSI
- **Compliance Frameworks Referenced**: eIDAS 2.0

---

## RFC 9449

- **Reference ID**: RFC 9449
- **Title**: OAuth 2.0 Demonstrating Proof of Possession (DPoP)
- **Authors**: Daniel Fett (Authlete); Brian Campbell (Ping Identity); John Bradley (Yubico); Torsten Lodderstedt; Michael Jones; David Waite
- **Publication Date**: 2023-09-01
- **Last Updated**: 2023-09-01
- **Document Status**: Proposed Standard
- **Main Topic**: Defines the DPoP mechanism for sender-constraining OAuth 2.0 access and refresh tokens to a client-controlled asymmetric key pair via signed proof-of-possession JWTs, enabling replay attack detection. DPoP proof JWTs use ECDSA or EdDSA signatures and an embedded JWK key binding that are quantum-vulnerable and must be updated to ML-DSA or other post-quantum signature schemes.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: IETF
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: OAuth 2.0, JWT, JWK, HTTPS, TLS
- **Infrastructure Layers**: Key Management, PKI
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: None detected

---

## ETSI-EN-319-411

- **Reference ID**: ETSI-EN-319-411
- **Title**: ETSI EN 319 411 — Requirements for Trust Service Providers Issuing Certificates
- **Authors**: ETSI Technical Committee Electronic Signatures and Infrastructures (ESI)
- **Publication Date**: 2016-02-01
- **Last Updated**: 2021-04-01
- **Document Status**: Published Standard
- **Main Topic**: Specifies general policy and security requirements for Trust Service Providers (TSPs) issuing public key certificates, covering certificate issuance, lifecycle management, Certification Practice Statements, cryptographic module requirements, and audit procedures for Certification Authorities under eIDAS. Critical to PQC migration planning for European CAs because it governs the operational practices that must be updated when TSPs transition to post-quantum algorithms under eIDAS 2.0.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: European Union; Bodies: ETSI, CA/Browser Forum
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509, OCSP, TLS
- **Infrastructure Layers**: PKI, Certificate Authority (CA), Root CA
- **Standardization Bodies**: ETSI, ISO/IEC
- **Compliance Frameworks Referenced**: eIDAS 2.0, Common Criteria, FIPS 140-2, CA/Browser Forum

---

## IETF RFC 7296

- **Reference ID**: IETF RFC 7296
- **Title**: Internet Key Exchange Protocol Version 2 (IKEv2)
- **Authors**: C. Kaufman (Microsoft); P. Hoffman (VPN Consortium); Y. Nir (Check Point); P. Eronen; T. Kivinen (INSIDE Secure)
- **Publication Date**: 2014-10-01
- **Last Updated**: 2014-10-01
- **Document Status**: Internet Standard (STD 79)
- **Main Topic**: Defines version 2 of the Internet Key Exchange (IKE) protocol, which performs mutual authentication and establishes IPsec Security Associations (SAs) for ESP and AH. This is the foundational VPN key-exchange protocol upon which all PQC IKEv2 extensions — including RFC 9370 (multiple key exchanges) and draft-ietf-ipsecme-ikev2-mlkem — are built.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: IETF
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: IKEv2, IPsec, ESP, AH, EAP
- **Infrastructure Layers**: VPN, Key Management
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: None detected

---

## RFC 9147

- **Reference ID**: RFC 9147
- **Title**: The Datagram Transport Layer Security (DTLS) Protocol Version 1.3
- **Authors**: E. Rescorla (Mozilla); H. Tschofenig (Arm); N. Modadugu (Google)
- **Publication Date**: 2022-04-01
- **Last Updated**: 2022-04-01
- **Document Status**: Proposed Standard
- **Main Topic**: Specifies DTLS 1.3, the UDP-based variant of TLS 1.3 that provides equivalent security guarantees while preserving datagram transport semantics, used for CoAP and IoT communications. This is a key reference for analyzing PQC handshake overhead on constrained devices where datagram fragmentation and packet-loss tolerance are critical design constraints.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: IETF
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: DTLS, TLS 1.3
- **Infrastructure Layers**: IoT, Key Management
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: None detected

---

## RFC 9019

- **Reference ID**: RFC 9019
- **Title**: A Firmware Update Architecture for Internet of Things (SUIT)
- **Authors**: B. Moran (Arm); H. Tschofenig (Arm); D. Brown (Linaro); M. Meriac
- **Publication Date**: 2021-04-01
- **Last Updated**: 2021-04-01
- **Document Status**: Informational
- **Main Topic**: Defines the architecture and manifest format for secure, transport-agnostic firmware updates on resource-constrained IoT devices, covering authentication, integrity protection, and optional confidentiality of firmware images. The manifest metadata fields defined here are directly used in PQC firmware-signing workflows where post-quantum signatures (ML-DSA, SLH-DSA) replace classical ECDSA.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: IETF
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: CBOR, COSE, CoAP, HTTPS
- **Infrastructure Layers**: IoT, Firmware
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: None detected

---

## RFC 8879

- **Reference ID**: RFC 8879
- **Title**: TLS Certificate Compression
- **Authors**: A. Ghedini (Cloudflare); V. Vasiliev (Google)
- **Publication Date**: 2020-11-01
- **Last Updated**: 2020-11-01
- **Document Status**: Proposed Standard
- **Main Topic**: Defines a TLS 1.3 extension (compress_certificate) that allows certificate chains to be compressed using zlib, Brotli, or zstd algorithms to reduce handshake byte overhead. This is a key mitigation for PQC certificate chain bloat, as post-quantum certificates and signatures are significantly larger than classical equivalents.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: IETF
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.3, X.509
- **Infrastructure Layers**: IoT, PKI, Web PKI
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: None detected

---

## RFC 7228

- **Reference ID**: RFC 7228
- **Title**: Terminology for Constrained-Node Networks
- **Authors**: C. Bormann (Universitaet Bremen TZI); M. Ersue (Nokia); A. Keranen (Ericsson)
- **Publication Date**: 2014-05-01
- **Last Updated**: 2014-05-01
- **Document Status**: Informational
- **Main Topic**: Establishes canonical terminology and device-class definitions (Class 0: <10 KiB RAM / <100 KiB Flash; Class 1: ~10 KiB RAM / ~100 KiB Flash; Class 2: ~50 KiB RAM / ~250 KiB Flash) for constrained-node IoT networks, along with power and network constraint classifications. This taxonomy is the foundational reference for IoT PQC algorithm selection — device class directly determines which post-quantum algorithms can be practically deployed on each hardware tier.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: IETF
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: CoAP
- **Infrastructure Layers**: IoT
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: None detected

---

## RFC 7250

- **Reference ID**: RFC 7250
- **Title**: Using Raw Public Keys in Transport Layer Security (TLS) and DTLS
- **Authors**: P. Wouters (Red Hat); H. Tschofenig (ARM); J. Gilmore (EFF); S. Weiler (Parsons); T. Kivinen (INSIDE Secure)
- **Publication Date**: 2014-06-01
- **Last Updated**: 2014-06-01
- **Document Status**: Proposed Standard
- **Main Topic**: Defines TLS/DTLS extensions allowing raw SubjectPublicKeyInfo structures to replace full X.509 certificate chains, drastically reducing per-handshake data on ultra-constrained IoT devices (~70% size reduction vs X.509). This mechanism is a critical enabler for PQC deployments on Class 0–1 devices where carrying full PQC certificate chains is infeasible.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: IETF
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, DTLS, X.509
- **Infrastructure Layers**: IoT, PKI
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: None detected

---

## 3GPP TS 33.501

- **Reference ID**: 3GPP TS 33.501
- **Title**: Security Architecture and Procedures for 5G System
- **Authors**: 3GPP SA3 Working Group
- **Publication Date**: 2025-06-01
- **Last Updated**: 2025-12-01
- **Document Status**: Technical Specification
- **Main Topic**: Defines the complete security architecture and procedures for the 5G System, including authentication frameworks (5G AKA, EAP-AKA'), the key hierarchy (KAUSF, KSEAF, KAMF), and subscriber identity protection via SUPI/SUCI encryption using ECIES. PQC enhancements for 5G are being integrated through ongoing 3GPP work items (TR 33.841) from Release 18 onward covering quantum-resistant authentication and key agreement.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest Now Decrypt Later (HNDL), Post-Quantum
- **Migration Timeline Info**: Milestones: Release 18 PQC work items (2023) | Release 19 ongoing (2024–2025) | Release 20 planned (2026)
- **Applicable Regions / Bodies**: Bodies: 3GPP
- **Leaders Contributions Mentioned**: Alf Zugenmaier
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: EAP, TLS
- **Infrastructure Layers**: 5G, Telecommunications
- **Standardization Bodies**: 3GPP
- **Compliance Frameworks Referenced**: None detected

---

## NIST SP 800-82 Rev. 3

- **Reference ID**: NIST SP 800-82 Rev. 3
- **Title**: Guide to Operational Technology (OT) Security
- **Authors**: Keith Stouffer; Michael Pease; CheeYee Tang; Timothy Zimmerman; Victoria Pillitteri; Suzanne Lightman (NIST); Adam Hahn; Stephanie Saravia; Aslam Sherule; Michael Thompson (MITRE)
- **Publication Date**: 2023-09-01
- **Last Updated**: 2023-09-01
- **Document Status**: Final
- **Main Topic**: Provides comprehensive NIST guidance for securing operational technology systems including SCADA, DCS, PLCs, building automation, and industrial IoT, covering OT-specific risk management, defense-in-depth architecture (Purdue model), and security control tailoring from NIST SP 800-53 Rev. 5. Critical infrastructure operators rely on this document when planning PQC migration for long-lived OT devices with constrained patching cycles and safety-critical availability requirements.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest Now Decrypt Later (HNDL), Post-Quantum
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NIST, CISA
- **Leaders Contributions Mentioned**: Keith Stouffer, Victoria Pillitteri, Adam Hahn
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: VPN, TLS
- **Infrastructure Layers**: OT/ICS/SCADA, Firmware, Key Management
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: NERC-CIP, IEC 62443 (OT/ICS)

---

## 3GPP-PQC-Study-2025

- **Reference ID**: 3GPP-PQC-Study-2025
- **Title**: Study on Preparing for Transition to Post Quantum Cryptography in 3GPP
- **Authors**: 3GPP SA3
- **Publication Date**: 2025-05-01
- **Last Updated**: 2025-05-01
- **Document Status**: Study Item Approved
- **Main Topic**: Comprehensive 3GPP study examining integration pathways for standalone and hybrid PQC algorithms into existing 5G security architecture, covering subscriber identity protection (SUCI), AKA authentication, and network-to-device key agreement. Analyzes algorithm suitability for constrained 5G devices and proposes dual-algorithm hybrid solutions for the transitional period.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, FN-DSA, hybrid key exchange
- **Quantum Threats Addressed**: Harvest Now Decrypt Later (HNDL), Cryptographically Relevant Quantum Computer (CRQC)
- **Migration Timeline Info**: 3GPP Release 19 integration target; aligns with NIST PQC standardization timeline
- **Applicable Regions / Bodies**: Regions: Global; Bodies: 3GPP, ETSI, NIST
- **Leaders Contributions Mentioned**: 3GPP SA3 working group contributors
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: 5G NAS, SUCI, AKA, IKEv2
- **Infrastructure Layers**: Telecommunications, Mobile Networks, IoT/OT
- **Standardization Bodies**: 3GPP, ETSI, NIST
- **Compliance Frameworks Referenced**: 3GPP TS 33.501

---

## liboqs-v0.15.0

- **Reference ID**: liboqs-v0.15.0
- **Title**: Open Quantum Safe liboqs Library v0.15.0
- **Authors**: Open Quantum Safe; Linux Foundation PQCA
- **Publication Date**: 2025-11-14
- **Last Updated**: 2025-11-14
- **Document Status**: Released
- **Main Topic**: Open-source C library providing implementations of quantum-resistant cryptographic algorithms including all NIST-standardized PQC algorithms. Serves as the reference implementation for ML-KEM, ML-DSA, and SLH-DSA, and provides experimental support for additional candidate algorithms. Widely used in academic research and as a foundation for OQS-OpenSSL and OQS-BoringSSL integrations.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, FN-DSA, FrodoKEM, HQC, BIKE, Classic McEliece, NTRU Prime
- **Quantum Threats Addressed**: CRQC threats to asymmetric cryptography
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Global; Bodies: Open Quantum Safe, Linux Foundation PQCA, NIST
- **Leaders Contributions Mentioned**: Open Quantum Safe project team
- **PQC Products Mentioned**: liboqs v0.15.0, OQS-OpenSSL, OQS-BoringSSL
- **Protocols Covered**: TLS, SSH, X.509, PKCS#7
- **Infrastructure Layers**: Cryptographic Libraries, Development Tools
- **Standardization Bodies**: NIST, Linux Foundation PQCA
- **Compliance Frameworks Referenced**: FIPS 203, FIPS 204, FIPS 205

---

## draft-kwiatkowski-pquip-pqc-migration-00

- **Reference ID**: draft-kwiatkowski-pquip-pqc-migration-00
- **Title**: Guidance for migration to Post-Quantum Cryptography
- **Authors**: IETF Individual Submission
- **Publication Date**: 2025-07-20
- **Last Updated**: 2025-07-20
- **Document Status**: Internet-Draft
- **Main Topic**: IETF draft providing practical migration guidance for organizations transitioning to PQC, covering common anti-patterns to avoid, crypto-agility design principles, and best practices for hybrid deployment. Addresses both the technical challenges of algorithm replacement and the organizational challenges of coordinating large-scale migration across heterogeneous infrastructure.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA
- **Quantum Threats Addressed**: Harvest Now Decrypt Later (HNDL), CRQC
- **Migration Timeline Info**: Phased migration approach; immediate crypto-agility requirements; prioritize long-lived secrets
- **Applicable Regions / Bodies**: Regions: Global; Bodies: IETF
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, SSH, IPsec
- **Infrastructure Layers**: Enterprise IT, Application Layer, Network Security
- **Standardization Bodies**: IETF, NIST
- **Compliance Frameworks Referenced**: None detected

---

## BSI TR-02102-1

- **Reference ID**: BSI TR-02102-1
- **Title**: Cryptographic Mechanisms: Recommendations and Key Lengths
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2025-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: German federal technical guideline providing comprehensive cryptographic recommendations and minimum key length requirements for all major algorithm families. Version 2026-01 includes PQC algorithm approvals (ML-KEM, ML-DSA, SLH-DSA, FrodoKEM, HQC) alongside classical algorithms, with mandatory hybrid approach during transition period and explicit timelines for German federal systems and products requiring BSI approval.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, FN-DSA, FrodoKEM, HQC, XMSS, LMS
- **Quantum Threats Addressed**: CRQC threats to RSA, ECC, Diffie-Hellman
- **Migration Timeline Info**: Hybrid required through 2030; PQC-only permitted after 2030 for sensitive data; full transition by 2035
- **Applicable Regions / Bodies**: Regions: Germany; European Union; Bodies: BSI, NIST, ETSI
- **Leaders Contributions Mentioned**: BSI cryptography experts
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: General cryptographic primitives, key derivation, random number generation
- **Infrastructure Layers**: All IT infrastructure, Government IT, Critical Infrastructure
- **Standardization Bodies**: BSI, NIST, ETSI
- **Compliance Frameworks Referenced**: BSI TR-02102, EU NIS2, Common Criteria

---

## BSI TR-02102-2

- **Reference ID**: BSI TR-02102-2
- **Title**: Cryptographic Mechanisms: Recommendations for TLS
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2025-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: BSI technical guideline specifying TLS cryptographic recommendations for German federal systems, including approved cipher suites and key exchange methods. Version 2026-01 adds hybrid TLS key exchange requirements combining ML-KEM with classical ECDH, defines approved hybrid cipher suites, and sets timelines for mandatory adoption of PQC-capable TLS configurations in German government systems.
- **PQC Algorithms Covered**: ML-KEM, hybrid key exchange (ML-KEM + X25519/P-256)
- **Quantum Threats Addressed**: CRQC, Harvest Now Decrypt Later (HNDL)
- **Migration Timeline Info**: Hybrid TLS required for classified communications by 2025; broader adoption by 2030
- **Applicable Regions / Bodies**: Regions: Germany; European Union; Bodies: BSI, IETF, NIST
- **Leaders Contributions Mentioned**: BSI cryptography experts
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.3, DTLS 1.3
- **Infrastructure Layers**: Network Security, Web Security, Government IT
- **Standardization Bodies**: BSI, IETF, NIST
- **Compliance Frameworks Referenced**: BSI TR-02102, EU NIS2, Common Criteria

---

## BSI TR-02102-3

- **Reference ID**: BSI TR-02102-3
- **Title**: Cryptographic Mechanisms: Recommendations for IPsec
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2025-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: BSI technical guideline for IPsec and IKEv2 cryptographic configuration, updated to include hybrid PQC key exchange and authentication requirements. Specifies approved algorithm combinations for German federal VPN infrastructure, defines hybrid IKEv2 key exchange using ML-KEM, and provides migration path from classical to PQC-capable IPsec implementations.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, hybrid key exchange
- **Quantum Threats Addressed**: CRQC, Harvest Now Decrypt Later (HNDL)
- **Migration Timeline Info**: Aligned with BSI TR-02102 series; hybrid IPsec by 2026; full PQC by 2030
- **Applicable Regions / Bodies**: Regions: Germany; European Union; Bodies: BSI, IETF, NIST
- **Leaders Contributions Mentioned**: BSI cryptography experts
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: IPsec, IKEv2, ESP
- **Infrastructure Layers**: Network Security, VPN, Government IT
- **Standardization Bodies**: BSI, IETF, NIST
- **Compliance Frameworks Referenced**: BSI TR-02102, EU NIS2

---

## BSI TR-02102-4

- **Reference ID**: BSI TR-02102-4
- **Title**: Cryptographic Mechanisms: Recommendations for SSH
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2025-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: BSI technical guideline for SSH cryptographic configuration including approved key exchange algorithms and authentication methods. Updated to include hybrid PQC key exchange requirements for SSH in German federal systems, specifying mlkem768x25519 hybrid key exchange and approved PQC host key algorithms for migration path from classical SSH configurations.
- **PQC Algorithms Covered**: ML-KEM, hybrid key exchange (ML-KEM + X25519)
- **Quantum Threats Addressed**: CRQC, Harvest Now Decrypt Later (HNDL)
- **Migration Timeline Info**: Aligned with BSI TR-02102 series; hybrid SSH adoption by 2026
- **Applicable Regions / Bodies**: Regions: Germany; European Union; Bodies: BSI, IETF, NIST
- **Leaders Contributions Mentioned**: BSI cryptography experts
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: SSH (Secure Shell), SSH transport layer
- **Infrastructure Layers**: Remote Access, Network Security, Government IT
- **Standardization Bodies**: BSI, IETF, NIST
- **Compliance Frameworks Referenced**: BSI TR-02102

---

## EU PQC Recommendation

- **Reference ID**: EU PQC Recommendation
- **Title**: Recommendation on Coordinated Implementation Roadmap for PQC Transition
- **Authors**: European Commission
- **Publication Date**: 2024-04-11
- **Last Updated**: 2024-04-11
- **Document Status**: Policy Recommendation
- **Main Topic**: European Commission recommendation establishing a coordinated EU-wide PQC transition framework, calling on member states to develop national PQC transition plans and align with common milestones. Sets EU-level targets including cryptographic inventory completion by 2025, migration of critical systems by 2030, and full transition by 2035. Coordinates with ENISA, NIS Cooperation Group, and national cybersecurity authorities.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA
- **Quantum Threats Addressed**: CRQC, Harvest Now Decrypt Later (HNDL)
- **Migration Timeline Info**: 2025: cryptographic inventory; 2027: high-priority system migration begins; 2030: critical infrastructure migrated; 2035: full transition
- **Applicable Regions / Bodies**: Regions: European Union; Bodies: European Commission, ENISA, NIS Cooperation Group
- **Leaders Contributions Mentioned**: European Commission Digital Team, ENISA
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, PKI, eIDAS infrastructure
- **Infrastructure Layers**: Government IT, Critical Infrastructure, eIDAS, Financial Services
- **Standardization Bodies**: ETSI, NIST, ENISA, CEN/CENELEC
- **Compliance Frameworks Referenced**: EU NIS2, eIDAS 2.0, EUCC

---

## EUCC v2.0 ACM

- **Reference ID**: EUCC v2.0 ACM
- **Title**: EU Cybersecurity Certification Agreed Cryptographic Mechanisms v2.0
- **Authors**: ECCG/ENISA
- **Publication Date**: 2025-04-01
- **Last Updated**: 2025-04-01
- **Document Status**: Certification Framework
- **Main Topic**: ECCG document defining the agreed cryptographic mechanisms acceptable for EU Cybersecurity Certification (EUCC) under the EU Cybersecurity Act. Version 2.0 incorporates NIST-standardized PQC algorithms into the approved algorithm list, defining acceptable parameter sets for ML-KEM, ML-DSA, SLH-DSA, and FN-DSA, along with hybrid combination requirements for the transitional period. Critical reference for product vendors seeking EUCC certification.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, FN-DSA, HQC
- **Quantum Threats Addressed**: CRQC, general quantum threats to certified products
- **Migration Timeline Info**: PQC algorithms included from 2025; hybrid requirements during transition; full PQC-ready certification by 2030
- **Applicable Regions / Bodies**: Regions: European Union; Bodies: ECCG, ENISA, Common Criteria
- **Leaders Contributions Mentioned**: ECCG (European Cybersecurity Certification Group) members
- **PQC Products Mentioned**: Products seeking EUCC certification
- **Protocols Covered**: General cryptographic operations in evaluated products
- **Infrastructure Layers**: PKI, Smart Cards, Embedded Systems, HSM
- **Standardization Bodies**: ENISA, ECCG, Common Criteria, ETSI
- **Compliance Frameworks Referenced**: EUCC, EU Cybersecurity Act, NIS2, Common Criteria

---

## UK NCSC PQC Guidance

- **Reference ID**: UK NCSC PQC Guidance
- **Title**: Preparing for Quantum-Safe Cryptography
- **Authors**: UK NCSC
- **Publication Date**: 2020-11-11
- **Last Updated**: 2020-11-11
- **Document Status**: White Paper (v2.0)
- **Main Topic**: UK National Cyber Security Centre whitepaper setting out the NCSC position on mitigating the cryptographic threat posed by quantum computing. Explains that CRQCs would break all widely-used public-key cryptography (RSA, ECC, Diffie-Hellman), while symmetric cryptography (AES) is minimally impacted. Recommends adopting quantum-safe cryptography (QSC) following NIST standardisation outcomes, cautions against early adoption of non-standardised QSC, explicitly rejects QKD for government or military applications as it requires specialist hardware and does not cover digital signatures, and advises large organisations to plan QSC transition into long-term infrastructure roadmaps. Intended for technical policymakers.
- **PQC Algorithms Covered**: XMSS, LMS (stateful hash-based signatures, noted for niche uses like firmware signing only; NIST general-purpose algorithms not yet finalised at time of writing)
- **Quantum Threats Addressed**: CRQC, Harvest Now Decrypt Later (HNDL) for key agreement, quantum signature forgery for long-lived root keys
- **Migration Timeline Info**: No specific deadline set; NIST standards expected 2022–24; major products expected to transition once standards and protocol updates (IPSec, TLS) are available; recommends planning period with hybrid conventional + QSC operation
- **Applicable Regions / Bodies**: Regions: United Kingdom; Bodies: NCSC, NIST, ETSI
- **Leaders Contributions Mentioned**: UK NCSC cryptography team
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, IPsec (mentioned as protocols requiring QSC updates)
- **Infrastructure Layers**: Government IT, Critical National Infrastructure, Enterprise, Internet communications
- **Standardization Bodies**: NCSC, NIST, ETSI
- **Compliance Frameworks Referenced**: None detected

---

## Singapore-CSA-Quantum-Safe-Handbook

- **Reference ID**: Singapore-CSA-Quantum-Safe-Handbook
- **Title**: Quantum-Safe Handbook and Quantum Readiness Index
- **Authors**: CSA Singapore
- **Publication Date**: 2024-06-01
- **Last Updated**: 2024-06-01
- **Document Status**: Guidance
- **Main Topic**: Comprehensive Singapore government guidance for organizations preparing for quantum-safe cryptography transition, covering threat assessment, asset inventory methodology, migration prioritization, and implementation roadmap. Introduces the Quantum Readiness Index (QRI) as a self-assessment framework for organizations to benchmark their PQC migration maturity. Targeted at Singapore financial sector, critical information infrastructure (CII) operators, and government agencies.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, hybrid algorithms
- **Quantum Threats Addressed**: CRQC, Harvest Now Decrypt Later (HNDL)
- **Migration Timeline Info**: 2025-2030 phased migration; CII operators prioritized; Quantum Readiness Index annual reporting
- **Applicable Regions / Bodies**: Regions: Singapore; APAC; Bodies: CSA Singapore, IMDA, MAS
- **Leaders Contributions Mentioned**: CSA Singapore, IMDA
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, PKI, SSH
- **Infrastructure Layers**: Enterprise IT, Government IT, Financial Services, Critical Infrastructure
- **Standardization Bodies**: CSA, NIST, IETF
- **Compliance Frameworks Referenced**: Singapore Cybersecurity Act, MAS Technology Risk Management (TRM), Cyber Trust Mark

---

## draft-kampanakis-curdle-ssh-pq-ke

- **Reference ID**: draft-kampanakis-curdle-ssh-pq-ke
- **Title**: Post-Quantum Key Exchange for SSH using ML-KEM
- **Authors**: IETF CURDLE WG
- **Publication Date**: 2024-03-01
- **Last Updated**: 2024-03-01
- **Document Status**: Internet-Draft
- **Main Topic**: IETF draft defining hybrid post-quantum key exchange for SSH combining ML-KEM-768 (FIPS 203) with classical X25519, creating the mlkem768x25519-sha256 key exchange algorithm. Enables SSH implementations to provide forward secrecy against both classical and quantum adversaries simultaneously during the PQC transition period without requiring full infrastructure replacement.
- **PQC Algorithms Covered**: ML-KEM-768, hybrid key exchange (mlkem768x25519)
- **Quantum Threats Addressed**: CRQC, Harvest Now Decrypt Later (HNDL)
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Global; Bodies: IETF
- **Leaders Contributions Mentioned**: IETF CURDLE Working Group contributors
- **PQC Products Mentioned**: OpenSSH (targeted implementation)
- **Protocols Covered**: SSH, SSH transport layer, key exchange
- **Infrastructure Layers**: Remote Access, Network Security, Developer Tools
- **Standardization Bodies**: IETF, NIST
- **Compliance Frameworks Referenced**: FIPS 203

---

## draft-josefsson-ntruprime-ssh

- **Reference ID**: draft-josefsson-ntruprime-ssh
- **Title**: NTRU Prime Key Agreement for SSH
- **Authors**: IETF Individual Submission
- **Publication Date**: 2022-01-01
- **Last Updated**: 2022-01-01
- **Document Status**: Internet-Draft (Individual Submission)
- **Main Topic**: IETF individual draft defining the sntrup761x25519-sha512 hybrid key exchange for SSH, combining Streamlined NTRU Prime 761 with X25519 for quantum-resistant key agreement. NTRU Prime is a conservative alternative to CRYSTALS-based algorithms with distinct mathematical assumptions, providing defense-in-depth for deployments concerned about lattice-based algorithm vulnerabilities. Already implemented in OpenSSH.
- **PQC Algorithms Covered**: Streamlined NTRU Prime 761 (sntrup761), hybrid with X25519
- **Quantum Threats Addressed**: CRQC threats to SSH key establishment
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Global; Bodies: IETF
- **Leaders Contributions Mentioned**: Simon Josefsson (author)
- **PQC Products Mentioned**: OpenSSH (implements sntrup761x25519-sha512 by default)
- **Protocols Covered**: SSH, SSH transport layer
- **Infrastructure Layers**: Remote Access, Network Security
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: None detected

---

## draft-sfluhrer-ipsecme-ikev2-mldsa-00

- **Reference ID**: draft-sfluhrer-ipsecme-ikev2-mldsa-00
- **Title**: Post-quantum Digital Signatures with ML-DSA in IKEv2
- **Authors**: IETF IPSECME WG
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Internet-Draft (Individual Submission)
- **Main Topic**: IETF draft from Cisco's Scott Fluhrer defining how to use ML-DSA (FIPS 204) for IKEv2 authentication in the IKE_AUTH phase. Specifies ML-DSA-44, ML-DSA-65, and ML-DSA-87 parameter sets with their OIDs, AUTH payload generation using the pure ML-DSA mode with "IKEv2 AUTH" context string, and peer capability announcement via SUPPORTED_AUTH_METHODS. Companion draft to draft-ietf-ipsecme-ikev2-mlkem for full PQC IPsec support.
- **PQC Algorithms Covered**: ML-DSA-44, ML-DSA-65, ML-DSA-87
- **Quantum Threats Addressed**: CRQC threats to IKEv2 authentication
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Global; Bodies: IETF
- **Leaders Contributions Mentioned**: Scott Fluhrer (Cisco Systems)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: IKEv2, IPsec, IKE_AUTH
- **Infrastructure Layers**: VPN, Network Security
- **Standardization Bodies**: IETF, NIST
- **Compliance Frameworks Referenced**: FIPS 204

---

## NIST-SP-800-90A-R1

- **Reference ID**: NIST-SP-800-90A-R1
- **Title**: SP 800-90A Rev. 1: Recommendation for Random Number Generation Using Deterministic Random Bit Generators
- **Authors**: NIST
- **Publication Date**: 2015-06-24
- **Last Updated**: 2015-06-24
- **Document Status**: Published
- **Main Topic**: NIST standard defining three approved deterministic random bit generator (DRBG) mechanisms: Hash_DRBG, HMAC_DRBG, and CTR_DRBG. Essential foundation for PQC implementations since all PQC algorithms require high-quality random numbers for key generation and, in some cases, signing. CTR_DRBG using AES-256 is the most widely deployed mechanism in FIPS 140-3 validated modules.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum threats to PRNG predictability and seed entropy
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Global; Bodies: NIST, FIPS
- **Leaders Contributions Mentioned**: Elaine Barker, John Kelsey (NIST)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: AES-CTR, SHA-2, HMAC
- **Infrastructure Layers**: Cryptographic Libraries, Hardware Security (HSM), Key Management
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS 140-3, Common Criteria

---

## NIST-SP-800-90B

- **Reference ID**: NIST-SP-800-90B
- **Title**: SP 800-90B: Recommendation for the Entropy Sources Used for Random Bit Generation
- **Authors**: NIST
- **Publication Date**: 2018-01-29
- **Last Updated**: 2018-01-29
- **Document Status**: Published
- **Main Topic**: NIST standard defining requirements and validation testing for entropy sources used in random bit generators. Specifies statistical test suites and analysis methods to verify that entropy sources provide sufficient unpredictability for cryptographic key generation. Required by FIPS 140-3 for all approved DRBGs seeded by hardware entropy sources. Critical for validating entropy in PQC key generation where higher randomness quality may be required.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum threats to entropy source quality
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Global; Bodies: NIST, FIPS
- **Leaders Contributions Mentioned**: Meltem Sonmez Turan, Elaine Barker, John Kelsey, Kerry McKay (NIST)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: IID entropy estimation, non-IID entropy estimation
- **Infrastructure Layers**: Hardware Security (HSM), Cryptographic Libraries, Embedded Systems
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS 140-3, Common Criteria

---

## NIST-SP-800-90C

- **Reference ID**: NIST-SP-800-90C
- **Title**: SP 800-90C: Recommendation for Random Bit Generator (RBG) Constructions
- **Authors**: NIST
- **Publication Date**: 2024-09-25
- **Last Updated**: 2024-09-25
- **Document Status**: Published
- **Main Topic**: NIST standard specifying constructions for complete Random Bit Generator (RBG) systems that combine entropy sources (SP 800-90B), conditioning components, and DRBGs (SP 800-90A). Defines DRBG-based and NRBG-based constructions, specifying how to combine components to achieve overall security strength. Updated in 2024 to address modern deployment contexts and higher security level requirements relevant to PQC implementations.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum threats to RNG systems
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Global; Bodies: NIST, FIPS
- **Leaders Contributions Mentioned**: Elaine Barker, John Kelsey, Kerry McKay (NIST)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: DRBG constructions, entropy conditioning
- **Infrastructure Layers**: Hardware Security (HSM), Cryptographic Libraries, Key Management
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS 140-3, Common Criteria

---

## SLIP-0010

- **Reference ID**: SLIP-0010
- **Title**: SLIP-0010: Universal Private Key Derivation from Master Private Key
- **Authors**: SatoshiLabs
- **Publication Date**: 2016-04-26
- **Last Updated**: 2016-04-26
- **Document Status**: Final
- **Main Topic**: SatoshiLabs Improvement Proposal extending BIP-32 hierarchical deterministic key derivation to support Ed25519 and other elliptic curves beyond secp256k1. Defines a generalized HMAC-SHA512-based derivation scheme that works with different curve types while maintaining the BIP-32 wallet compatibility structure. Critical for hardware wallets supporting multiple signature algorithms, including future PQC-compatible derivation schemes.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Global; Bodies: SatoshiLabs
- **Leaders Contributions Mentioned**: SatoshiLabs development team
- **PQC Products Mentioned**: Trezor hardware wallets
- **Protocols Covered**: HD wallet derivation, Ed25519, secp256k1
- **Infrastructure Layers**: Cryptocurrency Wallets, Key Management
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected

---

## OpenSSL-3x-Docs

- **Reference ID**: OpenSSL-3x-Docs
- **Title**: OpenSSL 3.x Documentation
- **Authors**: OpenSSL Project
- **Publication Date**: 2021-09-07
- **Last Updated**: 2021-09-07
- **Document Status**: Current
- **Main Topic**: Official documentation for OpenSSL 3.x series, covering the FIPS provider module, EVP API, command-line tools, and configuration options. The FIPS provider in OpenSSL 3.x enables FIPS 140-3 compliant operation. While OpenSSL 3.x currently focuses on traditional algorithms, the OQS-OpenSSL fork extends it with PQC algorithm support using liboqs, and future OpenSSL versions are expected to incorporate NIST-standardized PQC algorithms natively.
- **PQC Algorithms Covered**: None detected (OQS fork adds ML-KEM, ML-DSA via liboqs)
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Global; Bodies: OpenSSL Project, Linux Foundation
- **Leaders Contributions Mentioned**: OpenSSL project contributors
- **PQC Products Mentioned**: OQS-OpenSSL fork, liboqs
- **Protocols Covered**: TLS, DTLS, PKI, X.509
- **Infrastructure Layers**: Cryptographic Libraries, Web Servers, Developer Tools
- **Standardization Bodies**: NIST (FIPS provider), IETF
- **Compliance Frameworks Referenced**: FIPS 140-3

---

## IETF-MTC-Draft-09

- **Reference ID**: IETF-MTC-Draft-09
- **Title**: Merkle Tree Certificates for TLS (draft-ietf-plants-merkle-tree-certs-01)
- **Authors**: David Benjamin (Google); Cloudflare
- **Publication Date**: 2024-06-01
- **Last Updated**: 2024-06-01
- **Document Status**: Internet-Draft (IETF PLANTS WG)
- **Main Topic**: IETF draft defining Merkle Tree Certificates (MTCs) as a scalable alternative PKI mechanism for TLS, designed to handle large PQC signature sizes efficiently. MTCs replace traditional X.509 certificate chains with compact Merkle proofs, significantly reducing the TLS handshake overhead introduced by large PQC signatures (ML-DSA produces ~3KB signatures vs ~100 bytes for ECDSA). Adopted by Google Chrome as a long-term solution for PQC-scale certificate distribution.
- **PQC Algorithms Covered**: ML-DSA, SLH-DSA, FN-DSA (as signature algorithms for MTC issuers)
- **Quantum Threats Addressed**: CRQC threats to PKI and certificate infrastructure
- **Migration Timeline Info**: Chrome pilot deployment announced 2024; full deployment timeline TBD
- **Applicable Regions / Bodies**: Regions: Global; Bodies: IETF, CA/Browser Forum
- **Leaders Contributions Mentioned**: David Benjamin (Google), Cloudflare research team
- **PQC Products Mentioned**: Google Chrome, Cloudflare MTC implementation
- **Protocols Covered**: TLS 1.3, X.509 PKI, Certificate Transparency
- **Infrastructure Layers**: PKI, Web Security, Certificate Authorities
- **Standardization Bodies**: IETF, IANA, CA/Browser Forum
- **Compliance Frameworks Referenced**: None detected

---

## ANSSI-BSI-QKD-Position-Paper

- **Reference ID**: ANSSI-BSI-QKD-Position-Paper
- **Title**: ANSSI and BSI Joint Position on Quantum Key Distribution
- **Authors**: ANSSI France; BSI Germany
- **Publication Date**: 2021-06-01
- **Last Updated**: 2021-06-01
- **Document Status**: Position Paper
- **Main Topic**: Joint position paper from French (ANSSI) and German (BSI) cybersecurity agencies expressing skepticism about QKD as a security-critical infrastructure solution. Identifies significant practical limitations of QKD including hardware trust issues, high implementation costs, short range without trusted relays, and lack of strong security proofs for implementations. Recommends PQC algorithms over QKD for most government and critical infrastructure use cases, while noting QKD may complement PQC in specific high-security scenarios.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, hybrid algorithms (recommended over QKD)
- **Quantum Threats Addressed**: CRQC threats to key distribution
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: France; Germany; European Union; Bodies: ANSSI, BSI
- **Leaders Contributions Mentioned**: ANSSI and BSI cryptography experts
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: QKD, TLS, IPsec, key exchange
- **Infrastructure Layers**: Network Security, Key Management, Critical Infrastructure
- **Standardization Bodies**: ANSSI, BSI, ETSI
- **Compliance Frameworks Referenced**: ANSSI RGS, BSI TR-02102

---

## Singapore-QRI-2025

- **Reference ID**: Singapore-QRI-2025
- **Title**: Quantum Readiness Index - Draft for Public Consultation (Oct 2025)
- **Authors**: CSA Singapore
- **Publication Date**: 2025-10-01
- **Last Updated**: 2025-10-01
- **Document Status**: Draft for Public Consultation
- **Main Topic**: Singapore's Quantum Readiness Index (QRI) framework providing a maturity model for organizations to self-assess their quantum-safe cryptography readiness. Defines readiness levels across five dimensions: awareness, asset inventory, risk assessment, migration planning, and implementation. Intended for Singapore critical information infrastructure operators, financial institutions, and government agencies to benchmark progress and report annually to CSA Singapore.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA
- **Quantum Threats Addressed**: CRQC, Harvest Now Decrypt Later (HNDL)
- **Migration Timeline Info**: 2025-2030 phased readiness targets; annual QRI reporting from 2026
- **Applicable Regions / Bodies**: Regions: Singapore; APAC; Bodies: CSA Singapore
- **Leaders Contributions Mentioned**: CSA Singapore
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, PKI, SSH
- **Infrastructure Layers**: Enterprise IT, Government IT, Financial Services
- **Standardization Bodies**: CSA, NIST, IETF
- **Compliance Frameworks Referenced**: Singapore Cybersecurity Act, MAS TRM

---

## Singapore-QSH-2025

- **Reference ID**: Singapore-QSH-2025
- **Title**: Quantum-Safe Handbook - Draft for Public Consultation (Oct 2025)
- **Authors**: CSA Singapore
- **Publication Date**: 2025-10-01
- **Last Updated**: 2025-10-01
- **Document Status**: Draft for Public Consultation
- **Main Topic**: Updated Singapore Quantum-Safe Handbook (October 2025 public consultation draft) providing comprehensive guidance for organizations transitioning to quantum-safe cryptography. Expands on the June 2024 version with updated algorithm guidance reflecting final NIST PQC standards (ML-KEM, ML-DSA, SLH-DSA), enhanced migration roadmap, case studies, and sector-specific guidance for financial services, telecommunications, and government agencies.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, hybrid algorithms
- **Quantum Threats Addressed**: CRQC, Harvest Now Decrypt Later (HNDL)
- **Migration Timeline Info**: Updated 2025-2030 phased migration milestones; sector-specific deadlines
- **Applicable Regions / Bodies**: Regions: Singapore; APAC; Bodies: CSA Singapore, IMDA
- **Leaders Contributions Mentioned**: CSA Singapore, IMDA
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, PKI, SSH, IPsec
- **Infrastructure Layers**: Enterprise IT, Government IT, Financial Services, Critical Infrastructure
- **Standardization Bodies**: CSA, NIST, IETF
- **Compliance Frameworks Referenced**: Singapore Cybersecurity Act, MAS TRM, Cyber Trust Mark

---

## HKMA-Fintech-2030-PQC

- **Reference ID**: HKMA-Fintech-2030-PQC
- **Title**: HKMA Fintech Promotion Blueprint 2025 - Quantum Security
- **Authors**: HKMA (Hong Kong Monetary Authority)
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Strategy Report
- **Main Topic**: Hong Kong Monetary Authority fintech and quantum security strategy document outlining HKMA's approach to quantum-safe cryptography for Hong Kong's financial sector. Covers quantum risk assessment requirements for licensed banks, timeline for PQC migration in financial messaging infrastructure, and cross-border quantum-safe communication experiments with Singapore MAS. Sets expectations for Hong Kong financial institutions to complete PQC readiness assessment by 2027.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA
- **Quantum Threats Addressed**: CRQC, Harvest Now Decrypt Later (HNDL)
- **Migration Timeline Info**: PQC readiness assessment required by 2027; phased migration through 2030
- **Applicable Regions / Bodies**: Regions: Hong Kong; APAC; Bodies: HKMA, MAS Singapore, BIS
- **Leaders Contributions Mentioned**: HKMA fintech team
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, PKI, financial messaging (SWIFT)
- **Infrastructure Layers**: Financial Services, Payment Systems, Network Security
- **Standardization Bodies**: HKMA, BIS, NIST
- **Compliance Frameworks Referenced**: HKMA Technology Risk Management, Basel III (technology risk)

---

## OMB-M-23-02

- **Reference ID**: OMB-M-23-02
- **Title**: Memorandum M-23-02: Migrating to Post-Quantum Cryptography
- **Authors**: Office of Management and Budget (OMB); White House
- **Publication Date**: 2022-11-18
- **Last Updated**: 2022-11-18
- **Document Status**: Federal Memorandum
- **Main Topic**: US Office of Management and Budget memorandum directing all federal agencies to inventory their cryptographic systems and develop migration plans for post-quantum cryptography. Requires agencies to identify quantum-vulnerable systems using asymmetric cryptography by September 2023 and prioritize high-value assets with long data lifetimes. Companion to NSM-10, this operational memo translates the national security directive into specific agency action requirements and reporting timelines.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA (referenced as NIST PQC standards)
- **Quantum Threats Addressed**: CRQC, Harvest Now Decrypt Later (HNDL)
- **Migration Timeline Info**: Cryptographic inventory due September 2023; migration plans by 2024; critical systems migrated by 2035
- **Applicable Regions / Bodies**: Regions: United States; Bodies: OMB, CISA, NIST, NSA
- **Leaders Contributions Mentioned**: OMB Deputy Director for Management
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: PKI, TLS, SSH, IPsec
- **Infrastructure Layers**: Government IT, Federal IT, Critical Infrastructure
- **Standardization Bodies**: NIST, NSA, CISA
- **Compliance Frameworks Referenced**: FISMA, NIST SP 800-53, NSM-10, FedRAMP

---

## MAS-Quantum-Advisory-2024

- **Reference ID**: MAS-Quantum-Advisory-2024
- **Title**: MAS Technology Risk and Resilience (TCRS) Quantum Advisory
- **Authors**: MAS (Monetary Authority of Singapore)
- **Publication Date**: 2024-01-01
- **Last Updated**: 2024-01-01
- **Document Status**: Advisory
- **Main Topic**: Singapore Monetary Authority advisory to financial institutions on quantum computing threats and the need to begin PQC migration planning. Covers quantum risk assessment, cryptographic inventory requirements for MAS-regulated entities, and recommended migration approach using hybrid PQC algorithms. Establishes MAS expectations for financial institutions to demonstrate quantum-safe readiness as part of Technology Risk Management framework compliance.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, hybrid algorithms
- **Quantum Threats Addressed**: CRQC, Harvest Now Decrypt Later (HNDL)
- **Migration Timeline Info**: Financial institutions expected to complete risk assessment by 2026; migration plans by 2028
- **Applicable Regions / Bodies**: Regions: Singapore; Bodies: MAS, CSA Singapore
- **Leaders Contributions Mentioned**: MAS Technology Risk Supervision team
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, PKI, SWIFT messaging
- **Infrastructure Layers**: Financial Services, Payment Systems, Banking
- **Standardization Bodies**: MAS, BIS, NIST
- **Compliance Frameworks Referenced**: MAS Technology Risk Management Guidelines, MAS Notice on Cyber Hygiene

---

## NSM-10

- **Reference ID**: NSM-10
- **Title**: National Security Memorandum 10: Promoting United States Leadership in Quantum Computing While Mitigating Risks to Vulnerable Cryptographic Systems
- **Authors**: White House; National Security Council
- **Publication Date**: 2022-05-04
- **Last Updated**: 2022-05-04
- **Document Status**: National Security Memorandum
- **Main Topic**: US presidential directive establishing national policy for quantum computing leadership and cryptographic modernization. NSM-10 directs federal agencies to assess and mitigate quantum-vulnerable cryptographic systems, establishes CNSA 2.0 as the standard for national security systems, sets 2035 as the deadline for federal migration to NIST-approved PQC algorithms, and creates interagency coordination mechanisms for the PQC transition. Foundational policy document underpinning all subsequent US federal PQC directives including OMB M-23-02, NIST SP 800-227, and agency-specific guidance.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA (NIST PQC standards mandated)
- **Quantum Threats Addressed**: CRQC, Harvest Now Decrypt Later (HNDL), quantum computing leadership competition
- **Migration Timeline Info**: 2035 deadline for full federal migration; CNSA 2.0 for national security systems by 2030; critical priority systems by 2030
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NSC, CISA, NSA, NIST, OMB
- **Leaders Contributions Mentioned**: White House National Security Advisor
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: PKI, TLS, SSH, IPsec, national security communications
- **Infrastructure Layers**: Government IT, National Security Systems, Critical Infrastructure, Defence
- **Standardization Bodies**: NIST, NSA, CISA, OMB
- **Compliance Frameworks Referenced**: FISMA, CNSA 2.0, NSM-8, FedRAMP, Federal Information Security

---

## Five-Eyes-PQC-Joint-Statement

- **Reference ID**: Five-Eyes-PQC-Joint-Statement
- **Title**: Preparing Critical Infrastructure for Post-Quantum Cryptography: Five Eyes Joint Statement
- **Authors**: CISA; NSA; NCSC UK; NCSC Canada; ASD Australia; GCSB New Zealand
- **Publication Date**: 2023-08-21
- **Last Updated**: 2023-08-21
- **Document Status**: Joint Advisory
- **Main Topic**: Joint advisory from Five Eyes alliance cybersecurity agencies (US CISA/NSA, UK NCSC, Canadian CCCS, Australian ASD, and New Zealand GCSB) calling on critical infrastructure owners and operators to prepare for post-quantum cryptography. Identifies the harvest-now-decrypt-later threat as immediate, provides practical guidance for beginning PQC migration, and recommends NIST PQC algorithm adoption. Represents unprecedented multilateral coordination on PQC migration policy for allied nations' critical infrastructure.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA
- **Quantum Threats Addressed**: CRQC, Harvest Now Decrypt Later (HNDL), nation-state quantum adversaries
- **Migration Timeline Info**: Immediate action required for long-lived sensitive data; full transition aligned with national timelines (2035 US; 2030 UK partial)
- **Applicable Regions / Bodies**: Regions: United States; United Kingdom; Canada; Australia; New Zealand; Bodies: CISA, NSA, NCSC, CCCS, ASD, GCSB
- **Leaders Contributions Mentioned**: CISA Director, NSA Cybersecurity Directorate
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, PKI, SSH, IPsec, OT protocols
- **Infrastructure Layers**: Critical Infrastructure, Government IT, OT/ICS/SCADA, Defence
- **Standardization Bodies**: NIST, NCSC, ASD
- **Compliance Frameworks Referenced**: NIST Cybersecurity Framework, IEC 62443, FISMA

---

## PQC-Country-Initiatives-2025

- **Reference ID**: PQC-Country-Initiatives-2025
- **Title**: Post-Quantum Government Initiatives by Country and Region (March 2025)
- **Authors**: Various (compiled survey)
- **Publication Date**: 2025-03-02
- **Last Updated**: 2025-03-02
- **Document Status**: Reference Report
- **Main Topic**: Comprehensive survey of post-quantum cryptography government initiatives, policies, and migration programs across countries and regions as of March 2025. Covers national PQC roadmaps, regulatory requirements, funding programs, and implementation status for major economies including the US, EU member states, UK, Canada, Australia, Japan, Singapore, South Korea, China, and emerging markets. Serves as a reference for organizations tracking regulatory requirements across multiple jurisdictions.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA (referenced across jurisdictions)
- **Quantum Threats Addressed**: CRQC, Harvest Now Decrypt Later (HNDL)
- **Migration Timeline Info**: Multiple jurisdiction timelines covered: US 2035, EU 2030, UK 2035, Singapore 2030, Japan 2030
- **Applicable Regions / Bodies**: Regions: Global; Bodies: Multiple national cybersecurity agencies
- **Leaders Contributions Mentioned**: Multiple government agency representatives
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, PKI, SSH (referenced across jurisdictions)
- **Infrastructure Layers**: Government IT, Critical Infrastructure
- **Standardization Bodies**: NIST, ETSI, CRYPTREC, BSI, ANSSI, CSA
- **Compliance Frameworks Referenced**: Multiple national frameworks

---

## CISA-PQC-Migration-Strategy

- **Reference ID**: CISA-PQC-Migration-Strategy
- **Title**: Strategy for Migrating to Automated PQC Discovery and Inventory Tools
- **Authors**: CISA (Cybersecurity and Infrastructure Security Agency)
- **Publication Date**: 2024-01-01
- **Last Updated**: 2024-01-01
- **Document Status**: Strategy Document
- **Main Topic**: CISA strategy document addressing the challenge of cryptographic discovery and inventory at scale for federal agencies and critical infrastructure operators migrating to PQC. Outlines an automated approach for identifying quantum-vulnerable cryptographic implementations across enterprise networks, defining criteria for PQC migration prioritization, and establishing operational workflows for continuous cryptographic visibility. Directly supports OMB M-23-02 inventory requirements and NSM-10 migration directives.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA
- **Quantum Threats Addressed**: CRQC, Harvest Now Decrypt Later (HNDL)
- **Migration Timeline Info**: Supports OMB M-23-02 deadlines; continuous inventory as ongoing operational requirement
- **Applicable Regions / Bodies**: Regions: United States; Bodies: CISA, NSA, OMB
- **Leaders Contributions Mentioned**: CISA Cybersecurity Division
- **PQC Products Mentioned**: Automated cryptographic discovery tools (generic category)
- **Protocols Covered**: TLS, SSH, PKI, IPsec
- **Infrastructure Layers**: Enterprise IT, Federal IT, Critical Infrastructure, OT/ICS/SCADA
- **Standardization Bodies**: NIST, CISA
- **Compliance Frameworks Referenced**: FISMA, OMB M-23-02, NSM-10, FedRAMP

---

## Japan CRYPTREC Report 2024

- **Reference ID**: Japan CRYPTREC Report 2024
- **Title**: CRYPTREC Cryptographic Technology Guidelines (Post-Quantum Cryptography) FY2024 Edition
- **Authors**: CRYPTREC Cryptographic Technology Investigation Working Group (Post-Quantum Cryptography)
- **Publication Date**: 2025-03-01
- **Last Updated**: 2025-03-01
- **Document Status**: Technical Report (covers research through September 30, 2024)
- **Main Topic**: Comprehensive Japanese government evaluation of post-quantum cryptography algorithms for potential adoption into the CRYPTREC e-Government recommended cipher list. Analyzes five PQC algorithm families (lattice-based, code-based, multivariate, isogeny-based, hash-based signatures), covering security foundations, parameter sets, and implementation considerations. Traces the NIST PQC standardisation process (FIPS 203/204/205/206), presents Mosca's inequality (X+Y > Z) as the framework for migration urgency, reviews international standardisation activity (NIST, ETSI, IETF, KpqC Korea, ISO/IEC), and recommends crypto agility and hybrid classical+PQC configurations as migration approach. Reflects quantum hardware roadmaps from IBM and Fujitsu to establish CRQC risk window estimates.
- **PQC Algorithms Covered**: ML-KEM (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205), FN-DSA/FALCON (FIPS 206), HQC (NIST selected March 2025), FrodoKEM, Streamlined NTRU Prime, CRYSTALS-Dilithium (predecessor to ML-DSA), Classic McEliece, BIKE (code-based), multivariate schemes, isogeny-based schemes
- **Quantum Threats Addressed**: CRQC (Cryptographically Relevant Quantum Computer), Harvest Now Decrypt Later (HNDL), Shor's algorithm breaking RSA/ECC/DH/ECDH, Grover's algorithm halving symmetric key effective length, Mosca's inequality X+Y > Z migration urgency framework
- **Migration Timeline Info**: US NSM-10 2035 target for full PQC transition; IBM 2029 roadmap (100M executable gates), Fujitsu 2026 (1000 physical qubits); Japanese e-Government cipher list update under consideration; NIST NCCoE SP 1800-38A/B/C migration guidance; historical pattern suggests 10-year migration cycles
- **Applicable Regions / Bodies**: Regions: Japan, United States, Korea, Europe; Bodies: CRYPTREC, NIST, NSA, KpqC (Korea), ISO/IEC, IETF, ETSI, BSI, ANSSI, NCSC
- **Leaders Contributions Mentioned**: CRYPTREC working group members (Japanese academia and government); IBM Quantum roadmap (2023); Fujitsu quantum roadmap; Michele Mosca (Mosca's inequality)
- **PQC Products Mentioned**: OpenSSH (Streamlined NTRU Prime implementation referenced)
- **Protocols Covered**: SSH (OpenSSH with Streamlined NTRU Prime), PKI, e-Government digital signature systems, TLS (implied via IETF coverage)
- **Infrastructure Layers**: Government IT (e-Government), PKI/Digital Signatures, Internet Communications, Enterprise IT
- **Standardization Bodies**: CRYPTREC, NIST, ISO/IEC, IETF, KpqC (Korea), ETSI, BSI, ANSSI, NCSC, NSA
- **Compliance Frameworks Referenced**: CNSA 2.0, NSM-10, NIST SP 800-208, NIST SP 1800-38 series, CRYPTREC e-Government Recommended Cipher List

---

## ANSSI-PQC-Position-2022

- **Reference ID**: ANSSI-PQC-Position-2022
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition
- **Authors**: ANSSI (Agence nationale de la sécurité des systèmes d'information)
- **Publication Date**: 2022-01-04
- **Last Updated**: 2022-01-04
- **Document Status**: Published
- **Main Topic**: ANSSI presents France's authoritative position on PQC transition, advocating hybrid post-quantum/classical cryptographic schemes as the primary migration strategy. The document establishes ANSSI's stance that cryptographic agility and careful algorithm selection are critical for organizations moving toward quantum-safe infrastructure.
- **PQC Algorithms Covered**: Not specifically listed in available excerpt; reference to NIST standardization efforts implied
- **Quantum Threats Addressed**: Cryptographically Relevant Quantum Computer (CRQC), future quantum threats to asymmetric cryptography
- **Migration Timeline Info**: Post-2030 transition required; 2027 target for PQC mandatory in product qualification
- **Applicable Regions / Bodies**: Regions: France, EU; Bodies: ANSSI, European Commission
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected in excerpt
- **Protocols Covered**: Generic asymmetric cryptography protocols; certificate/PKI contexts mentioned
- **Infrastructure Layers**: PKI/IGC, government information systems, commercial products
- **Standardization Bodies**: NIST (referenced for standardization efforts)
- **Compliance Frameworks Referenced**: FIPS 140-3 context implied; Diffusion Restreinte (DR) classification

---

## ANSSI-PQC-FAQ-2025

- **Reference ID**: ANSSI-PQC-FAQ-2025
- **Title**: ANSSI Post-Quantum Cryptography FAQ
- **Authors**: ANSSI
- **Publication Date**: 2025-10-01
- **Last Updated**: 2025-10-01
- **Document Status**: Published
- **Main Topic**: ANSSI provides comprehensive FAQ guidance on PQC transition covering algorithm selection, hybrid deployment strategies, product certification, and organizational migration timelines. Addresses both public and private sector requirements, emphasizing mandatory product qualification obligations starting 2027.
- **PQC Algorithms Covered**: ML-KEM (CRYSTALS-Kyber), ML-DSA (CRYSTALS-Dilithium), SLH-DSA, XMSS, LMS, FALCON, HQC, FrodoKEM
- **Quantum Threats Addressed**: CRQC (Cryptographically Relevant Quantum Computer), Harvest-Now-Decrypt-Later (HNDL), long-term data confidentiality threats
- **Migration Timeline Info**: 2030: no new non-PQC products should be purchased; 2027: PQC mandatory for product qualifications; 2026: IPsec DR referential update planned; ongoing: continuous migration planning required
- **Applicable Regions / Bodies**: Regions: France, EU; Bodies: ANSSI, ECCG (European Cybersecurity Certification Group), ENISA, CEA-Leti
- **Leaders Contributions Mentioned**: None explicitly named
- **PQC Products Mentioned**: Thales and Samsung products certified by ANSSI (October 2025); first Visas de sécurité for lattice-based PQC algorithms
- **Protocols Covered**: TLS, X.509/PKI, SSH, IPsec, generic key encapsulation mechanisms (KEM), digital signatures
- **Infrastructure Layers**: PKI/IGC, HSM, embedded systems, commercial cryptographic products, government information systems
- **Standardization Bodies**: NIST, IETF, ETSI, ISO/IEC, ANSSI, ECCG/ENISA
- **Compliance Frameworks Referenced**: FIPS 140-3, PG-083 (ANSSI cryptographic mechanisms guide), Agreed Cryptographic Mechanisms (ACM), Diffusion Restreinte (DR), WebTrust

---

## EC-Recommendation-2024-1101

- **Reference ID**: EC-Recommendation-2024-1101
- **Title**: European Commission Recommendation on Post-Quantum Cryptography (2024/1101)
- **Authors**: European Commission, Directorate-General for Communications Networks, Content and Technology (DG CONNECT)
- **Publication Date**: 2024-11-26
- **Last Updated**: 2024-11-26
- **Document Status**: Published
- **Main Topic**: European Commission formal Recommendation (2024/1101) directing EU member states to develop and implement coordinated PQC migration roadmaps by 2030. Addresses cryptographic asset management maturity, quantum threat risk integration, and crypto-agility requirements across EU jurisdictions.
- **PQC Algorithms Covered**: NIST-standardized PQC algorithms (specific names in coordinated implementation roadmap referenced); ANSSI recommendations reflected
- **Quantum Threats Addressed**: CRQC, long-term data confidentiality risks, "harvest now, decrypt later" scenarios, systemic financial and critical infrastructure exposure
- **Migration Timeline Info**: 2030: member state PQC migration roadmaps due; coordinated EU implementation roadmap issued June 2025; ongoing crypto-agility framework development
- **Applicable Regions / Bodies**: Regions: EU member states, all 27 member jurisdictions; Bodies: European Commission, ANSSI (co-lead), BSI (Germany), Dutch cyber agencies, ENISA, national security authorities
- **Leaders Contributions Mentioned**: None detected in excerpt
- **PQC Products Mentioned**: None specifically detected
- **Protocols Covered**: Generic cryptographic protocols, blockchain/distributed ledger implications, digital signatures, key exchange
- **Infrastructure Layers**: Government systems, critical infrastructure, financial sector, public sector services
- **Standardization Bodies**: NIST, IETF, ETSI, ISO/IEC, European standardization bodies
- **Compliance Frameworks Referenced**: European cybersecurity certification framework, ETSI standards, national regulatory frameworks of member states

---

## G7-Financial-PQC-Roadmap-2026

- **Reference ID**: G7-Financial-PQC-Roadmap-2026
- **Title**: G7 Cyber Expert Group Releases Roadmap for Coordinating the Transition to Post-Quantum Cryptography in the Financial Sector
- **Authors**: G7 Cyber Expert Group (co-chaired by U.S. Treasury and Bank of England); U.S. Department of the Treasury; G7 Finance Ministers; financial authorities across G7 countries + EU
- **Publication Date**: 2026-01-17
- **Last Updated**: 2026-01-12
- **Document Status**: Published
- **Main Topic**: G7 CEG roadmap for financial sector PQC migration covering cryptographic risk inventory, asset prioritization, algorithm selection, vendor roadmap coordination, and sector-wide operational guidelines. Emphasizes quantum resilience as critical for financial system safety and soundness.
- **PQC Algorithms Covered**: NIST-standardized PQC algorithms (referenced generically); sector-specific algorithm recommendations implied
- **Quantum Threats Addressed**: CRQC capability to break encryption tools, systemic financial ecosystem risks, payment system integrity threats, data confidentiality for long-lived financial records
- **Migration Timeline Info**: Multi-year transition framework; flexible implementation timelines per organization; roadmap provides guidance for 10-year horizon
- **Applicable Regions / Bodies**: Regions: G7 countries (US, UK, Canada, France, Germany, Italy, Japan) + European Union; Bodies: U.S. Treasury, Bank of England, financial authorities, central banks, regulatory agencies
- **Leaders Contributions Mentioned**: Cory Wilson (U.S. Treasury Deputy Assistant Secretary for Cybersecurity); Duncan Mackinnon (Bank of England Executive Director for Supervisory Risk)
- **PQC Products Mentioned**: None specifically listed; vendor coordination and roadmap review emphasized
- **Protocols Covered**: Financial transaction protocols, payment systems cryptography, data protection standards
- **Infrastructure Layers**: Financial systems infrastructure, banking networks, payment processors, regulatory systems, cloud financial services
- **Standardization Bodies**: NIST, financial sector standards bodies (SWIFT, ISO financial cryptography standards)
- **Compliance Frameworks Referenced**: Financial regulatory frameworks (Prudential Regulation Authority, SEC regulations implied), cybersecurity frameworks for financial institutions

---

## CA-TBS-SPIN-PQC-2025

- **Reference ID**: CA-TBS-SPIN-PQC-2025
- **Title**: Canada TBS SPIN 2025-01 — Migrating Government of Canada Systems to Post-Quantum Cryptography
- **Authors**: Treasury Board of Canada Secretariat (TBS); Government of Canada; Canadian Centre for Cyber Security
- **Publication Date**: 2025-10-09
- **Last Updated**: 2025-10-09
- **Document Status**: Published (Security Policy Implementation Notice - SPIN)
- **Main Topic**: TBS SPIN directive requiring Canadian federal departments and agencies to initiate PQC migration planning with cryptographic inventory requirements. Establishes three-phase migration roadmap (Preparation, Identification, Transition) with binding milestones from 2026-2035, addressing quantum threats to sensitive government data and IT infrastructure.
- **PQC Algorithms Covered**: Algorithms compliant with Cyber Centre recommendations in ITSP.40.111 (specific algorithm list in referenced standard)
- **Quantum Threats Addressed**: CRQC, Harvest-Now-Decrypt-Later (HNDL) attack scenarios, long-term confidentiality of Protected A/B information, quantum-enabled cryptanalysis of current systems
- **Migration Timeline Info**: 2026-04-01: Phase 1 (Preparation) — departmental PQC migration plans due; 2027-04-01: Phase 2 (Identification) — cryptographic inventory updates; 2028-04-01: Phase 3 (Transition) begins; 2031: high-priority systems migration complete; 2035: full migration target
- **Applicable Regions / Bodies**: Regions: Canada (federal government); Bodies: Treasury Board of Canada Secretariat, Canadian Centre for Cyber Security, Shared Services Canada (SSC), all federal departments and agencies
- **Leaders Contributions Mentioned**: None specifically named
- **PQC Products Mentioned**: None specifically listed; vendor and product version tracking mandated
- **Protocols Covered**: Generic IT system cryptography, network services, operating systems, applications, code development pipelines, public cryptography infrastructure protocols
- **Infrastructure Layers**: Federal government information systems, PKI, network infrastructure, cloud services, departmental applications, software supply chain
- **Standardization Bodies**: Cyber Centre (Canadian standards authority), NIST (referenced for CMVP certification)
- **Compliance Frameworks Referenced**: Policy on Government Security, Policy on Service and Digital, Directive on Security Management, ITSP.40.111 (Cryptographic Algorithms for Unclassified/Protected A/B), ITSP.40.001 (PQC Roadmap), ITSAP.40.018 (Cryptographic Agility Guidance), FIPS 140-3 (CMVP validation)

---

## ENISA-PQC-Integration-Study-2022

- **Reference ID**: ENISA-PQC-Integration-Study-2022
- **Title**: Post-Quantum Cryptography - Integration Study
- **Authors**: ENISA; European Union Agency for Cybersecurity
- **Publication Date**: 2022-10-18
- **Last Updated**: 2022-10-18
- **Document Status**: Published
- **Main Topic**: ENISA's report on post-standardization challenges for integrating PQC into existing security protocols. Explores necessity to design new cryptographic protocols and integrate post-quantum systems into existing protocols following ENISA's 2021 PQC baseline study.
- **PQC Algorithms Covered**: None detected (general integration guidance; specific algorithms not listed in available metadata)
- **Quantum Threats Addressed**: Cryptographic break risk from quantum computers on current encryption schemes
- **Migration Timeline Info**: None detected (guidance-focused; no specific migration deadlines provided)
- **Applicable Regions / Bodies**: Regions: European Union; Bodies: ENISA (EU Agency for Cybersecurity)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS; PKI; Code signing
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected (post-standardization focus)
- **Compliance Frameworks Referenced**: None detected

---

## Europol-QSFF-Call-to-Action-2025

- **Reference ID**: Europol-QSFF-Call-to-Action-2025
- **Title**: Quantum Safe Financial Forum - A Call to Action
- **Authors**: Europol; Quantum Safe Financial Forum
- **Publication Date**: 2025-02-07
- **Last Updated**: 2025-02-07
- **Document Status**: Published
- **Main Topic**: Call to action for European financial institutions to transition to post-quantum cryptography. Addresses immediate need for PQC migration planning to mitigate HNDL (harvest now, decrypt later) quantum threats. Emphasizes coordinated industry-policymaker effort and improved cryptography management practices.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest now, decrypt later (HNDL) threat from quantum computers breaking current encryption
- **Migration Timeline Info**: Urgent transition required; no specific deadlines stated in metadata
- **Applicable Regions / Bodies**: Regions: Europe; Bodies: Europol, Quantum Safe Financial Forum (QSFF), European Cybercrime Centre (EC3)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: General cryptography management practices for financial systems
- **Infrastructure Layers**: Financial sector
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected

---

## UK-DSIT-CNI-PQC-Perspectives-2025

- **Reference ID**: UK-DSIT-CNI-PQC-Perspectives-2025
- **Title**: Perspectives on the Plan for PQC Transition from CNI Sectors
- **Authors**: DSIT (Department for Science, Innovation and Technology); UK Government; Cambridge Consultants; Capgemini
- **Publication Date**: 2025-11-27
- **Last Updated**: 2025-11-27
- **Document Status**: Published
- **Main Topic**: Independent research on UK critical national infrastructure (CNI) sector perspectives regarding PQC transition planning. Explores how five key CNI sectors (energy, financial services, healthcare, telecommunications, transport) are engaging with post-quantum cryptography migration requirements and regulatory guidance from NCSC.
- **PQC Algorithms Covered**: None detected (guidance and regulatory perspective focus)
- **Quantum Threats Addressed**: Quantum computers within next decade capable of breaking encryption schemes; compromise of privacy and security of digital communications
- **Migration Timeline Info**: NCSC published migration timelines; quantum threat expected within next decade; no specific 2030/2033 deadlines in available metadata
- **Applicable Regions / Bodies**: Regions: United Kingdom; Bodies: DSIT, NCSC (National Cyber Security Centre), UK CNI sector regulators
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: General cyber security schemes for CNI
- **Infrastructure Layers**: Five key sectors - energy, financial services, healthcare, telecommunications, transport
- **Standardization Bodies**: NCSC (UK advisory)
- **Compliance Frameworks Referenced**: UK PQC migration timelines from NCSC

---

## NATO-Quantum-Strategy-2024

- **Reference ID**: NATO-Quantum-Strategy-2024
- **Title**: NATO Quantum Technologies Strategy
- **Authors**: NATO; North Atlantic Treaty Organization
- **Publication Date**: 2024-01-17
- **Last Updated**: 2024-01-17
- **Document Status**: Published
- **Main Topic**: NATO's first-ever quantum technologies strategy, approved by NATO Foreign Ministers on 28 November 2023. Commits Alliance to quantum-readiness including post-quantum migration of classified communications. Addresses quantum as game-changer for security and modern warfare.
- **PQC Algorithms Covered**: None detected (high-level strategy document)
- **Quantum Threats Addressed**: Quantum computing revolutionary advances; potential to break security of classified communications and modern defense systems
- **Migration Timeline Info**: None detected (strategic commitment; no specific transition deadlines in available metadata)
- **Applicable Regions / Bodies**: Regions: NATO Alliance (30 member states); Bodies: NATO Foreign Ministers, NATO Secretary General, NATO Headquarters
- **Leaders Contributions Mentioned**: NATO Secretary General; NATO Foreign Ministers
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Classified communications protocols
- **Infrastructure Layers**: Military and defense systems
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: NATO 2022 Strategic Concept

---

## US-NSA-CNSA-2.0-2022

- **Reference ID**: US-NSA-CNSA-2.0-2022
- **Title**: NSA Commercial National Security Algorithm Suite 2.0 (CNSA 2.0)
- **Authors**: NSA; National Security Agency; NQCO (National Quantum Coordination Office)
- **Publication Date**: 2022-10-19
- **Last Updated**: 2022-10-19
- **Document Status**: Published
- **Main Topic**: NSA's future quantum-resistant algorithm requirements for National Security Systems (NSS). Cybersecurity Advisory specifying algorithms for classified networks and systems critical to military and intelligence. Mandates transition planning from current cryptography to QR algorithms.
- **PQC Algorithms Covered**: ML-KEM-1024; ML-DSA-87; LMS/XMSS (hash-based signatures)
- **Quantum Threats Addressed**: Cryptanalytically-relevant quantum computers (CRQC) potential to break public-key asymmetric cryptography; foreign pursuits in quantum computing
- **Migration Timeline Info**: 2030-2033 transition deadlines for NSS (implied by CNSA 2.0 planning horizon)
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NSA, National Quantum Coordination Office (NQCO), U.S. Government
- **Leaders Contributions Mentioned**: None detected (agency advisory)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: National Security System (NSS) cryptographic protocols for classified communications
- **Infrastructure Layers**: Military and intelligence networks; classified information systems
- **Standardization Bodies**: NIST (implied via CNSA 2.0 standards)
- **Compliance Frameworks Referenced**: NSA Cybersecurity Advisory; Commercial National Security Algorithm Suite standards

---

## SG-MAS-Quantum-Advisory-2024

- **Reference ID**: SG-MAS-Quantum-Advisory-2024
- **Title**: MAS Advisory on Addressing Cybersecurity Risks Associated with Quantum Computing
- **Authors**: MAS; Monetary Authority of Singapore
- **Publication Date**: 2024-02-20
- **Last Updated**: 2024-02-20
- **Document Status**: Published
- **Main Topic**: MAS advisory requiring Singapore financial institutions to develop quantum risk management programs and conduct cryptographic inventory assessments. Addresses the strategic imperative for the financial sector to prepare for quantum computing threats and transition to post-quantum cryptographic systems.
- **PQC Algorithms Covered**: ML-KEM; ML-DSA; SLH-DSA; hybrid approaches combining classical and PQC algorithms
- **Quantum Threats Addressed**: Harvest now, decrypt later (HNDL) attacks; quantum computing threat to RSA, ECDSA; vulnerabilities in current cryptographic infrastructure
- **Migration Timeline Info**: 2024-2026: Discovery and planning phase; 2026-2030: Active migration and implementation; 2030 onwards: Completion and monitoring
- **Applicable Regions / Bodies**: Regions: Singapore; Bodies: MAS (Monetary Authority of Singapore), Singapore financial institutions
- **Leaders Contributions Mentioned**: Singapore financial sector leaders; DBS Bank; OCBC; UOB
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.3; X.509 PKI; financial settlement protocols
- **Infrastructure Layers**: Cryptographic infrastructure; key management systems; banking networks; payment systems
- **Standardization Bodies**: NIST; ISO/IEC
- **Compliance Frameworks Referenced**: MAS regulatory framework; Singapore cybersecurity guidelines; financial sector risk management standards

---

## SG-MAS-QKD-Sandbox-Report-2025

- **Reference ID**: SG-MAS-QKD-Sandbox-Report-2025
- **Title**: MAS QKD Proof-of-Concept Sandbox Technical Report
- **Authors**: MAS; DBS; HSBC; OCBC; UOB; Singtel; SPTel
- **Publication Date**: 2025-09-29
- **Last Updated**: 2025-09-29
- **Document Status**: Published
- **Main Topic**: Technical report on a QKD proof-of-concept sandbox conducted from September 2024 to March 2025. Demonstrates feasibility and operational viability of quantum key distribution for secure key exchange in Singapore's financial settlement systems, achieving 6.75M AES-256 keys per day per bank.
- **PQC Algorithms Covered**: None (QKD-specific; separate from post-quantum cryptography algorithms)
- **Quantum Threats Addressed**: Long-term cryptographic compromise; need for provably secure key exchange; quantum key distribution as complementary quantum-safe technology
- **Migration Timeline Info**: PoC period: Sept 2024 - March 2025; Practical deployment feasibility established 2025
- **Applicable Regions / Bodies**: Regions: Singapore; Bodies: MAS, DBS, HSBC, OCBC, UOB, Singtel, SPTel
- **Leaders Contributions Mentioned**: Singapore banking leaders; telecommunications providers; MAS technical team
- **PQC Products Mentioned**: QKD systems; quantum key distribution infrastructure
- **Protocols Covered**: QKD (BB84, decoy-state variants); AES-256 symmetric encryption; settlement protocols
- **Infrastructure Layers**: Banking networks; payment settlement systems; telecommunications infrastructure; key management infrastructure
- **Standardization Bodies**: ITU-T; ETSI
- **Compliance Frameworks Referenced**: Singapore financial sector regulations; MAS guidelines; banking settlement standards

---

## PQCC-Migration-Roadmap-2025

- **Reference ID**: PQCC-Migration-Roadmap-2025
- **Title**: Post-Quantum Cryptography Coalition (PQCC) PQC Migration Roadmap
- **Authors**: PQCC; Post-Quantum Cryptography Coalition
- **Publication Date**: 2025-05-16
- **Last Updated**: 2025-06-12
- **Document Status**: Published
- **Main Topic**: Comprehensive tailorable guide for organizations of any size navigating PQC migration complexities. Outlines a strategic framework across four critical categories: Preparation, Baseline Understanding, Planning and Execution, and Monitoring and Evaluation. Provides actionable tools and methodologies to safeguard data against quantum threats.
- **PQC Algorithms Covered**: NIST-standardized PQC algorithms; ML-KEM; ML-DSA; SLH-DSA; hybrid cryptographic approaches
- **Quantum Threats Addressed**: Emerging quantum computing threats; harvest now, decrypt later attacks; long-term data compromise; quantum threat to current PKI infrastructure
- **Migration Timeline Info**: Phased approach with strategic timelines; readiness assessment (Preparation phase); asset prioritization for migration planning; long-term monitoring beyond initial migration
- **Applicable Regions / Bodies**: Regions: International; Bodies: PQCC (Post-Quantum Cryptography Coalition); MITRE Corporation
- **Leaders Contributions Mentioned**: Post-Quantum Cryptography Coalition members; industry stakeholders; standards organizations
- **PQC Products Mentioned**: None specific (vendor-agnostic guidance)
- **Protocols Covered**: PKI protocols; TLS; key management protocols; cryptographic protocols requiring migration
- **Infrastructure Layers**: Cryptographic systems; key management; network security; application infrastructure; legacy systems
- **Standardization Bodies**: NIST; ISO/IEC; IEEE
- **Compliance Frameworks Referenced**: Industry standards; organizational security policies; governance frameworks; compliance requirements

---

## PQCC-Inventory-Workbook-2025

- **Reference ID**: PQCC-Inventory-Workbook-2025
- **Title**: Post-Quantum Cryptography Coalition (PQCC) PQC Inventory Workbook
- **Authors**: PQCC; Post-Quantum Cryptography Coalition
- **Publication Date**: 2025-06-01
- **Last Updated**: 2025-06-12
- **Document Status**: Published
- **Main Topic**: Structured workbook for building cryptographic inventories essential for PQC migration planning. Provides streamlined fields to assess PQC needs, plan system lifecycles, and prioritize assets for migration. Helps organizations identify and track systems for transition to quantum-resistant cryptography.
- **PQC Algorithms Covered**: Inventory coverage of both classical and PQC algorithms; vulnerability assessment of common algorithms; NIST-standardized algorithms
- **Quantum Threats Addressed**: Algorithm vulnerability assessment; transition planning from vulnerable algorithms; long-term cryptographic compromise scenarios
- **Migration Timeline Info**: System lifecycle planning; prioritization by migration urgency (high/medium/low); inventory updates and tracking over time
- **Applicable Regions / Bodies**: Regions: International; Bodies: PQCC; MITRE Corporation; organizations of all sizes
- **Leaders Contributions Mentioned**: Post-Quantum Cryptography Coalition; industry organizations contributing to PQCC initiatives
- **PQC Products Mentioned**: None specific (tool/workbook-focused)
- **Protocols Covered**: Cryptographic protocols; PKI; key management protocols; protocols requiring vulnerability assessment
- **Infrastructure Layers**: Application systems; cryptographic infrastructure; key management systems; organizational assets; legacy systems
- **Standardization Bodies**: NIST; ISO/IEC
- **Compliance Frameworks Referenced**: Migration standards; organizational security governance; asset management frameworks

---

## UK-NCSC-PQC-Whitepaper-2024

- **Reference ID**: UK-NCSC-PQC-Whitepaper-2024
- **Title**: NCSC White Paper — Next Steps in Preparing for Post-Quantum Cryptography
- **Authors**: NCSC UK; UK National Cyber Security Centre
- **Publication Date**: 2024-11-01
- **Last Updated**: 2024-11-01
- **Document Status**: Published
- **Main Topic**: UK NCSC white paper providing updated PQC migration preparation guidance aligned with NIST-finalized standards. Covers algorithm selection criteria, hybrid PQC approaches, migration prioritization strategies, and organizational readiness assessment. Updates and supersedes 2023 guidance to reflect final standardization outcomes.
- **PQC Algorithms Covered**: ML-KEM (CRYSTALS-Kyber); ML-DSA (CRYSTALS-Dilithium); SLH-DSA (SPHINCS+); hybrid PQC combinations with classical algorithms; FIPS 203/204/205 standardized algorithms
- **Quantum Threats Addressed**: Harvest now, decrypt later attacks; quantum computing threat timeline; cryptanalytic risk to RSA, ECDH, ECDSA; long-term data protection requirements
- **Migration Timeline Info**: Phased migration approach; near-term readiness (2024-2026); active migration (2026-2032); completion targets aligned with NIST guidance
- **Applicable Regions / Bodies**: Regions: United Kingdom; Bodies: NCSC (National Cyber Security Centre); UK government; critical infrastructure operators
- **Leaders Contributions Mentioned**: NCSC leadership; UK government cybersecurity authorities; critical infrastructure sector participants
- **PQC Products Mentioned**: Vendor products supporting NIST-finalized algorithms; cryptographic libraries implementing ML-KEM, ML-DSA, SLH-DSA
- **Protocols Covered**: TLS 1.3 with PQC support; X.509 PKI; SSH; VPN protocols; email signing protocols; hybrid protocol deployments
- **Infrastructure Layers**: Government networks; critical national infrastructure; financial systems; healthcare systems; telecommunications; energy sector; transport systems
- **Standardization Bodies**: NIST; FIPS 203/204/205; ISO/IEC; RFC standards
- **Compliance Frameworks Referenced**: UK government security standards; NCSC guidance; critical infrastructure protection; sector-specific regulatory requirements

---

## UK-NCSC-Migration-Timelines-2025

- **Reference ID**: UK-NCSC-Migration-Timelines-2025
- **Title**: NCSC PQC Migration Timelines Guidance
- **Authors**: NCSC UK; UK National Cyber Security Centre
- **Publication Date**: 2025-05-01
- **Last Updated**: 2025-05-01
- **Document Status**: Published
- **Main Topic**: UK NCSC three-phase PQC migration timeline guidance establishing mandatory milestones. Phase 1 (by 2028): Discovery, inventory, and planning; Phase 2 (2028-2031): Active migration and hybrid deployment; Phase 3 (by 2035): Complete transition to quantum-safe cryptography. Provides regulatory and operational timelines for UK government and critical infrastructure.
- **PQC Algorithms Covered**: NIST FIPS 203/204/205 algorithms; ML-KEM; ML-DSA; SLH-DSA; hybrid classical-PQC combinations
- **Quantum Threats Addressed**: Harvest now, decrypt later attacks; post-quantum threat landscape; quantum computing advancement; long-term data confidentiality and integrity
- **Migration Timeline Info**: Phase 1 (2025-2028): Discovery and inventory completion; Phase 2 (2028-2031): Active migration, pilot deployments, hybrid modes; Phase 3 (2031-2035): Full quantum-safe transition; Completion target: 2035
- **Applicable Regions / Bodies**: Regions: United Kingdom; Bodies: NCSC; UK government; critical national infrastructure operators; financial sector; healthcare; telecommunications; energy; transport
- **Leaders Contributions Mentioned**: NCSC leadership; UK government cybersecurity authorities; critical infrastructure sector leads
- **PQC Products Mentioned**: Cryptographic products supporting FIPS 203/204/205; commercial and open-source PQC implementations; TLS libraries with hybrid support
- **Protocols Covered**: TLS 1.3 hybrid mode; X.509 certificates with PQC; SSH PQC variants; VPN protocols; email and code signing with PQC; DNS/DNSSEC migration
- **Infrastructure Layers**: Government IT systems; national security infrastructure; banking and finance; healthcare systems; telecommunications networks; energy/utility systems; transportation; higher education
- **Standardization Bodies**: NIST; FIPS 203/204/205; ISO/IEC; IETF RFC; BSI (via international coordination)
- **Compliance Frameworks Referenced**: UK cybersecurity regulations; National Security and Investment Act (NSIA); critical infrastructure protection; PQC mandatory compliance by 2035; sector-specific regulatory requirements

---

## AU-ASD-ISM-Crypto-2024

- **Reference ID**: AU-ASD-ISM-Crypto-2024
- **Title**: ASD Information Security Manual — Guidelines for Cryptography (December 2024)
- **Authors**: ASD; Australian Signals Directorate; ACSC (Australian Cyber Security Centre)
- **Publication Date**: 2024-12-01
- **Last Updated**: 2024-12-01
- **Document Status**: Published
- **Main Topic**: ASD ISM December 2024 cryptography guidelines update. Mandates transition to NIST-standardized PQC algorithms for Australian government systems. Establishes mandatory migration timelines, algorithm selection guidance, and compliance requirements for protecting government data and critical infrastructure.
- **PQC Algorithms Covered**: ML-KEM (CRYSTALS-Kyber); ML-DSA (CRYSTALS-Dilithium); SLH-DSA (SPHINCS+); FIPS 203/204/205 certified algorithms; hybrid PQC-classical approaches
- **Quantum Threats Addressed**: Quantum computing threat to RSA, ECDH, ECDSA; harvest now, decrypt later attacks; long-term confidentiality and integrity threats to classified data; government security compromise
- **Migration Timeline Info**: 2025-2027: Assessment and inventory phase; 2027-2031: Active migration implementation; 2031-2035: Full quantum-safe transition for Australian government; Critical systems priority: 2025-2028; Deadline-sensitive systems: by 2031
- **Applicable Regions / Bodies**: Regions: Australia; Bodies: ASD (Australian Signals Directorate); ACSC (Australian Cyber Security Centre); Australian government; state/territory governments; critical infrastructure operators
- **Leaders Contributions Mentioned**: ASD/ACSC leadership; Australian government cybersecurity authorities; Department of Defence; Department of Home Affairs
- **PQC Products Mentioned**: FIPS 203/204/205 certified cryptographic modules; commercial and government-approved PQC implementations; TLS libraries with PQC support
- **Protocols Covered**: TLS 1.3 with PQC; X.509 PKI certificates; SSH protocols; VPN protocols; email signing and encryption; key establishment protocols; government secure communications protocols
- **Infrastructure Layers**: Government IT systems; defence networks; classified information systems; national security infrastructure; critical national infrastructure; telecommunications; energy; finance; healthcare; transport; water systems
- **Standardization Bodies**: NIST (FIPS 203/204/205); ISO/IEC; Australian Standards; ASD ISM framework
- **Compliance Frameworks Referenced**: ASD Information Security Manual (ISM); Australian Signals Directorate guidelines; critical infrastructure protection legislation; government security classifications; ACSC mandatory compliance requirements

---

## US-QCCPA-2022

- **Reference ID**: US-QCCPA-2022
- **Title**: Quantum Computing Cybersecurity Preparedness Act (Public Law 117-260)
- **Authors**: US Congress; Office of Management and Budget
- **Publication Date**: 2022-12-21
- **Last Updated**: 2022-12-21
- **Document Status**: Enacted
- **Main Topic**: Federal legislation requiring US government agencies to inventory cryptographic systems vulnerable to quantum computing and migrate to post-quantum cryptography standards. Establishes mandatory timelines for federal IT modernization and establishes NIST as the authority for PQC standards development and guidance.
- **PQC Algorithms Covered**: NIST post-quantum cryptography standards (ML-KEM, ML-DSA, SLH-DSA referenced implicitly through standardization process)
- **Quantum Threats Addressed**: Cryptographically Relevant Quantum Computer (CRQC), Harvest-Now-Decrypt-Later (HNDL) threat, Shor's algorithm, integer factorization vulnerabilities
- **Migration Timeline Info**: 180 days for OMB guidance issuance; 1 year for agency inventory and migration plan; 5 years post-NIST standardization for full compliance reporting
- **Applicable Regions / Bodies**: Regions: United States; Bodies: US Congress, OMB, NIST, CISA, NSC
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Information technology systems, cryptographic protocols, encryption systems (general)
- **Infrastructure Layers**: Federal government IT systems, critical infrastructure, national security systems
- **Standardization Bodies**: NIST, OMB, CISA, National Cyber Director
- **Compliance Frameworks Referenced**: Federal IT modernization requirements, Executive branch standards

---

## GSMA-PQC-Country-Survey-2025

- **Reference ID**: GSMA-PQC-Country-Survey-2025
- **Title**: Post Quantum Government Initiatives by Country and Region (GSMA PQ.03 v1.1)
- **Authors**: GSMA
- **Publication Date**: 2025-03-02
- **Last Updated**: 2025-03-02
- **Document Status**: Published
- **Main Topic**: Comprehensive survey of PQC government initiatives across 30+ countries and regions as of March 2025. Provides high-level summary of each country's PQC algorithms under consideration, published guidance documents, and migration timelines. Tracks global standardization efforts and regulatory actions for quantum-safe cryptography deployment.
- **PQC Algorithms Covered**: NIST algorithms (ML-KEM, ML-DSA, SLH-DSA), China-specific algorithms, KPQC signatures (AIMe, HAETAE), FrodoKEM, Classic McEliece
- **Quantum Threats Addressed**: Cryptographically Relevant Quantum Computer (CRQC), quantum computing threats to encryption and digital signatures
- **Migration Timeline Info**: Australia 2030 full transition; Czech Republic 2027 key establishment migration; EU 2026 coordinated roadmap; US 2023-2033 implementation window; various country-specific deadlines documented
- **Applicable Regions / Bodies**: Regions: Australia, Canada, China, Czech Republic, France, Germany, Israel, Italy, Japan, Netherlands, New Zealand, Singapore, South Korea, Spain, UK, US; Bodies: NIST, ANSSI, BSI, NUKIB, NCSC, CSEC, CISA
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, transport layer encryption, cryptographic standards
- **Infrastructure Layers**: National cybersecurity infrastructure, telecommunications, financial systems, government IT
- **Standardization Bodies**: NIST, ETSI, ISO/IEC, BSI, ANSSI, national cybersecurity agencies
- **Compliance Frameworks Referenced**: NIST standards, national cryptographic recommendations, FIPS certifications

---

## UK-CMORG-PQC-Guidance-2025

- **Reference ID**: UK-CMORG-PQC-Guidance-2025
- **Title**: Guidance for Post-Quantum Cryptography (UK Financial Sector) - CMORG Cyber Coordination Group
- **Authors**: CMORG; Bank of England; UK Financial Authorities
- **Publication Date**: 2025-04-01
- **Last Updated**: 2025-04-01
- **Document Status**: Published
- **Main Topic**: CMORG guidance for UK financial sector institutions on PQC migration strategy covering threat landscape assessment, algorithm selection, vendor readiness evaluation, and structured migration planning. Emphasizes cryptographic inventory, risk assessment, prioritization, remediation phases, and vendor engagement for quantum-safe transition. Non-binding industry guidance aligned with NCSC recommendations.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA (NIST standards), hybrid quantum-resistant cryptography options
- **Quantum Threats Addressed**: CRQC threat, Grover's algorithm vulnerability, long-lived sensitive data compromise through store-now-decrypt-later attacks
- **Migration Timeline Info**: Immediate action advised; no specific hard deadline stated; emphasis on proactive migration before quantum capability emergence
- **Applicable Regions / Bodies**: Regions: United Kingdom; Bodies: CMORG, NCSC, Bank of England, FCA, World Economic Forum
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: Technology vendor PQC solutions (general category, not specific products)
- **Protocols Covered**: TLS 1.3, X.509, PKI, digital signatures, encryption protocols
- **Infrastructure Layers**: Financial services sector, cloud services, SaaS providers, hardware manufacturers, critical national infrastructure
- **Standardization Bodies**: NIST, NCSC, BSI, ANSSI, ETSI, ISO/IEC
- **Compliance Frameworks Referenced**: NIST post-quantum standards, NCSC guidance, international standards alignment

---

## CZ-NUKIB-Crypto-Requirements-2023

- **Reference ID**: CZ-NUKIB-Crypto-Requirements-2023
- **Title**: NUKIB Minimum Requirements for Cryptographic Algorithms (Cryptographic Security Recommendations)
- **Authors**: NUKIB; Czech National Cyber and Information Security Agency
- **Publication Date**: 2023-06-01
- **Last Updated**: 2025-02-01
- **Document Status**: Published
- **Main Topic**: Czech NUKIB minimum cryptographic algorithm requirements for national cybersecurity establishing approved algorithms across symmetric, asymmetric, and hash function categories. Explicitly addresses quantum vulnerability of classical algorithms and mandates PQC readiness. Sets 2027 deadline for key establishment migration and provides hybrid PQC recommendations for firmware/software signing and general digital signatures.
- **PQC Algorithms Covered**: ML-KEM-1024, ML-KEM-768, FrodoKEM, Classic McEliece variants, ML-DSA-87, ML-DSA-65, SLH-DSA, LMS, XMSS, Falcon
- **Quantum Threats Addressed**: Quantum-vulnerable cryptography, CRQC, future quantum computing capability, harvest-now-decrypt-later attacks on long-lived sensitive data
- **Migration Timeline Info**: 2027 deadline for key establishment migration (encryption); immediate migration for firmware and software signing; hybrid approach recommended during transition
- **Applicable Regions / Bodies**: Regions: Czech Republic; Bodies: NUKIB, Czech government entities
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: PKI, digital signatures, firmware integrity, software code signing, encryption protocols
- **Infrastructure Layers**: Government information systems, critical infrastructure, national cybersecurity, communications systems
- **Standardization Bodies**: NIST (FIPS 203, 204, 205), ISO/IEC
- **Compliance Frameworks Referenced**: Czech Cyber Security Decree 82/2018, FIPS 203/204/205, NIST standards, hybrid PQC recommendations

---

## EU-BSI-PQC-Joint-Statement-2024

- **Reference ID**: EU-BSI-PQC-Joint-Statement-2024
- **Title**: Joint Statement on PQC Migration by 21 EU Member State Cybersecurity Agencies
- **Authors**: BSI; ANSSI; NCSC Netherlands; 21 EU cybersecurity agencies
- **Publication Date**: 2024-11-01
- **Last Updated**: 2024-11-01
- **Document Status**: Published
- **Main Topic**: Joint statement by 21 European nation cybersecurity agencies coordinating EU-wide PQC migration strategy. Endorses NIST-standardized post-quantum algorithms and calls for coordinated EU implementation roadmap by 2026. Addresses standardization alignment, algorithm selection, and member state readiness for quantum-resistant cryptography deployment across critical infrastructure and government systems.
- **PQC Algorithms Covered**: NIST post-quantum standards (ML-KEM, ML-DSA, SLH-DSA)
- **Quantum Threats Addressed**: Cryptographically Relevant Quantum Computer (CRQC), harvest-now-decrypt-later threats
- **Migration Timeline Info**: Coordinated EU PQC roadmap to be defined by 2026 for member state implementation
- **Applicable Regions / Bodies**: Regions: European Union (21 member states); Bodies: BSI (Germany), ANSSI (France), NCSC (Netherlands), national cybersecurity agencies of 18 additional EU member states
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Cryptographic standards, key establishment, digital signatures
- **Infrastructure Layers**: Government systems, critical infrastructure, national security systems, EU-wide cybersecurity coordination
- **Standardization Bodies**: NIST, ETSI, ISO/IEC, national standardization bodies
- **Compliance Frameworks Referenced**: NIST standards, EU coordinated implementation framework, national cybersecurity strategies

---

## BSI-ANSSI-QKD-Position-2024

- **Reference ID**: BSI-ANSSI-QKD-Position-2024
- **Title**: Position Paper on Quantum Key Distribution
- **Authors**: French Cybersecurity Agency (ANSSI); Federal Office for Information Security (BSI); Netherlands National Communications Security Agency (NLNCSA); Swedish National Communications Security Authority (SNCSA); Swedish Armed Forces
- **Publication Date**: 2024-04-01
- **Last Updated**: 2024-04-01
- **Document Status**: Published
- **Main Topic**: Joint position paper from four European cybersecurity agencies concluding that QKD alone is insufficient for quantum-safe cryptography. Recommends post-quantum cryptography as the primary approach with QKD as a complementary technology for niche use cases only.
- **PQC Algorithms Covered**: None explicitly detailed (focus on QKD limitations, not PQC algorithms)
- **Quantum Threats Addressed**: Store-now-decrypt-later scenario; quantum computers breaking public-key cryptography; Shor's algorithm threat
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: France, Germany, Netherlands, Sweden; Bodies: ANSSI, BSI, NLNCSA, SNCSA, EuroQCI project, NIST, ISO, IETF
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: QKD protocols (BB84-style); public-key cryptography; symmetric keying; post-quantum cryptography standards (NIST standardization mentioned)
- **Infrastructure Layers**: Quantum communication networks; fibre-optic cables; satellite-based systems
- **Standardization Bodies**: NIST, ISO/IEC, IETF, BSI, ETSI
- **Compliance Frameworks Referenced**: None detected

---

## US-CISA-ACDI-Strategy-2024

- **Reference ID**: US-CISA-ACDI-Strategy-2024
- **Title**: Strategy for Migrating to Automated Post-Quantum Cryptography Discovery and Inventory Tools
- **Authors**: Cybersecurity and Infrastructure Security Agency (CISA); U.S. federal agencies; NIST; National Cybersecurity Center of Excellence (NCCoE)
- **Publication Date**: 2024-08-15
- **Last Updated**: 2024-08-15
- **Document Status**: Published
- **Main Topic**: CISA strategy for Federal civilian agencies to adopt automated cryptography discovery and inventory (ACDI) tools to assess PQC migration progress. Addresses OMB Memorandum 23-02 requirements for cryptographic system inventory and CRQC-vulnerable system identification.
- **PQC Algorithms Covered**: RSA, ECC, AES (classical); PQC-hybrid modes mentioned; specific NIST standardized algorithms referenced
- **Quantum Threats Addressed**: Cryptanalytically-relevant quantum computer (CRQC) threat; harvest-now-decrypt-later scenario; store-now-decrypt-later; compromise of public-key cryptography
- **Migration Timeline Info**: 2035 horizon for mission-critical data; PQC standards finalization expected; vendor adoption roadmaps needed by agencies
- **Applicable Regions / Bodies**: Regions: United States; Bodies: CISA, NIST, OMB, FCEB (Federal Civilian Executive Branch), ONCD, NSS agencies, Federal Information Security Modernization Act (FISMA)
- **Leaders Contributions Mentioned**: OMB (Office of Management and Budget); NIST NCCoE collaboration with 28+ industry partners
- **PQC Products Mentioned**: None explicitly named (focus on discovery tools and inventory)
- **Protocols Covered**: ACDI (Automated Cryptography Discovery and Inventory); CDM (Continuous Diagnostics and Mitigation); CyberScope reporting; encryption key management; digital signatures; TLS
- **Infrastructure Layers**: Cloud-based and on-premises systems; federal civilian agencies (FCEB scope); high-impact information systems; PKI
- **Standardization Bodies**: NIST, OMB, FISMA, ISO/IEC
- **Compliance Frameworks Referenced**: FISMA metrics; M-23-02 memorandum; NIST Cybersecurity Framework; NIST SP 1800-38 (Migration to Post-Quantum Cryptography)

---

## BIS-OTHP107

- **Reference ID**: BIS-OTHP107
- **Title**: Project Leap Phase 2 — Quantum-proofing payment systems
- **Authors**: BIS Innovation Hub; Bank of Italy (Banca d'Italia); Bank of France (Banque de France); Deutsche Bundesbank; Nexi-Colt; Swift; Eurosystem; central banks; private partners
- **Publication Date**: 2025-12-01
- **Last Updated**: 2025-12-01
- **Document Status**: Published
- **Main Topic**: BIS Innovation Hub Project Leap Phase 2 successfully tested CRYSTALS-Dilithium (ML-DSA) in Eurosystem T2 payment system's Target2-Securities platform. Demonstrates feasibility of quantum-safe payment system migration with performance benchmarking and hybrid implementation testing.
- **PQC Algorithms Covered**: CRYSTALS-Dilithium (ML-DSA, NIST standardized); traditional RSA and ECC
- **Quantum Threats Addressed**: Harvest-now-decrypt-later risk in financial systems; quantum computing threat to digital signatures and authentication; long-term data confidentiality exposure
- **Migration Timeline Info**: Phase 1 (2023) baseline testing; Phase 2 (2025) operational deployment testing; ongoing need for further testing before full adoption
- **Applicable Regions / Bodies**: Regions: Eurozone (Italy, France, Germany, multiple EU nations); Bodies: BIS Innovation Hub Eurosystem Centre, Bank of Italy, Bank of France, Deutsche Bundesbank, ECB, Swift, Nexi-Colt, European central banks
- **Leaders Contributions Mentioned**: Project Leap Phase 1 (BISIH et al. 2023); central banks and private partners (Swift, Nexi-Colt)
- **PQC Products Mentioned**: CRYSTALS-Dilithium; NIST-standardized PQC algorithm implementations
- **Protocols Covered**: Digital signatures (ML-DSA); T2-Securities liquidity transfer protocol; hybrid encryption schemes (classical + quantum-safe); Eurosystem settlement systems (TIPS, T2, ECMS); RTGS (real-time gross settlement)
- **Infrastructure Layers**: Payment systems (EURO1, STEP2, RTI); Eurosystem single market infrastructure gateway (ESMIGIG); real-time gross settlement; financial market infrastructures (FMIs); central bank networks
- **Standardization Bodies**: NIST (PQC algorithm standardization); ISO; IETF
- **Compliance Frameworks Referenced**: None explicitly mentioned (focus on technical feasibility and performance)

---

## India-TEC-910018-2025

- **Reference ID**: India-TEC-910018-2025
- **Title**: India TEC Technical Report TEC 910018:2025 — Migration to Post-Quantum Cryptography
- **Authors**: TEC India (Telecommunication Engineering Centre); Department of Telecommunications (DoT); Ministry of Communications; Government of India
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-03-26
- **Document Status**: Published (Release 1.0, January 2025)
- **Main Topic**: Comprehensive technical report on migrating Indian telecom infrastructure to PQC. Covers quantum threat assessment, migration planning, algorithm selection, hybrid cryptography, protocol transitions, risk assessment, vendor alignment, and implementation roadmap for Indian telecom operators and critical sectors.
- **PQC Algorithms Covered**: ML-KEM (CRYSTALS-Kyber, key encapsulation); ML-DSA (CRYSTALS-Dilithium, digital signatures); NIST standardized PQC algorithms; traditional RSA, ECC, AES
- **Quantum Threats Addressed**: Quantum computer threat to RSA/ECC; Man-in-the-middle attacks; individual attacks; threat to digital signatures; harvest-now-decrypt-later scenario; Shor's algorithm; Grover's algorithm for symmetric crypto
- **Migration Timeline Info**: Immediate action needed; phased migration approach; 2035+ horizon for full migration; crypto-agility emphasis; hybrid solution adoption timeframes
- **Applicable Regions / Bodies**: Regions: India; Bodies: TEC, DoT, Ministry of Communications, Government of India, Indian telecom operators, critical sectors (defence, finance, healthcare, telecommunications), NIST, ETSI, ISO
- **Leaders Contributions Mentioned**: Academia, Industry experts, Start-ups; National and international standardization bodies
- **PQC Products Mentioned**: NIST-standardized algorithms (ML-KEM, ML-DSA); proprietary implementations for Indian telecom
- **Protocols Covered**: TLS/SSL migration; PKI infrastructure; digital signatures; encryption protocols; key agreement protocols; hybrid cryptography approaches; quantum-safe protocols; telecom standards (3GPP, ITU)
- **Infrastructure Layers**: Telecom networks; data centers; PKI; HSM (hardware security modules); network service providers (NSPs); payment systems; critical infrastructure (defence, finance, healthcare); 5G networks
- **Standardization Bodies**: NIST, ETSI, ISO/IEC, IETF, 3GPP, ITU, Indian Standards (BIS)
- **Compliance Frameworks Referenced**: FIPS certification; Indian government security requirements; telecom operator standards; critical sector guidelines; crypto-agility best practices; governance frameworks

---

## CA-CFDIR-Quantum-Readiness-2023

- **Reference ID**: CA-CFDIR-Quantum-Readiness-2023
- **Title**: Canadian National Quantum-Readiness Best Practices and Guidelines
- **Authors**: Quantum-Readiness Working Group (QRWG); Canadian Forum for Digital Infrastructure Resilience (CFDIR)
- **Publication Date**: 2023-06-12
- **Last Updated**: 2023-06-12
- **Document Status**: Published
- **Main Topic**: Provides comprehensive best practices for organizations to assess and prepare for quantum-safe cryptography migration. Covers five phases from preparation through implementation, with guidance on hybrid cryptography, vendor assessment, and organizational readiness frameworks for Canada's financial sector and critical infrastructure.
- **PQC Algorithms Covered**: Hybrid cryptography approaches; quantum-safe algorithms (general reference)
- **Quantum Threats Addressed**: Quantum computing threat to current cryptographic standards; harvest now, decrypt later attacks; threat to encryption, digital signatures, and key establishment protocols
- **Migration Timeline Info**: Phased approach over multiple years; no specific Q-day prediction; emphasis on starting preparation immediately
- **Applicable Regions / Bodies**: Regions: Canada; Bodies: CFDIR, Bank of Canada, CIRA, Cisco Systems, Google, IBM, ISCC, Microsoft, AWS, BlackBerry, Thales Canada, Financial Services Regulatory Authority of Ontario, Payments Canada
- **Leaders Contributions Mentioned**: Hisham El-Bihbety (CISO – Bank of Canada); various financial sector experts and academic institutions (University of Waterloo Open Quantum Safe project)
- **PQC Products Mentioned**: Quantum-Safe Canada; Cryptosense; Entrust; evolutionQ; InfoSec Global; ISARA
- **Protocols Covered**: Kerberos; PKI/CAs; sFTP; TLS; SSH; IPSEC; HTTPS; key establishment protocols; digital signatures
- **Infrastructure Layers**: Financial services sector systems; banking infrastructure; utility grids; government systems; data encryption and storage; communication channels
- **Standardization Bodies**: NIST; CSE; various international standards bodies referenced in annexes
- **Compliance Frameworks Referenced**: FIPS standards; quantum-safe policies and regulations; government procurement requirements; financial industry compliance standards

---

## SG-Quantum-Safe-Handbook-2025

- **Reference ID**: SG-Quantum-Safe-Handbook-2025
- **Title**: Singapore Quantum-Safe Handbook (Draft for Public Consultation)
- **Authors**: CSA Singapore; GovTech Singapore; IMDA Singapore
- **Publication Date**: 2025-10-23
- **Last Updated**: 2025-10-23
- **Document Status**: Draft/Consultation
- **Main Topic**: A practical migration handbook for organizations in Singapore and critical information infrastructure operators. Provides guidance on quantum threat understanding, risk assessment, governance, technology selection, training capabilities, and external engagements needed for transition to quantum-safe cryptography.
- **PQC Algorithms Covered**: ML-KEM; ML-DSA; SLH-DSA; Shor's algorithm target algorithms (RSA, ECDSA, ECDH, DSA, DH); Grover's algorithm applications; symmetric cipher and hash function considerations
- **Quantum Threats Addressed**: Shor's algorithm threat to integer factoring and discrete logarithm cryptography; Grover's algorithm threat to symmetric ciphers and hash functions; cryptanalytically relevant quantum computers (CRQC); Q-day uncertainty; confidentiality, integrity, and availability compromises
- **Migration Timeline Info**: 5-10 year horizon for Q-day (could occur earlier); immediate preparation needed; phased migration approach recommended
- **Applicable Regions / Bodies**: Regions: Singapore; Bodies: CSA, GovTech, IMDA, Accenture, AWS, Deloitte, IBM, PQStation, AiSP
- **Leaders Contributions Mentioned**: None explicitly named; contributions from industry partners and government agencies
- **PQC Products Mentioned**: PQStation; various commercial solutions referenced generically
- **Protocols Covered**: TLS; SSH; IPSEC; key encapsulation; digital signatures; public key cryptography; symmetric encryption; hash functions
- **Infrastructure Layers**: Critical information infrastructure (CII); government systems; cloud platforms; communication networks; IT/OT systems
- **Standardization Bodies**: NIST; CSA; ISO standards referenced
- **Compliance Frameworks Referenced**: Singapore cybersecurity governance frameworks; CII protection requirements; voluntary and prescriptive measures for organizations

---

## US-CISA-PQC-OT-2024

- **Reference ID**: US-CISA-PQC-OT-2024
- **Title**: CISA Post-Quantum Considerations for Operational Technology
- **Authors**: CISA; Cybersecurity and Infrastructure Security Agency (Department of Homeland Security)
- **Publication Date**: 2024-10-01
- **Last Updated**: 2024-10-01
- **Document Status**: Published
- **Main Topic**: Addresses quantum computing risks specific to operational technology (OT) systems in U.S. critical infrastructure. Focuses on OT-specific cryptography use cases, network segmentation, multi-factor authentication, crypto-agility, and migration planning for industrial control systems with long operational lifespans and unique constraints.
- **PQC Algorithms Covered**: NIST finalized post-quantum cryptographic standards (FIPS for KEM and digital signatures); ML-KEM; ML-DSA; RSA; ECDSA; ECDH; DSA; DH; AES; SHA-1, SHA-2, SHA-3
- **Quantum Threats Addressed**: Cryptanalytically relevant quantum computer (CRQC) threat to OT public-key cryptography; harvest now, decrypt later; unauthorized remote access; message manipulation; malware persistence; sensitive information decryption; supply chain compromise
- **Migration Timeline Info**: NIST released first 3 finalized standards August 13, 2024; many planning steps should begin immediately; multi-year transition expected; legacy system constraints create extended timelines
- **Applicable Regions / Bodies**: Regions: United States; Bodies: CISA, Department of Homeland Security, NIST, critical infrastructure sectors (water, energy, transportation, manufacturing)
- **Leaders Contributions Mentioned**: Secretary of Homeland Security Alejandro N. Mayorkas; referenced DHS policy guidance and CISA initiatives
- **PQC Products Mentioned**: None explicitly mentioned; generic vendor and manufacturer references
- **Protocols Covered**: OPC UA; Modbus Transmission Control Protocol (TCP); SSL/TLS; public key encryption and decryption; digital signatures; certificate-based encryption; secure boot protocols
- **Infrastructure Layers**: Industrial control systems (ICS); operational technology networks; critical infrastructure (water, power, transportation); supervisory control and data acquisition (SCADA); network perimeter devices; remote access systems; firmware and software update mechanisms
- **Standardization Bodies**: NIST; DHS; industry-specific standards bodies
- **Compliance Frameworks Referenced**: NIST post-quantum cryptography standards; DHS post-quantum cryptography roadmap and policy guidance; Secure by Design and Secure by Default principles; NCF guidance

---

## IN-CERTIN-QBOM-Guidelines-2025

- **Reference ID**: IN-CERTIN-QBOM-Guidelines-2025
- **Title**: India CERT-In Technical Guidelines on SBOM, QBOM, CBOM, AIBOM, and HBOM v2.0
- **Authors**: CERT-In; Indian Computer Emergency Response Team; Ministry of Electronics and Information Technology; Government of India
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-07-09
- **Document Status**: Published
- **Main Topic**: Provides technical framework for software and hardware bill of materials (BOMs) including quantum (QBOM), cryptographic (CBOM), AI (AIBOM), and hardware (HBOM) components. Mandates SBOM adoption for government, public sector, essential services, and software export organizations in India to enhance supply chain security and vulnerability management.
- **PQC Algorithms Covered**: Quantum-safe algorithms; QBOM minimum elements for quantum-resistant cryptography; cryptographic primitives for quantum readiness
- **Quantum Threats Addressed**: Quantum computing threat to cryptographic components; need for quantum readiness assessment in software supply chains; harvest now, decrypt later risk
- **Migration Timeline Info**: Immediate adoption recommended for government and essential services; phased implementation; quantum readiness migration strategy required
- **Applicable Regions / Bodies**: Regions: India; Bodies: CERT-In, Ministry of Electronics and IT, Department of Telecommunications, ISI Kolkata, Jalpalguri Government Engineering College, DRDO, IBM, Deloitte, NCIIPC, C-DoT, DIT & CS
- **Leaders Contributions Mentioned**: Dr. Neeraj Mittal (Secretary, Department of Telecommunications); Ms. Tripti Saxena (Sr DDG & Head, TEC); 14 contributing authors from government, academia, and industry
- **PQC Products Mentioned**: None explicitly mentioned; generic software and cryptographic solutions referenced
- **Protocols Covered**: Public key cryptography; digital signatures; encryption protocols; authentication mechanisms; SSL/TLS; code signing
- **Infrastructure Layers**: Software development lifecycle; supply chain; government IT systems; essential services; public sector organizations; critical infrastructure
- **Standardization Bodies**: NIST; ISO; Indian standards bodies; industry frameworks
- **Compliance Frameworks Referenced**: Software Bill of Materials (SBOM) standards; vulnerability tracking; supply chain security requirements; government procurement mandates; compliance with security regulations

---

## IN-TEC-PQC-Migration-Report-2025

- **Reference ID**: IN-TEC-PQC-Migration-Report-2025
- **Title**: India TEC Technical Report on Migration to Post-Quantum Cryptography
- **Authors**: TEC India; Telecommunications Engineering Centre; Department of Telecommunications; Ministry of Communications; Government of India
- **Publication Date**: 2025-03-28
- **Last Updated**: 2025-03-28
- **Document Status**: Published
- **Main Topic**: Comprehensive technical report for government organizations and enterprises on migration to post-quantum cryptography. Covers quantum threat assessment, migration planning, cryptographic primitives selection, hybrid solutions, trust management during migration, OEM/vendor alignment, risk assessment, and implementation roadmap for Indian telecom and IT infrastructure.
- **PQC Algorithms Covered**: ML-KEM; ML-DSA; FIPS-approved PQC algorithms; hybrid cryptography; SLH-DSA; Falcon; Classic McEliece; FrodoKEM; HQC; stateful and stateless digital signatures
- **Quantum Threats Addressed**: Cryptographically relevant quantum computer (CRQC) threat to RSA, ECDSA, ECDH; harvest now, decrypt later; man-in-middle attacks; threat to digital signatures; individual attacks; attacks on infrastructure and application cryptography
- **Migration Timeline Info**: Phased approach with immediate preparation; quantum readiness and migration strategy stages; risk-of-delay impact analysis; migration assessment framework
- **Applicable Regions / Bodies**: Regions: India; Bodies: TEC, Department of Telecommunications, Ministry of Communications, ISI Kolkata, Jalpalguri Government Engineering College, DRDO, IBM, Deloitte, NCIIPC, C-DoT, DIT & CS, various academia and industry contributors
- **Leaders Contributions Mentioned**: Dr. Neeraj Mittal (Secretary, Ministry of Communications); Ms. Tripti Saxena (Sr DDG & Head, TEC); 14 expert committee members from academia, industry, and government
- **PQC Products Mentioned**: None explicitly mentioned; generic vendor and OEM references
- **Protocols Covered**: TLS; SSH; IPSEC; HTTPS; key establishment; digital signatures; code signing; certificate-based protocols; OPC UA; Modbus TCP; VPN protocols
- **Infrastructure Layers**: Telecom networks; IT infrastructure; government systems; critical infrastructure; network protocols; application cryptography; firmware and software updates; PKI systems
- **Standardization Bodies**: NIST; ISO; IETF; Indian standards bodies; telecom standards
- **Compliance Frameworks Referenced**: FIPS standards; quantum-safe migration roadmap; government procurement requirements; telecom regulations; compliance with national cryptography policies

---

## GSMA-PQ03-v2-2024

- **Reference ID**: GSMA-PQ03-v2-2024
- **Title**: GSMA PQ.03 Post-Quantum Cryptography Guidelines for Telecom Use Cases v2.0
- **Authors**: GSMA (GSM Association)
- **Publication Date**: 2024-11-01
- **Last Updated**: 2024-11-01
- **Document Status**: Published
- **Main Topic**: Comprehensive guidelines for telecom industry on post-quantum cryptography implementation. Covers 16+ telecom-specific use cases including network protection, SIM provisioning, cloud infrastructure, virtualized functions, IoT services, and remote access. Addresses algorithm standardization, migration strategies, vendor roadmaps, technical challenges, and crypto-agility for telecom ecosystems.
- **PQC Algorithms Covered**: ML-KEM; ML-DSA; RSA; ECDSA; ECDH; DSA; DH; AES; SHA-1, SHA-2, SHA-3; Falcon; FrodoKEM; hybrid schemes; stateless and stateful digital signatures
- **Quantum Threats Addressed**: Shor's algorithm threat to RSA, ECDSA, ECDH, DSA, DH; Grover's algorithm threat to symmetric ciphers and hash functions; Q-day uncertainty; cryptanalytically relevant quantum computers; confidentiality, integrity, availability compromises in telecom systems
- **Migration Timeline Info**: 5-10 year horizon for Q-day; NIST FIPS released August 2024; phased migration approach; vendor migration strategies; operator migration timelines; legacy system constraints
- **Applicable Regions / Bodies**: Regions: Global telecom industry; Bodies: GSMA, NIST, IETF, national cybersecurity agencies, telecom operators and vendors worldwide
- **Leaders Contributions Mentioned**: None explicitly named; GSMA PQTN Task Force contributors; global telecom ecosystem experts
- **PQC Products Mentioned**: Vendor products referenced generically; no specific product names mentioned
- **Protocols Covered**: TLS; IKE; X.509 certificates; key encapsulation; digital signatures; symmetric cryptography; hash functions; IPSec; 4G/5G security protocols; MME-S-GW-P-GW authentication; SBA (Service-Based Architecture); VPN; SD-WAN; OPC UA; Modbus TCP; firmware update protocols; device management interfaces
- **Infrastructure Layers**: 4G/5G networks; network function virtualization; cloud infrastructure; base stations; security gateways; remote SIM provisioning; IoT platforms; virtual private networks; software-defined WANs; smart meters; automotive systems; enterprise data systems; network function authorization
- **Standardization Bodies**: NIST; IETF; 3GPP; GSMA; ISO; national standardization bodies
- **Compliance Frameworks Referenced**: NIST post-quantum standards; FIPS certifications; ACVP validation; telecom industry regulations; national PQC initiatives; government cybersecurity policies

---

## IL-INCD-Cybersecurity-Strategy-2025

- **Reference ID**: IL-INCD-Cybersecurity-Strategy-2025
- **Title**: Israel National Cybersecurity Strategy 2025-2028
- **Authors**: INCD; Israel National Cyber Directorate
- **Publication Date**: 2025-02-01
- **Last Updated**: 2025-02-01
- **Document Status**: Published
- **Main Topic**: Israel's updated national cyber security strategy developed following October 7 attacks and Iron Swords war. Addresses quantum computing threats alongside broader cybersecurity challenges. Focuses on protecting cyberspace, establishing secure digital identity, securing critical infrastructure, implementing national SOC, crisis management, and developing strategic partnerships for 2025-2028 period.
- **PQC Algorithms Covered**: Post-quantum cryptographic algorithms (general reference within national strategy context)
- **Quantum Threats Addressed**: Quantum computing threat to national digital infrastructure; cryptographic algorithm vulnerability; need for crypto-agility and quantum-resistant standards
- **Migration Timeline Info**: 2025-2028 strategic period; emphasis on immediate preparation; long-term quantum readiness planning; phased implementation approach
- **Applicable Regions / Bodies**: Regions: Israel; Bodies: INCD (Israel National Cyber Directorate), Israeli government ministries, security agencies, private sector, academia, technology companies, regional and international partners
- **Leaders Contributions Mentioned**: Gabi Portnoy (Head of National Cyber Directorate)
- **PQC Products Mentioned**: None explicitly mentioned; generic technology and vendor references
- **Protocols Covered**: Digital signatures; encryption standards; key establishment; authentication protocols; secure communication channels; identity management protocols
- **Infrastructure Layers**: Critical national infrastructure; government digital systems; essential services; financial systems; communications networks; power grid; water treatment; healthcare systems; transportation; public digital services; cognitive space; supply chain networks
- **Standardization Bodies**: NIST; international cryptography standards bodies; Israeli standards; national and international cybersecurity frameworks
- **Compliance Frameworks Referenced**: National security requirements; government procurement standards; international cyber treaties; Cyber Dome concept; Secure by Design and Default principles; AI safety guidelines; international cybersecurity norms
