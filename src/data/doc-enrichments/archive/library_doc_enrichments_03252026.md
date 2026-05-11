---
generated: 2026-03-25
collection: library
documents_processed: 8
enrichment_method: ollama-qwen3.5:27b
---

## draft-ietf-uta-pqc-app-01

- **Reference ID**: draft-ietf-uta-pqc-app-01
- **Title**: Post-Quantum Cryptography Recommendations for TLS-based Applications
- **Authors**: IETF UTA
- **Publication Date**: 2025-09-18
- **Last Updated**: 2026-03-25
- **Document Status**: Internet-Draft
- **Main Topic**: Best practices for implementing quantum-ready usage profiles in TLS-based applications to protect against Cryptographically Relevant Quantum Computers.
- **PQC Algorithms Covered**: ML-KEM, SLH-DSA, ML-DSA
- **Quantum Threats Addressed**: Cryptographically Relevant Quantum Computer (CRQC), Harvest Now Decrypt Later (HNDL) attacks, passive and on-path attacks
- **Migration Timeline Info**: Immediate action required for data confidentiality due to HNDL risks; forward-thinking planning required for authentication systems
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Tirumaleswar Reddy.K (Author), Hannes Tschofenig (Author)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.3, DTLS 1.3, QUIC, DNS, X.509, HPKE, Encrypted Client Hello, OCSP
- **Infrastructure Layers**: PKI, Certificate Transparency, Online Certificate Status Protocol (OCSP), remote attestation
- **Standardization Bodies**: IETF, NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: ECDH, ECDHE, RSA, Ed25519, ECDSA-P256, X25519, P256
- **Key Takeaways**: Hybrid key exchange combines traditional and post-quantum algorithms to maintain security if one component is broken; PQC algorithms introduce larger key and signature sizes impacting network performance and constrained environments; Immediate transition is required for data confidentiality to mitigate Harvest Now Decrypt Later attacks while authentication transition allows for forward planning; Implementation correctness is critical as even secure algorithms are vulnerable to flaws
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid Key Exchange, PQ/T Hybrid Digital Signature, Hybrid (Composite) X.509 Certificates
- **Performance & Size Considerations**: ML-KEM public keys substantially larger than ECDH; SLH-DSA and ML-DSA public keys much larger than P256; SLH-DSA and ML-DSA signature sizes considerably larger than Ed25519 or ECDSA-P256; ML-KEM requires less CPU than X25519; ML-DSA offers faster signature verification than Ed25519 but slower generation
- **Target Audience**: Application Developer, Security Architect, Device Manufacturer, Service Provider
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: tls-basics, hybrid-crypto, crypto-agility, pki-workshop, migration-program

---

## draft-wang-ipsecme-kem-auth-ikev2-03

- **Reference ID**: draft-wang-ipsecme-kem-auth-ikev2-03
- **Title**: KEM based Authentication for IKEv2 with Post-quantum Security
- **Authors**: IETF Individual Submission
- **Publication Date**: 2025-03-03
- **Last Updated**: 2026-03-25
- **Document Status**: Internet-Draft
- **Main Topic**: Specification of a KEM-based authentication mechanism for IKEv2 as a more efficient alternative to ML-DSA for post-quantum security.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA
- **Quantum Threats Addressed**: Cryptographically-relevant quantum computers (CRQC); harvest-now-and-decrypt-later (HNDL) attack
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Guilin WANG; Valery Smyslov
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: IKEv2, TLS 1.3
- **Infrastructure Layers**: Key Encapsulation Mechanism; Digital Signature
- **Standardization Bodies**: IETF; NIST
- **Compliance Frameworks Referenced**: FIPS 203; FIPS 204; FIPS 205; BCP 78; BCP 79; BCP 14
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: KEM-based authentication is more efficient than signature-based authentication for IKEv2; ML-KEM offers significantly smaller key and ciphertext sizes compared to ML-DSA signatures; Large PQ public keys and signatures can increase IKEv2 time delay, especially with packet loss; KEM-based authentication reduces implementation code size by reusing KEM code for ephemeral key establishment
- **Security Levels & Parameters**: NIST Level 1 (ML-KEM-512); NIST Level 2 (ML-DSA-44); NIST Level 3 (ML-KEM-768, ML-DSA-65); NIST Level 5 (ML-KEM-1024, ML-DSA-87)
- **Hybrid & Transition Approaches**: Hybrid PQ/T digital algorithms; PQuAKE protocol ideas
- **Performance & Size Considerations**: ML-DSA private key size is about 1.5 times ML-KEM decapsulation key size; ML-DSA public key size is about 1.6 times ML-KEM encapsulation key size; ML-DSA signature size is about 3 times ML-KEM ciphertext size; Communication overhead savings of 2,164 bytes for Level 1; 2,989 bytes for Level 3; 4,083 bytes for Level 5
- **Target Audience**: Security Architect; Developer; Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms; Threats; vpn-ssh-pqc; hybrid-crypto; crypto-agility

---

## draft-ietf-cose-falcon-04

- **Reference ID**: draft-ietf-cose-falcon-04
- **Title**: FN-DSA for JOSE and COSE
- **Authors**: IETF COSE WG
- **Publication Date**: 2025-10-12
- **Last Updated**: 2026-03-25
- **Document Status**: Internet-Draft
- **Main Topic**: This document specifies JSON Object Signing and Encryption (JOSE) and CBOR Object Signing and Encryption (COSE) serializations for the FN-DSA post-quantum digital signature algorithm.
- **PQC Algorithms Covered**: FN-DSA, FN-DSA-512, FN-DSA-1024
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: US NIST FIPS 206 expected to be published in late 2026 early 2027; Internet-Draft expires 16 September 2026
- **Applicable Regions / Bodies**: United States; Bodies: NIST, IETF
- **Leaders Contributions Mentioned**: Michael Prorock, Orie Steele, Hannes Tschofenig
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: JOSE, COSE
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: IETF, NIST
- **Compliance Frameworks Referenced**: US NIST FIPS 206, BCP 78, BCP 79, RFC7515, RFC7517, RFC9052, RFC9053
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: FN-DSA is a lattice-based signature scheme defined in US NIST FIPS 206; The document registers FN-DSA-512 and FN-DSA-1024 algorithms for JOSE and COSE; Only the pure mode of FN-DSA is specified, not pre-hash modes; Implementations must ensure constant-time Gaussian sampling to avoid side-channel leakage; Key and signature sizes are compact compared to other schemes
- **Security Levels & Parameters**: FN-DSA-512, FN-DSA-1024
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: FN-DSA-512 signature size 666 bytes; FN-DSA-512 public key size 897 bytes; FN-DSA-512 private key size 1281 bytes; FN-DSA-1024 signature size 1280 bytes; FN-DSA-1024 public key size 1793 bytes; FN-DSA-1024 private key size 2305 bytes
- **Target Audience**: Developer, Security Architect, Researcher
- **Implementation Prerequisites**: Careful implementation to avoid side-channel leakage; Constant-time Gaussian sampling where applicable; Use of COSE Hash Envelope for large payloads instead of pre-hash mode
- **Relevant PQC Today Features**: Algorithms, digital-id, api-security-jwt, entropy-randomness

---

## draft-sfluhrer-ipsecme-ikev2-mldsa-01

- **Reference ID**: draft-sfluhrer-ipsecme-ikev2-mldsa-01
- **Title**: Post-quantum Digital Signatures with ML-DSA in IKEv2
- **Authors**: IETF IPSECME WG
- **Publication Date**: 2025-01-01
- **Last Updated**: 2026-03-25
- **Document Status**: Internet-Draft (Individual Submission)
- **Main Topic**: Defines the use of ML-DSA (FIPS 204) for digital signatures in the IKE_AUTH phase of IKEv2 to enable post-quantum authentication.
- **PQC Algorithms Covered**: ML-DSA
- **Quantum Threats Addressed**: Cryptographically Relevant Quantum Computer (CRQC)
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Scott Fluhrer
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: IKEv2, IPsec
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST, IETF
- **Compliance Frameworks Referenced**: FIPS 204
- **Classical Algorithms Referenced**: RSA, ECDSA
- **Key Takeaways**: ML-DSA is standardized by NIST and believed secure against quantum computers; IKEv2 authentication currently relies on vulnerable algorithms like RSA and ECDSA; This document describes integrating ML-DSA into the IKE_AUTH phase for post-quantum security.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms, vpn-ssh-pqc, Threats, Compliance

---

## draft-ietf-tls-mldsa-02

- **Reference ID**: draft-ietf-tls-mldsa-02
- **Title**: ML-DSA for TLS 1.3
- **Authors**: IETF TLS WG
- **Publication Date**: 2025-01-01
- **Last Updated**: 2026-03-25
- **Document Status**: Internet-Draft
- **Main Topic**: This memo specifies how the post-quantum signature scheme ML-DSA (FIPS 204) is used for authentication in TLS 1.3 via signature_algorithms and signature_algorithms_cert extensions.
- **PQC Algorithms Covered**: ML-DSA, ML-DSA-44, ML-DSA-65, ML-DSA-87
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Tim Hollebeek; Sophie Schmieg; Bas Westerbaan; Alicja Kario; John Mattsson; Rebecca Guthrie; Alexander Bokovoy; Niklas Block; Ryan Appel; Loganaden Velvindron; Nick Sullivan
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.3, TLS 1.2
- **Infrastructure Layers**: PKI
- **Standardization Bodies**: IETF, NIST
- **Compliance Frameworks Referenced**: FIPS 204, BCP 78, BCP 79, BCP 14
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: ML-DSA signature schemes are negotiated via signature_algorithms and signature_algorithms_cert extensions in TLS 1.3; Three new SignatureScheme values (mldsa44, mldsa65, mldsa87) correspond to FIPS 204 parameter sets; The context parameter for ML-DSA MUST be the empty string in TLS handshakes; These schemes MUST NOT be used in TLS 1.2 or earlier versions; Clients must terminate handshake with decrypt_error alert if signature or public key length is incorrect
- **Security Levels & Parameters**: ML-DSA-44, ML-DSA-65, ML-DSA-87
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect, Protocol Engineer
- **Implementation Prerequisites**: Support for TLS 1.3; Implementation of FIPS 204 ML-DSA algorithms; Adherence to RFC 8446 signature verification procedures
- **Relevant PQC Today Features**: Algorithms, tls-basics, pki-workshop, crypto-agility

---

## ENISA-Crypto-Market-Analysis-2024

- **Reference ID**: ENISA-Crypto-Market-Analysis-2024
- **Title**: Cryptographic Products and Services Market Analysis
- **Authors**: ENISA
- **Publication Date**: 2024-10-04
- **Last Updated**: 2024-11-01
- **Document Status**: Published
- **Main Topic**: Analysis of the EU cryptographic products and services market highlighting PQC readiness gaps and Cryptography-as-a-Service trends under the Cybersecurity Act.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: EU; Bodies: ENISA, European Commission
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Cybersecurity Act
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: ENISA identifies PQC readiness gaps across European stakeholders; The report analyzes the Cryptography-as-a-Service market trends; The analysis is conducted under the framework of the EU Cybersecurity Act; Market analysis covers both demand and supply sides for cryptographic products.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Private Sector, Policy Maker, Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: pqc-business-case, vendor-risk, compliance-strategy, migration-program, pqc-governance

---

## ENISA-State-of-Cybersecurity-2024

- **Reference ID**: ENISA-State-of-Cybersecurity-2024
- **Title**: 2024 Report on the State of Cybersecurity in the Union
- **Authors**: ENISA
- **Publication Date**: 2024-12-03
- **Last Updated**: 2024-12-03
- **Document Status**: Published
- **Main Topic**: The first biennial NIS2-mandated report providing an evidence-based overview of the cybersecurity landscape in the EU and identifying PQC as a top emerging technology topic where stakeholders remain underprepared.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: European Union; Bodies: ENISA, NIS Cooperation Group, European Commission
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Directive (EU) 2022/2555 (NIS2), eIDAS regulation
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: PQC is identified as a top emerging technology topic; Most European stakeholders remain underprepared for the quantum transition; Policy recommendations are needed to address identified shortcomings in cybersecurity capabilities.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, National / EU authorities
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, Compliance, Assess, pqc-risk-management, migration-program

---
