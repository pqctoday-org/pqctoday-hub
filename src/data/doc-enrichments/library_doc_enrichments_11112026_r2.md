---
generated: 2026-11-11
collection: library
documents_processed: 1
enrichment_method: manual-extraction, human-reviewed corrections to existing entries; every field not listed in a section below is unchanged from the generation the entry was carried forward from
---

## RFC 7517

- **Reference ID**: RFC 7517
- **Title**: JSON Web Key (JWK)
- **Authors**: IETF
- **Publication Date**: 2015-05-01
- **Last Updated**: 2015-05-01
- **Document Status**: Proposed Standard
- **Main Topic**: Defines the JSON Web Key (JWK) format for representing cryptographic keys as JSON and the JWK Set structure for representing a set of JWKs.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: International
- **Leaders Contributions Mentioned**: M. Jones
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: JSON Web Signature, JSON Web Encryption, X.509
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; EC; P-256; SHA-1; SHA-256
- **Key Takeaways**: JWKs are JSON data structures representing cryptographic keys; JWK Sets represent a collection of JWKs using a "keys" member; The specification defines common parameters like "kty", "use", and "key_ops"; Algorithm-specific members are defined in the JWA specification; The format supports X.509 certificate chain inclusion via the "x5c" parameter.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Pure PQC KEM Support**: Not Applicable
- **Pure PQC KEM Evidence**: None detected
- **Hybrid PQC KEM Support**: Not Applicable
- **Hybrid PQC KEM Evidence**: None detected
- **Pure PQC Signature Support**: Not Applicable
- **Pure PQC Signature Evidence**: None detected
- **Hybrid PQC Signature Support**: Not Applicable
- **Hybrid PQC Signature Evidence**: None detected
- **PQC Heatmap Protocols Covered**: None applicable
- **PQC Heatmap Protocols Evidence**: None detected
- **Lifecycle State**: Released
- **Performance & Size Considerations**: Companion worked comparison using generated fictional public keys: a minified one-key P-256 JWKS with only kty, crv, x and y is 137 UTF-8 bytes (each 32-byte coordinate is 43 Base64url characters). A minified one-key ML-DSA-65 JWKS using RFC 9964 AKP members kty, alg and pub is 2,654 bytes: its 1,952 raw public-key bytes encode to 2,603 pub characters. Both counts include the JSON keys wrapper, but exclude whitespace, optional metadata and HTTP/TLS overhead. These are measured sample encodings, not equal-security or fixed deployment-size claims.
- **Target Audience**: Developer
- **Implementation Prerequisites**: JSON parser supporting ECMAScript 5.1 duplicate member handling; BASE64URL encoding per JWS Section 2; UTF-8 representation per RFC3629
- **Relevant PQC Today Features**: api-security-jwt
- **Implementation Attack Surface**: RSA Key blinding operation defense against timing attacks; protecting private and symmetric keys from disclosure and information leakage
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: Key Entropy and Random Values
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: A retrieved JWKS is an HTTP response body, so measure its serialized body size, download latency, caching and key-rotation behavior. For the measured one-key samples, budget 137 bytes for the P-256 body and 2,654 bytes for the ML-DSA-65 body before optional members or certificate chains. A JWT carried in an Authorization request header has a different token/signature budget; a larger JWKS response does not itself consume that request-header limit. RFC 7517 defines JWK Sets; RFC 9964 supplies the ML-DSA AKP encoding used in this companion comparison.
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Math Family**: None detected
- **PQC Round**: Not Applicable
- **Extraction Note**: carry-forward (DS05p2): record not iterated this run; preserved from prior enrichment

---
