---
generated: 2026-03-31
collection: library
documents_processed: 71
enrichment_method: ollama-qwen3.5:27b
---

## CRYSTALS-Kyber-Spec-v302

- **Reference ID**: CRYSTALS-Kyber-Spec-v302
- **Title**: CRYSTALS-Kyber Algorithm Specifications v3.02
- **Authors**: KU Leuven COSIC; Ruhr University Bochum; CWI Amsterdam
- **Publication Date**: 2021-08-04
- **Last Updated**: 2021-08-04
- **Document Status**: Final
- **Main Topic**: Official algorithm specification for CRYSTALS-Kyber (standardized as ML-KEM) detailing its IND-CCA2-secure KEM construction, parameter sets, and security analysis.
- **PQC Algorithms Covered**: CRYSTALS-Kyber; Kyber.CPAPKE; Kyber.CCAKEM; ML-KEM
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Roberto Avanzi; Joppe Bos; Léo Ducas; Eike Kiltz; Tancrède Lepoint; Vadim Lyubashevsky; John M. Schanck; Peter Schwabe; Gregor Seiler; Damien Stehlé
- **PQC Products Mentioned**: pqm4
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS 203
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Kyber512 noise parameter increased to improve Core-SVP hardness while relying on rounding noise; Ciphertext size for Kyber512 increased from 736 bytes to 768 bytes to reduce decryption error probability; Uniform sampling of public matrix A optimized using rejection sampling on 12-bit integers; Security analysis updated to include detailed discussion of attacks beyond core-SVP hardness and decryption failure exploits.
- **Security Levels & Parameters**: Kyber512; 112 bits Core-SVP hardness; 118 bits Core-SVP hardness with weak LWR assumption; n=256; q=3329; 32-byte message length
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Kyber512 ciphertext size 768 bytes; previous Kyber512 ciphertext size 736 bytes; decryption error probability 2^-139; rejection rate per coefficient approx 20%
- **Target Audience**: Researcher; Developer; Security Architect
- **Implementation Prerequisites**: ARM Cortex-M4 software included in submission package; Intel Haswell CPU performance data available
- **Relevant PQC Today Features**: Algorithms; pqc-101; code-signing; iot-ot-pqc; entropy-randomness
- **Source Document**: CRYSTALS-Kyber-Spec-v302.pdf (855,898 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T14:35:01

---

## CRYSTALS-Dilithium-Spec-v31

- **Reference ID**: CRYSTALS-Dilithium-Spec-v31
- **Title**: CRYSTALS-Dilithium Algorithm Specifications v3.1
- **Authors**: KU Leuven COSIC; Ruhr University Bochum; INRIA France; ETH Zurich
- **Publication Date**: 2021-02-08
- **Last Updated**: 2021-02-08
- **Document Status**: Final
- **Main Topic**: Official algorithm specification for CRYSTALS-Dilithium covering lattice-based digital signature schemes with EUF-CMA security and parameter sets Dilithium2/3/5.
- **PQC Algorithms Covered**: CRYSTALS-Dilithium, ML-DSA
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Shi Bai; Léo Ducas; Eike Kiltz; Tancrède Lepoint; Vadim Lyubashevsky; Peter Schwabe; Gregor Seiler; Damien Stehlé
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS 204
- **Classical Algorithms Referenced**: AES; SHAKE; SHAKE-128; SHAKE-256
- **Key Takeaways**: Dilithium uses uniform sampling instead of discrete Gaussian to avoid side-channel vulnerabilities; The scheme offers both randomized and deterministic signing options with deterministic as the default; Public key compression is achieved by omitting low-order bits of t and including hints in the signature; Security levels are varied by adjusting operations over a fixed ring rather than changing the ring parameters; Implementation efficiency relies on Number Theoretic Transform (NTT) for polynomial multiplication.
- **Security Levels & Parameters**: NIST level 2; NIST level 3; NIST level 5; Dilithium2; Dilithium3; Dilithium5; q = 2^23 - 2^13 + 1; n = 256; 4x4 public key matrix for level 2; 192 bits entropy for level 2; 225 bits entropy for level 3
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Signature size reduced by 8 bytes via two-stage challenge sampling; Public key size slightly increased by decreasing dropped bits from 14 to 13; Expected signing loop repetitions around 4; Public key compression shrinks bit-representation of t by factor slightly larger than two at expense of increasing signature by less than 100 bytes
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: AVX2 optimized implementation support; Hardware support for SHAKE or AES; Constant time implementation for polynomial multiplication and rounding
- **Relevant PQC Today Features**: Algorithms; entropy-randomness; code-signing; digital-id; pqc-101
- **Source Document**: CRYSTALS-Dilithium-Spec-v31.pdf (1,203,112 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T14:38:40

---

## Falcon-Spec-v12

- **Reference ID**: Falcon-Spec-v12
- **Title**: Falcon: Fast-Fourier Lattice-based Compact Signatures over NTRU v1.2
- **Authors**: INRIA France; MIT CSAIL; NTT Research
- **Publication Date**: 2020-10-06
- **Last Updated**: 2020-10-06
- **Document Status**: Final
- **Main Topic**: Official specification v1.2 for Falcon, a lattice-based signature scheme using NTRU lattices and fast Fourier sampling to achieve compact signatures.
- **PQC Algorithms Covered**: Falcon; FN-DSA
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Pierre-Alain Fouque; Jeffrey Hoffstein; Paul Kirchner; Vadim Lyubashevsky; Thomas Pornin; Thomas Prest; Thomas Ricosset; Gregor Seiler; William Whyte; Zhenfei Zhang; Gentry; Peikert; Vaikuntanathan; Stehlé; Steinfeld; Ducas; Zhao; Karmakar; Howe; Lu; Au; Oder; Sikeridis
- **PQC Products Mentioned**: pqm4
- **Protocols Covered**: TLS 1.3
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS 206
- **Classical Algorithms Referenced**: RSA; GGH; NTRUSign
- **Key Takeaways**: Falcon provides the smallest signatures among NIST PQC signature finalists by combining GPV framework with NTRU lattices; Fast Fourier sampling enables signing time in O(n log n) compared to O(n^2); The specification includes a key-recovery mode to further reduce size; Isochronous Gaussian sampling is critical for embedded security against side-channel attacks; Falcon and Dilithium were rated most favorably for deployment in TLS 1.3
- **Security Levels & Parameters**: Falcon-512; Falcon-1024; n = 768 (removed); phi = xn - xn/2 + 1 (removed)
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Signing time O(n log n); Compact signatures; Public key and signature bitsize minimization
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: ARM Cortex-M microprocessors; Floating-point arithmetic precision requirements; Gaussian sampling over integers
- **Relevant PQC Today Features**: Algorithms; tls-basics; stateful-signatures; entropy-randomness; pqc-101
- **Source Document**: Falcon-Spec-v12.pdf (382,156 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T14:42:54

---

## IACR-2022-1031

- **Reference ID**: IACR-2022-1031
- **Title**: CRYSTALS-Kyber: A CCA-Secure Module-Lattice-Based KEM
- **Authors**: KU Leuven COSIC; Ruhr University Bochum
- **Publication Date**: 2017-07-05
- **Last Updated**: 2022-01-01
- **Document Status**: Published
- **Main Topic**: Introduction and security analysis of CRYSTALS-Kyber, a CCA-secure module-lattice-based key-encapsulation mechanism targeting post-quantum security.
- **PQC Algorithms Covered**: CRYSTALS-Kyber, Kyber.CPA, Kyber, Kyber.Hybrid, Kyber.KE, Kyber.AKE, Module-LWE, Ring-LWE, LWE, NTRU, NEW HOPE
- **Quantum Threats Addressed**: Quantum computing advances; attacks exploiting algebraic structure of cyclotomic ideal lattices; quantum attacks on finding short vectors in ideals
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; Belgium; The Netherlands; Germany; Switzerland; Canada; France
- **Leaders Contributions Mentioned**: Joppe Bos, Léo Ducas, Eike Kiltz, Tancrède Lepoint, Vadim Lyubashevsky, John M. Schanck, Peter Schwabe, Gregor Seiler, Damien Stehlé
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Key exchange; authenticated-key-exchange; key-establishment protocols
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Kyber offers CCA security based on Module-LWE with key and ciphertext sizes about half the size of NEW HOPE; Increasing module dimension k provides flexibility to adjust security without changing ring operations; Conservative parameters target more than 128 bits of post-quantum security using k=3, while k=2 offers estimated 102-bit security with reduced communication size; Module-LWE is considered less susceptible to attacks exploiting algebraic structure compared to Ring-LWE or NTRU
- **Security Levels & Parameters**: 128 bits of post-quantum security; 102-bit post quantum security; k=3; k=2; ring Rq = Z7681 [X]/(X 256 + 1)
- **Hybrid & Transition Approaches**: Kyber.Hybrid (CCA-secure encryption); black-box construction of CCA-secure encryption, key exchange, and authenticated-key-exchange schemes from a CCA-secure KEM
- **Performance & Size Considerations**: Key and ciphertext sizes about half the size of NEW HOPE; 33% reduction in communication size for k=2 parameter set; essentially same running time as NEW HOPE; 256 bits of information transmitted per protocol execution
- **Target Audience**: Researcher, Developer, Security Architect
- **Implementation Prerequisites**: Software available on GitHub at https://github.com/pq-crystals/kyber; optimized software or hardware for efficient multiplication in Rq = Z7681 [X]/(X 256 + 1); extendable output function (XOF) for matrix expansion
- **Relevant PQC Today Features**: Algorithms, Leaders, hybrid-crypto, pqc-101, quantum-threats
- **Source Document**: IACR-2022-1031.pdf (468,969 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T15:13:36

---

## IACR-2018-952

- **Reference ID**: IACR-2018-952
- **Title**: CRYSTALS-Dilithium: A Lattice-Based Digital Signature Scheme
- **Authors**: KU Leuven COSIC; Ruhr University Bochum; INRIA France; ETH Zurich
- **Publication Date**: 2017-07-05
- **Last Updated**: 2021-02-08
- **Document Status**: Published
- **Main Topic**: Presentation of the CRYSTALS-Dilithium lattice-based digital signature scheme, its security analysis under Module-LWE and Module-SIS assumptions, and an optimized AVX2 implementation.
- **PQC Algorithms Covered**: CRYSTALS-Dilithium; Dilithium
- **Quantum Threats Addressed**: Quantum computers; quantum algorithms requiring space as much as time
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Léo Ducas; Eike Kiltz; Tancrède Lepoint; Vadim Lyubashevsky; Peter Schwabe; Gregor Seiler; Damien Stehlé
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: SHAKE-128; SHAKE-256; FFT
- **Key Takeaways**: Dilithium avoids discrete Gaussian sampling to enable secure constant-time implementation using uniform sampling; The scheme achieves a 2.5X smaller public key than previous non-Gaussian lattice schemes with similar signature sizes; An optimized AVX2-based Number Theoretic Transform provides a speed-up of roughly a factor of 2 over prior literature; Security parameters are conservative, accounting for future quantum algorithms that may require space equal to time; The scheme minimizes the sum of public key and signature sizes for efficient transmission in certificate chains.
- **Security Levels & Parameters**: q = 2^23 - 2^13 + 1; n = 256; ring Zq[X]/(X^256 + 1); 2.7KB signatures; 1.5KB public keys; 5x4 matrix A
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Public key 2.5X smaller than previous schemes; Signature size essentially same as previous schemes; AVX2 implementation speed-up of factor of 2 over previous algorithms; 25% signing speed-up and 15% verification speed-up compared to floating point NTT; Expected number of signing loop repetitions between 4 and 7
- **Target Audience**: Researcher; Developer; Security Architect
- **Implementation Prerequisites**: AVX2 instruction set support; SHAKE-128 implementation; Integer arithmetic for Number Theoretic Transform; Constant-time implementation of polynomial multiplication and rounding
- **Relevant PQC Today Features**: Algorithms; Leaders; pqc-101; entropy-randomness; digital-id
- **Source Document**: IACR-2018-952.pdf (883,892 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T15:45:20

---

## IACR-2019-1086

- **Reference ID**: IACR-2019-1086
- **Title**: SPHINCS+: Stateless Hash-Based Signatures (CCS 2019)
- **Authors**: TU Eindhoven; Ruhr University Bochum; Stanford ACG; UC Berkeley
- **Publication Date**: 2019-09-20
- **Last Updated**: 2019-09-20
- **Document Status**: Published
- **Main Topic**: Introduction and formal security analysis of SPHINCS+, a stateless hash-based signature framework featuring FORS and tweakable hash functions.
- **PQC Algorithms Covered**: SPHINCS+; SLH-DSA; WOTS+; FORS; HT; XMSS; Gravity-SPHINCS; Picnic
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Daniel J. Bernstein; Ruben Niederhagen; Andreas Hülsing; Joost Rijneveld; Peter Schwabe; Stefan Kölbl
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; ECDSA
- **Key Takeaways**: SPHINCS+ offers significant advantages in speed, signature size, and security over previous stateful schemes; The introduction of FORS few-time signatures and tweakable hash functions enables a unified security analysis; Stateless design eliminates the need for continuous state updates, making it suitable for distributed servers and backups; Security reductions allow for smaller parameters by mitigating multi-target attacks; The framework provides flexibility for application-specific trade-offs regarding signature size, signing speed, and memory limits.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Researcher; Security Architect; Developer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms; stateful-signatures; merkle-tree-certs; pqc-101
- **Source Document**: IACR-2019-1086.pdf (2,152,409 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T15:46:42

---

## Bernstein-Lange-PQC-Survey

- **Reference ID**: Bernstein-Lange-PQC-Survey
- **Title**: Post-Quantum Cryptography
- **Authors**: TU Eindhoven; Ruhr University Bochum
- **Publication Date**: 2009-02-10
- **Last Updated**: 2009-02-10
- **Document Status**: Published
- **Main Topic**: Foundational academic book covering mathematical foundations and implementation issues of lattice-based, code-based, hash-based, and multivariate post-quantum cryptography.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum computers will break today's most popular public-key cryptographic systems
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Daniel J. Bernstein (Editor, Introduction); Sean Hallgren and Ulrich Vollmer (Quantum computing chapter); Johannes Buchmann, Erik Dahmen, Michael Szydlo (Hash-based Digital Signature Schemes chapter); Raphael Overbeck and Nicolas Sendrier (Code-based cryptography chapter); Daniele Micciancio and Oded Regev (Lattice-based Cryptography chapter); Jintai Ding and Bo-Yin Yang (Multivariate Public Key Cryptography chapter)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA, DSA, ECDSA
- **Key Takeaways**: Quantum computers will break current public-key systems including RSA, DSA, and ECDSA; The book covers four major families of post-quantum cryptography: lattice-based, code-based, hash-based, and multivariate; Mathematical foundations and implementation issues are included for the next generation of cryptographic algorithms; Leading experts have joined forces to explain the state of the art in quantum computing and various PQC families
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Students, Researchers
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms, Leaders, Threats
- **Source Document**: Bernstein-Lange-PQC-Survey.html (264,502 bytes, 7,738 extracted chars)
- **Extraction Timestamp**: 2026-03-31T15:48:21

---

## FIPS-180-4

- **Reference ID**: FIPS-180-4
- **Title**: Secure Hash Standard (SHS) — SHA-1, SHA-224, SHA-256, SHA-384, SHA-512
- **Authors**: NIST
- **Publication Date**: 2015-08-04
- **Last Updated**: 2015-08-04
- **Document Status**: Published
- **Main Topic**: This standard specifies secure hash algorithms SHA-1, SHA-224, SHA-256, SHA-384, SHA-512, SHA-512/224, and SHA-512/256 for computing message digests.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; Federal departments and agencies
- **Leaders Contributions Mentioned**: Penny Pritzker, Secretary of Commerce; Willie E. May, Under Secretary for Standards and Technology and Director; Charles H. Romine, Director Information Technology Laboratory
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: Federal Information Security Management Act (FISMA); FIPS 180-4; FIPS 202; FIPS 140-2
- **Classical Algorithms Referenced**: SHA-1, SHA-224, SHA-256, SHA-384, SHA-512, SHA-512/224, SHA-512/256
- **Key Takeaways**: Secure hash algorithms are required for Federal applications to protect sensitive unclassified information; Only NIST validated implementations comply with this standard; The standard supersedes FIPS 180-3; Message digests range from 160 to 512 bits depending on the algorithm; Implementations may be covered by U.S. or foreign patents
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Message length less than 2^64 bits for SHA-1, SHA-224, and SHA-256; Message length less than 2^128 bits for SHA-384, SHA-512, SHA-512/224, and SHA-512/256; Digest lengths from 160 to 512 bits
- **Target Audience**: Compliance Officer, Security Architect, Developer, Policy Maker
- **Implementation Prerequisites**: NIST validation required for compliance; Review of FIPS 140-2 Implementation Guidance IG 1.10; Adherence to Federal export controls by Bureau of Export Administration
- **Relevant PQC Today Features**: Algorithms, Compliance, Assess, crypto-agility
- **Source Document**: FIPS-180-4.pdf (833,315 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T15:49:40

---

## RFC-9935

- **Reference ID**: RFC-9935
- **Title**: Internet X.509 PKI — Algorithm Identifiers for ML-KEM
- **Authors**: IETF LAMPS WG
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Standards Track RFC
- **Main Topic**: Defines algorithm identifiers (OIDs) and key formats for ML-KEM-512, ML-KEM-768, and ML-KEM-1024 in X.509 certificates and CRLs.
- **PQC Algorithms Covered**: ML-KEM
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; NIST
- **Leaders Contributions Mentioned**: S. Turner, P. Kampanakis, J. Massimo, B. E. Westerbaan
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, X.509
- **Infrastructure Layers**: PKI
- **Standardization Bodies**: IETF, NIST
- **Compliance Frameworks Referenced**: FIPS 203
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: ML-KEM certificates must use specific OIDs assigned by NIST for three security levels; The seed format is recommended for private keys as it is the most compact representation; Key usage extension must be set to keyEncipherment for ML-KEM certificates; Expanding a private key from a seed is a one-way function requiring retention of the seed for recovery.
- **Security Levels & Parameters**: ML-KEM-512, ML-KEM-768, ML-KEM-1024
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: ML-KEM-512 public key 800 octets; ML-KEM-768 public key 1184 octets; ML-KEM-1024 public key 1568 octets; Private key seed 64 octets; ML-KEM-512 expanded private key 1632 octets; ML-KEM-768 expanded private key 2400 octets; ML-KEM-1024 expanded private key 3168 octets
- **Target Audience**: Developer, Security Architect, Compliance Officer
- **Implementation Prerequisites**: Support for ASN.1 encoding; Cryptographically secure pseudorandom number generator (CSPRNG); Ability to parse context-specific tags IMPLICIT [0], OCTET STRING, and SEQUENCE
- **Relevant PQC Today Features**: Algorithms, pki-workshop, tls-basics, crypto-agility
- **Source Document**: RFC-9935.html (231,123 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T15:51:38

---

## draft-reddy-tls-composite-mldsa

- **Reference ID**: draft-reddy-tls-composite-mldsa
- **Title**: Use of Composite ML-DSA in TLS 1.3
- **Authors**: T. Reddy; IETF TLS WG
- **Publication Date**: 2024-06-01
- **Last Updated**: 2026-03-01
- **Document Status**: Individual Internet-Draft
- **Main Topic**: Defines the use of Composite ML-DSA hybrid signatures in TLS 1.3 by combining ML-DSA with classical algorithms for backward-compatible migration.
- **PQC Algorithms Covered**: ML-DSA
- **Quantum Threats Addressed**: Quantum computing threats to traditional cryptographic systems; zero-day vulnerabilities; potential breaks or critical bugs in ML-DSA implementations
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Tirumaleswar Reddy.K; Tim Hollebeek; John Gray; Scott Fluhrer; Daniel Van Geest
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.3
- **Infrastructure Layers**: PKI; Certificates
- **Standardization Bodies**: IETF; NIST
- **Compliance Frameworks Referenced**: FIPS 204; BCP 78; BCP 79; RFC 2119; RFC 8174; RFC 9794
- **Classical Algorithms Referenced**: RSA-PKCS#1 v1.5; RSA-PSS; ECDSA; Ed25519; Ed448; SHA-256; SHA-512; SHAKE256; secp256r1; secp384r1
- **Key Takeaways**: Composite signatures provide protection against potential breaks or critical bugs in ML-DSA by requiring attackers to break all constituent algorithms simultaneously; Hybrid signatures mitigate the window of vulnerability caused by zero-day exploits and slow fallback transitions; Composite schemes are recommended by certain jurisdictions for PQC lattice schemes within a PQ/T hybrid framework; TLS 1.3 supports composite ML-DSA negotiation via signature_algorithms and signature_algorithms_cert extensions; Empty context strings must be used for signing and verification when using Composite ML-DSA in TLS
- **Security Levels & Parameters**: ML-DSA-44; ML-DSA-65; ML-DSA-87; RSA2048; RSA3072; RSA4096
- **Hybrid & Transition Approaches**: Composite signatures; PQ/T Hybrids; hybrid TLS authentication; composite certificates
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Compliance Officer; Policy Maker
- **Implementation Prerequisites**: Support for TLS 1.3 signature_algorithms and signature_algorithms_cert extensions; adherence to empty context string requirement for Composite ML-DSA; compatibility with I-D.ietf-lamps-pq-composite-sigs definitions
- **Relevant PQC Today Features**: tls-basics; hybrid-crypto; crypto-agility; pki-workshop; algorithms
- **Source Document**: draft-reddy-tls-composite-mldsa.html (71,661 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T15:53:40

---

## draft-ietf-hpke-pq

- **Reference ID**: draft-ietf-hpke-pq
- **Title**: Post-Quantum and Post-Quantum/Traditional Hybrid Algorithms for HPKE
- **Authors**: IETF HPKE WG
- **Publication Date**: 2024-03-01
- **Last Updated**: 2026-03-01
- **Document Status**: Internet-Draft
- **Main Topic**: This document defines post-quantum and hybrid post-quantum/traditional Key Encapsulation Mechanisms for HPKE to enable quantum-safe encryption.
- **PQC Algorithms Covered**: ML-KEM-512, ML-KEM-768, ML-KEM-1024
- **Quantum Threats Addressed**: harvest now, decrypt later attacks; inference of decapsulation keys from encapsulation keys by a cryptographically relevant quantum computer
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Richard Barnes; Deirdre Connolly
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: HPKE, Messaging Layer Security (MLS), Oblivious HTTP, TLS Encrypted ClientHello extension
- **Infrastructure Layers**: Key Encapsulation Mechanism (KEM); Key Derivation Function (KDF); Authenticated Encryption with Associated Data (AEAD)
- **Standardization Bodies**: Internet Engineering Task Force (IETF); NIST
- **Compliance Frameworks Referenced**: BCP 78; BCP 79; FIPS203; FIPS186; RFC7748; RFC9180; RFC9420; RFC9458
- **Classical Algorithms Referenced**: X25519, P-256, P-384, X448, AES-128-GCM, AES-256-GCM, ChaCha20Poly1305, SHAKE256, HKDF-SHA256, HKDF-SHA384, HKDF-SHA512
- **Key Takeaways**: Hybrid constructions combining PQ and traditional KEMs provide security fallback if the PQ algorithm fails; HPKE can be made resilient to quantum computer attacks by integrating ML-KEM; SHA-3 based KDFs are defined for compatibility with ML-KEM internal operations; The document supports both pure PQ and PQ/T hybrid modes for interoperability.
- **Security Levels & Parameters**: NIST category 3; NIST category 5; ML-KEM-512; ML-KEM-768; ML-KEM-1024
- **Hybrid & Transition Approaches**: Hybrid constructions of post-quantum KEMs with traditional KEMs; X25519 + ML-KEM-768; P-256 + ML-KEM-768; P-384 + ML-KEM-1024
- **Performance & Size Considerations**: 64-byte seed format for decapsulation keys; fixed-length byte strings for public encapsulation keys determined by parameter set
- **Target Audience**: Developer, Security Architect, Researcher
- **Implementation Prerequisites**: SHAKE256 KDF implementation; ML-KEM.KeyGen_internal function from FIPS203; pseudorandom bytes meeting randomness requirements of FIPS203
- **Relevant PQC Today Features**: Algorithms, hybrid-crypto, tls-basics, email-signing, pqc-risk-management
- **Source Document**: draft-ietf-hpke-pq.html (206,445 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T15:55:48

---

## draft-ietf-ipsecme-ikev2-downgrade-prevention

- **Reference ID**: draft-ietf-ipsecme-ikev2-downgrade-prevention
- **Title**: Downgrade Prevention for the Internet Key Exchange Protocol Version 2 (IKEv2)
- **Authors**: IETF IPSECME WG
- **Publication Date**: 2024-01-01
- **Last Updated**: 2026-03-01
- **Document Status**: Internet-Draft
- **Main Topic**: Specifies an extension to IKEv2 to prevent algorithm downgrade attacks that force PQC-capable peers to negotiate weaker classical algorithms.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Downgrade attacks preventing quantum-resistant key exchange; Key-compromise impersonation (KCI) attacks; Identity misbinding attacks
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Valery Smyslov; Christopher Patton; Tero Kivinen
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: IKEv2; IPsec; SIGMA
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: BCP 78; BCP 79; Revised BSD License
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Peers must confirm participation in the same conversation to prevent downgrade attacks; Coexistence of old and new algorithms during migration increases vulnerability to KCI and identity misbinding attacks; Attackers can force peers to use weak key exchange methods by intercepting and modifying algorithm proposals; Authentication in IKEv2 currently allows attackers to modify AUTH payloads if they possess long-term keys or break weak algorithms
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid PQ/T key exchange; Coexistence of old and new algorithms during migration
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Protocol Engineer
- **Implementation Prerequisites**: Familiarity with IKEv2 protocol [RFC7296]; Support for SIGMA protocol design
- **Relevant PQC Today Features**: Threats, Migrate, Algorithms, crypto-agility, vpn-ssh-pqc
- **Source Document**: draft-ietf-ipsecme-ikev2-downgrade-prevention.html (65,826 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T15:58:14

---

## Signal-PQXDH-Spec

- **Reference ID**: Signal-PQXDH-Spec
- **Title**: PQXDH: The Post-Quantum Extended Diffie-Hellman Protocol
- **Authors**: Signal Messenger
- **Publication Date**: 2023-09-19
- **Last Updated**: 2024-12-01
- **Document Status**: Published
- **Main Topic**: Specification of the PQXDH key agreement protocol extending X3DH with post-quantum security using ML-KEM for Signal Messenger.
- **PQC Algorithms Covered**: Crystals-Kyber-1024, CRYSTALS-KYBER-1024
- **Quantum Threats Addressed**: Passive quantum adversaries; Active quantum adversaries
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Ehren Kret; Rolfe Schmidt
- **PQC Products Mentioned**: Signal Messenger
- **Protocols Covered**: PQXDH; X3DH; XEdDSA; HKDF; AEAD
- **Infrastructure Layers**: Key Management; Server trust
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: curve25519; curve448; SHA-256; SHA-512; X25519; X448; HKDF
- **Key Takeaways**: PQXDH provides post-quantum forward secrecy while relying on discrete log hardness for authentication; Implementations must support both one-time and last-resort post-quantum prekeys to handle server storage limits; The protocol requires pairwise disjoint encoding ranges for elliptic curve and KEM keys; Alice must verify signatures on all prekeys before generating ephemeral keys; Hybrid key establishment combines classical Diffie-Hellman outputs with post-quantum encapsulated shared secrets.
- **Security Levels & Parameters**: IND-CCA post-quantum security; IND-CPA and INT-CTXT post-quantum security; 256 or 512-bit hash function; 32 bytes HKDF output; 64-byte random values for signatures
- **Hybrid & Transition Approaches**: Hybrid key agreement combining Elliptic Curve Diffie-Hellman and Post-Quantum Key Encapsulation Mechanism; Dual use of classical identity keys and post-quantum prekeys
- **Performance & Size Considerations**: 64-byte random values Z; 32 bytes HKDF output; 57 0xFF bytes for curve448 F constant; 32 0xFF bytes for curve25519 F constant
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: Support for XEdDSA signatures; Implementation of EncodeEC and DecodeEC functions with single-byte curve constants; Implementation of EncodeKEM and DecodeKEM functions with single-byte pqkem constants; Ability to manage one-time prekey bundles on a server
- **Relevant PQC Today Features**: Algorithms; hybrid-crypto; crypto-agility; entropy-randomness; tls-basics
- **Source Document**: Signal-PQXDH-Spec.html (63,790 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T15:59:53

---

## Apple-PQ3-Security-Blog

- **Reference ID**: Apple-PQ3-Security-Blog
- **Title**: iMessage with PQ3: The New State of the Art in Quantum-Secure Messaging Protocols
- **Authors**: Apple Security Engineering & Architecture
- **Publication Date**: 2024-02-21
- **Last Updated**: 2024-02-21
- **Document Status**: Published
- **Main Topic**: Apple introduces PQ3, a Level 3 post-quantum cryptographic protocol for iMessage that secures both initial key establishment and ongoing message exchange using hybrid encryption.
- **PQC Algorithms Covered**: ML-KEM, Kyber
- **Quantum Threats Addressed**: Harvest Now, Decrypt Later; future quantum computer attacks on classical mathematical problems
- **Migration Timeline Info**: PQ3 rollout starts with iOS 17.4, iPadOS 17.4, macOS 14.4, and watchOS 10.4; full replacement of existing protocol within all supported conversations this year
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Professor David Basin (head of Information Security Group at ETH Zürich, inventor of Tamarin, led formal analysis); Professor Douglas Stebila (University of Waterloo, performed game-based proofs analysis); Felix Linker (ETH Zürich, co-author of formal analysis); Dr. Ralf Sasse (ETH Zürich, co-author of formal analysis)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: PQ3, PQXDH, Elliptic Curve cryptography (ECC), Elliptic Curve Diffie-Hellman (ECDH)
- **Infrastructure Layers**: Secure Enclave; Apple servers for key transmission
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA, Elliptic Curve signatures, Diffie-Hellman, Elliptic Curve cryptography (ECC), Elliptic Curve Diffie-Hellman (ECDH)
- **Key Takeaways**: PQ3 achieves Level 3 security by securing both initial key establishment and ongoing message exchange; Hybrid design combines ML-KEM with ECC to ensure security is never less than the classical protocol; Periodic rekeying provides cryptographic self-healing to limit exposure from key compromises; Formal verification by ETH Zürich and University of Waterloo confirms protocol secrecy even against quantum adversaries
- **Security Levels & Parameters**: Level 3 security; Module Lattice-based Key Encapsulation Mechanism (ML-KEM)
- **Hybrid & Transition Approaches**: Hybrid design combining post-quantum algorithms with Elliptic Curve cryptography; additive cryptography requiring defeat of both classical and post-quantum primitives; backward-compatible rekeying frequency updates
- **Performance & Size Considerations**: Post-quantum key has significantly larger wire size than existing protocol; periodic rekeying used to amortize message size and avoid excessive overhead
- **Target Audience**: Security Architect, Developer, Researcher, Policy Maker
- **Implementation Prerequisites**: iOS 17.4 or later; iPadOS 17.4 or later; macOS 14.4 or later; watchOS 10.4 or later; devices supporting PQ3 for automatic protocol ramp-up
- **Relevant PQC Today Features**: Threats, Algorithms, Hybrid-crypto, Leaders, Migration-program
- **Source Document**: Apple-PQ3-Security-Blog.html (106,083 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:01:57

---

## KpqC-NTRU-Plus

- **Reference ID**: KpqC-NTRU-Plus
- **Title**: NTRU+: KpqC Post-Quantum Key Encapsulation Mechanism
- **Authors**: KISA; Ministry of Science and ICT; NIS Korea
- **Publication Date**: 2025-01-31
- **Last Updated**: 2025-01-31
- **Document Status**: KpqC Selected
- **Main Topic**: Introduction of NTRU+, a new lattice-based key encapsulation mechanism using ACWC2 and FO⊥ transformations to achieve worst-case correctness error and tight security reductions.
- **PQC Algorithms Covered**: NTRU+; NTRU; NTRU-B; Kyber; Saber; NTRU-HRSS; NTRU-HPS
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Jonghyun Kim; Jong Hwan Park; Hoffstein; Pipher; Silverman
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST; KpqC
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: NTRU+ overcomes drawbacks of previous NTRU variants by achieving worst-case correctness error with moderate modulus; The ACWC2 transformation enables tight security reduction without the loose factor found in ACWC; SOTP encoding allows sampling messages from a natural bit-string space with arbitrary distribution; FO⊥ transform removes re-encryption requirements, resulting in faster decryption than standard FO; NTRU+ utilizes NTT-friendly rings over cyclotomic trinomials for efficiency
- **Security Levels & Parameters**: NTRU+576 (115 bits classical security); NTRU+768 (161 bits); NTRU+864 (188 bits); NTRU+1152 (264 bits); Kyber512; Kyber768; Kyber1024
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: NTRU+576 public key 864 bytes; NTRU+576 ciphertext 864 bytes; NTRU+576 secret key 1728 bytes; NTRU+1152 public key 1728 bytes; NTRU+1152 ciphertext 1728 bytes; NTRU+1152 secret key 3456 bytes; NTRU+576 generation 17K cycles; NTRU+576 encapsulation 14K cycles; NTRU+576 decapsulation 12K cycles
- **Target Audience**: Researcher; Developer; Security Architect
- **Implementation Prerequisites**: AVX2 optimization; NTT-friendly rings over cyclotomic trinomials
- **Relevant PQC Today Features**: Algorithms; Migrate; Assess; pqc-101; entropy-randomness
- **Source Document**: KpqC-NTRU-Plus.pdf (478,947 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:03:57

---

## KpqC-SMAUG-T

- **Reference ID**: KpqC-SMAUG-T
- **Title**: SMAUG-T: KpqC Post-Quantum Key Encapsulation Mechanism
- **Authors**: CryptoLab Inc.; KISA; NIS Korea
- **Publication Date**: 2025-01-31
- **Last Updated**: 2025-01-31
- **Document Status**: KpqC Selected
- **Main Topic**: SMAUG-T is a post-quantum key encapsulation mechanism based on Module-LWE and Module-LWR assumptions, selected as a South Korean national standard by KpqC.
- **PQC Algorithms Covered**: SMAUG-T; TiMER
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: South Korea; Bodies: KpqC
- **Leaders Contributions Mentioned**: Jung Hee Cheon (Team member); Hyeongmin Choe (Team member, Design author); Joongeun Choi (Team member); Dongyeon Hong (Team member); Jeongdae Hong (Team member); Chi-Gon Jung (Team member); Honggoo Kang (Team member); Minhyeok Kang (Team member); Taekyung Kim (Team member, Contact); Jeongbeen Ko (Team member); Janghyun Lee (Team member); Seonghyuck Lim (Team member); Aesun Park (Team member); Seunghwan Park (Team member); Jungjoo Seo (Team member); Hyoeun Seong (Team member); Junbum Shin (Team member); MinJune Yi (Team member)
- **PQC Products Mentioned**: SMAUG-T; TiMER
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: KpqC
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: SMAUG-T combines MLWE for long-term secret key security with MLWR for efficient ephemeral key generation; The TiMER parameter set targets security level 1 using D2 encoding to reduce decryption failure probability; Implementation includes AVX2 and constant-time versions available via GitHub; The mechanism follows the Fujisaki-Okamoto transform in the Quantum Random Oracle Model
- **Security Levels & Parameters**: Security level 1 (TiMER)
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Smaller ciphertext size; Faster running time; AVX2 implementation available; Constant-time implementation available
- **Target Audience**: Developer; Researcher; Security Architect
- **Implementation Prerequisites**: GitHub repository access for code and specifications; AVX2 support for optimized builds
- **Relevant PQC Today Features**: Algorithms; Leaders; Migrate; pqc-101; hybrid-crypto
- **Source Document**: KpqC-SMAUG-T.html (165,928 bytes, 4,078 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:06:19

---

## KpqC-AIMer

- **Reference ID**: KpqC-AIMer
- **Title**: AIMer: KpqC Post-Quantum Digital Signature Scheme
- **Authors**: KISA; NIS Korea
- **Publication Date**: 2025-01-31
- **Last Updated**: 2025-01-31
- **Document Status**: KpqC Selected
- **Main Topic**: Proposal of the AIMer post-quantum digital signature scheme based on the MPC-in-the-Head paradigm and the new AIM one-way function using Mersenne S-boxes.
- **PQC Algorithms Covered**: AIMer, Picnic, BBQ, Banquet, Rain, CRYSTALS-Kyber, CRYSTALS-Dilithium, Falcon, SPHINCS+, Rainbow, SIKE
- **Quantum Threats Addressed**: Quantum computers solving factoring and discrete logarithm problems in polynomial time
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Korea; Bodies: KpqC
- **Leaders Contributions Mentioned**: Seongkwang Kim, Jincheol Ha, Mincheol Son, Byeonghak Lee, Dukjae Moon, Joohee Lee, Sangyub Lee, Jihoon Kwon, Jihoon Cho, Hyojin Yoon, Jooyoung Lee
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST, KpqC
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: AES, LowMC
- **Key Takeaways**: MPCitH-based schemes offer security diversity by relying solely on one-way function hardness; Mersenne S-boxes provide higher resistance to algebraic attacks than inverse S-boxes; AIMer achieves shorter signature sizes and improved signing performance compared to Rain-based schemes at 128-bit security; Precise estimation of Groebner basis attack complexity requires counting exact Boolean quadratic equations from S-boxes
- **Security Levels & Parameters**: 128-bit security level, N=16 parties, AIMer-I sig size 5904 bytes, AIMer-III sig size 13080 bytes, AIMer-V sig size 25152 bytes
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: AIMer-I signature size 5904 bytes; AIMer-III signature size 13080 bytes; AIMer-V signature size 25152 bytes; 8.21% shorter signature size than 3-round Rain; 21.15% shorter signature size than 4-round Rain; 1.22% improved signing performance vs 3-round Rain; 13.41% improved signing performance vs 4-round Rain
- **Target Audience**: Researcher, Security Architect, Developer
- **Implementation Prerequisites**: C standalone implementation; AVX2 instructions support
- **Relevant PQC Today Features**: Algorithms, crypto-agility, stateful-signatures, digital-id
- **Source Document**: KpqC-AIMer.pdf (737,303 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:07:50

---

## KpqC-HAETAE

- **Reference ID**: KpqC-HAETAE
- **Title**: HAETAE: KpqC Post-Quantum Digital Signature Scheme
- **Authors**: CryptoLab Inc.; KISA; NIS Korea
- **Publication Date**: 2025-01-31
- **Last Updated**: 2025-01-31
- **Document Status**: KpqC Selected
- **Main Topic**: HAETAE is a module lattice-based digital signature scheme selected as a South Korean national PQC standard by KpqC in January 2025, designed for shorter signatures suitable for space-limited scenarios like DNSSEC.
- **PQC Algorithms Covered**: HAETAE; ML-DSA (referenced as Dilithium); BLISS (referenced)
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Selected as a South Korean national PQC standard by KpqC in January 2025
- **Applicable Regions / Bodies**: Regions: South Korea; Bodies: KpqC
- **Leaders Contributions Mentioned**: Jung Hee Cheon (Seoul National University & CryptoLab Inc.); Hyeongmin Choe (SNU); Julien Devevey (ANSSI); Tim Güneysu (Ruhr University Bochum & DFKI); Dongyeon Hong (Samsung Electronics); Minhyeok Kang (CryptoLab Inc.); Taekyung Kim (CryptoLab Inc.); Jeongbeen Ko; Markus Krausz (TÜV Informationstechnik GmbH); Georg Land (Intel); Marc Möller (Ruhr University Bochum); Junbum Shin (CryptoLab Inc.); Damien Stehlé (CryptoLab Inc.); MinJune Yi (SNU)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: DNSSEC; TCP; UDP
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: KpqC
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: HAETAE targets space-limited scenarios like DNSSEC by reducing signature and verification key sizes; The scheme uses a bimodal distribution for rejection sampling to reduce sizes compared to unimodal distributions; Hyperball uniform sampling is used instead of SCA-vulnerable discrete Gaussian distributions; Signatures are designed to fit into one TCP or UDP datagram; On/off-line acceleration is possible by precomputing hyperball samples
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Signatures fit into one TCP or UDP datagram; AVX2 optimized implementations available in v2.0
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: AVX2 support for optimized implementations (v2.0)
- **Relevant PQC Today Features**: Algorithms; Leaders; stateful-signatures; digital-id; code-signing
- **Source Document**: KpqC-HAETAE.html (160,370 bytes, 3,382 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:09:55

---

## Peikert-Lattice-Survey-2016

- **Reference ID**: Peikert-Lattice-Survey-2016
- **Title**: A Decade of Lattice Cryptography
- **Authors**: Chris Peikert (University of Michigan)
- **Publication Date**: 2016-03-01
- **Last Updated**: 2016-03-01
- **Document Status**: Published
- **Main Topic**: A comprehensive survey of lattice-based cryptography covering foundational hardness problems like SIS and LWE, their worst-case security guarantees, and various cryptographic constructions including fully homomorphic encryption.
- **PQC Algorithms Covered**: SIS, LWE, Ring-SIS, Ring-LWE, NTRU, Ajtai-Dwork Encryption, Goldreich-Goldwasser-Halevi Encryption, Regev's LWE Cryptosystem, Dual LWE Cryptosystem, Fully Homomorphic Encryption, Attribute-Based Encryption
- **Quantum Threats Addressed**: Shor's Algorithm; efficient quantum algorithms for integer factorization and discrete logarithm problem
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Chris Peikert (author); Ajtai (Ajtai's Function, worst-case/average-case connection); Regev (Regev's Improvements, LWE Cryptosystem); Gentry (Fully Homomorphic Encryption construction); Rivest (vision of FHE); Goldreich; Goldwasser; Halevi; Micciancio; NTRU authors
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Diffie-Hellman protocol
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA, Diffie-Hellman, integer factorization, discrete logarithm problem, quadratic residuosity
- **Key Takeaways**: Lattice cryptography offers apparent resistance to quantum attacks unlike number-theoretic systems; Security is based on worst-case intractability assumptions rather than average-case only; Lattice-based schemes enable advanced constructions like fully homomorphic encryption and attribute-based encryption; Ring-based variants of SIS and LWE provide higher efficiency and parallelism
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Researcher, Theoretical Computer Scientist, Graduate Student
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms, Threats, Leaders, pqc-101
- **Source Document**: Peikert-Lattice-Survey-2016.pdf (703,532 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:11:22

---

## Weger-Code-Based-Survey-2022

- **Reference ID**: Weger-Code-Based-Survey-2022
- **Title**: A Survey on Code-Based Cryptography
- **Authors**: Violetta Weger; Niklas Gassner; Joachim Rosenthal (University of Zurich)
- **Publication Date**: 2022-01-18
- **Last Updated**: 2022-01-18
- **Document Status**: Published
- **Main Topic**: A survey on code-based cryptography covering public-key encryption and signature schemes including McEliece and Niederreiter frameworks.
- **PQC Algorithms Covered**: McEliece; Niederreiter; HQC; Classic McEliece
- **Quantum Threats Addressed**: Quantum computers breaking currently employed asymmetric cryptosystems
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Violetta Weger; Niklas Gassner; Joachim Rosenthal
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Quantum technology improvements threaten current asymmetric cryptosystems; NIST initiated standardization for PKE, KEM, and signatures in 2016; Code-based cryptography includes frameworks like McEliece and Niederreiter; Security assumptions and parameter selection are critical analysis points; Mathematical background is provided to reach a wider audience
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Researcher; Developer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms; Threats; pqc-101
- **Source Document**: Weger-Code-Based-Survey-2022.html (45,681 bytes, 4,876 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:13:21

---

## Regev-LWE-Survey

- **Reference ID**: Regev-LWE-Survey
- **Title**: The Learning with Errors Problem
- **Authors**: Oded Regev (Courant Institute, NYU)
- **Publication Date**: 2010-01-01
- **Last Updated**: 2010-01-01
- **Document Status**: Published
- **Main Topic**: A foundational survey describing the Learning with Errors (LWE) problem, its hardness based on worst-case lattice problems, and its cryptographic applications.
- **PQC Algorithms Covered**: LWE, Ring-LWE, SIS, LPN
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Oded Regev; Blum, Kalai, and Wasserman; Ajtai and Dwork; Peikert; Lyubashevsky and Micciancio
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: Gaussian elimination
- **Key Takeaways**: LWE hardness is based on worst-case lattice problems like GAPSVP and SIVP; The best known algorithms for LWE run in exponential time even with quantum computers; Ring-LWE reduces key sizes from quadratic to almost linear size using structure and fast Fourier transform; LWE supports diverse cryptographic constructions including public-key encryption, identity-based encryption, and oblivious transfer
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Key sizes typically on the order of n squared for SIS and LWE; Ring-LWE reduces key size to almost linear O(n); Operations sped up using fast Fourier transform
- **Target Audience**: Researcher, Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms, Leaders, pqc-101
- **Source Document**: Regev-LWE-Survey.pdf (651,923 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:14:25

---

## Bernstein-Lange-Fallout-2017

- **Reference ID**: Bernstein-Lange-Fallout-2017
- **Title**: Post-quantum cryptography — dealing with the fallout of physics success
- **Authors**: Daniel J. Bernstein (UIC); Tanja Lange (TU Eindhoven)
- **Publication Date**: 2017-04-10
- **Last Updated**: 2017-04-10
- **Document Status**: Published
- **Main Topic**: Survey of post-quantum cryptography candidates and migration strategies in response to quantum computing threats against current public-key systems.
- **PQC Algorithms Covered**: McEliece, Goppa code, lattice-based, code-based, hash-based, multivariate, isogeny-based
- **Quantum Threats Addressed**: Shor's algorithm; Grover's algorithm; recording and forging human communication for future decryption
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Daniel J. Bernstein; Tanja Lange; Andreas Hülsing; Bo-Yin Yang
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; ECC; AES; Salsa20; GMAC; Poly1305; SHA-256; SHA-3; DH; DSA; ECDH; ECDSA
- **Key Takeaways**: Organizations must deploy post-quantum cryptography before quantum computers arrive to prevent decryption of recorded communications; Switching from 128-bit to 256-bit AES keys mitigates Grover's algorithm threats with minimal cost; Public-key systems like RSA and ECC will be broken by Shor's algorithm while symmetric systems remain secure with larger key sizes; Post-quantum proposals based on lattice, code-based, hash-based, multivariate, and isogeny families have resisted known attacks.
- **Security Levels & Parameters**: 128-bit security; 256-bit security; 3072-bit RSA; 256-bit ECDH; 256-bit ECDSA; 128-bit AES; 256-bit AES
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Shor's algorithm requires billions of operations on thousands of logical qubits; Fault-tolerant attacks require trillions of operations on millions of physical qubits; Grover's attack on 128-bit AES uses about 2^64 quantum evaluations; Grover's attack circuit uses about 3000 qubits and 2^86 T-gates
- **Target Audience**: Researcher; Security Architect; Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats; Algorithms; pqc-risk-management; tls-basics; code-signing
- **Source Document**: Bernstein-Lange-Fallout-2017.pdf (421,123 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:16:01

---

## NSA CNSA 2.0

- **Reference ID**: NSA CNSA 2.0
- **Title**: Commercial National Security Algorithm Suite 2.0
- **Authors**: NSA
- **Publication Date**: 2022-09-01
- **Last Updated**: 2025-05-30
- **Document Status**: Policy/Advisory
- **Main Topic**: NSA advisory announcing requirements for National Security Systems to transition to the Commercial National Security Algorithm Suite 2.0 using quantum-resistant algorithms by 2035.
- **PQC Algorithms Covered**: CRYSTALS-Kyber, CRYSTALS-Dilithium, Leighton-Micali Signature (LMS), Xtended Merkle Signature Scheme (XMSS)
- **Quantum Threats Addressed**: cryptanalytically relevant quantum computer (CRQC)
- **Migration Timeline Info**: Software and firmware signing transition immediately with exclusive use by 2030; web browsers/servers exclusive use by 2033; traditional networking equipment exclusive use by 2030; operating systems exclusive use by 2033; overall NSS transition complete by 2035
- **Applicable Regions / Bodies**: United States; National Security Agency (NSA); National Institute of Standards and Technology (NIST); Department of Defense; Defense Industrial Base
- **Leaders Contributions Mentioned**: Peter Shor
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, DTLS 1.2, DTLS 1.3, IPsec, SSH, S/MIME, CMS
- **Infrastructure Layers**: Public-key infrastructure (PKI), software signing, firmware signing, cloud services, virtual private networks, routers, operating systems
- **Standardization Bodies**: National Institute of Standards and Technology (NIST), Internet Engineering Task Force (IETF)
- **Compliance Frameworks Referenced**: CNSA 2.0, CNSA 1.0, CNSSP 15, CNSSP 11, NSD-42, NSM-8, NSM-10, FIPS PUB 197, FIPS PUB 180-4, NIST SP 800-208, NIAP
- **Classical Algorithms Referenced**: RSA, Diffie-Hellman (DH), elliptic curve cryptography (ECDH and ECDSA), Advanced Encryption Standard (AES), Secure Hash Algorithm (SHA)
- **Key Takeaways**: NSS owners must transition to CNSA 2.0 algorithms by 2035; software and firmware signing must use stateful signatures like LMS or XMSS immediately; RSA, DH, and ECC will be deprecated for NSS; Level V parameters are required for all classification levels; legacy equipment requires waivers if not refreshed regularly
- **Security Levels & Parameters**: Level V parameters for CRYSTALS-Kyber and CRYSTALS-Dilithium; 256-bit keys for AES; SHA-384 or SHA-512; SHA-256/192 recommended for LMS
- **Hybrid & Transition Approaches**: Hybrid solutions may be allowed due to protocol standards, product availability, or interoperability requirements; CNSA 2.0 algorithms become mandatory at specific dates while CNSA 1.0 alone is no longer approved
- **Performance & Size Considerations**: None detected
- **Target Audience**: NSS owners, operators, vendors, acquisition officials, Approving Officials (AOs), Security Architects, Compliance Officers
- **Implementation Prerequisites**: NIAP validation against approved protection profiles; NSA approval for cryptographic services; hardware implementation for signing software and firmware; state management for signatures; waiver process for legacy equipment
- **Relevant PQC Today Features**: Timeline, Threats, Compliance, Migrate, Algorithms, stateful-signatures, code-signing, tls-basics, vpn-ssh-pqc, email-signing, pki-workshop
- **Source Document**: CSA_CNSA_2.0_ALGORITHMS.pdf (586,858 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:17:59

---

## NSA CNSA 2.0 FAQ

- **Reference ID**: NSA CNSA 2.0 FAQ
- **Title**: CNSA 2.0 Frequently Asked Questions
- **Authors**: NSA
- **Publication Date**: 2022-09-01
- **Last Updated**: 2024-12-01
- **Document Status**: Policy/Advisory
- **Main Topic**: FAQ clarifying Commercial National Security Algorithm Suite 2.0 (CNSA 2.0) requirements, timelines, and algorithm specifications for National Security Systems.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, LMS, XMSS, SHA3
- **Quantum Threats Addressed**: Cryptanalytically relevant quantum computer (CRQC), cryptographically relevant quantum computer
- **Migration Timeline Info**: 2025-2030 prefer transition; 2030-2033 exclusive use of CNSA 2.0; 2035 complete transition
- **Applicable Regions / Bodies**: United States; National Security Systems (NSS); Department of Defense (DoD); Defense Industrial Base (DIB)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Hardware security module (HSM), firmware, software signing, secure boot
- **Standardization Bodies**: National Institute of Standards and Technology (NIST), Internet Engineering Task Force (IETF)
- **Compliance Frameworks Referenced**: CNSA 2.0, CNSSP 15, FIPS PUB 197, FIPS PUB 203, FIPS PUB 204, FIPS PUB 180-4, FIPS PUB 202, NIST SP 800-208, CJCSN 65104, CNSSAM 01-07NSM, NSM-10, CNSSP-11, Suite B, CNSA 1.0
- **Classical Algorithms Referenced**: RSA, Elliptic Curve Cryptography (ECC), AES, SHA-384, SHA-512, SHA-256
- **Key Takeaways**: RSA and ECC must be replaced to achieve quantum resistance; ML-KEM-1024 and ML-DSA-87 are required for all classification levels in NSS; LMS and XMSS are approved only for firmware and software signing; HSMs used for signing must be FIPS validated by CMVP; SHA3 is restricted to internal hardware functionality like secure boot
- **Security Levels & Parameters**: ML-KEM-1024, ML-DSA-87, AES 256-bit keys, SHA-384, SHA-512, LMS SHA-256/192, SHA3-384, SHA3-512
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: NSS owners and operators, Vendors, Security Architect, Compliance Officer
- **Implementation Prerequisites**: NIST Cryptographic Module Validation Program (CMVP) validation for signers; NIST Cryptographic Algorithm Validation Program (CAVP) validation for signature verification; Hardware security module (HSM) implementation for signing and state management; Adherence to FIPS 203, FIPS 204, and NIST SP 800-208
- **Relevant PQC Today Features**: Timeline, Threats, Compliance, Algorithms, code-signing, hsm-pqc, stateful-signatures
- **Source Document**: CSI*CNSA_2.0_FAQ*.pdf (441,742 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:20:16

---

## ANSSI-BSI-QKD-Position-Paper

- **Reference ID**: ANSSI-BSI-QKD-Position-Paper
- **Title**: ANSSI BSI QKD Position Paper
- **Authors**: ANSSI
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: A position paper by ANSSI, BSI, NLNCSA, and Swedish authorities arguing that QKD is currently limited to niche use cases due to technological immaturity and high costs, while prioritizing migration to post-quantum cryptography.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Shor's algorithm; store-now-decrypt-later scenario
- **Migration Timeline Info**: First selection of NIST standards will be available sometime in 2024
- **Applicable Regions / Bodies**: Bodies: French Cybersecurity Agency (ANSSI); Federal Office for Information Security (BSI); Netherlands National Communications Security Agency (NLNCSA); Swedish National Communications Security Authority, Swedish Armed Forces; European Commission
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: QKD protocols; one-time pad scheme
- **Infrastructure Layers**: Key Management; Public-key infrastructure; Quantum communication networks
- **Standardization Bodies**: NIST; ISO
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: AES; symmetric message authentication
- **Key Takeaways**: QKD is currently only viable for niche use cases due to high costs and technological limitations; migration to post-quantum cryptography and symmetric keying should be the primary priorities for quantum-safe security; practical QKD implementations cannot guarantee absolute security against computationally unbounded attackers without one-time pad usage which requires impractical bandwidth; QKD protocols lack rigorous standardization and comprehensive security proofs compared to post-quantum cryptography; end-to-end security over long distances is not achievable with current fibre-based QKD due to signal loss requiring trusted nodes
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Pre-shared symmetric keys in combination with classically secure public-key cryptography; use of post-quantum signature schemes for authentication in QKD
- **Performance & Size Considerations**: Commercial QKD systems typically reach about one hundred kilometres; QKD demonstrations can reach at most a few hundred kilometres; satellite availability limited to a short timeframe per day
- **Target Audience**: Policy Maker; Security Architect; General audience
- **Implementation Prerequisites**: Specialised hardware such as single-photon sources and detectors; pre-shared secret keys for authentication; classical authenticated channel; trusted nodes for long-distance fibre transmission
- **Relevant PQC Today Features**: qkd, threats, migration-program, pqc-risk-management, compliance-strategy
- **Source Document**: ANSSI_BSI_QKD_Position_Paper.pdf (475,650 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:22:27

---

## Algorand-PQC-Technical-Brief

- **Reference ID**: Algorand-PQC-Technical-Brief
- **Title**: Technical Brief: Quantum-resistant transactions on Algorand with Falcon signatures
- **Authors**: Algorand
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: Algorand executed the first post-quantum transaction on its mainnet using NIST-selected Falcon signatures to demonstrate quantum-resistant protection for digital assets.
- **PQC Algorithms Covered**: Falcon, Falcon-512, Falcon-1024
- **Quantum Threats Addressed**: Shor's algorithm; harvest now, decrypt later; forging blocks; stealing funds; rewriting transaction histories
- **Migration Timeline Info**: Forecasts suggesting a 20% probability of cryptographically relevant quantum computers before 2030
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Larkin Young (Written by); Giulio Pizzini, Cosimo Bassi, Steve Ferrigno (Technical contributions); Craig Gentry (GPV work, former Algorand Foundation Research Fellow); Chris Peikert (Head of Cryptography at Algorand Technologies, GPV work, design and implementation of deterministic mode); Vinod Vaikuntanathan (MIT professor, Scientific Advisor to Algorand, GPV work); Dr. Zhenfei Zhang (contributed to Falcon proposal); Thomas Pornin (core C code); David Lazar (design and implementation of deterministic mode)
- **PQC Products Mentioned**: PQClean; liboqs; AlgoKit
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Logic Signature; Algorand Virtual Machine (AVM); stateless smart contracts; key generation; address derivation; transaction signing
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; Ed25519; AES-128; AES-192; SHA-2 (implied by SLH-DSA context in general knowledge but text only explicitly names AES and RSA/Ed25519 for comparison); NTRU lattice
- **Key Takeaways**: Algorand has deployed working code and live infrastructure supporting Falcon signatures on mainnet; Falcon offers compact signatures and fast verification suitable for blockchain throughput constraints; Logic Signatures enable stateless authorization for post-quantum accounts without changing the core protocol; Developers can use command-line tools to generate keys, derive addresses, and sign transactions with Falcon; The "harvest now, decrypt later" threat necessitates immediate adoption of post-quantum strategies for long-term asset security
- **Security Levels & Parameters**: NIST Level 5; AES-128 equivalent (Falcon-512); AES-192 equivalent (Falcon-1024); Falcon-1024 signature ~1280 bytes; Falcon-1024 public key ~1793 bytes; Ed25519 signature 64 bytes
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Falcon signatures approximately 10x larger than Ed25519; Falcon-1024 signature ~1280 bytes; Falcon-1024 public key ~1793 bytes; verification typically under 100 microseconds on modern CPUs
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: AVM v12 or higher; Logic Signature feature; command-line tools for key generation and signing; deterministic rounding handling for floating-point operations
- **Relevant PQC Today Features**: Algorithms; Threats; digital-assets; Leaders; migration-program
- **Source Document**: Algorand_PQC_Technical_Brief.html (202,599 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:24:10

---

## Algorand-PQC-Technology

- **Reference ID**: Algorand-PQC-Technology
- **Title**: Algorand’s post-quantum blockchain technology | Algorand
- **Authors**: Algorand
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: Algorand's implementation of FALCON signatures and State Proofs to achieve post-quantum readiness for its blockchain history and future consensus mechanisms.
- **PQC Algorithms Covered**: FALCON, NTRU, ZKB++, XMSS
- **Quantum Threats Addressed**: Shor's algorithm; integer factorization; discrete log problem; derivation of private keys from public key counterparts
- **Migration Timeline Info**: 2016: Google experimenting with post-quantum security; February 2024: Apple announced PQ3 upgrade; November 2024: NIST draft report on transitioning to PQC; 2020: FALCON selected by NIST; 2022: Algorand introduced State Proofs
- **Applicable Regions / Bodies**: Bodies: National Institute of Standards and Technology (NIST); Google; Apple; MIT; T-Hub (India)
- **Leaders Contributions Mentioned**: Dr. Zhenfei Zhang (submitted NTRU and FALCON proposals to NIST); Craig Gentry (former Algorand Foundation research fellow, GPV work); Chris Peikert (Head of Cryptography at Algorand Technologies, GPV work); Vinod Vaikuntanathan (MIT professor, GPV work); Silvio Micali (State Proofs paper author, VRF introduction); Zengpeng Li (ZKB++ method); Maxime Buser (XMSS method)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Blockchain consensus; Merkle tree; Algorand Virtual Machine (AVM); State Proofs
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: Ed25519; SHA-2; SumHash512; elliptic-curve cryptography (ECC); Verified Randomness Function (VRF)
- **Key Takeaways**: Algorand secured its entire chain history in 2022 using FALCON-signed State Proofs; The current VRF consensus mechanism relies on ECC and requires future replacement with a post-quantum alternative; FALCON offers compact key and signature sizes suitable for resource-constrained devices; An experimental AVM opcode for FALCON verification is developed but not yet live on mainnet; Hybrid support for Ed25519 and FALCON is planned to enhance cryptographic framework robustness
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Support for address and signature verifications relying on Ed25519-based systems alongside FALCON cryptography; State Proofs compressing ledger state changes every 256 rounds
- **Performance & Size Considerations**: Compact key and signature sizes for FALCON; compatible with resource-constrained devices like smartphones and IoT security chips; fast signing and verification on classical computers including mobile phones
- **Target Audience**: Developer; Security Architect; Researcher; Policy Maker
- **Implementation Prerequisites**: Consensus mechanism update required to swap current VRF for post-quantum version; AVM opcode integration for FALCON verification (currently experimental)
- **Relevant PQC Today Features**: Threats, Algorithms, Leaders, digital-assets, merkle-tree-certs
- **Source Document**: Algorand_PQC_Technology.html (166,707 bytes, 13,110 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:26:13

---

## Anchorage-Custody-Platform

- **Reference ID**: Anchorage-Custody-Platform
- **Title**: Crypto Custody for Institutions | Anchorage Digital
- **Authors**: Anchorage
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: Anchorage Digital provides a federally chartered crypto custody solution with biometric authentication, quorum authorization, and integrated fiat services for institutional clients.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; Singapore
- **Leaders Contributions Mentioned**: Robert Mitchnick (Head of Digital Assets, BlackRock)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Hardware Security Module
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: SOC 1; SOC 2 Type II
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Institutions can consolidate cash and crypto custody through a single federally chartered bank; Transaction security is enhanced via biometric voice and video approval with quorum validation; Anchorage Digital offers auditable proof of sole control over segregated private keys; The platform supports global operations including fiat on/off ramps in Singapore.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: 90% of transactions process in under 20 minutes
- **Target Audience**: CISO; Security Architect; Compliance Officer; Wealth managers; Asset managers; Government
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: digital-assets; compliance-strategy; vendor-risk
- **Source Document**: Anchorage_Custody_Platform.html (109,622 bytes, 8,753 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:28:10

---

## Anchorage-Porto-Self-Custody

- **Reference ID**: Anchorage-Porto-Self-Custody
- **Title**: Porto | Self-custody wallet for institutions
- **Authors**: Anchorage
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: Porto is an institutional self-custody wallet by Anchorage Digital enabling DeFi interactions with HSM-backed security and quorum approvals.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Brandon Gath (Managing Partner, Triton Capital); Ryan O'Shea (Head of Operations); Jameel Khalfan (Head of Ecosystem); Charles d’Haussy (CEO, dYdX Foundation); Karel Olivier (Co-Founder); Robin Ji (CEO); Alexandre Caffarelli (Head of Finance); Derek Yu (Treasurer); Sam Hassan (Head of Engineering)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Hardware security modules (HSMs); Key Management; Quorum-based approvals
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: FIPS PUB 140-2
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Institutions can engage with DeFi protocols using a self-custody wallet backed by certified tamper-resistant HSMs; The platform eliminates single points of failure like seed phrases through an advanced recovery model; Users can simulate smart contract risks in real-time before transaction execution to prevent blind signing; Quorum approval policies allow organizations to enforce multi-user endorsements for sensitive operations; The solution supports native staking and token interactions across 15+ blockchain networks including Ethereum, Solana, and Aptos.
- **Security Levels & Parameters**: FIPS PUB 140-2 policy
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; CISO; Operations; Compliance Officer; Wealth managers; VC firms; Asset managers
- **Implementation Prerequisites**: User-activated devices for authenticated access; Hardware security modules (HSMs) with custom logic; Quorum approval configuration; Allowlisting of trusted smart contracts and addresses
- **Relevant PQC Today Features**: hsm-pqc, digital-assets, vendor-risk, compliance-strategy, pqc-governance
- **Source Document**: Anchorage_Porto_Self_Custody.html (211,429 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:29:13

---

## Aptos-AIP137-SLH-DSA

- **Reference ID**: Aptos-AIP137-SLH-DSA
- **Title**: AIPs/aips/aip-137.md at main · aptos-foundation/AIPs
- **Authors**: Aptos
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: Proposal to add SLH-DSA-SHA2-128s as the first post-quantum signature scheme for Aptos accounts to conservatively prepare for cryptographically-relevant quantum computers.
- **PQC Algorithms Covered**: SLH-DSA-SHA2-128s, ML-DSA, Falcon
- **Quantum Threats Addressed**: Cryptographically-relevant quantum computers (CRQCs), Shor-breakable cryptography
- **Migration Timeline Info**: Conservative preparation for CRQCs materializing in the next decade or less; timelines range from 5 to 50 years
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Alin Tomescu (author of AIP-137), Scott Aaronson (quoted on quantum computer confidence)
- **PQC Products Mentioned**: slh-dsa crate, aptos-crypto, aptos-ts-sdk, RustCrypto/signatures
- **Protocols Covered**: BIP-32, SLIP-0010
- **Infrastructure Layers**: Key Management, Indexer, Wallets, Full nodes, Validators
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS-205, FIPS-204
- **Classical Algorithms Referenced**: SHA2-256, Ed25519, Secp256k1, Secp256r1, HMAC-SHA512
- **Key Takeaways**: SLH-DSA-SHA2-128s is selected for its conservative security relying solely on SHA2-256; Secret keys must be 48 bytes to include the PK seed component to prevent fund loss; Signature sizes are large at 7,856 bytes but verification is sufficiently fast for Aptos; Alternative schemes like ML-DSA and Falcon offer smaller sizes but rely on less conservative assumptions
- **Security Levels & Parameters**: SLH-DSA-SHA2-128s, SHA2-256, 32-byte public key, 48-byte secret key, 7,856-byte signature
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Signature size 7,856 bytes; Public key size 32 bytes; Secret key size 48 bytes; Verification time ~291-297 µs; Signing time ~285 ms; Verification is 5x slower than Ed25519
- **Target Audience**: Developer, Security Architect, Researcher
- **Implementation Prerequisites**: Upgrade Aptos full nodes and validators; Update Indexer; Implement support in Wallets; Add support to Aptos SDK and CLI; Use slh-dsa crate from RustCrypto/signatures
- **Relevant PQC Today Features**: Algorithms, digital-assets, stateful-signatures, migration-program, pqc-risk-management
- **Source Document**: Aptos_AIP137_SLH_DSA.html (514,459 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:30:47

---

## Avalanche-AIP-QR-001

- **Reference ID**: Avalanche-AIP-QR-001
- **Title**: [ACP Idea] Staged Transition to Quantum-Resistant Cryptography (AIP-QR-001) - Avalanche Ecosystem - Avalanche Forum: Join the Conversation
- **Authors**: Avalanche
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: Proposal for a staged transition to Post-Quantum Cryptography in the Avalanche network using hybrid signatures and EVM precompiles.
- **PQC Algorithms Covered**: Falcon; Dilithium
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Staged migration path with Subnet testing before mainnet enforcement
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Mat (proposer of AIP-QR-001)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: C-Chain Precompiles; Subnet Modularity
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: ECDSA
- **Key Takeaways**: Validators should sign blocks using both classical and PQ-safe keys to prevent single points of failure; EVM precompiled contracts at 0x101 and 0x102 enable efficient native PQC verification; Subnet modularity allows testing of PQ-only environments prior to mainnet enforcement; Gas economics must account for initial benchmarks on signature sizes and CPU validation costs
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid Signature Model; staged migration path; Subnet Modularity for testing
- **Performance & Size Considerations**: Initial benchmarks for signature sizes and CPU validation costs mentioned but no concrete values provided
- **Target Audience**: Developer; Security Architect; Policy Maker
- **Implementation Prerequisites**: Pull Request on Avalanche ACP repository; technical review process
- **Relevant PQC Today Features**: hybrid-crypto; migration-program; digital-assets; algorithms; crypto-agility
- **Source Document**: Avalanche_AIP_QR_001.html (24,901 bytes, 2,159 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:32:47

---

## BitGo-Multisig-vs-MPC

- **Reference ID**: BitGo-Multisig-vs-MPC
- **Title**: BitGo Wallet Types
- **Authors**: BitGo
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: Overview of BitGo wallet types, signature schemes (Multisignature and MPC), key management structures, and transaction flows for digital asset custody.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management; Offline Vault Console; Secure Subnet
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: HMAC; Shamir's Secret Sharing
- **Key Takeaways**: BitGo offers Multisignature and MPC wallet types utilizing a 2-of-3 key scheme for transaction signing; Custody wallets are the most secure but have a 24-hour SLA for withdrawals due to video ID verification requirements; Self-custody multisignature cold wallets provide the highest level of control and privacy by requiring user signatures in an offline vault; MPC uses off-chain cryptography with threshold signature schemes where private keys are never fully created or exposed; Go Accounts function as omnibus custody wallets leveraging an off-chain ledger for faster multi-asset settlements.
- **Security Levels & Parameters**: 2-of-3 key scheme; Key sharding up to 99 times
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Custody wallet withdrawal SLA within 24 hours; Go Account withdrawals typically complete within a few hours; MPC can have lower transaction costs by broadcasting a single combined signature.
- **Target Audience**: Developer; Security Architect; Operations
- **Implementation Prerequisites**: BitGo Offline Vault Console (OVC); Video ID verification for custody wallets; Secure subnet for Advanced Wallets
- **Relevant PQC Today Features**: digital-assets, key-management, hsm-pqc
- **Source Document**: BitGo_Multisig_vs_MPC.html (367,569 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:35:53

---

## BitGo-TSS

- **Reference ID**: BitGo-TSS
- **Title**: Introducing BitGo TSS: More coins, lower fees, outstanding security | BitGoYouTubeXLinkedInFacebook
- **Authors**: BitGo
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: BitGo introduces Threshold Signature Scheme (TSS) to expand coin support, lower transaction fees, and maintain 2-of-3 security models for digital asset custody.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: Office of the Comptroller of the Currency (OCC)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management; Hardware Security Modules (HSMs); Cold Storage; Hot Wallets
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: TSS enables faster support for new coins without smart contracts; TSS reduces blockchain transaction fees for supported assets; BitGo maintains a 2-of-3 security model to protect against theft and loss; TSS shards wallet keys into multiple parts distributed across locations; BitGo uses purpose-built HSMs and open-sourced code for enhanced security
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, CISO, Developer, Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: digital-assets; hsm-pqc; kms-pqc
- **Source Document**: BitGo_TSS.html (146,079 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:37:20

---

## Cardano-PQC-Research

- **Reference ID**: Cardano-PQC-Research
- **Title**: Research - Input | Output
- **Authors**: Cardano
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: Input Output Research (IOR) is a division of Input Output Group dedicated to foundational and applied research in cryptography, distributed systems, and formal methods for the Cardano and Midnight ecosystems.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Marc Roeschlin, Evangelos Markakis, Raghav Bhaskar, Prof Aggelos Kiayias (Incentivizing Geographic Diversity); Tarun Chitra, Paolo Penna, Manvir Schneider (On Sybil-proofness in Restaking Networks); Evangelos Kolyvas, Alexandros Antonov, Spyros Voulgaris (SCRamble); David Huang, Edwin Lock, Francisco Marmolejo-Cossio, David C. Parkes (Accelerated Preference Elicitation with LLM-Based Proxies); Charles Hoskinson (Decentralization challenges)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Ouroboros; Ouroboros Peras; Ouroboros Leios
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: IOR utilizes an evidence-based methodology rooted in peer-reviewed science and formal specification; The organization employs a Software Readiness Levels (SRL) framework to guide projects from conceptual modeling to implementation; Research focuses on the full stack of blockchain development including cryptography, consensus, and economic design; Collaboration with the Venture Studio ensures strategic implementation and productization of foundational research findings
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Researcher; Security Architect; Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms, Leaders, digital-assets
- **Source Document**: Cardano_PQC_Research.html (281,392 bytes, 5,891 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:38:37

---

## Coinbase-Institutional

- **Reference ID**: Coinbase-Institutional
- **Title**: Coinbase Institutional
- **Authors**: Coinbase
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: The document describes Coinbase Institutional's suite of services including trading, custody, and crypto-as-a-service for institutional clients.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; United Kingdom; New York State Department of Financial Services; U.S. Securities and Exchange Commission; U.S. Commodity Futures Trading Commission; Financial Services and Markets Act 2000
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Coinbase Institutional offers prime brokerage, custody, and trading services for digital assets; The platform supports over 275 assets for trading and 470+ for custody; Services are licensed by the New York State Department of Financial Services; UK communications are restricted to investment professionals under the Financial Services and Markets Act 2000; The company reports $300B in assets under custody and $236B quarterly institutional trading volume
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Institutional Investors, Hedge Funds, Banks, Brokerages, Asset Managers, Corporates, Financial Institutions
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: digital-assets
- **Source Document**: Coinbase_Institutional.html (355,270 bytes, 8,963 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:41:27

---

## Coinbase-Prime-Custody

- **Reference ID**: Coinbase-Prime-Custody
- **Title**: Coinbase Prime: Institutional Crypto Prime Brokerage
- **Authors**: Coinbase
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: The document describes Coinbase Prime as an institutional crypto prime brokerage offering unified execution, financing, custody, and staking services.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: New York State Department of Financial Services, CFTC, National Futures Association, EU member states
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key management
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: SOC 1 Type II, SOC 2 Type II, MiCA Regulation
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Coinbase Prime unifies execution, financing, custody, and staking in a single operating system; The platform is regulated as a Qualified Custodian under NYDFS law; Institutions can access global liquidity through aggregated spot and derivatives markets; Operational leverage reduces complexity by managing pre-funding, settlement, and key management end-to-end
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: 13+ Years operating; 12% Of global crypto market cap under custody; 275+ Tradeable assets; 40 Futures contracts; 90+ Assets available for financing and cross-margining
- **Target Audience**: Institutional investors, Banks & Brokerages, Payment Firms, Startups, Security Architect, Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: digital-assets, compliance-strategy, vendor-risk
- **Source Document**: Coinbase_Prime_Custody.html (334,915 bytes, 9,453 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:42:35

---

## Copper-Digital-Asset-Custody

- **Reference ID**: Copper-Digital-Asset-Custody
- **Title**: Copper Digital Asset Custody
- **Authors**: Copper
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: Copper provides an institutional-grade digital asset custody solution using MPC technology with a three-entity shard architecture and policy-based controls.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Switzerland; Lloyd's of London
- **Leaders Contributions Mentioned**: Alan Howard (Co-Founder, Brevan Howard); Hany Rashwan (Co-Founder and CEO at 21Shares); Eric Chen (CEO at Injective Protocol)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: MPC technology; Policy Engine; Segregated vaults; Cold, warm, and hot vaults
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Copper uses a three-entity shard model (Client, Copper, Trusted Third Party) to eliminate single points of failure; No private key is ever generated or assembled for transaction signing; A two-out-of-three consensus is mandated for signing asset transfers; The Policy Engine allows granular role-based control and flexible approval workflows; Copper holds $500M specie market-based insurance placed in the Lloyd's of London market.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Supports 60+ networks and 600+ digital assets; Cold vault transactions executed in minutes; 24/7/365 client services availability.
- **Target Audience**: Institutional investors; Hedge funds; Trading firms; Foundations; Exchanges; ETP Providers; Venture capital funds; Miners
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: digital-assets, vendor-risk, pqc-governance
- **Source Document**: Copper_Digital_Asset_Custody.html (131,521 bytes, 6,583 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:43:47

---

## Cosmos-PQC-DoraFactory

- **Reference ID**: Cosmos-PQC-DoraFactory
- **Title**: GitHub - DoraFactory/pqc-cosmos: A Quantum-Safe Cosmos Appchain
- **Authors**: Cosmos
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: A GitHub repository outlining a hackathon bounty project to replace existing signature algorithms in Tendermint and Cosmos-SDK with Dilithium to create a post-quantum Cosmos appchain.
- **PQC Algorithms Covered**: Dilithium
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: tendermint-pqc; cosmos-sdk-pqc; cosmos-app-pqc; tm-bench
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: Ed25519; elliptic curve cryptography
- **Key Takeaways**: Replace existing signature algorithms in Tendermint and Cosmos-SDK with Dilithium to achieve quantum resistance; Benchmark performance metrics including key generation time, signature size, and transaction throughput against classical algorithms; Develop a viable post-quantum migration plan for all non-quantum-resistant CosmosSDK chains; Integrate modified consensus and SDK components into a fully functioning appchain supporting transfers, staking, and governance.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Benchmark dimensions include key generation time, signature size in bytes, public key size in bytes, signature generation speed in ops/sec, signature verification speed in ops/sec, transaction latency, and TPS performance.
- **Target Audience**: Developer; Researcher
- **Implementation Prerequisites**: CosmosSDK version v0.47.15; Prometheus + Grafana for monitoring; multiple nodes with identical hardware configuration; custom stress testing scripts or tm-bench.
- **Relevant PQC Today Features**: Algorithms; Migrate; digital-assets; code-signing; migration-program
- **Source Document**: Cosmos_PQC_DoraFactory.html (287,517 bytes, 11,133 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:45:00

---

## DFNS-HSM-Integration

- **Reference ID**: DFNS-HSM-Integration
- **Title**: Dfns - Introducing HSMs
- **Authors**: DFNS
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: Dfns launches an HSM Service enabling clients to use their own FIPS-certified Hardware Security Modules, starting with IBM Crypto Express, for compliant digital asset key management.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Turkey; United Arab Emirates; Singapore; Hong Kong; South Korea
- **Leaders Contributions Mentioned**: Thibault de Lachèze-Murel (Chief Information Security Officer); Nikita Sorokovikov (Senior Cryptography Engineer, author of minifrost); Thibaud Genty (Senior Rust Software Engineer)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: PKCS#11
- **Infrastructure Layers**: HSM; Key Management; Cloud KMS; Offline Signing Orchestrator; Hyper Protect Virtual Servers
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS 140-2; FIPS 140-3
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Dfns is evolving from a preconfigured MPC stack to an orchestration platform supporting HSM, TEE, and hybrid models; Native support for IBM Crypto Express allows institutions to use existing mainframe HSMs for blockchain operations without reengineering; The service bridges HSMs to blockchain workflows via the PKCS#11 standard interface to solve vendor-specific SDK fragmentation; Regulatory requirements in countries like Turkey, UAE, Singapore, Hong Kong, and South Korea drive the need for local HSM-based key storage; Future integrations include Offline Signing Orchestrator for air-gapped environments and Hyper Protect Virtual Servers for secure cloud-native runtimes.
- **Security Levels & Parameters**: FIPS 140-2 Level 4
- **Hybrid & Transition Approaches**: Hybrid custody systems combining MPC, HSM, TEE, or any mix; Unified governance across MPC and HSM infrastructure; Asset-specific infrastructure optimization using OSO for air-gapped assets and HPVS for automated orchestration.
- **Performance & Size Considerations**: Up to 85 logical partitions per adapter on IBM Crypto Express models A01/LA1; Deployment in days instead of months due to prebuilt connectors.
- **Target Audience**: CISO; Security Architect; Compliance Officer; Developer; Operations
- **Implementation Prerequisites**: FIPS-certified HSM supporting PKCS#11 standard; IBM Z or LinuxONE mainframe for native Crypto Express support; Existing Dfns wallet infrastructure registration.
- **Relevant PQC Today Features**: hsm-pqc, digital-assets, compliance-strategy, crypto-agility, migration-program
- **Source Document**: DFNS_HSM_Integration.html (335,950 bytes, 13,347 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:46:22

---

## DFNS-Key-Orchestration

- **Reference ID**: DFNS-Key-Orchestration
- **Title**: Dfns — Key Orchestration Service (KOS)
- **Authors**: DFNS
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: Dfns Key Orchestration Service (KOS) provides flexible, composable key management using MPC and HSM integrations for digital asset platforms across cloud, hybrid, and on-premises environments.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: PKCS#11; TSS; MPC
- **Infrastructure Layers**: HSM; Cloud KMS; On-Premises; Private Cloud; Enclaves (AWS Nitro, IBM OSO, Thales CC); LinuxONE; IBM Z
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: FIPS; DORA; CLOUD Act
- **Classical Algorithms Referenced**: ECDSA; EdDSA; STARK; Schnorr; BIP; SLIP
- **Key Takeaways**: Organizations can deploy keys in SaaS, hybrid, or on-premises models to retain autonomy; MPC cryptography removes single points of failure by distributing key shares across data centers; The platform supports integration with existing enterprise hardware like HSMs and secure enclaves; Dynamic signer configurations allow scaling from 2 to hundreds of signers for threshold signing; Disaster recovery workflows can be customized by criticality level and integrated with external providers.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid (Cloud) deployment splitting control between customer infrastructure and Dfns managed cloud; Modular deployment allowing SaaS, hybrid, or on-prem options; Unified platform enabling switching between environments or providers.
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Compliance Officer; CISO
- **Implementation Prerequisites**: PKCS#11-compatible HSM devices; Existing IT and banking systems supporting blockchains; Integration with core banking platforms (Temenos, Fiserv, FIS, Sopra Steria); KYT/AML solutions (Elliptic, Chainalysis, Scorechain)
- **Relevant PQC Today Features**: digital-assets; kms-pqc; hsm-pqc; crypto-agility; compliance-strategy
- **Source Document**: DFNS_Key_Orchestration.html (340,610 bytes, 6,392 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:48:08

---

## Draft-for-Public-Consultation-Quantum-Readiness-Index-Oct-2025

- **Reference ID**: Draft-for-Public-Consultation-Quantum-Readiness-Index-Oct-2025
- **Title**: Draft for Public Consultation Quantum Readiness Index (Oct 2025)
- **Authors**: Draft for Public Consultation
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Draft
- **Main Topic**: A draft self-assessment framework called the Quantum Readiness Index (QRI) developed by the Cyber Security Agency of Singapore to help organizations evaluate and prioritize their quantum-safe migration readiness.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest now, decrypt later (HN-DL); Cryptographically Relevant Quantum Computer (CRQC); forgery of digital signatures; compromised confidentiality; undermined integrity and authenticity
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Singapore; Bodies: Cyber Security Agency of Singapore; World Economic Forum; Information Systems Audit and Control Association (ISACA)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Capability Maturity Model Integration (CMMI)
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations should use the QRI to self-assess their preparedness against quantum-enabled threats; Preparation must begin now with "no-regrets" steps despite uncertainty about the exact timeline for Q-day; The QRI facilitates conversations with organizational leaders and the Board to seek buy-in for quantum-safe migration; Organizations should contextualize international guidance to their current state of readiness rather than rushing ahead indiscriminately; Readiness levels are adapted from CMMI to help identify recommended next steps for improving security posture
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Chief Information Officers; Chief Information Security Officers; Chief Data Officers; Chief Technology Officers; Chief Risk Officers; Other senior leaders responsible for leading quantum-safe migration
- **Implementation Prerequisites**: Quantum-Safe Handbook; organizational inventory of crown jewels and critical business functions; development of a quantum security migration action plan
- **Relevant PQC Today Features**: Assess; Threats; Migrate; pqc-governance; vendor-risk
- **Source Document**: Draft for Public Consultation - Quantum Readiness Index (Oct 2025).pdf (836,364 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:49:29

---

## Ethereum-PQC-Roadmap-2026

- **Reference ID**: Ethereum-PQC-Roadmap-2026
- **Title**: Ethereum roadmap | ethereum.org
- **Authors**: Ethereum
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: The document outlines Ethereum's development roadmap detailing upgrades from Paris to Glamsterdam aimed at improving scalability, security, and sustainability.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Ethereum roadmap includes upgrades to reduce rollup transaction costs via blob transactions; Future upgrades will enhance smart contract wallet functionality and staking flexibility; Network improvements aim to increase data availability and gas limits for better scalability; The development process is community-driven with proposals maturing into Ethereum Improvement Proposals.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Transaction gas limit cap of 16.7M gas per transaction; Default gas limit increase to ~60M from current 45M; Blob count increased from 3 to 6 targets with a maximum of 9.
- **Target Audience**: Developer, Researcher, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline
- **Source Document**: Ethereum_PQC_Roadmap_2026.html (595,139 bytes, 7,783 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:51:03

---

## Final-technical-report-on-migration-to-PQC-28-03-25

- **Reference ID**: Final-technical-report-on-migration-to-PQC-28-03-25
- **Title**: Final Technical Report on Migration to PQC 28 03 25
- **Authors**: Final technical report on migration to PQC 28
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: Technical report by India's Telecommunication Engineering Centre outlining the migration plan to Post-Quantum Cryptography to address threats from quantum computers.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Cryptographically relevant quantum computers; Shor algorithm; Grover algorithm; Man-in-the-Middle Attacks; Individual Attacks; Threat to Digital Signatures; Data Breaches; Document Integrity compromise
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: India; Telecommunication Engineering Centre; Department of Telecommunications; Ministry of Communications; Government of India
- **Leaders Contributions Mentioned**: Ms. Tripti Saxena (Sr DDG & Head, TEC); Sh. Kamal Kr Agarwal (DDG QT, TEC); Dr. Goutam Paul (ISI Kolkata); Dr. Swagata Mandal (Jalpaiguri Government Engineering College); Dr. Sucheta Chakrabarti (Former Scientist-G, SAG, DRDO); Dr. Angshuman Karmakar (IIT Kanpur); Sh. Vinayaka Pandit (IBM); Sh. Bhupendra Singh (CAIR, DRDO); Sh. B. Srinivas Goud (NCIIPC); Dr. Shravani Shahapure (M/s Deloitte); Sh. Rakesh Singh Rawat (C-DoT); Dr. Roopika Chaudhary (DIT & CS, DRDO); Dr. Mahavir Jhawar (Ashoka University); Sh. Venkata Rama Raju Chelle (Director QT, TEC); Sh. Rakesh Goyal (ADG, TEC)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Digital infrastructure; Application Cryptography; Infrastructure Cryptography; Trust management
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: ISO 9001:2015
- **Classical Algorithms Referenced**: RSA; ECDSA; ECDH
- **Key Takeaways**: Organizations must identify critical digital infrastructure and data vulnerable to quantum attacks before deployment of cryptographically relevant quantum computers; Immediate transition to Post-Quantum Cryptography is required as current standards like RSA and ECDSA will be broken by Shor and Grover algorithms; Migration plans should include hybrid solutions for trust management and isolation approaches during the transition phase; Stakeholders must conduct risk assessments and align with OEM/Vendor roadmaps to ensure crypto-agility
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid Solution approach; Trust management during migration; Isolation approaches during migration; Crypto-agility
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Policy Maker; Government Organizations; Industry and Enterprises
- **Implementation Prerequisites**: Conduct a Risk Assessment; Define Post Quantum Requirements; Evaluate the Vendor's Roadmap; Request Proof of Concept (PoC) or Pilots; Test and Validate the Implementation
- **Relevant PQC Today Features**: Threats, Migrate, Assess, crypto-agility, hybrid-crypto, vendor-risk, pqc-risk-management, migration-program
- **Source Document**: Final%20technical%20report%20on%20migration%20to%20PQC%2028-03-25.pdf (1,823,919 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:52:05

---

## Fireblocks-MPC-CMP

- **Reference ID**: Fireblocks-MPC-CMP
- **Title**: What Is MPC (Multi-Party Computation)? - MPC 101 - Fireblocks
- **Authors**: Fireblocks
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: An educational overview of Multi-Party Computation (MPC) explaining its history, mechanics, and role in securing digital asset private keys against single points of compromise.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Andrew Yao (adapted two-party computation to any feasible computation); Goldreich, Micali, and Wigderson (adapted two-party case to multi-party); Ran Canetti (pioneered universal composability)
- **PQC Products Mentioned**: Fireblocks Wallets-as-a-Service; Fireblocks Embedded Wallets; MPC-CMP
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management; HSM; Cold Storage; Hot Storage; Hardware Wallet
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: Caesar cipher
- **Key Takeaways**: MPC enables multiple parties to compute functions on private data without revealing the underlying secrets; Traditional storage methods like cold and hot wallets suffer from operational inefficiencies or security vulnerabilities such as single points of compromise; MPC eliminates the risk of a single point of failure by keeping private keys in a fully liquid, decentralized form across multiple shares; The technology has evolved from theoretical concepts in the 1980s to becoming a standard for institutional digital asset security.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Cold storage transfers often take between 24 to 48 hours; MPC-CMP is described as a 1-round algorithm
- **Target Audience**: Developer; Security Architect; CISO; Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: digital-assets; pqc-101; hsm-pqc; kms-pqc
- **Source Document**: Fireblocks_MPC_CMP.html (497,523 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:54:06

---

## Fireblocks-MPC-CMP-Whitepaper

- **Reference ID**: Fireblocks-MPC-CMP-Whitepaper
- **Title**: Introducing MPC-CMP - 8X Faster MPC Wallet Signing - Fireblocks
- **Authors**: Fireblocks
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: Fireblocks introduces MPC-CMP, a new open-source Multi-Party Computation protocol that accelerates digital asset transaction signing speeds by up to 800% compared to industry standards.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Prof. Ran Canetti of Boston University; Nikolaos Makriyannis; Udi Peled
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: MPC-CMP; MPC-GG18
- **Infrastructure Layers**: Key Management; Cold Storage; Hot Wallets; Air-gapped devices
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: MPC-CMP reduces transaction signing rounds from up to 9 to just 1 round; The protocol supports fully air-gapped signing for cold storage compliance; Fireblocks is releasing the algorithm as open and free-to-use without patent application; MPC-CMP offers universally composable (UC) security properties out-of-the-box
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: 8X faster signing speed; 800% faster than previous protocols; 1 round to sign a transaction vs 9 rounds for GG18; 8 rounds for Lindell et al.; 6 rounds for Doerner et al.
- **Target Audience**: Security Architect; Developer; CISO; Compliance Officer; Financial Institutions
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: digital-assets; Leaders; Algorithms
- **Source Document**: Fireblocks_MPC_CMP_Whitepaper.html (482,278 bytes, 9,203 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:55:36

---

## Fireblocks-Open-Source-MPC

- **Reference ID**: Fireblocks-Open-Source-MPC
- **Title**: Fireblocks’ MPC-CMP code is Open-Source
- **Authors**: Fireblocks
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: Fireblocks has open-sourced its MPC-CMP code and MPC library to enhance transparency and security in digital asset key management.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Daniel Evans (Marketing)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: MPC-CMP
- **Infrastructure Layers**: Key Management; Trusted Execution Environment; Intel SGX; AWS Nitro
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: ECDSA; EdDSA
- **Key Takeaways**: Fireblocks open-sourced MPC-CMP code to increase transparency for clients and auditors; The protocol supports signing transactions on any ECDSA and EdDSA blockchain; Implementation is optimized for Intel SGX and AWS Nitro enclaves; An active bug bounty program exists on HackerOne for continuous improvement.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect; CISO
- **Implementation Prerequisites**: Intel SGX; AWS Nitro
- **Relevant PQC Today Features**: digital-assets; code-signing; api-security-jwt
- **Source Document**: Fireblocks_Open_Source_MPC.html (481,091 bytes, 6,800 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:56:48

---

## Galileo-FT-Platform

- **Reference ID**: Galileo-FT-Platform
- **Title**: Galileo Financial Technology Platform | Banking, Fintech, APIs
- **Authors**: Galileo
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: Galileo provides a cloud-native financial technology platform offering APIs, card issuing, payment processing, and risk management solutions for banks and fintechs.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Galileo offers a regulation-ready platform for building modern financial products; The platform supports digital issuance, payments, lending, and risk management solutions; Cyberbank enables digital banking transformation in as little as three months; The solution is designed to be secure and compliant from the ground up with open APIs.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect, CISO, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: api-security-jwt, digital-assets, compliance-strategy
- **Source Document**: Galileo_FT_Platform.html (162,696 bytes, 4,056 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:57:46

---

## HKMA-Fintech-Adoption-Report-2025

- **Reference ID**: HKMA-Fintech-Adoption-Report-2025
- **Title**: HKMA Fintech Adoption Report 2025
- **Authors**: HKMA
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: The Hong Kong Monetary Authority's 2025 report on Fintech adoption progress, maturity assessments, and future strategic directions for the banking sector in Hong Kong.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Hong Kong; Bodies: Hong Kong Monetary Authority (HKMA), Securities and Futures Commission (SFC), Insurance Authority (IA), Mandatory Provident Fund Schemes Authority, Fintech Association of Hong Kong, Cyberport, Hong Kong Science and Technology Park (HKSTP), Qianhai Authority
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Regtech adoption reached 97% in 2025, indicating near-universal penetration for risk management automation; A.I. and DLT adoption grew significantly to 75% and 45% respectively, moving from exploratory phases to operational implementation; Implementation costs, novel technology risks, and integration challenges remain the top barriers cited by 75%, 73%, and 71% of respondents; Cross-sector collaboration and robust data excellence foundations are critical enablers for achieving maturity in sophisticated technologies; High-Performance Computing remains in exploratory phases with only 23% of institutions actively piloting solutions.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, CISO, Security Architect, Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: pqc-risk-management, migration-program, compliance-strategy
- **Source Document**: HKMA_Fintech_Adoption_Report_2025.pdf (1,494,038 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T16:58:37

---

## Hex-Trust-Custody

- **Reference ID**: Hex-Trust-Custody
- **Title**: Hex Trust | The Leader in Digital Asset Solutions
- **Authors**: Hex
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: Hex Trust provides regulated institutional digital asset custody, staking, and markets services across multiple jurisdictions.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Dubai, UAE; Hong Kong; Singapore; Italy; France
- **Leaders Contributions Mentioned**: Yishay Harel (CEO of Dymension); Yat Siu (Chairman and Co-founder of Animoca Brands); Mance Harmon (CEO and Co-Founder, Hedera Hashgraph); Sean Lee (CEO of the Algorand Foundation); Stani Kulechov (CEO of Aave); Jehan Chu (Founder and Managing Partner of Kenetic)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: KYC; AML; CTF
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Hex Trust offers fully regulated institutional digital asset services including custody and staking; The platform supports extensive blockchain assets and protocols with enterprise-grade security; Clients include major foundations and financial institutions requiring compliant digital asset management; Services are licensed across key jurisdictions including Dubai, Hong Kong, Singapore, Italy, and France
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Financial Institutions; High Net Worth Individuals; Protocols & Foundations; CISO; Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: digital-assets; compliance-strategy; vendor-risk
- **Source Document**: Hex_Trust_Custody.html (92,233 bytes, 7,481 extracted chars)
- **Extraction Timestamp**: 2026-03-31T17:00:08

---

## Hyperledger-Besu-Overview

- **Reference ID**: Hyperledger-Besu-Overview
- **Title**: Welcome | Besu documentation
- **Authors**: Hyperledger
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: Besu is an open source Ethereum client written in Java that supports public and private networks with a command line interface and JSON-RPC API.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Besu is an open source Ethereum client written in Java; The client does not support internal key management and requires Web3Signer for signing transactions; Besu supports public networks like Mainnet and testnets as well as private enterprise networks; Development tools such as Hardhat, Remix, and web3j are supported for smart contract use cases.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect, Operations
- **Implementation Prerequisites**: Java; Web3Signer for key management and transaction signing
- **Relevant PQC Today Features**: digital-assets, api-security-jwt
- **Source Document**: Hyperledger_Besu_Overview.html (16,367 bytes, 1,572 extracted chars)
- **Extraction Timestamp**: 2026-03-31T17:01:16

---

## Hyperledger-Fabric-Crypto

- **Reference ID**: Hyperledger-Fabric-Crypto
- **Title**: Identity — Hyperledger Fabric Docs main documentation
- **Authors**: Hyperledger
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: The document explains Hyperledger Fabric's identity model, detailing how X.509 digital certificates, PKIs, and Membership Service Providers (MSPs) define trusted actors and permissions within a blockchain network.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509; HTTPS
- **Infrastructure Layers**: PKI; Certificate Authorities; Membership Service Provider (MSP); Fabric CA
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Digital identities in Hyperledger Fabric are encapsulated in X.509 certificates and determine actor permissions; Membership Service Providers (MSPs) define the rules for valid identities within an organization; Certificate Authorities issue verifiable identities while CRLs manage revoked certificates; A chain of trust is established through Root CAs and Intermediate CAs to scale certificate issuance securely; Fabric CA provides a built-in private root CA component for managing digital identities in blockchain networks.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect; Operations
- **Implementation Prerequisites**: X.509 standard compliance; Certificate Authority (CA) setup; Membership Service Provider (MSP) configuration; Fabric CA component for identity management
- **Relevant PQC Today Features**: pki-workshop; digital-id; tls-basics
- **Source Document**: Hyperledger_Fabric_Crypto.html (28,986 bytes, 14,859 extracted chars)
- **Extraction Timestamp**: 2026-03-31T17:02:05

---

## IETF-ML-KEM-for-TLS-1.3

- **Reference ID**: IETF-ML-KEM-for-TLS-1.3
- **Title**: draft-ietf-tls-mlkem-07 - ML-KEM Post-Quantum Key Agreement for TLS 1.3
- **Authors**: IETF
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: This document defines ML-KEM-512, ML-KEM-768, and ML-KEM-1024 as NamedGroups for standalone post-quantum key establishment in TLS 1.3.
- **PQC Algorithms Covered**: ML-KEM-512; ML-KEM-768; ML-KEM-1024
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Deirdre Connolly
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.3
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: IETF; NIST
- **Compliance Frameworks Referenced**: FIPS 203; BCP 78; BCP 79; BCP 14
- **Classical Algorithms Referenced**: ECDH
- **Key Takeaways**: Standalone ML-KEM key establishment is defined for TLS 1.3 without hybrid construction; Implementations must perform encapsulation key checks and abort on failure; Key reuse is permitted within bounds but forward secrecy recommends avoiding it; Randomness in ciphertext generation must not be reused; ML-KEM satisfies IND-CCA security in the random oracle model
- **Security Levels & Parameters**: ML-KEM-512; ML-KEM-768; ML-KEM-1024
- **Hybrid & Transition Approaches**: Standalone key establishment; Hybrid mechanisms supported generically via external references
- **Performance & Size Considerations**: ML-KEM-512 encapsulation keys 800 bytes; ML-KEM-512 ciphertext 768 bytes; ML-KEM-768 encapsulation keys 1184 bytes; ML-KEM-768 ciphertext 1088 bytes; ML-KEM-1024 encapsulation keys 1568 bytes; ML-KEM-1024 ciphertext 1568 bytes; Shared secrets 32 bytes for all parameter sets
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: Conformance to FIPS 203; Support for TLS 1.3 NamedGroups; Implementation of encapsulation key check per Section 7.2 of FIPS 203; Ciphertext length validation
- **Relevant PQC Today Features**: tls-basics; Algorithms; hybrid-crypto; crypto-agility
- **Source Document**: IETF_ML-KEM_for_TLS_1.3.html (62,010 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T17:03:30

---

## IOTA-Tangle-Signatures

- **Reference ID**: IOTA-Tangle-Signatures
- **Title**: Assuring Authenticity in the Tangle with Signatures
- **Authors**: IOTA
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: The document explains the use of hash-based Winternitz one-time signatures in IOTA to ensure transaction authenticity and resist quantum attacks like Shor's algorithm.
- **PQC Algorithms Covered**: Winternitz one-time signature scheme; hash-based signatures
- **Quantum Threats Addressed**: Shor's algorithm
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Hash-based signatures are viewed as resistant to quantum attacks like Shor's algorithm; IOTA addresses must not be debited more than once due to the one-time signature limitation; Message normalization prevents attackers from deriving valid signatures for modified messages by reversing hash functions; Reusable address proposals are being considered to overcome the one-time signature constraint.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Signatures result in rather long sizes; Hash function applied 27 times per tryte for public key generation; Message values normalized to sum of 26.
- **Target Audience**: Developer; Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms; Threats; stateful-signatures; digital-assets
- **Source Document**: IOTA_Tangle_Signatures.html (45,453 bytes, 7,165 extracted chars)
- **Extraction Timestamp**: 2026-03-31T17:05:26

---

## Komainu-Custody

- **Reference ID**: Komainu-Custody
- **Title**: Institutional Gateway to the Digital Asset Market | Komainu
- **Authors**: Komainu
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: Komainu provides institutional-grade digital asset custody, staking, and trading services through bank-grade infrastructure and regulated entities.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Cameron Coller (Security Engineer); Darren Jordan (Chief Commercial Officer); Paul Frost-Smith (Co-CEO)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: HSM; MPC wallet technology
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Komainu offers custody-first infrastructure enabling trading, borrowing, lending, and staking while assets remain in custody; Services utilize state-of-the-art MPC and HSM wallet technology integrated into client workflows; Security is built on zero-trust architecture with continuous monitoring to safeguard against cyber threats and insider risks; The firm operates through multiple regulated entities prioritizing security, compliance, and governance.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Compliance Officer; Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: digital-assets; hsm-pqc; vendor-risk; pqc-governance
- **Source Document**: Komainu_Custody.html (159,186 bytes, 5,002 extracted chars)
- **Extraction Timestamp**: 2026-03-31T17:06:33

---

## Ledger-Enterprise-MPC-Readiness

- **Reference ID**: Ledger-Enterprise-MPC-Readiness
- **Title**: Is MPC truly ready for digital asset custody? | Ledger
- **Authors**: Ledger
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: The document evaluates the current maturity of Multi-party Computation (MPC) for digital asset custody, concluding that MPC-only solutions are not yet ready for production due to security, performance, and governance limitations.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Jonathan Katz presented a keynote talk on vulnerabilities in MPC implementation of fixed-key AES; Koblitz and Menezes highlighted issues with security proofs passing peer review but later being found false.
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: BIP-32, Threshold Signature Schemes (TSS)
- **Infrastructure Layers**: Key Management, HSM, Secure Enclaves, Hardware Wallets
- **Standardization Bodies**: CSRC NIST
- **Compliance Frameworks Referenced**: Common Criteria, FIPS, CSPN
- **Classical Algorithms Referenced**: AES, DSA, ECDSA
- **Key Takeaways**: MPC-only solutions are not mature enough for production deployment due to lack of extensive security testing; Complex governance schemes and key lifecycle management remain out of reach for current MPC implementations; Secure hardware with true random number generators is required for key generation to ensure sufficient entropy; MPC should be used cautiously as a complementary tool rather than a unique security infrastructure.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Combining MPC with secure execution environments, hardened servers, HSMs, or secure enclaves to address governance and key lifecycle limitations.
- **Performance & Size Considerations**: Exponential complexity of existing algorithms makes complex calculations longer; "m of n" quorums become practically impossible as the number of signers increases; MPC version of BIP-32 becomes unworkable with more than 2 signers due to computational complexity.
- **Target Audience**: Security Architect, CISO, Compliance Officer, Developer
- **Implementation Prerequisites**: Certified secure hardware using true random number generators; Secure execution environment for governance rules; Trusted display for transaction verification.
- **Relevant PQC Today Features**: digital-assets, hsm-pqc, pqc-risk-management, entropy-randomness
- **Source Document**: Ledger_Enterprise_MPC_Readiness.html (205,806 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-31T17:07:36

---

## P2025062700238

- **Reference ID**: P2025062700238
- **Title**: Protection of Critical Infrastructures (Computer Systems) Ordinance to come into effect on January 1, 2026
- **Authors**: P2025062700238.html
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Published
- **Main Topic**: The Protection of Critical Infrastructures (Computer Systems) Ordinance (Cap. 653) will come into operation on January 1, 2026, imposing statutory obligations on designated operators to protect computer systems from cyberattacks.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Ordinance comes into effect on January 1, 2026; Gazette notice published June 27, 2025; Ordinance gazetted March 28, 2025.
- **Applicable Regions / Bodies**: Regions: Hong Kong; Bodies: Secretary for Security, Legislative Council, The Government.
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Protection of Critical Infrastructures (Computer Systems) Ordinance (Cap. 653).
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Designated operators must adopt appropriate measures to protect computer systems; The Ordinance aims to minimize risks of essential service disruption due to cyberattacks; The Ordinance will be tabled at the Legislative Council for negative vetting on July 2, 2025.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer, Policy Maker, Operations
- **Implementation Prerequisites**: Adoption of appropriate measures to protect computer systems; Compliance with statutory obligations under Cap. 653.
- **Relevant PQC Today Features**: Compliance, Migration-program, pqc-governance, critical-infrastructure
- **Source Document**: P2025062700238.html (13,079 bytes, 1,587 extracted chars)
- **Extraction Timestamp**: 2026-03-31T17:09:12

---
