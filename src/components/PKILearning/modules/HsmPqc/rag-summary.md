---
module_id: hsm-pqc
title: HSM & PQC Operations
track: Infrastructure
difficulty: advanced
duration: 90 min
workshop_steps: 4
---

# HSM & PQC Operations

## Topics Covered

- HSM architecture for PQC (FIPS 140-3 levels, on-prem vs cloud side-by-side)
- PKCS#11 v3.2 PQC mechanisms (CKM*ML_KEM*_, CKM*ML_DSA*_, CKK\_\* key types)
- On-prem HSM deep dive (Thales Luna v7.9.2, Entrust nShield v13.8.0, Utimaco Quantum Protect)
- Cloud HSM deep dive (AWS CloudHSM, Azure Dedicated HSM, Google Cloud HSM)
- Side-channel attack surfaces (NTT power analysis, EM emanation, fault injection, ML-DSA hedged signing)
- HSM firmware migration (upgrade paths, dual-partition strategy, FIPS re-validation)
- Stateful signature state management (LMS/HSS NVRAM persistence, CNSA 2.0)
- FIPS 140-3 and ACVP/CAVP PQC validation tracking

## Workshop

1. PKCS#11 PQC Simulator — 8 operations with classical comparison and on-prem vs cloud notes
2. Vendor Comparison — Interactive matrix with PQC Maturity Score (0-100)
3. HSM Migration Planner — 4-phase firmware migration wizard
4. FIPS Validation Tracker — CMVP/CAVP PQC validation status per vendor

## Key Standards

- FIPS 140-3 (Cryptographic Module Validation)
- PKCS#11 v3.2 (OASIS PQC draft)
- FIPS 203/204/205 (ML-KEM, ML-DSA, SLH-DSA)
- NIST SP 800-208 (Stateful Hash-Based Signatures)
- CNSA 2.0 (NSA)
