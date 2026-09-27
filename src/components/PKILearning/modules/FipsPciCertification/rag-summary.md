# FIPS 140-3 & PCI Certification

## Overview

This advanced Hardware Infrastructure module (LM-067) is a scheme deep dive split out of LM-065 _Cryptographic Product Certification: Fundamentals_. It covers FIPS 140-3 and the CMVP, and PCI PTS HSM with the payment operating stack (PIN Security, P2PE, KMO): what each certificate proves, how to read one, and what adding post-quantum cryptography means for each. Version 1 is labelled "Practitioner orientation — not laboratory training. Not yet reviewed by an accredited lab or certification body." Facts are as of 24 September 2026.

The learner picks one of two paths — FIPS 140-3 / CMVP, or PCI (full stack) — each a timed ~60-minute route. Deeper material is kept as optional reference sections.

## Key Concepts

- **Algorithm validation is not the certificate** — CAVP/ACVP algorithm validation is the prerequisite stage, not a FIPS 140-3 module certificate. A module is "in progress" only when NIST lists it on the Modules In Process or Implementation Under Test list; it is certified only with a FIPS 140-3 certificate.
- **Modules in Process is a queue, not an outcome** — a CMVP MIP entry is not evidence of validation.
- **FIPS 140-3 is unchanged** — no 2025–2026 draft revises FIPS 140-3 or Level 3. Executive Order 14412 §6(b) directs NIST to revise CMVP processes to accelerate validations, with a deadline of about 19 December 2026. FIPS 140-2 certificates moved to the Historical list on 21/22 September 2026.
- **PCI device approval is not entity assessment** — PTS HSM approval covers a device; PIN Security, P2PE and KMO assess the entities that operate it. A PCI listing's PQC flag means PQC support exists; it does not approve a specific algorithm.

## Workshop / Interactive Activities

_Level and boundary planner_ (FIPS path) and _Payment HSM evidence review_ (PCI path).

## Source Currency

PCI-licence-gated documents (PTS HSM v5.0 requirements, Program Guide v2.3, KMO v1.0, P2PE v3.2) are cited by title, version and date only; their requirement text is not taught. The public PCI PTS Program Guide v1.9 (June 2020) is superseded by Program Guide v2.3 (May 2026) and is used only to explain the historical delta-change concept. The P2PE v3.1 text is superseded by v3.2 (June 2025).

## Related Standards

- `FIPS-140-3-STANDARD`
- `CMVP-MGMT-MANUAL`
- `NIST-FIPS140-3-IG-PQC`
- `NIST-CMVP-MIP-List`
- `NIST-CMVP-Validated-Modules`
- `NIST-CMVP-140-2-to-140-3-Transition-Timeline`
- `EO-2026-06-22-Securing-the-Nation`
- `NIST-SP-800-140`
- `NIST-ACVP`
- `NIST-SP-1800-40B-IPD`
- `PCI-SSC-Blog-Publishes-PTS-HSM-v5-0`
- `PCI-PTS-Listing-Field-Definitions`
- `PCI-SSC-Blog-KMO-v1-0-Published`
