# PKI Enrollment Protocols (EST and CMP)

## Overview

The PKI Enrollment Protocols module covers EST (Enrollment over Secure Transport, RFC 7030) and CMP (Certificate Management Protocol, RFC 4210 with the 2025 KEM update in RFC 9810). These are the two protocols that actually carry a certificate request from a subscriber to a Certificate Authority and deliver the issued certificate back. The module covers what each protocol is, how they handle proof-of-possession for both signing keys and non-signing KEM keys, and how the standards have been updated for post-quantum cryptography. The workshop runs a real end-to-end CMP IR exchange in the browser: an in-process OSSL_CMP_SRV_CTX parses the CRMF cert template from the inbound IR, builds a fresh X509 with the requested ML-DSA-65 or ML-KEM-768 public key, signs it with the mock CA's ML-DSA-65 key, returns a real PKIMessage IP back through the same in-process transport. No external CA, no network calls, real cryptographic operations throughout.

## Key Concepts

- **EST (RFC 7030, October 2013)** — Enrollment over Secure Transport; HTTPS-based; client POSTs a base64-encoded PKCS#10 CSR to `/.well-known/est/simpleenroll`; server returns base64-encoded PKCS#7 SignedData containing the issued cert; transport is TLS (originally 1.2+); proof-of-possession is the signed CSR itself (works for ML-DSA, does not work for ML-KEM)
- **CMP (RFC 4210, originally 2005)** — Certificate Management Protocol; HTTP-based with `application/pkixcmp` content type (RFC 6712); richer state machine with Initial Request (`ir`), Cert Request (`cr`), Key Update Request (`kur`), Revocation Request (`rr`), General Message (`genm`)
- **CMP message structure** — PKIMessage = PKIHeader + PKIBody + PKIProtection; PKIHeader carries sender/recipient DN, transaction ID, sender/recip nonces, senderKID; PKIBody carries the actual request (CRMF for cert requests); protection is either PBM-MAC (shared secret) or signature
- **CRMF (Certificate Request Message Format, RFC 4211)** — the payload inside a CMP cert-request body; carries the CertTemplate (subject, publicKey, validity, extensions) plus proof-of-possession field
- **Proof-of-possession (POP)** — proves the requester actually holds the private key matching the public key in the request; three modes: `signature` (sign the request), `encrCert` (CA encapsulates new cert under requester's pubkey, requester must decapsulate), `raVerified` (Registration Authority vouches)
- **RFC 9810 (July 2025) — CMP Updates for KEM** — adds KEM-aware proof-of-possession via encrCert mode; obsoletes RFC 4210; enables CMP enrollment of ML-KEM and other KEM keys that cannot sign
- **RFC 9881** — Algorithm Identifiers for ML-DSA in X.509 PKI; defines the OIDs the CA uses in its signatureAlgorithm field when signing certs with ML-DSA
- **RFC 9935** — Algorithm Identifiers for ML-KEM in X.509 PKI; defines OIDs for ML-KEM-512/768/1024 in subjectPublicKeyInfo; makes pure ML-KEM certs spec-conformant
- **RFC 9909** — Algorithm Identifiers for SLH-DSA in X.509 PKI; companion to RFC 9881 for stateless hash-based signatures
- **RFC 9936** — Use of ML-KEM in CMS; downstream consumer of ML-KEM certs in S/MIME
- **RFC 9629** — KEM algorithms in CMS (KEMRecipientInfo); upstream of RFC 9936
- **Composite signatures (draft-ietf-lamps-pq-composite-sigs-19)** and **composite KEMs (draft-ietf-lamps-pq-composite-kem-14)** — IETF drafts defining one certificate carrying both classical and PQC public keys under composite OIDs; OpenSSL 3.6 does not yet ship these; production deployments use parallel certs instead
- **PBM-MAC protection (RFC 4210 §5.1.3.1)** — Password-Based Message Authentication Code; shared-secret protection mode where the requester and CA share a one-time secret; HMAC over the PKIMessage header + body
- **Signature-based protection (RFC 4210 §5.1.3.3)** — protected by a signing key; requires both sides to have certificates and signing keys
- **Implicit confirm vs explicit certConf** — CMP normally requires a second round trip where the EE confirms it received the cert; if both sides agree, this can be skipped via the `implicitConfirm` extension in the IR header
- **In-process server (workshop architecture)** — the workshop's `cmp_simulation.c` shim connects a real `OSSL_CMP_CTX` client to a real `OSSL_CMP_SRV_CTX` server via `OSSL_CMP_CTX_set_transfer_cb`; both ends run in the same WASM process exchanging real PKIMessages without sockets, mirroring how `tls_simulation.c` connects TLS client and server via memory BIOs
- **Mock CA root** — generated once per browser via `generate_mock_ca_root` C shim: `EVP_PKEY_Q_keygen` for the ML-DSA-65 keypair, then `X509_sign(cert, key, NULL)` for self-signing (NULL md because ML-DSA refuses hash-then-sign); the result is cached in IndexedDB
- **EJBCA 9.1+** — Keyfactor's commercial CA was the first to ship production CMP enrollment with ML-DSA and ML-KEM in 2024
- **Production deployment pattern in 2026** — parallel chains: one PQC certificate (ML-DSA-65 EE → ML-DSA-65 root) + one classical certificate (ECDSA-P256 EE → ML-DSA-65 root), both for the same end-entity; used by Cloudflare, AWS, and others until composite OIDs stabilize

## Workshop / Interactive Activities

The workshop has 6 steps:

1. **Generate End-Entity Key** — uses `openssl genpkey` to create an ML-DSA-65 (or ML-KEM-768) keypair in the WASM filesystem; selected algorithm flows through to subsequent steps
2. **CMP Initial Request (ir)** — drives the real in-process CMP exchange via the `execute_cmp_simulation` shim: server callback parses the CRMF, builds a fresh X509 with the requested public key, signs with the CA's ML-DSA-65 key, returns a real PKIMessage IP; client validates protection and writes the issued cert to the FS; transcript shows every internal event from both sides
3. **EST simpleenroll** — exercises the EST-specific request/response shapes: PKCS#10 CSR via `openssl req`, mock CA signs via `openssl x509 -req`, response wrapped in PKCS#7 degenerate SignedData via `openssl crl2pkcs7`; transport is simulated (no real HTTP) because OpenSSL ships no EST client
4. **CMP KUR with ML-KEM (RFC 9810)** — runs ML-KEM-768 keygen, then enrolls the ML-KEM key via the same CMP IR flow (server signs with ML-DSA-65), then performs the encrCert POP round trip: CA encapsulates a shared secret under the new ML-KEM pubkey, EE decapsulates with the private key, both sides compare byte-for-byte; cert format conforms to RFC 9935
5. **Composite Enrollment (parallel certs)** — issues a second EE cert with an ECDSA-P256 key chained to the same mock CA root; shows the production hybrid PKI deployment pattern (parallel chains) side-by-side with the ML-DSA leg from Step 2; links to draft-ietf-lamps-pq-composite-sigs-19 for when true composite OIDs land
6. **Inspect Issued Certificate** — decodes the issued cert with `openssl x509 -text -noout` and verifies the chain with `openssl verify -CAfile root.crt`; works for whichever cert (ML-DSA from Step 2 or ECDSA from Step 5) was issued last

## Related Standards

- RFC 7030 (EST)
- RFC 4210 (CMP)
- RFC 9810 (CMP Updates for KEM)
- RFC 9480 (CMP Algorithms)
- RFC 9811 (CMP HSM Profile)
- RFC 4211 (CRMF)
- RFC 6712 (CMP over HTTP)
- RFC 9881 (ML-DSA in X.509)
- RFC 9935 (ML-KEM in X.509)
- RFC 9909 (SLH-DSA in X.509)
- RFC 9629 (KEM in CMS)
- RFC 9936 (ML-KEM in CMS)
- FIPS 203 (ML-KEM)
- FIPS 204 (ML-DSA)
- draft-ietf-lamps-pq-composite-sigs-19
- draft-ietf-lamps-pq-composite-kem-14
