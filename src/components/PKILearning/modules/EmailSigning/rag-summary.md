# Email and Document Signing (S/MIME, CMS, OpenPGP)

## Overview

The Email and Document Signing module covers Cryptographic Message Syntax (CMS) and S/MIME for signing and encrypting email, including PQC transition considerations. A signature's validity does not by itself establish the sender's email identity: certificate path, status, purpose and identity checks also matter. The module explains CMS SignedData and AuthEnvelopedData, RSA key transport and the KEM-based CMS alternative in RFC 9629, standalone ML-DSA signatures in CMS (RFC 9882), and composite ML-DSA signing in X.509 and CMS (RFC 10073). Standards define formats and processing; they do not prove product implementation or interoperability. Message size and recipient compatibility depend on the actual profile and deployed clients.

## Key Concepts

- **CMS (Cryptographic Message Syntax)** — RFC 5652; foundational format for signing and encrypting arbitrary data; used in S/MIME, code signing, PDF signatures, firmware updates, timestamping, SCEP/EST, and eIDAS
- **S/MIME signing** — creates a CMS SignedData structure; sender's private key signs a hash of the message; recipients verify using sender's certificate
- **S/MIME encryption** — creates a CMS AuthEnvelopedData structure (RFC 5083); message is AEAD-encrypted (AES-GCM) with a random content-encryption key (CEK), which is wrapped for each recipient
- **PQC standards in CMS**: standalone ML-DSA for signing (RFC 9882), composite ML-DSA signatures (RFC 10073), KEM-based encryption via KEMRecipientInfo (RFC 9629), RSA-KEM (RFC 9690) puts RSA behind the KEM interface and is not a post-quantum KEM; the CMS RFCs define formats, not deadlines or product support; HSS/LMS for hash-based signatures (RFC 9708)
- **KEM vs key transport** — some classical S/MIME profiles use RSA key transport to encrypt the CEK to the recipient's public key; a future cryptographically relevant quantum computer could recover the private key from a captured public key and expose recorded ciphertext. RFC 9629 defines KEMRecipientInfo: the sender transmits a KEM ciphertext, derives shared keying material, applies the specified KDF and key-wrap algorithm, and carries the KEM recipient info alongside encrypted content
- **Why KEMs replace key transport** — NIST standardized ML-KEM (FIPS 203) as a KEM primitive, not a public-key encryption scheme; RFC 9629 bridges this with KEMRecipientInfo
- **Signing certificates** require keyUsage: digitalSignature/nonRepudiation, extKeyUsage: id-kp-emailProtection, subjectAltName: rfc822Name; algorithm: ML-DSA-65 or ECDSA P-256
- **Encryption certificates** require keyUsage: keyEncipherment (RSA) or keyAgreement (ECDH); for ML-KEM certificates keyEncipherment is the only key usage set when the keyUsage extension is present (RFC 9935 §5); algorithm: ML-KEM-768 or RSA-2048
- **Separate key pairs** — users typically have separate signing (ML-DSA) and encryption (ML-KEM) key pairs; smimeCapabilities attribute lists, in preference order and only in part, the algorithms a signer says it can handle (RFC 8551 section 2.5.2)
- **OpenPGP (RFC 9580 / RFC 9980)** — the other email and file standard; no X.509 certificates or CA, keys carry their own identities. RFC 9980 (Post-Quantum Cryptography in OpenPGP, Proposed Standard) adds composite PQ/T algorithms: ML-KEM-768+X25519 (algorithm ID 35, MUST) and ML-KEM-1024+X448 (36, SHOULD) for encryption; ML-DSA-65+Ed25519 (30, MUST) and ML-DSA-87+Ed448 (31, SHOULD) for signatures; standalone SLH-DSA-SHAKE-128s/128f/256s (32-34, MAY). Lattice schemes only as composites (either half secures the message); SLH-DSA standalone because its hash-based assumptions are well understood. PQ algorithms are for v6 keys only, except ML-KEM-768+X25519, also allowed in v4 encryption-capable subkeys
- **Migration challenges**:
  - **Recipient compatibility** — a recipient must support the relevant operation and profile to decrypt or verify; sender and recipient support need not mean identical capabilities for every use case
  - **Credential strategy** — organizations may use classical, standalone PQ, composite, or parallel credentials according to profile support and interoperability needs; dual separate certificates are not a universal standards requirement
  - **Recipient capability discovery** — senders must find out which algorithms each recipient can handle, for example from the smimeCapabilities of the recipient's earlier signed messages (a partial list in preference order) and from LDAP directory lookups
  - **Message size impact** — signature, certificate and complete-message sizes vary by algorithm, profile, ASN.1 encoding and certificate chain; measure the actual message and client path rather than extrapolating one signature size
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
- RFC 10073 (Composite ML-DSA for X.509 and CMS)
- RFC 9690 (RSA-KEM in CMS)
- RFC 9708 (HSS/LMS in CMS)
- FIPS 203 (ML-KEM)
- FIPS 204 (ML-DSA)
