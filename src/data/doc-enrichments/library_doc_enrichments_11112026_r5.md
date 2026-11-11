---
generated: 2026-11-11
collection: library
documents_processed: 2
enrichment_method: manual-extraction, human-reviewed corrections to existing entries; every field not listed in a section below is unchanged from the generation the entry was carried forward from
---

## RFC 5083

- **Reference ID**: RFC 5083
- **Title**: Cryptographic Message Syntax (CMS) Authenticated-Enveloped-Data Content Type
- **Authors**: IETF SMIME WG
- **Publication Date**: 2007-11
- **Last Updated**: 2007-11
- **Document Status**: Proposed Standard
- **Main Topic**: Defines the additional CMS AuthEnvelopedData content type and its ASN.1 structure for authenticated encryption. RFC 5652 supplies the base CMS syntax; RFC 5084 specifies the AES-CCM/AES-GCM algorithm conventions for this extension.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Keywords: required by
- **Applicable Regions / Bodies**: Bodies: IETF
- **Leaders Contributions Mentioned**: R. Housley
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Cryptographic Message Syntax (CMS)
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: AES-CCM; AES-GCM; Cipher Block Chaining (CBC)
- **Key Takeaways**: RFC 5083 defines the AuthEnvelopedData content type, not the AES algorithm profile; Its supported CMS key-management techniques include key transport, key agreement, symmetric key-encryption keys and passwords; A recipient must verify integrity before releasing plaintext and destroy plaintext on verification failure; Use RFC 5084 for AES-CCM and AES-GCM conventions, and RFC 5652 for base CMS content types.
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
- **PQC Heatmap Protocols Covered**: S/MIME
- **PQC Heatmap Protocols Evidence**: S/MIME: "smime(16) ct(1) 23"
- **Lifecycle State**: Released
- **Performance & Size Considerations**: Padding method well defined if block size is less than 256 octets
- **Target Audience**: Developer; Security Architect
- **Implementation Prerequisites**: Support for ASN.1 BER and DER encoding; Support for AES-CCM or AES-GCM algorithms.
- **Relevant PQC Today Features**: email-signing; pki-workshop; crypto-agility
- **Implementation Attack Surface**: Counter mode misuse; Nonce reuse
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: content-authenticated-encryption key generated at random
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: version number intended to avoid ASN.1 decode errors; higher version number only used when new syntax feature is employed; lowest version number that supports generated syntax is used for maximum interoperability
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Math Family**: Symmetric
- **PQC Round**: Not Applicable
- **Extraction Note**: carry-forward (DS05p2): record not iterated this run; preserved from prior enrichment

---

## RFC 5652

- **Reference ID**: RFC 5652
- **Title**: Cryptographic Message Syntax (CMS)
- **Authors**: IETF SMIME WG
- **Publication Date**: 2009-09
- **Last Updated**: 2009-09
- **Document Status**: Proposed Standard
- **Main Topic**: This document specifies the Cryptographic Message Syntax (CMS) for digitally signing, digesting, authenticating, or encrypting arbitrary message content.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Post-Quantum
- **Migration Timeline Info**: Keywords: deprecat
- **Applicable Regions / Bodies**: Regions: International
- **Leaders Contributions Mentioned**: R. Housley
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: S/MIME; X.509
- **Infrastructure Layers**: PKI; Key Management
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: BCP 78, Internet Official Protocol Standards (STD 1)
- **Classical Algorithms Referenced**: RSA
- **Key Takeaways**: CMS provides base ASN.1 syntax for data, signed-data, enveloped-data, digested-data, encrypted-data and authenticated-data content types; Specific algorithm conventions and later content-type extensions are defined separately; AuthEnvelopedData is defined in RFC 5083, while RFC 5084 supplies AES-CCM/AES-GCM conventions for that extension; Match the content structure and algorithm profile to the implementation question rather than treating the three RFCs as interchangeable.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Backward compatibility with PKCS #7 version 1.5; Extension mechanism to support new key management schemes without further changes to the CMS
- **Pure PQC KEM Support**: Not Applicable
- **Pure PQC KEM Evidence**: None detected
- **Hybrid PQC KEM Support**: Not Applicable
- **Hybrid PQC KEM Evidence**: None detected
- **Pure PQC Signature Support**: Not Applicable
- **Pure PQC Signature Evidence**: None detected
- **Hybrid PQC Signature Support**: Not Applicable
- **Hybrid PQC Signature Evidence**: None detected
- **PQC Heatmap Protocols Covered**: S/MIME; X.509
- **PQC Heatmap Protocols Evidence**: S/MIME: "Secure/Multipurpose Internet Mail Extensions (S/MIME) v2 signatures"; X.509: "PKIX (Public Key Infrastructure using X.509)"
- **Lifecycle State**: Released
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect
- **Implementation Prerequisites**: ASN.1 BER-encoding support
- **Relevant PQC Today Features**: email-signing; pki-workshop; crypto-agility
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: modular implementations to allow new algorithms to be readily inserted; prepared for the set of algorithms that must be supported to change over time
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Math Family**: None detected
- **PQC Round**: Not Applicable
- **Extraction Note**: carry-forward (DS05p2): record not iterated this run; preserved from prior enrichment

---
