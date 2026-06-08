---
generated: 2026-06-07
collection: vendor-roadmaps
enrichment_method: mlx-mlx-community/Qwen3.6-27B-8bit
source: public/vendor-roadmaps/
---

# Vendor PQC Roadmap Enrichments

## VND-009 — Citrix Systems Inc.

- **Vendor ID**: VND-009
- **Vendor Name**: Citrix Systems Inc.
- **Roadmap Title**: Leading the quantum-ready transition: How NetScaler helps prevent a silent data breach decades in the making
- **Roadmap URL**: https://www.citrix.com/blogs/2025/07/30/leading-the-quantum-ready-transition/
- **Publish Date**: 2025-07-30
- **Local File**: public/vendor-roadmaps/VND-009_Citrix_Systems_Inc..html
- **CSV Coverage Notes**: Official Citrix blog laying out NetScaler's PQC transition plan: hybrid NIST-aligned PQC (X25519 + ML-KEM768), private tech preview April 2025, general availability August 2025 (v14.1.51), plus a recommended customer migration timeline (Q2 2025 test in non-prod, Q3 2025 map critical systems, Q4 2025 phased rollout) and industry deadlines (2030 phase-out of deprecated crypto, 2035 fully disallowed). | Milestone: NetScaler hybrid PQC (X25519 + ML-KEM768) generally available since August 2025 via v14.1.51; recommended customer phased rollout through Q4 2025.
- **Roadmap Scope**: Single product
- **PQC Algorithms Announced**: ML-KEM
- **Target Migration Dates**: Q2 2025 test in non-prod; Q3 2025 map critical systems; Q4 2025 phased rollout; 2030 phase-out of deprecated crypto; 2035 fully disallowed
- **Products / Services Covered**: NetScaler
- **Compliance Frameworks**: NIST; FIPS 140-3 Level 2; FIPS 140-2 Level 1
- **Hybrid Mode Support**: Yes; NIST-aligned hybrid post-quantum cryptography (X25519 + ML-KEM768)
- **Current GA Status**: GA
- **Customer Action Required**: Begin internal validation in non-production environments; identify and map critical systems; begin phased rollout
- **Key Commitments & Quotes**: "NetScaler became the first application delivery platform to offer NIST-aligned hybrid post-quantum cryptography (X25519 + ML-KEM768) through a Private Tech Preview"
- **Coverage Verification**: CONSISTENT; The document confirms the hybrid algorithm, preview/GA dates, and customer timeline, though it does not explicitly state version number v14.1.51.
- **Extraction Quality**: HIGH
- **Source Document**: VND-009_Citrix_Systems_Inc..html (242.7 KB)
- **Extraction Timestamp**: 2026-06-07T23:32:24

## VND-259 — Cellcrypt Limited

- **Vendor ID**: VND-259
- **Vendor Name**: Cellcrypt Limited
- **Roadmap Title**: Store Now, Decrypt Later: The Quantum Computing Threat (PQC strategy & phased migration)
- **Roadmap URL**: https://www.cellcrypt.com/post/post-quantum-cryptography-and-the-store-now-decrypt-later-threat/
- **Publish Date**: 2024-10-17
- **Local File**: public/vendor-roadmaps/VND-259_Cellcrypt_Limited.html
- **CSV Coverage Notes**: Cellcrypt's blog 'Store Now, Decrypt Later' (17 Oct 2024) lays out its dual-layer PQC strategy combining CRYSTALS-Kyber (ML-KEM, lattice-based) with Classic McEliece (code-based) plus an agile post-quantum crypto layer for easy algorithm replacement, and includes a 12-month phased migration roadmap (Phase 1 inventory/months 1-2; Phase 2 hybrid deployment/months 3-6; Phase 3 PQ-only or dual-layer migration + audit/months 7-12). Modules certified FIPS 140-3 Level 3. | Milestone: Dual-layer PQC (CRYSTALS-Kyber + Classic McEliece) with agile crypto layer live in product; FIPS 140-3 Level 3 validat
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; CRYSTALS-Kyber; Classic McEliece
- **Target Migration Dates**: 12-month phased migration (Phase 1: Months 1-2; Phase 2: Months 3-6; Phase 3: Months 7-12)
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: NIST; FIPS 140-3 Level 3
- **Hybrid Mode Support**: Yes; Hybrid approaches (classical + PQ) provide backward compatibility during transition
- **Current GA Status**: Planned
- **Customer Action Required**: Begin phased rollout to key exchange mechanisms immediately; Inventory current encryption usage; Identify long-lived secrets and retention policies
- **Key Commitments & Quotes**: "Cellcrypt implements a dual-layer PQ architecture that composes: CRYSTALS-Kyber (ML-KEM)... Classic McEliece"
- **Coverage Verification**: PARTIAL; The document confirms the dual-layer strategy, algorithms, and 12-month roadmap, but does not mention an "agile post-quantum crypto layer" or "FIPS 140-3 Level 3" certification.
- **Extraction Quality**: HIGH
- **Source Document**: VND-259_Cellcrypt_Limited.html (43.1 KB)
- **Extraction Timestamp**: 2026-06-07T23:33:51

## VND-027 — Microsoft Corporation

- **Vendor ID**: VND-027
- **Vendor Name**: Microsoft Corporation
- **Roadmap Title**: Microsoft Quantum-Safe Security: Progress Towards Next-Generation Cryptography
- **Roadmap URL**: https://www.microsoft.com/en-us/security/blog/2025/08/20/quantum-safe-security-progress-towards-next-generation-cryptography/
- **Publish Date**: 2025-08-20
- **Local File**: public/vendor-roadmaps/VND-027_Microsoft_Corporation.html
- **CSV Coverage Notes**: Microsoft quantum-safe roadmap: SymCrypt foundation with ML-KEM/ML-DSA exposed through Windows CNG and certificate APIs; SymCrypt 1.9.0 adds TLS hybrid key exchange (coming to Windows TLS stack). PQC previewing for Windows Insiders and Linux. Three-phase strategy (foundational libs -> core infra/Entra/key mgmt/signing -> all services Windows/Azure/M365). Early adoption by 2029, full transition by 2033. | Milestone: ML-KEM and ML-DSA available via Windows APIs (CNG/Certificate funcs); SymCrypt 1.9.0 supports TLS hybrid key exchange; early adoption by 2029, full transition by 2033 (ahead of 2035
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; FrodoKEM
- **Target Migration Dates**: Early adoption by 2029; full transition by 2033
- **Products / Services Covered**: SymCrypt; Windows; Linux; Microsoft Azure; Microsoft 365; Microsoft Entra; Azure Key Vault; Windows TLS stack
- **Compliance Frameworks**: NIST; CNSA 2.0; CNSSP-15; ISO; IETF; OMB; CISA; NSA
- **Hybrid Mode Support**: Yes; TLS hybrid key exchange and hybrid approach combining classical and quantum-resistant algorithms
- **Current GA Status**: Preview
- **Customer Action Required**: Start developing their strategy now
- **Key Commitments & Quotes**: "Microsoft’s roadmap aims to complete transition of its services and products by 2033"; "aiming to enable early adoption of quantum-safe capabilities by 2029"; "we’ve enabled TLS hybrid key exchange as per the latest IETF internet draft"
- **Coverage Verification**: CONSISTENT; The document explicitly confirms the SymCrypt foundation, ML-KEM/ML-DSA availability via CNG/Certificate APIs, TLS hybrid key exchange in SymCrypt 1.9.0, preview status for Windows Insiders/Linux, the three-phase strategy, and the 2029/2033 timelines.
- **Extraction Quality**: HIGH
- **Source Document**: VND-027_Microsoft_Corporation.html (313.6 KB)
- **Extraction Timestamp**: 2026-06-07T23:34:42

## VND-164 — Qualys Inc.

- **Vendor ID**: VND-164
- **Vendor Name**: Qualys Inc.
- **Roadmap Title**: Qualys CertView/Platform: PQC Detection Support
- **Roadmap URL**: https://docs.qualys.com/en/certview/latest/assets_certificates/pqc_details.htm
- **Publish Date**: 2026-04-01
- **Local File**: public/vendor-roadmaps/VND-164_Qualys_Inc..html
- **CSV Coverage Notes**: Qualys provides PQC scanning/detection capability: QID 38994 reports server support for PQC (KEM) key-exchange algorithms; coverage spans VM, Certificate View, WAS, EASM and authenticated VM scans. Doc is current (April 2026 copyright). User documentation for an existing capability rather than a forward-looking roadmap; no specific algorithm names or future milestone dates listed. | Milestone: PQC key-exchange detection across VM, CertView, WAS, EASM and VM_AUTH scans via QID 38994 (reports whether a server supports PQC KEM key exchange).
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: VM, Certificate View, WAS, EASM, VM_AUTH
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: No
- **Current GA Status**: GA
- **Customer Action Required**: Include QID 38994 in option profile
- **Key Commitments & Quotes**: "QID 38994 reports whether the server supports the PQC key exchange algorithm."
- **Coverage Verification**: CONSISTENT; The document confirms QID 38994 usage, lists the specified scan sources (VM, Certificate View, WAS, EASM, VM_AUTH), and matches the April 2026 copyright date.
- **Extraction Quality**: HIGH
- **Source Document**: VND-164_Qualys_Inc..html (56.4 KB)
- **Extraction Timestamp**: 2026-06-07T23:37:38
