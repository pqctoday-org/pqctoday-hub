# Software Supply Chain PQC

## Overview

The Software Supply Chain PQC module (40 minutes, intermediate, Industries track) reads the signature links of a software supply chain from the documents that govern them and says, for each, what the held edition states about post-quantum signatures and where it is silent. It covers a status map across Sigstore, the CA/Browser Forum code signing requirements, UEFI, COSE, CMS, X.509, OpenPGP, the SUIT manifest and ETSI TS 119 312; the TUF and Uptane update frameworks; SLSA v1.2 and in-toto provenance; and what the documents say about a verifier that has already shipped. Signing mechanics, container signing, boot chains, SUIT and device constraints, LMS and XMSS state management, SBOM formats and cryptographic inventories are covered in other modules.

## Key Concepts

### The chain

- NIST SP 800-218 (SSDF) task PS.2.1 asks that software integrity verification information be made available to software acquirers; its notional implementation examples include posting cryptographic hashes for release files on a well-secured website, using an established certificate authority for code signing so that consumers' operating systems or other tools and services can confirm the validity of signatures before use, and periodically reviewing the code signing processes, including certificate renewal, rotation, revocation and protection.
- NIST SP 800-204D says a robust software supply chain security programme needs artifacts such as a software bill of materials and frameworks for the attestation of software components; its section on attack targets notes that a developer's workstation typically holds cryptographic materials such as software artifact signing keys; and it says a common approach is to generate as much provenance data as possible.

### Status map

Labels describe what a document says about its own form (specified in an RFC, a draft, experimental, a requirement, recommended, or silent). Silent means the held text of one edition contains none of these terms: post-quantum, quantum, PQC, ML-DSA, SLH-DSA, Dilithium, SPHINCS, LMS, XMSS, hash-based signature, Kyber, ML-KEM; it does not say what anyone plans.

- The Sigstore algorithm registry lists ECDSA (P-256, P-384, P-521) and Ed25519 as sign/verify, lists RSA as sign/verify only at 3072 and 4096 bits (the 2048-bit RSA entries are verify only and not recommended), and lists ML-DSA-44, ML-DSA-65 and ML-DSA-87 as experimental ('Pure variant. Not yet fully functional.'), with the warning that they are currently not operational within Sigstore.
- The CA/Browser Forum Baseline Requirements for Code Signing Certificates v3.11 set root and subordinate CA keys at an RSA modulus of at least 4096 bits, ECDSA on NIST P-256, P-384 or P-521, or DSA with a 2048-bit key length (L) and a 224- or 256-bit modulus length (N), and subscriber code-signing and timestamp authority keys at an RSA modulus of at least 3072 bits, ECDSA on the same curves, or the same DSA options.
- The held text of the CA/Browser Forum Baseline Requirements for Code Signing Certificates v3.11 contains no post-quantum term.
- In the same requirements, a CA SHALL protect its private key in a system or device validated at least FIPS 140-2 level 3, FIPS 140-3 level 3, or an appropriate Common Criteria Protection Profile or Security Target, EAL 4 or higher.
- For code signing certificates, Signing Services SHALL protect subscriber private keys in a Hardware Crypto Module conforming to at least FIPS 140-2 level 3 or Common Criteria EAL 4+.
- Draft -37 of the SUIT manifest format (18 June 2026) says the authentication block contains a list of signatures or MACs of the manifest; that when several authentication blocks are present each must be computed over the same digest but with a different algorithm or signing/MAC authority; and that this feature also allows transition to new algorithms, such as post-quantum cryptography (PQC) algorithms.
- The UEFI Specification Release 2.11 (21 November 2024) says the Secure Boot platform key (PK) format shall be at least RSA-2048.
- The held text of the UEFI Specification Release 2.11 contains no post-quantum term.
- RFC 8778 specifies the conventions for using the HSS/LMS hash-based signature algorithm with COSE.
- RFC 9964 (Standards Track, May 2026) specifies JOSE and COSE serializations for ML-DSA, a post-quantum digital signature scheme defined in FIPS 204.
- A working-group Internet-Draft (draft-ietf-cose-sphincs-plus-10, 28 July 2026) specifies JOSE and COSE serializations for SLH-DSA (FIPS 205); it is a draft and is not yet an RFC.
- RFC 9708 specifies the conventions for using the HSS/LMS hash-based signature algorithm with the Cryptographic Message Syntax (CMS).
- RFC 9814 specifies the conventions for using the SLH-DSA signature algorithm with CMS.
- RFC 9882 specifies the conventions for using the ML-DSA signature algorithm with CMS, at ML-DSA-44, ML-DSA-65 and ML-DSA-87.
- RFC 9881 specifies the conventions for using ML-DSA in Internet X.509 certificates and CRLs.
- RFC 9909 specifies the conventions for using SLH-DSA in the X.509 Public Key Infrastructure.
- RFC 9802 specifies algorithm identifiers and ASN.1 encoding formats for the stateful hash-based signature schemes HSS, XMSS and XMSS^MT in X.509.
- RFC 9980 (June 2026) defines a post-quantum public key algorithm extension for OpenPGP, extending RFC 9580; for signatures it specifies the composite schemes ML-DSA-65+Ed25519 (MUST) and ML-DSA-87+Ed448 (SHOULD), and the standalone SLH-DSA schemes (MAY).
- ETSI TS 119 312 V2.1.1 says ML-DSA (FIPS 204), SLH-DSA (FIPS 205), and LMS (RFC 8554) and XMSS (RFC 8391) shall be used as recommended mechanisms; for LMS and XMSS it restricts use to deployment environments where state management can be strictly enforced, such as within a certified Hardware Security Module (HSM).

### Update frameworks

- The TUF specification (version 1.0.37) names four fundamental top-level roles, root, targets, snapshot and timestamp, plus one optional top-level role, mirrors; all roles can use one or more keys and require a threshold of signatures of the role's keys to trust a metadata file; the root role delegates trust to the keys of the other top-level roles; and the framework should provide means to minimize the impact of key compromise.
- In the TUF specification the snapshot role signs a metadata file listing the latest version of all targets metadata, which the specification says allows clients to know which metadata files have been updated and also prevents mix-and-match attacks; the timestamp role is an automated process that periodically signs a timestamped statement containing the hash of the snapshot file, to prevent an adversary from replaying an out-of-date signed metadata file whose signature has not yet expired.
- TUF says the root role's private keys must be kept very secure and should therefore be kept offline, that the targets role's signature (over metadata that describes the target files, not the files themselves) indicates which target files clients trust, and that the timestamp key must be kept online, with minimal risk to clients from its compromise.
- Among the goals of the TUF specification is that an attacker who is able to compromise a single key, or fewer than a given threshold of keys, cannot compromise clients, and that an attacker cannot trick clients into installing software older than the client previously knew to be available.
- In TUF, if fewer than a threshold of root keys are compromised the repository should revoke trust in the compromised keys, which a normal rotation of root keys can accomplish; if a threshold of root keys is compromised the root keys should be updated out-of-band, and the threshold should be chosen so that this is extremely unlikely.
- Uptane 2.1.0 describes Director and Image repositories, roles each mapped to public keys and a threshold of signatures, and public key identifiers that are either the public key value together with its algorithm (such as RSA or ECDSA) and signature scheme (such as rsassa-pss-sha256 or ecdsa-sha2-nistp256), or a secure hash over at least those components.
- In Uptane 2.1.0, full verification of metadata means that the ECU checks that the Targets metadata about images from the Director repository matches the Targets metadata about the same images from the Image repository, which the standard says provides resilience to a key compromise in the system; Primary ECUs shall perform full verification and Secondary ECUs should.
- Uptane's threat model includes attacks on update systems such as rollback (install an older valid revision), freeze (keep sending a properly signed but old bundle), endless data, and partial bundle installation, and it assumes an attacker who may compromise and control a Director or an Image repository server and its keys, but not both.
- NIST SP 800-193 says an authenticated update mechanism employs digital signatures to ensure the authenticity of the firmware update image, within guidelines built on protection, detection and recovery.
- RFC 9124 describes a signature element that protects the contents of the manifest against modification and offers authentication of the signer, and a monotonically increasing sequence number to prevent reverting a firmware update against the policies of the relevant authority.
  Counting, not a figure from a specification: a role that needs t signatures from n keys can be signed for alone by an attacker holding t or more of its keys, and not by an attacker holding fewer.

### Provenance and attestation

- SLSA v1.2 describes provenance as verifiable information about software artifacts describing where, when, and how something was produced, and defines a provenance predicate type within the in-toto attestation framework.
- In SLSA v1.2 the Build track has levels L0 to L3: Build L1 asks for provenance showing how the package was built (which may be incomplete or unsigned), Build L2 for signed provenance generated by a hosted build platform, and Build L3 for a hardened platform that keeps the secret material used to sign the provenance away from user-defined build steps; the page adds that alternate means of verifying the authenticity of the provenance are also acceptable.
- SLSA v1.2 says verification should include checking that the builder identity is one of the trusted builders, verifying the signature on the provenance envelope, and checking buildType and externalParameters against expected values; a verifier's roots of trust are likely a map from the builder's public key identity and builder.id to a SLSA Build level.
- The in-toto Statement binds an attestation to a particular subject (a set of software artifacts, each with a digest) and identifies the type of the predicate with a required predicateType URI.
- The 2026 minimum elements for a software bill of materials add an 'SBOM Author Signature', defined as a digital signature attributable to the SBOM author.
- The held text of SLSA v1.2 Build: Track Basics names no signature algorithm (it contains none of ECDSA, EdDSA, Ed25519, Ed448, RSA, DSA, ML-DSA, SLH-DSA, LMS or XMSS) and contains no post-quantum term.
- The held text of SLSA v1.2 Build: Provenance names no signature algorithm (it contains none of ECDSA, EdDSA, Ed25519, Ed448, RSA, DSA, ML-DSA, SLH-DSA, LMS or XMSS) and contains no post-quantum term.
- The held text of SLSA v1.2 Build: Verifying artifacts names no signature algorithm (it contains none of ECDSA, EdDSA, Ed25519, Ed448, RSA, DSA, ML-DSA, SLH-DSA, LMS or XMSS) and contains no post-quantum term.
- The held text of in-toto Attestation Statement layer specification (v1) names no signature algorithm (it contains none of ECDSA, EdDSA, Ed25519, Ed448, RSA, DSA, ML-DSA, SLH-DSA, LMS or XMSS) and contains no post-quantum term.

### Changing an algorithm after the verifier has shipped

- RFC 9019 says that, because RSA and ECC signature schemes may become vulnerable to quantum-accelerated key extraction, unchangeable bootloader code in ROM is recommended to use post-quantum secure signature schemes such as hash-based signatures; it says a bootloader author must carefully consider the service lifetime of the product and the time horizon for quantum-accelerated key extraction; and it lists a manifest parser that verifies a digital signature or MAC among the components a device needs for a firmware update solution.
- Draft -37 of the SUIT manifest format (18 June 2026) says the authentication block contains a list of signatures or MACs of the manifest; that when several authentication blocks are present each must be computed over the same digest but with a different algorithm or signing/MAC authority; and that this feature also allows transition to new algorithms, such as post-quantum cryptography (PQC) algorithms.
- Composite ML-DSA for use in X.509 Public Key Infrastructure is an Internet-Draft (draft-ietf-lamps-pq-composite-sigs-19, 21 April 2026) that defines combinations of ML-DSA with RSASSA-PKCS1-v1.5, RSASSA-PSS, ECDSA, Ed25519 and Ed448; use within CMS is left to a separate specification.
- RFC 9955 (informational) describes classification of design goals and security considerations for hybrid digital signature schemes, including non-separability of the component signatures and Simultaneous Verification.
- The CNSA 2.0 FAQ (version 2.2, October 2026) says that, from NIST SP 800-208, NSA has only approved LMS and XMSS for use in NSS and that the multi-tree algorithms HSS and XMSS^MT are not allowed; answers that ML-DSA may be used for firmware or software signing, adding that firmware roots of trust are a critical component to upgrade and NSA expects this to be implemented at the present time for some long-lived signatures, and that NSA wants this transition to begin now using LMS and XMSS whenever possible rather than wait for ML-DSA; and lists ML-DSA-87 for all classification levels.

## Workshop Activities

1. **Roles and Thresholds** — set the keys and threshold of each TUF role, or choose which Uptane repository an attacker controls, and see which roles the attacker can sign for, with the specification sentences behind each line
2. **Provenance Chain Check** — follow one artifact from build to verification, pick a signature algorithm and see which documents say something about it, and mark the verification checks the SLSA page lists
3. **Transition Planner** — choose a verifier, a transition option and a new algorithm, and see raw public key and signature sizes from the algorithm registry next to the sentences for each choice

## Related Standards

- NIST SP 800-218 (SSDF), NIST SP 800-204D, NIST SP 800-193
- Sigstore algorithm registry; CA/Browser Forum Baseline Requirements for Code Signing Certificates v3.11; UEFI Specification Release 2.11; ETSI TS 119 312 V2.1.1
- RFC 8778, RFC 9964, RFC 9708, RFC 9814, RFC 9882, RFC 9881, RFC 9909, RFC 9802, RFC 9980, RFC 9124, RFC 9019, RFC 9955; the SUIT manifest, SLH-DSA for JOSE and COSE and composite ML-DSA Internet-Drafts
- Uptane Standard 2.1.0; The Update Framework specification 1.0.37; SLSA v1.2 Build track pages; the in-toto Statement; the 2026 minimum elements for a software bill of materials
- CNSA 2.0 FAQ, FIPS 204, FIPS 205, NIST SP 800-208
