# PKI Enrollment Protocols — In Simple Terms

## What This Is About

Before a device, app, or person can use a digital certificate, it needs to enroll with a Certificate Authority. Enrollment protocols carry a request, public key, proof-of-possession or other authorization, and the issued certificate. Common protocols include **EST** (RFC 7030), **CMP** (RFC 9810), **SCEP** (RFC 8894), and **ACME** (RFC 8555); their workflows and supported key types differ.

## Why It Matters

Post-quantum migration changes key sizes, signature sizes, certificate encoding, and proof-of-possession. The amount of added data depends on the selected algorithms and encoding; it is not a fixed multiplier for every request or certificate. ML-KEM keys cannot sign a PKCS#10 request, so that format's signature proof-of-possession does not apply. RFC 9810 (July 2025) defines CMP methods for KEM-key proof-of-possession, including an encrypted-certificate method in which the client decapsulates, decrypts the issued certificate, and confirms its hash.

## The Key Takeaway

EST and CMP offer different enrollment workflows; SCEP and ACME address other deployment needs. RFCs define protocol mechanisms, while implementation and CA-profile support vary by product and version. The browser workshop exercises a local mock CA and does not establish interoperability with an external CA or production deployment readiness.

## What's Happening

Keyfactor's EJBCA 9.4.2 PQC guide says CMP `encrCert` proof-of-possession for ML-KEM is supported as of EJBCA 9.1; the EJBCA 9.6.2 algorithm table lists ML-DSA support via ACME, EST, and CMP. Verify version, edition, CA profile, and HSM support for a real deployment. Composite ML-DSA is specified by RFC 10073, with its security caveats. Composite ML-KEM remains an Internet-Draft at revision 23 (October 14, 2026), submitted to the RFC Editor queue as a Proposed Standard; it is not yet an RFC.

Sources: [RFC 10073](https://www.rfc-editor.org/rfc/rfc10073.html), [Composite ML-KEM draft status](https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-kem/), [EJBCA 9.4.2 PQC guide](https://docs.keyfactor.com/ejbca/9.4.2/post-quantum-cryptography-keys-and-signatures), and [EJBCA 9.6.2 supported algorithms](https://docs.keyfactor.com/ejbca/9.6.2/supported-algorithms).
