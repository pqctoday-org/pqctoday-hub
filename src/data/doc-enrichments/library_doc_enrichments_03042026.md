---
generated: 2026-03-04
collection: library
documents_processed: 15
enrichment_method: ollama-qwen3.5:27b
---

## RFC-9763

- **Reference ID**: RFC-9763
- **Title**: Related Certificates for Use in Multiple Authentications within a Protocol
- **Authors**: IETF LAMPS; Alison Becker (NSA); Rebecca Guthrie (NSA); Michael Jenkins (NSA)
- **Publication Date**: 2022-03-21
- **Last Updated**: 2025-06-13
- **Document Status**: Proposed Standard
- **Main Topic**: Defines a CSR attribute and X.509 extension to bind two certificates to the same end entity for non-composite hybrid authentication.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: A. Becker; R. Guthrie; M. Jenkins
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: CMS; S/MIME; TLS; IKEv2
- **Infrastructure Layers**: PKI
- **Standardization Bodies**: IETF; IESG
- **Compliance Frameworks Referenced**: BCP 78; RFC 5280; RFC 2119; RFC 8174; RFC 6019; RFC 5652; RFC 2397; RFC 8551; NIST-SP-800-57
- **Classical Algorithms Referenced**: RSA; ECC; SHA512
- **Key Takeaways**: Defines relatedCertRequest attribute to attest ownership of a previously issued certificate; Introduces RelatedCertificate extension to signal association between two certificates in X.509; Enables non-composite hybrid authentication by allowing separate traditional and PQC certificates; Requires CA to verify signature over certID and requestTime to ensure entity control; Supports transition strategies where entities migrate from traditional cryptography to post-quantum cryptography
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Non-composite hybrid authentication; catalyst approach; separate traditional and PQC certificates
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Compliance Officer; Policy Maker
- **Implementation Prerequisites**: Support for relatedCertRequest CSR attribute; Support for RelatedCertificate X.509 extension; CA capability to retrieve and validate certificate paths per RFC 5280; RA attestation of private key ownership; Time synchronization between CA and RA for BinaryTime freshness
- **Relevant PQC Today Features**: pki-workshop; hybrid-crypto; migration-program; tls-basics; email-signing

---

## draft-bonnell-lamps-chameleon-certs-07

- **Reference ID**: draft-bonnell-lamps-chameleon-certs-07
- **Title**: A Mechanism for Encoding Differences in Paired Certificates (Chameleon Certs)
- **Authors**: IETF LAMPS; Corey Bonnell (DigiCert); John Gray (Entrust); D. Hook (KeyFactor); Tomofumi Okubo (DigiCert); Mike Ounsworth (Entrust)
- **Publication Date**: 2023-05-31
- **Last Updated**: 2025-10-18
- **Document Status**: Active Internet-Draft
- **Main Topic**: Defines an X.509v3 extension mechanism to encode differences between paired certificates, allowing reconstruction of both traditional and PQC certificates from a single certificate.
- **PQC Algorithms Covered**: ML-DSA-65
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Corey Bonnell, John Gray, D. Hook, Tomofumi Okubo, Mike Ounsworth
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509, PKCS #10
- **Infrastructure Layers**: PKI
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: BCP 78, BCP 79, RFC 5280, RFC 2119, RFC 8174
- **Classical Algorithms Referenced**: EC P-521
- **Key Takeaways**: The mechanism encodes only differences between paired certificates to achieve space savings over full certificate encoding; Relying parties can reconstruct both traditional and PQC certificates from a single Base Certificate without changing path validation algorithms; The approach supports algorithm migration by allowing subjects to hold multiple keys of different types in a single certificate structure; Backward compatibility is maintained by selecting which certificate (Base or Delta) to send based on recipient capabilities.
- **Security Levels & Parameters**: ML-DSA-65, EC P-521
- **Hybrid & Transition Approaches**: Paired certificates, encoding differences between certificates, algorithm migration, backward compatibility via certificate selection
- **Performance & Size Considerations**: Space savings realized by encoding only differences between paired certificates rather than the entire paired certificate
- **Target Audience**: Security Architect, Developer, PKI Administrator
- **Implementation Prerequisites**: Support for X.509 v3 extensions; Ability to process PKCS #10 Certificate Signing Request attributes; Capability to reconstruct Delta Certificates from Base Certificates
- **Relevant PQC Today Features**: pki-workshop, migration-program, hybrid-crypto, crypto-agility, algorithms

---

## RFC-9909

- **Reference ID**: RFC-9909
- **Title**: Profile for Use of SLH-DSA in the Internet X.509 PKI
- **Authors**: IETF LAMPS; Jake Massimo (AWS); Scott Fluhrer (Cisco)
- **Publication Date**: 2025-10-01
- **Last Updated**: 2025-10-01
- **Document Status**: Proposed Standard
- **Main Topic**: Defines X.509 algorithm identifiers and parameter conventions for all 12 SLH-DSA parameter sets including Pure and Hash modes.
- **PQC Algorithms Covered**: SLH-DSA, SPHINCS+
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; NIST; IETF
- **Leaders Contributions Mentioned**: K. Bashiri; S. Fluhrer; S. Gazdag; D. Van Geest; S. Kousidis
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509
- **Infrastructure Layers**: PKI
- **Standardization Bodies**: IETF; NIST
- **Compliance Frameworks Referenced**: FIPS 205; FIPS 180; FIPS 202; BCP 78; BCP 14; RFC 2119; RFC 8174; RFC 5912; RFC 5280; RFC 9814
- **Classical Algorithms Referenced**: SHA-2; SHAKE256; SHA-256; SHA-512; SHAKE128
- **Key Takeaways**: SLH-DSA offers three security levels corresponding to 128, 192, and 256-bit generic block cipher security; The document specifies separate OIDs for Pure SLH-DSA and HashSLH-DSA modes with distinct parameter combinations; Parameters component in AlgorithmIdentifier MUST be absent for SLH-DSA implementations; Context string usage is restricted to the empty string for X.509 PKI applications; Small versions optimize signature size while fast versions optimize key generation and signing speed.
- **Security Levels & Parameters**: 128-bit security level; 192-bit security level; 256-bit security level; id-slh-dsa-sha2-128s; id-slh-dsa-sha2-128f; id-slh-dsa-sha2-192s; id-slh-dsa-sha2-192f; id-slh-dsa-sha2-256s; id-slh-dsa-sha2-256f; id-slh-dsa-shake-128s; id-slh-dsa-shake-128f; id-slh-dsa-shake-192s; id-slh-dsa-shake-192f; id-slh-dsa-shake-256s; id-slh-dsa-shake-256f
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Context string maximum length 255 bytes; SHAKE128 output length 256 bits; SHAKE256 output length 512 bits
- **Target Audience**: Security Architect; Developer; Compliance Officer
- **Implementation Prerequisites**: Support for ASN.1 syntax compatible with RFC 5912 and X680; Implementation of FIPS 205 algorithms slh_sign, slh_verify, hash_slh_sign, hash_slh_verify; Absent parameters rule enforcement in AlgorithmIdentifier
- **Relevant PQC Today Features**: Algorithms; pki-workshop; stateful-signatures; digital-id; compliance

---

## KpqC-Competition-Results

- **Reference ID**: KpqC-Competition-Results
- **Title**: Korean Post-Quantum Cryptography Competition Final Results
- **Authors**: KISA; Ministry of Science and ICT; NIS Korea
- **Publication Date**: 2025-01-31
- **Last Updated**: 2025-01-31
- **Document Status**: Final Results
- **Main Topic**: Announcement of eight algorithms advancing to Round 2 of the KpqC Competition following evaluation of Round 1 submissions in South Korea.
- **PQC Algorithms Covered**: AIMer, NTRU+, HAETAE, PALOMA, MQ-Sign, REDOG, NCC-Sign, SMAUG+TiGER, Layered ROLLO-I, Enhanced pqsigRM, FIBS, GCKSign, Peregrine, SOLMAE
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: South Korea; Bodies: KpqC team, 양자내성암호연구단
- **Leaders Contributions Mentioned**: Jieun Ryu, Yongbhin Kim, Seungtai Yoon, Ju-Sung Kang, Yongjin Yeom, Chanki Kim, Young-Sik Kim, Jonghyun Kim, Jong Hwan Park, Dong-Chan Kim, Chang-Yeol Jeon, Yeonghyo Kim, Minji Kim, Jon-Lark Kim, Jihoon Hong, Terry Shue Chien Lau, YounJae Lim, Chik How Tan, Theo Fanuela Prabowo, Byung-Sun Won, Jung Hee Cheon, Hyeongmin Choe, Dongyeon Hong, Jeongdae Hong, Hyoeun Seong, Junbum Shin, MinJune Yi, Seunghwan Park, Chi-Gon Jung, Aesun Park, Joongeun Choi, Honggoo Kang, Seongkwang Kim, Jincheol Ha, Mincheol Son, Byeonghak Lee, Dukjae Moon, Joohee Lee, Sangyub Lee, Jihoon Kwon, Jihoon Cho, Hyojin Yoon, Jooyoung Lee, Jong-Seon No, Jinkyu Cho, Yongwoo Lee, Zahyun Koo, Suhri Kim, Youngdo Lee, Kisoon Yoon, Kwangsu Lee, Dong-Guk Han, Hwajeong Seo, Joo Woo, Julien Devevey, Tim Güneysu, Markus Krausz, Georg Land, Damien Stehlé, Kyung-Ah Shim, Jeongsu Kim, Youngjoo An, Eun-Young Seo, Joon-Woo Lee, Kwangjo Kim, Mehdi Tibouchi, Alexandre Wallet, Thomas Espitau, Akira Takahashi, Yang Yu, Sylvain Guilley
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: KpqC Competition Round 1 concluded with eight algorithms advancing to Round 2; Public scrutiny and analysis contributed to better outcomes in the competition; The selected candidates include both digital signature and PKE/KEM algorithms; Implementation packages and IPCC documents are available for all submissions; The competition aims to mature the PQC field in South Korea
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Researcher, Developer, Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms, Leaders, Timeline

---

## NIST-FIPS140-3-IG-PQC

- **Reference ID**: NIST-FIPS140-3-IG-PQC
- **Title**: FIPS 140-3 Implementation Guidance for Post-Quantum Cryptography
- **Authors**: NIST CMVP
- **Publication Date**: 2025-09-02
- **Last Updated**: 2025-09-02
- **Document Status**: Published Update
- **Main Topic**: Updated FIPS 140-3 Implementation Guidance adding self-test requirements for FIPS 203/204/205 PQC algorithms and new guidance for Key Encapsulation Mechanisms.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; Canada; National Institute of Standards and Technology; Canadian Centre for Cyber Security
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.2
- **Infrastructure Layers**: Cryptographic Module Validation Program; Cryptographic Algorithm Validation Program; Key Encapsulation Mechanisms
- **Standardization Bodies**: National Institute of Standards and Technology; Canadian Centre for Cyber Security; ISO/IEC
- **Compliance Frameworks Referenced**: FIPS 140-3; FIPS 203; FIPS 204; FIPS 205; FIPS 186-5; SP 800-140; SP 800-38D; SP 800-38E; SP 800-38G; SP 800-186; SP 800-107; SP 800-208; SP 800-90B; SP 800-90A; SP 800-108; SP 800-132; SP 800-56CREV2; SP 800-67REV2; SP 800-63B; ISO/IEC 24759:2017(E)
- **Classical Algorithms Referenced**: RSA; Triple-DES; HMAC; AES; XTS-AES; Elliptic Curves; FFC Safe-Prime Groups
- **Key Takeaways**: Guidance includes new self-test requirements for FIPS 203/204/205 algorithms; Key Encapsulation Mechanisms are explicitly addressed in the guidance; The document clarifies testing requirements for cryptographic modules under FIPS 140-3; Transition from FIPS 186-4 to FIPS 186-5 is covered in Annex C.K
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Transition of the TLS 1.2 KDF to support the Extended Master Secret; Transition from FIPS 186-4 to FIPS 186-5 and SP 800-186
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer; Security Architect; Developer; Researcher
- **Implementation Prerequisites**: FIPS 140-3 conformance; NVLAP accredited Cryptographic and Security Testing Laboratories; Approved Security Functions per SP 800-140 series
- **Relevant PQC Today Features**: Compliance, Algorithms, Migrate, Assess, entropy-randomness

---

## 3GPP-PQC-Study-2025

- **Reference ID**: 3GPP-PQC-Study-2025
- **Title**: Study on Preparing for Transition to Post Quantum Cryptography in 3GPP
- **Authors**: 3GPP SA3
- **Publication Date**: 2025-05-01
- **Last Updated**: 2025-05-01
- **Document Status**: Study Item Approved
- **Main Topic**: Study on preparing for the transition to Post Quantum Cryptography in 3GPP by integrating standalone or hybrid PQC algorithms into existing 5G security protocols.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: 3GPP
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, IPSec, IKEv2
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: 3GPP
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Study covers integration of standalone or hybrid PQC algorithms into 5G security protocols; Focus includes TLS, IPSec, and IKEv2; References TR 33.841 PQC Study for further details
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid PQC integration
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Researcher, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: 5g-security; hybrid-crypto; tls-basics; vpn-ssh-pqc

---

## liboqs-v0.15.0

- **Reference ID**: liboqs-v0.15.0
- **Title**: Open Quantum Safe liboqs Library v0.15.0
- **Authors**: Open Quantum Safe; Linux Foundation PQCA
- **Publication Date**: 2025-11-14
- **Last Updated**: 2025-11-14
- **Document Status**: Released
- **Main Topic**: Open Quantum Safe liboqs is an open source C library providing implementations of quantum-safe key encapsulation and digital signature algorithms with a common API.
- **PQC Algorithms Covered**: BIKE, Classic McEliece, CROSS, Falcon, FrodoKEM, HQC, Kyber, LMS, MAYO, ML-DSA, ML-KEM, NTRU, NTRU-Prime, SLH-DSA, SNOVA, UOV, XMSS
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: liboqs, PQClean
- **Protocols Covered**: TLS, SSH, X.509, CMS, S/MIME
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: liboqs provides a common API to easily switch between post-quantum algorithms; implementations are derived from reference and optimized code submitted to the NIST Post-Quantum Cryptography Standardization Project; the library supports Linux, macOS, and Windows on x86_64 and ARM architectures; version 0.15.0 includes updated implementations of NIST-standardized ML-KEM, ML-DSA, and SLH-DSA
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect
- **Implementation Prerequisites**: clang compiler; gcc compiler; Microsoft compilers; x86_64 architecture; ARM architecture; Linux operating system; macOS operating system; Windows operating system
- **Relevant PQC Today Features**: Algorithms, tls-basics, vpn-ssh-pqc, email-signing, pki-workshop

---

## FIPS 203

- **Reference ID**: FIPS 203
- **Title**: Module-Lattice-Based Key-Encapsulation Mechanism Standard (ML-KEM)
- **Authors**: NIST
- **Publication Date**: 2023-08-24
- **Last Updated**: 2024-08-13
- **Document Status**: Final Standard
- **Main Topic**: This document specifies the Module-Lattice-Based Key-Encapsulation Mechanism Standard (ML-KEM) with three parameter sets for quantum-resistant key establishment.
- **PQC Algorithms Covered**: ML-KEM, CRYSTALS-KYBER
- **Quantum Threats Addressed**: Adversaries who possess a quantum computer
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; Federal agencies; contractors of an agency
- **Leaders Contributions Mentioned**: Gina M. Raimondo, Secretary; Laurie E. Locascio, NIST Director and Under Secretary of Commerce for Standards and Technology; Kevin M. Stine, Director Information Technology Laboratory
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key establishment; shared secret key generation
- **Standardization Bodies**: National Institute of Standards and Technology (NIST); Department of Commerce
- **Compliance Frameworks Referenced**: Federal Information Processing Standards (FIPS); Federal Information Security Management Act (FISMA); SP 800-140C; SP 800-227
- **Classical Algorithms Referenced**: SHAKE128
- **Key Takeaways**: ML-KEM is the standardized algorithm for quantum-resistant key encapsulation with three parameter sets; Implementations must guard against disclosure of randomness, decapsulation keys, and shared secret keys; NIST will formally reevaluate this standard every five years; Conformance to the standard does not guarantee overall system security; The standard applies to federal agencies and is available for private adoption.
- **Security Levels & Parameters**: ML-KEM-512; ML-KEM-768; ML-KEM-1024
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Sizes of keys and ciphertexts are defined in Table 3; Decapsulation failure rates are defined in Table 1; Performance decreases as security strength increases from ML-KEM-512 to ML-KEM-1024
- **Target Audience**: Security Architect, Developer, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: Conformity with approved cryptographic algorithms per FIPS or SP 800-140C; adherence to export controls by Bureau of Industry and Security; awareness of patent license agreements for CRYSTALS-KYBER
- **Relevant PQC Today Features**: Algorithms, Compliance, Migrate, Assess, pqc-risk-management

---

## FIPS 204

- **Reference ID**: FIPS 204
- **Title**: Module-Lattice-Based Digital Signature Standard (ML-DSA)
- **Authors**: NIST
- **Publication Date**: 2023-08-24
- **Last Updated**: 2024-08-13
- **Document Status**: Final Standard
- **Main Topic**: This document specifies the Module-Lattice-Based Digital Signature Standard (ML-DSA) with three parameter sets for generating and verifying digital signatures secure against quantum computers.
- **PQC Algorithms Covered**: ML-DSA
- **Quantum Threats Addressed**: Adversaries in possession of a large-scale quantum computer
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; federal departments and agencies
- **Leaders Contributions Mentioned**: Gina M. Raimondo, Secretary; Laurie E. Locascio, NIST Director and Under Secretary of Commerce for Standards and Technology; Kevin M. Stine, Director Information Technology Laboratory
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: National Institute of Standards and Technology; Department of Commerce
- **Compliance Frameworks Referenced**: FIPS 204; FIPS 205; FIPS 186-5; NIST Special Publication 800-208; SP 800-140C; Federal Information Security Management Act (FISMA)
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: ML-DSA is approved for protecting sensitive unclassified information in federal systems; Implementations must employ cryptographic algorithms approved for Federal Government-sensitive information; Digital signature key pairs shall not be used for other purposes; The standard will be reviewed every five years to assess its adequacy; Conformance to the standard does not ensure that a particular implementation is secure.
- **Security Levels & Parameters**: ML-DSA parameter sets 44, 65, 87
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Sizes of keys and signatures defined in Table 2; No floating-point arithmetic permitted
- **Target Audience**: Security Architect, Developer, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: Use of approved cryptographic algorithms per FIPS or NIST recommendations; Maintenance of private key secrecy; Validation program conformance testing
- **Relevant PQC Today Features**: Algorithms, Compliance, Migrate, digital-id, code-signing

---

## FIPS 205

- **Reference ID**: FIPS 205
- **Title**: Stateless Hash-Based Digital Signature Standard (SLH-DSA)
- **Authors**: NIST
- **Publication Date**: 2023-08-24
- **Last Updated**: 2024-08-13
- **Document Status**: Final Standard
- **Main Topic**: This document specifies the Stateless Hash-Based Digital Signature Standard (SLH-DSA) based on SPHINCS+ for federal and commercial use.
- **PQC Algorithms Covered**: SLH-DSA, SPHINCS+, WOTS+, XMSS, FORS
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; Federal departments and agencies
- **Leaders Contributions Mentioned**: Gina M. Raimondo (Secretary of Commerce); Laurie E. Locascio (NIST Director); Kevin M. Stine (Director, Information Technology Laboratory)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: National Institute of Standards and Technology (NIST), Department of Commerce
- **Compliance Frameworks Referenced**: FIPS 205, FIPS 204, FIPS 186-5, NIST Special Publication 800-208, SP 800-140C, Federal Information Security Management Act (FISMA)
- **Classical Algorithms Referenced**: SHAKE, SHA2
- **Key Takeaways**: SLH-DSA is a stateless hash-based signature scheme selected for standardization by NIST; The standard specifies 12 parameter sets using SHAKE and SHA2; Implementation conformance does not guarantee overall system security; Federal agencies must use this standard or FIPS 204/FIPS 186-5/SP 800-208 for public-key signature systems; Private keys must be guarded to ensure the security of the digital signature system.
- **Security Levels & Parameters**: Security Category 1, Security Categories 3 and 5, SLH-DSA Using SHAKE, SLH-DSA Using SHA2
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Larger signatures compared to stateful alternatives; No specific byte sizes provided in text
- **Target Audience**: Security Architect, Developer, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: Approved cryptographic algorithms per FIPS or NIST recommendations; Conformance to validation program procedures; Secure design and build of implementation modules
- **Relevant PQC Today Features**: Algorithms, Compliance, stateful-signatures, digital-id, code-signing

---

## FIPS 186-5

- **Reference ID**: FIPS 186-5
- **Title**: Digital Signature Standard (DSS)
- **Authors**: NIST
- **Publication Date**: 2023-02-03
- **Last Updated**: 2025-05-12
- **Document Status**: Final Standard
- **Main Topic**: FIPS 186-5 specifies the Digital Signature Standard (DSS) algorithms including RSA, ECDSA, and EdDSA while removing DSA for federal use.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: FIPS 186-4 remains in effect for one year following publication before withdrawal; standard effective February 3, 2023.
- **Applicable Regions / Bodies**: United States; National Institute of Standards and Technology; Department of Commerce; federal departments and agencies.
- **Leaders Contributions Mentioned**: Gina M. Raimondo (Secretary); Laurie E. Locascio (NIST Director); Charles H. Romine (Director, Information Technology Laboratory).
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Public key-based signature systems; Cryptographic Module Validation Program.
- **Standardization Bodies**: National Institute of Standards and Technology; Department of Commerce.
- **Compliance Frameworks Referenced**: FIPS 186-5; FIPS 186-4; FIPS 180; FIPS 202; FIPS 140-3; Federal Information Security Management Act (FISMA).
- **Classical Algorithms Referenced**: RSA; ECDSA; EdDSA; DSA; SHA-3.
- **Key Takeaways**: DSA is removed from the Digital Signature Standard suite; RSA, ECDSA, and EdDSA are the approved algorithms for digital signatures; FIPS 186-4 remains valid for one year to facilitate transition; private keys must be kept secret to ensure signature security; standard applies to federal departments and is available for private adoption.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: One-year overlap period allowing agencies to use either FIPS 186-5 or FIPS 186-4.
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Compliance Officer, Developer, Policy Maker
- **Implementation Prerequisites**: Use of approved hash functions from FIPS 180 or FIPS 202; conformance to FIPS 140-3 for cryptographic modules; validation through Cryptographic Module Validation Program.
- **Relevant PQC Today Features**: Compliance, Migrate, Algorithms, digital-id, code-signing

---

## NIST SP 800-208

- **Reference ID**: NIST SP 800-208
- **Title**: Recommendation for Stateful Hash-Based Signature Schemes
- **Authors**: NIST
- **Publication Date**: 2020-10-29
- **Last Updated**: 2020-10-29
- **Document Status**: Final
- **Main Topic**: This recommendation specifies the Leighton-Micali Signature (LMS) and eXtended Merkle Signature Scheme (XMSS) stateful hash-based signature algorithms for digital signatures.
- **PQC Algorithms Covered**: LMS, XMSS, HSS, XMSSMT, LM-OTS, WOTS+
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; National Institute of Standards and Technology; U.S. Department of Commerce; Office of Management and Budget
- **Leaders Contributions Mentioned**: David A. Cooper; Daniel C. Apon; Quynh H. Dang; Michael S. Davidson; Morris J. Dworkin; Carl A. Miller
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management; Cryptographic Module Validation Program; Cryptographic Algorithm Validation Program
- **Standardization Bodies**: National Institute of Standards and Technology
- **Compliance Frameworks Referenced**: Federal Information Security Modernization Act (FISMA); OMB Circular A-130; Cryptographic Algorithm Validation Program (CAVP); Cryptographic Module Validation Program (CMVP)
- **Classical Algorithms Referenced**: SHA-256; SHAKE256
- **Key Takeaways**: Stateful hash-based signature schemes require strict maintenance of state to prevent key reuse; LMS and XMSS are specified with parameter sets using SHA-256 and SHAKE256; Conformance testing for implementations must follow CAVP and CMVP frameworks; The document defines requirements for one-time signature systems and Merkle tree structures.
- **Security Levels & Parameters**: SHA-256; SHA-256/192; SHAKE256/256; SHAKE256/192
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Compliance Officer; Researcher
- **Implementation Prerequisites**: Conformance testing within CAVP and CMVP frameworks; Proper maintenance of state for one-time signature systems; Random number generation requirements for keys and signatures
- **Relevant PQC Today Features**: Algorithms, stateful-signatures, compliance, merkle-tree-certs, entropy-randomness

---

## NIST SP 800-227

- **Reference ID**: NIST SP 800-227
- **Title**: Recommendations for Key-Encapsulation Mechanisms
- **Authors**: NIST
- **Publication Date**: 2025-09-18
- **Last Updated**: 2025-09-18
- **Document Status**: Final
- **Main Topic**: This document provides recommendations for implementing and using Key-Encapsulation Mechanisms (KEMs) securely, including hybrid KEMs and FIPS 140 validation requirements.
- **PQC Algorithms Covered**: ML-KEM
- **Quantum Threats Addressed**: Cryptographic attacks that make use of a large-scale, cryptanalytically relevant quantum computer
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; National Institute of Standards and Technology; U.S. Department of Commerce; Office of Management and Budget
- **Leaders Contributions Mentioned**: Gorjan Alagic; Elaine Barker; Lily Chen; Dustin Moody; Angela Robinson; Hamilton Silberg; Noah Waller
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key establishment; FIPS 140 validated cryptographic modules
- **Standardization Bodies**: National Institute of Standards and Technology
- **Compliance Frameworks Referenced**: Federal Information Security Modernization Act (FISMA) of 2014; OMB Circular A-130; FIPS 140; FIPS 203; NIST Special Publication 800-56A; NIST Special Publication 800-56B
- **Classical Algorithms Referenced**: Diffie-Hellman; RSA
- **Key Takeaways**: KEMs are the preferred post-quantum key-establishment schemes for standardization and widespread deployment; Implementations of approved KEMs must satisfy requirements for FIPS 140 validated cryptographic modules; Vendors should securely combine keying material from post-quantum methods with other potentially quantum-vulnerable methods using approved key combiners; Shared secret keys established via KEMs are used with symmetric-key algorithms for encryption and authentication.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Multi-Algorithm KEMs; PQ/T Hybrids; Composite KEM; Approved Key Combiners
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Compliance Officer; Policy Maker
- **Implementation Prerequisites**: FIPS 140 validated cryptographic modules; Approved key combiners for composite schemes
- **Relevant PQC Today Features**: Algorithms; hybrid-crypto; compliance-strategy; migration-program; pqc-risk-management

---

## NIST IR 8547

- **Reference ID**: NIST IR 8547
- **Title**: Transition to Post-Quantum Cryptography Standards
- **Authors**: NIST
- **Publication Date**: 2024-11-12
- **Last Updated**: 2024-11-12
- **Document Status**: Initial Public Draft
- **Main Topic**: NIST's roadmap and strategy for transitioning from quantum-vulnerable cryptographic algorithms to post-quantum digital signature algorithms and key-establishment schemes.
- **PQC Algorithms Covered**: Module-Lattice-Based Key-Encapsulation Mechanism, Module-Lattice-Based Digital Signature Algorithm, Stateless Hash-Based Signature Algorithm
- **Quantum Threats Addressed**: harvest now, decrypt later; future quantum computing breaking current algorithms
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; National Institute of Standards and Technology; federal agencies
- **Leaders Contributions Mentioned**: Dustin Moody; Ray Perlner; Andrew Regenscheid; Angela Robinson; David Cooper
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: PKI; Cryptographic Hardware; Software Cryptographic Libraries; IT Applications and Services
- **Standardization Bodies**: National Institute of Standards and Technology
- **Compliance Frameworks Referenced**: FIPS203; FIPS204; FIPS205
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Transition to post-quantum cryptography is urgent due to the harvest now, decrypt later threat; The journey from algorithm standardization to full integration can take 10 to 20 years; NIST has released three PQC standards to initiate the transition phase; Organizations must plan for the deprecation and eventual removal of quantum-vulnerable algorithms
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid Key-Establishment Techniques; Hybrid Digital Signature Techniques
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Compliance Officer; Policy Maker; Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Threats; Migrate; Algorithms; hybrid-crypto

---

## NIST IR 8545

- **Reference ID**: NIST IR 8545
- **Title**: Status Report on the Fourth Round of the NIST PQC Standardization Process
- **Authors**: NIST
- **Publication Date**: 2025-03-11
- **Last Updated**: 2025-03-11
- **Document Status**: Final
- **Main Topic**: NIST selects HQC as the fourth-round post-quantum key-establishment algorithm for standardization to augment its cryptographic portfolio.
- **PQC Algorithms Covered**: BIKE, Classic McEliece, HQC, SIKE, CRYSTALS-Kyber, ML-KEM, CRYSTALS-Dilithium, ML-DSA, Falcon, FN-DSA, SPHINCS+, SLH-DSA
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: March 2025: Announcement of fourth-round candidate algorithm to be standardized; July 2022: Announcement of candidate algorithms advancing to the fourth round; August 2024: Final versions of FIPS 203, FIPS 204, and FIPS 205 published
- **Applicable Regions / Bodies**: United States; National Institute of Standards and Technology (NIST); U.S. Department of Commerce; federal agencies
- **Leaders Contributions Mentioned**: Gorjan Alagic, Maxime Bros, Pierre Ciadoux, David Cooper, Quynh Dang, Thinh Dang, John Kelsey, Jacob Lichtinger, Yi-Kai Liu, Carl Miller, Dustin Moody, Rene Peralta, Ray Perlner, Angela Robinson, Hamilton Silberg, Daniel Smith-Tone, Noah Waller, Zuzana Bajcsy, Lily Chen, Morris Dworkin, Sara Kerman, Andrew Regenscheid
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: FIPS 186-5, SP 800-56Ar3, SP 800-56Br2, FIPS 203, FIPS 204, FIPS 205, SP 800-227
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: HQC is the only fourth-round key-establishment algorithm selected for standardization; SIKE was acknowledged as insecure by its submitters and not standardized; NIST aims to provide cryptographic diversity with code-based algorithms alongside lattice-based standards; Federal agencies may use concepts from this report before companion publications are completed; The selection process relied on public feedback and internal reviews of security, cost, and performance
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Performance data for BIKE, HQC, and Classic McEliece provided in thousands of cycles on x86_64; Key and ciphertext sizes in bytes provided for BIKE, HQC, and Classic McEliece
- **Target Audience**: Security Architect, Researcher, Policy Maker, Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline, Algorithms, Leaders, Compliance, Migrate

---

## HQC Specification

- **Reference ID**: HQC Specification
- **Title**: Hamming Quasi-Cyclic (HQC) Algorithm Specification
- **Authors**: NIST/HQC Team
- **Publication Date**: 2024-02-23
- **Last Updated**: 2025-08-22
- **Document Status**: NIST Round 4 Selection
- **Main Topic**: Specification and design evolution of the Hamming Quasi-Cyclic (HQC) code-based Key Encapsulation Mechanism selected as a backup to ML-KEM.
- **PQC Algorithms Covered**: HQC, HQC-PKE, HQC-KEM, HQC-RMRS
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Selected March 2025; Draft FIPS expected 2026; Final FIPS expected 2027
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Philippe Gaborit, Carlos Aguilar-Melchor, Nicolas Aragon, Slim Bettaieb, Loïc Bidoux, Olivier Blazy, Jean-Christophe Deneuville, Edoardo Persichetti, Gilles Zémor, Jurjen Bos, Arnaud Dion, Jérôme Lacan, Jean-Marc Robert, Pascal Véron, Paulo L. Barreto, Santosh Ghosh, Shay Gueron, Tim Güneysu, Rafael Misoczki, Jan Richter-Brokmann, Nicolas Sendrier, Jean-Pierre Tillich, Valentin Vasseur
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: FIPS-203
- **Classical Algorithms Referenced**: SHA3-512, SHAKE256
- **Key Takeaways**: HQC is a code-based KEM selected as a backup to ML-KEM with final standardization expected in 2027; The scheme uses the salted SFO transform and updated keypair formats to improve security against multi-target attacks; Parameter sets were adjusted to target security levels of 128 and 192 bits rather than 256; Implementation updates include refactoring for readability and aligning with FIPS-203 design choices such as using SHA3-512.
- **Security Levels & Parameters**: Security levels 128 and 192; K and theta sizes reduced to 32 bytes; DFR lower than 2^-128
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: K and theta sizes reduced from 40 to 32 bytes; First 32 bytes of public key used for countermeasures; Performance gains in hardware implementation via variable sampling order modification
- **Target Audience**: Researcher, Developer, Security Architect
- **Implementation Prerequisites**: Source code available at https://pqc-hqc.org; Use of SHA3-512 instead of SHAKE256; Adoption of salted SFO transform
- **Relevant PQC Today Features**: Algorithms, Timeline, Leaders, Assess, pqc-101

---

## RFC 9629

- **Reference ID**: RFC 9629
- **Title**: Using Key Encapsulation Mechanism (KEM) Algorithms in CMS
- **Authors**: IETF LAMPS
- **Publication Date**: 2024-08-01
- **Last Updated**: 2024-08-01
- **Document Status**: Proposed Standard
- **Main Topic**: Defines the KEMRecipientInfo structure and conventions for using Key Encapsulation Mechanism algorithms, including ML-KEM, in Cryptographic Message Syntax (CMS).
- **PQC Algorithms Covered**: ML-KEM
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: R. Housley; J. Gray; T. Okubo
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: CMS; X.509; HKDF
- **Infrastructure Layers**: PKI; Key Management
- **Standardization Bodies**: IETF; IESG
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: KEM algorithms enable one-pass store-and-forward key transport without requiring simultaneous online presence; The KEMRecipientInfo structure uses a pairwise shared secret as input to a Key Derivation Function to produce a Key Encryption Key; Implementations must support both issuerAndSerialNumber and subjectKeyIdentifier alternatives for recipient certificate identification; Security depends on the KEM algorithm resisting adaptive chosen ciphertext attacks and matching security levels of the KDF and key-encryption algorithm; The version number in CMS structures must be set to 0 for KEMRecipientInfo.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: kekLength INTEGER (1..65535)
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: Implement KEM Encapsulate function for originators; Implement KEM KeyGen and Decapsulate functions for recipients; Support both issuerAndSerialNumber and subjectKeyIdentifier alternatives for recipient processing; Confirm kekLength consistency with key-encryption algorithm.
- **Relevant PQC Today Features**: Algorithms; pki-workshop; hybrid-crypto; crypto-agility; tls-basics

---

## RFC 9708

- **Reference ID**: RFC 9708
- **Title**: Use of the HSS/LMS Hash-Based Signature Algorithm in CMS
- **Authors**: IETF LAMPS
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Standards Track
- **Main Topic**: This document specifies conventions for using the HSS/LMS hash-based signature algorithm with the Cryptographic Message Syntax (CMS) and obsoletes RFC 8708.
- **PQC Algorithms Covered**: HSS, LMS, LM-OTS
- **Quantum Threats Addressed**: cryptographically relevant quantum computers (CRQCs); advances in cryptanalysis; threat to discrete logarithms and factoring based algorithms
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: R. Housley
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: CMS, X.509
- **Infrastructure Layers**: PKI; Key Management
- **Standardization Bodies**: Internet Engineering Task Force (IETF); IESG; IANA
- **Compliance Frameworks Referenced**: BCP 78; Revised BSD License
- **Classical Algorithms Referenced**: RSA; DSA; ECDSA; EdDSA; SHA-256; SHAKE256
- **Key Takeaways**: HSS/LMS signatures are post-quantum secure as they rely on hash functions rather than discrete logarithms or factoring; The algorithm supports fixed signing operations dependent on tree size with small public keys but large signatures; Public key distribution in X.509 certificates is now supported with specific key usage extension requirements; Parameter sets utilize SHA-256 and SHAKE256 with configurable tree heights and Winternitz widths; This document obsoletes RFC 8708 to align with updated certificate conventions and expanded parameter sets.
- **Security Levels & Parameters**: h=5, h=10, h=15, h=20, h=25; m=32; w=1, w=2, w=4, w=8; SHA-256; SHAKE256
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: small public keys; low computational cost; signatures are quite large; private key can be very small with additional computation or consume additional memory for faster signing
- **Target Audience**: Security Architect; Developer; Compliance Officer
- **Implementation Prerequisites**: ASN.1 Basic Encoding Rules (BER); Distinguished Encoding Rules (DER); X.509 certificate key usage extension support for digitalSignature, nonRepudiation, keyCertSign, cRLSign
- **Relevant PQC Today Features**: stateful-signatures; merkle-tree-certs; pki-workshop; code-signing; algorithms

---

## RFC 9794

- **Reference ID**: RFC 9794
- **Title**: Terminology for Post-Quantum Traditional Hybrid Schemes
- **Authors**: IETF PQUIP
- **Publication Date**: 2025-06-01
- **Last Updated**: 2025-06-01
- **Document Status**: Informational
- **Main Topic**: Defines terminology for Post-Quantum Traditional hybrid schemes including composite KEMs and signatures to ensure consistency across protocols and standards.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA
- **Quantum Threats Addressed**: Shor's Algorithm; Cryptographically Relevant Quantum Computer (CRQC); Harvest Now Decrypt Later
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United Kingdom; UK National Cyber Security Centre; Naval Postgraduate School
- **Leaders Contributions Mentioned**: F. Driscoll; M. Parsons; B. Hale
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: Internet Engineering Task Force (IETF); National Institute of Standards and Technology (NIST); European Telecommunications Standards Institute (ETSI)
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; Elliptic Curve Diffie-Hellman (ECDH)
- **Key Takeaways**: Hybrid schemes combine post-quantum and traditional algorithms to mitigate risks during transition; Terminology standardization is required to prevent confusion across different protocols and organizations; Security of hybrid schemes requires breaking all component algorithms to compromise the system; Data encrypted today with vulnerable algorithms can be stored for future decryption by a CRQC
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: PQ/T hybrid scheme; PQ/T hybrid Key Encapsulation Mechanism (KEM); PQ/T hybrid Public Key Encryption (PKE); multi-algorithm scheme
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Researcher; Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms; Threats; Hybrid-crypto; Crypto-agility; Tls-basics

---

## RFC 9802

- **Reference ID**: RFC 9802
- **Title**: Use of HSS and XMSS Hash-Based Signature Algorithms in X.509 PKI
- **Authors**: IETF LAMPS
- **Publication Date**: 2025-06-01
- **Last Updated**: 2025-06-01
- **Document Status**: Proposed Standard
- **Main Topic**: Defines OIDs and certificate structures for stateful hash-based signature algorithms HSS, XMSS, and XMSS MT in X.509 PKI.
- **PQC Algorithms Covered**: HSS, XMSS, XMSS MT
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: D. Van Geest; K. Bashiri; S. Fluhrer; S. Gazdag; S. Kousidis
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509
- **Infrastructure Layers**: PKI
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: CNSA 2.0; SP800208
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Stateful HBS schemes are unsuitable for interactive protocols due to limited signature counts and state management requirements; Use cases are appropriate for firmware signing, software signing, and CA certificates where signing environments are tightly controlled; Root CAs are more suitable for stateful HBS than subordinate CAs unless the subordinate CA matches root security restrictions; Implementations must prevent OTS key reuse through strict state management strategies; Secure private key backup and restoration mechanisms are mandatory for deployment.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: 2^60 signatures possible with larger signature size and longer signing time
- **Target Audience**: Security Architect, Developer, Compliance Officer
- **Implementation Prerequisites**: State management strategies to prevent OTS key reuse; Secure private key backup and restoration mechanisms; Tightly controlled secured signing environment
- **Relevant PQC Today Features**: stateful-signatures, pki-workshop, code-signing, iot-ot-pqc, merkle-tree-certs

---

## RFC 9810

- **Reference ID**: RFC 9810
- **Title**: Certificate Management Protocol (CMP) Updates for KEM
- **Authors**: IETF LAMPS
- **Publication Date**: 2025-07-01
- **Last Updated**: 2025-07-01
- **Document Status**: Standards Track
- **Main Topic**: RFC 9810 updates the Certificate Management Protocol (CMP) to support Key Encapsulation Mechanism (KEM) public keys and EnvelopedData structures while obsoleting RFC 4210 and RFC 9480.
- **PQC Algorithms Covered**: KEM
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: H. Brockhaus; D. von Oheimb; M. Ounsworth; J. Gray
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: CMP; X.509; CMS; CRMF
- **Infrastructure Layers**: PKI; Key Management
- **Standardization Bodies**: IETF; IESG
- **Compliance Frameworks Referenced**: BCP 78; Revised BSD License
- **Classical Algorithms Referenced**: DH
- **Key Takeaways**: CMP version 3 is introduced to support EnvelopedData and KEM keys for message protection; The document obsoletes RFC 4210 and RFC 9480 while maintaining backward compatibility with CMP version 2; Support for Key Generation Authority (KGA) is added as a new PKI entity; EnvelopedData replaces EncryptedValue to improve crypto agility in certificate management operations.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Crypto agility; Backward compatibility with CMP version 2; Multiple protection schemes
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Compliance Officer
- **Implementation Prerequisites**: Support for CMS EnvelopedData; Implementation of KEM keys for Proof-of-Possession; Adoption of CMP version 3 syntax
- **Relevant PQC Today Features**: pki-workshop, crypto-agility, hybrid-crypto, algorithms

---

## RFC 9814

- **Reference ID**: RFC 9814
- **Title**: Use of SLH-DSA in CMS
- **Authors**: IETF LAMPS
- **Publication Date**: 2025-07-19
- **Last Updated**: 2025-07-19
- **Document Status**: Proposed Standard
- **Main Topic**: This document specifies conventions for using the SLH-DSA stateless hash-based signature algorithm with the Cryptographic Message Syntax (CMS).
- **PQC Algorithms Covered**: SLH-DSA, LMS, XMSS
- **Quantum Threats Addressed**: Cryptographically Relevant Quantum Computers (CRQCs)
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: R. Housley; S. Fluhrer; P. Kampanakis; B. Westerbaan
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Cryptographic Message Syntax (CMS), X.509, Asymmetric Key Package
- **Infrastructure Layers**: PKI
- **Standardization Bodies**: Internet Engineering Task Force (IETF), IESG
- **Compliance Frameworks Referenced**: FIPS 205, FIPS 180, FIPS 202, BCP 78, BCP 14
- **Classical Algorithms Referenced**: RSA, DSA, ECDSA, EdDSA, SHA2, SHAKE
- **Key Takeaways**: SLH-DSA is a stateless hash-based signature algorithm that avoids the fragility of stateful schemes like LMS and XMSS; The standard defines usage for pure mode with an empty context string in CMS signed-data content types; Twelve specific object identifiers are assigned for SLH-DSA based on security levels, version (small/fast), and hash function; Public key sizes are 32, 48, or 64 bytes while private key sizes are 64, 96, or 128 bytes depending on the parameter set; Performance can be improved for large messages by signing DER-encoded signed attributes rather than the full content.
- **Security Levels & Parameters**: 128 bits of security; 192 bits of security; 256 bits of security; id-slh-dsa-sha2-128s; id-slh-dsa-sha2-128f; id-slh-dsa-sha2-192s; id-slh-dsa-sha2-192f; id-slh-dsa-sha2-256s; id-slh-dsa-sha2-256f; id-slh-dsa-shake-128s; id-slh-dsa-shake-128f; id-slh-dsa-shake-192s; id-slh-dsa-shake-192f; id-slh-dsa-shake-256s; id-slh-dsa-shake-256f
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Public key sizes 32 bytes, 48 bytes, or 64 bytes; Private key sizes 64 bytes, 96 bytes, or 128 bytes; Context string maximum length 255 bytes; Supports signing up to 2^64 messages
- **Target Audience**: Developer, Security Architect, Compliance Officer
- **Implementation Prerequisites**: ASN.1 Basic Encoding Rules (BER); ASN.1 Distinguished Encoding Rules (DER); FIPS 205 specification for slh_sign operation; RFC 5652 for CMS signed-data content type
- **Relevant PQC Today Features**: Algorithms, stateful-signatures, pki-workshop, email-signing, merkle-tree-certs

---

## RFC 9858

- **Reference ID**: RFC 9858
- **Title**: Additional Parameter Sets for HSS/LMS Hash-Based Signatures
- **Authors**: IETF CFRG
- **Publication Date**: 2025-04-01
- **Last Updated**: 2025-04-01
- **Document Status**: Standards Track
- **Main Topic**: RFC 9858 defines additional parameter sets using SHA-256/192, SHAKE256/256, and SHAKE256/192 to reduce HSS/LMS signature sizes by 35-40%.
- **PQC Algorithms Covered**: LMS, HSS, LM-OTS
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: S. Fluhrer; Q. Dang
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: Internet Research Task Force (IRTF); Crypto Forum Research Group; IETF Trust
- **Compliance Frameworks Referenced**: FIPS 180; FIPS 202; NIST SP 800-208
- **Classical Algorithms Referenced**: SHA-256; SHAKE256
- **Key Takeaways**: New parameter sets reduce signature sizes by 35-40% compared to original RFC 8554 sets; Switching to 192-bit hash functions reduces security margin but remains sufficient for most uses; Implementation choice between SHA-2 and SHAKE depends on existing platform capabilities and performance; Stateful hash-based signatures offer small keys and efficient computation despite larger signature sizes; Truncated hash outputs require randomizers to prevent prefix attacks.
- **Security Levels & Parameters**: 192-bit output; 256-bit output; W=1, W=2, W=4, W=8; Merkle tree heights h=5, h=10, h=15, h=20, h=25
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Signature size reduction of 35-40%; 256-bit hash signature sizes range from 1616 to 5556 bytes; 192-bit hash signature sizes range from 1024 to 3412 bytes; C randomizer shrinks from 32 bytes to 24 bytes for 192-bit sets
- **Target Audience**: Security Architect; Developer; Researcher
- **Implementation Prerequisites**: Standard SHA-256 hash implementation without modification; existing SHAKE implementation; support for stateful signature schemes
- **Relevant PQC Today Features**: Algorithms; stateful-signatures; merkle-tree-certs; crypto-agility; entropy-randomness

---

## RFC 9882

- **Reference ID**: RFC 9882
- **Title**: Use of ML-DSA in CMS
- **Authors**: IETF LAMPS
- **Publication Date**: 2025-10-29
- **Last Updated**: 2025-10-29
- **Document Status**: Proposed Standard
- **Main Topic**: Defines conventions and algorithm identifiers for using the ML-DSA signature algorithm in the Cryptographic Message Syntax (CMS).
- **PQC Algorithms Covered**: ML-DSA, SLH-DSA, HashML-DSA
- **Quantum Threats Addressed**: Cryptographically Relevant Quantum Computer (CRQC)
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; UK National Cyber Security Centre; CryptoNext Security
- **Leaders Contributions Mentioned**: B. Salter, A. Raine, D. Van Geest
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: CMS, X.509
- **Infrastructure Layers**: PKI
- **Standardization Bodies**: IETF, NIST
- **Compliance Frameworks Referenced**: FIPS 204, BCP 78, RFC 5652, RFC 9881, RFC 9814, RFC 8032, RFC 8419, RFC 5911, X680, RFC 5280, RFC 2119, RFC 8174, FIPS 180, RFC 5754, RFC 8702
- **Classical Algorithms Referenced**: SHA-256, SHA-384, SHA-512, SHA3-256, SHA3-384, SHA3-512, SHAKE128, SHAKE256
- **Key Takeaways**: ML-DSA is specified for CMS at three security levels: ML-DSA-44, ML-DSA-65, and ML-DSA-87; Only pure mode of ML-DSA is specified for CMS, not pre-hash mode; SHA-512 must be supported for all ML-DSA parameter sets while SHAKE256 should be supported; Signature generation and verification are significantly faster than SLH-DSA; Context string input for ML-DSA must be set to the empty string in this specification.
- **Security Levels & Parameters**: ML-DSA-44, ML-DSA-65, ML-DSA-87, SHAKE256 512 bits output
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: ML-DSA signature generation and verification is significantly faster than SLH-DSA; SHAKE256 produces 512 bits of output when used as a message digest algorithm in the CMS
- **Target Audience**: Developer, Security Architect, Compliance Officer
- **Implementation Prerequisites**: Support for SHA-512; Support for SHAKE256; Use of pure mode ML-DSA; Omission of parameters field in AlgorithmIdentifier; Empty context string input
- **Relevant PQC Today Features**: Algorithms, email-signing, pki-workshop, entropy-randomness, digital-id

---

## draft-ietf-tls-hybrid-design-16

- **Reference ID**: draft-ietf-tls-hybrid-design-16
- **Title**: Hybrid key exchange in TLS 1.3
- **Authors**: IETF TLS WG
- **Publication Date**: 2020-08-01
- **Last Updated**: 2025-09-07
- **Document Status**: Internet-Draft
- **Main Topic**: Framework for implementing hybrid key exchange combining traditional and post-quantum algorithms in TLS 1.3 using a concatenation-based approach.
- **PQC Algorithms Covered**: ML-KEM, Kyber
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; NIST
- **Leaders Contributions Mentioned**: Douglas Stebila; Scott Fluhrer; Shay Gueron; Joseph A. Salowey; Paul Wouters; Tim Chown; Rifaat Shekh-Yusef; Paul Kyzivat
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.3
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: IETF, NIST
- **Compliance Frameworks Referenced**: FIPS
- **Classical Algorithms Referenced**: secp256r1, x25519, finite-field Diffie-Hellman, RSA, ECP256R1
- **Key Takeaways**: Hybrid key exchange combines multiple algorithms to maintain security if one component is broken; The design uses a concatenation-based approach negotiated within existing TLS 1.3 mechanisms; Traditional algorithms may be retained due to regulatory constraints like FIPS compliance; Post-quantum algorithms are considered next-generation and less studied than traditional methods; Variable-length secret keys are forbidden in this construction
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid key exchange, concatenation-based approach, composite schemes
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, Researcher, Policy Maker
- **Implementation Prerequisites**: TLS 1.3 support; fixed-length KEM public keys and ciphertexts; protection against key reuse for KEMs
- **Relevant PQC Today Features**: hybrid-crypto, tls-basics, crypto-agility, Algorithms, Compliance

---

## draft-ietf-tls-ecdhe-mlkem-04

- **Reference ID**: draft-ietf-tls-ecdhe-mlkem-04
- **Title**: Post-quantum hybrid ECDHE-MLKEM Key Agreement for TLSv1.3
- **Authors**: IETF TLS WG
- **Publication Date**: 2024-03-01
- **Last Updated**: 2026-02-08
- **Document Status**: Internet-Draft (Standards Track)
- **Main Topic**: Specification of three hybrid key agreement mechanisms combining ML-KEM with ECDHE for TLS 1.3.
- **PQC Algorithms Covered**: ML-KEM
- **Quantum Threats Addressed**: cryptanalytic attacks from quantum computers
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Kris Kwiatkowski; Panos Kampanakis; Bas Westerbaan; Douglas Stebila; Joseph A. Salowey (Document shepherd); Paul Wouters (Responsible AD)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.3
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: IETF; NIST
- **Compliance Frameworks Referenced**: FIPS
- **Classical Algorithms Referenced**: X25519; secp256r1; secp384r1; ECDH; ECDHE
- **Key Takeaways**: Three hybrid groups (X25519MLKEM768, SecP256r1MLKEM768, SecP384r1MLKEM1024) are defined for TLS 1.3; Hybrid approach provides security against classical and quantum adversaries while maintaining compatibility; FIPS-approved implementations are possible using secp256r1 or secp384r1 groups; Client and server shares involve concatenation of ML-KEM encapsulation keys/ciphertexts with ECDH ephemeral shares; Strict validation checks including encapsulation key checks and ciphertext length matching are mandatory.
- **Security Levels & Parameters**: ML-KEM-768; ML-KEM-1024; X25519MLKEM768; SecP256r1MLKEM768; SecP384r1MLKEM1024
- **Hybrid & Transition Approaches**: hybrid key exchange; simultaneous use of multiple key exchange algorithms; combining traditional and next-generation algorithms
- **Performance & Size Considerations**: X25519MLKEM768 client share 1216 bytes; SecP256r1MLKEM768 client share 1249 bytes; SecP384r1MLKEM1024 client share 1665 bytes; X25519MLKEM768 server share 1120 bytes; SecP256r1MLKEM768 server share 1153 bytes; SecP384r1MLKEM1024 server share 1665 bytes; X25519MLKEM768 shared secret 64 bytes; SecP256r1MLKEM768 shared secret 64 bytes; SecP384r1MLKEM1024 shared secret 80 bytes
- **Target Audience**: Developer; Security Architect; Compliance Officer
- **Implementation Prerequisites**: TLS 1.3 support; implementation of ML-KEM per NIST-FIPS-203; implementation of ECDH per RFC8446 and NIST-SP-800-56A; encapsulation key check per Section 7.2 of NIST-FIPS-203
- **Relevant PQC Today Features**: tls-basics; hybrid-crypto; algorithms; compliance-strategy; migration-program

---

## draft-ietf-tls-mlkem-07

- **Reference ID**: draft-ietf-tls-mlkem-07
- **Title**: ML-KEM Post-Quantum Key Agreement for TLS 1.3
- **Authors**: IETF TLS WG
- **Publication Date**: 2024-05-01
- **Last Updated**: 2026-02-12
- **Document Status**: Internet-Draft (Revised I-D Needed)
- **Main Topic**: Defines ML-KEM-512, ML-KEM-768, and ML-KEM-1024 as NamedGroups for pure post-quantum key agreement in TLS 1.3 without hybrid construction.
- **PQC Algorithms Covered**: ML-KEM-512; ML-KEM-768; ML-KEM-1024
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Document expires 16 August 2026
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Deirdre Connolly
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.3
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: IETF; NIST
- **Compliance Frameworks Referenced**: FIPS 203; BCP 78; BCP 79; BCP 14
- **Classical Algorithms Referenced**: ECDH
- **Key Takeaways**: Defines standalone ML-KEM key establishment for TLS 1.3 without hybrid construction; ML-KEM parameter sets are registered as NamedGroups in the TLS Supported Groups registry; Implementations must perform encapsulation key checks and abort on failure; Key reuse is permitted within bounds defined by FIPS 203 but forward secrecy is recommended; Hybrid mechanisms are supported generically via other documents.
- **Security Levels & Parameters**: ML-KEM-512; ML-KEM-768; ML-KEM-1024
- **Hybrid & Transition Approaches**: Standalone key establishment; Hybrid key establishment mechanisms referenced generically
- **Performance & Size Considerations**: ML-KEM-512 encapsulation keys 800 bytes; ML-KEM-512 ciphertext 768 bytes; ML-KEM-768 encapsulation keys 1184 bytes; ML-KEM-768 ciphertext 1088 bytes; ML-KEM-1024 encapsulation keys 1568 bytes; ML-KEM-1024 ciphertext 1568 bytes; Shared secrets 32 bytes for all parameter sets
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: Conformance to FIPS 203; Support for TLS 1.3 NamedGroups; Implementation of encapsulation key check per Section 7.2 of FIPS 203
- **Relevant PQC Today Features**: Algorithms; tls-basics; hybrid-crypto; crypto-agility

---

## draft-ietf-ipsecme-ikev2-mlkem

- **Reference ID**: draft-ietf-ipsecme-ikev2-mlkem
- **Title**: Post-quantum Hybrid Key Exchange with ML-KEM in IKEv2
- **Authors**: IETF IPSECME WG
- **Publication Date**: 2023-11-01
- **Last Updated**: 2025-09-29
- **Document Status**: Internet-Draft
- **Main Topic**: Specification of ML-KEM integration into IKEv2 for quantum-resistant and hybrid key establishment in VPN and IPsec tunnels.
- **PQC Algorithms Covered**: ML-KEM, ML-KEM-512, ML-KEM-768, ML-KEM-1024
- **Quantum Threats Addressed**: Cryptographically Relevant Quantum Computer (CRQC); Harvest Now Decrypt Later
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Panos Kampanakis
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: IKEv2, IPsec, UDP
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: NIST, IETF
- **Compliance Frameworks Referenced**: FIPS 203, BCP 78, BCP 79, RFC 8784, RFC 9242, RFC 9370, RFC 9794
- **Classical Algorithms Referenced**: (EC)DH, AES-128, AES-192, AES-256
- **Key Takeaways**: ML-KEM can be used alone or as a hybrid with traditional key exchanges in IKEv2; High security parameter ML-KEM variants may require message fragmentation due to MTU limits; Hybrid approaches mitigate risks from CRQCs and potential weaknesses in new algorithms; PPK specifications can be combined with ML-KEM for enhanced quantum resistance.
- **Security Levels & Parameters**: NIST Level 1, NIST Level 3, NIST Level 5, ML-KEM-512, ML-KEM-768, ML-KEM-1024
- **Hybrid & Transition Approaches**: Post-Quantum Traditional (PQ/T) Hybrid key exchange; mixing pre-shared keys with ML-KEM; additional key exchanges via IKE_INTERMEDIATE or IKE_FOLLOWUP_KE messages
- **Performance & Size Considerations**: ML-KEM-768 and ML-KEM-1024 public keys and ciphertexts may exceed network MTU; requires two or three network IP packets for larger variants; no noticeable performance impact on long-lived tunnels
- **Target Audience**: Security Architect, Developer, Network Engineer
- **Implementation Prerequisites**: Support for IKE_INTERMEDIATE messages per RFC 9242; support for Multiple Key Exchanges per RFC 9370; support for IKEv2 Message Fragmentation per RFC 7383
- **Relevant PQC Today Features**: Algorithms, hybrid-crypto, vpn-ssh-pqc, crypto-agility, pqc-risk-management

---

## draft-yang-tls-hybrid-sm2-mlkem-03

- **Reference ID**: draft-yang-tls-hybrid-sm2-mlkem-03
- **Title**: Hybrid Post-quantum Key Exchange SM2-MLKEM for TLSv1.3
- **Authors**: IETF Individual Submission
- **Publication Date**: 2024-08-01
- **Last Updated**: 2025-11-15
- **Document Status**: Internet-Draft
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## draft-yang-tls-hybrid-sm2-mlkem-03

- **Reference ID**: draft-yang-tls-hybrid-sm2-mlkem-03
- **Title**: Hybrid Post-quantum Key Exchange SM2-MLKEM for TLSv1.3
- **Authors**: IETF Individual Submission
- **Publication Date**: 2024-08-01
- **Last Updated**: 2025-11-15
- **Document Status**: Internet-Draft
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## RFC 9881

- **Reference ID**: RFC 9881
- **Title**: Algorithm Identifiers for ML-DSA in X.509 PKI
- **Authors**: IETF LAMPS
- **Publication Date**: 2022-06-03
- **Last Updated**: 2025-10-29
- **Document Status**: Proposed Standard
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## draft-ietf-lamps-pq-composite-kem-12

- **Reference ID**: draft-ietf-lamps-pq-composite-kem-12
- **Title**: Composite ML-KEM for Use in X.509 PKI and CMS
- **Authors**: IETF LAMPS
- **Publication Date**: 2023-03-02
- **Last Updated**: 2026-01-08
- **Document Status**: Internet-Draft (In WG Last Call)
- **Main Topic**: Definition of composite (hybrid) ML-KEM schemes combining classical algorithms with post-quantum cryptography for use in X.509 and CMS applications.
- **PQC Algorithms Covered**: ML-KEM
- **Quantum Threats Addressed**: Quantum computing threats to traditional key establishment algorithms; catastrophic bugs or breaks in ML-KEM implementations
- **Migration Timeline Info**: Document expires 12 July 2026; aggressive migration timelines may require deploying PQC before full hardening or certification
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Mike Ounsworth, John Gray, Massimiliano Pala, Jan Klaußner, Scott Fluhrer
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509, CMS, PKIX
- **Infrastructure Layers**: Public Key Infrastructure (PKI)
- **Standardization Bodies**: IETF, NIST
- **Compliance Frameworks Referenced**: FIPS 203, BCP 78, BCP 79, Revised BSD License
- **Classical Algorithms Referenced**: RSA-OAEP, ECDH, X25519, X448, Diffie-Hellman
- **Key Takeaways**: Composite schemes provide extra protection against breaks or catastrophic bugs in ML-KEM; Hybrid approaches allow deploying PQC before modules are fully audited and certified; Organizations should select a single composite algorithm or small number to meet environment needs; Composite KEMs offer protocol backwards compatibility by presenting as a single atomic algorithm
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Composite ML-KEM, PQ/T Hybrids, Protocol Backwards Compatibility, Hybrid KEM Combiner Function
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: FIPS Certification considerations; Decapsulation requires public key extraction from private keys; Support for ASN.1 AlgorithmIdentifier and DER encoding
- **Relevant PQC Today Features**: hybrid-crypto, pki-workshop, crypto-agility, Algorithms, compliance-strategy

---

## draft-ietf-lamps-pq-composite-sigs-15

- **Reference ID**: draft-ietf-lamps-pq-composite-sigs-15
- **Title**: Composite ML-DSA for Use in X.509 PKI and CMS
- **Authors**: IETF LAMPS
- **Publication Date**: 2023-03-02
- **Last Updated**: 2026-02-24
- **Document Status**: Internet-Draft (In IETF Last Call)
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## draft-ietf-lamps-cms-kyber-13

- **Reference ID**: draft-ietf-lamps-cms-kyber-13
- **Title**: Use of ML-KEM in the Cryptographic Message Syntax (CMS)
- **Authors**: IETF LAMPS
- **Publication Date**: 2023-01-10
- **Last Updated**: 2025-09-23
- **Document Status**: RFC 9936 Pending (AUTH48)
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## draft-ietf-openpgp-pqc-17

- **Reference ID**: draft-ietf-openpgp-pqc-17
- **Title**: Post-Quantum Cryptography in OpenPGP
- **Authors**: IETF OpenPGP WG
- **Publication Date**: 2023-07-01
- **Last Updated**: 2026-01-13
- **Document Status**: Internet-Draft (Submitted to IESG)
- **Main Topic**: This document defines a post-quantum public key algorithm extension for the OpenPGP protocol, specifying composite ML-KEM+ECC encryption and ML-DSA+ECC signatures alongside standalone SLH-DSA.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA
- **Quantum Threats Addressed**: cryptographically relevant quantum computer
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Stavros Kousidis; Johannes Roth; Falko Strenzke; Aron Wussler; Daniel Kahn Gillmor (Document shepherd); Paul Wouters (Responsible AD)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: OpenPGP
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: Internet Engineering Task Force (IETF); IESG; IANA
- **Compliance Frameworks Referenced**: BCP 78; BCP 79; Revised BSD License
- **Classical Algorithms Referenced**: EdDSA, ECDH, X25519, Ed25519, Ed448, X448
- **Key Takeaways**: The document defines composite encryption combining ML-KEM with elliptic curve cryptography for OpenPGP; Composite signatures combine ML-DSA with elliptic curve cryptography to ensure long-term security; SLH-DSA is specified as a standalone signature scheme for OpenPGP; Migration considerations address encrypting and signing with both traditional and PQ keys; Security aspects include preventing signature cross-protocol attacks and ensuring domain separation in key combiners.
- **Security Levels & Parameters**: ML-KEM-768, ML-KEM-1024, ML-DSA-65, ML-DSA-87, Ed25519, Ed448, X25519, X448
- **Hybrid & Transition Approaches**: composite public key encryption based on ML-KEM and elliptic curve cryptography; composite public key signatures based on ML-DSA and elliptic curve cryptography; Standalone and Multi-Algorithm Schemes; Encrypting to Traditional and PQ(/T) Keys; Signing with Traditional and PQ(/T) Keys
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect, Researcher
- **Implementation Prerequisites**: OpenPGP protocol extension extending RFC9580; support for composite KEMs and signatures; support for standalone SLH-DSA; Random Number Generation and Seeding requirements
- **Relevant PQC Today Features**: Algorithms, hybrid-crypto, email-signing, stateful-signatures, crypto-agility

---

## draft-ietf-pquip-pqc-engineers-14

- **Reference ID**: draft-ietf-pquip-pqc-engineers-14
- **Title**: Post-Quantum Cryptography for Engineers
- **Authors**: IETF PQUIP
- **Publication Date**: 2023-07-06
- **Last Updated**: 2025-08-26
- **Document Status**: Internet-Draft
- **Main Topic**: Practical guidance for engineers on implementing post-quantum cryptography algorithms and protocols to address the threat of cryptographically relevant quantum computers.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, FN-DSA, XMSS, LMS
- **Quantum Threats Addressed**: Cryptographically relevant quantum computer (CRQC); integer factorization; discrete logarithms; Quantum Side-channel Attacks
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Aritra Banerjee, Tirumaleswar Reddy.K, Dimitrios Schoinianakis, Tim Hollebeek, Mike Ounsworth (Authors); Paul E. Hoffman (Document shepherd); Paul Wouters (Responsible AD)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: HPKE; Authenticated Key Exchange
- **Infrastructure Layers**: PKI; Key Management
- **Standardization Bodies**: NIST; IETF; ISO
- **Compliance Frameworks Referenced**: BCP 78; BCP 79
- **Classical Algorithms Referenced**: RSA; ECC; DH
- **Key Takeaways**: Transitioning to PQC may require significant protocol redesign due to unique algorithm properties; Engineers must evaluate trade-offs between security and performance; Hybrid schemes are necessary to bridge the gap between post-quantum and traditional cryptography; Cryptographic agility is essential for future-proofing systems against quantum threats.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: PQ/T Hybrid Confidentiality; PQ/T Hybrid Authentication; Composite Keys in Hybrid Schemes; Key Reuse in Hybrid Schemes; Cryptographic Agility
- **Performance & Size Considerations**: None detected
- **Target Audience**: Engineer, Developer, Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, Algorithms, hybrid-crypto, crypto-agility, pqc-101

---

## draft-ietf-pquip-hybrid-signature-spectrums-07

- **Reference ID**: draft-ietf-pquip-hybrid-signature-spectrums-07
- **Title**: Hybrid signature spectrums
- **Authors**: IETF PQUIP
- **Publication Date**: 2024-03-01
- **Last Updated**: 2025-01-15
- **Document Status**: Internet-Draft
- **Main Topic**: Classification of design goals and security considerations for hybrid digital signature schemes combining traditional and post-quantum algorithms.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Cryptographically-Relevant Quantum Computer (CRQC); store and decrypt attacks; quantum attacks against RSA-2048
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United Kingdom (UK National Cyber Security Centre)
- **Leaders Contributions Mentioned**: Nina Bindel, Britta Hale, Deirdre Connolly, Flo Driscoll
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: PKI; root certificates; key revocation; entity authentication
- **Standardization Bodies**: Internet Engineering Task Force (IETF); NIST Post-Quantum Cryptography Standardization Project
- **Compliance Frameworks Referenced**: BCP 78; BCP 79; Revised BSD License
- **Classical Algorithms Referenced**: RSA-2048
- **Key Takeaways**: Hybrid signature schemes combine traditional and post-quantum algorithms to maintain security if at least one component holds; Designers must choose between mutually exclusive properties like non-separability and backwards compatibility; Implementation-independent attacks have broken a significant percentage of past PQC proposals, justifying hybrid approaches; Hybrid signatures require careful design to prevent downgrade or stripping attacks due to potential separability.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid signature schemes; proof composability; non-separability of component signatures; backwards/forwards compatibility; simultaneous verification; hybrid generality
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, Researcher
- **Implementation Prerequisites**: Correct provisioning and management of keys; entity authentication; key revocation
- **Relevant PQC Today Features**: hybrid-crypto, crypto-agility, pki-workshop, tls-basics, digital-id

---

## draft-ietf-uta-pqc-app-01

- **Reference ID**: draft-ietf-uta-pqc-app-01
- **Title**: Post-Quantum Cryptography Recommendations for TLS-based Applications
- **Authors**: IETF UTA
- **Publication Date**: 2025-09-18
- **Last Updated**: 2025-09-18
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

## draft-kwiatkowski-pquip-pqc-migration-00

- **Reference ID**: draft-kwiatkowski-pquip-pqc-migration-00
- **Title**: Guidance for migration to Post-Quantum Cryptography
- **Authors**: IETF Individual Submission
- **Publication Date**: 2025-07-20
- **Last Updated**: 2025-07-20
- **Document Status**: Internet-Draft
- **Main Topic**: This document provides guidance on migration to post-quantum cryptography in internet protocols, outlining challenges and considerations for protocol designers and implementers.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: quantum computer attacks
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Kris Kwiatkowski
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: internet protocols
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Protocol designers must consider challenges when transitioning from traditional cryptographic algorithms to PQC; Implementers should account for considerations specific to deploying PQC standards; The transition aims to secure systems against quantum computer attacks.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Protocol Designer, Developer, Implementer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: migration-program, pqc-risk-management, crypto-agility

---

## draft-wang-ipsecme-kem-auth-ikev2-03

- **Reference ID**: draft-wang-ipsecme-kem-auth-ikev2-03
- **Title**: KEM based Authentication for IKEv2 with Post-quantum Security
- **Authors**: IETF Individual Submission
- **Publication Date**: 2025-03-03
- **Last Updated**: 2025-07-07
- **Document Status**: Internet-Draft
- **Main Topic**: Specification of a KEM-based authentication mechanism for IKEv2 as a more efficient alternative to ML-DSA for post-quantum security.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA
- **Quantum Threats Addressed**: Cryptographically-relevant quantum computers (CRQC); harvest-now-and-decrypt-later (HNDL) attack
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Guilin WANG; Valery Smyslov
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: IKEv2, TLS 1.3
- **Infrastructure Layers**: PKI; Key Management
- **Standardization Bodies**: IETF; NIST
- **Compliance Frameworks Referenced**: FIPS 203; FIPS 204; FIPS 205; BCP 78; BCP 79; BCP 14
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: KEM-based authentication is more efficient than signature-based authentication for IKEv2 due to smaller key and ciphertext sizes; ML-KEM offers significant communication overhead savings compared to ML-DSA across all security levels; Large PQ public keys and signatures can increase IKEv2 time delay significantly under packet loss conditions; KEM-based authentication reduces implementation code size by reusing KEM code for ephemeral key establishment.
- **Security Levels & Parameters**: NIST Level 1 (ML-KEM-512); NIST Level 2 (ML-DSA-44); NIST Level 3 (ML-KEM-768, ML-DSA-65); NIST Level 5 (ML-KEM-1024, ML-DSA-87)
- **Hybrid & Transition Approaches**: Hybrid PQ/T digital algorithms; PQuAKE protocol ideas
- **Performance & Size Considerations**: ML-DSA private key size is about 1.5 times ML-KEM decapsulation key size; ML-DSA public key size is about 1.6 times ML-KEM encapsulation key size; ML-DSA signature size is about 3 times ML-KEM ciphertext size; Communication overhead savings of 2,164 bytes for Level 1; 2,989 bytes for Level 3; 4,083 bytes for Level 5
- **Target Audience**: Security Architect; Developer; Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms; Threats; vpn-ssh-pqc; hybrid-crypto; crypto-agility

---

## ETSI TS 103 744

- **Reference ID**: ETSI TS 103 744
- **Title**: Quantum-Safe Hybrid Key Exchanges
- **Authors**: ETSI QSC
- **Publication Date**: 2023-02-01
- **Last Updated**: 2025-03-01
- **Document Status**: Published Technical Specification
- **Main Topic**: Technical specification defining a framework for quantum-safe hybrid key establishment combining ECDH and ML-KEM with standard key combiners.
- **PQC Algorithms Covered**: ML-KEM
- **Quantum Threats Addressed**: Quantum computing threats to traditional key exchange protocols
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: ETSI
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: ETSI
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: ECDH, SHA256, HMAC, KMAC, NIST P-256, Curve25519
- **Key Takeaways**: Hybrid key establishment combines classical ECDH with post-quantum ML-KEM; Standard key combiners include concatenation and HKDF-based approaches; Test vectors are provided for CatKDF and CasKDF schemes using various KDFs and curves; The specification defines functional entities and information relationships for hybrid architectures; Context formatting functions support both concatenate-based and concatenate-and-hash-based methods
- **Security Levels & Parameters**: ML-KEM-768, NIST P-256, Curve25519, SHA256, KMAC128
- **Hybrid & Transition Approaches**: Concatenate hybrid key establishment scheme; Cascade hybrid key establishment scheme; CatKDF; CasKDF; ephemeral and static variants
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms, hybrid-crypto, crypto-agility, tls-basics, pqc-risk-management

---

## ETSI TR 103 619

- **Reference ID**: ETSI TR 103 619
- **Title**: Migration Strategies and Recommendations for Quantum-Safe Schemes
- **Authors**: ETSI QSC
- **Publication Date**: 2020-07-01
- **Last Updated**: 2020-07-01
- **Document Status**: Published Technical Report
- **Main Topic**: Strategic guidance and a staged approach for migrating cryptographic systems to a Fully Quantum Safe Cryptographic State.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Attacks against cryptographic elements by a quantum computer; immediate availability of a viable quantum computer used to attack RSA or ECC entities
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: ETSI, Technical Committee Cyber Security (CYBER)
- **Leaders Contributions Mentioned**: N. Bindel, U. Heralth, M. McKague, D. Stebila; Bob Blakley; Amy M., Di Matteo O., Gheorghiu V., Mosca M., Parent A., Schanck J.
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.3, X.509
- **Infrastructure Layers**: Public Key Infrastructure (PKI), Key Management, Trust Management, Hardware based security environment, TPM Library
- **Standardization Bodies**: ETSI, IETF, ITU-T, ISO, IEC, Trusted Computing Group
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA, ECC
- **Key Takeaways**: Organizations must compile a comprehensive inventory of cryptographic assets before migration; Migration planning should address both orderly and disorderly transition scenarios; Key and trust management require specific isolation approaches during the transition phase; Hardware-based security environments need special consideration for migration impact; Emergency migration due to immediate quantum computer availability is not fully addressed in this document
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Staged approach to QSC migration; Orderly transition planning; Disorderly transition planning; Isolation approaches during migration
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, CISO, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: Inventory compilation of cryptographic elements; Risk assessment; Data assessment; Infrastructure inventory; Supplier inventory; Migration plan creation
- **Relevant PQC Today Features**: Migrate, Assess, migration-program, pqc-risk-management, pki-workshop, tls-basics

---

## BSI TR-02102-1

- **Reference ID**: BSI TR-02102-1
- **Title**: Cryptographic Mechanisms: Recommendations and Key Lengths
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## draft-yang-tls-hybrid-sm2-mlkem-03

- **Reference ID**: draft-yang-tls-hybrid-sm2-mlkem-03
- **Title**: Hybrid Post-quantum Key Exchange SM2-MLKEM for TLSv1.3
- **Authors**: IETF Individual Submission
- **Publication Date**: 2024-08-01
- **Last Updated**: 2025-11-15
- **Document Status**: Internet-Draft
- **Main Topic**: Specification of a hybrid key exchange scheme combining CurveSM2 and ML-KEM768 for TLS 1.3.
- **PQC Algorithms Covered**: ML-KEM, ML-KEM768
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Paul Yang; Cong Peng; Jin Hu; Shine Sun
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.3, TLSv1.3
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: IETF, ISO, NIST
- **Compliance Frameworks Referenced**: FIPS 203, BCP 78, BCP 79, BCP 14, RFC 2119, RFC 8174, RFC 8446, RFC 8998, ISO/IEC 14888-3:2018, GBT.32918.5-2016
- **Classical Algorithms Referenced**: ECDH, curveSM2
- **Key Takeaways**: The document defines a new NamedGroup curveSM2MLKEM768 for hybrid key exchange in TLS 1.3; Implementations must concatenate the ECDHE and ML-KEM shared secrets to form the final shared secret; The client share size is 1249 bytes while the server share size is 1153 bytes; This scheme uses curveSM2 elliptic curve parameters defined in GBT.32918.5-2016; SM2 key exchange protocols are explicitly excluded from this hybrid scheme.
- **Security Levels & Parameters**: ML-KEM768, 256-bit prime field for curveSM2, 64-byte shared secret size
- **Hybrid & Transition Approaches**: Hybrid key exchange, concatenation approach for shared secrets
- **Performance & Size Considerations**: Client share 1249 bytes; Server share 1153 bytes; Shared secret 64 bytes; curveSM2 public key 65 bytes; ML-KEM encapsulation key 1184 bytes; ML-KEM ciphertext 1088 bytes
- **Target Audience**: Developer, Security Architect
- **Implementation Prerequisites**: TLS 1.3 support; Support for curveSM2 parameters per GBT.32918.5-2016; Support for ML-KEM768 per FIPS 203
- **Relevant PQC Today Features**: tls-basics, hybrid-crypto, algorithms

---

## RFC 9881

- **Reference ID**: RFC 9881
- **Title**: Algorithm Identifiers for ML-DSA in X.509 PKI
- **Authors**: IETF LAMPS
- **Publication Date**: 2022-06-03
- **Last Updated**: 2025-10-29
- **Document Status**: Proposed Standard
- **Main Topic**: Defines X.509 OIDs and certificate structures for ML-DSA signatures in PKIX certificates and CRLs.
- **PQC Algorithms Covered**: ML-DSA, ML-DSA-44, ML-DSA-65, ML-DSA-87
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; NIST
- **Leaders Contributions Mentioned**: J. Massimo, P. Kampanakis, S. Turner, B. E. Westerbaan
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509, PKIX
- **Infrastructure Layers**: PKI
- **Standardization Bodies**: IETF, NIST
- **Compliance Frameworks Referenced**: FIPS 204, BCP 78, RFC 5280, RFC 5912, RFC 5958, RFC 7468
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: ML-DSA signatures in X.509 certificates must use specific NIST-registered OIDs with absent parameters; The pure variant of ML-DSA is specified while the pre-hash variant is excluded; Key usage extensions for ML-DSA keys must include digitalSignature, nonRepudiation, keyCertSign, or cRLSign and must exclude encryption bits; Private keys can be encoded as a 32-octet seed or an expanded private key with the seed format recommended.
- **Security Levels & Parameters**: NIST security categories 2, 3, and 5; ML-DSA-44; ML-DSA-65; ML-DSA-87
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: ML-DSA-44 public key 1312 bytes; ML-DSA-65 public key 1952 bytes; ML-DSA-87 public key 2592 bytes; Private key seed format 32 bytes
- **Target Audience**: Security Architect, Developer, Compliance Officer
- **Implementation Prerequisites**: Support for ASN.1 encoding per RFC 5912 and RFC 5280; Recognition of NIST-registered OIDs id-ml-dsa-44, id-ml-dsa-65, id-ml-dsa-87; Adherence to FIPS 204 algorithm specifications
- **Relevant PQC Today Features**: Algorithms, pki-workshop, compliance-strategy, migration-program, digital-id

---

## draft-ietf-lamps-pq-composite-sigs-15

- **Reference ID**: draft-ietf-lamps-pq-composite-sigs-15
- **Title**: Composite ML-DSA for Use in X.509 PKI and CMS
- **Authors**: IETF LAMPS
- **Publication Date**: 2023-03-02
- **Last Updated**: 2026-02-24
- **Document Status**: Internet-Draft (In IETF Last Call)
- **Main Topic**: This document defines composite ML-DSA signature schemes combining US NIST ML-DSA with traditional algorithms for use in X.509 PKI and CMS to provide hybrid protection against quantum attacks.
- **PQC Algorithms Covered**: ML-DSA
- **Quantum Threats Addressed**: Quantum computing threats to traditional cryptographic signature algorithms; breaks or catastrophic bugs in ML-DSA
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; European Union; BSI; ANSSI
- **Leaders Contributions Mentioned**: Mike Ounsworth; John Gray; Massimiliano Pala; Jan Klaußner; Scott Fluhrer; Russ Housley (Document shepherd); Deb Cooley (Action Holder/Responsible AD); Donald Eastlake (Reviewer); Tim Evens (Reviewer)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509; PKIX; CMS
- **Infrastructure Layers**: Public Key Infrastructure (PKI); X.509 data structures
- **Standardization Bodies**: IETF; NIST
- **Compliance Frameworks Referenced**: FIPS 204; BCP 78; BCP 79; Revised BSD License
- **Classical Algorithms Referenced**: RSASSA-PKCS1-v1.5; RSASSA-PSS; ECDSA; Ed25519; Ed448; RSA; DSA
- **Key Takeaways**: Composite ML-DSA combines PQ and traditional algorithms to ensure security even if one component is broken; Hybrid schemes allow deployment of PQC before full certification or audit of PQ modules; The specification targets X.509 applications requiring EUF-CMA security levels; Organizations can choose specific composite combinations to meet regulatory guidelines from bodies like BSI and ANSSI; Protocol backwards compatibility is achieved by presenting the hybrid as a single atomic algorithm
- **Security Levels & Parameters**: EUF-CMA; ML-DSA (referenced via FIPS 204); RSASSA-PSS; RSASSA-PKCS1-v1.5; ECDSA; Ed25519; Ed448
- **Hybrid & Transition Approaches**: Composite signatures; PQ/T Hybrids; protocol backwards compatibility; stepping stone for algorithm evolution
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Compliance Officer; Policy Maker
- **Implementation Prerequisites**: Support for X.509 or PKIX data structures; acceptance of EUF-CMA security level; FIPS certification considerations
- **Relevant PQC Today Features**: pki-workshop, hybrid-crypto, crypto-agility, compliance-strategy, migration-program

---

## draft-ietf-lamps-cms-kyber-13

- **Reference ID**: draft-ietf-lamps-cms-kyber-13
- **Title**: Use of ML-KEM in the Cryptographic Message Syntax (CMS)
- **Authors**: IETF LAMPS
- **Publication Date**: 2023-01-10
- **Last Updated**: 2025-09-23
- **Document Status**: RFC 9936 Pending (AUTH48)
- **Main Topic**: Specification of conventions for using ML-KEM with the Cryptographic Message Syntax (CMS) via the KEMRecipientInfo structure defined in RFC 9629.
- **PQC Algorithms Covered**: ML-KEM
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; NIST
- **Leaders Contributions Mentioned**: PRAT Julien, Mike Ounsworth, Daniel Van Geest, Russ Housley, Deb Cooley, Yaron Sheffer, Joel Halpern
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Cryptographic Message Syntax (CMS), SMIME
- **Infrastructure Layers**: PKI, Key Management
- **Standardization Bodies**: IETF, NIST
- **Compliance Frameworks Referenced**: FIPS 203, BCP 78, BCP 79, RFC 5652, RFC 5083, RFC 9629, RFC 5869, FIPS 180, RFC 8619, RFC 3394, RFC 3565
- **Classical Algorithms Referenced**: SHA3-256, SHA3-512, SHAKE128, SHAKE256, HKDF, SHA-256, AES-Wrap-128, AES-Wrap-256
- **Key Takeaways**: ML-KEM parameter sets 512, 768, and 1024 correspond to security strengths of 128, 192, and 256 bits respectively; CMS implementations MUST use KEMRecipientInfo structure for ML-KEM integration; Implementations supporting ML-KEM-512 MUST support AES-Wrap-128 while higher levels require AES-Wrap-256; The document specifies direct use of ML-KEM but does not preclude hybrid schemes.
- **Security Levels & Parameters**: ML-KEM-512, ML-KEM-768, ML-KEM-1024, 128 bits, 192 bits, 256 bits
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect, Compliance Officer
- **Implementation Prerequisites**: Support for HKDF with SHA-256; Support for AES-Wrap-128 or AES-Wrap-256 depending on ML-KEM parameter set; Implementation of Encapsulate and Decapsulate functions
- **Relevant PQC Today Features**: Algorithms, email-signing, pki-workshop, hybrid-crypto, crypto-agility

---

## BSI TR-02102-1

- **Reference ID**: BSI TR-02102-1
- **Title**: Cryptographic Mechanisms: Recommendations and Key Lengths
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-2

- **Reference ID**: BSI TR-02102-2
- **Title**: Cryptographic Mechanisms: Recommendations for TLS
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-3

- **Reference ID**: BSI TR-02102-3
- **Title**: Cryptographic Mechanisms: Recommendations for IPsec
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-4

- **Reference ID**: BSI TR-02102-4
- **Title**: Cryptographic Mechanisms: Recommendations for SSH
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: SSH
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: vpn-ssh-pqc; pqc-risk-management; migration-program

---

## ANSSI PQC Position Paper

- **Reference ID**: ANSSI PQC Position Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition
- **Authors**: ANSSI France
- **Publication Date**: 2022-01-01
- **Last Updated**: 2022-01-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Follow-up Paper

- **Reference ID**: ANSSI PQC Follow-up Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition (2023 Follow-up)
- **Authors**: ANSSI France
- **Publication Date**: 2023-12-01
- **Last Updated**: 2023-12-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## EU PQC Recommendation

- **Reference ID**: EU PQC Recommendation
- **Title**: Recommendation on Coordinated Implementation Roadmap for PQC Transition
- **Authors**: European Commission
- **Publication Date**: 2024-04-11
- **Last Updated**: 2024-04-11
- **Document Status**: Policy Recommendation
- **Main Topic**: EU Commission Recommendation encouraging Member States to develop a coordinated strategy and joint implementation roadmap for Post-Quantum Cryptography adoption in public sectors and critical infrastructures by 2030.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Target 2030 for critical systems; definition of a joint Post-Quantum Cryptography Implementation Roadmap with clear goals, milestones, and timelines.
- **Applicable Regions / Bodies**: Regions: Union (European Union); Bodies: Member States, public sectors, Commission.
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Critical infrastructures; existing public administration systems.
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Member States must develop a comprehensive strategy for Post-Quantum Cryptography adoption; Transition should be coordinated and synchronized across different Member States and public sectors; Deployment should utilize hybrid schemes combining Post-Quantum Cryptography with existing cryptographic approaches or Quantum Key Distribution.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid schemes combining Post-Quantum Cryptography with existing cryptographic approaches or with Quantum Key Distribution.
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Compliance Officer, Security Architect
- **Implementation Prerequisites**: Definition of clear goals, milestones, and timelines; development of a comprehensive strategy for adoption.
- **Relevant PQC Today Features**: Timeline, hybrid-crypto, qkd, migration-program, pqc-governance

---

## ENISA PQC Guidelines

- **Reference ID**: ENISA PQC Guidelines
- **Title**: Post-Quantum Cryptography: Current State and Quantum Mitigation
- **Authors**: ENISA
- **Publication Date**: 2021-07-01
- **Last Updated**: 2024-12-01
- **Document Status**: Position Paper
- **Main Topic**: Overview of the current state of Post-Quantum Cryptography standardization, five main algorithm families, and NIST Round 3 finalists with proposals for immediate hybrid implementation.
- **PQC Algorithms Covered**: code-based, isogeny-based, hash-based, lattice-based, multivariate-based
- **Quantum Threats Addressed**: quantum capable attacker
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Europe; Bodies: ENISA, NIST
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: System owners can implement hybrid implementations combining pre-quantum and post-quantum schemes now; Mixing pre-shared keys into all keys established via public-key cryptography protects data confidentiality; The NIST standardization process will continue for a few years; Five main families of PQ algorithms exist: code-based, isogeny-based, hash-based, lattice-based, and multivariate-based
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: hybrid implementations that use a combination of pre-quantum and post-quantum schemes; mixing of pre-shared keys into all keys established via public-key cryptography
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, CISO, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms, hybrid-crypto, Threats, Assess, migration-program

---

## EUCC v2.0 ACM

- **Reference ID**: EUCC v2.0 ACM
- **Title**: EU Cybersecurity Certification Agreed Cryptographic Mechanisms v2.0
- **Authors**: ECCG/ENISA
- **Publication Date**: 2025-04-01
- **Last Updated**: 2025-04-01
- **Document Status**: Certification Framework
- **Main Topic**: Guidelines on agreed cryptographic mechanisms including PQC algorithms for EUCC certification of ICT products.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: European Union; Bodies: European Cybersecurity Certification Group (ECCG), European Union Agency for Cybersecurity (ENISA)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: European Cybersecurity Certification Group (ECCG), European Union Agency for Cybersecurity (ENISA)
- **Compliance Frameworks Referenced**: EUCC scheme, Regulation (EU) 2019/881, Commission Implementing Regulation (EU) 2024/482, Common Criteria
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Developers should consider using agreed cryptographic mechanisms defined in ACM v2 for ICT products submitted to EUCC certification; Evaluators must verify that protection profiles and ICT products preferably rely on agreed cryptographic mechanisms; The document supports the EUCC scheme by providing guidelines on cryptographic mechanisms for confidentiality, integrity, data origin authentication, and authentication.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Evaluator
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Compliance, Algorithms, Migrate

---

## UK NCSC PQC Guidance

- **Reference ID**: UK NCSC PQC Guidance
- **Title**: Preparing for Quantum-Safe Cryptography
- **Authors**: UK NCSC
- **Publication Date**: 2020-11-11
- **Last Updated**: 2020-11-11
- **Document Status**: White Paper
- **Main Topic**: UK NCSC position paper recommending quantum-safe cryptography following NIST standardisation while rejecting QKD for government and military use.
- **PQC Algorithms Covered**: XMSS, LMS
- **Quantum Threats Addressed**: Cryptographically Relevant Quantum Computer (CRQC); decryption of past encrypted data; forgery of digital signatures
- **Migration Timeline Info**: Draft standards expected in 2022–24; transition to QSC once NIST standards are available and protocols are updated
- **Applicable Regions / Bodies**: United Kingdom; NCSC
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: IPSec, TLS
- **Infrastructure Layers**: Public-key infrastructure; key management
- **Standardization Bodies**: NIST, ETSI
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: AES
- **Key Takeaways**: Adopt quantum-safe cryptography following NIST standardisation rather than early non-standardised adoption; reject Quantum Key Distribution for government and military applications; factor quantum threats into long-term roadmaps for systems with high-value data or long certificate lifetimes; maintain support for conventional PKC during the interim transition period
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Operating both conventional and quantum-safe cryptography to ease transition; pre-placed symmetric keys in addition to key agreement with conventional PKC
- **Performance & Size Considerations**: None detected
- **Target Audience**: Technical policymakers, Large organisations, Public sector, Cyber security professionals
- **Implementation Prerequisites**: Conduct investigatory work to identify high priority systems; plan for long-term investment decisions; wait for standards-compliant QSC products
- **Relevant PQC Today Features**: Threats, Timeline, Migrate, qkd, stateful-signatures

---

## NIST NCCoE SP 1800-38C

- **Reference ID**: NIST NCCoE SP 1800-38C
- **Title**: Migration to Post-Quantum Cryptography (Preliminary Draft)
- **Authors**: NIST NCCoE
- **Publication Date**: 2023-12-01
- **Last Updated**: 2023-12-01
- **Document Status**: Preliminary Draft Practice Guide
- **Main Topic**: Preliminary draft guidance on testing interoperability and performance of quantum-resistant cryptography technologies for enterprise migration.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Public comment period: December 19, 2023 through February 20, 2024
- **Applicable Regions / Bodies**: United States; National Institute of Standards and Technology; National Cybersecurity Center of Excellence
- **Leaders Contributions Mentioned**: William Newhouse; Murugiah Souppaya; William Barker; Chris Brown; Panos Kampanakis; Jim Goodman; Julien Prat; Robin Larrieu; John Gray; Mike Ounsworth; Cleandro Viana; Hubert Le Van Gong; Kris Kwiatkowski; Anthony Hu; Robert Burns; Christian Paquin; Jane Gilbert; Gina Scinta; Eunkyung Kim; Volker Krummel; Dusan Kostic; Jake Massimo; Avani Wildani; Bruno Couillard; Jean-Charles Garfield Jones; Natasha Eastman; Nancy Pomerleau; Judith Furlong; Corey Bonnell; Jayaram Chandrasekar; Boris Balacheff; Tommy Charles; Thalia Laing; Alyson Comer; Anne Dames; Richard Kisley; Bruce Rich; Kelsey Holler; Roy Basmacier; David Hook; Alexander Scheel; Ted Shorter; Janet Jones; Benjamin Rodes; Lily Chen; David Cooper; Daniel Eliot; Dustin Moody; Andy Regenscheid; Rebecca Guthrie; Mike Jenkins; Brendan Zember; Sean Morgan; Graeme Hickey; Michael Hutter; Axel Poschmann; Evgeny Gervis; Yoonchan Jhi; Changhoon Lee; Marc Manzano; Tarun Sibal; Mark Carney; Daniel Cuthbert; Jaime Gomez; Suvi Lampila; Eric Amador; Daniel Apon; Kaitlyn Laohoo; Neil McNab; Jessica Walton; Lee E. Sattler; Russ Housley; David Ott; Dimitrios Sikeridis
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: National Institute of Standards and Technology
- **Compliance Frameworks Referenced**: NIST Cybersecurity Framework
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Identify compatibility issues between quantum-ready algorithms; Resolve compatibility issues in a controlled, non-production environment; Reduce time spent by organizations performing similar interoperability testing for PQC migration
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Compliance Officer; Researcher
- **Implementation Prerequisites**: Controlled, non-production environment for testing; Risk assessment including current threat and vulnerabilities
- **Relevant PQC Today Features**: Migrate; Assess; Algorithms; Leaders; crypto-agility

---

## BSI TR-02102-1

- **Reference ID**: BSI TR-02102-1
- **Title**: Cryptographic Mechanisms: Recommendations and Key Lengths
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-2

- **Reference ID**: BSI TR-02102-2
- **Title**: Cryptographic Mechanisms: Recommendations for TLS
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-3

- **Reference ID**: BSI TR-02102-3
- **Title**: Cryptographic Mechanisms: Recommendations for IPsec
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Position Paper

- **Reference ID**: ANSSI PQC Position Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition
- **Authors**: ANSSI France
- **Publication Date**: 2022-01-01
- **Last Updated**: 2022-01-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Follow-up Paper

- **Reference ID**: ANSSI PQC Follow-up Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition (2023 Follow-up)
- **Authors**: ANSSI France
- **Publication Date**: 2023-12-01
- **Last Updated**: 2023-12-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ISO/IEC 14888-4:2024

- **Reference ID**: ISO/IEC 14888-4:2024
- **Title**: Hash-based Digital Signatures
- **Authors**: ISO/IEC JTC 1/SC 27
- **Publication Date**: 2024-01-01
- **Last Updated**: 2024-01-01
- **Document Status**: International Standard
- **Main Topic**: This document specifies stateful digital signature mechanisms with appendix where security is determined by underlying hash functions and provides requirements for implementing basic state management.
- **PQC Algorithms Covered**: XMSS, LMS
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: ISO/IEC JTC 1/SC 27, ISO
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Stateful hash-based signature mechanisms rely on the security properties of underlying hash functions; Basic state management is required for secure deployment of stateful schemes; The standard covers digital signatures with appendix at the ISO level.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, Compliance Officer
- **Implementation Prerequisites**: Basic state management implementation required for secure deployment
- **Relevant PQC Today Features**: Algorithms, stateful-signatures, digital-assets, pki-workshop

---

## Japan CRYPTREC Report 2024

- **Reference ID**: Japan CRYPTREC Report 2024
- **Title**: Post-Quantum Cryptography Evaluation Report
- **Authors**: CRYPTREC Japan
- **Publication Date**: 2025-03-01
- **Last Updated**: 2025-03-01
- **Document Status**: Technical Report
- **Main Topic**: Japanese government evaluation of post-quantum cryptography algorithms including ML-KEM, ML-DSA, SLH-DSA, FN-DSA, and HQQ with security analysis and migration guidance.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, FALCON, Classic McEliece, BIKE, HQC, UOV, QR-UOV, MAYO, MQOM, MiRitH, SQIsign, GPS
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Japan; Bodies: CRYPTREC
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST, CRYPTREC
- **Compliance Frameworks Referenced**: FIPS 203, FIPS 204
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Prioritize PQC adoption based on data sensitivity and usage scenarios; Implement cryptographic agility to facilitate future algorithm updates; Utilize hybrid configurations combining existing and PQC algorithms for migration; Address specific challenges in signature, confidentiality, and key sharing applications separately.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid configuration with existing cryptographic methods; Cryptographic agility
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Policy Maker, Researcher, Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms, Threats, Migrate, Assess, crypto-agility, hybrid-crypto

---

## Singapore-CSA-Quantum-Safe-Handbook

- **Reference ID**: Singapore-CSA-Quantum-Safe-Handbook
- **Title**: Quantum-Safe Handbook and Quantum Readiness Index
- **Authors**: CSA Singapore
- **Publication Date**: 2024-06-01
- **Last Updated**: 2024-06-01
- **Document Status**: Guidance
- **Main Topic**: Singapore government guidance providing a Quantum-Safe Handbook and Quantum Readiness Index to assist organizations in preparing for the transition to quantum-safe cryptography.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: quantum threat; sufficiently powerful quantum computers undermining cryptographic systems
- **Migration Timeline Info**: timeline for quantum threat remains uncertain; migration is a complex multi-year endeavour requiring early planning
- **Applicable Regions / Bodies**: Regions: Singapore; Bodies: Cyber Security Agency of Singapore (CSA), GovTech, IMDA
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must promptly initiate transition of cryptographic assets to quantum-safe solutions; migration requires early planning, resource allocation, and coordination across systems; Critical Information Infrastructure owners and government agencies are primary targets for readiness building; self-assessment via Quantum Readiness Index helps prioritize action areas and secure senior management buy-in
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Compliance Officer, Policy Maker, Operations
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, Assess, Migrate, pqc-governance, migration-program

---

## Canada CSE PQC Guidance

- **Reference ID**: Canada CSE PQC Guidance
- **Title**: Guidance on Post-Quantum Cryptography
- **Authors**: CCCS Canada
- **Publication Date**: 2023-09-01
- **Last Updated**: 2023-09-01
- **Document Status**: Guidance
- **Main Topic**: Roadmap and guidance for the Government of Canada to migrate non-classified IT systems to post-quantum cryptography by 2035.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: harvest now, decrypt later (HNDL) threat; quantum computing threat to cryptography
- **Migration Timeline Info**: April 2026: Develop an initial departmental PQC migration plan; End of 2031: Completion of PQC migration of high priority systems; End of 2035: Completion of PQC migration of remaining systems
- **Applicable Regions / Bodies**: Regions: Canada; Bodies: Canadian Centre for Cyber Security, Treasury Board of Canada Secretariat, Shared Services Canada, Communications Security Establishment Canada
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: hardware security modules; smart cards; hardware tokens; cloud service provider; contracted IT platforms; network appliances; server racks; desktops; laptops; mobile telephones; printers; voice over Internet Protocol telephony
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: Cryptographic Module Validation Program; ITSP 40.111; ITSP.40.062; ITSM.40.001
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must develop a departmental PQC migration plan by April 2026; High priority systems protecting confidentiality in transit must be migrated by end of 2031 due to HNDL threats; Procurement policies should include clauses requiring PQC support compliant with Cyber Centre recommendations; Financial planning must account for system replacement and staffing impacts while leveraging existing IT lifecycles; An inventory of all cryptographic usage across hardware, software, and cloud assets is required before transition
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: cryptographic agility; composite certificates not mentioned but crypto agility explicitly recommended for future configuration changes
- **Performance & Size Considerations**: None detected
- **Target Audience**: Directors and managers of IT systems in federal departments and agencies; decision makers accountable for the migration to PQC; Designated Official for Cyber Security (DOCS); PQC Migration Executive Lead; PQC Migration Technical Lead
- **Implementation Prerequisites**: establishment of a committee with senior management representation; identification of a dedicated migration lead; development of a departmental PQC migration plan; creation of an inventory of systems employing cryptography; procurement clauses ensuring vendor support for PQC compliant with ITSP 40.111; certification of cryptographic modules by the Cryptographic Module Validation Program
- **Relevant PQC Today Features**: Timeline, Threats, Compliance, Migrate, Assess, pqc-governance, migration-program, crypto-agility, hsm-pqc, vendor-risk

---

## GSMA PQ.03 PQC Guidelines

- **Reference ID**: GSMA PQ.03 PQC Guidelines
- **Title**: Post-Quantum Cryptography Guidelines for Telecom Use Cases
- **Authors**: GSMA
- **Publication Date**: 2024-10-01
- **Last Updated**: 2024-10-01
- **Document Status**: Permanent Reference Document
- **Main Topic**: Guidelines for integrating Post-Quantum Cryptography into telecom use cases including TLS, IKE, and 5G infrastructure.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: GSM Association
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, IKE, IPSec, X.509
- **Infrastructure Layers**: Public Key Infrastructure, Cloud Infrastructure, Firmware, Constrained Devices, Middleware
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must conduct cryptographic discovery and analysis before remediation; Migration requires prioritization based on business risk analysis; Hybrid schemes are a recommended migration option for digital signatures and key establishment; Legacy systems and constrained devices present specific implementation challenges; Governance and decision-making frameworks are essential for ongoing crypto-governance.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid Schemes, Hybrid X.509 overview, Mixing Algorithms
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, Compliance Officer, Policy Maker, Operations
- **Implementation Prerequisites**: Cryptographic Inventory; Firmware Validation; Middleware Compatibility; Infrastructure Capacity assessment; Vendor Migration Strategy alignment
- **Relevant PQC Today Features**: 5g-security, tls-basics, vpn-ssh-pqc, pki-workshop, hybrid-crypto, crypto-agility, migration-program, pqc-governance, code-signing, iot-ot-pqc

---

## 3GPP TS 33.501

- **Reference ID**: 3GPP TS 33.501
- **Title**: Security Architecture and Procedures for 5G System
- **Authors**: 3GPP
- **Publication Date**: 2025-06-01
- **Last Updated**: 2025-12-01
- **Document Status**: Technical Specification
- **Main Topic**: Security architecture and procedures for 5G System specification covering authentication, key hierarchy, and SUCI protection with ongoing PQC enhancements via 3GPP work items.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Mirko Cano Soveri created specification for release Rel-15; Maurice Pope made specification Under Change Control; Alf Zugenmaier listed as Rapporteur from NTT DOCOMO INC.
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key hierarchy
- **Standardization Bodies**: 3GPP
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: PQC enhancements are being introduced via ongoing 3GPP work items; Specification covers authentication, key hierarchy, and SUCI protection; Document is under change control for Release 15 through Release 20; Security aspects of 5G System Phase 1 are assigned to group S3.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: 5g-security, migration-program, algorithms

---

## IETF RFC 8391

- **Reference ID**: IETF RFC 8391
- **Title**: XMSS: eXtended Merkle Signature Scheme
- **Authors**: IETF CFRG
- **Publication Date**: 2018-05-01
- **Last Updated**: 2018-05-01
- **Document Status**: Informational
- **Main Topic**: Specification of the eXtended Merkle Signature Scheme (XMSS), including WOTS+, XMSS, and XMSS^MT variants for stateful hash-based digital signatures.
- **PQC Algorithms Covered**: XMSS; WOTS+; XMSS^MT; LMS; SPHINCS
- **Quantum Threats Addressed**: Attacks using quantum computers; quantum-computer-aided attacks
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: A. Huelsing; D. Butin; S. Gazdag; J. Rijneveld; A. Mohaisen; Buchmann; Dahmen; McGrew; Curcio; Fluhrer; Merkle; Lamport; Diffie; Winternitz
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: Internet Research Task Force (IRTF); Crypto Forum Research Group; IETF Trust
- **Compliance Frameworks Referenced**: BCP 78
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: XMSS provides security relying only on cryptographic hash functions without requiring collision resistance; The schemes are stateful and require careful handling to prevent secret key reuse which would break security guarantees; Classical APIs for digital signatures cannot be used without modification to handle secret key states; Hash-based signatures naturally resist side-channel attacks and withstand known quantum computer attacks.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Small private and public keys; fast signature generation and verification; large signatures; relatively slow key generation
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: Systems must prevent reuse of secret key states; APIs must be modified to handle secret key state; reference code available in Section 7
- **Relevant PQC Today Features**: Algorithms; stateful-signatures; merkle-tree-certs; pqc-101; quantum-threats

---

## IETF RFC 8554

- **Reference ID**: IETF RFC 8554
- **Title**: Leighton-Micali Hash-Based Signatures
- **Authors**: IETF CFRG
- **Publication Date**: 2019-04-01
- **Last Updated**: 2019-04-01
- **Document Status**: Informational
- **Main Topic**: Specification of the Leighton-Micali Signature (LMS) and Hierarchical Signature System (HSS) stateful hash-based digital signature schemes.
- **PQC Algorithms Covered**: LMS, HSS, LM-OTS
- **Quantum Threats Addressed**: Quantum computer attacks on large integer mathematics; general post-quantum security
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: D. McGrew; M. Curcio; S. Fluhrer; Leighton; Micali; Lamport; Diffie; Winternitz; Merkle
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management; PKI (implied by signature system context)
- **Standardization Bodies**: IRTF; CFRG; IETF
- **Compliance Frameworks Referenced**: BCP 78; RFC 2119; RFC 8174; RFC 8179; RFC 7841
- **Classical Algorithms Referenced**: RSA; ECDSA
- **Key Takeaways**: LMS and HSS are stateful signature schemes requiring careful handling to prevent secret key reuse; these hash-based signatures remain secure against quantum computers unlike systems relying on large integer mathematics; classical digital signature APIs must be modified to handle dynamic secret key states; the schemes offer small keys and fast verification but produce large signatures.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Small private and public keys; fast signature generation and verification; large signatures; moderately slow key generation compared to RSA and ECDSA
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: Systems must prevent reuse of secret key states; APIs must handle dynamic secret key state updates
- **Relevant PQC Today Features**: stateful-signatures; algorithms; merkle-tree-certs; pqc-101; quantum-threats

---

## IETF RFC 9370

- **Reference ID**: IETF RFC 9370
- **Title**: Multiple Key Exchanges in IKEv2
- **Authors**: IETF IPSECME
- **Publication Date**: 2023-05-01
- **Last Updated**: 2023-05-01
- **Document Status**: Standards Track
- **Main Topic**: Framework for extending IKEv2 to support multiple successive key exchanges including post-quantum algorithms via IKE_INTERMEDIATE and IKE_FOLLOWUP_KE exchanges.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum computers solving discrete logarithm problems in multiplicative and elliptic curve groups compromising (EC)DH security
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: CJ. Tjhai; M. Tomlinson; G. Bartlett; S. Fluhrer; D. Van Geest; O. Garcia-Morchon; V. Smyslov
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: IKEv2; IPsec
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: Internet Engineering Task Force (IETF); IANA
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: Diffie-Hellman; Elliptic Curve Diffie-Hellman
- **Key Takeaways**: Hybrid key exchanges combining classical and post-quantum algorithms ensure security if any component remains secure; IKE_INTERMEDIATE exchange enables fragmentation for large post-quantum payloads; Protocol updates rename Transform Type 4 to Key Exchange Method to generalize algorithm support; Multiple distinct post-quantum algorithms can be negotiated to hedge against individual algorithm failures; Backward compatibility is maintained by falling back to standard shared secrets if additional exchanges are not supported
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid key exchange combining classical (EC)DH with one or more post-quantum algorithms; Multiple successive key exchanges where final secret depends on all components; Backward compatibility ensuring standard shared secret derivation if additional exchanges are not agreed upon
- **Performance & Size Considerations**: Key exchange payloads longer than 64 KB not addressed by current specification; Potential IP layer fragmentation issues for large post-quantum payloads; Reliance on IKE fragmentation protocol for encrypted intermediate exchanges
- **Target Audience**: Security Architect; Developer; Protocol Engineer
- **Implementation Prerequisites**: Support for RFC 9242 (IKE_INTERMEDIATE); Support for RFC 7383 (IKE fragmentation); Ability to handle Transform Type 4 as Key Exchange Method
- **Relevant PQC Today Features**: hybrid-crypto; crypto-agility; vpn-ssh-pqc; pqc-risk-management; migration-program

---

## IETF RFC 8784

- **Reference ID**: IETF RFC 8784
- **Title**: Mixing Preshared Keys in IKEv2 for Post-quantum Security
- **Authors**: IETF IPSECME
- **Publication Date**: 2020-06-01
- **Last Updated**: 2020-06-01
- **Document Status**: Standards Track
- **Main Topic**: Defines an extension to IKEv2 using Post-quantum Preshared Keys (PPK) to provide quantum resistance against future decryption of stored VPN communications.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest Now Decrypt Later; quantum computers solving Diffie-Hellman and Elliptic Curve Diffie-Hellman problems in polynomial time
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: S. Fluhrer; P. Kampanakis; D. McGrew; V. Smyslov
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: IKEv2; IPsec; IKEv1
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: Internet Engineering Task Force (IETF); Internet Engineering Steering Group (IESG)
- **Compliance Frameworks Referenced**: BCP 78; Simplified BSD License
- **Classical Algorithms Referenced**: Diffie-Hellman; Elliptic Curve Diffie-Hellman; Pseudorandom Function
- **Key Takeaways**: Organizations can achieve quantum security in IKEv2 by mixing preshared keys into the key derivation function without replacing existing authentication methods; The extension allows detection of secret mismatches by stirring the PPK into SK_pi and SK_pr values; Implementations must support mandatory or optional PPK flags to handle misconfiguration scenarios where peers lack shared secrets; The PPK is only used during initial IKE SA setup and not for rekeying or resumption operations.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Mixing preshared keys with existing (EC)DH and PKI authentication to strengthen security without replacing current mechanisms
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Network Engineer
- **Implementation Prerequisites**: Configurable flag for mandatory PPK usage; List of Post-quantum Preshared Keys with identifiers (PPK_ID); Support for USE_PPK, PPK_IDENTITY, and NO_PPK_AUTH notification payloads
- **Relevant PQC Today Features**: vpn-ssh-pqc; hybrid-crypto; crypto-agility; pqc-risk-management; migration-program

---

## BSI TR-02102-1

- **Reference ID**: BSI TR-02102-1
- **Title**: Cryptographic Mechanisms: Recommendations and Key Lengths
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-2

- **Reference ID**: BSI TR-02102-2
- **Title**: Cryptographic Mechanisms: Recommendations for TLS
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-3

- **Reference ID**: BSI TR-02102-3
- **Title**: Cryptographic Mechanisms: Recommendations for IPsec
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Position Paper

- **Reference ID**: ANSSI PQC Position Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition
- **Authors**: ANSSI France
- **Publication Date**: 2022-01-01
- **Last Updated**: 2022-01-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Follow-up Paper

- **Reference ID**: ANSSI PQC Follow-up Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition (2023 Follow-up)
- **Authors**: ANSSI France
- **Publication Date**: 2023-12-01
- **Last Updated**: 2023-12-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## CISA-PQC-CATEGORY-LIST-2026

- **Reference ID**: CISA-PQC-CATEGORY-LIST-2026
- **Title**: CISA PQC Product Category List (Updated per EO 14306)
- **Authors**: CISA/NSA
- **Publication Date**: 2025-12-01
- **Last Updated**: 2026-01-23
- **Document Status**: Published (Updated)
- **Main Topic**: CISA provides updated lists of hardware and software product categories where post-quantum cryptography (PQC) products are widely available or transitioning, in response to Executive Order 14306.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, LMS, HMS, XMSS, XMSSMT
- **Quantum Threats Addressed**: cryptographically relevant quantum computer (CRQC)
- **Migration Timeline Info**: By December 1, 2025, CISA shall release and regularly update a list of product categories with widely available PQC products; organizations should plan acquisitions to procure only PQC-capable products in listed categories.
- **Applicable Regions / Bodies**: United States; Cybersecurity and Infrastructure Security Agency (CISA); National Security Agency (NSA); General Services Administration (GSA); Federal Civilian Executive Branch (FCEB)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Public key infrastructure (PKI); Hardware security modules (HSM); Key establishment; Digital signatures
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: Federal Information Processing Standards (FIPS) 203; Federal Information Processing Standards (FIPS) 204; Federal Information Processing Standards (FIPS) 205; NISTSP 800-208; Executive Order 14306
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations should acquire only PQC-capable products in categories listed as widely available; Table 3 lists categories where manufacturer implementation of PQC is encouraged but not yet widely available; Products must support PQC for key establishment and digital signatures to be fully quantum resistant; Operational technology (OT) and internet of things (IoT) devices are out of scope for these specific lists.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Organizations may need to use non-PQC algorithms for a time for interoperability reasons even after procuring PQC products; CISA will move product categories from Table 3 to Table 2 as they mature their capabilities and transition to PQC.
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer, Security Architect, Procurement Officer, Policy Maker
- **Implementation Prerequisites**: Products must implement PQC for core features and all secondary functionality such as software updates; Organizations must plan acquisitions in accordance with typical procurement policies and procedures.
- **Relevant PQC Today Features**: Compliance, Migrate, Assess, Algorithms, stateful-signatures

---

## ETSI-TS-104-015

- **Reference ID**: ETSI-TS-104-015
- **Title**: Efficient Quantum-Safe Hybrid Key Exchanges with Hidden Access Policies (Covercrypt)
- **Authors**: ETSI
- **Publication Date**: 2025-02-01
- **Last Updated**: 2025-02-01
- **Document Status**: Published Technical Specification
- **Main Topic**: Defines the Covercrypt scheme, a Key Encapsulation Mechanism with Access Control (KEMAC) providing hybrid pre- and post-quantum security with hidden access policies.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: ETSI
- **Leaders Contributions Mentioned**: Shoup
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: ETSI
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Hybrid KEMs retain pre- and post-quantum security through hybridization; Keys are encapsulated with respect to user attributes enabling precise access control; Encapsulations are anonymous while allowing optional tracing by a tracing authority; The scheme is designed for efficiency suitable for browser or mobile use.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid Key Encapsulation Mechanisms (KEMs) combining pre-quantum and post-quantum security
- **Performance & Size Considerations**: Encapsulation and decapsulation in hundreds of microseconds
- **Target Audience**: Security Architect, Developer, Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: hybrid-crypto, algorithms, tls-basics, pki-workshop, data-asset-sensitivity

---

## draft-wang-ipsecme-hybrid-kem-ikev2-frodo-03

- **Reference ID**: draft-wang-ipsecme-hybrid-kem-ikev2-frodo-03
- **Title**: Post-quantum Hybrid Key Exchange in IKEv2 with FrodoKEM
- **Authors**: IETF IPSECME WG
- **Publication Date**: 2024-12-24
- **Last Updated**: 2026-01-12
- **Document Status**: Internet-Draft (Call for WG Adoption)
- **Main Topic**: Specification of FrodoKEM as an additional post-quantum key encapsulation mechanism for hybrid key exchange in IKEv2 to mitigate quantum threats.
- **PQC Algorithms Covered**: FrodoKEM, ML-KEM, Classic McEliece, SIKE
- **Quantum Threats Addressed**: Cryptographically Relevant Quantum Computers (CRQCs), harvest now and decrypt later (HNDL) attack
- **Migration Timeline Info**: WG adoption call ending Feb 2026; Document expires 27 June 2026; NIST standardized ML-KEM in August 2024; SIKE broken in July 2022
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Guilin WANG (Editor), Leonie Bruckert, Valery Smyslov
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: IKEv2, IPsec
- **Infrastructure Layers**: Key Management, Security Association (SA) setup
- **Standardization Bodies**: IETF, ISO, NIST
- **Compliance Frameworks Referenced**: BCP 78, BCP 79, BCP 14, RFC2119, RFC8174, FIPS203
- **Classical Algorithms Referenced**: ECDH, AES128, SHAKE 128, Diffie-Hellman
- **Key Takeaways**: FrodoKEM provides conservative security based on unstructured lattices compared to structured lattice algorithms like ML-KEM; Hybrid key exchange in IKEv2 allows up to 7 layers of additional KEMs to derive shared secrets; FrodoKEM public keys and ciphertexts are roughly 13 times larger than ML-KEM, triggering IKE fragmentation; Diversity of PQ algorithms supports cryptographic agility against potential future algorithm breaks like SIKE; Specification includes both AES and SHAKE variants of FrodoKEM for optimized performance across different hardware platforms
- **Security Levels & Parameters**: NIST security levels 3 and 5; FrodoKEM-976; FrodoKEM-1344
- **Hybrid & Transition Approaches**: Hybrid key encapsulation mechanisms (KEMs); Multiple key exchanges in IKEv2; Cryptographic agility; Use of traditional key exchange (ECDH) combined with PQ KEMs
- **Performance & Size Considerations**: FrodoKEM public key and ciphertext sizes are roughly 13 times larger than ML-KEM; Triggers IKE fragmentation
- **Target Audience**: Security Architect, Developer, Researcher, Policy Maker
- **Implementation Prerequisites**: Support for RFC9370 framework; Hardware acceleration for AES (AES-NI) or general-purpose CPUs for SHAKE variants; Ability to handle IKE fragmentation due to larger key sizes
- **Relevant PQC Today Features**: hybrid-crypto, crypto-agility, vpn-ssh-pqc, Algorithms, Threats

---

## draft-turner-lamps-cms-fn-dsa-00

- **Reference ID**: draft-turner-lamps-cms-fn-dsa-00
- **Title**: Use of the FN-DSA Signature Algorithm in the Cryptographic Message Syntax (CMS)
- **Authors**: IETF LAMPS
- **Publication Date**: 2025-11-04
- **Last Updated**: 2025-11-04
- **Document Status**: Internet-Draft (Individual Submission)
- **Main Topic**: This document specifies conventions and algorithm identifiers for using the FN-DSA signature algorithm in the Cryptographic Message Syntax (CMS).
- **PQC Algorithms Covered**: FN-DSA, SLH-DSA, ML-DSA
- **Quantum Threats Addressed**: Cryptographically Relevant Quantum Computer (CRQC)
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; NIST
- **Leaders Contributions Mentioned**: Daniel Van Geest; Sean Turner
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: CMS, X.509
- **Infrastructure Layers**: PKI
- **Standardization Bodies**: IETF, NIST
- **Compliance Frameworks Referenced**: FIPS 206, BCP 78, BCP 79, BCP 14, RFC 2119, RFC 8174, RFC 5652, RFC 8032, RFC 8419, RFC 9814, RFC 9882, FIPS 180
- **Classical Algorithms Referenced**: SHA-2, SHA-3, SHA-512
- **Key Takeaways**: FN-DSA offers smaller signatures and faster runtimes than SLH-DSA; Only pure mode of FN-DSA is specified for CMS usage; SHA-512 must be supported for all FN-DSA parameter sets in this document; The context string input for FN-DSA is set to the empty string in this specification.
- **Security Levels & Parameters**: FN-DSA-512, FN-DSA-1024
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: FN-DSA signature generation and verification is significantly faster than SLH-DSA; FN-DSA offers smaller signatures than SLH-DSA
- **Target Audience**: Developer, Security Architect, Researcher
- **Implementation Prerequisites**: Support for SHA-512 digest algorithm; ASN.1 encoding compatible with RFC 5911 or X680; Use of pure mode signature generation
- **Relevant PQC Today Features**: Algorithms, email-signing, pki-workshop, stateful-signatures, digital-id

---

## draft-ietf-cose-falcon-04

- **Reference ID**: draft-ietf-cose-falcon-04
- **Title**: FN-DSA for JOSE and COSE
- **Authors**: IETF COSE WG
- **Publication Date**: 2025-10-12
- **Last Updated**: 2025-10-12
- **Document Status**: Internet-Draft
- **Main Topic**: Defines FN-DSA algorithm identifiers and serialization formats for JSON Object Signing and Encryption (JOSE) and CBOR Object Signing and Encryption (COSE).
- **PQC Algorithms Covered**: FN-DSA, FN-DSA-512, FN-DSA-1024
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: US NIST FIPS 206 expected to be published in late 2026 early 2027; WG milestone Jan 2026
- **Applicable Regions / Bodies**: United States; Bodies: IETF, NIST
- **Leaders Contributions Mentioned**: Michael Prorock, Orie Steele, Hannes Tschofenig
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: JOSE, COSE
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: IETF, NIST
- **Compliance Frameworks Referenced**: US NIST FIPS 206, BCP 78, BCP 79, RFC7515, RFC7517, RFC9052, RFC9053
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: FN-DSA serializations are defined for JOSE and COSE to support post-quantum signatures; Implementations must ensure constant-time Gaussian sampling to prevent side-channel leakage; Public keys should be validated against encoding constraints before use; Randomness for signature generation must originate from a cryptographically secure high-entropy source
- **Security Levels & Parameters**: FN-DSA-512, FN-DSA-1024
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: FN-DSA-512 signature 666 bytes; FN-DSA-512 public key 897 bytes; FN-DSA-512 private key 1281 bytes; FN-DSA-1024 signature 1280 bytes; FN-DSA-1024 public key 1793 bytes; FN-DSA-1024 private key 2305 bytes
- **Target Audience**: Developer, Security Architect, Researcher
- **Implementation Prerequisites**: Constant-time arithmetic for sampling; Uniform memory access patterns; Secure source of randomness; Public key validation against encoding constraints
- **Relevant PQC Today Features**: Algorithms, entropy-randomness, api-security-jwt, digital-id, stateful-signatures

---

## EO-14306

- **Reference ID**: EO-14306
- **Title**: Executive Order 14306 — Sustaining Select Cybersecurity Efforts (PQC Provisions)
- **Authors**: White House
- **Publication Date**: 2025-06-06
- **Last Updated**: 2025-06-06
- **Document Status**: Executive Order
- **Main Topic**: CISA released a list of product categories supporting post-quantum cryptography standards pursuant to Executive Order 14306 to assist organizations in migration strategies.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum computing poses a threat to the confidentiality, integrity, and accessibility of sensitive data relying on public-key cryptography
- **Migration Timeline Info**: Requires TLS 1.3 adoption by 2030; Executive Order 14306 issued June 6, 2025
- **Applicable Regions / Bodies**: United States; Cybersecurity and Infrastructure Security Agency (CISA); Department of Homeland Security (DHS); National Security Agency (NSA)
- **Leaders Contributions Mentioned**: Madhu Gottumukkala, Acting Director of CISA; President Trump
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.3
- **Infrastructure Layers**: Cloud services; web software; networking hardware and software; endpoint security; key establishment; digital signatures
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Executive Order 14306; Executive Order 13694; Executive Order 14144
- **Classical Algorithms Referenced**: public-key cryptography
- **Key Takeaways**: Organizations must prioritize procurement of PQC-capable technologies to address quantum threats; CISA list identifies hardware and software categories supporting PQC standards; Migration strategies should focus on key establishment and digital signatures; The product list will be regularly updated to reflect the evolving technology landscape
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Technologies transitioning to use PQC standards
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Threats; Compliance; Migrate; Assess

---

## CA-B-Forum-Ballot-SMC013

- **Reference ID**: CA-B-Forum-Ballot-SMC013
- **Title**: CA/Browser Forum Ballot SMC013 - Enable PQC Algorithms for S/MIME
- **Authors**: CA/Browser Forum
- **Publication Date**: 2025-07-02
- **Last Updated**: 2025-08-22
- **Document Status**: Adopted
- **Main Topic**: Ballot SMC013 enables ML-DSA and ML-KEM post-quantum algorithms in S/MIME certificates through updated Baseline Requirements.
- **PQC Algorithms Covered**: ML-DSA, ML-KEM
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Adopted August 22, 2025; intended to enable experimentation by Certificate Issuers
- **Applicable Regions / Bodies**: Bodies: CA/Browser Forum, U.S. National Institute of Standards and Technology (NIST)
- **Leaders Contributions Mentioned**: Stephen Davidson (proposed ballot); Andreas Henschel (endorsed); Martijn Katerbarg (endorsed); Client Wilson (endorsed Ballot SMC014); Ashish Dhiman (endorsed Ballot SMC014)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: S/MIME
- **Infrastructure Layers**: PKI, Certificate Issuers, Certificate Consumers
- **Standardization Bodies**: CA/Browser Forum, U.S. National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: Baseline Requirements for the Issuance and Management of Publicly-Trusted S/MIME Certificates (S/MIME BR v1.0.11), CA/Browser Forum Intellectual Property Rights Policy (v1.3)
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Ballot SMC013 enables single-key/non-hybrid PQC certificates for S/MIME; The ballot specifies ML-DSA and ML-KEM algorithms standardized by NIST; Adoption requires two-thirds of Certificate Issuer votes and 50% plus one of Certificate Consumer votes; Root programs may impose additional requirements on PQC use; No IPR Exclusion Notices were filed during the review period
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Single-key/non-hybrid PQC certificates that do not rely upon pre-quantum algorithms
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Compliance Officer, Policy Maker, Certificate Issuer, Certificate Consumer
- **Implementation Prerequisites**: Adoption of S/MIME Baseline Requirements v1.0.11; adherence to CA/Browser Forum Bylaws 2.3(6) and 2.3(7); potential additional requirements from Root programs
- **Relevant PQC Today Features**: email-signing, pki-workshop, algorithms, compliance, leaders

---

## draft-kampanakis-curdle-ssh-pq-ke

- **Reference ID**: draft-kampanakis-curdle-ssh-pq-ke
- **Title**: Post-Quantum Key Exchange for SSH using ML-KEM
- **Authors**: IETF CURDLE WG
- **Publication Date**: 2024-03-01
- **Last Updated**: 2024-07-15
- **Document Status**: Internet-Draft
- **Main Topic**: Defines Post-Quantum Traditional Hybrid key exchange methods combining ML-KEM and X25519 for the SSH Transport Layer Protocol.
- **PQC Algorithms Covered**: ML-KEM
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Panos Kampanakis; Douglas Stebila; Torben Hansen
- **PQC Products Mentioned**: OpenSSH
- **Protocols Covered**: SSH Transport Layer Protocol
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: FIPS 203
- **Classical Algorithms Referenced**: X25519; ECDH
- **Key Takeaways**: Hybrid key exchange methods combine traditional ECDH with post-quantum schemes for SSH; The defined method uses ML-KEM-768 and X25519 with SHA-256; Implementation is available in OpenSSH 9.9+; This document defines PQ/T hybrid methods specifically for the SSH Transport Layer Protocol
- **Security Levels & Parameters**: ML-KEM-768
- **Hybrid & Transition Approaches**: Hybrid key exchange combining ML-KEM and X25519
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect
- **Implementation Prerequisites**: OpenSSH 9.9+
- **Relevant PQC Today Features**: hybrid-crypto; vpn-ssh-pqc; Algorithms; Migrate

---

## draft-josefsson-ntruprime-ssh

- **Reference ID**: draft-josefsson-ntruprime-ssh
- **Title**: NTRU Prime Key Agreement for SSH
- **Authors**: IETF Individual Submission
- **Publication Date**: 2022-01-01
- **Last Updated**: 2022-01-01
- **Document Status**: Internet-Draft (Individual Submission)
- **Main Topic**: Defines a hybrid SSH key exchange method using Streamlined NTRU Prime sntrup761 and X25519 with SHA-512.
- **PQC Algorithms Covered**: sntrup761
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Markus Friedl; Jan Mojzis; Simon Josefsson
- **PQC Products Mentioned**: OpenSSH
- **Protocols Covered**: SSH
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: X25519; SHA-512
- **Key Takeaways**: Hybrid key exchange combines Streamlined NTRU Prime with classical algorithms for SSH; The method is widely deployed in OpenSSH 9.0+; The algorithm uses sntrup761 paired with X25519 and SHA-512; This document describes an expired Internet-Draft replaced by a new draft
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid key exchange using Streamlined NTRU Prime sntrup761 and X25519
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect
- **Implementation Prerequisites**: OpenSSH 9.0+
- **Relevant PQC Today Features**: hybrid-crypto; vpn-ssh-pqc; Algorithms

---

## draft-ietf-pquip-hbs-state

- **Reference ID**: draft-ietf-pquip-hbs-state
- **Title**: Hash-based Signatures: State and Backup Management
- **Authors**: IETF PQUIP WG
- **Publication Date**: 2024-01-01
- **Last Updated**: 2026-02-24
- **Document Status**: In IESG Review
- **Main Topic**: Guidance on managing state and backup for Stateful Hash-Based Signature schemes to prevent catastrophic key reuse.
- **PQC Algorithms Covered**: LMS, HSS, XMSS, XMSS^MT, SLH-DSA, ML-DSA
- **Quantum Threats Addressed**: Attacks using large-scale quantum computers; forgery via OTS key reuse
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: IETF, NIST, NSA, ETSI
- **Leaders Contributions Mentioned**: Thom Wiggers, Kaveh Bashiri, Stefan Kölbl, Jim Goodman, Stavros Kousidis
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509, SUIT
- **Infrastructure Layers**: Key Management, Hardware Security Modules (HSM)
- **Standardization Bodies**: IETF, NIST, ETSI
- **Compliance Frameworks Referenced**: FIPS 204, FIPS 205, SP-800-208, CNSA 2.0
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Stateful HBS are not general-purpose and require tight control of the signing environment; Reusing an OTS key allows computationally feasible forgeries; Backup mechanisms must prevent re-using previously used OTS keys; Distributed signing requires synchronization to avoid state overlap; Purpose-designed hardware like HSMs may be required to meet security requirements
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Limited number of signatures per private key; Stateful HBS offer smaller run time, implementation size, or signature/key sizes compared to stateless alternatives
- **Target Audience**: Security Architect, Developer, Operations
- **Implementation Prerequisites**: Purpose-designed hardware such as hardware security modules; Synchronization mechanisms for distributed signers; Secure backup mechanisms preventing OTS key reuse
- **Relevant PQC Today Features**: stateful-signatures, code-signing, iot-ot-pqc, hsm-pqc, pki-workshop

---

## BSI TR-02102-1

- **Reference ID**: BSI TR-02102-1
- **Title**: Cryptographic Mechanisms: Recommendations and Key Lengths
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-2

- **Reference ID**: BSI TR-02102-2
- **Title**: Cryptographic Mechanisms: Recommendations for TLS
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-3

- **Reference ID**: BSI TR-02102-3
- **Title**: Cryptographic Mechanisms: Recommendations for IPsec
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Position Paper

- **Reference ID**: ANSSI PQC Position Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition
- **Authors**: ANSSI France
- **Publication Date**: 2022-01-01
- **Last Updated**: 2022-01-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Follow-up Paper

- **Reference ID**: ANSSI PQC Follow-up Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition (2023 Follow-up)
- **Authors**: ANSSI France
- **Publication Date**: 2023-12-01
- **Last Updated**: 2023-12-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## draft-sfluhrer-ipsecme-ikev2-mldsa-01

- **Reference ID**: draft-sfluhrer-ipsecme-ikev2-mldsa-01
- **Title**: Post-quantum Digital Signatures with ML-DSA in IKEv2
- **Authors**: IETF IPSECME WG
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-01-01
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
- **Relevant PQC Today Features**: Algorithms, Threats, vpn-ssh-pqc, crypto-agility, migration-program

---

## draft-ietf-tls-mldsa-02

- **Reference ID**: draft-ietf-tls-mldsa-02
- **Title**: ML-DSA for TLS 1.3
- **Authors**: IETF TLS WG
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-09-26
- **Document Status**: Internet-Draft
- **Main Topic**: This memo specifies how the post-quantum signature scheme ML-DSA (FIPS 204) is used for authentication in TLS 1.3 via signature_algorithms and signature_algorithms_cert extensions.
- **PQC Algorithms Covered**: ML-DSA, ML-DSA-44, ML-DSA-65, ML-DSA-87
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Tim Hollebeek; Sophie Schmieg; Bas Westerbaan; Alicja Kario; John Mattsson; Rebecca Guthrie; Alexander Bokovoy; Niklas Block; Ryan Appel; Loganaden Velvindron
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.3, TLS 1.2
- **Infrastructure Layers**: PKI
- **Standardization Bodies**: IETF, NIST
- **Compliance Frameworks Referenced**: FIPS 204, BCP 78, BCP 79, BCP 14
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: ML-DSA signature schemes are negotiated via signature_algorithms and signature_algorithms_cert extensions in TLS 1.3; Three new SignatureScheme values (mldsa44, mldsa65, mldsa87) correspond to FIPS 204 parameter sets; The context parameter for ML-DSA MUST be the empty string in TLS handshakes; These schemes MUST NOT be used in TLS 1.2 or earlier versions; Security considerations from RFC 8446 and FIPS 204 apply to this deployment
- **Security Levels & Parameters**: ML-DSA-44, ML-DSA-65, ML-DSA-87
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect, Protocol Engineer
- **Implementation Prerequisites**: TLS 1.3 support; FIPS 204 compliance; AlgorithmIdentifier mapping per Table 1; Empty string context parameter
- **Relevant PQC Today Features**: Algorithms, tls-basics, pki-workshop, crypto-agility

---

## RFC 9690

- **Reference ID**: RFC 9690
- **Title**: Use of the RSA-KEM Algorithm in the Cryptographic Message Syntax (CMS)
- **Authors**: IETF LAMPS
- **Publication Date**: 2024-12-01
- **Last Updated**: 2024-12-01
- **Document Status**: Proposed Standard
- **Main Topic**: Defines conventions for using the RSA-KEM algorithm in Cryptographic Message Syntax (CMS) EnvelopedData using KEMRecipientInfo to obsoletes RFC 5990.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: R. Housley; S. Turner
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Cryptographic Message Syntax (CMS); S/MIME
- **Infrastructure Layers**: PKI; Key Management
- **Standardization Bodies**: Internet Engineering Task Force (IETF); ISO/IEC
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; KDF3; SHA-256; AES-Wrap-128; Triple-DES; Camellia; SHA-1; PKCS #1 v1.5
- **Key Takeaways**: RSA-KEM provides higher security assurance than other RSA variants by using a random integer input independent of keying material; Implementations MUST support KDF3 with SHA-256 and AES-Wrap-128 for CMS compatibility; The document obsoletes RFC 5990 by moving from KeyTransRecipientInfo to the KEMRecipientInfo structure; Backward compatibility is maintained via the id-rsa-kem-spki alias for legacy implementations.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Supports hybrid RSA+ML-KEM migration scenarios for S/MIME; Backward compatibility with RFC 5990 KeyTransRecipientInfo structure
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect; Compliance Officer
- **Implementation Prerequisites**: Support for KDF3 with SHA-256; Support for AES-Wrap-128 key-encryption algorithm; Implementation of Encapsulate and Decapsulate functions; ASN.1 syntax support using BER or DER
- **Relevant PQC Today Features**: hybrid-crypto; email-signing; pki-workshop; crypto-agility; tls-basics

---

## RFC 8551

- **Reference ID**: RFC 8551
- **Title**: Secure/Multipurpose Internet Mail Extensions (S/MIME) Version 4.0 Message Specification
- **Authors**: IETF LAMPS
- **Publication Date**: 2019-04-01
- **Last Updated**: 2019-04-01
- **Document Status**: Proposed Standard
- **Main Topic**: This document defines Secure/Multipurpose Internet Mail Extensions (S/MIME) version 4.0 as a standard for signing and encrypting MIME data using Cryptographic Message Syntax.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: J. Schaad; B. Ramsdell; S. Turner
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: S/MIME; MIME; CMS; PKCS #7; HTTP; SIP
- **Infrastructure Layers**: PKI; Certificate Management
- **Standardization Bodies**: Internet Engineering Task Force (IETF); Internet Engineering Steering Group (IESG); IANA; ITU-T
- **Compliance Frameworks Referenced**: BCP 78; Simplified BSD License
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: S/MIME 4.0 obsoletes RFC 5751 and defines version 4.0 of the message specification; The standard provides authentication, message integrity, non-repudiation, data confidentiality, and compression services; S/MIME agents must follow specifications in CMS, RFC3370, RFC4056, RFC3560, and RFC5754 to create messages; Receiving agents should be liberal in what they receive while sending agents should be conservative in what they send; The specification supports transport via traditional mail user agents as well as HTTP and SIP.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect; Compliance Officer
- **Implementation Prerequisites**: Adherence to CMS specifications; Adherence to RFC3370, RFC4056, RFC3560, and RFC5754; Support for application/pkcs7-mime media type; Support for multipart/signed media type
- **Relevant PQC Today Features**: email-signing; pki-workshop; tls-basics; crypto-agility; migration-program

---

## NIST-SP-800-90A-R1

- **Reference ID**: NIST-SP-800-90A-R1
- **Title**: SP 800-90A Rev. 1: Recommendation for Random Number Generation Using Deterministic Random Bit Generators
- **Authors**: NIST
- **Publication Date**: 2015-06-24
- **Last Updated**: 2015-06-24
- **Document Status**: Published
- **Main Topic**: NIST Special Publication 800-90A Rev. 1 specifies mechanisms for generating random bits using deterministic methods based on hash functions or block cipher algorithms.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; NIST
- **Leaders Contributions Mentioned**: Elaine Barker (NIST); John Kelsey (NIST)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: hash functions; block cipher algorithms
- **Key Takeaways**: The document specifies three approved DRBG mechanisms: CTR_DRBG, Hash_DRBG, and HMAC_DRBG; All specified mechanisms use symmetric primitives and are quantum-safe; The recommendation supersedes the 2012 version of SP 800-90A; Methods rely on either hash functions or block cipher algorithms for deterministic random bit generation.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: entropy-randomness; algorithms; compliance

---

## NIST-SP-800-90B

- **Reference ID**: NIST-SP-800-90B
- **Title**: SP 800-90B: Recommendation for the Entropy Sources Used for Random Bit Generation
- **Authors**: NIST
- **Publication Date**: 2018-01-29
- **Last Updated**: 2018-01-29
- **Document Status**: Published
- **Main Topic**: NIST Special Publication 800-90B specifies design principles, requirements, and validation tests for entropy sources used in Random Bit Generators.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NIST, NSA
- **Leaders Contributions Mentioned**: Meltem Sönmez Turan (NIST); Elaine Barker (NIST); John Kelsey (NIST); Kerry McKay (NIST); Mary Baish (NSA); Michael Boyle (NSA)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: SP 800-90A; SP 800-90C
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Entropy sources must be validated using specified health tests including repetition count and adaptive proportion; Min-entropy estimation methods are required for entropy source validation; Entropy sources are intended to be combined with Deterministic Random Bit Generator mechanisms from SP 800-90A; Two errata have been identified for future correction in this publication.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, Compliance Officer, Researcher
- **Implementation Prerequisites**: SP 800-90A Rev. 1; SP 800-90C
- **Relevant PQC Today Features**: entropy-randomness

---

## NIST-SP-800-90C

- **Reference ID**: NIST-SP-800-90C
- **Title**: SP 800-90C: Recommendation for Random Bit Generator (RBG) Constructions
- **Authors**: NIST
- **Publication Date**: 2024-09-25
- **Last Updated**: 2024-09-25
- **Document Status**: Published
- **Main Topic**: NIST Special Publication 800-90C specifies constructions for Random Bit Generators (RBGs) combining entropy sources and deterministic random bit generators into four classes: RBG1, RBG2, RBG3, and RBGC.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NIST
- **Leaders Contributions Mentioned**: Elaine Barker (NIST); John Kelsey (NIST); Kerry McKay (NIST); Allen Roginsky (NIST); Meltem Sönmez Turan (NIST)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: SP 800-90C defines four RBG construction classes (RBG1, RBG2, RBG3, RBGC) for defense-in-depth randomness; RBGs must combine DRBG mechanisms from SP 800-90A with entropy sources from SP 800-90B; The document supports generation of high-quality random bits for both cryptographic and non-cryptographic use; Final publication date is September 2025 following multiple drafts
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, Researcher, Compliance Officer
- **Implementation Prerequisites**: SP 800-90A Rev. 1; SP 800-90B
- **Relevant PQC Today Features**: entropy-randomness

---

## ETSI-GS-QKD-002

- **Reference ID**: ETSI-GS-QKD-002
- **Title**: ETSI GS QKD 002 - QKD Use Cases
- **Authors**: ETSI ISG QKD
- **Publication Date**: 2010-06-01
- **Last Updated**: 2024-01-01
- **Document Status**: Published
- **Main Topic**: ETSI Group Specification GS QKD 002 defines use cases and application scenarios for Quantum Key Distribution across various network layers and sectors.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Europe; Bodies: ETSI
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management, Data Link Layer, Network Layer, Transport Layer, Application Layer
- **Standardization Bodies**: ETSI
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: QKD is classified as a security technology innovation distinct from encryption and message authentication primitives; Use cases include offsite backup, enterprise metropolitan networks, critical infrastructure control, backbone protection, and high security access networks; QKD integration requires consideration of existing optical network infrastructures; The document outlines specific actors, goals, and operational considerations for each defined use case.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Network Engineer, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: qkd, iot-ot-pqc, 5g-security, data-asset-sensitivity, pqc-business-case

---

## ETSI-GS-QKD-003

- **Reference ID**: ETSI-GS-QKD-003
- **Title**: ETSI GS QKD 003 - Components and Internal Interfaces
- **Authors**: ETSI ISG QKD
- **Publication Date**: 2010-10-01
- **Last Updated**: 2024-01-01
- **Document Status**: Published
- **Main Topic**: Defines QKD system components and their internal interfaces for interoperability across various quantum key distribution technologies.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: ETSI; Regions: France
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: BB84
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: ETSI
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: The document identifies common components in QKD systems such as photon sources and detectors; A catalogue of requirements for interfaces between components must be established to support standardization; Relevant properties of quantum physical devices and classical equipment must be identified for subsequent standardization; The specification covers weak laser pulse, entanglement-based, and continuous-variable QKD implementations.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: qkd, entropy-randomness

---

## ETSI-GS-QKD-004

- **Reference ID**: ETSI-GS-QKD-004
- **Title**: ETSI GS QKD 004 - Application Interface (V2.1.1)
- **Authors**: ETSI ISG QKD
- **Publication Date**: 2020-08-01
- **Last Updated**: 2020-08-01
- **Document Status**: Published
- **Main Topic**: Specification of an Application Programming Interface (API) between a Quantum Key Distribution (QKD) key manager and applications for secure key delivery.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: ETSI, OASIS; Regions: France (ETSI location)
- **Leaders Contributions Mentioned**: Tony Cox (Editor of KMIP Specification)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, HTTPS, REST, KMIP, CORBA, SSL, PAP
- **Infrastructure Layers**: Key Management, QKD modules, Link encryptor
- **Standardization Bodies**: ETSI, OASIS, IANA
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: The document defines an API for applications to access keys generated by QKD protocols; A QKD key manager is responsible for synchronizing and delivering identical key sets to communication endpoints; The specification includes sequence diagrams for various scenarios including undefined and predefined Key Stream IDs (KSID); The interface supports application discovery within a QKD network; The document references KMIP as an informative standard for key management interoperability.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect
- **Implementation Prerequisites**: QKD key manager implementation; QKD protocol implementation; Support for REST-based key delivery API (referenced in Annex C)
- **Relevant PQC Today Features**: qkd, kms-pqc, api-security-jwt

---

## BSI TR-02102-1

- **Reference ID**: BSI TR-02102-1
- **Title**: Cryptographic Mechanisms: Recommendations and Key Lengths
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-2

- **Reference ID**: BSI TR-02102-2
- **Title**: Cryptographic Mechanisms: Recommendations for TLS
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-3

- **Reference ID**: BSI TR-02102-3
- **Title**: Cryptographic Mechanisms: Recommendations for IPsec
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Position Paper

- **Reference ID**: ANSSI PQC Position Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition
- **Authors**: ANSSI France
- **Publication Date**: 2022-01-01
- **Last Updated**: 2022-01-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Follow-up Paper

- **Reference ID**: ANSSI PQC Follow-up Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition (2023 Follow-up)
- **Authors**: ANSSI France
- **Publication Date**: 2023-12-01
- **Last Updated**: 2023-12-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ETSI-GS-QKD-005

- **Reference ID**: ETSI-GS-QKD-005
- **Title**: ETSI GS QKD 005 - Security Proofs
- **Authors**: ETSI ISG QKD
- **Publication Date**: 2010-12-01
- **Last Updated**: 2024-01-01
- **Document Status**: Published
- **Main Topic**: Framework for security proofs of Quantum Key Distribution (QKD) protocols including BB84 and related variants.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: ETSI, European Telecommunications Standards Institute
- **Leaders Contributions Mentioned**: V. Scarani; H. Bechmann-Pasquinucci; N. J. Cerf; M. Dusek; N. Lütkenhaus; M. Peev
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: BB84
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: ETSI, European Telecommunications Standards Institute
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Security proofs for QKD must address the subtlety of security definitions and challenges in enforcing assumptions; Violations of assumptions in security proofs can be exploited by adversaries with disastrous consequences; The document distinguishes between the security claim of a protocol based on models and the security claim of its implementation; Parameters for successful QKD change over time and are not specified in this document.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Researcher, Developer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: qkd, security-proofs, quantum-threats, compliance-strategy

---

## ETSI-GS-QKD-008

- **Reference ID**: ETSI-GS-QKD-008
- **Title**: ETSI GS QKD 008 - QKD Module Security Specification
- **Authors**: ETSI ISG QKD
- **Publication Date**: 2010-12-01
- **Last Updated**: 2024-01-01
- **Document Status**: Published
- **Main Topic**: Security requirements and evaluation criteria for Quantum Key Distribution (QKD) modules analogous to Common Criteria.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: ETSI, European Telecommunications Standards Institute
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: BB84
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: ETSI
- **Compliance Frameworks Referenced**: Common Criteria
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: QKD modules require security specifications analogous to conventional cryptographic modules; Eleven security aspects must be addressed for QKD module data security; Physical security and environmental failure protection are critical requirements for QKD modules; Sensitive Security Parameter (SSP) management includes generation, establishment, storage, and zeroization.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: qkd, compliance-strategy, entropy-randomness

---

## ETSI-GS-QKD-011

- **Reference ID**: ETSI-GS-QKD-011
- **Title**: ETSI GS QKD 011 - Component Characterization
- **Authors**: ETSI ISG QKD
- **Publication Date**: 2016-05-01
- **Last Updated**: 2024-01-01
- **Document Status**: Published
- **Main Topic**: Methods for characterizing individual Quantum Key Distribution (QKD) components such as single-photon sources and detectors.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: France; Bodies: ETSI, Group Quantum Key Distribution (QKD) ETSI Industry Specification Group (ISG)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: ETSI, Group Quantum Key Distribution (QKD) ETSI Industry Specification Group (ISG)
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: The document defines measurement procedures for clock frequency and its variation in QKD systems; It prescribes methods for characterizing single-photon sources and detectors; Standardization of electrical and optical inputs/outputs is required for consistent component characterization.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Researcher, Developer, Security Architect
- **Implementation Prerequisites**: Frequency counter; Oscilloscope; Event timer; Sampling oscilloscope; Real-time oscilloscope
- **Relevant PQC Today Features**: qkd

---

## ETSI-GS-QKD-012

- **Reference ID**: ETSI-GS-QKD-012
- **Title**: ETSI GS QKD 012 - Device and Communication Channel Parameters
- **Authors**: ETSI ISG QKD
- **Publication Date**: 2019-02-01
- **Last Updated**: 2024-01-01
- **Document Status**: Published
- **Main Topic**: Specification of device and communication channel parameters for Quantum Key Distribution (QKD) deployment over fibre optical networks.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: ETSI Industry Specification Group (ISG) Quantum Key Distribution (QKD)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: QKD Modules, optical network infrastructure, quantum channel, synchronization channel, distillation channel
- **Standardization Bodies**: ETSI
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: QKD deployment scope is restricted to fibre optical networks and point-to-point communication; Information exchange templates are defined for QKD_O and NET_O entities; Disturbance on the quantum channel is measured by evaluating correlation levels between classical strings shared after quantum communication; Dedicated and multiplexed QKD deployment architectures are defined with specific sub-types
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Network Operator, Researcher
- **Implementation Prerequisites**: Optical network infrastructure; QKD Modules capable of cooperation via appropriate communication channels
- **Relevant PQC Today Features**: qkd

---

## ETSI-GS-QKD-014

- **Reference ID**: ETSI-GS-QKD-014
- **Title**: ETSI GS QKD 014 - Protocol and Data Format for REST-based Key Delivery API
- **Authors**: ETSI ISG QKD
- **Publication Date**: 2019-02-01
- **Last Updated**: 2024-01-01
- **Document Status**: Published
- **Main Topic**: Specification of a REST-based API protocol and JSON data format for delivering cryptographic keys from Quantum Key Distribution networks to applications.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: ETSI Industry Specification Group (ISG) Quantum Key Distribution (QKD)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: HTTPS, TLS 1.2, TLS 1.3, HTTP/1.1
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: ETSI, IETF
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: REST-based API enables interoperability of QKD equipment from different vendors; The specification uses HTTPS for communication and JSON for data encoding; The API supports delivery of block keys with key IDs to applications; The standard aims to encourage new developers into the QKD market by using familiar web technologies.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect
- **Implementation Prerequisites**: Support for HTTPS protocol; Support for JSON data format encoding; Adherence to HTTP/1.1 message syntax and semantics
- **Relevant PQC Today Features**: qkd, api-security-jwt, tls-basics

---

## ETSI-GS-QKD-015

- **Reference ID**: ETSI-GS-QKD-015
- **Title**: ETSI GS QKD 015 - Control Interface for Software Defined Networks
- **Authors**: ETSI ISG QKD
- **Publication Date**: 2021-03-01
- **Last Updated**: 2024-01-01
- **Document Status**: Published
- **Main Topic**: Defines the control interface and YANG information model between Quantum Key Distribution (QKD) nodes and Software-Defined Networking (SDN) controllers.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: ETSI Industry Specification Group (ISG) Quantum Key Distribution (QKD)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Software-Defined Networking, QKD network layer, SDN controller, trusted repeaters
- **Standardization Bodies**: ETSI
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: The document defines a vendor-agnostic YANG information model to abstract QKD resources for SDN controllers; Integration of QKD systems requires both physical level control (e.g., spectrum allocation) and logical connection to management architectures; Centralized SDN controllers enable an end-to-end view of the network to optimize quantum signal transmission and key delivery; The specification facilitates the simultaneous management of classical and quantum network parts using well-known mechanisms.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, Network Engineer
- **Implementation Prerequisites**: YANG models for SD-QKD nodes; SDN controller capable of managing quantum and classical network parts; QKD systems with SDN-Agent capabilities
- **Relevant PQC Today Features**: qkd, hybrid-crypto, crypto-agility, 5g-security

---

## ETSI-GS-QKD-016

- **Reference ID**: ETSI-GS-QKD-016
- **Title**: ETSI GS QKD 016 - Orchestration Interface of Software Defined Networks
- **Authors**: ETSI ISG QKD
- **Publication Date**: 2023-09-01
- **Last Updated**: 2024-01-01
- **Document Status**: Published
- **Main Topic**: This document defines a Common Criteria Protection Profile for a pair of Prepare and Measure Quantum Key Distribution modules within Software Defined Network orchestration environments.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Eavesdropping on QKD link data; Manipulation of QKD link data
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: ETSI Quantum Key Distribution (QKD) Industry Specification Group (ISG)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Software Defined Networks; Orchestration Interface; Key Management
- **Standardization Bodies**: ETSI
- **Compliance Frameworks Referenced**: Common Criteria Protection Profile
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: The document establishes security objectives for QKD modules including user identification, access control, and authenticated classical channels; It defines specific threats such as session hijacking, eavesdropping, and exploitation of TOE malfunction; Secure End of Life states and audit capabilities are mandatory requirements for the Target of Evaluation; The specification assumes operation in a secure area with diligent maintenance by trustworthy users.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Compliance Officer, Researcher
- **Implementation Prerequisites**: Operation in a secure area; Diligent maintenance; Trustworthy users; Secure End of Life state procedures
- **Relevant PQC Today Features**: qkd, compliance, threats, migration-program, pqc-governance

---

## ETSI-GS-QKD-018

- **Reference ID**: ETSI-GS-QKD-018
- **Title**: ETSI GS QKD 018 - Orchestration Interface of Software Defined Networks
- **Authors**: ETSI ISG QKD
- **Publication Date**: 2022-04-01
- **Last Updated**: 2022-04-01
- **Document Status**: Published
- **Main Topic**: Definition of an orchestration interface and YANG data models for managing Quantum Key Distribution (QKD) resources in Software Defined Networks (SDN).
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: France; Bodies: ETSI, Quantum Key Distribution (QKD) ETSI Industry Specification Group (ISG)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management, Software Defined Networks (SDN), Optical Transport Network (OTN)
- **Standardization Bodies**: ETSI
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: SDN orchestrators enable end-to-end service provisioning by matching QKD nodes with secure application entities in OTNs; YANG data models provide vendor-agnostic information models for the interface between SDN orchestrators and controllers; Separating quantum channels from classical data channels in different optical fibers can optimize QKD network performance; The orchestration interface supports multi-domain key routing and programmable quantum networks; Network operators can mitigate integration burdens by adopting an SDN orchestrator capable of controlling both QKD and OTN networks.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Network Operator, Developer
- **Implementation Prerequisites**: Software Defined Network (SDN) architecture; YANG data models for information modeling; North Bound Interface (NBI) on SDN controllers
- **Relevant PQC Today Features**: qkd, hybrid-crypto, crypto-agility, 5g-security, migration-program

---

## RFC-9258

- **Reference ID**: RFC-9258
- **Title**: Importing External Pre-Shared Keys (PSKs) for TLS 1.3
- **Authors**: IETF TLS Working Group
- **Publication Date**: 2022-07-01
- **Last Updated**: 2022-07-01
- **Document Status**: Proposed Standard
- **Main Topic**: RFC 9258 defines an interface for importing external Pre-Shared Keys into TLS 1.3 by binding them to specific KDFs and hash functions.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: David Benjamin; Christopher A. Wood
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.3; DTLS 1.3; QUICv1
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: IETF; IESG; IANA
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: HKDF; SHA256; SHA384; TLS_AES_128_GCM_SHA256; TLS_AES_256_GCM_SHA384; TLS_CHACHA20_POLY1305_SHA256
- **Key Takeaways**: External PSKs must be bound to a single hash function and KDF to prevent related output security problems; Imported PSKs use a distinct binder key label "imp binder" to differentiate from non-imported keys; Endpoints should provision separate PSKs for TLS 1.3 and prior versions to avoid cross-version reuse risks; The importer interface allows QKD-derived keys to be integrated without modifying the TLS protocol itself; Incremental deployment requires care when existing PSKs are used across TLS 1.2 and TLS 1.3 contexts
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Incremental deployment of imported PSKs alongside non-imported PSKs for prior TLS versions
- **Performance & Size Considerations**: ImportedIdentity context size limit 0 to 65535 octets; ImportedIdentity external_identity size limit 1 to 65535 octets; SHA256 output length 32 octets; Maximum PSK extension size 65535 octets
- **Target Audience**: Developer; Security Architect; Protocol Engineer
- **Implementation Prerequisites**: Support for TLS 1.3 and DTLS 1.3; Knowledge of target KDFs and protocols a priori; Provisioning of ALPN values and QUIC transport parameters for early data use
- **Relevant PQC Today Features**: qkd; tls-basics; crypto-agility; migration-program

---

## NIST-SP-800-108-R1

- **Reference ID**: NIST-SP-800-108-R1
- **Title**: Recommendation for Key Derivation Using Pseudorandom Functions (Revision 1)
- **Authors**: NIST
- **Publication Date**: 2022-08-01
- **Last Updated**: 2022-08-01
- **Document Status**: Final
- **Main Topic**: NIST SP 800-108r1 specifies techniques for deriving additional keying material from a secret key using pseudorandom functions including HMAC, CMAC, and KMAC.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; National Institute of Standards and Technology; Office of Management and Budget; Federal Information Security Modernization Act
- **Leaders Contributions Mentioned**: Lily Chen (Author); Elaine Barker (Colleague providing discussions and comments); Meltem Sönmez Turan (Colleague providing discussions and comments); Rich Davis (National Security Agency, provided discussions and comments)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management; HSM
- **Standardization Bodies**: National Institute of Standards and Technology
- **Compliance Frameworks Referenced**: Federal Information Security Modernization Act (FISMA); OMB Circular A-130
- **Classical Algorithms Referenced**: HMAC; CMAC; KMAC
- **Key Takeaways**: Key derivation functions can use HMAC, CMAC, or KMAC as pseudorandom functions; Key expansion is a two-step process involving randomness extraction and key expansion; This publication has been withdrawn and superseded by NIST SP 800-108r1-upd1; Organizations should review draft publications during public comment periods to provide feedback to NIST
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Compliance Officer; Researcher
- **Implementation Prerequisites**: Use of approved pseudorandom functions (HMAC, CMAC, KMAC); adherence to SP 800-56A and SP 800-56B for key establishment; adherence to SP 800-90A for pseudorandom bit generation
- **Relevant PQC Today Features**: Algorithms; Leaders; hsm-pqc; qkd; entropy-randomness

---

## BSI TR-02102-1

- **Reference ID**: BSI TR-02102-1
- **Title**: Cryptographic Mechanisms: Recommendations and Key Lengths
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-2

- **Reference ID**: BSI TR-02102-2
- **Title**: Cryptographic Mechanisms: Recommendations for TLS
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-3

- **Reference ID**: BSI TR-02102-3
- **Title**: Cryptographic Mechanisms: Recommendations for IPsec
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Position Paper

- **Reference ID**: ANSSI PQC Position Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition
- **Authors**: ANSSI France
- **Publication Date**: 2022-01-01
- **Last Updated**: 2022-01-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Follow-up Paper

- **Reference ID**: ANSSI PQC Follow-up Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition (2023 Follow-up)
- **Authors**: ANSSI France
- **Publication Date**: 2023-12-01
- **Last Updated**: 2023-12-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## NIST-SP-800-56C-R2

- **Reference ID**: NIST-SP-800-56C-R2
- **Title**: Recommendation for Key-Derivation Methods in Key-Establishment Schemes (Revision 2)
- **Authors**: NIST
- **Publication Date**: 2020-08-01
- **Last Updated**: 2020-08-01
- **Document Status**: Final
- **Main Topic**: Specification of one-step and extraction-then-expansion key-derivation methods for deriving keying material from shared secrets in key-establishment schemes.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; National Institute of Standards and Technology; National Security Agency; Office of Management and Budget
- **Leaders Contributions Mentioned**: Elaine Barker; Lily Chen; Richard Davis; Quynh Dang; Sharon Keller; John Kelsey; Allen Roginsky; Meltem Sonmez Turan; Apostol Vassilev; Tim Polk; Miles Smid
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: National Institute of Standards and Technology
- **Compliance Frameworks Referenced**: Federal Information Security Modernization Act (FISMA); OMB Circular A-130; Cryptographic Algorithm Validation Program (CAVP); Cryptographic Module Validation Program (CMVP)
- **Classical Algorithms Referenced**: HMAC; AES-N-CMAC; hash function
- **Key Takeaways**: Keying material must be computed in its entirety before outputting any portion; Hybrid shared secrets combining standard and auxiliary secrets are permitted via concatenation; One-step and extraction-then-expansion methods are the two specified categories for key derivation; Derived keying material shall not be used as a key stream for a stream cipher.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid shared secret of the form Z prime equals Z concatenated with T
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Compliance Officer; Researcher
- **Implementation Prerequisites**: Conformance testing within CAVP and CMVP frameworks; Knowledge and agreement on content, format, length, and generation method of auxiliary shared secret T
- **Relevant PQC Today Features**: hybrid-crypto, entropy-randomness, compliance-strategy, algorithms

---

## PKCS11-V3-OASIS

- **Reference ID**: PKCS11-V3-OASIS
- **Title**: PKCS #11 Cryptographic Token Interface Standard Version 3.0
- **Authors**: OASIS PKCS11 Technical Committee
- **Publication Date**: 2020-06-01
- **Last Updated**: 2020-06-01
- **Document Status**: OASIS Standard
- **Main Topic**: This document defines the PKCS #11 Cryptographic Token Interface Base Specification Version 3.0, an API called Cryptoki for cryptographic tokens and HSMs.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Tony Cox (TC Chair); Robert Relyea (TC Chair); Chris Zimman (Editor); Dieter Bong (Editor); Robert Griffin (Previous Editor); Tim Hudson (Previous Editor)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.3; X.509; WTLS
- **Infrastructure Layers**: HSM; Cryptographic Token Interface; Key Management
- **Standardization Bodies**: OASIS
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; HKDF; SP800_108_COUNTER_KDF; SP800_108_FEEDBACK_KDF; SP800_108_DOUBLE_PIPELINE_KDF
- **Key Takeaways**: PKCS #11 v3.0 adds specific KDF mechanisms for TLS 1.3 and NIST SP 800-108 derivation; The standard is essential for HSM-based QKD integration workflows where secrets are imported as non-extractable keys; Users must use updated header files from the GitHub repository due to flaws in the published Committee Specification; This specification supersedes PKCS #11 Version 2.40; The interface supports technology independence and resource sharing for cryptographic devices.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect; Compliance Officer
- **Implementation Prerequisites**: C or C++ compiler; Updated header files from https://github.com/oasis-tcs/pkcs11/tree/master/working/3-00-current; OASIS IPR Policy compliance
- **Relevant PQC Today Features**: hsm-pqc, qkd, tls-basics, pki-workshop, crypto-agility

---

## PKCS11-V31-OASIS

- **Reference ID**: PKCS11-V31-OASIS
- **Title**: PKCS #11 Specification Version 3.1 (OASIS Standard)
- **Authors**: OASIS PKCS11 Technical Committee
- **Publication Date**: 2023-07-23
- **Last Updated**: 2023-07-23
- **Document Status**: OASIS Standard
- **Main Topic**: PKCS #11 Specification Version 3.1 defines data types, functions, and mechanisms for the Cryptoki interface, including the first inclusion of PQC algorithms LMS and HSS.
- **PQC Algorithms Covered**: LMS; HSS
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Robert Relyea (Chair); Greg Scott (Chair); Dieter Bong (Editor); Tony Cox (Editor)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509; WTLS
- **Infrastructure Layers**: Cryptographic Token Interface; HSM
- **Standardization Bodies**: OASIS
- **Compliance Frameworks Referenced**: FIPS 186-4; BCP 14; RFC2119; RFC8174
- **Classical Algorithms Referenced**: RSA; DSA; ECDSA; EdDSA; XEdDSA; Diffie-Hellman; SHA-1; SHA-224; SHA-256; SHA-384; SHA-512; SHA3; MD2; MD5; RIPE-MD 128; RIPE-MD 160; AES
- **Key Takeaways**: PKCS #11 v3.1 is the first version to support PQC algorithms LMS and HSS for code signing and firmware verification; The specification adds EdDSA mechanisms and incremental MAC operations; Implementations must adhere to OASIS IPR Policy under RF on RAND Terms Mode; Machine-readable content in plain text files prevails over prose narrative discrepancies.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect; Compliance Officer
- **Implementation Prerequisites**: C or C++ compiler support for structure packing and pointer-related macros; Subscription to OASIS TC public comment list for feedback; Adherence to BCP 14 key word interpretation rules.
- **Relevant PQC Today Features**: stateful-signatures; code-signing; hsm-pqc; algorithms

---

## PKCS11-V32-OASIS

- **Reference ID**: PKCS11-V32-OASIS
- **Title**: PKCS #11 Specification Version 3.2 (Committee Specification Draft)
- **Authors**: OASIS PKCS11 Technical Committee
- **Publication Date**: 2025-04-16
- **Last Updated**: 2025-04-16
- **Document Status**: Committee Specification Draft
- **Main Topic**: PKCS #11 Specification Version 3.2 defines data types, functions, and mechanisms for post-quantum cryptography including ML-KEM, ML-DSA, and SLH-DSA within the Cryptoki interface.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Valerie Fenwick (Chair); Robert Relyea (Chair); Dieter Bong (Editor); Greg Scott (Editor)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509, WTLS
- **Infrastructure Layers**: HSM, Key Management
- **Standardization Bodies**: OASIS
- **Compliance Frameworks Referenced**: FIPS 186-4
- **Classical Algorithms Referenced**: RSA, DSA, ECDSA, EdDSA, XEdDSA, Diffie-Hellman, AES, SHA-1, HMAC
- **Key Takeaways**: PKCS #11 v3.2 introduces native support for ML-KEM, ML-DSA, and SLH-DSA mechanisms; New functions C_EncapsulateKey and C_DecapsulateKey enable KEM operations; New key types CKK_ML_KEM, CKK_ML_DSA, and CKK_SLH_DSA are defined; Attributes CKA_PARAMETER_SET, CKA_ENCAPSULATE, CKA_DECAPSULATE, and CKA_SEED support PQC key management; The specification supersedes PKCS #11 Specification Version 3.1
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect
- **Implementation Prerequisites**: C or C++ compiler; PKCS #11 header files (pkcs11.h, pkcs11f.h, pkcs11t.h)
- **Relevant PQC Today Features**: Algorithms, hsm-pqc, crypto-agility, tls-basics, pki-workshop

---

## BIP-32

- **Reference ID**: BIP-32
- **Title**: BIP-32: Hierarchical Deterministic Wallets
- **Authors**: Pieter Wuille (Bitcoin Core)
- **Publication Date**: 2012-02-11
- **Last Updated**: 2021-10-05
- **Document Status**: Final
- **Main Topic**: Defines a standard for hierarchical deterministic wallets enabling the derivation of unlimited key pairs from a single seed using elliptic curve cryptography.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Pieter Wuille
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: secp256k1, HMAC-SHA512, SHA256, RIPEMD160, ECDSA
- **Key Takeaways**: Hierarchical deterministic wallets allow selective sharing of public keys without exposing private keys; Hardened key derivation prevents parent private key leakage from child public keys; Master keys are generated from a seed via HMAC-SHA512 to ensure sufficient entropy; Wallet structures support multiple accounts with separate internal and external key chains for change and receiving addresses.
- **Security Levels & Parameters**: 256-bit master secret key; 32-byte chain code; 78-byte serialized extended key structure; 111-character Base58 encoded string
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Seed length between 128 and 512 bits; 32-byte chain code; 33-byte public or private key data in serialization; 78-byte total structure size before checksum
- **Target Audience**: Developer, Security Architect
- **Implementation Prerequisites**: Support for secp256k1 elliptic curve parameters; HMAC-SHA512 function implementation; Base58 encoding capability; SHA-256 double hashing for checksums
- **Relevant PQC Today Features**: digital-assets, entropy-randomness, key-management

---

## BIP-39

- **Reference ID**: BIP-39
- **Title**: BIP-39: Mnemonic Code for Generating Deterministic Keys
- **Authors**: Marek Palatinus; Pavol Rusnak; Aaron Voisine; Sean Bowe
- **Publication Date**: 2013-09-10
- **Last Updated**: 2021-10-05
- **Document Status**: Final
- **Main Topic**: Standard for encoding entropy as a human-readable mnemonic phrase for wallet seed backup and recovery.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Marek Palatinus; Pavol Rusnak; Aaron Voisine; Sean Bowe
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: BIP-0032
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: SHA256; PBKDF2; HMAC-SHA512
- **Key Takeaways**: Mnemonic sentences encode entropy in multiples of 32 bits ranging from 128 to 256 bits; A checksum derived from the first ENT/32 bits of the SHA256 hash is appended to the initial entropy; The binary seed is generated using PBKDF2 with HMAC-SHA512 and an iteration count of 2048; Using non-English wordlists is strongly discouraged due to limited wallet support; Plausible deniability is provided as every passphrase generates a valid seed.
- **Security Levels & Parameters**: ENT 128 bits; ENT 160 bits; ENT 192 bits; ENT 224 bits; ENT 256 bits; 512-bit derived key; 2048 PBKDF2 iterations
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: 12 words for 128-bit entropy; 15 words for 160-bit entropy; 18 words for 192-bit entropy; 21 words for 224-bit entropy; 24 words for 256-bit entropy; 64 bytes derived key length
- **Target Audience**: Developer; Security Architect
- **Implementation Prerequisites**: UTF-8 NFKD encoding; PBKDF2 function with HMAC-SHA512; 2048 iteration count; wordlist support
- **Relevant PQC Today Features**: entropy-randomness, digital-assets, pqc-101

---

## BIP-44

- **Reference ID**: BIP-44
- **Title**: BIP-44: Multi-Account Hierarchy for Deterministic Wallets
- **Authors**: Marek Palatinus; Pavol Rusnak
- **Publication Date**: 2014-04-24
- **Last Updated**: 2021-10-05
- **Document Status**: Final
- **Main Topic**: Defines a logical hierarchy structure for multi-account deterministic wallets across multiple cryptocurrencies.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Marek Palatinus; Pavol Rusnak
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Wallets must use a 5-level derivation path including purpose, coin type, account, change, and index; Hardened derivation is required for purpose, coin type, and account levels to prevent address reuse across coins; Software must implement an account discovery algorithm that stops after finding 20 consecutive unused addresses; Public derivation is used only for the change and index levels; The specification allows a single master seed to manage unlimited independent cryptocurrencies.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Address gap limit set to 20 unused addresses
- **Target Audience**: Developer, Security Architect
- **Implementation Prerequisites**: BIP-0032 algorithm; BIP-0043 purpose scheme; Account discovery algorithm with gap limit logic
- **Relevant PQC Today Features**: digital-assets, key-management, crypto-agility

---

## SLIP-0010

- **Reference ID**: SLIP-0010
- **Title**: SLIP-0010: Universal Private Key Derivation from Master Private Key
- **Authors**: SatoshiLabs
- **Publication Date**: 2016-04-26
- **Last Updated**: 2021-11-01
- **Document Status**: Final
- **Main Topic**: The document describes SLIP-0010 as an extension of BIP-32 to support Ed25519 and other non-secp256k1 curves for hierarchical deterministic derivation required for Solana.
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
- **Classical Algorithms Referenced**: Ed25519; secp256k1
- **Key Takeaways**: SLIP-0010 extends BIP-32 to support non-secp256k1 curves; The standard specifically enables Ed25519 for HD derivation; This extension is required for Solana implementation
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer
- **Implementation Prerequisites**: BIP-32 support; Ed25519 curve support
- **Relevant PQC Today Features**: digital-assets; algorithms

---

## EIP-55

- **Reference ID**: EIP-55
- **Title**: EIP-55: Mixed-case Checksum Address Encoding
- **Authors**: Vitalik Buterin
- **Publication Date**: 2016-01-14
- **Last Updated**: 2016-01-14
- **Document Status**: Final
- **Main Topic**: Ethereum Improvement Proposal 55 defines a mixed-case checksum address encoding standard using Keccak-256 to detect typos in hexadecimal addresses.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Vitalik Buterin; Alex Van de Sande
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: Ethereum Improvement Proposals
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: Keccak-256
- **Key Takeaways**: The standard provides backwards compatibility with mixed-case hex parsers; It maintains address length at 40 characters while adding error detection; The probability of a mistyped address passing validation is reduced to 0.0247%; Implementation requires hashing the lowercase hexadecimal address string using Keccak-256; Uppercase letters are used when the corresponding hash nibble is 8 or higher
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Address length kept at 40 characters; Average of 15 check bits per address; Mistype pass probability of 0.0247%
- **Target Audience**: Developer; Security Architect
- **Implementation Prerequisites**: eth_utils library; keccak library for JavaScript implementation
- **Relevant PQC Today Features**: digital-assets; algorithms

---

## EIP-155

- **Reference ID**: EIP-155
- **Title**: EIP-155: Simple Replay Attack Protection
- **Authors**: Vitalik Buterin
- **Publication Date**: 2016-10-14
- **Last Updated**: 2016-10-14
- **Document Status**: Final
- **Main Topic**: Introduces chain ID into Ethereum transaction signing to prevent cross-chain replay attacks.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Vitalik Buterin
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: Ethereum Improvement Proposals
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: secp256k1
- **Key Takeaways**: Chain ID must be included in transaction hashing to prevent replay attacks across different networks; Signature parameter v must be adjusted based on chain ID and y-coordinate parity; Existing signature schemes with v=27 or v=28 remain valid for backward compatibility; Unique chain IDs are required for mainnet, testnets, and consortium chains to ensure isolation.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect
- **Implementation Prerequisites**: Hard fork at block number 2,675,000; CHAIN_ID parameter availability; Support for hashing nine RLP encoded elements instead of six.
- **Relevant PQC Today Features**: digital-assets, crypto-agility

---

## BSI TR-02102-1

- **Reference ID**: BSI TR-02102-1
- **Title**: Cryptographic Mechanisms: Recommendations and Key Lengths
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-2

- **Reference ID**: BSI TR-02102-2
- **Title**: Cryptographic Mechanisms: Recommendations for TLS
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-3

- **Reference ID**: BSI TR-02102-3
- **Title**: Cryptographic Mechanisms: Recommendations for IPsec
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Position Paper

- **Reference ID**: ANSSI PQC Position Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition
- **Authors**: ANSSI France
- **Publication Date**: 2022-01-01
- **Last Updated**: 2022-01-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Follow-up Paper

- **Reference ID**: ANSSI PQC Follow-up Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition (2023 Follow-up)
- **Authors**: ANSSI France
- **Publication Date**: 2023-12-01
- **Last Updated**: 2023-12-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## SEC2-v2

- **Reference ID**: SEC2-v2
- **Title**: SEC 2 v2: Recommended Elliptic Curve Domain Parameters
- **Authors**: Standards for Efficient Cryptography Group (SECG)
- **Publication Date**: 2010-01-27
- **Last Updated**: 2010-01-27
- **Document Status**: Final Standard
- **Main Topic**: This document specifies recommended elliptic curve domain parameters over Fp and F2m for use in ECC-based cryptographic implementations.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Daniel R. L. Brown
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: Standards for Efficient Cryptography Group
- **Compliance Frameworks Referenced**: ANSI X9.62; ANSI X9.63; IEEE 1363; IEEE 1363a
- **Classical Algorithms Referenced**: SHA-1; RSA; DSA
- **Key Takeaways**: Implementers should select parameters from this document to encourage interoperable ECC-based solutions; Parameters are provided at security levels corresponding to 96, 112, 128, and higher bits of security; Koblitz curves offer efficient implementation while verifiably random parameters prevent trapdoors; The document will be reviewed every five years to ensure it remains up to date with cryptographic advances.
- **Security Levels & Parameters**: 192-bit; 224-bit; 256-bit; 384-bit; 521-bit; secp192k1; secp192r1; secp224k1; secp224r1; secp256k1; secp256r1; secp384r1; secp521r1; sect163k1; sect163r1; sect163r2; sect233k1; sect233r1; sect239k1; sect283k1; sect283r1; sect409k1; sect409r1; sect571k1; sect571r1
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: 192-bit parameters correspond to 1536-bit RSA/DSA strength; 224-bit parameters correspond to 2048-bit RSA/DSA strength; 256-bit parameters correspond to 3072-bit RSA/DSA strength
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: Compliance with SEC 1; ASN.1 syntax for parameter identification
- **Relevant PQC Today Features**: Algorithms, Assess, compliance-strategy, migration-program

---

## RFC-8032

- **Reference ID**: RFC-8032
- **Title**: RFC 8032: Edwards-Curve Digital Signature Algorithm (EdDSA)
- **Authors**: IETF
- **Publication Date**: 2017-01-01
- **Last Updated**: 2017-01-01
- **Document Status**: Proposed Standard
- **Main Topic**: This document describes the Edwards-curve Digital Signature Algorithm (EdDSA) with recommended parameters for edwards25519 and edwards448 curves.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: A sufficiently large quantum computer would be able to break both Ed25519 and Ed448
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Simon Josefsson; Ilari Liusvaara
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: Internet Research Task Force (IRTF); Crypto Forum Research Group
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: SHAKE256; Schnorr's signature system; Curve25519; Ed448-Goldilocks
- **Key Takeaways**: EdDSA eliminates the need for a unique random number for each signature by using deterministic nonces; Ed25519 operates at around 128-bit security level while Ed448 operates at around 224-bit security level; The algorithm provides high performance and is more resilient to side-channel attacks; EdDSA uses small public keys (32 or 57 bytes) and signatures (64 or 114 bytes); PureEdDSA provides collision resilience where hash-function collisions do not break the system
- **Security Levels & Parameters**: 128-bit security level for Ed25519; 224-bit security level for Ed448
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Public keys 32 bytes for Ed25519 and 57 bytes for Ed448; Signatures 64 bytes for Ed25519 and 114 bytes for Ed448
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms; entropy-randomness; tls-basics

---

## Bitcoin-Whitepaper

- **Reference ID**: Bitcoin-Whitepaper
- **Title**: Bitcoin: A Peer-to-Peer Electronic Cash System
- **Authors**: Satoshi Nakamoto
- **Publication Date**: 2008-10-31
- **Last Updated**: 2008-10-31
- **Document Status**: Published
- **Main Topic**: A proposal for a peer-to-peer electronic cash system using a distributed timestamp server and proof-of-work to solve the double-spending problem without trusted third parties.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Satoshi Nakamoto; Adam Back
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: SHA-256; ECDSA
- **Key Takeaways**: Digital signatures provide ownership verification but require a trusted third party to prevent double-spending unless replaced by a distributed timestamp server; Proof-of-work using CPU power creates an immutable chain where the longest chain represents the majority consensus; Privacy is maintained by keeping public keys anonymous and generating new key pairs for each transaction; Simplified payment verification allows users to verify transactions without running a full node by checking block headers and Merkle branches; Transaction fees and block creation incentives encourage nodes to remain honest and secure the network.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Block header size 80 bytes; Annual storage requirement 4.2MB per year for block headers
- **Target Audience**: Developer; Researcher; Security Architect
- **Implementation Prerequisites**: Peer-to-peer network connectivity; CPU power for proof-of-work; SHA-256 hashing capability; Merkle Tree implementation
- **Relevant PQC Today Features**: digital-assets; merkle-tree-certs; entropy-randomness

---

## Ethereum-Yellow-Paper

- **Reference ID**: Ethereum-Yellow-Paper
- **Title**: Ethereum: A Secure Decentralised Generalised Transaction Ledger
- **Authors**: Gavin Wood (Ethereum Foundation)
- **Publication Date**: 2014-01-01
- **Last Updated**: 2024-01-01
- **Document Status**: Published
- **Main Topic**: Formal specification of the Ethereum Virtual Machine and its transaction-based state machine paradigm as of the Shanghai version.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Dr. Gavin Wood (Founder, Ethereum & Parity); Buterin (proposed kernel of work); Dwork and Naor (proof-of-work usage); Back (value signal system); Vishnumurthy et al. (proof-of-work secured currency); Nakamoto (Bitcoin); Sprankel (Litecoin and Primecoin discussion); Aron (Namecoin discussion); Willett (Mastercoin proposal); Rosenfeld et al. (Coloured Coins project); Boutellier and Heinzen (Ripple discussion); Szabo (smart contracts work); Miller (smart contracts work); Bertoni et al. (Keccak-256 hash function)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Ethereum; Bitcoin; Namecoin; Mastercoin; Coloured Coins; Ripple; Beacon Chain
- **Infrastructure Layers**: Blockchain; Consensus Layer; Execution Layer; Ethereum Virtual Machine
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: ECDSA; Keccak-256; Keccak-512
- **Key Takeaways**: Ethereum implements a generalised transaction-based state machine with arbitrary computation and storage capabilities; The system relies on cryptographic proofs of computational expenditure (proof-of-work) and digital signatures to secure value transfer; Consensus on canonical history is managed by the Beacon Chain protocol post-Paris hard fork; Address derivation utilizes the Keccak-256 hash function while signing uses ECDSA; The Shanghai version defines specific rules for withdrawal operations and block final states.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: One Ether equals 10^18 Wei; Subdenominations include Gwei (10^9), Szabo (10^12), and Finney (10^15)
- **Target Audience**: Developer; Researcher; Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: digital-assets, blockchain-paradigm, classical-crypto, state-machine

---

## OpenSSL-3x-Docs

- **Reference ID**: OpenSSL-3x-Docs
- **Title**: OpenSSL 3.x Documentation
- **Authors**: OpenSSL Project
- **Publication Date**: 2021-09-07
- **Last Updated**: 2024-11-01
- **Document Status**: Current
- **Main Topic**: Official documentation overview for OpenSSL 3.x including FIPS provider tools and PQC provider guidance.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: OpenSSL 3.x
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: FIPS
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Documentation covers OpenSSL 3.x; Includes FIPS provider command-line tools; Provides PQC provider guidance; Redirects to master branch for latest content
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect
- **Implementation Prerequisites**: OpenSSL 3.x
- **Relevant PQC Today Features**: OpenSSL Studio, Algorithms, Compliance

---

## BIP-141

- **Reference ID**: BIP-141
- **Title**: BIP-141: Segregated Witness (Consensus Layer)
- **Authors**: Eric Lombrozo; Johnson Lau; Pieter Wuille (Bitcoin Core)
- **Publication Date**: 2015-12-21
- **Last Updated**: 2021-10-05
- **Document Status**: Final
- **Main Topic**: The document describes BIP-141 Segregated Witness and mentions BIP-360 as a quantum-resistant output type building on witness versioning.
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
- **Key Takeaways**: Segregated Witness separates signature data from transaction inputs; BIP-360 introduces a quantum-resistant output type using SegWit v3; The system utilizes witness versioning including v0 and v1 Taproot.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: digital-assets; stateful-signatures; migration-program

---

## BIP-340

- **Reference ID**: BIP-340
- **Title**: BIP-340: Schnorr Signatures for secp256k1
- **Authors**: Pieter Wuille; Jonas Nick; Tim Ruffing (Bitcoin Core)
- **Publication Date**: 2020-01-19
- **Last Updated**: 2022-03-01
- **Document Status**: Final
- **Main Topic**: Defines 64-byte Schnorr signatures for secp256k1 with provable security, batch verification, and key aggregation as a foundation for Taproot.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum vulnerability in Taproot's Schnorr key-spend path
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: BIP-340, BIP-341, BIP-360
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: Schnorr, secp256k1
- **Key Takeaways**: BIP-340 defines 64-byte Schnorr signatures for secp256k1; Taproot relies on BIP-340 as a required foundation; BIP-360 targets the quantum vulnerability in Taproot's key-spend path; Key aggregation via MuSig2 is supported; Batch verification is enabled by the signature scheme
- **Security Levels & Parameters**: 64-byte signatures
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: 64-byte Schnorr signatures
- **Target Audience**: Developer, Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: digital-assets; algorithms; threats; migration-program

---

## BIP-341

- **Reference ID**: BIP-341
- **Title**: BIP-341: Taproot: SegWit Version 1 Spending Rules
- **Authors**: Pieter Wuille; Jonas Nick; Anthony Towns (Bitcoin Core)
- **Publication Date**: 2020-01-19
- **Last Updated**: 2022-03-01
- **Document Status**: Final
- **Main Topic**: The document describes BIP-341 Taproot activation on Bitcoin and notes that BIP-360 proposes removing the key-spend path due to quantum vulnerability under Shor's algorithm.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Shor's algorithm
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: SegWit Version 1; SegWit v3
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: Schnorr
- **Key Takeaways**: Taproot activates SegWit v1 spending rules with key-spend and script-spend paths; BIP-360 identifies the key-spend path as quantum-vulnerable under Shor's algorithm; A SegWit v3 replacement is proposed to address this vulnerability.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats; Algorithms; digital-assets

---

## Bitcoin-BIP360-P2QRH

- **Reference ID**: Bitcoin-BIP360-P2QRH
- **Title**: Bitcoin BIP-360: Pay to Quantum Resistant Hash (P2QRH)
- **Authors**: Hunter Beast; Bitcoin Core Community
- **Publication Date**: 2024-06-01
- **Last Updated**: 2025-12-18
- **Document Status**: Draft
- **Main Topic**: Proposal to introduce a new Bitcoin output type (P2QRH/P2TSH) using SegWit v3 that removes the quantum-vulnerable key-spend path from Taproot to protect against long-exposure attacks.
- **PQC Algorithms Covered**: ML-DSA, SLH-DSA, FALCON-512
- **Quantum Threats Addressed**: Long-exposure attacks; short-exposure attacks; HNFL risk (Harvest Now Decrypt Later)
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: EthanHeilman (proposed changes to BIP-360, defended naming and SegWit version usage); stevenroose (suggested renaming to P2TS/P2TSH, discussed covenant use cases); cryptoquick (created PR to rename BIP); sipa (argued against removing key-spend path due to privacy concerns); dr-orlovsky (commented on SegWit version payload sizes)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Bitcoin, Taproot (P2TR), SegWit v3, P2QRH, P2TSH
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: SHA256, ECDSA (implied via Taproot/EC tweaking context), NUMS point
- **Key Takeaways**: P2QRH removes the quantum-vulnerable key-spend path from Taproot to protect against long-exposure attacks; PQ signature algorithms are deferred to a future BIP to allow independent debate on output types versus specific algorithms; SegWit version 3 is used for bc1r addresses to provide a mnemonic indicator of quantum resistance; The proposal may be renamed to Pay to Tap Script Hash (P2TSH) to address naming convention concerns and broader utility; Removing the key-spend path may reduce privacy incentives by eliminating the cheaper cooperative spending option.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: 32 bytes saved in transaction size compared to P2TR with NUMS point; 256 bits payload size for SegWit version 3
- **Target Audience**: Developer, Security Architect, Policy Maker
- **Implementation Prerequisites**: Soft fork activation; redefinition of OP_SUCCESSx opcodes; wallet upgrades to support script-spend only outputs
- **Relevant PQC Today Features**: digital-assets, stateful-signatures, crypto-agility, migration-program, pqc-risk-management

---

## Ethereum-EIP4337-AA

- **Reference ID**: Ethereum-EIP4337-AA
- **Title**: EIP-4337: Account Abstraction Using Alt Mempool
- **Authors**: Vitalik Buterin; Yoav Weiss; Ethereum Foundation
- **Publication Date**: 2021-09-29
- **Last Updated**: 2024-01-01
- **Document Status**: Final
- **Main Topic**: EIP-4337 proposes Account Abstraction on Ethereum using a higher-layer UserOperation structure to enable smart contract wallets without consensus-layer changes.
- **PQC Algorithms Covered**: ML-DSA; FALCON
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Vitalik Buterin; Yoav Weiss; Dror Tirosh; Shahaf Nacson; Alex Forshtat; Kristof Gazso; Tjaden Hess
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: EIP-4337; EIP-712; EIP-7702; ERC-4337
- **Infrastructure Layers**: Mempool; Smart Contract Account; EntryPoint contract; Bundler; Paymaster; Factory; Aggregator
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: EIP-4337 enables smart contract wallets to verify ML-DSA or FALCON signatures on mainnet without protocol changes; The proposal avoids consensus-layer adjustments by using a higher-layer UserOperation structure; Smart Contract Accounts can implement arbitrary verification logic including different signature schemes; Bundlers package UserOperations into transactions for inclusion in blocks via the EntryPoint contract; The design supports privacy-preserving applications and atomic multi-operations.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: 192-bit key field; 64-bit sequence field; 32 byte word size for nonce; 6-byte timestamp values for validUntil and validAfter
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: Requires EIP-712; Support for EIP-7702 authorizations; Smart Contract Account implementation of IAccount interface; Bundler infrastructure or MEV-boost integration
- **Relevant PQC Today Features**: Algorithms; digital-assets; crypto-agility; migration-program

---

## BSI TR-02102-1

- **Reference ID**: BSI TR-02102-1
- **Title**: Cryptographic Mechanisms: Recommendations and Key Lengths
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-2

- **Reference ID**: BSI TR-02102-2
- **Title**: Cryptographic Mechanisms: Recommendations for TLS
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-3

- **Reference ID**: BSI TR-02102-3
- **Title**: Cryptographic Mechanisms: Recommendations for IPsec
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Position Paper

- **Reference ID**: ANSSI PQC Position Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition
- **Authors**: ANSSI France
- **Publication Date**: 2022-01-01
- **Last Updated**: 2022-01-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Follow-up Paper

- **Reference ID**: ANSSI PQC Follow-up Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition (2023 Follow-up)
- **Authors**: ANSSI France
- **Publication Date**: 2023-12-01
- **Last Updated**: 2023-12-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## Ethereum-EIP7702

- **Reference ID**: Ethereum-EIP7702
- **Title**: EIP-7702: Set Code for EOA
- **Authors**: Vitalik Buterin; Sam Wilson; Ansgar Dietrichs; Ethereum Foundation
- **Publication Date**: 2024-05-07
- **Last Updated**: 2025-01-01
- **Document Status**: Final
- **Main Topic**: EIP-7702 introduces a new transaction type allowing Externally Owned Accounts to temporarily set executable code via authorization tuples, enabling quantum-safe signing through delegated smart contracts.
- **PQC Algorithms Covered**: ML-DSA; FALCON
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Pectra hard fork
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Vitalik Buterin; Sam Wilson; Ansgar Dietrichs; lightclient
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: EIP-2718; EIP-4844; ERC-4337
- **Infrastructure Layers**: Smart contract wallets; Externally Owned Accounts (EOAs)
- **Standardization Bodies**: Ethereum Improvement Proposals
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: secp256k1; keccak256
- **Key Takeaways**: EOAs can delegate code execution to smart contracts for quantum-safe signature verification without full account migration; Authorization tuples are signed with secp256k1 while the delegated contract verifies PQC signatures; Persistent delegations create friction to unify UX workstreams and minimize fragmentation; The EIP breaks the invariant that msg.sender equals tx.origin only in the topmost execution frame, affecting reentrancy protection checks.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Delegated smart contract verification of PQC signatures on behalf of EOAs using secp256k1 signed authorization tuples
- **Performance & Size Considerations**: PER_AUTH_BASE_COST 12500; PER_EMPTY_ACCOUNT_COST 25000; COLD_ACCOUNT_READ_COST 2600 gas; WARM_STORAGE_READ_COST 100 gas; minimum initcode around 15 bytes; smallest proxy around 50 bytes
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: Requires EIP-2; EIP-161; EIP-1052; EIP-2718; EIP-2929; EIP-2930; EIP-3541; EIP-3607; EIP-4844
- **Relevant PQC Today Features**: digital-assets; migration-program; hybrid-crypto; crypto-agility; algorithms

---

## FRB-FEDS-2025093-Blockchain-PQC

- **Reference ID**: FRB-FEDS-2025093-Blockchain-PQC
- **Title**: Harvest Now Decrypt Later: Post-Quantum Cryptography and Data Privacy Risks for Distributed Ledger Networks
- **Authors**: Federal Reserve Board
- **Publication Date**: 2025-09-01
- **Last Updated**: 2025-09-01
- **Document Status**: Published
- **Main Topic**: This paper analyzes the "harvest now decrypt later" risk posed by future quantum computers to data privacy in distributed ledger networks like Bitcoin and Ethereum.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest Now Decrypt Later
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; Board of Governors of the Federal Reserve System
- **Leaders Contributions Mentioned**: Jillian Mascelli and Megan Rodden analyzed HNDL risks for distributed ledger networks
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Cryptocurrency distributed ledger network maintainers can deploy PQC to protect future security but cannot protect previously recorded transaction data privacy; Bad actors can harvest distributed ledger replicas now to decrypt confidential data later with quantum computers; There is a shortage of mitigations for data privacy risks associated with the HNDL threat within distributed ledger networks
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Researcher, Policy Maker, Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, digital-assets, pqc-risk-management, data-asset-sensitivity

---

## Ethereum-PQC-Tasklist-Ethresearch

- **Reference ID**: Ethereum-PQC-Tasklist-Ethresearch
- **Title**: Tasklist for Post-Quantum Ethereum
- **Authors**: Ethereum Foundation PQC Research Team
- **Publication Date**: 2024-01-01
- **Last Updated**: 2025-06-01
- **Document Status**: Active Research
- **Main Topic**: Ethereum Foundation research tasklist outlining the roadmap to post-quantum Ethereum architecture, including signature replacement and emergency fork paths.
- **PQC Algorithms Covered**: Falcon (FN-DSA), Sphincs-plus (SLH-DSA)
- **Quantum Threats Addressed**: Shor's algorithm, Grover's algorithm, Cryptographically relevant quantum computer
- **Migration Timeline Info**: Australian ASD prohibits SHA256 and AES-128 after 2030
- **Applicable Regions / Bodies**: Australia; Australian ASD
- **Leaders Contributions Mentioned**: p_m (Tasklist author), WizardOfMenlo (Grover cost analysis), pcaversaccio (RIP-7212 and networking points), rdubois-crypto (Hash function properties and FALCON recovery), frangio (Opcode replacement advice), vbuterin (Account abstraction and STARKs), guorong009 (Networking question), Perun (Lattice-based wallet paper reference), Quamtum (Security framework proposal)
- **PQC Products Mentioned**: ETHFALCON, ZKNOX_falconrec.sol
- **Protocols Covered**: DevP2P, Node Discovery v5, BIP39, BIP32, EIP-2333, EIP-4844, EIP-7701, RIP-7212
- **Infrastructure Layers**: Key Management, Consensus layer signature aggregation, ZK-rollups, Node discovery, Light client sync protocols
- **Standardization Bodies**: NIST, Australian ASD
- **Compliance Frameworks Referenced**: FIPS-206, FIPS-205
- **Classical Algorithms Referenced**: ECDSA, ECDH, BLS12-381, Schnorr, AES-128, AES-256, SHA-256, SHA-512, Keccak256, Blake3, HMAC-SHA256, KMAC, Groth16, PLONK, Marlin, BulletProof, secp256k1, P-256 (secp256r1), HKDF
- **Key Takeaways**: Replace ECDSA and BLS12-381 with lattice-based Falcon or hash-based Sphincs-plus; Upgrade address formats from 40 hex characters to 80-128 characters using bech32 checksumming; Implement emergency quantum fork path freezing accounts and leveraging BIP39 with ZK-proofs for fund recovery; Replace KZG verification in EIP-4844 with STARK-based schemes; Upgrade encrypted wallets from AES-128 to AES-256 or ChaCha20
- **Security Levels & Parameters**: Falcon-1024 keys 1.75KB and signatures 1.25KB; SLH-DSA-256 keys 48-128B and signatures 17-51KB; Grover reduces brute-force cost from 2^160 to 2^80
- **Hybrid & Transition Approaches**: Proposed scheme supporting both ECC and new PQ mode; Account abstraction allowing user choice of signature algorithm; Emergency quantum fork path for unplanned Q-Day
- **Performance & Size Considerations**: Falcon-1024 keys 1.75KB; Falcon-1024 signatures 1.25KB; SLH-DSA-256 keys 48-128B; SLH-DSA-256 signatures 17-51KB
- **Target Audience**: Developer, Security Architect, Researcher, Policy Maker
- **Implementation Prerequisites**: Account abstraction standards (EIP-7701); New opcodes for keccak512/sha3-512/sha512/blake3-512; NTT precompile for STARKs and PQ-sig schemes; Modified hashing of public keys in NTT domain
- **Relevant PQC Today Features**: Algorithms, Threats, Migration-program, digital-assets, stateful-signatures

---

## IETF-MTC-Draft-09

- **Reference ID**: IETF-MTC-Draft-09
- **Title**: Merkle Tree Certificates for TLS (draft-ietf-plants-merkle-tree-certs-01)
- **Authors**: David Benjamin (Google); Cloudflare
- **Publication Date**: 2024-06-01
- **Last Updated**: 2026-02-18
- **Document Status**: Internet-Draft (IETF PLANTS WG)
- **Main Topic**: This document defines Merkle Tree Certificates as a new X.509 form integrating public logging to reduce overhead for post-quantum signature algorithms in TLS.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: David Benjamin; Devon O'Brien; Bas Westerbaan; Luke Valenta; Filippo Valsorda
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS; X.509
- **Infrastructure Layers**: PKI
- **Standardization Bodies**: IETF; PLANTS working group
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Merkle Tree Certificates replace individual CA signatures with a single signed root and inclusion proofs; The design reduces PQC TLS handshake authentication data by 63-74%; An optional signatureless optimization decreases message size for up-to-date relying parties; The approach achieves security properties comparable to traditional X.509 and Certificate Transparency
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Reduces PQC TLS handshake authentication data by 63-74%
- **Target Audience**: Security Architect; Developer; Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: merkle-tree-certs; tls-basics; pki-workshop; crypto-agility

---

## RFC-9162

- **Reference ID**: RFC-9162
- **Title**: Certificate Transparency Version 2.0
- **Authors**: IETF
- **Publication Date**: 2021-12-01
- **Last Updated**: 2021-12-01
- **Document Status**: Standards Track RFC
- **Main Topic**: RFC 9162 defines Certificate Transparency Version 2.0, an experimental protocol for publicly logging TLS server certificates using Merkle Trees to enable auditing of CA activity.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: B. Laurie; E. Messeri; R. Stradling
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS; X.509; OCSP; CMS
- **Infrastructure Layers**: PKI; Certificate Transparency Logs
- **Standardization Bodies**: IETF; IESG; IANA
- **Compliance Frameworks Referenced**: BCP 78; Revised BSD License
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: CT v2.0 replaces RFC 6962 and introduces algorithm agility via IANA registries for hash and signature algorithms; Precertificates are now CMS objects to avoid serial number uniqueness violations; TLS servers may present SCTs with inclusion proofs using the new transparency_info extension; Logs use Merkle Trees to ensure append-only properties and detect misbehavior; Clients can asynchronously verify certificate inclusion and log consistency.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Algorithm agility; Supporting v1 and v2 simultaneously
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Compliance Officer; Researcher
- **Implementation Prerequisites**: Support for IANA registries for hash and signature algorithms; Implementation of TransItem structure; TLS extension support for transparency_info
- **Relevant PQC Today Features**: crypto-agility, tls-basics, pki-workshop, merkle-tree-certs

---

## Cloudflare-MTC-Blog

- **Reference ID**: Cloudflare-MTC-Blog
- **Title**: Keeping the Internet fast and secure: introducing Merkle Tree Certificates
- **Authors**: Cloudflare Research
- **Publication Date**: 2025-10-01
- **Last Updated**: 2025-10-01
- **Document Status**: Published
- **Main Topic**: Introduction of Merkle Tree Certificates (MTCs) as a proposal to reduce TLS handshake overhead and enable Post-Quantum cryptography adoption without performance degradation.
- **PQC Algorithms Covered**: ML-DSA-44
- **Quantum Threats Addressed**: harvest now, decrypt later threat; server impersonation via cracked TLS certificates
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Luke Valenta; Christopher Patton; Vânia Gonçalves; Bas Westerbaan
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS; X.509
- **Infrastructure Layers**: Web Public-Key Infrastructure (WebPKI); Certificate Transparency (CT) ecosystem; Certification Authority (CA) logs
- **Standardization Bodies**: NIST; IETF
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: ECDSA-P256; prime256v1
- **Key Takeaways**: Post-quantum signatures like ML-DSA-44 are roughly 20 times larger than current ECDSA signatures, causing significant TLS handshake overhead; Merkle Tree Certificates reduce the TLS handshake to one signature, one public key, and one inclusion proof by moving validation data out-of-band; Certificate Transparency must be integrated as a first-class feature where CAs run their own logs to ensure detectability of mis-issuance; Experimental deployment of MTCs is planned in collaboration with Chrome Security to test feasibility before Q-day.
- **Security Levels & Parameters**: ML-DSA-44 signature size 2,420 bytes; ML-DSA-44 public key size 1,312 bytes; ECDSA-P256 signature size 64 bytes; ECDSA-P256 public key size 64 bytes
- **Hybrid & Transition Approaches**: Merkle Tree Certificates (MTCs); out-of-band dissemination of validation information; experimental deployment
- **Performance & Size Considerations**: ML-DSA-44 signature 2,420 bytes; ML-DSA-44 public key 1,312 bytes; ECDSA-P256 signature 64 bytes; ECDSA-P256 public key 64 bytes; roughly 20-fold increase in size for PQ algorithms; typical handshake overhead of 10s of kilobytes with current PKI; MTC reduces handshake to 1 signature, 1 public key, and 1 Merkle tree inclusion proof
- **Target Audience**: Security Architect; Developer; Policy Maker; Researcher
- **Implementation Prerequisites**: Client must be sufficiently up-to-date to validate out-of-band information; CA must run its own log of issued certificates; collaboration with browser vendors like Chrome Security for experimental deployment
- **Relevant PQC Today Features**: merkle-tree-certs; tls-basics; pki-workshop; threats; algorithms

---

## Radboud-MTC-Thesis-2025

- **Reference ID**: Radboud-MTC-Thesis-2025
- **Title**: Implementation and Analysis of Merkle Tree Certificates for Post-Quantum Secure Authentication in TLS
- **Authors**: M. Pohl (Radboud University)
- **Publication Date**: 2025-06-01
- **Last Updated**: 2025-06-01
- **Document Status**: Published
- **Main Topic**: Implementation and performance analysis of Merkle Tree Certificates as an optimization for post-quantum secure authentication in TLS 1.3.
- **PQC Algorithms Covered**: ML-DSA
- **Quantum Threats Addressed**: Harvest now, decrypt later attack
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Maximilian Pohl (Author); dr. ir. Bart Mennink (Supervisor); prof. dr. Peter Schwabe (Second Reader); Marlon Baeten M.Sc. (Daily Supervisor)
- **PQC Products Mentioned**: Rustls; library to verify MTCs
- **Protocols Covered**: TLS 1.3; X.509; OCSP; ACME; Certificate Transparency; KEMTLS; HTTPS; IMAP; SMTP; LDAP
- **Infrastructure Layers**: Public Key Infrastructure (PKI); Certification Authority; Transparency Service
- **Standardization Bodies**: IETF; NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Merkle Tree Certificates outperform X.509 certificates in transmission size and CPU usage when using post-quantum signatures; A functional TLS handshake negotiating MTCs was successfully implemented using the Rustls library; The MTC architecture requires a new update channel for Relying Parties to refresh roots of trust; Implementation fixes were contributed to the IETF Internet-Draft including corrections to test vectors and addition of length prefixes
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Merkle Tree Certificates as an optional optimization to current PKI; KEMTLS using PQ safe Key-Encapsulation Mechanisms instead of signatures
- **Performance & Size Considerations**: MTCs outperform X.509 certificates in transmission sizes and CPU usage; PQ KEM encapsulations are about half as big as PQ signatures; 83% of page loads worldwide secured by HTTPS; 12% to 20% of connections already protected by hybrid key exchange
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: Rustls library; modified TLS stack for MTC negotiation mechanisms; new update channel for trust anchor refresh
- **Relevant PQC Today Features**: merkle-tree-certs; tls-basics; pki-workshop; hybrid-crypto; algorithms

---

## Cloudflare-PQ-Internet-2025

- **Reference ID**: Cloudflare-PQ-Internet-2025
- **Title**: State of the Post-Quantum Internet in 2025
- **Authors**: Cloudflare Research
- **Publication Date**: 2025-12-01
- **Last Updated**: 2025-12-01
- **Document Status**: Published
- **Main Topic**: Cloudflare's 2025 review of post-quantum cryptography adoption, detailing quantum hardware and software progress, regulatory deadlines, and the state of Internet migration.
- **PQC Algorithms Covered**: ML-KEM
- **Quantum Threats Addressed**: harvest-now/decrypt-later; Shor's algorithm; Chen's algorithm; Q-day
- **Migration Timeline Info**: NSA CNSA 2.0 guidelines with deadlines between 2030 and 2033; US federal government target of 2035 for full migration; Australia deadline of 2030; UK NCSC deadline of 2035; European Union roadmap with 2030 and 2035 deadlines
- **Applicable Regions / Bodies**: United States; Australia; United Kingdom; European Union
- **Leaders Contributions Mentioned**: Bas Westerbaan (author); Samuel Jaques (compiled quantum computing graph); Craig Gidney (quantum software optimisations); Yilei Chen (proposed lattice algorithm)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.3
- **Infrastructure Layers**: PKI; certificate transparency
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: CNSA 2.0
- **Classical Algorithms Referenced**: RSA; elliptic curves (ECC); RSA-2048
- **Key Takeaways**: Majority of human-initiated traffic with Cloudflare now uses post-quantum encryption to mitigate harvest-now/decrypt-later attacks; Craig Gidney's software optimizations reduced the qubit requirement to break RSA-2048 from 20 million to under one million, accelerating Q-day estimates; Regulatory deadlines for PQC migration are generally set between 2030 and 2035 across major jurisdictions; Yilei Chen's proposed lattice-breaking algorithm was found to contain a fundamental bug, confirming current lattice-based cryptography remains secure against this specific attack vector
- **Security Levels & Parameters**: RSA-2048; one million qubits (superconducting); 242,000 superconducting qubits; 100,000 superconducting qubits
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Largest number factored by a quantum computer is 15; fewer than one million qubits required to break RSA-2048 with optimized software; 20 million qubits previously estimated for superconducting approach
- **Target Audience**: Security Architect, CISO, Policy Maker, Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Threats; Compliance; Migrate; Algorithms

---

## eIDAS-2-Regulation

- **Reference ID**: eIDAS-2-Regulation
- **Title**: eIDAS 2.0 Regulation (EU 2024/1183)
- **Authors**: European Parliament; Council of the European Union
- **Publication Date**: 2024-05-30
- **Last Updated**: 2024-05-30
- **Document Status**: In Force
- **Main Topic**: Regulation (EU) 2024/1183 establishes the European Digital Identity Framework mandating EUDI Wallets and Qualified Electronic Attestations of Attributes across the EU.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Member states must establish EUDI Wallets by late 2026; private sector acceptance required by late 2027; Digital Decade Policy Programme targets wide deployment by 2030.
- **Applicable Regions / Bodies**: Regions: European Union, Member States; Bodies: European Parliament, Council of the European Union, European Commission, European Economic and Social Committee, Committee of the Regions.
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Regulation (EU) No 910/2014, Regulation (EU) 2016/679, Directive 2002/58/EC, Regulation (EU) 2018/1725.
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: European Digital Identity Wallets must be established by all member states by late 2026; private sector acceptance of digital identity solutions is mandated by late 2027; the framework introduces Qualified Electronic Attestations of Attributes (QEAA) for cross-border recognition; personal data for EUDI Wallets must be kept logically separate from other provider data; the regulation aims to reduce operational costs and cybercrime risks like identity theft.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Compliance Officer, Security Architect
- **Implementation Prerequisites**: Adoption of European Digital Identity Wallets; compliance with Regulation (EU) 2016/679 and Directive 2002/58/EC; logical separation of personal data related to EUDI Wallets.
- **Relevant PQC Today Features**: digital-id, compliance-strategy, migration-program

---

## EUDI-Wallet-ARF

- **Reference ID**: EUDI-Wallet-ARF
- **Title**: EUDI Wallet Architecture and Reference Framework (ARF)
- **Authors**: European Commission; eIDAS Expert Group
- **Publication Date**: 2023-01-01
- **Last Updated**: 2025-06-01
- **Document Status**: Living Document
- **Main Topic**: Technical architecture and reference framework for the European Digital Identity Wallet defining credential formats, trust protocols, and a PQC migration roadmap.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Dec 2026 national roadmaps; Dec 2030 high-risk migration; Dec 2035 full transition
- **Applicable Regions / Bodies**: Regions: EU Member States; Bodies: European Commission, European Digital Identity Cooperation Group (EDICG)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: OpenID4VCI, OpenID4VP
- **Infrastructure Layers**: Qualified Trust Services, Qualified Secure Cryptographic Devices (QSCDs), Qualified Electronic Signatures, Qualified Electronic Seals, Qualified Electronic Time Stamps, Qualified Electronic Registered Delivery Services, Qualified Electronic Ledgers, Qualified Electronic Archiving Services
- **Standardization Bodies**: ISO, IETF
- **Compliance Frameworks Referenced**: eIDAS Regulation, European Digital Identity Regulation, Commission Implementing Regulations (CIR 2024/2977 through CIR 2025/2532)
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: EU Member States must develop national PQC migration roadmaps by December 2026; High-risk systems require PQC migration by December 2030; Full transition to PQC is mandated by December 2035; The framework mandates specific credential formats including mso_mdoc and SD-JWT VC; User control over identity data sharing is a core requirement of the wallet architecture
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer, Developer
- **Implementation Prerequisites**: Adoption of mso_mdoc per ISO 18013-5; Adoption of SD-JWT VC per RFC 9901; Implementation of OpenID4VCI and OpenID4VP protocols; Alignment with Commission Implementing Regulations (CIR) series
- **Relevant PQC Today Features**: Timeline, digital-id, compliance-strategy, migration-program, pqc-governance

---

## BSI TR-02102-1

- **Reference ID**: BSI TR-02102-1
- **Title**: Cryptographic Mechanisms: Recommendations and Key Lengths
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-2

- **Reference ID**: BSI TR-02102-2
- **Title**: Cryptographic Mechanisms: Recommendations for TLS
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-3

- **Reference ID**: BSI TR-02102-3
- **Title**: Cryptographic Mechanisms: Recommendations for IPsec
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Position Paper

- **Reference ID**: ANSSI PQC Position Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition
- **Authors**: ANSSI France
- **Publication Date**: 2022-01-01
- **Last Updated**: 2022-01-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Follow-up Paper

- **Reference ID**: ANSSI PQC Follow-up Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition (2023 Follow-up)
- **Authors**: ANSSI France
- **Publication Date**: 2023-12-01
- **Last Updated**: 2023-12-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ISO-18013-5-mDL

- **Reference ID**: ISO-18013-5-mDL
- **Title**: ISO/IEC 18013-5:2021 — Mobile Driving Licence (mDL) Application
- **Authors**: ISO/IEC JTC1 SC17
- **Publication Date**: 2021-09-01
- **Last Updated**: 2021-09-01
- **Document Status**: Published Standard
- **Main Topic**: International standard defining interface specifications for mobile driving licence (mDL) applications, including data structure, cryptographic protection via Mobile Security Objects, and interaction with readers and issuing authorities.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Issuing authority infrastructure; mDL reader interface
- **Standardization Bodies**: ISO/IEC JTC 1/SC 17
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Establishes interface specifications between mDL, mDL readers, and issuing authority infrastructure; Enables machine-readable verification of mDL data integrity and origin; Excludes requirements on storage of mDL private keys and holder consent mechanisms; Standard is scheduled for revision with a new Draft International Standard under development.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: digital-id

---

## RFC-9901-SD-JWT-VC

- **Reference ID**: RFC-9901-SD-JWT-VC
- **Title**: RFC 9901 — SD-JWT-based Verifiable Credentials (SD-JWT VC)
- **Authors**: IETF OAuth Working Group
- **Publication Date**: 2025-06-01
- **Last Updated**: 2025-06-01
- **Document Status**: Published RFC
- **Main Topic**: RFC 9901 defines the SD-JWT format and selective disclosure mechanism for JSON Web Tokens to enable privacy-preserving credential presentation.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: D. Fett; K. Yasuda; B. Campbell
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: JSON Web Signature (JWS); JSON Web Token (JWT); OpenID Connect
- **Infrastructure Layers**: Key Management; PKI
- **Standardization Bodies**: Internet Engineering Task Force (IETF); Internet Engineering Steering Group (IESG)
- **Compliance Frameworks Referenced**: BCP 78; Revised BSD License
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: SD-JWT enables selective disclosure of claims by replacing cleartext data with salted digests in the signed payload; Key Binding allows holders to prove possession of a private key via a separate Key Binding JWT; The format supports both compact and JSON serialization for transport of issuer-signed data and disclosures; Verifiers validate authenticity by computing digests over disclosed claims and matching them against the signed payload.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: Support for Base64url encoding; Cryptographically secure random salt generation; Hash function implementation; JSON serialization capabilities
- **Relevant PQC Today Features**: digital-id; api-security-jwt; entropy-randomness

---

## IETF-SD-JWT-Draft

- **Reference ID**: IETF-SD-JWT-Draft
- **Title**: Selective Disclosure for JWTs (SD-JWT) — draft-ietf-oauth-selective-disclosure-jwt
- **Authors**: IETF OAuth Working Group
- **Publication Date**: 2022-01-01
- **Last Updated**: 2025-06-01
- **Document Status**: IETF Draft Standard
- **Main Topic**: Specification defining a selective disclosure mechanism for JSON Web Token claims using salted SHA-256 hashes to enable minimal disclosure and unlinkability.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Daniel Fett, Kristina Yasuda, Brian Campbell
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: JSON Web Signature (JWS), JSON Web Token (JWT), OpenID Connect
- **Infrastructure Layers**: Key Binding, Key Pair Generation and Lifecycle Management
- **Standardization Bodies**: Internet Engineering Task Force (IETF)
- **Compliance Frameworks Referenced**: BCP 78, Revised BSD License
- **Classical Algorithms Referenced**: SHA-256
- **Key Takeaways**: SD-JWT enables selective disclosure of JWT claims by replacing cleartext data with salted digests in the signed payload; Key Binding (SD-JWT+KB) prevents unauthorized presentation by requiring proof of possession of a private key; Decoy digests and unlinkability mechanisms prevent correlation of batch-issued credentials; Verifiers validate disclosed claims by computing digests of provided cleartext against the signed payload.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect, Researcher
- **Implementation Prerequisites**: Support for Base64url encoding; ability to generate and manage key pairs for Key Binding; implementation of salted hash functions for disclosure generation.
- **Relevant PQC Today Features**: digital-id, api-security-jwt, entropy-randomness

---

## OpenID4VCI-Spec

- **Reference ID**: OpenID4VCI-Spec
- **Title**: OpenID for Verifiable Credential Issuance (OpenID4VCI)
- **Authors**: OpenID Foundation
- **Publication Date**: 2023-01-01
- **Last Updated**: 2025-06-01
- **Document Status**: Final
- **Main Topic**: This specification defines an OAuth 2.0 protected API for the issuance of Verifiable Credentials, including credential offer flows, authorization endpoints, and proof of possession mechanisms.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: T. Lodderstedt; K. Yasuda; T. Looker; P. Bastian
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: OAuth 2.0; OpenID Connect; TLS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: OpenID Foundation; IETF; ISO; W3C
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: The specification mandates an OAuth 2.0 protected API for Verifiable Credential issuance; Proof of possession is achieved via cryptographic key binding or claims-based holder binding; Multiple credential formats including IETF SD-JWT VC, ISO mdoc, and W3C VCDM are supported; Wallets act as OAuth 2.0 clients to obtain access tokens for the Credential Endpoint; The protocol supports both pre-authorized code flow and authorization code flow variations.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect; Policy Maker
- **Implementation Prerequisites**: OAuth 2.0 deployment; OpenID Connect OP extension; Support for IETF SD-JWT VC, ISO mdoc, or W3C VCDM formats; TLS implementation
- **Relevant PQC Today Features**: digital-id; api-security-jwt; tls-basics

---

## OpenID4VP-Spec

- **Reference ID**: OpenID4VP-Spec
- **Title**: OpenID for Verifiable Presentations (OpenID4VP)
- **Authors**: OpenID Foundation
- **Publication Date**: 2022-01-01
- **Last Updated**: 2025-06-01
- **Document Status**: Final
- **Main Topic**: OpenID4VP is a specification defining a protocol based on OAuth 2.0 for requesting and presenting Verifiable Credentials with support for selective disclosure and multiple credential formats.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: EUDI Wallet
- **Leaders Contributions Mentioned**: O. Terbu; T. Lodderstedt; K. Yasuda; D. Fett; J. Heenan; Tobias Looker; Adam Lemmon
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: OAuth 2.0; OpenID Connect; SIOPv2; TLS; HTTP; HTTPS
- **Infrastructure Layers**: Digital Credentials API; Wallet; Authorization Server; Verifier
- **Standardization Bodies**: OpenID Foundation; W3C; IETF; ISO/IEC; IANA
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: The specification enables selective disclosure allowing holders to reveal only required credential attributes; It supports multiple credential formats including W3C Verifiable Credentials, ISO mdoc, and IETF SD-JWT VC; Implementations can use the Digital Credentials API as an alternative to HTTPS messages for presentation flows; The protocol introduces a new response type vp_token to containerize Verifiable Presentations; Security considerations include preventing replay of presentations and ensuring unlinkability between verifiers.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: Support for OAuth 2.0; OpenID Connect; Digital Credentials API; TLS; JSON Web Token (JWT); JSON Web Signature (JWS); JSON Web Encryption (JWE)
- **Relevant PQC Today Features**: digital-id; api-security-jwt

---

## IETF-Token-Status-List

- **Reference ID**: IETF-Token-Status-List
- **Title**: OAuth Status List — draft-ietf-oauth-status-list
- **Authors**: IETF OAuth Working Group
- **Publication Date**: 2023-01-01
- **Last Updated**: 2025-06-01
- **Document Status**: IETF Draft Standard
- **Main Topic**: Specification of a Token Status List (TSL) mechanism using compact bit arrays to convey validity states of JOSE and COSE secured tokens while preserving privacy.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Tobias Looker; Paul Bastian; Christian Bormann; Rifaat Shekh-Yusef (Document shepherd); Deb Cooley (Action Holder)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: OAuth; Web Authorization Protocol; JOSE; COSE; JWT; CWT; SD-JWT; ISO mdoc; X.509; CoAP
- **Infrastructure Layers**: PKI; Key Management
- **Standardization Bodies**: IETF; IESG; IANA; ISO
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Defines a compact bit-array status list for checking token validity without revealing specific credential identity; Supports privacy-preserving revocation by preventing verifiers from determining which credential is checked from the list position alone; Provides extension points and registries for future status mechanisms in JWT and CWT formats; Includes operational considerations for status list aggregation, caching, and unlinkability to mitigate tracking.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Compressed byte array structure for status lists; Size comparison data provided in Appendix B for varying entry amounts and revocation rates; 1-bit, 2-bit, 4-bit, and 8-bit status list encoding options.
- **Target Audience**: Developer; Security Architect; Researcher; Policy Maker
- **Implementation Prerequisites**: Support for JOSE or COSE token formats; Ability to process compressed byte arrays; Implementation of JWT or CWT status list tokens; Adherence to IANA registry definitions for status mechanisms.
- **Relevant PQC Today Features**: digital-id; api-security-jwt; pki-workshop; crypto-agility

---

## CSC-API-v2-Spec

- **Reference ID**: CSC-API-v2-Spec
- **Title**: Cloud Signature Consortium API v2 Specification
- **Authors**: Cloud Signature Consortium
- **Publication Date**: 2022-01-01
- **Last Updated**: 2024-01-01
- **Document Status**: Published
- **Main Topic**: Specification of the Cloud Signature Consortium API v2 for remote digital signature services supporting Qualified Electronic Signatures via remote HSMs.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: EU; Bodies: eIDAS trust service providers, EUDI Wallet
- **Leaders Contributions Mentioned**: Johannes Leser (Joins the Cloud Signature Consortium Board)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: HSM, Cloud Signature services
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: eIDAS
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: API v2 defines endpoints for credential listing, information, authorization, and hash signing; Supports Qualified Electronic Signatures via remote HSMs; Adopted by eIDAS trust service providers for EUDI Wallet-compatible SCAL2 signature services; Specification published on 6 November 2025
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect, Compliance Officer
- **Implementation Prerequisites**: Remote HSMs; EUDI Wallet-compatible SCAL2 signature services
- **Relevant PQC Today Features**: digital-id, hsm-pqc, api-security-jwt, code-signing

---

## ETSI-EN-319-411

- **Reference ID**: ETSI-EN-319-411
- **Title**: ETSI EN 319 411 — Requirements for Trust Service Providers Issuing Certificates
- **Authors**: ETSI
- **Publication Date**: 2016-02-01
- **Last Updated**: 2021-04-01
- **Document Status**: Published Standard
- **Main Topic**: ETSI EN 319 411-1 defines general policy and security requirements for Trust Service Providers issuing certificates under eIDAS regulations.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Europe; Bodies: ETSI, European Union (eIDAS)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509, OCSP
- **Infrastructure Layers**: PKI, Key Management, Certificate Authority, Registration Authority
- **Standardization Bodies**: ETSI
- **Compliance Frameworks Referenced**: eIDAS, WebTrust, EUDI Trust Framework
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: QTSPs must adhere to strict policy and security requirements for issuing qualified certificates; The standard forms the basis for European CA auditing under WebTrust/ETSI schemes; Part 1 covers general requirements while Part 2 addresses specific policies like NCP/NCP+/QCP/eIDAS; Trust Service Providers must implement controls for identification, authentication, and certificate lifecycle management.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer, Security Architect, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: compliance-strategy, pki-workshop, digital-id

---

## NIST-SP-800-63-3

- **Reference ID**: NIST-SP-800-63-3
- **Title**: NIST SP 800-63-3 — Digital Identity Guidelines
- **Authors**: NIST
- **Publication Date**: 2017-06-22
- **Last Updated**: 2017-06-22
- **Document Status**: Published
- **Main Topic**: NIST SP 800-63-3 provides digital identity guidelines covering enrollment, authentication, and federation assurance levels, though it has been superseded by SP 800-63-4 as of August 1, 2025.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Superseded by NIST SP 800-63-4 as of August 1, 2025
- **Applicable Regions / Bodies**: Bodies: NIST; Regions: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: The document suite covers identity proofing, authentication, and federation assurance levels; This revision has been superseded by NIST SP 800-63-4 as of August 1, 2025; Users should refer to the current guidelines for up-to-date information; Conformance criteria are available for enrollment, authentication, and federation components
- **Security Levels & Parameters**: IAL1/2/3; AAL1/2/3; FAL1/2/3
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer, Security Architect, Policy Maker
- **Implementation Prerequisites**: Refer to NIST SP 800-63-4 for current guidelines; Access PDF or online versions of the document suite
- **Relevant PQC Today Features**: digital-id, compliance-strategy, migration-program

---

## NIST-SP-800-131A-Rev3

- **Reference ID**: NIST-SP-800-131A-Rev3
- **Title**: Transitioning the Use of Cryptographic Algorithms and Key Lengths (Rev 3)
- **Authors**: NIST
- **Publication Date**: 2024-11-01
- **Last Updated**: 2024-11-01
- **Document Status**: Initial Public Draft
- **Main Topic**: NIST guidance on transitioning cryptographic algorithms and key lengths, including retirement schedules for SHA-1 and weak RSA/ECC keys aligned with PQC adoption.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: SHA-1 and RSA/ECC <128-bit disallowed after 2030; transition to quantum-resistant algorithms for digital signatures and key establishment post-2030.
- **Applicable Regions / Bodies**: United States; NIST
- **Leaders Contributions Mentioned**: Elaine Barker (NIST); Allen Roginsky (NIST)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS 203; FIPS 204; FIPS 205
- **Classical Algorithms Referenced**: SHA-1; DSA; ECB; RSA; ECC; 224-bit hash functions
- **Key Takeaways**: Retirement of ECB as a confidentiality mode is proposed; SHA-1 and 224-bit hash functions have a defined retirement schedule; Transition from 112-bit to 128-bit security strength is required; Federal systems must adopt quantum-resistant algorithms for signatures and key establishment after 2030.
- **Security Levels & Parameters**: 112 bits; 128 bits; 224-bit hash functions
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Compliance; Migrate; Algorithms; crypto-agility

---

## BSI TR-02102-1

- **Reference ID**: BSI TR-02102-1
- **Title**: Cryptographic Mechanisms: Recommendations and Key Lengths
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-2

- **Reference ID**: BSI TR-02102-2
- **Title**: Cryptographic Mechanisms: Recommendations for TLS
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-3

- **Reference ID**: BSI TR-02102-3
- **Title**: Cryptographic Mechanisms: Recommendations for IPsec
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Position Paper

- **Reference ID**: ANSSI PQC Position Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition
- **Authors**: ANSSI France
- **Publication Date**: 2022-01-01
- **Last Updated**: 2022-01-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Follow-up Paper

- **Reference ID**: ANSSI PQC Follow-up Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition (2023 Follow-up)
- **Authors**: ANSSI France
- **Publication Date**: 2023-12-01
- **Last Updated**: 2023-12-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## India-DST-Quantum-Safe-Roadmap-2026

- **Reference ID**: India-DST-Quantum-Safe-Roadmap-2026
- **Title**: Implementation of Quantum Safe Ecosystem in India — Report of the Task Force
- **Authors**: India Ministry of Science & Technology (DST)
- **Publication Date**: 2026-02-04
- **Last Updated**: 2026-02-04
- **Document Status**: Published
- **Main Topic**: India's national roadmap for implementing a quantum-safe ecosystem under the National Quantum Mission with migration timelines for Critical Information Infrastructure.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest Now, Decrypt Later; Shor's algorithm; Grover's algorithm
- **Migration Timeline Info**: 2027–2029 migration timelines for Critical Information Infrastructure; Q-Day may arrive within the next three years from January 2026
- **Applicable Regions / Bodies**: Regions: India; Bodies: Department of Science and Technology, National Quantum Mission, Centre for Development of Telematics, Telecommunication Engineering Centre, Data Security Council of India
- **Leaders Contributions Mentioned**: Dr. Rajkumar Upadhyay (Chairman, Task Force); Mr. Kamal Kumar Agarwal (Chairman, Sub-Group 1); Mr. Vinayak Godse (Chairman, Sub-Group 2)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: PKI; National Evaluation and Testing infrastructure; National PQC Testing & Certification Program; national testbeds
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; Elliptic Curve Cryptography (ECC); symmetric encryption; cryptographic hash functions
- **Key Takeaways**: Launch PQC/hybrid solution pilots in high-priority systems; Establish a National PQC Testing & Certification Program; Adopt common PQC procurement requirements; Develop PQC-ready PKI systems and national testbeds for hybrid PQC–QKD solutions; Deploy QKD for strategic and critical communication links
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid PQC+QKD approach; hybrid PQC–QKD solutions; crypto agility; phased transition to PQC
- **Performance & Size Considerations**: Average cost of a data breach 4.44 million USD; 15% increase since 2020
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer, Researcher
- **Implementation Prerequisites**: Phased transition guidelines; unified structure for standards, testing, and certification; National Evaluation and Testing infrastructure; crypto agility measures
- **Relevant PQC Today Features**: Timeline; Threats; Migrate; Assess; qkd; hybrid-crypto; crypto-agility; pki-workshop; pqc-governance; migration-program

---

## GRI-Quantum-Threat-Timeline-2024

- **Reference ID**: GRI-Quantum-Threat-Timeline-2024
- **Title**: 2024 Quantum Threat Timeline Report
- **Authors**: Global Risk Institute
- **Publication Date**: 2024-11-14
- **Last Updated**: 2024-11-14
- **Document Status**: Final Report
- **Main Topic**: Annual expert survey projecting the probability and timeline of a cryptographically-relevant quantum computer (CRQC) with 5–15% probability by 2030 and 50% by 2034–2039.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Cryptographically-relevant quantum computer (CRQC); Harvest Now Decrypt Later (HNDL); Harvest Now Fail Later (HNFL)
- **Migration Timeline Info**: Projects 5–15% probability of CRQC by 2030 and 50% probability by 2034–2039; emphasizes urgency for proactive quantum threat mitigation.
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Dr. Michele Mosca, CEO & co-founder, evolutionQ Inc.; Dr. Marco Piani, Senior Research Analyst, evolutionQ Inc.
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: The threat of quantum computers cracking standard encryption may be closer than previously thought; implementing quantum-safe cryptography requires time and resources to ensure success; a well-planned transition minimizes security gaps and mitigates risks of hasty adoption.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Cyber-risk managers; Security Architect; Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Threats; pqc-risk-management; migration-program

---

## RFC 5652

- **Reference ID**: RFC 5652
- **Title**: Cryptographic Message Syntax (CMS)
- **Authors**: IETF SMIME WG
- **Publication Date**: 2009-09-01
- **Last Updated**: 2009-09-01
- **Document Status**: Proposed Standard
- **Main Topic**: This document defines the Cryptographic Message Syntax (CMS) standard for digitally signing, digesting, authenticating, or encrypting arbitrary message content.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: R. Housley
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: S/MIME, PKCS #7, PKIX
- **Infrastructure Layers**: PKI, Key Management
- **Standardization Bodies**: IETF, RSA Laboratories
- **Compliance Frameworks Referenced**: BCP 78, Internet Official Protocol Standards (STD 1)
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: CMS supports digital signatures and encryption with nested encapsulation capabilities; Specific cryptographic algorithms are separated from the protocol specification to allow independent updates; Backward compatibility is preserved across versions while deprecating older attribute certificate versions; Implementations must support ContentInfo, data, signed-data, and enveloped-data content types.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect, Researcher
- **Implementation Prerequisites**: ASN.1 encoding using BER; Support for ContentInfo, data, signed-data, and enveloped-data content types
- **Relevant PQC Today Features**: email-signing, pki-workshop, crypto-agility

---

## RFC 5083

- **Reference ID**: RFC 5083
- **Title**: Using Advanced Encryption Standard (AES) Counter with CBC-MAC (AES-CCM) and AES Galois/Counter Mode (AES-GCM) Algorithms in the Cryptographic Message Syntax (CMS)
- **Authors**: IETF SMIME WG
- **Publication Date**: 2007-11-01
- **Last Updated**: 2007-11-01
- **Document Status**: Proposed Standard
- **Main Topic**: Defines the Authenticated-EnvelopedData content type for Cryptographic Message Syntax (CMS) to support authenticated encryption modes like AES-CCM and AES-GCM.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: R. Housley; Bellare, Desai, Jokipii, and Rogaway
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Cryptographic Message Syntax (CMS)
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: AES-CCM; AES-GCM; Advanced Encryption Standard; Counter mode; Cipher Block Chaining (CBC); SHA-256 is not mentioned but block cipher counter mode is referenced generically; RSA is not explicitly named in the text body though rsadsi OID is present.
- **Key Takeaways**: Authenticated-enveloped-data content type provides both confidentiality and integrity for CMS; Fresh content-authentication keys must be generated for each content to avoid counter mode misuse; Recipients must verify integrity before releasing plaintext or destroy it if verification fails; The structure supports multiple key management techniques including Key Transport, Key Agreement, Symmetric Keys, and Passwords.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Padding is well defined if block size is less than 256 octets; Version number MUST be set to 0.
- **Target Audience**: Developer; Security Architect
- **Implementation Prerequisites**: ASN.1 Basic Encoding Rules (BER) or Distinguished Encoding Rules (DER); Support for AES-CCM and AES-GCM algorithms; Adherence to RFC 5083 versioning rules.
- **Relevant PQC Today Features**: email-signing, crypto-agility, tls-basics, pki-workshop

---

## IETF RFC 7296

- **Reference ID**: IETF RFC 7296
- **Title**: Internet Key Exchange Protocol Version 2 (IKEv2)
- **Authors**: IETF IPSECME
- **Publication Date**: 2014-10-01
- **Last Updated**: 2014-10-01
- **Document Status**: Standards Track RFC
- **Main Topic**: This document defines version 2 of the Internet Key Exchange (IKE) protocol as an Internet Standard for establishing IPsec Security Associations.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: C. Kaufman; P. Hoffman; Y. Nir; P. Eronen; T. Kivinen
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: IKEv2; IPsec; ESP; AH; IPComp; EAP
- **Infrastructure Layers**: Key Management; Security Associations
- **Standardization Bodies**: Internet Engineering Task Force (IETF); Internet Engineering Steering Group (IESG)
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: Diffie-Hellman; MODP
- **Key Takeaways**: IKEv2 is advanced to Internet Standard status obsoleting RFC 5996; The protocol establishes shared state for mutual authentication and Security Associations; All IKE communications consist of request and response message pairs called exchanges; Cryptographic suites are negotiated via a mix-and-match fashion of supported algorithms; CREATE_CHILD_SA exchanges are used for creating new Child SAs or rekeying existing ones
- **Security Levels & Parameters**: 768-bit MODP; 1024-bit MODP
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Network Engineer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: vpn-ssh-pqc; crypto-agility; tls-basics

---

## IETF RFC 8731

- **Reference ID**: IETF RFC 8731
- **Title**: Use of Curve25519 and Curve448 in the Secure Shell (SSH) Protocol
- **Authors**: IETF CURDLE WG
- **Publication Date**: 2020-02-01
- **Last Updated**: 2020-02-01
- **Document Status**: Standards Track RFC
- **Main Topic**: Specification for using Curve25519 and Curve448 key exchange methods in the Secure Shell (SSH) protocol.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Aris Adamantiadis created curve25519-sha256@libssh.org; Denis Bider, Damien Miller, Niels Moeller, Matt Johnston, Eric Rescorla, Ron Frederick, and Stefan Buehler provided review and comments.
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: SSH
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: Internet Engineering Task Force (IETF); Internet Engineering Steering Group (IESG)
- **Compliance Frameworks Referenced**: BCP 78; Simplified BSD License; FIPS PUB 180-4
- **Classical Algorithms Referenced**: Curve25519; Curve448; SHA-256; SHA-512; X25519; X448; ECDSA; ECMQV; ECDH
- **Key Takeaways**: curve25519-sha256 is the preferred choice providing ~128 bits of security; curve448-sha512 provides ~224 bits of security as a hedge against analytical advances; implementations must abort if the shared secret is all-zero or public key lengths are incorrect; side-channel risks exist regarding mpint encoding but were not addressed for backwards compatibility.
- **Security Levels & Parameters**: ~128 bits security for Curve25519 with SHA-256; ~224 bits security for Curve448 with SHA-512; 32-byte public keys for Curve25519; 56-byte public keys for Curve448; 32-byte shared secret for curve25519-sha256; 56-byte shared secret for curve448-sha512.
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: 32 bytes public key size for Curve25519; 56 bytes public key size for Curve448; 32 bytes derived shared secret for curve25519-sha256; 56 bytes derived shared secret for curve448-sha512.
- **Target Audience**: Developer; Security Architect
- **Implementation Prerequisites**: Implementations MUST check whether the computed Diffie-Hellman shared secret is the all-zero value and abort if so; implementations MUST abort if the length of received public keys are not expected lengths; use algorithms described in RFC 7748 for X25519 and X448 functions.
- **Relevant PQC Today Features**: Algorithms, vpn-ssh-pqc, crypto-agility

---

## Rosenpass-Protocol

- **Reference ID**: Rosenpass-Protocol
- **Title**: Rosenpass: Formally Verified Post-Quantum Protocol for WireGuard
- **Authors**: Rosenpass e.V.
- **Publication Date**: 2023-02-01
- **Last Updated**: 2024-06-01
- **Document Status**: White Paper
- **Main Topic**: Rosenpass is a formally verified post-quantum authenticated key exchange protocol designed to secure WireGuard VPNs using a hybrid of Classic McEliece and Kyber.
- **PQC Algorithms Covered**: Classic McEliece, Kyber
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Karolin Varner; Benjamin Lipp; Wanja Zaeske; Lisa Schmidt; Prabhpreet Dua
- **PQC Products Mentioned**: Rosenpass; liboqs; libsodium
- **Protocols Covered**: WireGuard; Noise IK; NTP
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: BLAKE2b; SHAKE256; ChaCha20Poly1305; XChaCha20Poly1305; AES
- **Key Takeaways**: Rosenpass generates a post-quantum secure shared key every two minutes to inject as a WireGuard pre-shared key; The protocol uses a biscuit cookie mechanism to mitigate state disruption attacks by storing responder state in an encrypted cookie; Security relies on Classic McEliece for authenticity and Kyber for forward secrecy; Implementations must use different rekey intervals for initiator (130s) and responder (120s) roles to manage handshake turns.
- **Security Levels & Parameters**: Classic McEliece 4608961 claims 192-bit AES security; Kyber-512 claims 128-bit AES security; Symmetric keys are 32 bytes long
- **Hybrid & Transition Approaches**: Hybrid Rosenpass/WireGuard setup combining post-quantum key exchange with WireGuard pre-shared key injection
- **Performance & Size Considerations**: Classic McEliece public keys 524160 bytes; Classic McEliece ciphertexts 188 bytes; Classic McEliece secret keys 13568 bytes; Kyber public keys 800 bytes; Kyber ciphertexts 768 bytes; Kyber secret keys 1632 bytes
- **Target Audience**: Engineer; Researcher; Developer
- **Implementation Prerequisites**: Rust implementation; libsodium library for hash, AEAD, and XAEAD; liboqs library for post-quantum KEMs; proper zeroization of temporary variables
- **Relevant PQC Today Features**: vpn-ssh-pqc; hybrid-crypto; algorithms; tls-basics

---

## IETF RFC 4253

- **Reference ID**: IETF RFC 4253
- **Title**: The Secure Shell (SSH) Transport Layer Protocol
- **Authors**: IETF
- **Publication Date**: 2006-01-01
- **Last Updated**: 2006-01-01
- **Document Status**: Standards Track RFC
- **Main Topic**: Defines the SSH transport layer protocol including key exchange, server authentication, encryption, and integrity protection mechanisms.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Tatu Ylonen; Tero Kivinen; Timo J. Rinne; Sami Lehtinen; Markku-Juhani O. Saarinen; Darren Moffat; Mats Andersson; Ben Harris; Bill Sommerfeld; Brent McClure; Niels Moller; Damien Miller; Derek Fawcus; Frank Cusack; Heikki Nousiainen; Jakob Schlyter; Jeff Van Dyke; Jeffrey Altman; Jeffrey Hutzelman; Jon Bright; Joseph Galbraith; Ken Hornstein; Markus Friedl; Martin Forssen; Nicolas Williams; Niels Provos; Perry Metzger; Peter Gutmann; Simon Josefsson; Simon Tatham; Wei Dai; Denis Bider; der Mouse; Tadayoshi Kohno
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: SSH; TCP/IP
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: IETF; IANA
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: Diffie-Hellman; SHA-1
- **Key Takeaways**: The protocol negotiates key exchange, public key, symmetric encryption, message authentication, and hash algorithms; SSH version 2.0 is the defined standard with compatibility modes for version 1.x; Key exchange typically requires two round-trips with a worst case of three; Minimum packet size overhead is approximately 28 bytes depending on negotiated algorithms; The protocol provides strong encryption, server authentication, and integrity protection over insecure networks
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Compatibility mode for SSH versions 1.x using protoversion "1.99"
- **Performance & Size Considerations**: Minimum packet size in the order of 28 bytes; TCP/IP header minimum 32 bytes; Ethernet data field minimum 46 bytes; Identification string maximum length 255 characters
- **Target Audience**: Developer; Security Architect; Network Engineer
- **Implementation Prerequisites**: Support for 8-bit clean binary-transparent transport; Ability to process ISO-10646 UTF-8 encoded lines; TCP/IP port 22 registration
- **Relevant PQC Today Features**: vpn-ssh-pqc, qkd, crypto-agility

---

## IEEE-802-1AE-2018

- **Reference ID**: IEEE-802-1AE-2018
- **Title**: IEEE 802.1AE-2018: MAC Security (MACsec)
- **Authors**: IEEE 802.1 Working Group
- **Publication Date**: 2006-08-01
- **Last Updated**: 2018-12-01
- **Document Status**: IEEE Standard
- **Main Topic**: The document describes IEEE 802.1AE-2018 (MACsec) as a Layer 2 encryption standard using AES-GCM and highlights its integration with QKD-derived keys via the MKA protocol.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: MACsec; MKA
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: IEEE
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: AES-GCM-128; AES-GCM-256
- **Key Takeaways**: MACsec uses AES-GCM for confidentiality and integrity; QKD-derived keys can be injected as Secure Association Keys via MKA; MACsec serves as a natural integration point for QKD in enterprise and telecom networks.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Network Engineer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: qkd

---

## draft-ietf-jose-pqc-kem

- **Reference ID**: draft-ietf-jose-pqc-kem
- **Title**: Use of Post-Quantum Key Encapsulation Mechanisms in JOSE
- **Authors**: IETF JOSE WG
- **Publication Date**: 2024-01-01
- **Last Updated**: 2025-11-01
- **Document Status**: Internet-Draft
- **Main Topic**: Defines conventions for using ML-KEM within JOSE and COSE to protect content confidentiality against quantum threats.
- **PQC Algorithms Covered**: ML-KEM, ML-KEM-512, ML-KEM-768, ML-KEM-1024
- **Quantum Threats Addressed**: Quantum computers impacting current cryptographic systems; adversary with access to a quantum computer
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Tirumaleswar Reddy.K, Aritra Banerjee, Hannes Tschofenig
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: JOSE, COSE, HPKE
- **Infrastructure Layers**: Key Encapsulation Mechanisms, Key Derivation Function
- **Standardization Bodies**: IETF, NIST
- **Compliance Frameworks Referenced**: FIPS 203, BCP 78, BCP 79, RFC 2119, RFC 8174, RFC 6090, RFC 8037, RFC 9052, RFC 7518, RFC 9180
- **Classical Algorithms Referenced**: RSA, ECC, Elliptic Curve Diffie-Hellman Ephemeral Static, Ephemeral-Static DH, Static-Static DH
- **Key Takeaways**: ML-KEM parameter sets ML-KEM-512, ML-KEM-768, and ML-KEM-1024 are specified for JOSE and COSE; Fujisaki-Okamoto transform is required to ensure IND-CCA2 security for PQ-KEMs; Key Agreement with Key Wrapping is recommended for efficient use with multiple recipients; Traditional algorithms like RSA and ECC cannot perform both key encapsulation and signature functions simultaneously in the post-quantum context
- **Security Levels & Parameters**: ML-KEM-512, ML-KEM-768, ML-KEM-1024, IND-CCA2
- **Hybrid & Transition Approaches**: Hybrid post-quantum KEMs via HPKE; transition from traditional to post-quantum algorithms incorporating both types until fully trusted
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, Researcher
- **Implementation Prerequisites**: FIPS 203 for ML-KEM functions; KDF for shared secret derivation; adherence to BCP 78 and BCP 79
- **Relevant PQC Today Features**: Algorithms, hybrid-crypto, crypto-agility, api-security-jwt

---

## BSI TR-02102-1

- **Reference ID**: BSI TR-02102-1
- **Title**: Cryptographic Mechanisms: Recommendations and Key Lengths
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-2

- **Reference ID**: BSI TR-02102-2
- **Title**: Cryptographic Mechanisms: Recommendations for TLS
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-3

- **Reference ID**: BSI TR-02102-3
- **Title**: Cryptographic Mechanisms: Recommendations for IPsec
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Position Paper

- **Reference ID**: ANSSI PQC Position Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition
- **Authors**: ANSSI France
- **Publication Date**: 2022-01-01
- **Last Updated**: 2022-01-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Follow-up Paper

- **Reference ID**: ANSSI PQC Follow-up Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition (2023 Follow-up)
- **Authors**: ANSSI France
- **Publication Date**: 2023-12-01
- **Last Updated**: 2023-12-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## RFC 8725

- **Reference ID**: RFC 8725
- **Title**: JSON Web Token Best Current Practices
- **Authors**: IETF
- **Publication Date**: 2020-02-01
- **Last Updated**: 2020-02-01
- **Document Status**: Best Current Practice
- **Main Topic**: This document outlines security pitfalls and best current practices for JSON Web Token (JWT) implementation, focusing on algorithm confusion attacks, signature validation, and cryptographic agility.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Y. Sheffer; D. Hardt; M. Jones
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS; OAuth 2.0; OpenID Connect; LDAP; HTTPS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: Internet Engineering Task Force (IETF); Internet Engineering Steering Group (IESG)
- **Compliance Frameworks Referenced**: BCP 78; BCP 14; RFC 2119; RFC 8174; RFC 7519; RFC 7515; RFC 7516; RFC 7518; RFC 8017; RFC 6979; RFC 7159; RFC 8259; RFC 6749
- **Classical Algorithms Referenced**: RSA; RS256; HS256; HMAC-SHA256; SHA-256; ECDSA; ECDH-ES; RSA-PKCS1 v1.5; RSAES-OAEP
- **Key Takeaways**: Libraries must enable callers to specify a supported set of algorithms and reject any others; Applications must validate all cryptographic operations and reject the entire JWT if any fail; The "none" algorithm should only be used when the JWT is cryptographically protected by other means such as TLS; ECDSA implementations should use the deterministic approach defined in RFC 6979 to prevent private key recovery from predictable random values; Implementers must validate issuer, subject, and audience claims to prevent substitution and cross-JWT confusion attacks.
- **Security Levels & Parameters**: 2048-bit RSA
- **Hybrid & Transition Approaches**: Cryptographic agility
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: Support for RFC 6979 deterministic ECDSA; Validation of UTF-8 encoding; Specification of supported algorithm sets by the caller
- **Relevant PQC Today Features**: api-security-jwt, crypto-agility, digital-id, entropy-randomness

---

## RFC 7519

- **Reference ID**: RFC 7519
- **Title**: JSON Web Token (JWT)
- **Authors**: IETF
- **Publication Date**: 2015-05-01
- **Last Updated**: 2015-05-01
- **Document Status**: Proposed Standard
- **Main Topic**: Defines JSON Web Token (JWT) as a compact, URL-safe means of representing claims to be transferred between two parties using JWS or JWE structures.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: M. Jones, J. Bradley, N. Sakimura
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: JSON Web Signature (JWS), JSON Web Encryption (JWE)
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: Internet Engineering Task Force (IETF), Internet Engineering Steering Group (IESG)
- **Compliance Frameworks Referenced**: BCP 78, Simplified BSD License
- **Classical Algorithms Referenced**: HMAC SHA-256, HS256
- **Key Takeaways**: JWTs encode claims as a JSON object used as payload for JWS or plaintext for JWE; Registered claim names include iss, sub, aud, exp, iat, nbf, and jti; JWTs are represented using JWS Compact Serialization or JWE Compact Serialization; Unsecured JWTs exist where claims are not integrity protected or encrypted; Nested JWTs enable nested signing and encryption by enclosing a JWT in another JWS or JWE structure.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect
- **Implementation Prerequisites**: JSON [RFC7159] object support; Base64url Encoding; JWS Compact Serialization or JWE Compact Serialization; StringOrURI validation rules; NumericDate format (seconds from 1970-01-01T00:00:00Z UTC)
- **Relevant PQC Today Features**: api-security-jwt, digital-id, tls-basics

---

## RFC 7515

- **Reference ID**: RFC 7515
- **Title**: JSON Web Signature (JWS)
- **Authors**: IETF
- **Publication Date**: 2015-05-01
- **Last Updated**: 2015-05-01
- **Document Status**: Proposed Standard
- **Main Topic**: Defines the JSON Web Signature (JWS) standard for representing digitally signed content in JSON using compact and JSON serializations.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: M. Jones; J. Bradley; N. Sakimura
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: PKI
- **Standardization Bodies**: Internet Engineering Task Force (IETF); IANA
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: HMAC SHA-256; RSASSA-PKCS1-v1_5 SHA-256; ECDSA P-256 SHA-256; ECDSA P-521 SHA-512; SHA-1; SHA-256; SHA-512
- **Key Takeaways**: JWS provides integrity protection for arbitrary octets using digital signatures or MACs; Compact serialization is optimized for space-constrained environments like HTTP headers; JSON serialization enables multiple signatures on the same content; Algorithm identifiers are managed in a separate IANA registry defined by the JWA specification; Unsecured JWS uses the "none" algorithm value and provides no integrity protection.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect
- **Implementation Prerequisites**: Support for base64url encoding without padding; UTF-8 and ASCII string representations; adherence to RFC 2119 requirement levels.
- **Relevant PQC Today Features**: api-security-jwt, digital-id, crypto-agility, tls-basics

---

## RFC 7516

- **Reference ID**: RFC 7516
- **Title**: JSON Web Encryption (JWE)
- **Authors**: IETF
- **Publication Date**: 2015-05-01
- **Last Updated**: 2015-05-01
- **Document Status**: Proposed Standard
- **Main Topic**: Defines the JSON Web Encryption (JWE) standard for encrypting arbitrary content using JSON data structures with compact and JSON serializations.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: M. Jones; J. Hildebrand
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: Internet Engineering Task Force (IETF); Internet Engineering Steering Group (IESG)
- **Compliance Frameworks Referenced**: BCP 78; Simplified BSD License
- **Classical Algorithms Referenced**: RSAES-OAEP; AES GCM; RSAES-PKCS1-v1_5; AES_128_CBC_HMAC_SHA_256; AES Key Wrap; HMAC; SHA-1; SHA-256
- **Key Takeaways**: JWE supports two serializations: compact for space-constrained environments and JSON for multi-recipient encryption; Cryptographic algorithms are defined in the separate JSON Web Algorithms (JWA) specification; Security considerations include key entropy, adaptive chosen-ciphertext attacks, and timing attacks; The standard defines specific header parameters for algorithm identification and key management.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect
- **Implementation Prerequisites**: JSON Web Algorithms (JWA) specification; IANA registries defined by JWA; JSON Web Signature (JWS) specification
- **Relevant PQC Today Features**: api-security-jwt, tls-basics, algorithms, crypto-agility

---

## RFC 7517

- **Reference ID**: RFC 7517
- **Title**: JSON Web Key (JWK)
- **Authors**: IETF
- **Publication Date**: 2015-05-01
- **Last Updated**: 2015-05-01
- **Document Status**: Proposed Standard
- **Main Topic**: Defines the JSON Web Key (JWK) format for representing cryptographic keys as JSON and establishes JWK Set structures for key management.
- **PQC Algorithms Covered**: ML-DSA-65
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: M. Jones
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: JSON Web Signature, JSON Web Encryption, X.509
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: Internet Engineering Task Force (IETF), IANA
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA, ECDSA, P-256, SHA-1, SHA-256
- **Key Takeaways**: JWK format standardizes cryptographic key representation in JSON; JWKS endpoints are used for publishing public keys for signature verification; PQC migration significantly increases JWKS response sizes challenging HTTP limits; ML-DSA-65 public keys are 1952 bytes compared to 65 bytes for P-256; JWKs support both signature and encryption use cases.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: ML-DSA-65 public keys are 1952 bytes; P-256 public keys are 65 bytes
- **Target Audience**: Developer, Security Architect
- **Implementation Prerequisites**: JSON parser supporting RFC 7159; Base64url encoding per JWS specification; UTF-8 and ASCII string handling
- **Relevant PQC Today Features**: api-security-jwt, algorithms, pki-workshop, migration-program

---

## RFC 7518

- **Reference ID**: RFC 7518
- **Title**: JSON Web Algorithms (JWA)
- **Authors**: IETF
- **Publication Date**: 2015-05-01
- **Last Updated**: 2015-05-01
- **Document Status**: Proposed Standard
- **Main Topic**: This specification registers cryptographic algorithms and identifiers for JSON Web Signature, JSON Web Encryption, and JSON Web Key specifications.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Shor's algorithm
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: M. Jones
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: JSON Web Signature, JSON Web Encryption, JSON Web Key
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: Internet Engineering Task Force, IANA
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: HMAC, SHA-256, SHA-384, SHA-512, RSASSA-PKCS1-v1_5, ECDSA, RSASSA-PSS, RSAES-PKCS1-v1_5, RSAES OAEP, AES Key Wrap, ECDH-ES, AES GCM, PBES2, AES_CBC_HMAC_SHA2
- **Key Takeaways**: All currently registered signature and key agreement algorithms in this specification are quantum-vulnerable to Shor's algorithm; The document defines IANA registries for algorithm identifiers to allow changes without modifying core specifications; Algorithm names are kept short to ensure compact JSON-based data structures.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: api-security-jwt, algorithms, crypto-agility, quantum-threats

---

## RFC 6749

- **Reference ID**: RFC 6749
- **Title**: The OAuth 2.0 Authorization Framework
- **Authors**: IETF
- **Publication Date**: 2012-10-01
- **Last Updated**: 2012-10-01
- **Document Status**: Proposed Standard
- **Main Topic**: The OAuth 2.0 authorization framework enables third-party applications to obtain limited access to HTTP services using access tokens without sharing resource owner credentials.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: D. Hardt, Ed.
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: OAuth 2.0; HTTP; OAuth 1.0
- **Infrastructure Layers**: Authorization server; Resource server; Client
- **Standardization Bodies**: Internet Engineering Task Force (IETF); Internet Engineering Steering Group (IESG)
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; ECDSA
- **Key Takeaways**: OAuth 2.0 separates client roles from resource owners to avoid storing passwords in clear-text; Access tokens and ID tokens are typically JWTs signed with RSA or ECDSA requiring updates for PQC migration; The protocol is not backward compatible with OAuth 1.0 though both may co-exist; Implementations must support TLS version requirements and handle specific security considerations like phishing and cross-site request forgery.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect; Compliance Officer
- **Implementation Prerequisites**: HTTP protocol support; TLS version compliance; Client registration and authentication mechanisms
- **Relevant PQC Today Features**: api-security-jwt, tls-basics, migration-program, crypto-agility

---

## RFC 9449

- **Reference ID**: RFC 9449
- **Title**: OAuth 2.0 Demonstrating Proof of Possession (DPoP)
- **Authors**: IETF
- **Publication Date**: 2023-09-01
- **Last Updated**: 2023-09-01
- **Document Status**: Proposed Standard
- **Main Topic**: Defines the OAuth 2.0 Demonstrating Proof of Possession (DPoP) mechanism for binding tokens to client public keys using signed JWTs.
- **PQC Algorithms Covered**: ML-DSA
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: D. Fett, B. Campbell, J. Bradley, T. Lodderstedt, M. Jones, D. Waite
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: OAuth 2.0, HTTP, HTTPS, JWT
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: Internet Engineering Task Force (IETF), Internet Engineering Steering Group (IESG)
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: ECDSA
- **Key Takeaways**: DPoP binds OAuth tokens to a client public key to prevent unauthorized use of leaked tokens; Current DPoP proofs using ECDSA are quantum-vulnerable and require migration to ML-DSA; Migration to PQC-signed DPoP proofs requires JOSE standardization and increases header size; DPoP is designed for public clients like single-page applications where TLS client authentication is unavailable; DPoP must always be used in conjunction with HTTPS as it is not a substitute for secure transport.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Significantly larger proof headers per request when migrating to ML-DSA
- **Target Audience**: Developer, Security Architect
- **Implementation Prerequisites**: JOSE PQC standardization; HTTPS support; Non-extractable private key storage (e.g., W3C Web Crypto API) for browser clients
- **Relevant PQC Today Features**: api-security-jwt, algorithms, hybrid-crypto, crypto-agility

---

## NIST-SP-800-57-Pt1-R6

- **Reference ID**: NIST-SP-800-57-Pt1-R6
- **Title**: Recommendation for Key Management: Part 1 – General (Revision 5)
- **Authors**: NIST
- **Publication Date**: 2020-05-04
- **Last Updated**: 2020-05-04
- **Document Status**: Final
- **Main Topic**: This document provides general guidance and best practices for the management of cryptographic keying material throughout its lifecycle, including generation, storage, distribution, use, and destruction.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; National Institute of Standards and Technology; Office of Management and Budget; U.S. Department of Commerce
- **Leaders Contributions Mentioned**: Elaine Barker; William Barker; William Burr; Timothy Polk; Miles Smid; Lydia Zieglar; Paul Turner
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management; Cryptographic Module; HSM
- **Standardization Bodies**: National Institute of Standards and Technology
- **Compliance Frameworks Referenced**: Federal Information Security Modernization Act (FISMA); OMB Circular A-130; FIPS 140
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Proper key management is essential to the effective use of cryptography as poor management may compromise strong algorithms; Secret and private keys must be protected against unauthorized disclosure while all keys need protection against modification; Organizations must provide clear guidance and oversight for key management controls to ensure they are properly followed; Cryptographic modules used for operations are addressed in FIPS 140 rather than this recommendation; Key management functions include generation, storage, distribution, use, and destruction.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; System Administrator; Cryptographic Module Developer; Protocol Developer; System Owner; Manager
- **Implementation Prerequisites**: FIPS 140 compliance for cryptographic modules; clear guidance and oversight for key management; controls to ensure guidance is followed
- **Relevant PQC Today Features**: Compliance, Assess, Algorithms, crypto-agility, hsm-pqc

---

## KMIP-V2-1-OASIS

- **Reference ID**: KMIP-V2-1-OASIS
- **Title**: Key Management Interoperability Protocol (KMIP) Version 2.1
- **Authors**: OASIS KMIP Technical Committee
- **Publication Date**: 2021-06-20
- **Last Updated**: 2021-06-20
- **Document Status**: OASIS Standard
- **Main Topic**: KMIP v2.1 defines a protocol for communication between key management systems and cryptographic clients to support key lifecycle operations over TLS.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Tony Cox (TC Chair, Editor); Judith Furlong (TC Chair, Editor); Charles White (Editor); Tim Chevalier (Related work editor); Tim Hudson (Related work editor); Jeff Bartell (Related work editor)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS; HTTPS; JSON; XML; PKCS#11; X.509
- **Infrastructure Layers**: Key Management; HSM; KMS
- **Standardization Bodies**: OASIS
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: DSA; RSA; DH; EC; PGP
- **Key Takeaways**: KMIP v2.1 enables interoperability between key management infrastructure during PQC migration; The protocol supports full key lifecycle operations including create, locate, get, activate, revoke, and destroy; Implementation requires adherence to OASIS IPR Policy on RF on RAND Terms; The specification includes a Quantum Safe attribute for object metadata; Machine-readable content in plain text files prevails over prose narrative in case of discrepancy
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect
- **Implementation Prerequisites**: OASIS IPR Policy RF on RAND Terms compliance; Subscription to TC public comment list for feedback; Use of separate plain text files for normative machine-readable content
- **Relevant PQC Today Features**: kms-pqc, hsm-pqc, crypto-agility, pki-workshop, tls-basics

---

## BSI TR-02102-1

- **Reference ID**: BSI TR-02102-1
- **Title**: Cryptographic Mechanisms: Recommendations and Key Lengths
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-2

- **Reference ID**: BSI TR-02102-2
- **Title**: Cryptographic Mechanisms: Recommendations for TLS
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-3

- **Reference ID**: BSI TR-02102-3
- **Title**: Cryptographic Mechanisms: Recommendations for IPsec
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Position Paper

- **Reference ID**: ANSSI PQC Position Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition
- **Authors**: ANSSI France
- **Publication Date**: 2022-01-01
- **Last Updated**: 2022-01-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Follow-up Paper

- **Reference ID**: ANSSI PQC Follow-up Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition (2023 Follow-up)
- **Authors**: ANSSI France
- **Publication Date**: 2023-12-01
- **Last Updated**: 2023-12-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## RFC 7228

- **Reference ID**: RFC 7228
- **Title**: Terminology for Constrained-Node Networks
- **Authors**: IETF
- **Publication Date**: 2014-05-01
- **Last Updated**: 2014-05-01
- **Document Status**: Informational
- **Main Topic**: Defines terminology and device classes (Class 0-2) for constrained-node IoT networks, including RAM/Flash constraints as a foundation for algorithm selection.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: C. Bormann; M. Ersue; A. Keranen
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: IPv6; RPL; TCP; IEEE 802.15.4; Wi-Fi; DTN
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: IETF; IESG; ROLL working group
- **Compliance Frameworks Referenced**: BCP 78; Simplified BSD License
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Constrained nodes have hard upper bounds on state, code space, and processing cycles due to cost and physical constraints; Networks composed of constrained nodes exhibit characteristics like low bitrate, high packet loss, and asymmetric links; Device classes (0-2) are defined based on combinations of ROM/Flash and RAM constraints; Power terminology distinguishes between power-affluent nodes and power-constrained nodes using primary batteries or energy harvesting.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Constraints on maximum code complexity (ROM/Flash); Constraints on size of state and buffers (RAM); Prefix kibi (1024) combined with byte to kibibyte (KiB).
- **Target Audience**: Researcher; Security Architect; Developer; Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: iot-ot-pqc; algorithms; assess

---

## RFC 9019

- **Reference ID**: RFC 9019
- **Title**: A Firmware Update Architecture for Internet of Things (SUIT)
- **Authors**: IETF SUIT
- **Publication Date**: 2021-04-01
- **Last Updated**: 2021-04-01
- **Document Status**: Informational
- **Main Topic**: Defines the SUIT manifest format and architecture for secure firmware updates on constrained IoT devices.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: B. Moran; H. Tschofenig; D. Brown; M. Meriac
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Lightweight Machine-to-Machine (LwM2M); DNS-based Service Discovery (DNS-SD)
- **Infrastructure Layers**: Trust Anchor Store; Trusted Execution Environments (TEEs); Rich Execution Environment (REE)
- **Standardization Bodies**: Internet Engineering Task Force (IETF); Internet Architecture Board (IAB)
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Firmware updates must authenticate and integrity protect images to prevent malicious flashing; Confidentiality protection of firmware is optional but mitigates reverse engineering risks; Unattended automatic updates are essential for IoT devices lacking user interfaces; Robust update mechanisms require recovery strategies to prevent device breakage; Energy efficiency is critical for battery-powered devices during radio communication and flash writing.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect; Operations; Policy Maker
- **Implementation Prerequisites**: Support for asymmetric or symmetric credentials; Bootloader integration; Status tracker functionality; Mechanism to discover status trackers or firmware servers via preconfigured hostnames or DNS-SD
- **Relevant PQC Today Features**: iot-ot-pqc; code-signing; crypto-agility; migration-program

---

## RFC 9147

- **Reference ID**: RFC 9147
- **Title**: The Datagram Transport Layer Security (DTLS) Protocol Version 1.3
- **Authors**: IETF TLS
- **Publication Date**: 2022-04-01
- **Last Updated**: 2022-04-01
- **Document Status**: Proposed Standard
- **Main Topic**: Specification of the Datagram Transport Layer Security (DTLS) Protocol Version 1.3 as a UDP-based variant of TLS 1.3 designed to prevent eavesdropping, tampering, and message forgery over unreliable datagram transports.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: E. Rescorla; H. Tschofenig; N. Modadugu
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: DTLS 1.3; TLS 1.3; TCP; UDP; SRTP; IPsec AH/ESP; DTLS 1.2; DTLS 1.0; TLS 1.2; TLS 1.1
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: Internet Engineering Task Force (IETF); Internet Engineering Steering Group (IESG)
- **Compliance Frameworks Referenced**: BCP 78; Revised BSD License
- **Classical Algorithms Referenced**: AEAD_AES_128_CCM_8; CCM
- **Key Takeaways**: DTLS 1.3 preserves datagram semantics by adding sequence numbers and fragmentation support to handle packet loss and reordering; The protocol obsoletes RFC 6347 (DTLS 1.2) and harmonizes versioning with TLS 1.3; Replay detection is optional and implemented via a bitmap window of received records similar to IPsec AH/ESP; Handshake messages include sequence numbers to enable reassembly when datagrams are lost or reordered; DTLS 1.3 uses the HelloRetryRequest message as a return-routability check against denial-of-service attacks.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Handshake messages up to 2^24-1 bytes; UDP datagrams often limited to less than 1500 bytes; DTLS epoch serialized as 2 octets; Sequence number uses low order 48 bits of a 64 bit counter; Plaintext records must not exceed sequence number 2^48-1
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: Familiarity with TLS 1.3 [TLS13]; Familiarity with RFC9146 for CID functionality; Support for network byte order (big-endian) encoding
- **Relevant PQC Today Features**: tls-basics, iot-ot-pqc, crypto-agility

---

## RFC 8879

- **Reference ID**: RFC 8879
- **Title**: TLS Certificate Compression
- **Authors**: IETF TLS
- **Publication Date**: 2020-11-01
- **Last Updated**: 2020-11-01
- **Document Status**: Proposed Standard
- **Main Topic**: Defines a mechanism to compress TLS 1.3 certificate chains using zlib, brotli, or zstd to reduce data transmission and latency.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Adam Langley; Wan-Teh Chang; David Benjamin; Ryan Hamilton; Christian Huitema; Benjamin Kaduk; Ilari Liusvaara; Piotr Sikora; Ian Swett; Martin Thomson; Sean Turner
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.3; QUIC Crypto protocol
- **Infrastructure Layers**: PKI
- **Standardization Bodies**: Internet Engineering Task Force (IETF); IANA
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Certificate compression reduces TLS handshake data by approximately 30%; Compression is only supported in TLS 1.3 to prevent middlebox interference; Implementations must bound memory usage and limit decompressed chain size to the specified uncompressed length; Compression alters message lengths, requiring padding schemes to address potential side-channel analysis
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Reduces certificate chain overhead by ~30%; TLS framing imposes a 16777216-byte limit on certificate message size; Supports zlib, brotli, and zstd compression algorithms
- **Target Audience**: Developer; Security Architect; Operations
- **Implementation Prerequisites**: TLS 1.3 or newer; Support for zlib, brotli, or zstd compression algorithms; Memory usage bounds for decompression
- **Relevant PQC Today Features**: tls-basics; pki-workshop; iot-ot-pqc

---

## RFC 7250

- **Reference ID**: RFC 7250
- **Title**: Using Raw Public Keys in Transport Layer Security (TLS) and DTLS
- **Authors**: IETF TLS
- **Publication Date**: 2014-06-01
- **Last Updated**: 2014-06-01
- **Document Status**: Proposed Standard
- **Main Topic**: This document specifies a new certificate type and two TLS extensions for exchanging raw public keys in Transport Layer Security (TLS) and Datagram Transport Layer Security (DTLS).
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: P. Wouters, Ed.; H. Tschofenig, Ed.; J. Gilmore; S. Weiler; T. Kivinen
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS; DTLS; CoAP; DNSSEC; DANE; LDAP; PKIX
- **Infrastructure Layers**: PKI; Key Management
- **Standardization Bodies**: IETF; IESG; IANA
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; DSA; ECDSA
- **Key Takeaways**: Raw public keys eliminate certificate chain overhead for ultra-constrained IoT devices; The mechanism requires an out-of-band process to bind the public key to the entity; Only a minimalistic ASN.1 parser is needed instead of full PKIX validation code; The specification allows combined usage of raw public keys and X.509 certificates; No new cipher suites are required to use raw public keys
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Combined Usage of Raw Public Keys and X.509 Certificates
- **Performance & Size Considerations**: ~70% size reduction compared to original certificate; SubjectPublicKeyInfo structure is kept fairly small
- **Target Audience**: Developer; Security Architect; IoT Engineer
- **Implementation Prerequisites**: Minimalistic ASN.1 parser; Out-of-band mechanism to bind public key to entity; Support for TLS extensions client_certificate_type and server_certificate_type
- **Relevant PQC Today Features**: tls-basics, iot-ot-pqc, pki-workshop, crypto-agility

---

## NIST SP 800-82 Rev. 3

- **Reference ID**: NIST SP 800-82 Rev. 3
- **Title**: Guide to Operational Technology (OT) Security
- **Authors**: NIST
- **Publication Date**: 2023-09-01
- **Last Updated**: 2023-09-01
- **Document Status**: Final
- **Main Topic**: NIST guidance on securing operational technology (OT) systems including industrial control systems, SCADA, and DCS while addressing unique performance, reliability, and safety requirements.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; National Institute of Standards and Technology; U.S. Department of Commerce; Office of Management and Budget
- **Leaders Contributions Mentioned**: Keith Stouffer, Michael Pease, CheeYee Tang, Timothy Zimmerman, Victoria Pillitteri, Suzanne Lightman, Adam Hahn, Stephanie Saravia, Aslam Sherule, Michael Thompson
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: National Institute of Standards and Technology; Office of Management and Budget
- **Compliance Frameworks Referenced**: Federal Information Security Modernization Act (FISMA); OMB Circular A-130; NIST SP 800-53, Rev. 5; Cybersecurity Framework
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations should expand security scope from industrial control systems to broader operational technology; OT cybersecurity programs require tailored governance and cross-functional teams; Risk management frameworks must be adapted for OT environments considering safety and reliability; Security controls should be tailored using the OT overlay for NIST SP 800-53, Rev. 5; Supply chain risk management is a special area requiring specific consideration in OT security
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Compliance Officer, Policy Maker, Operations, Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: iot-ot-pqc, pqc-risk-management, pqc-business-case, pqc-governance

---

## NSM-10

- **Reference ID**: NSM-10
- **Title**: National Security Memorandum 10 — Promoting U.S. Leadership in Quantum Computing
- **Authors**: White House
- **Publication Date**: 2022-05-04
- **Last Updated**: 2022-05-04
- **Document Status**: Final
- **Main Topic**: National Security Memorandum 10 directs U.S. federal agencies to inventory cryptographic systems and transition to quantum-resistant cryptography by 2035 while promoting leadership in quantum information science.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: cryptanalytically relevant quantum computer (CRQC)
- **Migration Timeline Info**: Goal of mitigating quantum risk as much as feasible by 2035; first sets of standards expected by 2024; deprecation timeline proposed within 90 days of standard release with a goal to move systems off vulnerable cryptography within a decade.
- **Applicable Regions / Bodies**: Regions: United States; Bodies: National Institute of Standards and Technology (NIST), National Security Agency (NSA), Cybersecurity and Infrastructure Security Agency (CISA), Office of Management and Budget (OMB), National Cyber Director, Office of Science and Technology Policy, Federal Civilian Executive Branch (FCEB) Agencies.
- **Leaders Contributions Mentioned**: President Joe Biden; Vice President Kamala Harris; First Lady Dr. Jill Biden; Second Gentleman Douglas Emhoff; Secretary of Commerce; Secretary of Homeland Security; Director of NIST; Director of NSA; Director of CISA; Director of OMB; National Cyber Director; Assistant to the President for National Security Affairs (APNSA).
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Public-key cryptography; digital signatures; system administrator protocols; non-security software and firmware; High Value Assets; High Impact Systems.
- **Standardization Bodies**: National Institute of Standards and Technology (NIST); technical standards bodies.
- **Compliance Frameworks Referenced**: National Quantum Initiative Act (Public Law 115-368); National Defense Authorization Act for Fiscal Year 2022 (Public Law 117-81).
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Federal agencies must inventory all currently deployed cryptographic systems excluding National Security Systems; NIST and NSA are developing technical standards for quantum-resistant cryptography expected by 2024; The United States aims to mitigate quantum risk as much as feasible by 2035; Agencies must establish a Migration to Post-Quantum Cryptography Project at the National Cybersecurity Center of Excellence; Cryptographic agility is central to reducing transition time and allowing seamless updates.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: cryptographic agility; interoperable quantum-resistant cryptography; migration planning; inventorying vulnerable systems.
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Compliance Officer, Security Architect, CISO, Operations
- **Implementation Prerequisites**: Inventory of IT systems vulnerable to CRQCs; identification of key information technology assets to prioritize; development of migration plans addressing most significant risks first; coordination with the National Quantum Coordination Office.
- **Relevant PQC Today Features**: Timeline, Threats, Compliance, Migrate, Assess, Leaders, crypto-agility, pqc-risk-management, migration-program, pqc-governance

---

## OMB-M-23-02

- **Reference ID**: OMB-M-23-02
- **Title**: OMB Memorandum M-23-02 — Migrating to Post-Quantum Cryptography
- **Authors**: OMB; White House
- **Publication Date**: 2022-11-18
- **Last Updated**: 2022-11-18
- **Document Status**: Final
- **Main Topic**: OMB Memorandum M-23-02 directs federal agencies to conduct prioritized inventories of cryptographic systems vulnerable to cryptanalytically relevant quantum computers and outlines migration planning requirements.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Cryptanalytically relevant quantum computer (CRQC); Harvest Now Decrypt Later (encrypted data recorded now and later decrypted)
- **Migration Timeline Info**: Designate lead within 30 days; submit first inventory by May 4, 2023; annual inventories until 2035; goal to mitigate quantum risk by 2035
- **Applicable Regions / Bodies**: United States; Executive Departments and Agencies; Office of Management and Budget (OMB); Office of the National Cyber Director (ONCD); Department of Homeland Security Cybersecurity and Infrastructure Security Agency (CISA); National Security Agency (NSA); National Institute of Standards and Technology (NIST); FedRAMP Program Management Office (PMO)
- **Leaders Contributions Mentioned**: Shalanda D. Young (Director, OMB); Federal Chief Information Security Officer (Chair of Cryptographic Migration Working Group)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Public Key Infrastructure; Cloud service providers; Continuous Diagnostics and Mitigation (CDM)
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: Federal Information Processing Standards (FIPS) 199; Federal Information Security Modernization Act (FISMA); Executive Order 14028; OMB Memorandum M-22-09; National Security Memorandum 10 (NSM-10)
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Agencies must submit a prioritized inventory of CRQC-vulnerable systems by May 4, 2023, and annually thereafter until 2035; Inventories must focus on High Value Assets (HVAs), high impact systems, and data expected to remain mission-sensitive in 2035; Agencies are required to assess funding needs for PQC migration within 30 days of each annual inventory submission; Testing of pre-standardized PQC is encouraged in production environments alongside current algorithms; A cryptographic migration working group will be established to coordinate agency efforts
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Testing pre-standardized PQC alongside current approved and validated algorithms; Hybrid environment hosting options for information systems
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Compliance Officer, Security Architect, Policy Maker
- **Implementation Prerequisites**: Designation of a cryptographic inventory and migration lead; Prioritized inventory of active cryptographic systems; Assessment of funding required for PQC migration; Identification of High Value Assets (HVAs) and high impact systems
- **Relevant PQC Today Features**: Timeline, Threats, Compliance, Migrate, Assess, pqc-governance, data-asset-sensitivity, migration-program

---

## WH-PQC-Report-2024

- **Reference ID**: WH-PQC-Report-2024
- **Title**: White House Report on Post-Quantum Cryptography (July 2024)
- **Authors**: White House; ONCD
- **Publication Date**: 2024-07-01
- **Last Updated**: 2024-07-01
- **Document Status**: Final
- **Main Topic**: White House report outlining the Federal Government's strategy, funding estimates, and NIST-led standardization efforts for migrating to post-quantum cryptography by 2035.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Cryptanalytically relevant quantum computer (CRQC); record-now-decrypt-later attacks
- **Migration Timeline Info**: Migration progress expected during 2024 and beyond; budget projections through 2035; data expected to remain mission-sensitive in 2035 prioritized for migration
- **Applicable Regions / Bodies**: United States; Office of Management and Budget (OMB); National Institute of Standards and Technology (NIST); Department of Homeland Security Cybersecurity and Infrastructure Security Agency (CISA); Senate Committee on Homeland Security and Governmental Affairs; House Committee on Oversight and Accountability
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Public-key cryptography; digital signature schemes; automated cryptographic inventory solutions; zero trust architecture
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: Quantum Computing Cybersecurity Preparedness Act, Public Law No: 117-260; National Security Memorandum 10 (NSM-10); OMB Memorandum M-23-02; Executive Order 14028; OMB Memorandum M-22-09
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Agencies must maintain a comprehensive and ongoing cryptographic inventory to baseline migration efforts; Migration must begin immediately due to the threat of record-now-decrypt-later attacks before CRQCs exist; Agencies must prioritize high impact systems and data expected to remain sensitive in 2035 for early migration; Interoperability failures may occur if systems are not migrated simultaneously, requiring careful planning
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker; Compliance Officer; Security Architect; CISO
- **Implementation Prerequisites**: Comprehensive cryptographic inventory; automated inventory capability evolution; annual manual inventory of hardware and software; identification of systems unable to support PQC algorithms
- **Relevant PQC Today Features**: Threats, Migrate, Assess, Compliance, Timeline, migration-program, pqc-risk-management, data-asset-sensitivity

---

## EO-14144

- **Reference ID**: EO-14144
- **Title**: Executive Order 14144 — Strengthening and Promoting Innovation in the Nation's Cybersecurity
- **Authors**: White House
- **Publication Date**: 2025-01-16
- **Last Updated**: 2025-01-16
- **Document Status**: Final
- **Main Topic**: The document is an access control page for FederalRegister.gov and eCFR.gov requiring CAPTCHA verification due to automated scraping flags.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States government
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Programmatic access to FederalRegister.gov and eCFR.gov is limited due to aggressive automated scraping; Human users must complete a CAPTCHA bot test to request access; Technical help for IP range requests is available via the Site Help button; Confidential information should not be provided in the contact form.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Operations
- **Implementation Prerequisites**: CAPTCHA completion; Access to FederalRegister.gov API documentation or eCFR.gov API documentation
- **Relevant PQC Today Features**: compliance-strategy, migration-program

---

## BSI TR-02102-1

- **Reference ID**: BSI TR-02102-1
- **Title**: Cryptographic Mechanisms: Recommendations and Key Lengths
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-2

- **Reference ID**: BSI TR-02102-2
- **Title**: Cryptographic Mechanisms: Recommendations for TLS
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-3

- **Reference ID**: BSI TR-02102-3
- **Title**: Cryptographic Mechanisms: Recommendations for IPsec
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Position Paper

- **Reference ID**: ANSSI PQC Position Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition
- **Authors**: ANSSI France
- **Publication Date**: 2022-01-01
- **Last Updated**: 2022-01-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Follow-up Paper

- **Reference ID**: ANSSI PQC Follow-up Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition (2023 Follow-up)
- **Authors**: ANSSI France
- **Publication Date**: 2023-12-01
- **Last Updated**: 2023-12-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BIS-Paper-158

- **Reference ID**: BIS-Paper-158
- **Title**: BIS Paper 158 — Quantum-Readiness Roadmap for Financial Systems
- **Authors**: BIS; Bank for International Settlements
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Published
- **Main Topic**: A framework to support the financial system in transitioning to quantum-safe cryptographic infrastructures, emphasizing early awareness and inventory.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum computers breaking today's widely used encryption
- **Migration Timeline Info**: Start the transition today with broad awareness and cryptographic inventory as critical foundations; phased migration required
- **Applicable Regions / Bodies**: Global financial system; central banks
- **Leaders Contributions Mentioned**: Raphael Auer, Donna Dodson, Angela Dupont, Maryam Haghighi, Nicolas Margaine, Danica Marsden, Sarah McCarthy, Andras Valko
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Quantum-safe cryptographic infrastructures; infrastructure challenges for quantum key distribution
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Start the transition to quantum-safe cryptography today with broad awareness; conduct a cryptographic inventory as a critical foundation; avoid viewing the change as simple algorithm replacement; implement cryptographic agility, defense in depth, and hybrid models; recognize that quantum key distribution faces infrastructure challenges limiting immediate applicability
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid models; cryptographic agility; defense in depth; phased migration
- **Performance & Size Considerations**: Performance trade-offs mentioned but no concrete values provided
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer, Researcher
- **Implementation Prerequisites**: Broad awareness; cryptographic inventory; coordinated planning for system integration
- **Relevant PQC Today Features**: Assess, Migrate, hybrid-crypto, crypto-agility, qkd, pqc-governance

---

## EU-NIS-CG-Roadmap-v1.1

- **Reference ID**: EU-NIS-CG-Roadmap-v1.1
- **Title**: EU NIS Cooperation Group — Coordinated Implementation Roadmap for PQC Transition v1.1
- **Authors**: EU NIS Cooperation Group; European Commission; ENISA
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Published
- **Main Topic**: The EU NIS Cooperation Group issued a coordinated implementation roadmap and timeline for the transition to Post-Quantum Cryptography across EU Member States.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum computing identified as a threat to cryptographic algorithms protecting confidentiality and authenticity of data
- **Migration Timeline Info**: Commission published Recommendation on 11 April 2024; document issued 23 June 2025
- **Applicable Regions / Bodies**: Regions: EU Member States; Bodies: EU NIS Cooperation Group, Commission
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Member States must implement recommendations for a synchronised transition to PQC; Stakeholders need to be informed on the quantum threat to cryptography; A work stream on PQC was established with the NIS Cooperation Group; The roadmap provides harmonized timelines and priority sectors
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Compliance Officer
- **Implementation Prerequisites**: Establishment of a work stream on PQC with the NIS Cooperation Group; Implementation of recommendations for synchronised transition
- **Relevant PQC Today Features**: Timeline, Threats, Compliance, Migrate, pqc-governance

---

## PKI-Consortium-PQC-2025

- **Reference ID**: PKI-Consortium-PQC-2025
- **Title**: PKI Consortium PQC Conference 2025 — Conclusions and Call to Action
- **Authors**: PKI Consortium
- **Publication Date**: 2025-11-04
- **Last Updated**: 2025-11-04
- **Document Status**: Published
- **Main Topic**: The PKI Consortium's Post-Quantum Cryptography Conference 2025 in Kuala Lumpur concluded with an urgent global call to migrate to quantum-resistant encryption and the announcement of Malaysia's national PQC roadmap.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum computers rendering today's encryption obsolete; compromise of financial systems, national defense, healthcare, and transportation within minutes; exposure of vast data stores and critical infrastructure
- **Migration Timeline Info**: Conference held 28-30 October 2025; next conference in Germany in 2026; urgent call to act now before quantum computers make data unsafe
- **Applicable Regions / Bodies**: Regions: Malaysia, ASEAN, Southeast Asia, Germany; Bodies: PKI Consortium, Ministry of Digital Malaysia, National Cyber Security Agency (NACSA)
- **Leaders Contributions Mentioned**: Paul van Brouwershaven (Chair of the PKI Consortium and its Post-Quantum Cryptography Working Group); Chris Bailey (Board and Executive Council Chair of the PKI Consortium)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Public Key Infrastructure (PKI), critical infrastructure, Internet of Things (IoT)
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must begin replacing vulnerable cryptography immediately to safeguard the digital economy; Malaysia has launched a National Post-Quantum Cryptography Readiness Roadmap for ASEAN; The PKI Consortium introduced the Post-Quantum Cryptography Maturity Model (PQCMM) to assess preparedness; Global coordination is required across government, industry, and academia to accelerate migration; High-risk sectors like healthcare and IoT require specific protection strategies
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Cryptographic agility; migration planning; system-wide cryptographic migrations
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Policy Maker, Government Leaders, Operations
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Migrate, Assess, Leaders, Threats, Timeline, pki-workshop, iot-ot-pqc

---

## India-DST-NQM-Roadmap

- **Reference ID**: India-DST-NQM-Roadmap
- **Title**: India DST Task Force Report — Phased Roadmap for Migration to Post-Quantum Cryptography under NQM
- **Authors**: DST India; National Quantum Mission; CERT-In
- **Publication Date**: 2026-02-04
- **Last Updated**: 2026-02-04
- **Document Status**: Published
- **Main Topic**: India DST Task Force report outlining a phased roadmap for migrating to Post-Quantum Cryptography under the National Quantum Mission with milestones through 2033.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest Now, Decrypt Later (HNDL); Shor's algorithm; Grover's algorithm; Q-Day
- **Migration Timeline Info**: CII foundations by 2027; high-priority systems by 2028; full CII by 2029; nationwide by 2033
- **Applicable Regions / Bodies**: Regions: India; Bodies: Department of Science and Technology (DST), National Quantum Mission (NQM), Centre for Development of Telematics (C-DOT), Telecommunication Engineering Centre (TEC), Data Security Council of India (DSCI)
- **Leaders Contributions Mentioned**: Dr. Rajkumar Upadhyay, CEO, C-DOT, chaired the Task Force; Mr. Kamal Kumar Agarwal, DDG, QT, TEC, chaired Sub-Group 1 for standards and testing; Mr. Vinayak Godse, CEO, DSCI, chaired Sub-Group 2 for quantum resiliency and migration
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: PKI systems; National Evaluation and Testing infrastructure; national testbeds; Quantum Key Distribution (QKD) backbone
- **Standardization Bodies**: National Institute of Standards and Technology (NIST); Indian Standards
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; Elliptic Curve Cryptography (ECC); symmetric encryption; cryptographic hash functions
- **Key Takeaways**: India must establish CII foundations by 2027 and achieve nationwide PQC adoption by 2033; Organizations should launch PQC/hybrid solution pilots in high-priority systems immediately; A National PQC Testing & Certification Program is required to validate quantum-safe products; Long-term confidential data faces immediate risk from Harvest Now, Decrypt Later attacks; Migration requires progressive adoption of indigenously developed quantum-safe products while maintaining global interoperability
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: PQC/hybrid solution pilots; hybrid PQC–QKD solutions; crypto agility; phased transition to PQC
- **Performance & Size Considerations**: Average cost of a data breach is 4.44 million USD; 15% increase in breach costs since 2020
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer, Researcher, Operations
- **Implementation Prerequisites**: Cryptographic inventory; establishment of National Evaluation and Testing infrastructure; development of PQC-ready PKI systems; creation of national testbeds for hybrid solutions
- **Relevant PQC Today Features**: Timeline; Threats; Migrate; Assess; qkd; crypto-agility; migration-program; pqc-governance; digital-id

---

## India-TEC-910018-2025

- **Reference ID**: India-TEC-910018-2025
- **Title**: India TEC Technical Report TEC 910018:2025 — Migration to Post-Quantum Cryptography
- **Authors**: TEC India; Department of Telecommunications
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Published
- **Main Topic**: Technical report by India's Telecommunication Engineering Centre on migrating telecom infrastructure to Post-Quantum Cryptography to address quantum threats.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Shor algorithm; Grover algorithm; Man-in-the-Middle Attacks; Individual Attacks; Threat to Digital Signatures; Data Breaches; Document Integrity compromise
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: India; Telecommunication Engineering Centre (TEC); Department of Telecommunications; Ministry of Communications; Government of India
- **Leaders Contributions Mentioned**: Ms. Tripti Saxena (Sr DDG & Head, TEC, DoT); Sh. Kamal Kr Agarwal (DDG (QT), TEC, DoT); Dr. Goutam Paul (ISI Kolkata); Dr. Swagata Mandal (Jalpaiguri Government Engineering College); Dr. Sucheta Chakrabarti (Former Scientist-G, SAG, DRDO); Dr. Angshuman Karmakar (IIT Kanpur); Sh. Vinayaka Pandit (IBM); Sh. Bhupendra Singh (CAIR, DRDO); Sh. B. Srinivas Goud (NCIIPC); Dr. Shravani Shahapure (M/s Deloitte); Sh. Rakesh Singh Rawat (C-DoT); Dr. Roopika Chaudhary (DIT & CS, DRDO); Dr. Mahavir Jhawar (Ashoka University); Sh. Venkata Rama Raju Chelle (Director (QT), TEC, DoT); Sh. Rakesh Goyal (ADG, TEC)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Application Cryptography; Infrastructure Cryptography; Digital Signatures; Encryption
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: ISO 9001:2015
- **Classical Algorithms Referenced**: RSA; ECDSA; ECDH
- **Key Takeaways**: Organizations must identify critical digital infrastructure and data before quantum computers are deployed; Immediate preparation is required as current standards like RSA and ECDSA will be broken by Shor and Grover algorithms; Hybrid solutions should be used to mitigate short-term risks during migration; Crypto-agility is essential for achieving a smooth transition to quantum-safe cryptography
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid Solution approach; Isolation approaches during migration; Crypto-agility
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Policy Maker; Government Organizations; Industry; Enterprises
- **Implementation Prerequisites**: Conduct a Risk Assessment; Define Post Quantum Requirements; Evaluate the Vendor's Roadmap; Request Proof of Concept (PoC) or Pilots; Test and Validate the Implementation
- **Relevant PQC Today Features**: Threats; Migrate; Assess; Algorithms; Leaders; hybrid-crypto; crypto-agility; vendor-risk; migration-program; pqc-risk-management

---

## HKMA-Fintech-Blueprint-2026

- **Reference ID**: HKMA-Fintech-Blueprint-2026
- **Title**: HKMA Fintech Promotion Blueprint (From Adoption to Advancement) — Quantum Preparedness Index
- **Authors**: HKMA; Hong Kong Monetary Authority
- **Publication Date**: 2026-02-03
- **Last Updated**: 2026-02-03
- **Document Status**: Published
- **Main Topic**: The Hong Kong Monetary Authority launched a Fintech Promotion Blueprint featuring a Quantum Preparedness Index to assess banking sector readiness for Post-Quantum Cryptography.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Hong Kong; Bodies: Hong Kong Monetary Authority
- **Leaders Contributions Mentioned**: Mr Arthur Yuen, Deputy Chief Executive of the HKMA
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: High-Performance Computing
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: HKMA will develop a Quantum Preparedness Index to assess banking sector PQC readiness; The Blueprint establishes Data Excellence and Cyber Resilience as foundational pillars for managing advanced technology risks; Four flagship projects including the Quantum Preparedness Index will be launched in the coming months; The initiative aims to guide practical support throughout the PQC transition journey
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Assess, Leaders, pqc-governance, migration-program, pqc-risk-management

---

## HK-CI-Ordinance-2025

- **Reference ID**: HK-CI-Ordinance-2025
- **Title**: Hong Kong Protection of Critical Infrastructure (Computer System) Ordinance
- **Authors**: Hong Kong LegCo; HKMA
- **Publication Date**: 2025-06-27
- **Last Updated**: 2025-06-27
- **Document Status**: Enacted
- **Main Topic**: The Protection of Critical Infrastructures (Computer Systems) Ordinance (Cap. 653) will come into effect on January 1, 2026, imposing statutory obligations on designated operators to protect computer systems against cyberattacks.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Ordinance comes into operation on January 1, 2026; Gazette notice published June 27, 2025; Ordinance gazetted March 28, 2025.
- **Applicable Regions / Bodies**: Regions: Hong Kong; Bodies: Legislative Council, Secretary for Security, The Government.
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Protection of Critical Infrastructures (Computer Systems) Ordinance (Cap. 653).
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Designated operators must adopt appropriate measures to protect computer systems; The Ordinance aims to minimize risks of essential service disruption due to cyberattacks; Statutory obligations commence on January 1, 2026.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer, Policy Maker, Operations
- **Implementation Prerequisites**: Adoption of appropriate measures to protect computer systems; Compliance with statutory obligations under Cap. 653.
- **Relevant PQC Today Features**: Compliance, Migration-program, pqc-governance, compliance-strategy

---

## UAE-DESC-PQC-Guideline

- **Reference ID**: UAE-DESC-PQC-Guideline
- **Title**: Dubai Electronic Security Center — Post-Quantum Cryptography Guideline
- **Authors**: DESC; Dubai Electronic Security Center
- **Publication Date**: 2025-05-01
- **Last Updated**: 2025-05-01
- **Document Status**: Published
- **Main Topic**: Dubai Electronic Security Center launches a Post-Quantum Cryptography Guideline at GISEC Global 2025 to prepare Dubai's digital infrastructure for quantum threats.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: emerging quantum-based threats; advancements in quantum computing
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Dubai, UAE; Bodies: Dubai Electronic Security Center
- **Leaders Contributions Mentioned**: H.E. Yousuf Hamad Al Shaibani (Chief Executive of the Dubai Electronic Security Center); Mohammed Faizan (Author)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Public Key Infrastructure; Critical Information Infrastructure (CII)
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Information Security Regulations (ISR)
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: DESC launched a PQC Guideline to bolster Dubai's digital infrastructure readiness against quantum threats; The guideline targets both government and private sector entities in Dubai; Zero Trust and Ethaq Plus initiatives complement the PQC strategy for securing networks and transactions; National talent development is emphasized through the ISR Officer Certification Program and cybersecurity challenges.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Compliance Officer, Policy Maker, Government Entities, Private Sector Organizations
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, Migrate, Leaders, pqc-governance, digital-id

---

## Microsoft-QSP-Roadmap-2025

- **Reference ID**: Microsoft-QSP-Roadmap-2025
- **Title**: Microsoft Quantum Safe Program (QSP) — Product Roadmap to 2033
- **Authors**: Microsoft
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Published
- **Main Topic**: The document is a Microsoft Security website navigation and blog feed listing various cybersecurity products, threat intelligence reports, and AI security articles, but does not contain the specific Quantum Safe Program roadmap described in the title.
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; CISO; Developer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## PQCC-Migration-Roadmap-2025

- **Reference ID**: PQCC-Migration-Roadmap-2025
- **Title**: Post-Quantum Cryptography Coalition (PQCC) PQC Migration Roadmap
- **Authors**: PQCC; Post-Quantum Cryptography Coalition
- **Publication Date**: 2025-05-01
- **Last Updated**: 2025-05-01
- **Document Status**: Published
- **Main Topic**: The PQCC publishes a Post-Quantum Cryptography Migration Roadmap featuring a four-category framework to assist organizations in navigating PQC transition complexities.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: emerging quantum threats
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: industry standards
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations should utilize a four-category framework covering Preparation, Baseline Understanding, Planning and Execution, and Monitoring and Evaluation; Stakeholders must be aligned to prioritize assets and implement solutions; Continuous monitoring of progress is essential to ensure a secure transition to quantum-safe cryptography.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, CISO, Compliance Officer, Operations
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: migration-program, pqc-governance, data-asset-sensitivity, compliance-strategy

---

## BSI TR-02102-1

- **Reference ID**: BSI TR-02102-1
- **Title**: Cryptographic Mechanisms: Recommendations and Key Lengths
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-2

- **Reference ID**: BSI TR-02102-2
- **Title**: Cryptographic Mechanisms: Recommendations for TLS
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-3

- **Reference ID**: BSI TR-02102-3
- **Title**: Cryptographic Mechanisms: Recommendations for IPsec
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Position Paper

- **Reference ID**: ANSSI PQC Position Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition
- **Authors**: ANSSI France
- **Publication Date**: 2022-01-01
- **Last Updated**: 2022-01-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Follow-up Paper

- **Reference ID**: ANSSI PQC Follow-up Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition (2023 Follow-up)
- **Authors**: ANSSI France
- **Publication Date**: 2023-12-01
- **Last Updated**: 2023-12-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## PQCC-Inventory-Workbook-2025

- **Reference ID**: PQCC-Inventory-Workbook-2025
- **Title**: Post-Quantum Cryptography Coalition (PQCC) PQC Inventory Workbook
- **Authors**: PQCC; Post-Quantum Cryptography Coalition
- **Publication Date**: 2025-06-01
- **Last Updated**: 2025-06-01
- **Document Status**: Published
- **Main Topic**: The PQC Inventory Workbook provides a structured resource for organizations to build centralized cryptographic inventories for migration planning, asset identification, and risk prioritization.
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
- **Key Takeaways**: Organizations must create a centralized inventory to track cryptographic migration efforts at the system or asset level; Assets should be categorized by priority such as high, medium, or low; The inventory should be updated continuously as new data or systems are identified; A glossary of key cryptographic terms and common algorithm vulnerabilities is included to support understanding.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Compliance Officer, Operations
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Assess; Migrate; migration-program; pqc-risk-management

---

## Singapore-NQSN-Plus

- **Reference ID**: Singapore-NQSN-Plus
- **Title**: Singapore National Quantum-Safe Network Plus (NQSN+)
- **Authors**: IMDA Singapore; CSA Singapore; GovTech Singapore
- **Publication Date**: 2023-06-01
- **Last Updated**: 2023-06-01
- **Document Status**: Active Programme
- **Main Topic**: Singapore launches the National Quantum-Safe Network Plus (NQSN+) to pilot and deploy quantum-safe networking solutions across government, financial, and critical infrastructure sectors.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum computers breaking encryption algorithms relied on today; quantum computing risks
- **Migration Timeline Info**: NQSN+ launched in 2023 as part of the Digital Connectivity Blueprint to 2030; goal to achieve a quantum-safe Singapore in 10 years
- **Applicable Regions / Bodies**: Regions: Singapore; Bodies: Infocomm Media Development Authority (IMDA), Cyber Security Agency of Singapore (CSA), Government Technology Agency of Singapore (GovTech), Centre for Quantum Technologies (CQT)
- **Leaders Contributions Mentioned**: Mr Heng Swee Keat announced the launch of NQSN+ at ATxSG 2023
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Critical Information Infrastructure (CII); nationwide fibre network; quantum-safe networks
- **Standardization Bodies**: International Telecommunication Union (ITU)
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: IMDA, CSA, and GovTech jointly developed a Quantum-Safe Handbook to guide Critical Information Infrastructure owners; NQSN+ enables businesses to integrate Quantum Key Distribution (QKD) and Post-Quantum Cryptography (PQC); Singapore is co-leading with Japan to establish a QKD protocol framework at the ITU; Two network operators, Singtel and SPTel, alongside SpeQtral, will build interoperable quantum-safe networks nationwide
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Integration of Quantum Key Distribution (QKD) and Post-Quantum Cryptography (PQC); integration with quantum-ready networks from like-minded countries
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Policy Maker, Critical Information Infrastructure owners, Government agencies, Network operators
- **Implementation Prerequisites**: Access to NQSN+ operators (Singtel, SPTel, SpeQtral); adoption of Quantum Key Distribution (QKD) or Post-Quantum Cryptography (PQC) solutions; alignment with QKD reference specification
- **Relevant PQC Today Features**: qkd, migration-program, pqc-governance, 5g-security, compliance-strategy

---

## ANSSI-PQC-Position-2022

- **Reference ID**: ANSSI-PQC-Position-2022
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition
- **Authors**: ANSSI; French National Cybersecurity Agency
- **Publication Date**: 2022-01-04
- **Last Updated**: 2022-01-04
- **Document Status**: Published
- **Main Topic**: ANSSI presents France's position on PQC transition, advocating hybrid schemes and providing phased guidance for government and regulated entities.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: France; Bodies: ANSSI, BetaGouv, Direction interministérielle du numérique
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Hybrid post-quantum/classical schemes are the primary migration path; A phased approach is recommended for transition; Guidance applies to French government and regulated entities
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid post-quantum/classical schemes; Phased approach guidance
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Compliance Officer, Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: hybrid-crypto, migration-program, pqc-governance, compliance-strategy

---

## ANSSI-PQC-FAQ-2025

- **Reference ID**: ANSSI-PQC-FAQ-2025
- **Title**: ANSSI Post-Quantum Cryptography FAQ
- **Authors**: ANSSI
- **Publication Date**: 2025-10-01
- **Last Updated**: 2025-10-01
- **Document Status**: Published
- **Main Topic**: ANSSI FAQ providing guidance on post-quantum cryptography algorithm selection, hybrid approaches, migration timelines, and practical steps for French organizations.
- **PQC Algorithms Covered**: SLH-DSA, XMSS, LMS
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Start inventory immediately; PQC obligations for product qualification from 2027; unreasonable to buy non-PQC products after 2030; guide updates expected by end of 2025.
- **Applicable Regions / Bodies**: Regions: France, European Union; Bodies: ANSSI, Commission européenne
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: PKI/IGC, systèmes embarqués
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: Référentiel général de sécurité, dispositif SAIV, Visas de sécurité ANSSI
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must start a cryptographic inventory immediately to identify critical data and usage cases; Hybridation is essential for short and medium term except for hash-based signatures; It will be unreasonable to purchase products without PQC after 2030; Regulatory obligations for PQC in product qualification begin in 2027.
- **Security Levels & Parameters**: IND-CCA2
- **Hybrid & Transition Approaches**: Hybridation (combining post-quantum and pre-quantum algorithms), CatKDF, CasKDF, crypto-agilité, signature concatenation, non-séparabilité
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Compliance Officer, Developer, Policy Maker
- **Implementation Prerequisites**: Cryptographic inventory; identification of critical data and usage cases; contact suppliers for roadmaps; renewal calendar planning; awareness of side-channel and fault injection attacks in embedded systems.
- **Relevant PQC Today Features**: Timeline, hybrid-crypto, crypto-agility, pki-workshop, iot-ot-pqc, compliance-strategy

---

## EC-Recommendation-2024-1101

- **Reference ID**: EC-Recommendation-2024-1101
- **Title**: European Commission Recommendation on Post-Quantum Cryptography (2024/1101)
- **Authors**: European Commission
- **Publication Date**: 2024-11-26
- **Last Updated**: 2024-11-26
- **Document Status**: Published
- **Main Topic**: European Commission Recommendation 2024/1101 calls on EU member states to implement PQC migration roadmaps and coordinated timelines by 2030.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Milestones: 2030: Implement PQC migration roadmaps and coordinated timelines
- **Applicable Regions / Bodies**: Regions: EU member states; Bodies: European Commission
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: EU member states must implement PQC migration roadmaps by 2030; Coordinated timelines are required for EU digital infrastructure; Interoperability requirements apply to EU procurement; Procurement requirements set for EU digital infrastructure
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline, Compliance, Migrate, pqc-governance, migration-program

---

## G7-Financial-PQC-Roadmap-2026

- **Reference ID**: G7-Financial-PQC-Roadmap-2026
- **Title**: G7 Cyber Expert Group Financial Sector PQC Roadmap
- **Authors**: G7 Cyber Expert Group; US Treasury; G7 Finance Ministers
- **Publication Date**: 2026-01-17
- **Last Updated**: 2026-01-17
- **Document Status**: Published
- **Main Topic**: The G7 Cyber Expert Group released a roadmap advising financial sector stakeholders on transitioning to quantum-resilient technology through coordinated inventory, risk prioritization, and algorithm selection.
- **PQC Algorithms Covered**: ML-KEM; ML-DSA
- **Quantum Threats Addressed**: Breaking widely used cryptographic protocols by sufficiently advanced quantum computers
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: G7 countries; European Union
- **Leaders Contributions Mentioned**: Cory Wilson (U.S. Treasury’s Deputy Assistant Secretary for Cybersecurity and Critical Infrastructure Protection); Duncan Mackinnon (Bank of England’s Executive Director for Supervisory Risk)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Financial entities must consider cryptographic risks associated with quantum computers; Organizations should implement transition activities as appropriate for their unique situation; The roadmap provides flexibility rather than prescriptive mandates; Coordinated action is required to address risks to the safety and soundness of the financial ecosystem
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Policy Maker; Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms; Threats; Migration-program; pqc-governance; Leaders

---

## CA-CFDIR-Quantum-Readiness-2023

- **Reference ID**: CA-CFDIR-Quantum-Readiness-2023
- **Title**: Canada CFDIR Quantum-Readiness Best Practices and Guidelines
- **Authors**: CFDIR; Innovation Science and Economic Development Canada
- **Publication Date**: 2023-06-01
- **Last Updated**: 2023-06-01
- **Document Status**: Published
- **Main Topic**: Canadian Forum for Digital Infrastructure Resilience (CFDIR) best practices and guidelines for quantum-readiness covering algorithm selection, hybrid approaches, and migration planning.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum computers breaking currently deployed public-key cryptography; significantly weakening symmetric key cryptography; risks to personal information, financial systems, utility grids, infrastructure, and national security.
- **Migration Timeline Info**: NIST on-track to publish first set of PQC standards in 2024; transition expected over many years; planning should occur now as changes are still years away.
- **Applicable Regions / Bodies**: Regions: Canada; Bodies: Canadian Forum for Digital Infrastructure Resilience (CFDIR), Quantum-Readiness Working Group (QRWG), Bank of Canada, Government of Canada (GC).
- **Leaders Contributions Mentioned**: Hisham El-Bihbety (CISO – Bank of Canada); Michele Mosca (author of "Cybersecurity in an era with quantum computers").
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Secure Socket Layer (SSL), Transport Layer Security (TLS), Kerberos, sFTP.
- **Infrastructure Layers**: PKI/CAs, Key Management (key transport, key-wrapping, initialization vectors), Digital Signatures, Identity Authentication, Privilege Authorization.
- **Standardization Bodies**: U.S. National Institute of Standards and Technology (NIST).
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must plan an orderly transition to quantum-safe cryptography over the next few years; Hybrid cryptography standards and technology are recommended for migration; Third-party vendors should be assessed using specific PQC roadmap questions; Cryptographic agility is essential for future-proofing systems; Critical Infrastructure owners need to inventory current cryptographic uses immediately.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid cryptography standards and technology; Composite certificates (implied via Annex H title); Crypto-agility exercise notes; Migration of quantum-vulnerable cryptography.
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Compliance Officer, Policy Maker, Operations, Researcher.
- **Implementation Prerequisites**: Cryptographic inventory (discovery and documentation of use cases); Engagement with QSC vendors; Development of quantum-readiness questionnaires for third parties; Understanding of hybrid cryptography standards.
- **Relevant PQC Today Features**: Threats, Migrate, Assess, Hybrid-crypto, Crypto-agility, Vendor-risk, Migration-program, Pqc-risk-management, Compliance-strategy, Pqc-governance

---

## SG-Quantum-Safe-Handbook-2025

- **Reference ID**: SG-Quantum-Safe-Handbook-2025
- **Title**: Singapore Quantum-Safe Handbook (Draft for Public Consultation)
- **Authors**: CSA Singapore; GovTech Singapore; IMDA Singapore
- **Publication Date**: 2025-10-23
- **Last Updated**: 2025-10-23
- **Document Status**: Draft/Consultation
- **Main Topic**: A draft handbook providing a four-pillar framework for Critical Information Infrastructure owners to prepare for quantum-safe migration.
- **PQC Algorithms Covered**: SLH-DSA, XMSS, LMS
- **Quantum Threats Addressed**: Cryptanalytically Relevant Quantum Computer (CRQC), Shor's algorithm, Grover's algorithm, Q-day
- **Migration Timeline Info**: Expert estimates place the horizon for Q-day within the next 5-10 years; migration is a multi-year endeavour executed in phases.
- **Applicable Regions / Bodies**: Regions: Singapore; Bodies: CSA, GovTech, IMDA
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, SSH, IPSEC, S/MIME
- **Infrastructure Layers**: Key establishment, identity management, access control, electronic signatures, ICS, SCADA
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA, ECDH, DSA, DH, ECDSA, AES, SHA-1, SHA-2, SHA-3
- **Key Takeaways**: Organizations should start preparation immediately as Q-day is a matter of when not if; migration requires significant resources and time so rushing implementation may cause first-mover disadvantages; focus on no-regrets actions while monitoring evolving solutions; quantum threats affect confidentiality, integrity, and availability of systems and data.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Compliance Officer, Policy Maker, Critical Information Infrastructure owners
- **Implementation Prerequisites**: Cryptographic asset discovery; risk prioritisation; phased migration planning; post-migration monitoring; multi-year roadmap development
- **Relevant PQC Today Features**: Threats, Migrate, Assess, Algorithms, pqc-governance

---

## CZ-NUKIB-Crypto-Requirements-2023

- **Reference ID**: CZ-NUKIB-Crypto-Requirements-2023
- **Title**: NUKIB Minimum Requirements for Cryptographic Algorithms
- **Authors**: NUKIB; Czech National Cyber and Information Security Agency
- **Publication Date**: 2023-06-01
- **Last Updated**: 2024-06-01
- **Document Status**: Published
- **Main Topic**: Czech National Cyber and Information Security Agency (NÚKIB) minimum requirements for cryptographic algorithms including PQC readiness guidance with a 2027 migration deadline.
- **PQC Algorithms Covered**: ML-KEM-1024, ML-KEM-768, Kyber-1024, Kyber-768, FrodoKEM-1344, FrodoKEM-976, mceliece8192128, mceliece6688128, mceliece460896, mceliece8192128f, mceliece6688128f, mceliece460896f, LMS, XMSS, ML-DSA-87, SLH-DSA, CRYSTALS-Dilithium Level 5, SPHINCS+, Falcon
- **Quantum Threats Addressed**: Quantum vulnerability of classical asymmetric algorithms; quantum threat to symmetric ciphers with key lengths below 256 bits; quantum threat to hash functions with output length below 384 bits
- **Migration Timeline Info**: Valid as of February 1, 2025; 2027 deadline for key establishment migration
- **Applicable Regions / Bodies**: Regions: Czech Republic; Bodies: National Cyber and Information Security Agency (NÚKIB)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS 203, FIPS 204, FIPS 205, Decree No. 82/2018 Coll., Act No. 181/2014 Coll.
- **Classical Algorithms Referenced**: AES, Twofish, Camellia, Serpent, SNOW 2.0, SNOW 3G, ChaCha20, CCM, EAX, OCB1, OCB3, GCM, Poly1305, CTR, OFB, CBC, CBC-CS, CFB, HMAC, CMAC, KMAC, GMAC, EMAC2, UMAC2, XTS, EME2, DSA, EC-DSA, RSA-PSS, EC-Schnorr, DH, ECDH, ECIES-KEM, PSEC-KEM, ACE-KEM, RSA-OAEP, RSA-KEM, SHA-256, SHA-384, SHA-512, SHA-512/256, SHA3-256, SHA3-384, SHA3-512, SHAKE128, SHAKE256, Whirlpool, BLAKE2, Argon2id
- **Key Takeaways**: Organizations must migrate key establishment to quantum-resistant cryptography by 2027; Hybrid approaches combining classical and post-quantum algorithms are recommended for both key establishment and digital signatures; Symmetric ciphers with 128 or 192-bit keys are quantum-vulnerable and require 256-bit keys for resistance; Stand-alone PQC signatures like LMS and XMSS are restricted to firmware and software integrity protection; NIST standardized versions (ML-KEM, ML-DSA, SLH-DSA) are preferred over original algorithm names
- **Security Levels & Parameters**: NIST security levels 3 and 5; ML-KEM-1024; ML-KEM-768; ML-DSA-87; ML-DSA-65; AES key lengths 128, 192, 256 bits; DSA key length 3072 bits or more; EC-DSA key length 256 bits or more; SHA output length at least 256 bits (recommended 384 bits); Argon2id parameters t=1, m=2^21, p=4
- **Hybrid & Transition Approaches**: Hybrid quantum-resistant cryptography for key establishment combining PQC KEM with classical algorithms; Hybrid quantum-resistant cryptography for digital signatures combining PQC signatures with classical signatures; Security of hybrid combination preserved even if one component is broken
- **Performance & Size Considerations**: Key load limit 256 GB for ChaCha20 and ChaCha20+Poly1305; XTS sector length limit 2^20 blocks (approx 16 MB for 128-bit block cipher); Argon2id memory requirement 2 GiB or 64 MiB
- **Target Audience**: Security Architect, Compliance Officer, Developer, Policy Maker
- **Implementation Prerequisites**: Implementation according to NIST standard FIPS 203 for ML-KEM; Implementation according to NIST standard FIPS 204 for ML-DSA; Implementation according to NIST standard FIPS 205 for SLH-DSA; Use of random attacker-unpredictable initialization vector for CBC and CFB modes
- **Relevant PQC Today Features**: Compliance, Migrate, Algorithms, hybrid-crypto, stateful-signatures, code-signing

---

## EU-BSI-PQC-Joint-Statement-2024

- **Reference ID**: EU-BSI-PQC-Joint-Statement-2024
- **Title**: Joint Statement on PQC Migration by 21 EU Member State Cybersecurity Agencies
- **Authors**: BSI; ANSSI; NCSC Netherlands; 21 EU cybersecurity agencies
- **Publication Date**: 2024-11-01
- **Last Updated**: 2024-11-01
- **Document Status**: Published
- **Main Topic**: Joint statement by 21 EU member state cybersecurity agencies urging coordinated PQC migration and endorsing NIST-standardized algorithms.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: European Union; Bodies: BSI, ANSSI, NCSC-NL
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: 21 EU member state agencies urge coordinated PQC migration; Organizations should adopt common migration principles; NIST-standardized algorithms are endorsed for European organizations
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, CISO, Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: migration-program, pqc-governance, compliance-strategy, algorithms, leaders

---

## BSI TR-02102-1

- **Reference ID**: BSI TR-02102-1
- **Title**: Cryptographic Mechanisms: Recommendations and Key Lengths
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-2

- **Reference ID**: BSI TR-02102-2
- **Title**: Cryptographic Mechanisms: Recommendations for TLS
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-3

- **Reference ID**: BSI TR-02102-3
- **Title**: Cryptographic Mechanisms: Recommendations for IPsec
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Position Paper

- **Reference ID**: ANSSI PQC Position Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition
- **Authors**: ANSSI France
- **Publication Date**: 2022-01-01
- **Last Updated**: 2022-01-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Follow-up Paper

- **Reference ID**: ANSSI PQC Follow-up Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition (2023 Follow-up)
- **Authors**: ANSSI France
- **Publication Date**: 2023-12-01
- **Last Updated**: 2023-12-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI-ANSSI-QKD-Position-2024

- **Reference ID**: BSI-ANSSI-QKD-Position-2024
- **Title**: BSI/ANSSI/NLNCSA/SNCSA Joint Position Paper on QKD and Quantum Cryptography
- **Authors**: BSI; ANSSI; NLNCSA Netherlands; SNCSA Sweden
- **Publication Date**: 2024-04-01
- **Last Updated**: 2024-04-01
- **Document Status**: Published
- **Main Topic**: Joint position paper concluding that QKD is insufficient for most government communications and recommending PQC as the primary quantum-safe approach with QKD as a complementary niche solution.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Shor's algorithm; store-now-decrypt-later scenario
- **Migration Timeline Info**: First selection of NIST standards will be available sometime in 2024
- **Applicable Regions / Bodies**: Bodies: French Cybersecurity Agency (ANSSI); Federal Office for Information Security (BSI); Netherlands National Communications Security Agency (NLNCSA); Swedish National Communications Security Authority, Swedish Armed Forces; European Commission
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: QKD protocols; one-time pad scheme
- **Infrastructure Layers**: Public-key infrastructure; trusted nodes; quantum communication networks; EuroQCI project
- **Standardization Bodies**: NIST; ISO
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: AES; symmetric keying; symmetric message authentication
- **Key Takeaways**: QKD is currently only viable for niche use cases due to technological limitations and high costs; migration to post-quantum cryptography and symmetric keying should be the clear priority for quantum-safe key establishment; QKD implementations lack rigorous standardization and comprehensive security proofs compared to PQC; practical QKD systems cannot achieve end-to-end security over long distances without trusted nodes; claims of absolute security for QKD do not apply to actual implementations due to device imperfections
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Use of pre-shared symmetric keys in combination with classically secure public-key cryptography; use of post-quantum signature schemes with an associated public-key infrastructure for QKD authentication
- **Performance & Size Considerations**: Commercial QKD systems typically reach about one hundred kilometres; QKD demonstrations at present can reach at most a few hundred kilometres; QKD channel bandwidth must equal classical data channel bandwidth for one-time pad security
- **Target Audience**: Policy Maker; Security Architect; General audience
- **Implementation Prerequisites**: Specialised hardware such as single-photon sources and detectors; pre-shared secret keys for authentication; quantum repeaters (not practical at present); satellite infrastructure
- **Relevant PQC Today Features**: qkd, threats, migration-program, pqc-risk-management, compliance-strategy

---

## CA-TBS-SPIN-PQC-2025

- **Reference ID**: CA-TBS-SPIN-PQC-2025
- **Title**: Canada TBS SPIN 2025-01 — Migrating Government of Canada Systems to Post-Quantum Cryptography
- **Authors**: Treasury Board of Canada Secretariat; Government of Canada
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Published
- **Main Topic**: Treasury Board of Canada Secretariat Security Policy Implementation Notice 2025-01 mandates a three-phase migration plan for Government of Canada systems to post-quantum cryptography by 2035.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: cryptographically relevant quantum computer (CRQC); harvest now, decrypt later (HNDL) threat
- **Migration Timeline Info**: Phase 1 Preparation by April 1, 2026; Phase 2 Identification updates by April 1, 2027 and 2028; Phase 3 Transition begins April 1, 2028; High-priority systems complete by end of 2031; Remaining systems complete by end of 2035
- **Applicable Regions / Bodies**: Regions: Canada; Bodies: Treasury Board of Canada Secretariat (TBS), Canadian Centre for Cyber Security (Cyber Centre), Shared Services Canada (SSC)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: IT supply chain; cryptographic modules; network services; operating systems; applications; code development pipelines; physical information technology (IT) assets
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Policy on Government Security; Policy on Service and Digital; Directive on Security Management; Cryptographic Module Validation Program (CMVP); ITSP.40.111; ITSM.40.001; Framework for the Management of Compliance
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Departments must develop high-level PQC migration plans by April 1, 2026; All contracts with digital components entered after April 1, 2026 must include PQC procurement clauses; High-priority systems susceptible to harvest now, decrypt later threats must be identified and migrated first; Complete migration of all remaining systems is required by the end of 2035
- **Security Levels & Parameters**: Protected B information; Protected C information; Protected A information; Unclassified information
- **Hybrid & Transition Approaches**: cryptographic agility; three-phase migration plan (Preparation, Identification, Transition); upgrades versus replacement strategies
- **Performance & Size Considerations**: None detected
- **Target Audience**: Chief Information Officer (CIO), Chief Security Officer (CSO), Designated Official for Cyber Security (DOCS), Designated Official for Procurement, Deputy Heads, Compliance Officers
- **Implementation Prerequisites**: Cryptographic inventory of systems; updates to contract clauses for PQC procurement; identification of system architecture and cryptographic details; engagement with Shared Services Canada (SSC) client executive; CMVP certified cryptographic modules
- **Relevant PQC Today Features**: Timeline, Threats, Compliance, Migrate, Assess, crypto-agility, migration-program, pqc-governance, vendor-risk

---

## IN-CERTIN-QBOM-Guidelines-2025

- **Reference ID**: IN-CERTIN-QBOM-Guidelines-2025
- **Title**: India CERT-In Technical Guidelines on SBOM, QBOM, CBOM, AIBOM, and HBOM v2.0
- **Authors**: CERT-In; Indian Computer Emergency Response Team
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Published
- **Main Topic**: Technical guidelines issued by CERT-In defining minimum elements and best practices for Software, Quantum, Cryptographic, AI, and Hardware Bills of Materials to enhance supply chain security and quantum readiness.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: India; Bodies: Indian Computer Emergency Response Team (CERT-In), Ministry of Electronics and Information Technology, Government of India
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must make SBOM creation a mandatory standard practice in software procurement and development; Entities should implement QBOM and CBOM to assess quantum-readiness and maintain cryptographic inventory; Security teams must integrate SBOM inventory into vulnerability management workflows; Government, Public Sector, and Essential Services organizations are required to include SBOM requirements in all software purchases.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Developer, Compliance Officer, Operations
- **Implementation Prerequisites**: Software Composition Analysis (SCA) tools; Cryptographic inventory; Quantum-readiness assessment; SBOM ecosystem development at organizational level
- **Relevant PQC Today Features**: Assess, Compliance, Migrate, vendor-risk, pqc-governance

---

## US-CISA-ACDI-Strategy-2024

- **Reference ID**: US-CISA-ACDI-Strategy-2024
- **Title**: CISA Strategy for Migrating to Automated PQC Discovery and Inventory Tools
- **Authors**: CISA; Cybersecurity and Infrastructure Security Agency
- **Publication Date**: 2024-09-01
- **Last Updated**: 2024-09-01
- **Document Status**: Published
- **Main Topic**: CISA strategy outlining the approach for Federal Civilian Executive Branch agencies to adopt automated cryptography discovery and inventory tools for assessing Post-Quantum Cryptography migration progress.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: cryptanalytically-relevant quantum computer (CRQC)
- **Migration Timeline Info**: Data expected to remain mission-sensitive in 2035; annual submission of inventory required
- **Applicable Regions / Bodies**: United States; Federal Civilian Executive Branch (FCEB); Cybersecurity and Infrastructure Security Agency (CISA); Office of Management and Budget (OMB); Office of the National Cyber Director (ONCD); National Institute of Standards and Technology (NIST); National Security Agency
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Public Key Infrastructure; cloud-based information systems; on-premises information systems; database systems; file systems
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: Federal Information Security Modernization Act of 2014 (FISMA); Federal Information Processing Standard 199 (FIPS 199); Memorandum 2302 (M-23-02); National Security Memorandum 10
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Agencies must inventory active cryptographic systems using automated tools where possible and manual means for embedded or custom software; Three specific data items (algorithm, service provided, key length) can be collected via ACDI or CDM tools while six other items require manual collection; Integration of ACDI tools with the Continuous Diagnostics and Mitigation (CDM) Program aims to reduce resource requirements for inventory generation; Vendors may simplify inventory processes by advertising product roadmaps for PQC-hybrid or PQC-only modes; The strategy applies to high impact systems, High Value Assets, and systems containing data sensitive in 2035.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: PQC-hybrid mode; PQC-only mode
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Compliance Officer; Operations; Policy Maker
- **Implementation Prerequisites**: Automated Cryptography Discovery and Inventory (ACDI) tools; Continuous Diagnostics and Mitigation (CDM) Program integration; CyberScope for reporting; Manual tracking for embedded cryptography or customized applications
- **Relevant PQC Today Features**: Assess; Migrate; Compliance; Threats; Migration-program

---

## US-CISA-PQC-OT-2024

- **Reference ID**: US-CISA-PQC-OT-2024
- **Title**: CISA Post-Quantum Considerations for Operational Technology
- **Authors**: CISA; Cybersecurity and Infrastructure Security Agency
- **Publication Date**: 2024-10-01
- **Last Updated**: 2024-10-01
- **Document Status**: Published
- **Main Topic**: CISA guidance on post-quantum cryptography considerations and migration challenges specific to operational technology (OT) environments including ICS and SCADA systems.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Cryptanalytically relevant quantum computer (CRQC); threats to data confidentiality and integrity; unauthorized remote access; machine-in-the-middle attacks; persistent malware installations via Secure Boot exploitation; decryption of sensitive information.
- **Migration Timeline Info**: Transition is a complex, multi-year process; planning steps can begin immediately; post-quantum algorithms available from NIST in 2024 are expected to be resilient against CRQCs.
- **Applicable Regions / Bodies**: United States; Cybersecurity and Infrastructure Security Agency (CISA); Department of Homeland Security (DHS).
- **Leaders Contributions Mentioned**: Alejandro N. Mayorkas (Secretary of Homeland Security, March 2021 vision for cybersecurity resilience).
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Open Platform Communications United Architecture (OPC UA); Modbus Transmission Control Protocol (TCP); Virtual Private Network (VPN).
- **Infrastructure Layers**: Public-key cryptography; Secure Boot; BIOS; boot loader; kernel; identity and access management mechanisms.
- **Standardization Bodies**: National Institute for Standards and Technology (NIST).
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: OT owners and operators must plan for emerging CRQC capabilities now rather than waiting; minimize OT exposure to quantum threats via strong network segmentation; ensure crypto-agility in applications and protocols; apply quantum mitigation considerations to platform update schedules and upgrade lifecycles.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Crypto-agility in applications and protocols; minimizing OT exposure via strong network segmentation.
- **Performance & Size Considerations**: None detected
- **Target Audience**: U.S. critical infrastructure owners and operators; OT vendors and manufacturers; Security Architect; Compliance Officer.
- **Implementation Prerequisites**: Identifying personnel and resources; inventorying systems; addressing long software patching cycles; managing hardware replacement times; adhering to strict procedures and governance.
- **Relevant PQC Today Features**: iot-ot-pqc; pqc-risk-management; migration-program; crypto-agility; vendor-risk

---

## UK-CMORG-PQC-Guidance-2025

- **Reference ID**: UK-CMORG-PQC-Guidance-2025
- **Title**: CMORG Guidance for Post-Quantum Cryptography (UK Financial Sector)
- **Authors**: CMORG; Bank of England; UK Financial Authorities
- **Publication Date**: 2025-04-01
- **Last Updated**: 2025-04-01
- **Document Status**: Published
- **Main Topic**: CMORG guidance for UK financial sector institutions on managing quantum computing risks through cryptographic inventory, risk assessment, and migration to post-quantum algorithms.
- **PQC Algorithms Covered**: ML-KEM; ML-DSA; SLH-DSA
- **Quantum Threats Addressed**: Cryptographically Relevant Quantum Computer (CRQC); Store now and decrypt later; Shor's algorithm; Grover's algorithm
- **Migration Timeline Info**: NIST finalised first set of PQC algorithms in August 2024; Experts estimate CRQC availability within the next decade; Migration effort requires starting immediately due to 7-10 year preparation window
- **Applicable Regions / Bodies**: United Kingdom (NCSC); France (ANSSI); Germany (BSI); European Union (eighteen member states); United States (CISA, NCCoE)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Cryptographic inventory; Crypto-agile systems; Third-party vendor solutions
- **Standardization Bodies**: National Institute of Standards and Technology (NIST); National Cyber Security Centre (NCSC); ETSI; ANSSI; BSI; CISA
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; Elliptic curve cryptography (ECC); Advanced Encryption Standard (AES)
- **Key Takeaways**: Financial institutions must establish comprehensive cryptographic inventories covering data-in-transit, at-rest, and in-use; Organizations should prioritize systems protecting long-lived sensitive data due to store now decrypt later risks; Vendor readiness assessment is critical given reliance on third-party solutions; Institutions should adopt hybrid cryptographic solutions combining classical and PQC algorithms for smoother transition
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid cryptographic solutions; Crypto-agile systems; Phased approach for integrating PQC
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Compliance Officer; Policy Maker
- **Implementation Prerequisites**: Comprehensive cryptographic inventory; Risk assessment framework; Vendor readiness assessment; Crypto-agile system capability
- **Relevant PQC Today Features**: Threats; Migrate; Assess; Algorithms; Hybrid-crypto; Crypto-agility; Vendor-risk; Migration-program; Pqc-risk-management

---

## ENISA-PQC-Integration-Study-2022

- **Reference ID**: ENISA-PQC-Integration-Study-2022
- **Title**: ENISA Post-Quantum Cryptography Integration Study
- **Authors**: ENISA; European Union Agency for Cybersecurity
- **Publication Date**: 2022-07-01
- **Last Updated**: 2022-07-01
- **Document Status**: Published
- **Main Topic**: ENISA study analyzing post-standardisation challenges and providing recommendations for integrating post-quantum cryptography into existing protocols like TLS, PKI, and code signing for European organizations.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Europe; Bodies: ENISA, European Union Agency for Cybersecurity
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: PKI
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must design new cryptographic protocols to integrate post-quantum systems; European organizations need guidance on algorithm selection and migration priorities; Integration challenges exist specifically for TLS, PKI, and code signing; Stakeholder awareness and risk analysis are necessary in evolving threat landscapes.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Policy Maker, Compliance Officer, Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: tls-basics, pki-workshop, code-signing, migration-program, pqc-risk-management

---

## Europol-QSFF-Call-to-Action-2025

- **Reference ID**: Europol-QSFF-Call-to-Action-2025
- **Title**: Europol Quantum Safe Financial Forum — Call to Action
- **Authors**: Europol; Quantum Safe Financial Forum
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Published
- **Main Topic**: Europol calls on European financial institutions to begin immediate PQC migration planning to address harvest-now-decrypt-later threats.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest Now Decrypt Later
- **Migration Timeline Info**: Immediate PQC migration planning recommended
- **Applicable Regions / Bodies**: Regions: Europe; Bodies: Europol
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: European financial institutions must begin immediate PQC migration planning; Harvest-now-decrypt-later poses a threat to financial data; A coordinated sector response is recommended
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, Migrate, pqc-risk-management, migration-program

---

## IL-INCD-Cybersecurity-Strategy-2025

- **Reference ID**: IL-INCD-Cybersecurity-Strategy-2025
- **Title**: Israel National Cybersecurity Strategy 2025-2028
- **Authors**: INCD; Israel National Cyber Directorate
- **Publication Date**: 2025-02-01
- **Last Updated**: 2025-02-01
- **Document Status**: Published
- **Main Topic**: Israel's National Cybersecurity Strategy 2025-2028 outlines a comprehensive approach to securing critical infrastructure, enhancing public awareness, and developing future capabilities in response to evolving cyber threats.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Israel; Bodies: National Cyber Directorate (INCD)
- **Leaders Contributions Mentioned**: Gabi Portnoy, Head of the National Cyber Directorate
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Israel must establish a national program for secure digital identification; Critical infrastructure protection requires zero significant damage mandates; Public awareness and education are essential to counter phishing and malign foreign influence; National defense efforts require joint management across government, security agencies, and the private sector; Investment in high-quality technological and human capabilities is necessary to contend with future challenges.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Security Architect, CISO, Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: digital-id, migration-program, pqc-governance, vendor-risk, compliance-strategy

---

## UK-DSIT-CNI-PQC-Perspectives-2025

- **Reference ID**: UK-DSIT-CNI-PQC-Perspectives-2025
- **Title**: UK DSIT — Perspectives on the Plan for PQC Transition from CNI Sectors
- **Authors**: DSIT; UK Department for Science Innovation and Technology
- **Publication Date**: 2025-07-01
- **Last Updated**: 2025-07-01
- **Document Status**: Published
- **Main Topic**: UK DSIT report exploring how critical national infrastructure sectors in the UK are engaging with the need to migrate cyber security schemes to post-quantum cryptography.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum computers breaking encryption schemes commonly used for cyber security; compromising privacy and security of digital communications
- **Migration Timeline Info**: Within the next decade, quantum computers could be able to break encryption schemes; National Cyber Security Centre has published timelines for migration
- **Applicable Regions / Bodies**: Regions: United Kingdom; Bodies: Department for Science, Innovation and Technology, National Cyber Security Centre
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Quantum hardware and algorithm development are advancing faster than initially predicted; UK critical national infrastructure sectors face sector-specific challenges in PQC transition; Government and commercial organizations are investing significantly in cryptographically-relevant quantum computers; Organizations must carry out activities to migrate safely to post-quantum cryptography in the coming years
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, CISO, Security Architect, Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, Migrate, Assess, pqc-governance, migration-program

---

## BSI TR-02102-1

- **Reference ID**: BSI TR-02102-1
- **Title**: Cryptographic Mechanisms: Recommendations and Key Lengths
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-2

- **Reference ID**: BSI TR-02102-2
- **Title**: Cryptographic Mechanisms: Recommendations for TLS
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-3

- **Reference ID**: BSI TR-02102-3
- **Title**: Cryptographic Mechanisms: Recommendations for IPsec
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Position Paper

- **Reference ID**: ANSSI PQC Position Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition
- **Authors**: ANSSI France
- **Publication Date**: 2022-01-01
- **Last Updated**: 2022-01-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Follow-up Paper

- **Reference ID**: ANSSI PQC Follow-up Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition (2023 Follow-up)
- **Authors**: ANSSI France
- **Publication Date**: 2023-12-01
- **Last Updated**: 2023-12-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## US-QCCPA-2022

- **Reference ID**: US-QCCPA-2022
- **Title**: Quantum Computing Cybersecurity Preparedness Act (Public Law 117-260)
- **Authors**: US Congress; Office of Management and Budget
- **Publication Date**: 2022-12-21
- **Last Updated**: 2022-12-21
- **Document Status**: Enacted
- **Main Topic**: US federal law requiring federal agencies to inventory and migrate cryptographic systems to quantum-resistant standards while directing NIST and OMB to develop migration guidelines.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Adversaries stealing sensitive encrypted data today using classical computers to wait until sufficiently powerful quantum systems are available to decrypt it; integer factorization vulnerability
- **Migration Timeline Info**: Inventory guidance within 180 days of enactment; agency reports within 1 year of enactment; migration plan development within 1 year after NIST issues PQC standards; annual reporting for 5 years after PQC standards issuance
- **Applicable Regions / Bodies**: United States; Office of Management and Budget (OMB); National Institute of Standards and Technology (NIST); Cybersecurity and Infrastructure Security Agency (CISA); National Cyber Director; Federal Government agencies
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Information technology systems; national security systems
- **Standardization Bodies**: National Institute of Standards and Technology (NIST); International Organization for Standardization
- **Compliance Frameworks Referenced**: Federal Information Processing Standards (FIPS) under chapter 35 of title 44, United States Code
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Federal agencies must establish and maintain an inventory of IT vulnerable to quantum decryption within 180 days; OMB must issue migration guidance prioritizing IT for post-quantum cryptography; Agencies must develop migration plans within one year of NIST issuing PQC standards; Annual reporting on PQC adoption progress is required for five years after standard issuance; National security systems are exempt from this Act
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Cryptographic agility to support easily updated applications, hardware intellectual property, and software
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Compliance Officer, Security Architect, Operations
- **Implementation Prerequisites**: Current inventory of information technology vulnerable to quantum decryption; prioritization criteria for migration; automated process for evaluating migration progress
- **Relevant PQC Today Features**: Timeline, Threats, Compliance, Migrate, Assess, crypto-agility, pqc-governance, migration-program

---

## GSMA-PQ03-v2-2024

- **Reference ID**: GSMA-PQ03-v2-2024
- **Title**: GSMA PQ.03 Post-Quantum Cryptography Guidelines for Telecom Use Cases v2.0
- **Authors**: GSMA
- **Publication Date**: 2024-11-01
- **Last Updated**: 2024-11-01
- **Document Status**: Published
- **Main Topic**: GSMA PQ.03 v2.0 provides updated Post-Quantum Cryptography guidelines for telecom use cases including 5G, SIM/eSIM, roaming, and IMS.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, IPSec, IKE, X.509
- **Infrastructure Layers**: PKI, Public Key Infrastructure, Cloud Infrastructure, Firmware, Constrained Devices
- **Standardization Bodies**: IETF, GSM Association
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Mobile network operators must conduct cryptographic discovery and analysis before remediation; Hybrid schemes are recommended for migration to ensure interoperability; Migration planning requires prioritization based on business risk analysis; Zero Trust Architecture considerations are essential in the context of PQC; Legacy systems and constrained devices present specific implementation challenges.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid Schemes, Hybrid X.509 overview, Mixing Algorithms, Crypto-Agility
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, CISO, Compliance Officer, Operations, Policy Maker
- **Implementation Prerequisites**: Cryptographic Inventory; Firmware Validation; Middleware Compatibility; Infrastructure Capacity assessment; Vendor Migration Strategy alignment
- **Relevant PQC Today Features**: 5g-security, migration-program, pqc-governance, hybrid-crypto, crypto-agility

---

## GSMA-PQC-Country-Survey-2025

- **Reference ID**: GSMA-PQC-Country-Survey-2025
- **Title**: GSMA Post-Quantum Government Initiatives by Country and Region (March 2025)
- **Authors**: GSMA
- **Publication Date**: 2025-03-02
- **Last Updated**: 2025-03-02
- **Document Status**: Published
- **Main Topic**: Summary of post-quantum cryptography government initiatives, algorithms under consideration, and migration timelines across 30+ countries as of March 2025.
- **PQC Algorithms Covered**: ML-KEM, Classic McEliece, FrodoKEM, AIMer, HAETAE, SMAUG-T, NTRU+
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Australia: Complete transition by 2030; Canada: Introduce standards-based PQC from 2025-26; Czech Republic: Migrate by 2027; France: Transition from 2024; New Zealand: Transition from 2026-27; South Korea: Pilot transition plan 2025-2028, completion 2035; Spain: Four phase approach today to post-2030; United States: Implement 2023-2033
- **Applicable Regions / Bodies**: Australia, Canada, China, Czech Republic, European Union, France, Germany, Israel, Italy, Japan, Netherlands, New Zealand, Singapore, South Korea, Spain, United Kingdom, United States
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST, CRYPTREC, CAICT, NICCS, NÚKIB, ENISA, European Commission, ANSSI, BSI, NCSC, ACN, MAS, MSIT, CCN.ES, AIVD, TNO, CWI, NZISM
- **Compliance Frameworks Referenced**: CNSA20, HR7375, EO-14144, NSM-10
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Governments are setting specific transition deadlines ranging from 2024 to 2035; Most countries are monitoring or adopting NIST standards while some like South Korea and China have domestic algorithm selections; Financial services sectors face specific requirements for quantum risk management and inventory planning; Hybrid mode deployment is recommended by the Netherlands for TLS; Ongoing monitoring is required due to rapidly evolving government guidance.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: hybrid mode for TLS
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer
- **Implementation Prerequisites**: cryptographic inventory; initial plan; standards-based PQC adoption; pilot transition plan
- **Relevant PQC Today Features**: Timeline, Algorithms, Compliance, Migrate, Assess

---

## SG-MAS-Quantum-Advisory-2024

- **Reference ID**: SG-MAS-Quantum-Advisory-2024
- **Title**: MAS Advisory on Addressing Cybersecurity Risks Associated with Quantum Computing
- **Authors**: MAS; Monetary Authority of Singapore
- **Publication Date**: 2024-02-20
- **Last Updated**: 2024-02-20
- **Document Status**: Published
- **Main Topic**: Monetary Authority of Singapore advisory requiring financial institutions to develop quantum risk management programs and conduct cryptographic inventory assessments.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Singapore; Bodies: Monetary Authority of Singapore
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Financial institutions must develop quantum risk management programs; Cryptographic inventory assessments are mandated; PQC planning timelines are established for the financial sector
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer, CISO, Security Architect
- **Implementation Prerequisites**: Develop quantum risk management programs; Conduct cryptographic inventory assessments
- **Relevant PQC Today Features**: pqc-risk-management, compliance-strategy, migration-program, assess

---

## SG-MAS-QKD-Sandbox-Report-2025

- **Reference ID**: SG-MAS-QKD-Sandbox-Report-2025
- **Title**: MAS QKD Proof-of-Concept Sandbox Technical Report
- **Authors**: MAS; DBS; HSBC; OCBC; UOB; Singtel; SPTel
- **Publication Date**: 2025-09-29
- **Last Updated**: 2025-09-29
- **Document Status**: Published
- **Main Topic**: Technical report on a QKD proof-of-concept sandbox involving MAS and industry partners demonstrating quantum-safe key distribution feasibility in financial settlement systems.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Sept 2024-March 2025
- **Applicable Regions / Bodies**: Monetary Authority of Singapore; DBS; HSBC; OCBC; UOB
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: AES-256
- **Key Takeaways**: QKD proof-of-concept demonstrates feasibility for financial settlement systems; Sandbox generated 6.75M AES-256 keys per day per bank; Collaboration between MAS and major banks validates quantum-safe key distribution
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: 6.75M AES-256 keys/day per bank
- **Target Audience**: Security Architect; CISO; Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: qkd; migration-program; pqc-business-case

---

## NATO-Quantum-Strategy-2024

- **Reference ID**: NATO-Quantum-Strategy-2024
- **Title**: NATO Quantum Technologies Strategy
- **Authors**: NATO; North Atlantic Treaty Organization
- **Publication Date**: 2024-06-01
- **Last Updated**: 2024-06-01
- **Document Status**: Published
- **Main Topic**: NATO's first Quantum Technologies Strategy establishes quantum-safe cryptography as a priority for Alliance cybersecurity and commits member nations to post-quantum migration of classified communications and critical military systems.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Malicious use of quantum technologies
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: NATO, North Atlantic Council (NAC), Supreme Allied Commander Europe (SACEUR), Defence Innovation Accelerator for the North Atlantic (DIANA); Regions: Transatlantic
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: NATO has approved its first quantum strategy to ensure the Alliance is quantum-ready; The strategy prioritizes quantum-resistant cryptography for securing data communications and classified systems; Six companies in the DIANA programme are developing innovations in next-generation cryptography; Quantum technologies are being applied to sensing, imaging, and precise positioning for defence; The strategy aims to foster a transatlantic quantum technologies ecosystem while defending against malicious use.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Security Architect, Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, Migrate, Leaders, pqc-governance, migration-program

---

## UK-NCSC-PQC-Whitepaper-2024

- **Reference ID**: UK-NCSC-PQC-Whitepaper-2024
- **Title**: NCSC White Paper — Next Steps in Preparing for Post-Quantum Cryptography
- **Authors**: NCSC UK; UK National Cyber Security Centre
- **Publication Date**: 2024-11-01
- **Last Updated**: 2024-11-01
- **Document Status**: Published
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## UK-NCSC-Migration-Timelines-2025

- **Reference ID**: UK-NCSC-Migration-Timelines-2025
- **Title**: NCSC PQC Migration Timelines Guidance
- **Authors**: NCSC UK; UK National Cyber Security Centre
- **Publication Date**: 2025-05-01
- **Last Updated**: 2025-05-01
- **Document Status**: Published
- **Main Topic**: UK NCSC guidance outlining a three-phase PQC migration timeline with sector-specific advice for government and CNI.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Phase 1 by 2028 for discovery and planning; Phase 2 from 2028 to 2031 for active migration of priority systems; Phase 3 by 2035 for complete PQC migration.
- **Applicable Regions / Bodies**: Regions: United Kingdom; Bodies: NCSC
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must complete discovery and planning by 2028; Priority systems require active migration between 2028 and 2031; Full PQC migration must be achieved by 2035; Guidance includes specific timelines for UK government and CNI sectors.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline, Migrate, Assess, migration-program, pqc-governance

---

## US-NSA-CNSA-2.0-2022

- **Reference ID**: US-NSA-CNSA-2.0-2022
- **Title**: NSA Commercial National Security Algorithm Suite 2.0 (CNSA 2.0)
- **Authors**: NSA; National Security Agency
- **Publication Date**: 2022-09-07
- **Last Updated**: 2022-09-07
- **Document Status**: Published
- **Main Topic**: NSA releases CNSA 2.0 specifying quantum-resistant algorithm requirements and transition deadlines for US National Security Systems.
- **PQC Algorithms Covered**: ML-KEM-1024, ML-DSA-87, LMS, XMSS, SLH-DSA
- **Quantum Threats Addressed**: cryptanalytically-relevant quantum computer (CRQC)
- **Migration Timeline Info**: 2030-2033 transition deadlines for US national security systems
- **Applicable Regions / Bodies**: United States; National Security Agency (NSA); National Security Systems (NSS)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Commercial National Security Algorithm Suite 2.0 (CNSA 2.0)
- **Classical Algorithms Referenced**: public-key systems; asymmetric cryptography
- **Key Takeaways**: Organizations must plan, prepare and budget for transition to QR algorithms; CRQC poses a threat to current public-key systems; Transition deadlines are set between 2030 and 2033 for NSS; CNSA 2.0 mandates specific quantum-resistant algorithms for different use cases
- **Security Levels & Parameters**: ML-KEM-1024, ML-DSA-87
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Compliance Officer; Operations
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Threats; Compliance; Algorithms; Migration

---

## IN-TEC-PQC-Migration-Report-2025

- **Reference ID**: IN-TEC-PQC-Migration-Report-2025
- **Title**: India TEC Technical Report on Migration to Post-Quantum Cryptography
- **Authors**: TEC India; Telecommunications Engineering Centre; Department of Telecommunications
- **Publication Date**: 2025-03-28
- **Last Updated**: 2025-03-28
- **Document Status**: Published
- **Main Topic**: Technical report by India's Telecommunication Engineering Centre on migrating to post-quantum cryptography, covering algorithm selection, hybrid approaches, and implementation guidance for telecom operators.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA
- **Quantum Threats Addressed**: Cryptographically relevant quantum computers; Shor's Algorithm; Grover's Algorithm; Man-in-the-Middle Attacks; Individual Attacks; Threat to Digital Signatures; Data Breaches; Document Integrity compromise
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: India; Telecommunication Engineering Centre (TEC); Department of Telecommunications; Ministry of Communications; Government of India
- **Leaders Contributions Mentioned**: Ms. Tripti Saxena (Sr DDG & Head, TEC, DoT); Sh. Kamal Kr Agarwal (DDG (QT), TEC, DoT); Dr. Goutam Paul (ISI Kolkata); Dr. Swagata Mandal (Jalpaiguri Government Engineering College); Dr. Sucheta Chakrabarti (Former Scientist-G, SAG, DRDO); Dr. Angshuman Karmakar (IIT Kanpur); Sh. Vinayaka Pandit (IBM); Sh. Bhupendra Singh (CAIR, DRDO); Sh. B. Srinivas Goud (NCIIPC); Dr. Shravani Shahapure (M/s Deloitte); Sh. Rakesh Singh Rawat (C-DoT); Dr. Roopika Chaudhary (DIT & CS, DRDO); Dr. Mahavir Jhawar (Ashoka University); Sh. Venkata Rama Raju Chelle (Director (QT), TEC, DoT); Sh. Rakesh Goyal (ADG, TEC)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Application Cryptography; Infrastructure Cryptography; Digital Signatures; Encryption; Key Management (implied via crypto-agility and trust management)
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: ISO 9001:2015
- **Classical Algorithms Referenced**: RSA, ECDSA, ECDH
- **Key Takeaways**: Organizations must identify critical digital infrastructure including data and applications before quantum computers are deployed; Immediate transition to quantum-safe cryptography is required as current standards like RSA and ECDSA will be broken; Hybrid solutions should be used to mitigate short-term risks during migration; Crypto-agility is essential for achieving a smooth transition to post-quantum cryptographic protocols
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid Solution approach; Trust management during migration; Isolation approaches during migration; Mitigate Short-Term Risks with Hybrid Solutions; Crypto-agility
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Policy Maker, Operations, Compliance Officer
- **Implementation Prerequisites**: Conduct a Risk Assessment; Define Post Quantum Requirements; Evaluate the Vendor's Roadmap; Request Proof of Concept (PoC) or Pilots; Test and Validate the Implementation
- **Relevant PQC Today Features**: Threats, Migrate, Assess, Algorithms, Hybrid-crypto, Crypto-agility, Migration-program, Pqc-risk-management, Vendor-risk

---

## BSI TR-02102-1

- **Reference ID**: BSI TR-02102-1
- **Title**: Cryptographic Mechanisms: Recommendations and Key Lengths
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-2

- **Reference ID**: BSI TR-02102-2
- **Title**: Cryptographic Mechanisms: Recommendations for TLS
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BSI TR-02102-3

- **Reference ID**: BSI TR-02102-3
- **Title**: Cryptographic Mechanisms: Recommendations for IPsec
- **Authors**: BSI Germany
- **Publication Date**: 2025-01-31
- **Last Updated**: 2026-01-31
- **Document Status**: Technical Guideline
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Position Paper

- **Reference ID**: ANSSI PQC Position Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition
- **Authors**: ANSSI France
- **Publication Date**: 2022-01-01
- **Last Updated**: 2022-01-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## ANSSI PQC Follow-up Paper

- **Reference ID**: ANSSI PQC Follow-up Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition (2023 Follow-up)
- **Authors**: ANSSI France
- **Publication Date**: 2023-12-01
- **Last Updated**: 2023-12-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## UK-NCSC-PQC-Whitepaper-2024

- **Reference ID**: UK-NCSC-PQC-Whitepaper-2024
- **Title**: NCSC White Paper — Next Steps in Preparing for Post-Quantum Cryptography
- **Authors**: NCSC UK; UK National Cyber Security Centre
- **Publication Date**: 2024-11-01
- **Last Updated**: 2024-11-01
- **Document Status**: Published
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## BIS-OTHP107

- **Reference ID**: BIS-OTHP107
- **Title**: Project Leap Phase 2 — Quantum-proofing payment systems
- **Authors**: BIS Innovation Hub; Bank of Italy; Bank of France; Deutsche Bundesbank; Nexi-Colt; Swift
- **Publication Date**: 2025-12-01
- **Last Updated**: 2025-12-01
- **Document Status**: Published
- **Main Topic**: Project Leap Phase 2 tests CRYSTALS-Dilithium post-quantum digital signatures in the Eurosystem T2 payment system to demonstrate feasibility and identify migration challenges.
- **PQC Algorithms Covered**: CRYSTALS-Dilithium
- **Quantum Threats Addressed**: Shor's algorithm; Grover's algorithm; harvest now, decrypt later scenario
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Eurosystem; United States; United Kingdom; Japan; BIS Innovation Hub Eurosystem Centre; Bank of Italy; Bank of France; Deutsche Bundesbank; Nexi-Colt; Swift
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS; ISO 20022; DEP
- **Infrastructure Layers**: HSM; RTGS; ESMIG; CRDM; NSP
- **Standardization Bodies**: IETF; NIST; ISO
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; ECC; AES; SHA-2
- **Key Takeaways**: Implementing quantum-safe cryptography in financial systems is feasible but requires further testing due to performance differences; Payment systems are vulnerable to harvest now, decrypt later attacks requiring immediate migration; Hybrid encryption schemes can achieve quantum-resistant confidentiality while maintaining interoperability; Performance benchmarks show PQC signatures are significantly slower than traditional algorithms; Central banks and private partners must proactively safeguard financial infrastructure integrity against emerging quantum threats
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: hybrid encryption scheme; hybrid cryptography migration
- **Performance & Size Considerations**: PQC ~7.4× slower than RSA
- **Target Audience**: Security Architect, Policy Maker, CISO, Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, Migrate, Algorithms, hybrid-crypto, pqc-risk-management

---

## RFC 4251

- **Reference ID**: RFC 4251
- **Title**: The Secure Shell (SSH) Protocol Architecture
- **Authors**: Tatu Ylonen; Chris M. Lonvick (Ed.)
- **Publication Date**: 2006-01-01
- **Last Updated**: 2006-01-01
- **Document Status**: Proposed Standard
- **Main Topic**: Defines the architectural framework of the Secure Shell (SSH) protocol covering transport layer, user authentication, and connection multiplexing.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Tatu Ylonen; Tero Kivinen; Timo J. Rinne; Sami Lehtinen; Markku-Juhani O. Saarinen; Darren Moffat; Mats Andersson; Ben Harris; Bill Sommerfeld; Brent McClure; Niels Moller; Damien Miller; Derek Fawcus; Frank Cusack; Heikki Nousiainen; Jakob Schlyter; Jeff Van Dyke; Jeffrey Altman; Jeffrey Hutzelman; Jon Bright; Joseph Galbraith; Ken Hornstein; Markus Friedl; Martin Forssen; Nicolas Williams; Niels Provos; Perry Metzger; Peter Gutmann; Simon Josefsson; Simon Tatham; Wei Dai; Denis Bider; der Mouse; Tadayoshi Kohno
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: SSH; TCP/IP; X11; telnet; rlogin
- **Infrastructure Layers**: Host Keys; Certification Authority (CA); Key Exchange
- **Standardization Bodies**: IETF; Internet Society
- **Compliance Frameworks Referenced**: FIPS-186-2; FIPS-180-2; RFC2119; RFC2434; STD 1
- **Classical Algorithms Referenced**: DSS; SHA-1
- **Key Takeaways**: SSH architecture consists of three major components: Transport Layer, User Authentication Protocol, and Connection Protocol; Host key verification can use local databases or trusted certification authorities to prevent man-in-the-middle attacks; Implementations should support a minimal set of algorithms for interoperability while allowing local extensions via DNS-based namespaces; The protocol allows full negotiation of encryption, integrity, and compression algorithms separately for each direction; Ease of use is critical for security adoption, balancing the risk of unchecked host keys during transition periods.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Network Engineer; Policy Maker
- **Implementation Prerequisites**: Support for mandatory public key algorithms including DSS; Configuration mechanisms to define preferred encryption, integrity, and compression algorithms; Local database or CA infrastructure for host key verification
- **Relevant PQC Today Features**: vpn-ssh-pqc, crypto-agility, tls-basics, pki-workshop

---

## RFC 4253

- **Reference ID**: RFC 4253
- **Title**: The Secure Shell (SSH) Transport Layer Protocol
- **Authors**: Tatu Ylonen; Chris M. Lonvick (Ed.)
- **Publication Date**: 2006-01-01
- **Last Updated**: 2006-01-01
- **Document Status**: Proposed Standard
- **Main Topic**: This document specifies the SSH transport layer protocol, including key exchange, encryption, authentication, and integrity protection mechanisms.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Tatu Ylonen; Tero Kivinen; Timo J. Rinne; Sami Lehtinen; Markku-Juhani O. Saarinen; Darren Moffat; Mats Andersson; Ben Harris; Bill Sommerfeld; Brent McClure; Niels Moller; Damien Miller; Derek Fawcus; Frank Cusack; Heikki Nousiainen; Jakob Schlyter; Jeff Van Dyke; Jeffrey Altman; Jeffrey Hutzelman; Jon Bright; Joseph Galbraith; Ken Hornstein; Markus Friedl; Martin Forssen; Nicolas Williams; Niels Provos; Perry Metzger; Peter Gutmann; Simon Josefsson; Simon Tatham; Wei Dai; Denis Bider; der Mouse; Tadayoshi Kohno
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: SSH; TCP/IP
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: IETF; IANA; Internet Society
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: Diffie-Hellman; SHA-1
- **Key Takeaways**: The SSH transport layer protocol negotiates key exchange, public key, symmetric encryption, message authentication, and hash algorithms; Protocol version 2.0 is the standard defined in this document with compatibility modes for older 1.x versions; Key exchange typically requires two round-trips but may require three in worst-case scenarios; Packet overhead increases are negligible for large packets but significant for one-byte telnet-type sessions; The protocol provides strong encryption, server authentication, and integrity protection over insecure networks.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Compatibility with SSH versions 1.x via configurable flags and version string negotiation (e.g., "1.99" for old clients)
- **Performance & Size Considerations**: Minimum packet size in the order of 28 bytes; TCP/IP header minimum 32 bytes; Ethernet data field minimum 46 bytes; Identification string maximum length 255 characters
- **Target Audience**: Developer; Security Architect; Network Engineer
- **Implementation Prerequisites**: Support for 8-bit clean binary-transparent transport; Ability to process identification strings terminated by CR LF; Compatibility handling for SSH version 1.x if required
- **Relevant PQC Today Features**: vpn-ssh-pqc, crypto-agility, tls-basics

---

## ANSSI PQC Follow-up Paper

- **Reference ID**: ANSSI PQC Follow-up Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition (2023 Follow-up)
- **Authors**: ANSSI France
- **Publication Date**: 2023-12-01
- **Last Updated**: 2023-12-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected
- **Extraction Note**: No source text available

---

## UK-NCSC-PQC-Whitepaper-2024

- **Reference ID**: UK-NCSC-PQC-Whitepaper-2024
- **Title**: NCSC White Paper — Next Steps in Preparing for Post-Quantum Cryptography
- **Authors**: NCSC UK; UK National Cyber Security Centre
- **Publication Date**: 2024-11-01
- **Last Updated**: 2024-11-01
- **Document Status**: Published
- **Main Topic**: None detected
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
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected
- **Extraction Note**: No source text available

---

## RFC 4301

- **Reference ID**: RFC 4301
- **Title**: Security Architecture for the Internet Protocol
- **Authors**: Stephen Kent; Karen Seo (BBN Technologies)
- **Publication Date**: 2005-12-01
- **Last Updated**: 2005-12-01
- **Document Status**: Proposed Standard
- **Main Topic**: This document specifies the base architecture and security services for IPsec at the IP layer for both IPv4 and IPv6 environments.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: S. Kent; K. Seo; Charlie Lynn (dedicated for significant contributions to IPsec documents)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: IPsec, Authentication Header (AH), Encapsulating Security Payload (ESP), Internet Key Exchange (IKE), IKEv2, IPv4, IPv6, ICMP
- **Infrastructure Layers**: Key Management; Security Associations; Security Policy Database (SPD); Security Association Database (SAD); Peer Authorization Database (PAD)
- **Standardization Bodies**: IETF (Internet Engineering Task Force implied by RFC context and Network Working Group); Internet Society
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: IPsec provides security services including access control, integrity, authentication, replay detection, and confidentiality at the IP layer; The architecture is designed to be cryptographic algorithm independent to allow selection of different algorithm sets; Default algorithms for AH/ESP and IKEv2 are specified in separate documents to facilitate updates without changing core protocol specs; Implementations must support manual and automated key management techniques; The document obsoletes RFC 2401 and defines the fundamental components of IPsec security architecture.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect; System Administrator; Technically adept users
- **Implementation Prerequisites**: Familiarity with Internet Protocol (IP); Related networking technology; General information system security terms and concepts
- **Relevant PQC Today Features**: crypto-agility, vpn-ssh-pqc, tls-basics

---

## RFC 4303

- **Reference ID**: RFC 4303
- **Title**: IP Encapsulating Security Payload (ESP)
- **Authors**: Stephen Kent (BBN Technologies)
- **Publication Date**: 2005-12-01
- **Last Updated**: 2005-12-01
- **Document Status**: Proposed Standard
- **Main Topic**: This document specifies the Encapsulating Security Payload (ESP) protocol for providing confidentiality, data origin authentication, integrity, and anti-replay services in IPv4 and IPv6.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: S. Kent
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: IP Encapsulating Security Payload (ESP), IPv4, IPv6, IP Authentication Header (AH)
- **Infrastructure Layers**: Key Management, Security Associations
- **Standardization Bodies**: Internet Society, Network Working Group
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: Cipher Block Chaining (CBC)
- **Key Takeaways**: ESP supports three security service combinations: confidentiality-only, integrity-only, and both; Integrity-only ESP must be supported as a negotiable option; Anti-replay service requires the selection of the integrity service; Traffic flow confidentiality is effective primarily in tunnel mode between gateways with sufficient masking traffic; Encryption-only provides defense against passive attackers but may be insecure against active attacks without strong integrity mechanisms.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Padding 0-255 bytes; Extended (64-bit) Sequence Number available
- **Target Audience**: Security Architect, Developer, Network Engineer
- **Implementation Prerequisites**: Familiarity with Security Architecture for the Internet Protocol; Support for negotiation of Extended Sequence Number feature in SA management protocols
- **Relevant PQC Today Features**: vpn-ssh-pqc, crypto-agility, tls-basics

---

## RFC 5280

- **Reference ID**: RFC 5280
- **Title**: Internet X.509 Public Key Infrastructure Certificate and CRL Profile
- **Authors**: D. Cooper; S. Santesson; S. Farrell; S. Boeyen; R. Housley; W. Polk
- **Publication Date**: 2008-05-01
- **Last Updated**: 2008-05-01
- **Document Status**: Proposed Standard
- **Main Topic**: This document profiles the X.509 v3 certificate and X.509 v2 certificate revocation list formats, extensions, and path validation procedures for the Internet PKI.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: D. Cooper; S. Santesson; S. Farrell; S. Boeyen; R. Housley; W. Polk
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509; PEM
- **Infrastructure Layers**: PKI
- **Standardization Bodies**: IETF; ISO/IEC/ITU-T; ANSI
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; DSA
- **Key Takeaways**: Implementations are not required to use any particular cryptographic algorithms but must follow encoding rules if using specified algorithms; Enhanced support for internationalized names is specified with rules for IDNs, IRIs, and distinguished names; The path validation algorithm no longer tracks the criticality of certificate policies extensions in a chain; Use of the privateKeyUsagePeriod extension is neither deprecated nor recommended for the Internet PKI; Security considerations address risks of circular dependencies in CRL distribution points and authority information access.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect; Compliance Officer
- **Implementation Prerequisites**: ASN.1 1988 syntax support; Conformance to RFC3279, RFC4055, and RFC4491 for algorithm identification if used; Support for internationalized name encoding rules per RFC3490, RFC3987, and RFC4518
- **Relevant PQC Today Features**: pki-workshop; tls-basics; crypto-agility; migration-program

---

## RFC 6962

- **Reference ID**: RFC 6962
- **Title**: Certificate Transparency
- **Authors**: Ben Laurie; Adam Langley; Emilia Kasper (Google)
- **Publication Date**: 2013-06-01
- **Last Updated**: 2013-06-01
- **Document Status**: Experimental
- **Main Topic**: An experimental protocol for publicly logging TLS certificates in append-only Merkle trees to enable auditing of certificate authority activity and detection of misissued certificates.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: B. Laurie; A. Langley; E. Kasper
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: PKI
- **Standardization Bodies**: Internet Engineering Task Force (IETF); Internet Engineering Steering Group (IESG)
- **Compliance Frameworks Referenced**: BCP 78; Simplified BSD License
- **Classical Algorithms Referenced**: SHA-256
- **Key Takeaways**: Certificate Transparency logs provide public auditability to detect misissued TLS certificates; Merkle Hash Trees ensure the append-only property of logs and allow efficient consistency proofs; Clients can require Signed Certificate Timestamps in TLS handshakes to verify certificate inclusion; Monitors can regularly query logs to check for unexpected certificate issuance for specific domains; The protocol is experimental and obsoleted by RFC 9162.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Merkle Tree Hash output is a single 32-byte value
- **Target Audience**: Security Architect; Developer; Compliance Officer; Researcher
- **Implementation Prerequisites**: SHA-256 hashing algorithm; TLS extension support for Signed Certificate Timestamps; Merkle Tree implementation
- **Relevant PQC Today Features**: merkle-tree-certs; tls-basics; pki-workshop; crypto-agility

---

## RFC 8017

- **Reference ID**: RFC 8017
- **Title**: PKCS #1: RSA Cryptography Specifications Version 2.2
- **Authors**: K. Moriarty; B. Kaliski; J. Jonsson; A. Rusch
- **Publication Date**: 2016-11-01
- **Last Updated**: 2016-11-01
- **Document Status**: Informational
- **Main Topic**: This document provides recommendations for implementing public-key cryptography based on the RSA algorithm, including primitives, encryption schemes, signature schemes, and ASN.1 syntax.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: K. Moriarty (Editor); B. Kaliski; J. Jonsson; A. Rusch
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: Internet Engineering Task Force (IETF); RSA Laboratories
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; SHA-2; MGF1
- **Key Takeaways**: The document defines RSAES-OAEP and RSASSA-PSS as modern schemes alongside legacy PKCS#1 v1.5 methods; Multi-prime RSA is supported to lower computational costs via parallel modular exponentiations; Change control for PKCS #1 v2.2 has been transferred from RSA Laboratories to the IETF; The specification includes ASN.1 syntax for representing keys and identifying schemes; Recommendations are intended to be compatible with IEEE 1363, IEEE 1363a, and ANSI X9.44 standards
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Multi-prime RSA offers lower computational cost for decryption and signature primitives; Better performance is achieved on multiprocessor platforms where modular exponentiations can be done in parallel
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: Compatibility with IEEE 1363, IEEE 1363a, and ANSI X9.44 standards; Support for multi-prime RSA modulus factors
- **Relevant PQC Today Features**: Algorithms; tls-basics; pki-workshop; crypto-agility; migration-program

---

## RFC 8446

- **Reference ID**: RFC 8446
- **Title**: The Transport Layer Security (TLS) Protocol Version 1.3
- **Authors**: Eric Rescorla (Mozilla)
- **Publication Date**: 2018-08-01
- **Last Updated**: 2018-08-01
- **Document Status**: Proposed Standard
- **Main Topic**: This document specifies version 1.3 of the Transport Layer Security (TLS) protocol to provide secure communication channels with simplified handshakes and modern cryptographic requirements.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: E. Rescorla
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.3, TLS 1.2
- **Infrastructure Layers**: PKI; Key Management
- **Standardization Bodies**: Internet Engineering Task Force (IETF); Internet Engineering Steering Group (IESG)
- **Compliance Frameworks Referenced**: BCP 78; Simplified BSD License
- **Classical Algorithms Referenced**: RSA; ECDSA; EdDSA; Diffie-Hellman; Elliptic Curve Diffie-Hellman; HKDF
- **Key Takeaways**: TLS 1.3 obsoletes previous versions including RFC 5246 and introduces a simplified handshake protocol; The protocol mandates authentication via asymmetric cryptography or pre-shared keys while ensuring confidentiality and integrity; Implementations must support mandatory cipher suites and extensions defined in the standard; Backward compatibility mechanisms are provided for negotiating with older clients and servers; The record protocol protects traffic using independently protected records with traffic keys.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Backward Compatibility Mode; Negotiating with an Older Server; Negotiating with an Older Client; 0-RTT Backward Compatibility
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: Reliable in-order data stream transport; Support for mandatory-to-implement cipher suites; Support for mandatory-to-implement extensions; Random number generation and seeding capabilities
- **Relevant PQC Today Features**: tls-basics, crypto-agility, hybrid-crypto, migration-program

---

## RFC 9052

- **Reference ID**: RFC 9052
- **Title**: CBOR Object Signing and Encryption (COSE): Structures and Process
- **Authors**: Jim Schaad (August Cellars)
- **Publication Date**: 2022-08-01
- **Last Updated**: 2022-08-01
- **Document Status**: Internet Standard
- **Main Topic**: Defines the CBOR Object Signing and Encryption (COSE) protocol structures and processes for signatures, MACs, and encryption using CBOR serialization.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: J. Schaad
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: CBOR, JOSE, CoRE, CoAP, CMS
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: IETF, IESG
- **Compliance Frameworks Referenced**: BCP 78, Revised BSD License
- **Classical Algorithms Referenced**: ECDSA, ECDH, AES (implied by AEAD/AE context but not explicitly named as algorithm), SHA (implied by digest context but not explicitly named)
- **Key Takeaways**: COSE provides security services for constrained IoT devices using CBOR serialization; The standard obsoletes RFC 8152 and splits algorithm details into RFC 9053; Countersignature text was removed to be defined in a separate document with corrected security properties; COSE supports store-and-forward or offline protocols but requires online key establishment for online encryption; Binary encodings are used instead of base64url to reduce message size.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Designed for small code size and small message size; CBOR allows direct binary data encoding without base64 conversion.
- **Target Audience**: Developer, Security Architect, Researcher
- **Implementation Prerequisites**: RFC 9053 for algorithm details; RFC 8230 for additional algorithm details; BCP 14 terminology interpretation.
- **Relevant PQC Today Features**: iot-ot-pqc, crypto-agility, tls-basics, api-security-jwt

---

## RFC 9580

- **Reference ID**: RFC 9580
- **Title**: OpenPGP
- **Authors**: Paul Wouters; Daniel Huigens; Justus Winter; Niibe Yutaka
- **Publication Date**: 2024-07-01
- **Last Updated**: 2024-07-01
- **Document Status**: Proposed Standard
- **Main Topic**: This document specifies OpenPGP message formats for encryption, digital signatures, compression, and key management while preparing the ecosystem for PQC signature integration.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: P. Wouters, Ed.; D. Huigens; J. Winter; Y. Niibe
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: OpenPGP
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: Internet Engineering Task Force (IETF); Internet Engineering Steering Group (IESG)
- **Compliance Frameworks Referenced**: BCP 78; Revised BSD License
- **Classical Algorithms Referenced**: RSA; Elgamal; ECDH; X25519; X448; DSA; ECDSA; EdDSALegacy; Ed25519; Ed448; Camellia; Argon2; AES; SHA-1; CRC24
- **Key Takeaways**: OpenPGP format obsoletes RFCs 4880, 5581, and 6637 to modernize cryptographic practices; The specification includes algorithm-specific fields for X25519, X448, Ed25519, and Ed448; Implementation must address security flaws related to side channels, traffic analysis, and random number generation; The document defines Version 6 packet formats for public keys and signatures; Ecosystem preparation includes support for PQC signature integration.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: Interoperable applications based on OpenPGP format; Revised BSD License compliance for code components; avoidance of security flaws in implementation
- **Relevant PQC Today Features**: email-signing, pki-workshop, crypto-agility, algorithms, tls-basics

---

## RFC 9593

- **Reference ID**: RFC 9593
- **Title**: Announcing Supported Authentication Methods in IKEv2
- **Authors**: Valery Smyslov
- **Publication Date**: 2024-07-01
- **Last Updated**: 2024-07-01
- **Document Status**: Proposed Standard
- **Main Topic**: RFC 9593 defines a mechanism for IKEv2 peers to announce supported authentication methods to enable negotiation of PQC signature algorithms and improve interoperability.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: V. Smyslov
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: IKEv2, IPsec, IKE_INTERMEDIATE
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: Internet Engineering Task Force (IETF), Internet Engineering Steering Group (IESG)
- **Compliance Frameworks Referenced**: BCP 78, Revised BSD License
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: IKEv2 lacks native negotiation for authentication methods causing SA establishment failures with multiple credentials; The new SUPPORTED_AUTH_METHODS Notify Message Type allows peers to announce supported methods ordered by preference; Hybrid signature schemes introduce challenges requiring explicit method announcement to avoid selection of unsupported formats; Large notification payloads may trigger IP fragmentation, necessitating the use of IKE_INTERMEDIATE exchange for transmission.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: hybrid schemes, composite signatures
- **Performance & Size Considerations**: Notify Message Type 16443; variable-size data blob format; risk of IP fragmentation in IKE_SA_INIT response
- **Target Audience**: Developer, Security Architect, Network Engineer
- **Implementation Prerequisites**: Support for RFC 7296 (IKEv2); Support for RFC 9242 (IKE_INTERMEDIATE exchange); Support for RFC 7383 (IKE fragmentation)
- **Relevant PQC Today Features**: hybrid-crypto, crypto-agility, vpn-ssh-pqc, pki-workshop

---

## RFC 9847

- **Reference ID**: RFC 9847
- **Title**: IANA Registry Updates for TLS and DTLS
- **Authors**: Joseph A. Salowey; Sean Turner
- **Publication Date**: 2025-12-01
- **Last Updated**: 2025-12-01
- **Document Status**: Proposed Standard
- **Main Topic**: Updates TLS and DTLS IANA registries by adding a "Discouraged" designation to flag weak or deprecated cryptographic mechanisms while maintaining backward compatibility.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: J. Salowey; S. Turner
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS; DTLS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: Internet Engineering Task Force (IETF); IANA; Internet Engineering Steering Group (IESG)
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: NULL; EXPORT; anon; RC4; DES; IDEA; MD5; SHA-1; SHA-224; SHA-256; SHA-384; SHA-512; KRB5; RC2; PSK; ECDHE_ECDSA; ECDHE_RSA; ECDHE_PSK
- **Key Takeaways**: IANA registries now include a "D" value to explicitly mark discouraged cryptographic mechanisms; Cipher suites using NULL encryption, EXPORT ciphers, and anon authentication are marked as discouraged due to lack of confidentiality or authentication; Weak algorithms including RC4, DES, IDEA, MD5, and SHA-1 are flagged as not secure for general use; Setting registry values to "Y" or "D" requires IETF Standards Action with Expert Review or IESG Approval; Implementers must consult linked references to determine conditions under which discouraged items should not be used.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect; Compliance Officer
- **Implementation Prerequisites**: IETF Standards Action with Expert Review or IESG Approval for registry updates; Consultation of linked references for discouraged items
- **Relevant PQC Today Features**: tls-basics, crypto-agility, algorithms, compliance-strategy

---

## NIST IR 8105

- **Reference ID**: NIST IR 8105
- **Title**: Report on Post-Quantum Cryptography
- **Authors**: NIST
- **Publication Date**: 2016-04-28
- **Last Updated**: 2016-04-28
- **Document Status**: Final
- **Main Topic**: Foundational NIST report examining quantum computing threats to current cryptographic standards and outlining the need for post-quantum cryptography standardization.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Shor's algorithm; Grover's search algorithm; large-scale quantum computers breaking public key cryptosystems
- **Migration Timeline Info**: Experts predict sufficiently large quantum computers may be built within the next 20 years; migration requires significant effort similar to the 20-year deployment of modern public key cryptography
- **Applicable Regions / Bodies**: United States; National Institute of Standards and Technology (NIST); U.S. Department of Commerce; European Union; Japan
- **Leaders Contributions Mentioned**: Peter Shor showed quantum computers can efficiently solve integer factorization and discrete log problems; Lily Chen, Stephen Jordan, Yi-Kai Liu, Dustin Moody, Rene Peralta, Ray Perlner, Daniel Smith-Tone are authors of the report
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Public key infrastructure; federal information systems
- **Standardization Bodies**: National Institute of Standards and Technology (NIST); European Telecommunications Standards Institute (ETSI)
- **Compliance Frameworks Referenced**: FIPS 186-4; SP800-56A; SP800-56B
- **Classical Algorithms Referenced**: RSA; Diffie-Hellman key exchange; elliptic curve cryptosystems; ECDSA; ECDH; DSA; AES; SHA-2; SHA-3
- **Key Takeaways**: Large-scale quantum computers will break current public key cryptosystems based on integer factorization and discrete log problems; symmetric algorithms require larger key sizes to resist Grover's algorithm but remain usable; organizations must focus on crypto agility to facilitate migration to new cryptographic infrastructures; NIST is initiating a standardization process for post-quantum cryptography
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Crypto agility emphasized as a need for agencies to focus on moving to new cryptographic infrastructures
- **Performance & Size Considerations**: Doubling the key size will be sufficient to preserve security against Grover's algorithm; lattice-based algorithms are described as relatively simple, efficient, and highly parallelizable
- **Target Audience**: Policy Maker; Security Architect; Researcher; Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats; Algorithms; Leaders; crypto-agility; migration-program

---

## NIST IR 8309

- **Reference ID**: NIST IR 8309
- **Title**: Status Report on the Second Round of the NIST Post-Quantum Cryptography Standardization Process
- **Authors**: NIST
- **Publication Date**: 2020-07-22
- **Last Updated**: 2020-07-22
- **Document Status**: Final
- **Main Topic**: Status report evaluating 26 second-round candidates and selecting finalists and alternates for the NIST Post-Quantum Cryptography Standardization Process.
- **PQC Algorithms Covered**: Classic McEliece, CRYSTALS-KYBER, NTRU, SABER, BIKE, FrodoKEM, HQC, NTRU Prime, SIKE, LAC, LEDAcrypt, NewHope, NTS-KEM, ROLLO, Round5, RQC, Three Bears, CRYSTALS-DILITHIUM, FALCON, Rainbow, GeMSS, Picnic, SPHINCS+, LUOV, MQDSS, qTESLA
- **Quantum Threats Addressed**: Quantum computers threatening public-key cryptosystems based on factoring, discrete logarithms, and elliptic curve cryptography
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; National Institute of Standards and Technology (NIST); U.S. Department of Commerce; federal agencies
- **Leaders Contributions Mentioned**: Gorjan Alagic; Jacob Alperin-Sheriff; Daniel Apon; David Cooper; Quynh Dang; John Kelsey; Yi-Kai Liu; Carl Miller; Dustin Moody; Rene Peralta; Ray Perlner; Angela Robinson; Daniel Smith-Tone; Larry Bassham; Lily Chen; Thinh Dang; Morris Dworkin; Sara Kerman; Andrew Regenscheid
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: Federal Information Processing Standard (FIPS) 186-4; NIST Special Publication (SP) 800-56A Revision 3; SP 800-56B Revision 2
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: NIST selected 7 finalists and 8 alternates from 26 second-round candidates for the third round of standardization; Finalists include Classic McEliece, CRYSTALS-KYBER, NTRU, SABER for encryption/key-establishment and CRYSTALS-DILITHIUM, FALCON, Rainbow for digital signatures; The process aims to augment existing standards like FIPS 186-4 and SP 800-56A/B with quantum-resistant algorithms; Organizations are encouraged to review draft publications during public comment periods; Federal agencies may use current concepts before companion publications are completed.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Researcher; Policy Maker; Security Architect; Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms; Leaders; Timeline; Compliance; Assess

---

## NIST IR 8413

- **Reference ID**: NIST IR 8413
- **Title**: Status Report on the Third Round of the NIST Post-Quantum Cryptography Standardization Process
- **Authors**: NIST
- **Publication Date**: 2022-07-05
- **Last Updated**: 2022-09-29
- **Document Status**: Final
- **Main Topic**: NIST status report on the third round of the Post-Quantum Cryptography Standardization Process detailing algorithm selections and evaluations.
- **PQC Algorithms Covered**: CRYSTALS-Kyber, CRYSTALS-Dilithium, FALCON, SPHINCS+, BIKE, Classic McEliece, HQC, SIKE, FrodoKEM, NTRU, NTRU Prime, Saber, GeMSS, Picnic, Rainbow
- **Quantum Threats Addressed**: Risk to public-key cryptosystems based on factoring, discrete logarithms, and elliptic curve cryptography from large-scale quantum computers
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; National Institute of Standards and Technology (NIST); U.S. Department of Commerce; federal agencies
- **Leaders Contributions Mentioned**: Gorjan Alagic, Daniel Apon, David Cooper, Quynh Dang, Thinh Dang, John Kelsey, Jacob Lichtinger, Yi-Kai Liu, Carl Miller, Dustin Moody, Rene Peralta, Ray Perlner, Angela Robinson, Daniel Smith-Tone, Zuzana Bajcsy, Larry Bassham, Lily Chen, Morris Dworkin, Sara Kerman, Andrew Regenscheid
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: Federal Information Processing Standard (FIPS) 186-4; NIST Special Publication (SP) 800-56A Revision 3; SP 800-56B Revision 2
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: CRYSTALS-Kyber selected as the primary public-key encryption and key-establishment algorithm for standardization; CRYSTALS-Dilithium, FALCON, and SPHINCS+ selected for digital signature standardization with Dilithium recommended as primary; BIKE, Classic McEliece, HQC, and SIKE advanced to a fourth round of evaluation; NIST will issue a new Call for Proposals to diversify the signature portfolio
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Benchmarks provided on x86-64 processors with AVX2 extensions and ARM Cortex-M4 processor; key and ciphertext sizes listed in tables for KEM finalists and alternates; signature sizes listed in tables for signature finalists and alternates
- **Target Audience**: Security Architect, Researcher, Policy Maker, Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms, Leaders, Timeline, Assess, stateful-signatures

---

## NIST CSWP 39

- **Reference ID**: NIST CSWP 39
- **Title**: Considerations for Achieving Cryptographic Agility
- **Authors**: NIST
- **Publication Date**: 2025-12-19
- **Last Updated**: 2025-12-19
- **Document Status**: Final
- **Main Topic**: Strategies and practices for achieving cryptographic agility to replace and adapt algorithms in protocols, applications, and infrastructure while preserving security during transitions like PQC migration.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: cryptographically relevant quantum computers (CRQCs)
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; National Institute of Standards and Technology (NIST); National Cybersecurity Center of Excellence (NCCoE)
- **Leaders Contributions Mentioned**: Elaine Barker, Lily Chen, David Cooper, Dustin Moody, Andrew Regenscheid, Murugiah Souppaya, Russ Housley, Sean Turner, William Barker, Bill Newhouse, Karen Kent, Jim Foti, Isabel Van Wyk
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: software; hardware; firmware; infrastructures; application programming interfaces (APIs); software libraries; hardware accelerators
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: DES; Triple DES; AES
- **Key Takeaways**: Crypto agility is essential for replacing vulnerable algorithms without disrupting operations; The PQC transition requires replacing all public-key algorithms, making it larger in scale than previous transitions; Organizations must adopt a systems approach to enable seamless transitions and limit vulnerable algorithm use; Strategic planning should integrate crypto agility into overall risk management frameworks; Stakeholders including protocol designers, implementers, and executives must coordinate to achieve crypto agility.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid Cryptographic Algorithms; hybrid algorithm to transition to PQC
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Developer; Policy Maker; Researcher; Operations; Compliance Officer
- **Implementation Prerequisites**: cryptographic inventory; application programming interfaces (APIs) updates; software library updates; hardware replacement for new accelerators
- **Relevant PQC Today Features**: crypto-agility, hybrid-crypto, pqc-risk-management, migration-program, pqc-governance

---

## NIST NCCoE SP 1800-38A

- **Reference ID**: NIST NCCoE SP 1800-38A
- **Title**: Migration to Post-Quantum Cryptography: Preparation for Considering the Implementation and Adoption of Quantum Safe Cryptography
- **Authors**: NIST NCCoE
- **Publication Date**: 2023-03-01
- **Last Updated**: 2023-04-01
- **Document Status**: Preliminary Draft Practice Guide
- **Main Topic**: Executive summary outlining the NCCoE project scope to prepare organizations for migrating from quantum-vulnerable public-key algorithms to quantum-resistant cryptography through discovery tools and interoperability testing.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum computer-based attacks; future quantum computer-based attacks
- **Migration Timeline Info**: NIST will standardize the first quantum-resistant algorithms in 2024
- **Applicable Regions / Bodies**: United States; National Institute of Standards and Technology (NIST); U.S. Federal Government
- **Leaders Contributions Mentioned**: William Newhouse; Murugiah Souppaya; William Barker; Chris Brown
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: QUIC; Transport Layer Security (TLS); Secure Shell (SSH)
- **Infrastructure Layers**: Hardware Security Modules (HSMs); Software as a Service; continuous integration/continuous delivery development pipeline; end user systems and servers
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: Rivest-Shamir-Adleman algorithm (RSA); Elliptic Curve Diffie Hellman (ECDH); Elliptic Curve Digital Signature Algorithm (ECDSA)
- **Key Takeaways**: Organizations must inventory the breadth and scope of public-key cryptography usage across products, services, and operational environments; New quantum-resistant algorithms are not drop-in replacements due to differences in key size, signature size, and performance characteristics; Discovery tools should be used to detect vulnerable cryptography and inform risk analysis for prioritizing migration actions; Interim hybrid implementations may be necessary to maintain interoperability during the transition from quantum-vulnerable to quantum-resistant algorithms
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: X.509 post-quantum certificate hybrid profiles; interim hybrid implementations
- **Performance & Size Considerations**: Differences in key size, signature size, error handling, number of execution steps required to perform the algorithm, and key establishment process complexity may affect performance and reliability
- **Target Audience**: Business decision makers; Chief Information Security Officers; Technology program managers; Security program managers; Privacy program managers; IT professionals
- **Implementation Prerequisites**: Complete inventory of key partners and cryptography usage locations; identification of application and functional dependencies on public-key cryptography; risk-based playbook for migration involving people, processes, and technology
- **Relevant PQC Today Features**: pqc-business-case; migration-program; pqc-risk-management; crypto-agility; hsm-pqc

---

## NIST NCCoE SP 1800-38B

- **Reference ID**: NIST NCCoE SP 1800-38B
- **Title**: Migration to Post-Quantum Cryptography: Quantum Readiness — Cryptographic Discovery
- **Authors**: NIST NCCoE
- **Publication Date**: 2023-12-01
- **Last Updated**: 2023-12-19
- **Document Status**: Preliminary Draft Practice Guide
- **Main Topic**: This document provides tools and techniques for cryptographic discovery to identify quantum-vulnerable cryptography as the first step in PQC migration.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; National Institute of Standards and Technology; National Cybersecurity Center of Excellence; State of Maryland; Montgomery County, Maryland
- **Leaders Contributions Mentioned**: William Newhouse; Murugiah Souppaya; William Barker; Chris Brown; Panos Kampanakis; David McGrew; David Hook; Anne Dames; Raul Garcia; Vladimir Soukharev; Evgeny Gervis; Philip Lafrance; Eunkyung Kim; Changhoon Lee; Anthony Hu; Marc Manzano
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: National Institute of Standards and Technology
- **Compliance Frameworks Referenced**: NIST Cybersecurity Framework
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations should identify quantum-vulnerable cryptography across their environments as the first step in PQC migration; A multifaceted approach to the discovery process is recommended for most organizations; Functional test plans are available to exercise cryptographic discovery tools and determine baseline capabilities; High-level architectures integrating contributed discovery tools can be re-created by other entities
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, Compliance Officer, Researcher
- **Implementation Prerequisites**: Access to the repository at https://github.com/usnistgov; Materials lists and configuration files provided in NIST Special Publication 1800 series documents
- **Relevant PQC Today Features**: Assess, Migrate, crypto-agility, pqc-risk-management, migration-program

---

## NIST CSWP 48

- **Reference ID**: NIST CSWP 48
- **Title**: Mappings of Migration to PQC Project Capabilities to Risk Framework Documents
- **Authors**: NIST NCCoE
- **Publication Date**: 2025-09-18
- **Last Updated**: 2025-09-18
- **Document Status**: Initial Public Draft
- **Main Topic**: This document maps NCCoE Migration to PQC project capabilities to NIST Cybersecurity Framework 2.0 and SP 800-53 security controls to support risk management during migration.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: attacks from a cryptanalytically-relevant quantum computer; quantum computer-based attacks
- **Migration Timeline Info**: NIST PQC standards published in August 2024
- **Applicable Regions / Bodies**: United States; National Institute of Standards and Technology; U.S. Federal Government
- **Leaders Contributions Mentioned**: William Newhouse; Murugiah Souppaya; William Barker; Karen Scarfone
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Transport Layer Security (TLS); Secure Shell (SSH); QUIC
- **Infrastructure Layers**: hardware security modules (HSMs); Certificate Authority Implementations; cryptographic discovery and inventory tools
- **Standardization Bodies**: National Institute of Standards and Technology; Internet Engineering Task Force (IETF)
- **Compliance Frameworks Referenced**: NIST Cybersecurity Framework 2.0; Security and Privacy Controls for Information Systems and Organizations (SP 800-53); Special Publication 800-53 Revision 5
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must use cryptographic discovery and inventory tools to identify where cryptography protects data; Interoperability testing of NIST PQC algorithms is essential for vendors to optimize implementations; Migration planning should leverage risk-based approaches supported by cryptographic inventories; Responsible implementation depends on adherence to security objectives in CSF 2.0 and SP 800-53
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: maximum TLS 1.3 handshake rate for testing profiles
- **Target Audience**: Security program managers; architects; IT professionals; risk management staff
- **Implementation Prerequisites**: cryptographic discovery and inventory tools; active and passive cryptographic discovery technologies; working implementations of NIST standardized PQC algorithms
- **Relevant PQC Today Features**: Assess, Migrate, Compliance, Algorithms, hsm-pqc, tls-basics, vpn-ssh-pqc, pqc-risk-management

---

## RFC 9420

- **Reference ID**: RFC 9420
- **Title**: The Messaging Layer Security (MLS) Protocol
- **Authors**: IETF MLS
- **Publication Date**: 2023-07-01
- **Last Updated**: 2023-07-01
- **Document Status**: Proposed Standard
- **Main Topic**: Specification of the Messaging Layer Security (MLS) protocol for efficient asynchronous group key establishment with forward secrecy and post-compromise security.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: R. Barnes; B. Beurdouche; R. Robert; J. Millican; E. Omara; K. Cohn-Gordon
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: MLS; HPKE; TLS; Double Ratchet; Signal
- **Infrastructure Layers**: Authentication Service; Delivery Service; Key Management
- **Standardization Bodies**: Internet Engineering Task Force (IETF); IESG
- **Compliance Frameworks Referenced**: BCP 78; BCP 14; RFC2119; RFC8174; Revised BSD License
- **Classical Algorithms Referenced**: HMAC; AEAD; SHA-256
- **Key Takeaways**: MLS enables asynchronous group key establishment with costs scaling logarithmically with group size; The protocol provides forward secrecy and post-compromise security for groups ranging from two to thousands of members; MLS uses a tree-based key encapsulation mechanism (TreeKEM) based on HPKE; Group state evolves through epochs where each epoch depends on its predecessor; Implementations must handle variable-size vector length headers using specific integer encodings.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: hybrid public key encryption (HPKE); GREASE approach for extensibility
- **Performance & Size Considerations**: Costs scale as the log of the group size; Vector lengths up to 2^30 bytes; Integers encoded in 1, 2, or 4 bytes representing 6-, 14-, or 30-bit values
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: Support for TLS presentation language; Variable-length integer encoding based on RFC9000; Authentication Service and Delivery Service infrastructure
- **Relevant PQC Today Features**: Algorithms, hybrid-crypto, crypto-agility, tls-basics, merkle-tree-certs

---
