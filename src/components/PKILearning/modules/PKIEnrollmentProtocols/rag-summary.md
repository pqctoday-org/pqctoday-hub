# PKI Enrollment Protocols (EST and CMP)

## Overview

The PKI Enrollment Protocols module covers EST (Enrollment over Secure Transport, RFC 7030) and CMP (Certificate Management Protocol, RFC 9810, July 2025, which obsoletes RFC 4210 and adds support for KEM keys). These are the two protocols that actually carry a certificate request from a subscriber to a Certificate Authority and deliver the issued certificate back. The module covers what each protocol is, how they handle proof-of-possession for both signing keys and non-signing KEM keys, and how the standards have been updated for post-quantum cryptography. The workshop runs a real end-to-end CMP IR exchange in the browser: an in-process OSSL_CMP_SRV_CTX parses the CRMF cert template from the inbound IR, builds a fresh X509 with the requested ML-DSA-65 or ML-KEM-768 public key, signs it with the mock CA's ML-DSA-65 key, returns a real PKIMessage IP back through the same in-process transport. The separate key-update exercise sends KUR, recovers the encrypted KUP certificate, validates its key and issuing chain, and completes explicit certConf/PKIConfirm. A separate ML-DSA-65 signer authorizes that update; the ML-KEM key proves possession through recovery and confirmation. Both roles run locally with fictional materials and no external CA connection.

## Key Concepts

- **EST (RFC 7030, October 2013)** — Enrollment over Secure Transport; HTTPS-based; client POSTs a base64-encoded PKCS#10 CSR to `/.well-known/est/simpleenroll`; server returns base64-encoded PKCS#7 SignedData containing the issued cert; transport is TLS (TLS 1.1 or later in RFC 7030; RFC 8996 raises the minimum to TLS 1.2); proof-of-possession is the signed CSR itself (works for ML-DSA, does not work for ML-KEM)
- **CMP (RFC 4210, 2005 — obsoleted by RFC 9810 in July 2025)** — Certificate Management Protocol; HTTP-based with `application/pkixcmp` content type (RFC 9811, which obsoletes RFC 6712); richer state machine with Initial Request (`ir`), Cert Request (`cr`), Key Update Request (`kur`), Revocation Request (`rr`), General Message (`genm`)
- **CMP message structure** — PKIMessage = PKIHeader + PKIBody + PKIProtection; PKIHeader carries sender/recipient DN, transaction ID, sender/recip nonces, senderKID; PKIBody carries the actual request (CRMF for cert requests); protection follows RFC 9810 §5.1.3 (shared-secret MAC, DH key pairs, signature, key encapsulation or multiple protection); this module explains the shared-secret MAC and signature options
- **CRMF (Certificate Request Message Format, RFC 4211; updated for KEM POP by RFC 9883)** — the payload inside a CMP cert-request body; carries the CertTemplate (subject, publicKey, validity, extensions) plus proof-of-possession field
- **Proof-of-possession (POP)** — proves the requester actually holds the private key matching the public key in the request; RFC 9810 §5.2.8 defines `raVerified` (the Registration Authority vouches), a signature proof (POPOSigningKey) and, for keys that cannot sign, POPOPrivKey choices (`encrCert` and `challengeResp` as subsequent messages, `agreeMAC` and `encryptedKey`); this module demonstrates signature proof, encrypted-certificate recovery with explicit hash confirmation, and the separate pre-authorized raVerified initial-enrollment path
- **RFC 9810 (July 2025) — Internet X.509 PKI: Certificate Management Protocol (CMP)** — adds KEM-aware proof-of-possession via encrCert mode; obsoletes RFC 4210; enables CMP enrollment of ML-KEM and other KEM keys that cannot sign
- **RFC 9881** — Algorithm Identifiers for ML-DSA in X.509 PKI; defines the OIDs the CA uses in its signatureAlgorithm field when signing certs with ML-DSA
- **RFC 9935** — Algorithm Identifiers for ML-KEM in X.509 PKI; defines OIDs for ML-KEM-512/768/1024 in subjectPublicKeyInfo; makes pure ML-KEM certs spec-conformant
- **RFC 9909** — Algorithm Identifiers for SLH-DSA in X.509 PKI; companion to RFC 9881 for stateless hash-based signatures
- **RFC 9936** — Use of ML-KEM in CMS; downstream consumer of ML-KEM certs in S/MIME
- **RFC 9629** — KEM algorithms in CMS (KEMRecipientInfo); upstream of RFC 9936
- **Composite ML-DSA (RFC 10073)** defines composite signature algorithms for X.509/PKIX and includes a security caveat: not SUF-CMA secure against quantum adversaries. The **Composite ML-KEM** X.509 document is active Internet-Draft -23 (2026-10-14), submitted to the RFC Editor queue as a Proposed Standard, not yet an RFC. This workshop issues separate parallel certificates and does not create a composite certificate.
- **PBM-MAC protection (RFC 9810 §5.1.3.1)** — Password-Based Message Authentication Code; shared-secret protection mode where the requester and CA share a one-time secret; HMAC over the PKIMessage header + body
- **Signature-based protection (RFC 9810 §5.1.3.3)** — the sender possesses a signature key pair and signs the PKI message; PKIProtection contains the signature value and protectionAlg is a digital signature AlgorithmIdentifier
- **Implicit confirm vs explicit certConf** — CMP normally requires a second round trip where the EE confirms it received the cert; if both sides agree, this can be skipped via the `implicitConfirm` extension in the IR header
- **In-process server (workshop architecture)** — the workshop's `cmp_simulation.c` shim connects a real `OSSL_CMP_CTX` client to a real `OSSL_CMP_SRV_CTX` server via `OSSL_CMP_CTX_set_transfer_cb`; both ends run in the same WASM process exchanging real PKIMessages without sockets, mirroring how `tls_simulation.c` connects TLS client and server via memory BIOs
- **Mock CA root** — generated once per browser via `generate_mock_ca_root` C shim: `EVP_PKEY_Q_keygen` for the ML-DSA-65 keypair, then `X509_sign(cert, key, NULL)` for self-signing (NULL md because ML-DSA refuses hash-then-sign); the result is cached in IndexedDB for the initial-enrollment steps. The key-update exercise creates its own fresh fictional CA and signing identity, leaving that cached CA untouched
- **EJBCA product scope** — Keyfactor's 9.4.2 PQC guide says CMP `encrCert` POP for ML-KEM is supported as of EJBCA 9.1; the 9.6.2 supported-algorithms table lists ML-DSA over ACME, EST and CMP. Product/version/edition, CA profile and HSM support must be checked for each deployment.
- **Tested server capability** — EJBCA 9.6.3 interoperability covered ML-KEM-768 issuance and renewal using a separate ML-DSA-65 signing identity. Its acknowledgment accepted an incorrect certificate-confirmation hash in the test, so it is not used as proof of hash binding. The Hub exercise uses the opt-in modified CMP server that rejects incorrect confirmation; evaluate this behavior explicitly in production CA tooling.
- **Illustrative deployment pattern** — parallel chains: one PQC certificate (ML-DSA-65 EE → ML-DSA-65 root) + one classical certificate (ECDSA-P256 EE → ML-DSA-65 root), both for the same end-entity, a pattern this module uses while composite deployment and Composite ML-KEM (draft-23) adoption remain in progress; we found no source naming who deploys it. Both leaves chain to the ML-DSA-65 sample CA, so the ECDSA subject key does not make that chain usable by a classical-only validator

## Workshop / Interactive Activities

The workshop has 6 steps:

1. **Generate End-Entity Key** — uses `openssl genpkey` to create an ML-DSA-65 (or ML-KEM-768) keypair in the WASM filesystem; selected algorithm flows through to subsequent steps
2. **CMP Initial Request (ir)** — drives the real in-process CMP exchange via the `execute_cmp_simulation` shim: server callback parses the CRMF, builds a fresh X509 with the requested public key, signs with the CA's ML-DSA-65 key, returns a real PKIMessage IP; client validates protection and writes the issued cert to the FS; transcript shows every internal event from both sides
3. **EST simpleenroll** — exercises the EST-specific request/response shapes: PKCS#10 CSR via `openssl req`, mock CA signs via `openssl x509 -req`, response wrapped in PKCS#7 degenerate SignedData via `openssl crl2pkcs7`; transport is simulated (no real HTTP) because OpenSSL ships no EST client
4. **ML-KEM certificate key update** — provisions a fictional prior enrollment, a separately authorized ML-DSA-65 signing identity and a fresh ML-KEM-768 target key. The signed KUR names the prior certificate; the server checks that enrollment and subject, encrypts the new certificate to the new key, and accepts completion only after the client recovers it, validates it and confirms its hash. The alternative prior-enrollment case is rejected and failed operations return no certificate. This is actual CMP key update using the opt-in modified sample server, not a separate shared-secret comparison.
5. **Parallel certificate issuance** — issues a separate ECDSA-P256 subject certificate under the same ML-DSA-65 CA and compares it with the ML-DSA subject certificate. These are separate certificates, not a composite certificate; the ML-DSA issuer signature still requires a verifier that supports it. The sample helps learners distinguish subject-key choice, issuer signature and consumer compatibility. It links to RFC 10073 and the current -23 revision of the Composite ML-KEM Internet-Draft; the latter is in the RFC Editor queue, not yet published as an RFC.
6. **Inspect Issued Certificate** — decodes the issued cert with `openssl x509 -text -noout` and verifies the chain with `openssl verify -CAfile root.crt`; works for whichever cert (ML-DSA from Step 2 or ECDSA from Step 5) was issued last

## Related Standards

- RFC 7030 (EST)
- RFC 9810 (CMP — the current Certificate Management Protocol specification, July 2025)
- RFC 9483 (Lightweight CMP Profile)
- RFC 4210 (CMP, 2005 — obsoleted by RFC 9810)
- RFC 9480 (CMP Updates — obsoleted by RFC 9810 together with RFC 9811)
- RFC 4211 (CRMF)
- RFC 9883 (Proof-of-Possession of a KEM Key in CRMF, updates RFC 4211)
- RFC 9811 (CMP over HTTP — obsoletes RFC 6712 and, with RFC 9810, RFC 9480)
- RFC 8894 (SCEP)
- RFC 8555 (ACME)
- RFC 9881 (ML-DSA in X.509)
- RFC 9935 (ML-KEM in X.509)
- RFC 9909 (SLH-DSA in X.509)
- RFC 9629 (KEM in CMS)
- RFC 9936 (ML-KEM in CMS)
- RFC 10073 (Composite ML-DSA in X.509 PKI)
- FIPS 203 (ML-KEM)
- FIPS 204 (ML-DSA)
- draft-ietf-lamps-pq-composite-kem
