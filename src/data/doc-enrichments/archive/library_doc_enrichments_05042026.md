---
generated: 2026-05-04
collection: library
documents_processed: 4
enrichment_method: ollama-qwen3.6:27b
---

## RFC 9142

- **Reference ID**: RFC 9142
- **Title**: Key Exchange (KEX) Method Updates and Recommendations for Secure Shell (SSH)
- **Authors**: IETF (Baushke)
- **Publication Date**: 2022-01-01
- **Last Updated**: 2022-01-01
- **Document Status**: IETF RFC
- **Main Topic**: Updates the recommended set of key exchange methods for use in the Secure Shell (SSH) protocol to meet evolving needs for stronger security.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: M. Baushke
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Secure Shell (SSH)
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: SHA-1, Diffie-Hellman
- **Key Takeaways**: Deprecates SHA-1 and short Diffie-Hellman groups for SSH key exchange; Updates RFCs 4250, 4253, 4432, and 4462 with new recommendations; Frames hybrid PQ KEX work that follows; Aims to meet evolving needs for stronger security
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: hybrid PQ KEX
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: vpn-ssh-pqc; hybrid-crypto; crypto-agility
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: RFC_9142.html (63,276 bytes, 1,161 extracted chars)
- **Extraction Timestamp**: 2026-05-04T17:41:02

---

## RFC 9528

- **Reference ID**: RFC 9528
- **Title**: Ephemeral Diffie-Hellman Over COSE (EDHOC)
- **Authors**: IETF LAKE WG (Selander, Mattsson, Palombini)
- **Publication Date**: 2024-03-01
- **Last Updated**: 2024-03-01
- **Document Status**: IETF RFC
- **Main Topic**: Specification of Ephemeral Diffie-Hellman Over COSE (EDHOC), a lightweight authenticated key-establishment protocol for constrained IoT devices.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: G. Selander; J. Preuß Mattsson; F. Palombini
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: EDHOC; OSCORE; COSE; CBOR; CoAP
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: Diffie-Hellman
- **Key Takeaways**: EDHOC provides mutual authentication and forward secrecy in 3 messages; EDHOC is intended for usage in constrained scenarios; EDHOC serves as the security handshake under OSCORE; Reusing COSE, CBOR, and CoAP keeps additional code size very low
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: iot-ot-pqc; tls-basics; crypto-agility
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: constrained scenarios; constrained IoT devices; very compact and lightweight
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: RFC_9528.html (63,359 bytes, 1,553 extracted chars)
- **Extraction Timestamp**: 2026-05-04T17:42:08

---

## W3C WebAuthn

- **Reference ID**: W3C WebAuthn
- **Title**: Web Authentication: An API for accessing Public Key Credentials - Level 3
- **Authors**: W3C Web Authentication Working Group
- **Publication Date**: 2024-10-01
- **Last Updated**: 2026-01-13
- **Document Status**: W3C Recommendation
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
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Extraction Note**: No source text available
- **Source Document**: W3C_WebAuthn.html (2,731,117 bytes, no text extracted)
- **Extraction Timestamp**: 2026-05-04T17:43:15

---

---

generated: 2026-05-04
collection: library
documents_processed: 1
enrichment_method: ollama-qwen3.6:27b

---

## OpenSSL-3.5.0-Release

- **Reference ID**: OpenSSL-3.5.0-Release
- **Title**: OpenSSL 3.5.0 — First Release with Native Post-Quantum Cryptography
- **Authors**: OpenSSL Project
- **Publication Date**: 2025-04-29
- **Last Updated**: 2025-04-29
- **Document Status**: Released
- **Main Topic**: OpenSSL 3.5.0 is the first release to include native support for ML-KEM, ML-DSA, SLH-DSA, and X25519MLKEM768 hybrid TLS without requiring the OQS provider.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: OpenSSL
- **Protocols Covered**: TLS, QUIC, X.509, CMS, S/MIME, DANE, CMP
- **Infrastructure Layers**: PKI, Key Management
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: FIPS 140-3, FIPS 203, FIPS 204, FIPS 205
- **Classical Algorithms Referenced**: RSA, EC, ECX, DH, X25519, AES-256-CBC, DES-EDE3-CBC, SM2, PBMAC1, OCB
- **Key Takeaways**: OpenSSL 3.5.0 enables mainstream PQC adoption by natively supporting ML-KEM, ML-DSA, and SLH-DSA without the OQS provider; Default TLS configurations now prefer hybrid PQC KEM groups including X25519MLKEM768; The release introduces server-side QUIC support and improved TLS key establishment configurability; Security patch releases (3.5.1-3.5.6) address critical vulnerabilities in RSA KEM, CMS parsing, and PKCS#12 handling; FIPS provider updates include PCT on key generation and import for RSA, EC, and ECX.
- **Security Levels & Parameters**: ML-KEM-768, X25519MLKEM768
- **Hybrid & Transition Approaches**: Hybrid PQC KEM groups, X25519MLKEM768 hybrid TLS, multiple TLS keyshares
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect, Operations
- **Implementation Prerequisites**: OpenSSL 3.5.0 or later; Configuration of no-tls-deprecated-ec option; FIPS provider configuration for jitter seed source
- **Relevant PQC Today Features**: Algorithms, hybrid-crypto, tls-basics, migration-program
- **Implementation Attack Surface**: Timing side-channel in SM2 algorithm; Use-after-free in DANE client code; NULL pointer dereference in delta CRL and CMS processing; Heap buffer overflow in hexadecimal conversion; Stack buffer overflow in CMS AuthEnvelopedData; Out-of-bounds read/write in RFC 3211 KEK Unwrap and HTTP client no_proxy handling; Improper validation of PBMAC1 parameters; Unauthenticated trailing bytes with OCB function calls
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: Performance benchmarks; FIPS 140-3 PCT (Provider Self-Test) on key generation and import
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: JITTER seed source for FIPS provider
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: Breaking changes in default encryption cipher (des-ede3-cbc to aes-256-cbc); Deprecated BIO*meth_get*\*() functions; Changes to default TLS supported groups and keyshares; Known issue with SSL_accept on objects from SSL_accept_connection requiring SSL_do_handshake
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: OpenSSL-3.5.0-Release.html (45,881 bytes, 7,447 extracted chars)
- **Extraction Timestamp**: 2026-05-04T23:50:56

---
