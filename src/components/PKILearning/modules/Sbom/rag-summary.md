# Software Bill of Materials (SBOM)

## Overview

The SBOM module teaches the general software component inventory discipline — what a build depends on: packages, libraries, their versions, suppliers, and dependency relationships. It is deliberately scoped away from cryptographic-asset inventory (the CBOM module, which extends the SBOM concept with algorithm/key/certificate fields) and away from cross-tool cryptographic-mechanism naming normalization (the CycloneDX Cryptography Registry module). The module covers the two general BOM formats (SPDX and CycloneDX), NTIA's minimum elements, VEX for vulnerability triage, the two regulatory drivers (EO 14028 and the EU Cyber Resilience Act), and an explicit bridge explaining when to hand off to CBOM or to the Cryptography Registry.

## Key Concepts

- **SBOM** — a machine-readable inventory of every software component a build depends on. Answers "what is in this build," not "what cryptography is inside it" (that's CBOM).
- **Format landscape** — SPDX (Linux Foundation; ISO/IEC 5962:2021) has the deeper license/provenance model; CycloneDX (OWASP; ECMA-424) is the more extensible object model with sibling BOM types (SaaSBOM, HBOM, ML-BOM, VDR/VEX). Neither has a general-purpose cryptography model — that gap and CycloneDX's crypto extension are covered by CBOM, not here.
- **NTIA minimum elements** — seven required fields (2021 baseline): Supplier Name, Component Name, Version, Other Unique Identifiers, Dependency Relationship, Author of SBOM Data, Timestamp.
- **2026 update** — CISA finalized a successor on 29 July 2026 (v2.1, co-authored with NSA, FBI, and 15 international partner cyber agencies): a strict superset adding ten new required elements (seven document-level — SBOM Author Signature, SBOM Data Format Name/Version, SBOM Tool Name/Version, SBOM Version, SBOM Generation Context — and three per-component — Component Hash Algorithm, Component Hash Value, Component License) plus clarified scope on eight existing elements. Nothing from 2021 was removed or redefined.
- **2026 tooling gap** — as of August 2026, verification against seven real generators' actual default output found none fully compliant with the ten new elements: npm's native `npm sbom` leads at 9/10 (missing only the signature); pip-audit trails at 2/10 and still emits CycloneDX 1.4. No tool signs the SBOM automatically, and Generation Context has no clean mapping anywhere. Expected to improve as SBOM tooling matures against the new baseline — a snapshot, not a fixed verdict.
- **VEX** — Vulnerability Exploitability eXchange, Profile 5 of OASIS CSAF 2.0. Machine-readable affected/not-affected/fixed/under-investigation statement per CVE per product, closing the gap between "a CVE exists in a listed component" and "that CVE is actually reachable here."
- **Regulatory drivers** — US Executive Order 14028 (May 2021) requires federal software vendors to provide an SBOM; the EU Cyber Resilience Act (Regulation EU 2024/2847) requires SBOM coverage of top-level dependencies for products with digital elements, with main obligations applying from 11 December 2027. Neither mandate is PQC-specific.
- **SBOM-to-CBOM bridge** — an SBOM is Phase 1 discovery input, one of the existing data sources a crypto-discovery effort should cross-reference rather than rebuild. Ignoring that linkage is a named common failure in PQC migration programs.

## Standards & Sources

SPDX / ISO/IEC 5962:2021, CycloneDX / ECMA-424, NTIA Minimum Elements for a SBOM (2021), CISA 2026 Minimum Elements for a SBOM v2.1, OASIS CSAF 2.0 (VEX Profile), Executive Order 14028, EU Cyber Resilience Act (Regulation EU 2024/2847), ENISA SBOM Adoption State of Play 2026, India CERT-In Technical Guidelines on SBOM/QBOM/CBOM/AIBOM/HBOM v2.0.
