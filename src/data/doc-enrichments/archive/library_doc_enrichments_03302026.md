---
enrichment_method: ollama-qwen3.5:27b
generated: 2026-03-30
---

## CIRCL-Cloudflare

- **Reference ID**: CIRCL-Cloudflare
- **Title**: CIRCL: Cloudflare Interoperable Reusable Cryptographic Library
- **Authors**: Cloudflare
- **Publication Date**: 2019-06-01
- **Last Updated**: 2026-03-01
- **Document Status**: Active
- **Main Topic**: CIRCL is a Go library implementing Post-Quantum and Elliptic Curve cryptographic primitives for experimental deployment.
- **PQC Algorithms Covered**: ML-KEM, X-Wing, Kyber KEM, FrodoKEM, CSIDH, SIDH/SIKE, Dilithium, ML-DSA, SLH-DSA
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Armando Faz-Hernandez; Kris Kwiatkowski
- **PQC Products Mentioned**: CIRCL
- **Protocols Covered**: HPKE, VOPRF, Prio3, X25519, X448, Ed25519, Ed448, BLS signatures, RSA Blind Signatures, CPABE, OT, Threshold RSA Signatures
- **Infrastructure Layers**: PKI
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: FIPS 186-5; FIPS 203; FIPS 204; FIPS 205
- **Classical Algorithms Referenced**: X25519, X448, Ed25519, Ed448, BLS signatures, P-256, P-384, P-521, Ristretto, BLS12-381, RSA, SHAKE128, SHAKE256, BLAKE2X, KangarooTwelve, Ascon v1.2
- **Key Takeaways**: CIRCL is offered as-is without guarantee and contains experimental content; The library supports hybrid key exchanges including X-Wing; Users must report security issues immediately following the Security Policy; The library implements NIST-standardized PQC algorithms alongside classical ECC; Citation requires updating version and access date.
- **Security Levels & Parameters**: ML-KEM modes 512, 768, 1024; Kyber KEM modes 512, 768, 1024; FrodoKEM mode 640-SHAKE; Dilithium modes 2, 3, 5; ML-DSA modes 44, 65, 87; SLH-DSA twelve parameter sets
- **Hybrid & Transition Approaches**: X-Wing; HPKE (Hybrid Public-Key Encryption)
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: Go language environment; GitHub repository access for fetching via go get
- **Relevant PQC Today Features**: Algorithms; hybrid-crypto; crypto-agility; tls-basics; pki-workshop
- **Source Document**: CIRCL*Cloudflare*.html (381,094 bytes, 9,228 extracted chars)
- **Extraction Timestamp**: 2026-03-30T17:34:47

---

## PQClean

- **Reference ID**: PQClean
- **Title**: PQClean: Clean Portable C Implementations of Post-Quantum Cryptography
- **Authors**: PQClean Contributors
- **Publication Date**: 2018-01-01
- **Last Updated**: 2026-01-01
- **Document Status**: Active
- **Main Topic**: PQClean provides clean, portable C reference implementations of NIST PQC finalists and candidates designed for easy integration into libraries and benchmarking frameworks.
- **PQC Algorithms Covered**: Kyber; HQC; Classic McEliece; Dilithium; Falcon; SPHINCS+; FN-DSA
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: PQClean is no longer under active maintenance and will be archived as read-only in July 2026
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Matthias J. Kannwischer; Peter Schwabe; Douglas Stebila; Thom Wiggers; Thomas Pornin
- **PQC Products Mentioned**: liboqs; Open Quantum Safe; SUPERCOP; pqm4; PQ Code Package; QuantCrypt; pqcrypto crate; mupq; node-pqclean
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: SHA-2; AES; SHA-3; cSHAKE
- **Key Takeaways**: PQClean is deprecated and will be archived as read-only in July 2026; Users should migrate to the PQ Code Package for maintained standardized PQC implementations; Implementations require specific dependencies including fips202.c, sha2.c, aes.c, and randombytes.c; The project provides standalone C code suitable for integration into libraries like liboqs or benchmarking frameworks like SUPERCOP
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: gcc or clang; make; python3; python-yaml library; valgrind; astyle (>= 3.0); Python 3.6+; pytest; pytest-xdist
- **Relevant PQC Today Features**: Algorithms; Migrate; Assess; code-signing; iot-ot-pqc
- **Source Document**: PQClean.html (355,074 bytes, 14,441 extracted chars)
- **Extraction Timestamp**: 2026-03-30T17:36:11

---

## Liboqs-python

- **Reference ID**: Liboqs-python
- **Title**: liboqs-python: Python Wrapper for Open Quantum Safe liboqs
- **Authors**: Open Quantum Safe
- **Publication Date**: 2019-01-01
- **Last Updated**: 2026-01-01
- **Document Status**: Active
- **Main Topic**: liboqs-python is a Python 3 wrapper for the Open Quantum Safe liboqs C library providing access to quantum-resistant cryptographic algorithms for prototyping and research.
- **PQC Algorithms Covered**: ML-KEM, XMSS, XMSSMT
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Douglas Stebila (led Open Quantum Safe project); Michele Mosca (led Open Quantum Safe project); Ben Davies (contributor to liboqs-python wrapper); Vlad Gheorghiu (contributor to liboqs-python wrapper); Christian Paquin (contributor to liboqs-python wrapper)
- **PQC Products Mentioned**: liboqs, liboqs-python
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA, elliptic curves
- **Key Takeaways**: liboqs is designed for prototyping and evaluating quantum-resistant cryptography rather than production deployment; applications should rely on NIST standardization project outcomes when deploying post-quantum cryptography; hybrid cryptography combining post-quantum and traditional algorithms is recommended for early deployments; ML-KEM key pairs can be deterministically generated from a seed using the wrapper API
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: hybrid cryptography
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Researcher
- **Implementation Prerequisites**: liboqs git; CMake; C compiler (gcc, clang, MSVC); Python 3; LD_LIBRARY_PATH or DYLD_LIBRARY_PATH environment variable configuration on UNIX-like systems; PATH environment variable configuration on Windows; OQS_INSTALL_PATH environment variable optional
- **Relevant PQC Today Features**: Algorithms, hybrid-crypto, stateful-signatures, entropy-randomness
- **Source Document**: Liboqs-python.html (347,563 bytes, 12,043 extracted chars)
- **Extraction Timestamp**: 2026-03-30T17:37:43

---

## Liboqs-go

- **Reference ID**: Liboqs-go
- **Title**: liboqs-go: Go Wrapper for Open Quantum Safe liboqs
- **Authors**: Open Quantum Safe
- **Publication Date**: 2019-01-01
- **Last Updated**: 2026-01-01
- **Document Status**: Active
- **Main Topic**: liboqs-go is a Go wrapper library providing access to quantum-resistant cryptographic algorithms via the Open Quantum Safe liboqs C library.
- **PQC Algorithms Covered**: ML-DSA, SLH-DSA, SPHINCS+
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Canada
- **Leaders Contributions Mentioned**: Douglas Stebila (led Open Quantum Safe project); Michele Mosca (led Open Quantum Safe project); Vlad Gheorghiu (developed liboqs-go)
- **PQC Products Mentioned**: liboqs, liboqs-go
- **Protocols Covered**: TCP/IP
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS 204
- **Classical Algorithms Referenced**: RSA, elliptic curves, OpenSSL
- **Key Takeaways**: Users must migrate from Dilithium to ML-DSA as of liboqs 0.15.0; SPHINCS+ support will be removed in liboqs 0.16.0 and replaced by SLH-DSA; Hybrid cryptography combining post-quantum and traditional algorithms is strongly recommended for deployment; Applications should rely on NIST standardization project outcomes before finalizing PQC deployments; Static linking requires specific CMake flags and OpenSSL configuration adjustments
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: hybrid cryptography
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect
- **Implementation Prerequisites**: Go 1.21 or later; liboqs git repository; CMake; C compiler (gcc, clang, MSYS2); pkg-config; OpenSSL (optional for static linking)
- **Relevant PQC Today Features**: Algorithms, Migrate, hybrid-crypto, crypto-agility
- **Source Document**: Liboqs-go.html (354,229 bytes, 14,178 extracted chars)
- **Extraction Timestamp**: 2026-03-30T17:39:08

---

## Liboqs-cpp

- **Reference ID**: Liboqs-cpp
- **Title**: liboqs-cpp: C++ Wrapper for Open Quantum Safe liboqs
- **Authors**: Open Quantum Safe
- **Publication Date**: 2019-01-01
- **Last Updated**: 2026-01-01
- **Document Status**: Active
- **Main Topic**: liboqs-cpp is a C++11 wrapper library providing object-oriented access to the Open Quantum Safe liboqs C library for prototyping quantum-resistant cryptography.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Douglas Stebila (led Open Quantum Safe project); Michele Mosca (led Open Quantum Safe project); Vlad Gheorghiu (developed liboqs-cpp)
- **PQC Products Mentioned**: liboqs; liboqs-cpp
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; elliptic curves
- **Key Takeaways**: The library is designed for prototyping and evaluating quantum-resistant cryptography rather than production deployment; Applications should rely on NIST standardization project outcomes before deploying post-quantum cryptography; Hybrid cryptography combining post-quantum and traditional algorithms is recommended for early deployments to maintain security levels; The wrapper requires a C++11 compliant compiler and the liboqs library installed as a prerequisite.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: hybrid cryptography
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Researcher
- **Implementation Prerequisites**: C++11 compliant compiler; liboqs git repository; CMake; GoogleTest for unit tests; Graphviz package for documentation generation
- **Relevant PQC Today Features**: Algorithms, Leaders, hybrid-crypto, crypto-agility
- **Source Document**: Liboqs-cpp.html (347,778 bytes, 12,872 extracted chars)
- **Extraction Timestamp**: 2026-03-30T17:40:42

---

## Lattice-Estimator

- **Reference ID**: Lattice-Estimator
- **Title**: Lattice-Estimator: Security Estimation Tool for Lattice-Based Schemes
- **Authors**: Martin Albrecht et al.
- **Publication Date**: 2015-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Active
- **Main Topic**: A SageMath-based tool providing functions to estimate the concrete security of lattice-based cryptographic schemes against known attacks.
- **PQC Algorithms Covered**: LWE, NTRU, SIS, Kyber512, Dilithium2_MSIS_WkUnf, Falcon512_SKR, Falcon512_Unf
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: European Union; PROMETHEUS project; Horizon 2020 Research and Innovation Program; EPSRC
- **Leaders Contributions Mentioned**: Martin Albrecht (maintainer); Benjamin Curtis; Cathie Yun; Cedric Lefebvre; Fernando Virdia; Florian Göpfert; Hamish Hunt; Hunter Kippen; James Owen; Léo Ducas; Ludo Pulles; Markus Schmidt; Michael Walter; Rachel Player; Sam Scott
- **PQC Products Mentioned**: lattice-estimator; Zama's TFHE Compiler; Concrete
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: The tool integrates simulators for best known attacks against LWE, NTRU, and SIS problems; Estimations rely on heuristics to predict the cost and shape of lattice reduction algorithms; Users should state the specific commit used when referencing estimations due to evolving code; The estimator provides both fast rough estimates and extended routines evaluating all supported attacks; Security estimates are provided in bit-security values for various attack vectors like usvp, bdd, and dual_hybrid
- **Security Levels & Parameters**: Kyber512 (n=512, q=3329); Dilithium2_MSIS_WkUnf (n=1024, q=8380417); Falcon512_SKR (n=512, q=12289); Falcon512_Unf (n=512, q=12289); bit-security estimates ranging from 2^112.3 to 2^347.8
- **Hybrid & Transition Approaches**: dual_hybrid attack; bdd_hybrid attack; bdd_mitm_hybrid attack
- **Performance & Size Considerations**: Kyber512 usvp rop ≈ 2^143.8; Kyber512 dual_hybrid guess ≈ 2^112.3; Dilithium2_MSIS_WkUnf lattice rop ≈ 2^152.2; Falcon512_SKR bdd_mitm_hybrid rop ≈ 2^347.8
- **Target Audience**: Researcher, Developer, Cryptanalyst
- **Implementation Prerequisites**: SageMath; Python; conf.py configuration file
- **Relevant PQC Today Features**: Algorithms, Assess, Leaders
- **Source Document**: Lattice-Estimator.html (361,153 bytes, 10,722 extracted chars)
- **Extraction Timestamp**: 2026-03-30T17:42:06

---

## FPLLL

- **Reference ID**: FPLLL
- **Title**: FPLLL: Fast Library for Lattice Reduction Algorithms
- **Authors**: FPLLL Contributors
- **Publication Date**: 2005-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Active
- **Main Topic**: fplll is a C++ library implementing lattice reduction algorithms such as LLL, BKZ, and SVP used for cryptanalysis of lattice-based PQC schemes.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: The FPLLL development team
- **PQC Products Mentioned**: fplll; latticegen; llldiff
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: fplll provides floating-point implementations of LLL and BKZ reduction algorithms; the library includes a wrapper that automatically selects the best sequence of variants for speed; users can generate specific lattice types including knapsack, NTRU-like, and SIS/LWE q-ary matrices; compilation requires GNU MP or MPIR and MPFR libraries; the library supports optimization flags like -march=native to improve enumeration speed
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Default compilation flag is -O3; optional optimization flag is -march=native -O3; LLL delta default is 0.99; LLL eta default is 0.51
- **Target Audience**: Developer; Researcher
- **Implementation Prerequisites**: GNU MP 4.2.0 or higher; MPIR 1.0.0 or higher; MPFR 2.3.0 or higher; autotools 2.61 or higher; g++ 4.9.3 or higher; QD 2.3.15 or higher (optional); Windows Subsystem for Linux for Windows 10
- **Relevant PQC Today Features**: Algorithms; pqc-101; code-signing
- **Source Document**: FPLLL.html (435,619 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-30T17:44:07

---

## ETSI-TS-103-673

- **Reference ID**: ETSI-TS-103-673
- **Title**: ETSI TS 103 673: Quantum-Safe Hybrid Key Exchanges
- **Authors**: ETSI TC CYBER QSC
- **Publication Date**: 2022-03-01
- **Last Updated**: 2022-03-01
- **Document Status**: Published
- **Main Topic**: The document defines the SAREF Development Framework and Workflow for streamlining the development of SAREF and its extensions in SmartM2M contexts.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: ETSI; oneM2M Partners
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: The document outlines a structured workflow for proposing, reviewing, and publishing new SAREF project versions; It defines specific roles including steering, development, and community actors in the SAREF ecosystem; Continuous integration and continuous deployment are required steps in the project setup phase; Change requests must undergo a clear review process before implementation can begin; Project releases require preparation of documentation and ontology specifications prior to publication.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Researcher; Policy Maker
- **Implementation Prerequisites**: SAREF public forge access; Ontology development team setup; Continuous integration and continuous deployment configuration
- **Relevant PQC Today Features**: iot-ot-pqc, migration-program, pqc-governance
- **Source Document**: ETSI_TS_103_673.pdf (667,298 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-30T17:45:43

---

## RFC-9242

- **Reference ID**: RFC-9242
- **Title**: RFC 9242: Intermediate Exchange in IKEv2
- **Authors**: IETF
- **Publication Date**: 2022-05-01
- **Last Updated**: 2022-05-01
- **Document Status**: Published
- **Main Topic**: Defines the Intermediate Exchange mechanism in IKEv2 to enable fragmentation of large PQC key exchange payloads before Security Association establishment.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Valery Smyslov; Benjamin Kaduk
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: IKEv2, UDP, TCP, IP
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: Internet Engineering Task Force (IETF), IESG
- **Compliance Frameworks Referenced**: BCP 78, Revised BSD License
- **Classical Algorithms Referenced**: Diffie-Hellman
- **Key Takeaways**: Intermediate Exchange allows IKEv2 to transfer large data before SA establishment using existing fragmentation; IP fragmentation issues are avoided by moving large PQC payloads to the Intermediate Exchange; The exchange is optional and negotiated via INTERMEDIATE_EXCHANGE_SUPPORTED notification; Data transferred in this exchange must be authenticated during the subsequent IKE_AUTH exchange; Bulk transfer is not intended, with expected limits of tens of kilobytes.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Tens of kilobytes data limit; a few hundred kilobytes in extreme cases; Notify Message Type 16438; Exchange Type 43
- **Target Audience**: Security Architect, Developer, Network Engineer
- **Implementation Prerequisites**: Support for IKE fragmentation [RFC7383]; UDP transport; negotiation of INTERMEDIATE_EXCHANGE_SUPPORTED notification
- **Relevant PQC Today Features**: vpn-ssh-pqc, crypto-agility, tls-basics
- **Source Document**: IETF_RFC_9242.html (69,440 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-30T17:47:02

---

## IEEE-P1931-1-ROSA

- **Reference ID**: IEEE-P1931-1-ROSA
- **Title**: IEEE P1931.1: Standard for Post-Quantum Cryptography — ROust Security Architecture (ROSA)
- **Authors**: IEEE
- **Publication Date**: 2024-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: In Development
- **Main Topic**: The provided text is a website navigation and error page for IEEE SA indicating the requested standard page is unavailable, rather than the content of the IEEE P1931.1 standard itself.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: IEEE Standards Association
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: The specific standard document content is not present in the provided text; only website navigation and an error message are available; no actionable insights regarding PQC deployment can be extracted from this text.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected
- **Source Document**: IEEE_P1931.1.html (91,524 bytes, 4,702 extracted chars)
- **Extraction Timestamp**: 2026-03-30T17:48:31

---

## ITU-T-X1811

- **Reference ID**: ITU-T-X1811
- **Title**: ITU-T X.1811: Security Guidelines for Applying Quantum-Safe Cryptography
- **Authors**: ITU-T
- **Publication Date**: 2024-01-01
- **Last Updated**: 2024-01-01
- **Document Status**: Published
- **Main Topic**: Security guidelines for applying quantum-safe algorithms in IMT-2020 systems.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: ITU-T
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: 5g-security; compliance-strategy; migration-program
- **Source Document**: ITU-T_X.1811.html (9,558 bytes, 541 extracted chars)
- **Extraction Timestamp**: 2026-03-30T17:49:19

---

## IBM-Quantum-Safe-Research

- **Reference ID**: IBM-Quantum-Safe-Research
- **Title**: IBM Research: Post-Quantum Cryptography Standards and Research
- **Authors**: IBM Research
- **Publication Date**: 2024-08-01
- **Last Updated**: 2025-01-01
- **Document Status**: Active
- **Main Topic**: NIST has released three post-quantum cryptography standards (ML-KEM, ML-DSA, SLH-DSA) with significant contributions from IBM Research, prompting organizations to begin quantum-safe migration strategies.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, CRYSTALS-Kyber, CRYSTALS-Dilithium, SPHINCS+
- **Quantum Threats Addressed**: Cryptographically relevant quantum computers; Shor's algorithm; harvest now, decrypt later attacks
- **Migration Timeline Info**: 2035 deadline for National Security Systems to complete quantum-safe migration per CNSA 2.0; past migrations took nearly 20 years
- **Applicable Regions / Bodies**: United States; European Union; France; Germany; Austria; UK; Liechtenstein; Italy
- **Leaders Contributions Mentioned**: Vadim Lyubashevsky (co-developer of CRYSTALS algorithm suite); Whitfield Diffie (cryptography researcher at IBM, Turing Award winner); Martin Hellman (collaborator with Diffie)
- **PQC Products Mentioned**: IBM Quantum Safe Explorer; Cryptography Bill of Materials (CBOM); Visual Studio Code extension for CBOM; open-source CBOM generator; open-source CBOM viewer; IBM z16; IBM Power10; IBM Cloud; IBM Quantum Platform; Apple iMessage; Zoom; Google Chrome
- **Protocols Covered**: TLS; hybrid KEM scheme
- **Infrastructure Layers**: Firmware; cloud-based services; database components; operating systems; hardware; IoT devices; supply chain; internal application code; third-party services; commercial off-the-shelf products
- **Standardization Bodies**: NIST; ETSI; ENISA; Ecma International; GSMA; Post-Quantum Cryptography Alliance; Emerging Payments Association Asia (EPAA)
- **Compliance Frameworks Referenced**: Federal Information Processing Standards (FIPS); National Security Memorandum (NSM-10); Quantum Computing Cybersecurity Preparedness Act; Commercial National Security Algorithm Suite 2.0 (CNSA 2.0); CycloneDX v1.6 standard
- **Classical Algorithms Referenced**: RSA; RSA-2048; elliptic curves; discrete logarithm problems (implied by "discrete, larger RSA or elliptic curves")
- **Key Takeaways**: Organizations must create a quantum-safe transformation strategy immediately to address harvest now, decrypt later threats; NIST standards provide the necessary guidance for enterprises and supply chains to begin migration; IBM offers tools like CBOM and Quantum Safe Explorer to inventory cryptographic assets and dependencies; Migration requires re-engineering security protocols and updating infrastructure across hardware, software, and services; Global bodies including the White House and European Commission are establishing timelines and mandates for quantum-safe adoption
- **Security Levels & Parameters**: 2048-bit RSA; NIST L1-L5 not explicitly stated; specific parameter sets like ML-KEM-768 not explicitly stated in text
- **Hybrid & Transition Approaches**: Hybrid KEM scheme; crypto-agility; incremental transition; two-pronged strategy (internal and open source); composite certificates not explicitly named but hybrid approach mentioned
- **Performance & Size Considerations**: PQC algorithms are more efficient in running time than classical algorithms based on discrete, larger RSA or elliptic curves; PQC keys might be larger than classical cryptography; no specific byte sizes provided
- **Target Audience**: CISO; Security Architect; Developer; Compliance Officer; Policy Maker; Operations; Researcher
- **Implementation Prerequisites**: Cryptographic discovery and inventory; quantum-safe transformation strategy; CBOM generation; Visual Studio Code extension or API access for IBM Quantum Safe Explorer; vendor collaboration for supply chain dependencies
- **Relevant PQC Today Features**: Threats, Migrate, Assess, Algorithms, Leaders, crypto-agility, tls-basics, migration-program, pqc-risk-management, compliance-strategy
- **Source Document**: IBM_Quantum_Safe.html (86,557 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-30T17:49:56

---

## Microsoft-PQC-Research

- **Reference ID**: Microsoft-PQC-Research
- **Title**: Microsoft Research: Post-Quantum Cryptography Project
- **Authors**: Microsoft Research
- **Publication Date**: 2015-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Active
- **Main Topic**: Microsoft Research's post-quantum cryptography project focusing on lattice-based and isogeny-based algorithms, NIST standardization participation, and open-source library development.
- **PQC Algorithms Covered**: CRYSTALS-Kyber, CRYSTALS-Dilithium, Falcon, SPHINCS+, FrodoKEM, SQISign, SIKE, Picnic, qTESLA
- **Quantum Threats Addressed**: Harvest Now Decrypt Later; future quantum computers breaking existing public-key cryptography based on factoring and elliptic curve discrete logarithms
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: NIST, ISO, Open Quantum Safe, NCCoE
- **Leaders Contributions Mentioned**: Josh Benaloh (Senior Cryptographer); Craig Costello (Researcher); Karen Easterbrook (Principal PM Manager); Larry Joy (Senior Software Development Engineer); Patrick Longa (Researcher); Michael Naehrig (Researcher); Christian Paquin (Principal Research SDE); Dan Shumow (Principal Software Development Engineer); Greg Zaverucha (Principal Software Development Engineer)
- **PQC Products Mentioned**: liboqs; OpenVPN fork
- **Protocols Covered**: TLS, SSH, VPN tunnels
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST, ISO
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Existing public-key cryptography based on factoring and elliptic curve discrete logarithms will be broken by large-scale quantum computers; Organizations must replace existing cryptography quickly due to the threat of storing encrypted data for future decryption; New cryptosystems require careful integration with existing internet protocols like TLS considering key sizes and traffic overhead; Post-quantum development must be conducted openly with international support to ensure standards are well vetted; Microsoft Research participates in NIST projects and open-source initiatives like Open Quantum Safe to advance PQC adoption
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, Researcher, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms; Threats; Migrate; Leaders; vpn-ssh-pqc
- **Source Document**: Microsoft*Research_PQC*.html (172,216 bytes, 10,090 extracted chars)
- **Extraction Timestamp**: 2026-03-30T17:52:11

---

## Intel-PQC-Research

- **Reference ID**: Intel-PQC-Research
- **Title**: Intel Labs: Post-Quantum Cryptography Research and Hardware Acceleration
- **Authors**: Intel Labs
- **Publication Date**: 2023-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Active
- **Main Topic**: Intel Labs research focuses on hardware acceleration for PQC algorithms including optimized ML-KEM and ML-DSA implementations for Intel platforms.
- **PQC Algorithms Covered**: ML-KEM; ML-DSA
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; US National Science Foundation (NSF); Semiconductor Research Corporation
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Intel Labs is conducting research on hardware acceleration for PQC algorithms; Optimized implementations of ML-KEM and ML-DSA are being developed for Intel platforms; Intel collaborates with academia, government, and industry to develop security solutions; Intel invests approximately $50 million annually in university research programs
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Researcher; Developer; Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms; Leaders; Assess
- **Source Document**: Intel*Labs_PQC*.html (186,959 bytes, 6,609 extracted chars)
- **Extraction Timestamp**: 2026-03-30T17:53:37

---

## SandboxAQ-PQC-Readiness-2025

- **Reference ID**: SandboxAQ-PQC-Readiness-2025
- **Title**: State of PQC Readiness 2025 — Annual Industry Survey
- **Authors**: SandboxAQ
- **Publication Date**: 2025-11-01
- **Last Updated**: 2025-11-01
- **Document Status**: Active
- **Main Topic**: Annual industry survey measuring enterprise PQC readiness, crypto-agility, migration timelines, and executive awareness across the USA and Europe.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest now, decrypt later; quantum device capable of breaking encryption methods
- **Migration Timeline Info**: 2026: 55% believe at least one PQC algorithm will be in place; 2030-2035: Experts predict quantum devices capable of breaking encryption; 31 December 2035: European Commission deadline for medium and low risk systems; 2035: USA government goal for mitigating quantum risk
- **Applicable Regions / Bodies**: Regions: USA, Europe, UK, Germany; Bodies: NIST, NCSC, Trusted Computing Group, European Commission, Federal Office for Information Security (BSI), Cornell University
- **Leaders Contributions Mentioned**: Joe Pennisi: President of Trusted Computing Group
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: PKI; crypto-libraries; HSMs
- **Standardization Bodies**: NIST; NCSC; Trusted Computing Group; European Commission; Federal Office for Information Security (BSI)
- **Compliance Frameworks Referenced**: National Security Memorandum 10 (NSM-10); PQC Implementation Roadmap; Recommendation on a Coordinated Implementation Roadmap for the transition to PostQuantum Cryptography
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: 91% of businesses lack a formal PQC roadmap despite high threat awareness; 81% believe current crypto-libraries and HSMs are not ready for PQC integration; 55% of businesses plan to allocate 6-10% of IT and security budgets to PQC migration; Regulatory pressure from bodies like NIST and the European Commission is a primary driver for roadmap creation; Confidence in understanding quantum threats is high (76%) but actual preparedness remains low
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Algorithmic agility; crypto-agility
- **Performance & Size Considerations**: Large signature sizes mentioned as a challenge for full use of PQC signatures; 6-10% of available IT and security budgets planned for PQC migration efforts
- **Target Audience**: CISO, CTO, CIO, Security Architect, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Threats; Compliance; Migrate; Assess; crypto-agility; pqc-governance; migration-program; pqc-business-case
- **Source Document**: State-of-PQC-Readiness-2025-November-2025.pdf (21,716,444 bytes, 13,290 extracted chars)
- **Extraction Timestamp**: 2026-03-30T19:40:42

---

## TNO-PQC-Migration-WP-2025

- **Reference ID**: TNO-PQC-Migration-WP-2025
- **Title**: Migration to Post-Quantum Cryptography — Whitepaper 2025
- **Authors**: TNO
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Active
- **Main Topic**: A whitepaper by Mastercard R&D outlining practical migration strategies, threat assessments, and regulatory mandates for financial institutions transitioning to post-quantum cryptography.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Cryptographically Relevant Quantum Computer (CRQC); Harvest Now Decrypt Later (HNDL); Shor's Algorithm
- **Migration Timeline Info**: CRQC estimated no closer than 10 years away and more likely 20 years away; mitigation timescale is years not months; 10-year action plan triggered by quantum computer with ten thousand qubits
- **Applicable Regions / Bodies**: Bodies: NIST; Regions: None detected
- **Leaders Contributions Mentioned**: Peter Shor (announced algorithms in 1994); Gidney and Ekerå (2019 estimate for RSA-2048 recovery); Steve Brierley (quoted on quantum hype)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Transport Layer Security (TLS)
- **Infrastructure Layers**: Public-key infrastructure (PKI)
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: NIST Special Publication 800-56B; NIST Special Publication 800-186
- **Classical Algorithms Referenced**: RSA; Elliptic Curve Cryptography (ECC); Data Encryption System (DES)
- **Key Takeaways**: Financial institutions must adopt proactive quantum-resistant strategies rather than reactive approaches; Organizations should assess the time value of confidential data against HNDL risks; Migration to quantum-safe systems requires years of planning and cannot be enacted quickly; Early adopters will be best positioned to protect assets and maintain resilience; Low-cost mitigations should be prioritized as soon as practical
- **Security Levels & Parameters**: RSA-2048; RSA-1024; 20 million qubits; 900,000 qubits; ten thousand qubits
- **Hybrid & Transition Approaches**: Pure and hybrid implementations; transitioning from classical cryptographic systems to quantum-safe alternatives
- **Performance & Size Considerations**: 8 hours to recover 2048-bit RSA key with 20 million qubits; 4.63 days to recover 2048-bit RSA key with 900,000 qubits
- **Target Audience**: CISO; Security Architect; Policy Maker; Compliance Officer
- **Implementation Prerequisites**: Evaluating current infrastructure; deploying new tools and resources; building a plan for quantum migration
- **Relevant PQC Today Features**: Threats; Migrate; Assess; Compliance; hybrid-crypto
- **Source Document**: Migration-to-post-quantum-cryptography-WhitePaper_2025.pdf (2,384,992 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-30T19:45:23

---

## NIST-PQC-Workshop-Yassir-2020

- **Reference ID**: NIST-PQC-Workshop-Yassir-2020
- **Title**: NIST PQC Workshop — Post-Quantum Cryptography Standardization Presentation (Yassir 2020)
- **Authors**: NIST
- **Publication Date**: 2020-08-19
- **Last Updated**: 2020-08-19
- **Document Status**: Active
- **Main Topic**: JPMorgan Chase's strategic framework and timeline for transitioning global financial institutions to post-quantum cryptography through crypto agility.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: 2024: NIST PQC standard finalized; subsequent phases include PQC Preparation, PQC Adoption, and Conventional Crypto Deprecation.
- **Applicable Regions / Bodies**: Bodies: JPMorgan Chase & Co.; Regions: None detected
- **Leaders Contributions Mentioned**: Yassir Nawaz: Author of opinions and presenter on PQC transition considerations for financial institutions.
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management; Cryptographic infrastructure components.
- **Standardization Bodies**: NIST.
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: AES.
- **Key Takeaways**: Financial institutions must adopt a data-centric and risk-based approach to PQC transition; Crypto agility must be certified before implementing PQC standards; Organizations should inventory high-risk data and establish crypto agility solutions prior to NIST standard finalization; Vendor technology evaluation and roadmap surveys are critical steps in the PQC preparation phase.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Crypto agility; Backward compatibility; Data-centric approach; Risk-based approach.
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Compliance Officer, Policy Maker.
- **Implementation Prerequisites**: System certification for crypto agility; Data inventory of high-risk data; Vendor technology evaluation; Vendor PQC roadmap survey.
- **Relevant PQC Today Features**: timeline, crypto-agility, data-asset-sensitivity, migration-program, pqc-governance
- **Source Document**: 6-Yassir-NIST- 20200819-8.pdf (917,593 bytes, 4,970 extracted chars)
- **Extraction Timestamp**: 2026-03-30T19:47:07

---

## JPMorgan-RWPQC-2025

- **Reference ID**: JPMorgan-RWPQC-2025
- **Title**: JPMorgan Chase — Real World PQC 2025 Presentation
- **Authors**: JPMorgan Chase
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Active
- **Main Topic**: JPMorgan Chase outlines a five-step approach for PQC transition including cryptography inventory, enablement, and crypto-agility strategies.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509
- **Infrastructure Layers**: PKI, Key Management
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must conduct a comprehensive cryptography inventory covering filesystem scans and certificate paths; Transition planning requires assessing renewal costs and identifying dependencies case-by-case; Crypto-agility implementation must avoid anti-patterns such as string-defined algorithms and hardcoded security parameters; System owners need to identify product version uplifts required for quantum-safe algorithm support.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: crypto agility
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, Compliance Officer, CISO
- **Implementation Prerequisites**: Cryptography inventory; Filesystem scan capability; X.509 certificate inspection; Product version uplift assessment
- **Relevant PQC Today Features**: Assess, Migrate, crypto-agility, pki-workshop, migration-program
- **Source Document**: Day1-1530-JPMorgan_Chase_RWPQC25.pdf (2,310,812 bytes, 2,038 extracted chars)
- **Extraction Timestamp**: 2026-03-30T19:48:13

---

## arXiv-2403-11741

- **Reference ID**: arXiv-2403-11741
- **Title**: Post-Quantum Cryptography: Securing Digital Communication in the Quantum Era
- **Authors**: Dr. G S Mamatha; Rasha Sinha (R.V. College of Engineering)
- **Publication Date**: 2024-03-18
- **Last Updated**: 2024-03-18
- **Document Status**: Active
- **Main Topic**: Academic survey on post-quantum cryptography covering lattice-based, code-based, multivariate, and hash-based schemes to address quantum threats to classical encryption.
- **PQC Algorithms Covered**: CRYSTALS-DILITHIUM, FALCON, Classic McEliece, BIKE, HQC, Rainbow, SIKE, SPHINCS+, PICNIC, CRYSTALS-Kyber
- **Quantum Threats Addressed**: Shor's algorithm; integer factorization; discrete logarithm problem on elliptic curves
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: National Institute of Standards and Technology (NIST), Internet Engineering Task Force (IETF), ETSI
- **Leaders Contributions Mentioned**: Dr. G S Mamatha; Rasha Sinha; Namya Dimri; Ron Rivest; Adi Shamir; Leonard Adleman
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: National Institute of Standards and Technology (NIST), Internet Engineering Task Force (IETF), ETSI
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA, ECC
- **Key Takeaways**: Shor's algorithm efficiently breaks RSA and ECC by solving integer factorization and discrete logarithm problems; PQC algorithms rely on mathematical problems like SVP, LWE, and decoding linear codes to resist quantum attacks; Implementation challenges include algorithmic complexity, resource intensiveness, and lack of standardized protocols; Organizations must plan for interoperability with legacy systems and phased deployment strategies; NIST has finalized CRYSTALS-Kyber and CRYSTALS-Dilithium as the first batch of PQC algorithms.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Backward compatibility measures; phased deployment strategies; interoperability planning with legacy systems
- **Performance & Size Considerations**: Lattice-based: Fast operation speed, Difficult setting parameter; Code-based: Small signature size, Fast operation speed, Large key size; Multivariate: Fast encryption and decryption speed, Large key size; Isogeny: Small key size, Slow operation speed; Hash: Safety proof possible, Large signature size
- **Target Audience**: Researcher; Security Architect; Policy Maker
- **Implementation Prerequisites**: Specialized expertise for algorithmic complexity; substantial computational resources and memory overhead; compatibility testing and validation procedures; collaborative efforts with cryptographic experts
- **Relevant PQC Today Features**: Threats; Algorithms; Migrate; Compliance; Assess
- **Source Document**: 2403.11741v1.pdf (955,198 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-30T19:49:07

---

## NTNU-PQC-Challenges-Silde

- **Reference ID**: NTNU-PQC-Challenges-Silde
- **Title**: Challenges and Opportunities from Quantum-Safe Cryptography
- **Authors**: Tjerand Silde (NTNU; PONE Biometrics)
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Active
- **Main Topic**: Presentation on quantum-safe cryptography challenges and opportunities covering current algorithms, quantum threats, and secure authentication use cases.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Store now, decrypt later; Shor's Algorithm; Grover's Algorithm
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Tjerand Silde: Associate Professor in Cryptology at NTNU and Security and Cryptography Expert at Pone Biometrics working on FIDO, secure authentication, and biometrics.
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS; SSH; IPsec; FIDO
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; (EC) Diffie-Hellman; (EC) Digital Signature Algorithm; (EC) ElGamal; AES; SHA2/3; HMAC
- **Key Takeaways**: Shor's Algorithm threatens factoring and discrete logarithms used in current public key cryptography; Grover's Algorithm accelerates symmetric key search and hash collision finding; Lattice-based, code-based, and isogeny-based schemes are examples of quantum-safe approaches; Current protocols like Signal, WhatsApp, and FIDO face future security risks from quantum computers.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Researcher; Security Architect; Developer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats; Algorithms; digital-id; tls-basics; vpn-ssh-pqc
- **Source Document**: PQC.pdf (5,965,167 bytes, 2,627 extracted chars)
- **Extraction Timestamp**: 2026-03-30T19:50:52

---

## EPC-342-08-Crypto-Guidelines-v16

- **Reference ID**: EPC-342-08-Crypto-Guidelines-v16
- **Title**: EPC 342-08 v16.0 — Guidelines on Cryptographic Algorithms Usage and Key Management
- **Authors**: European Payments Council (EPC)
- **Publication Date**: 2019-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Active
- **Main Topic**: Guidelines on cryptographic algorithms usage and key management for SEPA payment schemes including PQC transition considerations.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: CRQCs; Data at risk with CRQCs
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: European Payments Council (EPC) AISBL
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management; PKI
- **Standardization Bodies**: ISO; ETSI; ANSI; NIST; W3C; EMV
- **Compliance Frameworks Referenced**: ISO 11568; NIST FIPS standards; NIST Special Publications
- **Classical Algorithms Referenced**: Triple DES (TDES); Advanced Encryption Standard; RSA; Elliptic Curve Cryptosystem (ECC)
- **Key Takeaways**: Document defines guidelines for cryptographic algorithm usage and key management lifecycle; CRQCs impact cryptographic primitives and create data at risk; Hybrid encryption and hybrid key architectures are discussed as implementation approaches; Key management impacts interoperability and requires specific rules for generation, distribution, and deletion.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid Encryption; Example of a hybrid key architecture
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Compliance Officer; Developer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, Algorithms, Migrate, Assess, hybrid-crypto, crypto-agility, pki-workshop, entropy-randomness
- **Source Document**: EPC342-08-v16.0-Guidelines-Cryptographic-Algorithms-Key-Management.pdf (1,646,453 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-03-30T19:51:55

---
