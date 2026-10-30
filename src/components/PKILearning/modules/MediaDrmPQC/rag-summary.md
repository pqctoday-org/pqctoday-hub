# Media, Entertainment & DRM PQC

## Overview

The Media, Entertainment & DRM PQC module (60 minutes, intermediate, Industries track) reads four editions as they are written and asks, link by link, which public-key primitive each uses and what its text says about quantum computing: the AACS Introduction and Common Cryptographic Elements Book (Revision 0.953, 26 October 2012), the CI Plus Specification v1.3.2 (March 2015), the MovieLabs Specification for Enhanced Content Protection, Version 1.4 (August 2024), and the C2PA Technical Specification, Version 2.4. It adds a 2023 paper on three streaming DRM systems, RFC 10024 for hybrid key agreement in TLS 1.3, and NIST IR 8547 (October 2026). Other editions and generations of these schemes are not covered.

## Key Concepts

- **Threat model.** A compromised device is part of the threat model. ECP describes ripping software as enabled by "hack one, hack all" scenarios: breaking protection on one device can break it on a wide class of devices. ECP is a set of high-level specifications from MovieLabs, and each studio decides which practices it requires.
- **What ECP asks for.** Limiting a compromise to one platform, binding license keys to a device, revoking and renewing clients and revoking devices or classes of devices, a content cipher of AES 128 or better, a secure media pipeline from decryption to protected output, support for a requirement of HDCP 2.2 or better for specific content, forensic watermarking, separate content keys and keeping content off public CDNs until needed, the ability for operators to restrict content when devices stop receiving security updates, and certification by third parties and trusted implementers.
- **AACS key ladder.** Device Keys (128 bits each) are given to a device at manufacture; subsidiary Device Keys and Processing Keys come from the AES-G3 function; AACS LA generates the Media Key Block; a device recovers the 128-bit Media Key with AES-128D under a Processing Key. An updated Media Key Block revokes compromised Device Keys. All digital signatures use ECDSA (ANSI X9.62, FIPS 186-2) with SHA-1; the Bus Key in drive authentication is derived from exchanged elliptic-curve points. Implementing the specification requires a license from AACS LA LLC.
- **CI Plus.** The specification addresses content protection after conditional access protection is removed, where content leaves the CA module and re-enters the host. Authentication signatures are RSASSA-PSS with 2048-bit RSA and SHA-1 (MGF1 with SHA-1, 20-byte salt); key negotiation is Diffie-Hellman with 2048-bit values, with the parameters held in the CI Plus Licensee Specification; the scrambler is DES-56 in ECB mode (mandatory) or AES-128 in CBC mode (optional for the CICAM, mandatory for HD hosts); SHA-256 is used for derived values such as the UCK. Host Revocation is revocation by denial of service, through a Service Operator Certificate Revocation List created by the Root-of-Trust at a Service Operator's request.
- **Streaming.** RFC 10024 (IETF Standards Track, August 2026) defines three hybrid key agreement mechanisms for TLS 1.3: X25519MLKEM768, SecP256r1MLKEM768 and SecP384r1MLKEM1024. Cloudflare reported in the last week of October 2025 that the majority of human-initiated traffic with Cloudflare was using post-quantum encryption. A 2023 paper (arXiv preprint, version 3, 3 August 2023) identifies an absence of post-quantum security in Widevine, FairPlay and PlayReady and urges the transition to post-quantum algorithms for license distribution and authentication.
- **C2PA.** Version 2.4 allows ES256, ES384, ES512, PS256, PS384, PS512 and EdDSA (Ed25519 only) for new claim signatures; the deprecated list is empty. The claim signature is a COSE_Sign1_Tagged structure; time-stamps (RFC 3161, sigTst2) are optional; a C2PA Trust List and a TSA Trust List are kept; validation checks credential revocation information. RFC 9964 specifies COSE serializations for ML-DSA; the SLH-DSA equivalent is an Internet-Draft.
- **Central distinction.** The text of each edition read does not mention quantum computing. That is a statement about a document; it says nothing about what any organisation plans.
- **NIST IR 8547.** NIST will deprecate quantum-vulnerable public-key cryptography after 2030 and disallow its use under NIST standards and guidelines after 2035 (Tables 2 and 4 list ECDSA, EdDSA, RSA, Diffie-Hellman and MQV, and RSA key establishment). These dates are NIST's schedule for NIST standards; the media documents read here state no deadline of their own.

## Workshop Activities

1. **Key Ladder Explorer** — walk the AACS or CI Plus ladder and see which rungs use a public-key primitive of a kind NIST IR 8547 lists
2. **Spec vs Quantum** — compare what four editions specify and what their text says about quantum computing
3. **Provenance Algorithm Check** — test candidate algorithms against the C2PA 2.4 allowed list

## Related Standards

- AACS Introduction and Common Cryptographic Elements Book, Revision 0.953 — Library: AACS-Introduction-and-Common-Cryptographic-Elements-Book-Rev
- CI Plus Specification v1.3.2 — Library: CI-Plus-Spec-v1.3.2
- MovieLabs Specification for Enhanced Content Protection v1.4 — Library: MovieLabs-ECP-v1-4
- C2PA Technical Specification 2.4 — Library: Content-Credentials-C2PA-Technical-Specification-Version-2-4
- RFC 10024 (hybrid key agreement for TLS 1.3), RFC 9964 (ML-DSA for JOSE and COSE), RFC 3161 (time-stamp protocol)
- NIST IR 8547, NIST SP 800-57 Part 1 Revision 5, FIPS 203, FIPS 204, FIPS 205
