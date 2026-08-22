// SPDX-License-Identifier: GPL-3.0-only
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
  version: '1.0.0',
  lastReviewed: '2026-08-22',

  standards: [
    getStandard('SPDX-Spec-ISO-5962'),
    getStandard('CycloneDX-Spec-Overview'),
    // The NTIA 2021 minimum elements row is DEPRECATED in the library, superseded by
    // CISA's 2026 revision. Repointed 2026-08-22.
    getStandard('2026-Minimum-Elements-for-a-Software-Bill-of-Materials-SBOM'),
    getStandard('2026-Minimum-Elements-for-a-Software-Bill-of-Materials-SBOM'),
    getStandard('OASIS-CSAF-2.0-VEX'),
    getStandard('EO-14028'),
    getStandard('EU-CRA-REG-2024-2847'),
  ],

  algorithms: [],

  deadlines: [
    {
      label: 'US federal software suppliers must provide an SBOM',
      year: 2021,
      source: 'Executive Order 14028',
    },
    {
      label: 'EU CRA full SBOM/technical-documentation obligation applies (11 Dec 2027)',
      year: 2027,
      source: 'EU Cyber Resilience Act (Regulation EU 2024/2847)',
    },
  ],

  narratives: {
    overview:
      'A Software Bill of Materials (SBOM) is a machine-readable inventory of every software component a build depends on — packages, libraries, and their versions, suppliers, and dependency relationships. It answers "what is in this build?" It does not answer "what cryptography is inside it?" — that is a separate question the CBOM module answers by extending the software inventory with cryptographic fields.',
    formats:
      "SPDX (Linux Foundation; standardized as ISO/IEC 5962:2021) and CycloneDX (OWASP; standardized as ECMA-424) are the two general-purpose BOM formats. SPDX grew out of license-compliance tooling and has the deeper license/provenance model; CycloneDX grew out of application-security tooling and is the more extensible object model, with sibling BOM types (SaaSBOM, HBOM, ML-BOM, VDR/VEX) built on the same schema. Which format to pick for a cryptographic inventory specifically is the CBOM module's question, not this one — and CycloneDX's own algorithm/curve-naming registry is covered by the CycloneDX Cryptography Registry module, not here.",
    elements:
      'NTIA\'s 2021 "Minimum Elements for a Software Bill of Materials" defined seven required fields per component: Supplier Name, Component Name, Version, Other Unique Identifiers, Dependency Relationship, Author of SBOM Data, and Timestamp. CISA, with NSA, FBI, and 15 international partner cyber agencies, finalized a successor on 29 July 2026 — the "2026 Minimum Elements for a Software Bill of Materials" v2.1 — that preserves those seven while adding ten new required elements (among them SBOM Author Signature, Component Hash Value/Algorithm, SBOM Tool Name/Version, SBOM Data Format Name/Version, and Component License) and clarifying scope on eight more. Treat the 2026 v2.1 elements as the current baseline; the 2021 set remains useful context for anything built against the original EO 14028 mandate.',
    whatsNew2026:
      'The 2021 minimum elements went unchanged for four years while SBOM tooling matured well past what they were designed for — the 2026 update closes that gap. Ten elements are newly required: seven document-level (SBOM Author Signature, SBOM Data Format Name, SBOM Data Format Version, SBOM Tool Name, SBOM Tool Version, SBOM Version, SBOM Generation Context) and three per-component (Component Hash Algorithm, Component Hash Value, Component License). Eight more existing elements gained clarified scope — SBOM Author, Component Producer, Component Identifiers, and Component Version among them — without changing what they require. None of the original seven were removed or redefined; this is a strict superset, not a breaking change to anything built against the 2021 baseline.',
    toolingGap2026:
      "Checking seven real generators' actual current default output (not the format's theoretical capability) against these ten elements finds none fully compliant yet: npm's native `npm sbom` comes closest at 9 of 10 (missing only the signature); pip-audit trails furthest behind at 2 of 10 and still emits the older CycloneDX 1.4 schema. Two gaps are universal across every tool checked — none sign the SBOM automatically, and Generation Context has no clean mapping in any of them. This is an August 2026 snapshot, not a fixed verdict: expect coverage to climb as SBOM tooling catches up to the new baseline, so re-verify a specific tool's current release before treating this as a compliance decision.",
    vex: "An SBOM lists what is present; it says nothing about whether a listed component's known vulnerabilities are actually reachable in this product. VEX (Vulnerability Exploitability eXchange, defined as Profile 5 of OASIS CSAF 2.0) closes that gap with a machine-readable affected/not-affected/fixed/under-investigation statement per CVE per product — turning a raw CVE-in-my-SBOM alert into a triage decision instead of a fire drill.",
    regulation:
      'Two mandates drive SBOM adoption: US Executive Order 14028 (May 2021) requires software vendors selling to the federal government to provide an SBOM, which is what produced the NTIA minimum-elements work. The EU Cyber Resilience Act (Regulation EU 2024/2847) requires manufacturers of products with digital elements to maintain an SBOM covering top-level dependencies, with the main obligations applying from 11 December 2027.',
    bridge:
      'An SBOM is Phase 1 input, not a Phase 2 output: it is one of the existing data sources a discovery effort should integrate rather than rebuild from scratch. Cross-referencing SBOM data against a certificate management system, a crypto scanner, and manual investigation is how a CBOM gets built (Phase 2) — skipping that cross-reference is a named common failure ("ignoring the SBOM-CBOM linkage"). If the question is "what cryptographic algorithms and keys does this component use," see the CBOM module. If the question is "what does this vendor call ML-KEM in their KMIP inventory versus their TLS stack," see the CycloneDX Cryptography Registry module.',
  },
}
