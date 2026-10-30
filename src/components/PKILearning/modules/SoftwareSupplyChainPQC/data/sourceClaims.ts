// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Sentences the lessons make about named documents. Each one rests on one Library document (`sourceId` is its
 * reference id) and is the only place its wording lives: lessons, workshop notes and summaries render from here.
 */

export interface SourceClaim {
  id: string
  text: string
  /** Library reference id of the document the sentence rests on */
  sourceId: string
  /** Edition of the document, as the claim was read */
  edition: string
  /** Where in the document the sentence rests */
  locator: string
}

export const SOURCE_CLAIMS = {
  'SC-1.1': {
    id: 'SC-1.1',
    text: "NIST SP 800-218 (SSDF) task PS.2.1 asks that software integrity verification information be made available to software acquirers; its notional implementation examples include posting cryptographic hashes for release files on a well-secured website, using an established certificate authority for code signing so that consumers' operating systems or other tools and services can confirm the validity of signatures before use, and periodically reviewing the code signing processes, including certificate renewal, rotation, revocation and protection.",
    sourceId: 'NIST SP 800-218',
    edition: 'NIST SP 800-218 v1.1',
    locator: 'PS.2.1 table (Release Integrity)',
  },
  'SC-1.2': {
    id: 'SC-1.2',
    text: "NIST SP 800-204D says a robust software supply chain security programme needs artifacts such as a software bill of materials and frameworks for the attestation of software components; its section on attack targets notes that a developer's workstation typically holds cryptographic materials such as software artifact signing keys; and it says a common approach is to generate as much provenance data as possible.",
    sourceId: 'NIST-SP-800-204D',
    edition: 'NIST SP 800-204D, February 2024',
    locator: 'Scope; Attack Targets; workflows',
  },
  'SC-2.1': {
    id: 'SC-2.1',
    text: "The Sigstore algorithm registry lists ECDSA (P-256, P-384, P-521) and Ed25519 as sign/verify, lists RSA as sign/verify only at 3072 and 4096 bits (the 2048-bit RSA entries are verify only and not recommended), and lists ML-DSA-44, ML-DSA-65 and ML-DSA-87 as experimental ('Pure variant. Not yet fully functional.'), with the warning that they are currently not operational within Sigstore.",
    sourceId: 'Sigstore-Algorithm-Registry',
    edition: 'Sigstore architecture-docs algorithm registry, living page',
    locator: 'algorithm table; warning line',
  },
  'SC-2.2': {
    id: 'SC-2.2',
    text: 'The CA/Browser Forum Baseline Requirements for Code Signing Certificates v3.11 set root and subordinate CA keys at an RSA modulus of at least 4096 bits, ECDSA on NIST P-256, P-384 or P-521, or DSA with a 2048-bit key length (L) and a 224- or 256-bit modulus length (N), and subscriber code-signing and timestamp authority keys at an RSA modulus of at least 3072 bits, ECDSA on the same curves, or the same DSA options.',
    sourceId: 'CABF-Code-Signing-BR-v3-11',
    edition: 'CA/Browser Forum Code Signing BR v3.11',
    locator: '6.1.5.1 and 6.1.5.2',
  },
  'SC-2.2n': {
    id: 'SC-2.2n',
    text: 'The held text of the CA/Browser Forum Baseline Requirements for Code Signing Certificates v3.11 contains no post-quantum term.',
    sourceId: 'CABF-Code-Signing-BR-v3-11',
    edition: 'CA/Browser Forum Code Signing BR v3.11',
    locator: 'whole document',
  },
  'SC-2.3': {
    id: 'SC-2.3',
    text: 'In the same requirements, a CA SHALL protect its private key in a system or device validated at least FIPS 140-2 level 3, FIPS 140-3 level 3, or an appropriate Common Criteria Protection Profile or Security Target, EAL 4 or higher.',
    sourceId: 'CABF-Code-Signing-BR-v3-11',
    edition: 'CA/Browser Forum — Baseline Requirements for Code Signing Certificates v3.11.0',
    locator: '6.2.7.1',
  },
  'SC-2.4': {
    id: 'SC-2.4',
    text: 'For code signing certificates, Signing Services SHALL protect subscriber private keys in a Hardware Crypto Module conforming to at least FIPS 140-2 level 3 or Common Criteria EAL 4+.',
    sourceId: 'CABF-Code-Signing-BR-v3-11',
    edition: 'CA/Browser Forum — Baseline Requirements for Code Signing Certificates v3.11.0',
    locator: '6.2.7.3',
  },
  'SC-2.5': {
    id: 'SC-2.5',
    text: 'Draft -37 of the SUIT manifest format (18 June 2026) says the authentication block contains a list of signatures or MACs of the manifest; that when several authentication blocks are present each must be computed over the same digest but with a different algorithm or signing/MAC authority; and that this feature also allows transition to new algorithms, such as post-quantum cryptography (PQC) algorithms.',
    sourceId: 'draft-ietf-suit-manifest',
    edition: 'draft-ietf-suit-manifest-37, 18 June 2026 (Internet-Draft)',
    locator: '5.2 Authentication Block; manifest authentication',
  },
  'SC-2.6': {
    id: 'SC-2.6',
    text: 'The UEFI Specification Release 2.11 (21 November 2024) says the Secure Boot platform key (PK) format shall be at least RSA-2048.',
    sourceId: 'UEFI-SPEC-2.10-SecureBoot',
    edition: 'UEFI Specification Release 2.11, 21 Nov 2024',
    locator: 'Secure Boot requirements',
  },
  'SC-2.6n': {
    id: 'SC-2.6n',
    text: 'The held text of the UEFI Specification Release 2.11 contains no post-quantum term.',
    sourceId: 'UEFI-SPEC-2.10-SecureBoot',
    edition: 'UEFI Specification Release 2.11',
    locator: 'whole document',
  },
  'SC-2.7a': {
    id: 'SC-2.7a',
    text: 'RFC 8778 specifies the conventions for using the HSS/LMS hash-based signature algorithm with COSE.',
    sourceId: 'RFC 8778',
    edition: 'RFC 8778, April 2020, Standards Track',
    locator: 'Abstract',
  },
  'SC-2.7b': {
    id: 'SC-2.7b',
    text: 'RFC 9964 (Standards Track, May 2026) specifies JOSE and COSE serializations for ML-DSA, a post-quantum digital signature scheme defined in FIPS 204.',
    sourceId: 'RFC-9964',
    edition: 'RFC 9964, May 2026, Standards Track',
    locator: 'Abstract',
  },
  'SC-2.7c': {
    id: 'SC-2.7c',
    text: 'A working-group Internet-Draft (draft-ietf-cose-sphincs-plus-10, 28 July 2026) specifies JOSE and COSE serializations for SLH-DSA (FIPS 205); it is a draft and is not yet an RFC.',
    sourceId: 'SLH-DSA-for-JOSE-and-COSE',
    edition: 'draft-ietf-cose-sphincs-plus-10, 28 July 2026',
    locator: 'Abstract; About This Document',
  },
  'SC-2.8a': {
    id: 'SC-2.8a',
    text: 'RFC 9708 specifies the conventions for using the HSS/LMS hash-based signature algorithm with the Cryptographic Message Syntax (CMS).',
    sourceId: 'RFC 9708',
    edition: 'RFC 9708, January 2025',
    locator: 'Abstract',
  },
  'SC-2.8b': {
    id: 'SC-2.8b',
    text: 'RFC 9814 specifies the conventions for using the SLH-DSA signature algorithm with CMS.',
    sourceId: 'RFC 9814',
    edition: 'RFC 9814, July 2025, Standards Track',
    locator: 'Abstract',
  },
  'SC-2.8c': {
    id: 'SC-2.8c',
    text: 'RFC 9882 specifies the conventions for using the ML-DSA signature algorithm with CMS, at ML-DSA-44, ML-DSA-65 and ML-DSA-87.',
    sourceId: 'RFC 9882',
    edition: 'RFC 9882, October 2025, Standards Track',
    locator: 'Abstract; Introduction',
  },
  'SC-2.9a': {
    id: 'SC-2.9a',
    text: 'RFC 9881 specifies the conventions for using ML-DSA in Internet X.509 certificates and CRLs.',
    sourceId: 'RFC 9881',
    edition: 'Algorithm Identifiers for ML-DSA in X.509 PKI',
    locator: 'Abstract',
  },
  'SC-2.9b': {
    id: 'SC-2.9b',
    text: 'RFC 9909 specifies the conventions for using SLH-DSA in the X.509 Public Key Infrastructure.',
    sourceId: 'RFC-9909',
    edition: 'Profile for Use of SLH-DSA in the Internet X.509 PKI',
    locator: 'Abstract',
  },
  'SC-2.9c': {
    id: 'SC-2.9c',
    text: 'RFC 9802 specifies algorithm identifiers and ASN.1 encoding formats for the stateful hash-based signature schemes HSS, XMSS and XMSS^MT in X.509.',
    sourceId: 'RFC 9802',
    edition: 'Use of HSS and XMSS Hash-Based Signature Algorithms in X.509 PKI',
    locator: 'Abstract',
  },
  'SC-2.10': {
    id: 'SC-2.10',
    text: 'RFC 9980 (June 2026) defines a post-quantum public key algorithm extension for OpenPGP, extending RFC 9580; for signatures it specifies the composite schemes ML-DSA-65+Ed25519 (MUST) and ML-DSA-87+Ed448 (SHOULD), and the standalone SLH-DSA schemes (MAY).',
    sourceId: 'RFC 9980',
    edition: 'RFC 9980, June 2026',
    locator: 'Abstract; 5 Algorithm Specifications',
  },
  'SC-2.11': {
    id: 'SC-2.11',
    text: 'ETSI TS 119 312 V2.1.1 says ML-DSA (FIPS 204), SLH-DSA (FIPS 205), and LMS (RFC 8554) and XMSS (RFC 8391) shall be used as recommended mechanisms; for LMS and XMSS it restricts use to deployment environments where state management can be strictly enforced, such as within a certified Hardware Security Module (HSM).',
    sourceId: 'ETSI-TS-119-312-V2-1-1-Electronic-Signatures-and-Trust-Infra',
    edition: 'ETSI TS 119 312 V2.1.1 (2026-06)',
    locator: '6.2.2.5 to 6.2.2.7',
  },
  'SC-3.1': {
    id: 'SC-3.1',
    text: 'Uptane 2.1.0 describes Director and Image repositories, roles each mapped to public keys and a threshold of signatures, and public key identifiers that are either the public key value together with its algorithm (such as RSA or ECDSA) and signature scheme (such as rsassa-pss-sha256 or ecdsa-sha2-nistp256), or a secure hash over at least those components.',
    sourceId: 'Uptane-Standard-2-1-0',
    edition: 'Uptane Standard 2.1.0',
    locator: 'Repository requirements; metadata; key identifiers',
  },
  'SC-3.2': {
    id: 'SC-3.2',
    text: "Uptane's threat model includes attacks on update systems such as rollback (install an older valid revision), freeze (keep sending a properly signed but old bundle), endless data, and partial bundle installation, and it assumes an attacker who may compromise and control a Director or an Image repository server and its keys, but not both.",
    sourceId: 'Uptane-Standard-2-1-0',
    edition: 'Uptane Standard 2.1.0',
    locator: 'Threat model',
  },
  'SC-3.3': {
    id: 'SC-3.3',
    text: "The TUF specification (version 1.0.37) names four fundamental top-level roles, root, targets, snapshot and timestamp, plus one optional top-level role, mirrors; all roles can use one or more keys and require a threshold of signatures of the role's keys to trust a metadata file; the root role delegates trust to the keys of the other top-level roles; and the framework should provide means to minimize the impact of key compromise.",
    sourceId: 'TUF-Specification-v1-0-37',
    edition: 'The Update Framework Specification 1.0.37, 8 Oct 2026',
    locator: '5 Roles and metadata; goals',
  },
  'SC-3.4': {
    id: 'SC-3.4',
    text: 'NIST SP 800-193 says an authenticated update mechanism employs digital signatures to ensure the authenticity of the firmware update image, within guidelines built on protection, detection and recovery.',
    sourceId: 'NIST-SP-800-193',
    edition: 'NIST SP 800-193, May 2018',
    locator: '3.5.1; 1 Introduction',
  },
  'SC-3.5': {
    id: 'SC-3.5',
    text: 'RFC 9124 describes a signature element that protects the contents of the manifest against modification and offers authentication of the signer, and a monotonically increasing sequence number to prevent reverting a firmware update against the policies of the relevant authority.',
    sourceId: 'RFC-9124',
    edition: 'RFC 9124, January 2022, Informational',
    locator: '3.2; 3.15',
  },
  'SC-3.6': {
    id: 'SC-3.6',
    text: 'In the TUF specification the snapshot role signs a metadata file listing the latest version of all targets metadata, which the specification says allows clients to know which metadata files have been updated and also prevents mix-and-match attacks; the timestamp role is an automated process that periodically signs a timestamped statement containing the hash of the snapshot file, to prevent an adversary from replaying an out-of-date signed metadata file whose signature has not yet expired.',
    sourceId: 'TUF-Specification-v1-0-37',
    edition: 'The Update Framework Specification 1.0.37, 8 Oct 2026',
    locator: '2.1.3 Snapshot role; 2.1.4 Timestamp role',
  },
  'SC-3.7': {
    id: 'SC-3.7',
    text: "TUF says the root role's private keys must be kept very secure and should therefore be kept offline, that the targets role's signature (over metadata that describes the target files, not the files themselves) indicates which target files clients trust, and that the timestamp key must be kept online, with minimal risk to clients from its compromise.",
    sourceId: 'TUF-Specification-v1-0-37',
    edition: 'The Update Framework Specification 1.0.37, 8 Oct 2026',
    locator: '2.1.1 Root role; 2.1.2 Targets role; 2.1.4 Timestamp role',
  },
  'SC-3.8': {
    id: 'SC-3.8',
    text: 'Among the goals of the TUF specification is that an attacker who is able to compromise a single key, or fewer than a given threshold of keys, cannot compromise clients, and that an attacker cannot trick clients into installing software older than the client previously knew to be available.',
    sourceId: 'TUF-Specification-v1-0-37',
    edition: 'The Update Framework Specification 1.0.37, 8 Oct 2026',
    locator: '1.5.2 goals (key compromises; rollback attacks)',
  },
  'SC-3.9': {
    id: 'SC-3.9',
    text: 'In TUF, if fewer than a threshold of root keys are compromised the repository should revoke trust in the compromised keys, which a normal rotation of root keys can accomplish; if a threshold of root keys is compromised the root keys should be updated out-of-band, and the threshold should be chosen so that this is extremely unlikely.',
    sourceId: 'TUF-Specification-v1-0-37',
    edition: 'The Update Framework Specification 1.0.37, 8 Oct 2026',
    locator: '2.1.1 Root role',
  },
  'SC-3.10': {
    id: 'SC-3.10',
    text: 'In Uptane 2.1.0, full verification of metadata means that the ECU checks that the Targets metadata about images from the Director repository matches the Targets metadata about the same images from the Image repository, which the standard says provides resilience to a key compromise in the system; Primary ECUs shall perform full verification and Secondary ECUs should.',
    sourceId: 'Uptane-Standard-2-1-0',
    edition: 'Uptane Standard 2.1.0',
    locator: '5.4.4.2 Full verification',
  },
  'SC-4.1': {
    id: 'SC-4.1',
    text: 'In SLSA v1.2 the Build track has levels L0 to L3: Build L1 asks for provenance showing how the package was built (which may be incomplete or unsigned), Build L2 for signed provenance generated by a hosted build platform, and Build L3 for a hardened platform that keeps the secret material used to sign the provenance away from user-defined build steps; the page adds that alternate means of verifying the authenticity of the provenance are also acceptable.',
    sourceId: 'SLSA-v1-2-Build-Track-Basics',
    edition: 'SLSA specification v1.2, Build: Track Basics (Status: Approved)',
    locator: 'Build levels table; L1; L2; L3; footnote',
  },
  'SC-4.2': {
    id: 'SC-4.2',
    text: 'SLSA v1.2 describes provenance as verifiable information about software artifacts describing where, when, and how something was produced, and defines a provenance predicate type within the in-toto attestation framework.',
    sourceId: 'SLSA-v1-2-Build-Provenance',
    edition: 'SLSA specification v1.2, Build: Provenance (Status: Approved)',
    locator: 'opening; Model',
  },
  'SC-4.3': {
    id: 'SC-4.3',
    text: "SLSA v1.2 says verification should include checking that the builder identity is one of the trusted builders, verifying the signature on the provenance envelope, and checking buildType and externalParameters against expected values; a verifier's roots of trust are likely a map from the builder's public key identity and builder.id to a SLSA Build level.",
    sourceId: 'SLSA-v1-2-Build-Verifying-Artifacts',
    edition: 'SLSA specification v1.2, Verifying artifacts (Status: Approved)',
    locator: 'How to verify; Step 1',
  },
  'SC-4.4': {
    id: 'SC-4.4',
    text: 'The in-toto Statement binds an attestation to a particular subject (a set of software artifacts, each with a digest) and identifies the type of the predicate with a required predicateType URI.',
    sourceId: 'in-toto-Attestation-Statement-v1',
    edition: 'in-toto attestation, spec v1, Statement layer',
    locator: 'whole page',
  },
  'SC-4.5': {
    id: 'SC-4.5',
    text: "The 2026 minimum elements for a software bill of materials add an 'SBOM Author Signature', defined as a digital signature attributable to the SBOM author.",
    sourceId: '2026-Minimum-Elements-for-a-Software-Bill-of-Materials-SBOM',
    edition: '2026 Minimum Elements for a Software Bill of Materials (SBOM), 29 July 2026',
    locator: 'New SBOM elements',
  },
  'SC-4.6n': {
    id: 'SC-4.6n',
    text: 'The held text of SLSA v1.2 Build: Track Basics names no signature algorithm (it contains none of ECDSA, EdDSA, Ed25519, Ed448, RSA, DSA, ML-DSA, SLH-DSA, LMS or XMSS) and contains no post-quantum term.',
    sourceId: 'SLSA-v1-2-Build-Track-Basics',
    edition: 'SLSA specification v1.2, Build: Track Basics (Status: Approved)',
    locator: 'whole page',
  },
  'SC-4.7n': {
    id: 'SC-4.7n',
    text: 'The held text of SLSA v1.2 Build: Provenance names no signature algorithm (it contains none of ECDSA, EdDSA, Ed25519, Ed448, RSA, DSA, ML-DSA, SLH-DSA, LMS or XMSS) and contains no post-quantum term.',
    sourceId: 'SLSA-v1-2-Build-Provenance',
    edition: 'SLSA specification v1.2, Build: Provenance (Status: Approved)',
    locator: 'whole page',
  },
  'SC-4.8n': {
    id: 'SC-4.8n',
    text: 'The held text of SLSA v1.2 Build: Verifying artifacts names no signature algorithm (it contains none of ECDSA, EdDSA, Ed25519, Ed448, RSA, DSA, ML-DSA, SLH-DSA, LMS or XMSS) and contains no post-quantum term.',
    sourceId: 'SLSA-v1-2-Build-Verifying-Artifacts',
    edition: 'SLSA specification v1.2, Verifying artifacts (Status: Approved)',
    locator: 'whole page',
  },
  'SC-4.9n': {
    id: 'SC-4.9n',
    text: 'The held text of in-toto Attestation Statement layer specification (v1) names no signature algorithm (it contains none of ECDSA, EdDSA, Ed25519, Ed448, RSA, DSA, ML-DSA, SLH-DSA, LMS or XMSS) and contains no post-quantum term.',
    sourceId: 'in-toto-Attestation-Statement-v1',
    edition: 'in-toto attestation, spec v1, Statement layer',
    locator: 'whole page',
  },
  'SC-5.1': {
    id: 'SC-5.1',
    text: 'RFC 9019 says that, because RSA and ECC signature schemes may become vulnerable to quantum-accelerated key extraction, unchangeable bootloader code in ROM is recommended to use post-quantum secure signature schemes such as hash-based signatures; it says a bootloader author must carefully consider the service lifetime of the product and the time horizon for quantum-accelerated key extraction; and it lists a manifest parser that verifies a digital signature or MAC among the components a device needs for a firmware update solution.',
    sourceId: 'RFC 9019',
    edition: 'RFC 9019, April 2021, Informational',
    locator: 'bootloader considerations; device features',
  },
  'SC-5.2a': {
    id: 'SC-5.2a',
    text: 'Composite ML-DSA for use in X.509 Public Key Infrastructure is an Internet-Draft (draft-ietf-lamps-pq-composite-sigs-19, 21 April 2026) that defines combinations of ML-DSA with RSASSA-PKCS1-v1.5, RSASSA-PSS, ECDSA, Ed25519 and Ed448; use within CMS is left to a separate specification.',
    sourceId: 'draft-ietf-lamps-pq-composite-sigs-19',
    edition: 'draft-ietf-lamps-pq-composite-sigs-19, 21 April 2026',
    locator: 'Abstract; datatracker status',
  },
  'SC-5.2b': {
    id: 'SC-5.2b',
    text: 'RFC 9955 (informational) describes classification of design goals and security considerations for hybrid digital signature schemes, including non-separability of the component signatures and Simultaneous Verification.',
    sourceId: 'RFC-9955-Hybrid-Signature-Spectrums',
    edition: 'RFC 9955, 2026, Informational',
    locator: 'Abstract',
  },
  'SC-5.3': {
    id: 'SC-5.3',
    text: 'The CNSA 2.0 FAQ (version 2.2, October 2026) says that, from NIST SP 800-208, NSA has only approved LMS and XMSS for use in NSS and that the multi-tree algorithms HSS and XMSS^MT are not allowed; answers that ML-DSA may be used for firmware or software signing, adding that firmware roots of trust are a critical component to upgrade and NSA expects this to be implemented at the present time for some long-lived signatures, and that NSA wants this transition to begin now using LMS and XMSS whenever possible rather than wait for ML-DSA; and lists ML-DSA-87 for all classification levels.',
    sourceId: 'NSA CNSA 2.0 FAQ',
    edition: 'CNSA 2.0 FAQ Ver. 2.2, October 2026',
    locator: 'Q&A on HSS/XMSSMT; ML-DSA for firmware; algorithm table',
  },
} as const satisfies Record<string, SourceClaim>

export type SourceClaimId = keyof typeof SOURCE_CLAIMS

export function claimText(id: SourceClaimId): string {
  // eslint-disable-next-line security/detect-object-injection
  return SOURCE_CLAIMS[id].text
}
