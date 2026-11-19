# Software Bill of Materials (SBOM)

## Overview

The SBOM module teaches general software-component inventory within a stated scope. Coverage depends on how the SBOM is generated and maintained; do not assume it lists every dependency. It is distinct from cryptographic-asset inventory (CBOM) and cross-tool cryptographic-mechanism name normalization (CycloneDX Cryptography Registry). The module covers SPDX and CycloneDX, NTIA and CISA minimum-element guidance, VEX for vulnerability-status communication, procurement and regulatory scope, and how SBOM data can contribute to broader crypto-asset discovery.

## Key Concepts

- **SBOM** — a machine-readable inventory of software components within a product's stated scope, with information such as names, versions, supplier or producer, and dependency relationships. It helps answer "what is in this build?"; it does not by itself identify all cryptographic assets.
- **Formats** — SPDX is an international open standard (ISO/IEC 5962:2021). CycloneDX is an OWASP community specification; CycloneDX 1.6 was published as ECMA-424. They have different schemas and tool support; neither should be described as universally more complete.
- **NTIA 2021 minimum elements** — seven data fields: Supplier Name, Component Name, Version of the Component, Other Unique Identifiers, Dependency Relationship, Author of SBOM Data, and Timestamp. NTIA's framing applies the first five to components; the author and timestamp describe the SBOM.
- **CISA 2026 update** — CISA published v2.1 on 29 July 2026 with NSA, FBI, and 15 international partner agencies. It revises or replaces several 2021 elements, adds ten (seven document-level and three per-component), clarifies existing fields, and removes Access Control as a standalone element. It is current CISA guidance, not a blanket legal requirement for every organization.
- **Generator selection** — output varies by tool release, ecosystem, lock file, and configuration. A format choice does not guarantee all required values or compliance. Inspect the generated artifact against the applicable CISA guidance and contract or regulation; use the module's linked tool documentation.
- **VEX** — Vulnerability Exploitability eXchange communicates product status and rationale for a vulnerability. OASIS CSAF 2.0 Profile 5 includes statuses such as known affected, known not affected, fixed, or under investigation. A VEX statement supports triage but does not prove exploitability or non-exploitability by itself.
- **Regulatory scope** — Executive Order 14028 directed federal software supply-chain security work, including the original NTIA elements. OMB M-22-18 says agencies may require SBOMs in solicitations based on software criticality or agency determination; it is not a blanket requirement for every federal software vendor. The EU Cyber Resilience Act applies to in-scope products and includes an SBOM in a commonly used machine-readable format covering at least top-level dependencies. Its general application date is 11 December 2027, with earlier dates for specified provisions.
- **SBOM-to-CBOM bridge** — an SBOM can contribute component and dependency data to crypto-asset discovery alongside scanner results, certificate and key inventories, runtime observation, and manual investigation. It is not a complete CBOM by itself or a mandatory single input.

## Standards & Sources

SPDX / ISO/IEC 5962:2021, CycloneDX 1.6 / ECMA-424, NTIA Minimum Elements for an SBOM (2021), CISA 2026 Minimum Elements for an SBOM v2.1, OASIS CSAF 2.0 (VEX Profile), Executive Order 14028, OMB M-22-18, and EU Cyber Resilience Act (Regulation EU 2024/2847).
