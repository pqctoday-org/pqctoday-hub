# Cryptographic Product Certification: Fundamentals

## Overview

This advanced Hardware Infrastructure module (LM-065) teaches what a cryptographic product certificate proves under four schemes — FIPS 140-3 (CMVP), Common Criteria, EUCC (with eIDAS), and PCI — why scope comes before level, and what adding post-quantum cryptography changes in a certified product. It is the shared foundation for three scheme deep dives: LM-067 _FIPS 140-3 Certification_, LM-068 _Common Criteria, EUCC & eIDAS Certification_ and LM-071 _PCI Certification_. It is written for product vendors and product-assurance leads; it also serves buyers and evaluators. Version 1 is labelled "Practitioner orientation — not laboratory training. Not yet reviewed by an accredited lab or certification body." Facts are as of 24 September 2026.

The module is a single ~60-minute route with no learn paths. Deeper material is kept as optional reference sections that do not count toward duration or completion.

## Key Concepts

- **Four schemes, four questions** — each scheme answers a different question, so the first step is choosing the scheme that can answer the question being asked.
- **Scope before level** — a certificate covers a defined module, target or device at a version and configuration. The anchor is a fictional network HSM ("Orrin N7") sold as an appliance and as a multi-tenant cloud service into four markets.
- **What PQC changes in certification** — adding ML-KEM or ML-DSA changes the certified product, and each scheme has its own route for that change.
- **Crypto agility versus certification latency** — a product can be agile in code and still wait on a scheme's change route.
- **A market deadline creates urgency, not a shortcut** — it does not make a PQC addition eligible for a scheme's lighter change route.

## Workshop / Interactive Activities

_Which scheme answers the question?_, _Draw the certification boundary_, and the capstone _One product, four markets_ (the learner picks one scheme at full depth and the other three at applicability level). Optional reference steps: _PQC change analyzer_ and _Evidence exchange demo_ (a synthetic teaching demo).

## Related Standards

- `FIPS-140-3-STANDARD`
- `CMVP-MGMT-MANUAL`
- `NIST IR 8547`
- `FIPS 203`
- `FIPS 204`
- `FIPS 205`
- `COMMON-CRITERIA`
- `CIR-EU-2024-482-EUCC-Cybersecurity-Certification-Scheme`
- `EUCC v2.0 ACM`
- `PCI-SSC-Blog-Publishes-PTS-HSM-v5-0`
