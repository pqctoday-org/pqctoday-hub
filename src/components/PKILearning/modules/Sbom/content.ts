// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the SBOM module.
 *
 * Scope boundary (deliberate): this module teaches the general software
 * component inventory discipline — not cryptographic-asset inventory (CBOM,
 * a sibling module) and not cross-tool crypto-mechanism naming normalization
 * (CycloneDX Cryptography Registry, another sibling module). See the
 * `bridge` narrative for the explicit hand-off.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'sbom',
  lastReviewed: '2026-08-24',
  version: '1.0.0',
  lastEdited: '2026-11-18',

  standards: [
    getStandard('SPDX-Spec-ISO-5962'),
    getStandard('CycloneDX-Spec-Overview'),
    // Repointed 2026-08-22: this declared the DEPRECATED row `NTIA-SBOM-Minimum-Elements-2021`,
    // whose superseded_by names CISA's 2026 revision. A module pointing the accuracy
    // check at a retired row is worse than pointing it nowhere — the check runs, reads
    // a superseded document, and reports success. (De-duplicated 2026-08-23: this module
    // already cited the CISA row separately for its own reasons — the 'What changed in
    // 2026' section compares it against the NTIA original — so the repoint above landed
    // as a second, redundant entry rather than a net-new citation. The NTIA-2021 content
    // stays in prose only, same as this codebase's established RFC-8446-in-prose pattern.)
    getStandard('2026-Minimum-Elements-for-a-Software-Bill-of-Materials-SBOM'),
    getStandard('OASIS-CSAF-2.0-VEX'),
    getStandard('EO-14028'),
    getStandard('EU-CRA-REG-2024-2847'),
  ],

  algorithms: [],

  deadlines: [
    {
      label: 'Federal agencies may require an SBOM in software solicitations under OMB M-22-18',
      year: 2022,
      source: 'OMB Memorandum M-22-18',
    },
    {
      label: 'EU CRA full SBOM/technical-documentation obligation applies (11 Dec 2027)',
      year: 2027,
      source: 'EU Cyber Resilience Act (Regulation EU 2024/2847)',
    },
  ],

  narratives: {
    overview:
      'A Software Bill of Materials (SBOM) is a machine-readable inventory of software components within a product’s stated scope, with fields such as component names, versions, suppliers or producers, and dependency relationships. Coverage depends on how it is generated and maintained; an SBOM should not be assumed to include every dependency. It helps answer “what is in this build?” It does not by itself identify every cryptographic algorithm, key, certificate, or runtime use; those require additional CBOM and discovery evidence.',
    formats:
      'SPDX (the ISO/IEC 5962 international standard) and CycloneDX (an OWASP community specification; CycloneDX 1.6 was published as ECMA-424) are widely used machine-readable BOM formats. Both represent software components and relationships, and their schemas differ in structure and available fields; compare the versions and downstream tool support required by your workflow instead of assuming one format is universally more complete. This module compares their general software-inventory use. Cryptographic asset inventory is covered by the CBOM module, and CycloneDX algorithm and curve-name normalization by the CycloneDX Cryptography Registry module.',
    elements:
      'NTIA’s 2021 "Minimum Elements for a Software Bill of Materials" defined seven data fields: Supplier Name, Component Name, Version of the Component, Other Unique Identifiers, Dependency Relationship, Author of SBOM Data, and Timestamp. The NTIA framing distinguishes the first five as component fields; Author of SBOM Data and Timestamp describe the SBOM itself. CISA, with NSA, FBI, and 15 international partner cyber agencies, finalized a successor on 29 July 2026 — the "2026 Minimum Elements for a Software Bill of Materials" v2.1 — that replaces or renames several of the 2021 elements, adds ten new elements (including SBOM Author Signature, Component Hash Value/Algorithm, SBOM Tool Name/Version, SBOM Data Format Name/Version, and Component License), and clarifies the scope of existing elements. Treat v2.1 as the current CISA guidance; it is guidance, and the obligations applicable to a particular organization depend on its contract or regulation.',
    whatsNew2026:
      'The 2021 minimum elements remained the baseline for about five years while SBOM tooling matured — the 2026 update provides a revised set of elements. Ten elements are new: seven document-level (SBOM Author Signature, SBOM Data Format Name, SBOM Data Format Version, SBOM Tool Name, SBOM Tool Version, SBOM Version, SBOM Generation Context) and three per-component (Component Hash Algorithm, Component Hash Value, Component License). Existing elements are revised rather than carried over unchanged: Appendix B replaces Supplier Name with Component Producer, Other Unique Identifiers with Component Identifiers, Author of SBOM Data with SBOM Author, and Version of the Component with Component Version, and removes the Access Control element. Check anything built against the 2021 baseline against Appendix B.',
    toolingGap2026: '',
    vex: 'An SBOM lists components; it does not establish whether a vulnerable code path is reachable in a particular product. VEX (Vulnerability Exploitability eXchange) communicates a product’s status for a vulnerability and the supporting rationale. OASIS CSAF 2.0 defines a VEX profile with product statuses such as known affected, known not affected, fixed, or under investigation. A VEX statement is evidence for triage, not proof by itself that a vulnerability is or is not exploitable.',
    regulation:
      'US federal procurement requirements are contract- and agency-specific: OMB Memorandum M-22-18 says agencies may require an SBOM in solicitations based on software criticality or agency determination, and points to NTIA minimum-elements guidance or a CISA successor. Executive Order 14028 directed federal software supply-chain security work, including development of the original NTIA elements; it is not a blanket rule that every vendor selling software to the federal government must provide an SBOM. The EU Cyber Resilience Act (Regulation EU 2024/2847) requires manufacturers of in-scope products with digital elements to document components and vulnerabilities, including an SBOM in a commonly used machine-readable format covering at least top-level dependencies. The general application date is 11 December 2027, subject to earlier application dates for specified provisions.',
    bridge:
      'In this module\'s staged model, an SBOM is one possible discovery input, not a CBOM output. Crypto-asset discovery combines SBOM dependency data with certificate and key inventories, scanner results, runtime observation, and manual investigation. If the question is "what cryptographic algorithms and keys does this component use," see the CBOM module. If the question is "what does this vendor call ML-KEM in their KMIP inventory versus their TLS stack," see the CycloneDX Cryptography Registry module.',
  },
}
