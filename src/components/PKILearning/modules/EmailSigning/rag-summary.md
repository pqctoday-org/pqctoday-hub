# Email and Document Signing (S/MIME, CMS)

## Overview

The Email and Document Signing module covers Cryptographic Message Syntax (CMS) and S/MIME for secure email, focusing on the transition from classical to post-quantum cryptography. CMS (RFC 5652) is the foundational format for digitally signing and encrypting data, powering S/MIME email security as well as code signing, PDF signatures, firmware updates, timestamping, and eIDAS signatures. The module explains the CMS SignedData and AuthEnvelopedData structures, the paradigm shift from RSA key transport to KEM-based encryption (RFC 9629), S/MIME certificate requirements for signing versus encryption, and the unique migration challenges of email security where bidirectional compatibility is required.

## Key Concepts

- **CMS (Cryptographic Message Syntax)** — RFC 5652; foundational format for signing and encrypting arbitrary data; used in S/MIME, code signing, PDF signatures, firmware updates, timestamping, SCEP/EST, and eIDAS
- **S/MIME signing** — creates a CMS SignedData structure; sender's private key signs a hash of the message; recipients verify using sender's certificate
- **S/MIME encryption** — creates a CMS AuthEnvelopedData structure (RFC 5083); message is AEAD-encrypted (AES-GCM) with a random content-encryption key (CEK), which is wrapped for each recipient
- **PQC standards in CMS**: ML-DSA for signing (RFC 9882), KEM-based encryption via KEMRecipientInfo (RFC 9629), RSA-KEM as transitional option (RFC 9690), HSS/LMS for hash-based long-lived signatures (RFC 9708)
- **KEM vs key transport** — classical S/MIME uses RSA key transport (encrypts CEK directly with recipient's public key, vulnerable to Shor's); PQC uses KEM encapsulation to derive a shared secret, then HKDF to derive a key-wrap key, then AES-WRAP the CEK; stored in KEMRecipientInfo instead of KeyTransRecipientInfo
- **Why KEMs replace key transport** — NIST standardized ML-KEM (FIPS 203) as a KEM primitive, not a public-key encryption scheme; RFC 9629 bridges this with KEMRecipientInfo
- **Signing certificates** require keyUsage: digitalSignature/nonRepudiation, extKeyUsage: id-kp-emailProtection, subjectAltName: rfc822Name; algorithm: ML-DSA-65 or ECDSA P-256
- **Encryption certificates** require keyUsage: keyEncipherment (RSA) or keyAgreement (ECDH); KEM keyUsage is still being standardized; algorithm: ML-KEM-768 or RSA-2048
- **Separate key pairs** — users typically have separate signing (ML-DSA) and encryption (ML-KEM) key pairs; smimeCapabilities attribute advertises supported algorithms
- **Migration challenges**:
  - **Bidirectional compatibility** — both sender and recipient must support the same algorithms (unlike TLS where servers can upgrade unilaterally)
  - **Dual-algorithm certificates** — organizations must issue both classical and PQC certificates during transition
  - **Recipient capability discovery** — senders must discover recipient algorithm support via smimeCapabilities and LDAP
  - **Message size impact** — ML-DSA-65 signatures are approximately 3.3 KB versus 72 bytes for ECDSA; signed emails with certificate chains grow 10-15 KB
  - **Archival and long-term validation** — signed emails must remain verifiable for years or decades
  - **Gateway compatibility** — email gateways, DLP systems, and archival solutions must understand PQC-signed CMS structures

## Workshop / Interactive Activities

The workshop has 3 steps:

1. **S/MIME Certificate Viewer** — compare classical (RSA/ECDSA) and PQC (ML-DSA, ML-KEM) certificate structures for email signing and encryption, examining key usage extensions, algorithm OIDs, and key/signature sizes
2. **CMS Signing Demo** — walk through the CMS SignedData workflow step by step, inspecting the ASN.1 structure including the digest algorithm, signer info, and signature value for both classical and PQC algorithms
3. **CMS Encryption Demo** — compare RSA key transport (KeyTransRecipientInfo) with KEM-based encryption (KEMRecipientInfo per RFC 9629) using AuthEnvelopedData; visualize the KEM encapsulate, KDF, and AES-WRAP steps

## Related Standards

- RFC 5652 (CMS)
- RFC 5083 (CMS Authenticated-Enveloped-Data)
- RFC 9629 (KEMRecipientInfo for CMS)
- RFC 9882 (ML-DSA in CMS)
- RFC 9690 (RSA-KEM in CMS)
- RFC 9708 (HSS/LMS in CMS)
- FIPS 203 (ML-KEM)
- FIPS 204 (ML-DSA)
