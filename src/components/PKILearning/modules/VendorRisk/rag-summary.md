# Vendor & Supply Chain Risk

## Overview

The Vendor & Supply Chain Risk module teaches executives how to assess, score, and manage cryptographic risk across their vendor ecosystem. It covers PQC readiness scorecards with six weighted dimensions, contract clause generation for quantum-safe procurement, and supply chain risk matrix visualization across infrastructure layers. The module integrates live data from the app's migration catalog to auto-score FIPS validation status and vendor PQC readiness.

## Key Concepts

- **Vendor PQC Scorecard** — six weighted dimensions: PQC Algorithm Support (25%), FIPS 140-3 Validation (20%), Published PQC Roadmap (15%), Crypto Agility (15%), SBOM/CBOM Delivery (10%), Hybrid Mode Support (15%)
- **FIPS Validation Tiers** — four-tier assessment: Validated (CMVP-certified), Submitted (in CMVP queue), Legacy (FIPS 140-2 only), Self-Claim (vendor assertion without certification)
- **CBOM (Cryptographic Bill of Materials)** — CycloneDX-standard inventory of all cryptographic algorithms, key sizes, and usage locations within a vendor's product; essential for assessing quantum vulnerability
- **SBOM (Software Bill of Materials)** — complete inventory of software components and dependencies; complements CBOM for identifying cryptographic library dependencies
- **Contract Clauses** — five categories of procurement protection: PQC timeline requirements, FIPS validation mandates, CBOM delivery obligations, crypto change notification, and audit rights
- **Supply Chain Risk Matrix** — infrastructure-layer view showing PQC-ready products, FIPS-validated products, and hybrid-capable products as ratios per layer

## Workshop / Interactive Activities

The workshop has 3 interactive steps:

1. **Vendor Scorecard Builder** — interactive radar chart with 6 weighted dimensions; FIPS validation auto-scored from migration catalog data; saves assessment as executive document
2. **Contract Clause Generator** — 5-section artifact builder producing legal-style contract articles (PQC Timeline, FIPS Validation, CBOM Delivery, Crypto Change Notification, Audit Rights) with customizable parameters
3. **Supply Chain Risk Matrix** — heatmap visualization showing vendor PQC readiness across infrastructure layers; cells display count ratios with percentage-based color coding; includes per-layer detail table

## Related Standards

- NIST SP 800-161 (Cybersecurity Supply Chain Risk Management)
- NIST IR 8547 (Transition to Post-Quantum Cryptography Standards)
- CycloneDX CBOM Specification
- FIPS 140-3 (Security Requirements for Cryptographic Modules)
