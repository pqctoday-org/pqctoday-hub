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
- **Governance Authority** — references OMB Memorandum M-23-02 (Migrating to Post-Quantum Cryptography, 2022) for governance structure requirements including executive sponsorship

## Workshop / Interactive Activities

The workshop has 3 interactive steps:

1. **RACI Matrix Builder** — interactive 10×6 matrix with color-coded click-to-cycle cells (click cycles: empty → R → A → C → I → empty); includes validation warning for missing Accountable assignments, legend, export to Markdown, and save to learning portfolio as an executive document
2. **Policy Template Generator** — select from 4 policy types, fill in organization-specific details, and generate compliance-aligned policy drafts; auto-populates applicable frameworks and deadlines from assessment data; includes FIPS 203/204/205/206 algorithms plus draft standards (HQC, FN-DSA)
3. **KPI Dashboard Builder** — interactive scorecard with 6 weighted KPI dimensions; vendor readiness auto-scored from migration catalog data; exports as Markdown with data source documentation

## Related Standards

- OMB M-23-02 (Migrating to Post-Quantum Cryptography)
- NIST IR 8547 (Transition to Post-Quantum Cryptography Standards)
- NIST SP 800-53 (Security and Privacy Controls)
- FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), FIPS 206 (FN-DSA, draft)
- ISO 27001 (Information Security Management Systems)
- COBIT (Control Objectives for Information and Related Technologies)
