# PQC Governance & Policy

## Overview

The PQC Governance & Policy module teaches executives how to establish organizational governance structures for post-quantum cryptography migration. It covers RACI matrix construction for PQC program roles, cryptographic policy generation with compliance-aligned templates, KPI dashboard design for tracking migration progress, and escalation frameworks for conflict resolution. The module emphasizes cross-functional coordination between CISO, CTO, Enterprise Architect, Development, Compliance, and Procurement teams.

## Key Concepts

- **RACI Matrix** — Responsible, Accountable, Consulted, Informed assignment matrix mapping 10 migration activities (crypto inventory, risk assessment, vendor assessment, algorithm selection, testing, deployment, monitoring, training & awareness, compliance auditing, stakeholder communications) across 6 organizational roles. Includes validation that warns when activities lack an Accountable assignment.
- **Governance Models** — three approaches: Centralized (single crypto authority), Federated (distributed decision-making with guidelines), and Hybrid (centralized policy with federated execution)
- **Escalation & Conflict Resolution** — four-level escalation path: Working Group (5 days) → Steering Committee (10 days) → Executive Sponsor CISO/CTO (5 days) → Board/Risk Committee (formal risk acceptance)
- **Policy Hierarchy** — four-level framework: Enterprise Cryptographic Policy (top-level mandates), Key Management Policy (lifecycle and rotation), Vendor Crypto Requirements (supply chain obligations), Migration Timeline Policy (deadlines and phase gates)
- **KPI Dashboard** — six key performance indicators: systems inventoried, algorithms migrated, vendor readiness, compliance gaps closed, training completion, budget utilization
- **Policy Templates** — pre-structured documents with fill-in fields for organization name, effective dates, applicable frameworks, approved algorithms (ML-KEM-512/768/1024, HQC, FrodoKEM, ML-DSA-44/65/87, FN-DSA, SLH-DSA, LMS, XMSS), prohibited algorithms, migration-required algorithms (Ed25519, Ed448, RSA ≥ 3072), and exception processes
- **Compliance Integration** — policies auto-populated with frameworks from the user's assessment (CNSA 2.0, NIST, ETSI, ANSSI) and country-specific deadlines
- **Governance Authority** — references OMB Memorandum M-23-02 (2022) and EO 14412 / OMB M-26-15 (June 2026) for U.S. federal civilian agency governance structures (NSA CNSA 2.0 FAQ v2.2 governs National Security Systems; EU PQC Roadmap v1.1 is advisory Member State guidance; DORA/NIS2 impose cyber risk-management duties rather than fixed PQC cutoff dates)

## Workshop / Interactive Activities

The workshop has 4 interactive steps:

1. **RACI Matrix** — interactive 10×6 matrix with color-coded click-to-cycle cells (click cycles: empty → R → A → C → I → empty); includes validation warning for missing or conflicting Accountable assignments, legend, export to Markdown, and save to learning portfolio as an executive document
2. **Policy Generator** — select from 4 policy types, fill in organization-specific details, and generate compliance-aligned policy drafts; auto-populates applicable frameworks and deadlines from assessment data; includes FIPS 203/204/205 algorithms plus FN-DSA (planned FIPS 206, in development with no public draft) and HQC
3. **KPI Dashboard** — interactive scorecard with 6 weighted KPI dimensions; vendor readiness auto-scored from migration catalog data; exports as Markdown with data source documentation
4. **Escalation Framework** — inspect 4 escalation tiers (Team Lead → PQC Program Manager → CISO → Executive Steering Committee) and score policy exception requests with compensating controls and required decision-package takeaways

## Related Standards

- EO 14412 & OMB M-26-15 (June 2026, U.S. federal civilian agencies) and OMB M-23-02 (2022)
- NSA CNSA 2.0 (FAQ v2.2, October 2026 — National Security Systems only)
- NIST IR 8547 (Transition to Post-Quantum Cryptography Standards, final October 2026)
- EU Coordinated Implementation Roadmap v1.1 (June 2025 — advisory Member State guidance; DORA and NIS2 impose cyber risk-management duties rather than fixed PQC cutoff dates)
- NIST SP 800-53 (Security and Privacy Controls)
- FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), and planned FIPS 206 (FN-DSA; in development with no public draft)
- ISO 27001 (Information Security Management Systems)
- COBIT (Control Objectives for Information and Related Technologies)
