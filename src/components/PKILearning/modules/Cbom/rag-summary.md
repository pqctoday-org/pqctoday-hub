# Cryptography Bill of Materials (CBOM)

## Overview

The CBOM module teaches how to build, normalize, and operate a Cryptography Bill of Materials — a machine-readable inventory of every cryptographic asset (algorithms, keys, certificates, protocols and their configurations) and how they relate to software components. The CBOM extends the SBOM and is Phase 2 of the post-quantum migration lifecycle: cryptographic discovery (Phase 1) feeds it, and risk scoring (Phase 3) consumes it. The module covers format choice and governance, layered discovery including untracked "ghost" cryptography, key identity and provenance, the normalization of inconsistent mechanism nomenclatures, and machine-verifiable policy-as-code.

## Key Concepts

- **CBOM** — a machine-readable cryptographic inventory that extends the SBOM; the EU NIS Cooperation Group's Coordinated Implementation Roadmap v1.1 (11 June 2025) sets an end-2026 milestone for Member States whose First Steps include mature cryptographic asset management, recommending CBOM as the format. It is guidance to Member States, not a direct requirement on organisations.
- **Format landscape** — CycloneDX (OWASP; standardized as ECMA-424; current spec v1.7 with a Cryptography Registry) is the practical CBOM format because SPDX 3.0.1 (Linux Foundation; ISO/IEC 5962) has no dedicated cryptography object model yet. The PKI Consortium CBOM-Profiles Working Group (launched 8 June 2026) is building a neutral, open methodology mapping profiles onto both formats.
- **Ghost cryptography** — every cryptographic usage not in any inventory (shadow IT, forgotten certificates, hardcoded algorithms, embedded/OT crypto). "You cannot migrate what you cannot find."
- **Layered discovery** — five complementary layers: source code (sonar-cryptography / CBOMkit, IBM Quantum Safe Explorer), binary/container (CBOMkit-theia), network/traffic (passive handshake capture + active scanning), infrastructure/runtime (HSM/KMS, certificate lifecycle, CT logs), and cloud (KMS/cert APIs + CSPM). Reuse existing scanners and agents as sources; scan net-new only where blind.
- **Key identity** — assigned identifiers (PKCS#11 CKA_ID, KMIP Unique Identifier, KMS key-id, JWK kid) are local and don't correlate; content-derived identifiers (X.509 SKI/SPKI hash, KMIP Digest, JWK Thumbprint RFC 7638, KCV for symmetric keys) do. The SPKI fingerprint is the join key across systems.
- **Key provenance** — attestation proves a key was generated in hardware and is non-exportable (HSM/TPM attestation, Android Key Attestation, FIDO2/WebAuthn); record whether a key is software-, HSM-, or cloud-KMS-managed because it drives risk and migration feasibility.
- **Codification & normalization** — the same mechanism is named differently across OID, PKCS#11, KMIP, IETF/IANA (TLS/SSH/IPsec), JOSE/COSE and crypto libraries. PQC multiplies parameters per mechanism and proliferates OIDs (ML-DSA uses one OID per parameter set with parameters absent, RFC 9881); hybrid and composite ciphers add combination × nomenclature. Normalize onto a canonical model (CycloneDX Cryptography Registry) without over-collapsing security-relevant parameters.
- **Machine-verifiable** — policy-as-code (CBOMkit OPA/Rego) classifies each asset quantum-safe / quantum-vulnerable / na / unknown over a REST API. Secure the CBOM itself — it is a map of an organization's weakest cryptography.

## Standards & Sources

CycloneDX / ECMA-424, OWASP CBOM Authoritative Guide, SPDX / ISO/IEC 5962, NIST SP 1800-38, PQCA CBOMkit, PKI Consortium CBOM-Profiles + PQCMM, NIST IR 8547, EU NIS CG Coordinated Implementation Roadmap v1.1 (2025), RFC 9881, RFC 7512/7638/5280, OASIS PKCS#11 / KMIP, CERT-In Technical Guidelines v2.0.
