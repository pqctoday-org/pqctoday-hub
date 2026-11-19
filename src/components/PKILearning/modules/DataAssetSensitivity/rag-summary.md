---
module_id: data-asset-sensitivity
title: Data & Asset Sensitivity Assessment
track: Strategy
difficulty: intermediate
duration: 50 min
workshop_steps: 5
---

# Data & Asset Sensitivity Assessment

## Topics Covered

- Four-tier data sensitivity classification model (Low / Medium / High / Critical) and distinguishing business services (such as an archiving and retrieval service) from protected data assets (such as long-lived records)
- Asset type taxonomy: data stores, key material, communications, credentials, code artifacts
- HNDL (Harvest Now, Decrypt Later) risk windows — formula: CRQC arrival − confidentiality years
- Global data protection and PQC frameworks: GDPR, HIPAA, PCI DSS v4.0.1, CCPA/CPRA, NIS2 & DORA (EU cyber risk-management duties), EU PQC Roadmap v1.1, FIPS 140-3 (CMVP vs. ACVP), CNSA 2.0 FAQ v2.2 (US NSS), EO 14412 & OMB M-26-15 (US federal civilian + directed FAR contractor rule), NIST IR 8547 (final, October 2026), ISO/IEC 27001
- Industry-specific compliance obligation mapping across 16 sectors
- NIST Risk Management Framework (RMF) SP 800-37 — 7-step process: Prepare → Categorize → Select → Implement → Assess → Authorize → Monitor
- ISO 27005 risk assessment — threat scenario modeling, 5×5 likelihood × consequence matrix, treatment options
- FAIR model (Factor Analysis of Information Risk) — TEF, vulnerability, loss event frequency, annualized loss expectancy in USD
- DORA/NIS2 operational resilience pillars — cyber risk-management duties and ICT cryptographic policies
- PQC algorithm selection by sensitivity tier and asset type (ML-KEM, ML-DSA, hybrid combinations)
- Composite risk scoring with configurable weights (sensitivity, retention, compliance, HNDL window)
- Migration effort estimation and priority band assignment (Critical / High / Medium / Low)

## Workshop

1. Asset Inventory Builder — Catalog organizational data assets with sensitivity tiers, asset types, retention and confidentiality periods, and HNDL risk indicators
2. Classification Challenge — Classify 10 real-world data scenarios using the four-tier model with immediate feedback on HNDL windows and applicable frameworks
3. Sensitivity Conflict Resolver — Resolve multi-framework sensitivity conflicts when GDPR, HIPAA, CNSA 2.0, and FIPS 140-3 disagree
4. Sensitivity Scoring Engine — Configure composite scoring weights, view per-asset score breakdowns, sort by priority band
5. PQC Migration Priority Map — Review prioritized migration recommendations with PQC algorithm assignments, compliance mandates, migration effort, and exportable Markdown report

## Key Standards

- NIST SP 800-37 (Risk Management Framework)
- NIST SP 800-60 (Information Type Sensitivity)
- NIST SP 800-53 (Security Controls)
- FIPS 199 (Information Categorization)
- FIPS 200 (Minimum Security Requirements)
- ISO/IEC 27001 (Information Security Management)
- ISO/IEC 27005 (Information Security Risk Management)
- FAIR (Factor Analysis of Information Risk)
- DORA (Digital Operational Resilience Act — EU cyber risk-management duty)
- NIS2 Directive (EU Network and Information Security — cyber risk-management duty)
- EU PQC Roadmap v1.1 (EU Coordinated Implementation Roadmap)
- GDPR (EU General Data Protection Regulation)
- HIPAA (US Health Insurance Portability and Accountability Act)
- PCI DSS v4.0.1 (Payment Card Industry Data Security Standard)
- CCPA/CPRA (California Consumer Privacy Act)
- CNSA 2.0 FAQ v2.2 (NSA Commercial National Security Algorithm Suite — US NSS)
- EO 14412 & OMB M-26-15 (US federal civilian PQC mandate + directed FAR contractor rule)
- NIST IR 8547 (Transition to Post-Quantum Cryptography Standards; final, October 2026)
- FIPS 140-3 (Cryptographic Module Validation Program — CMVP vs. ACVP)
