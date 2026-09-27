# PCI Certification

## Overview

This advanced Hardware Infrastructure module (LM-071) is a scheme deep dive split out of LM-065 _Cryptographic Product Certification: Fundamentals_ (via LM-067). It covers PCI PTS HSM with the payment operating stack (PIN Security, P2PE, KMO): what a device approval proves, how to read one, and what adding post-quantum cryptography means for a payment HSM. FIPS 140-3 and the CMVP are covered in LM-067 _FIPS 140-3 Certification_. Version 1 is labelled "Practitioner orientation — not laboratory training. Not yet reviewed by an accredited lab or certification body." Facts are as of 24 September 2026.

One timed ~60-minute route. Deeper material is kept as optional reference sections.

## Key Concepts

- **PCI device approval is not entity assessment** — PTS HSM approval covers a device; PIN Security, P2PE and KMO assess the entities that operate it. A PCI listing's PQC flag means PQC support exists; it does not approve a specific algorithm.
- **A FIPS certificate is not a PCI approval** — a FIPS 140-3 Level 3 HSM does not thereby hold PCI PTS HSM approval, though PCI PIN Security v3.1 and P2PE v3.1 accept FIPS Level 3+ HSMs.

## Workshop / Interactive Activities

_Payment HSM evidence review_: review a payment HSM's evidence — PTS listing, Security Policy, FIPS certificate and KMO/PIN assessment scope.

## Source Currency

PCI-licence-gated documents (PTS HSM v5.0 requirements, Program Guide v2.3, KMO v1.0, P2PE v3.2) are cited by title, version and date only; their requirement text is not taught. The public PCI PTS Program Guide v1.9 (June 2020) is superseded by Program Guide v2.3 (May 2026) and is used only to explain the historical delta-change concept. The P2PE v3.1 text is superseded by v3.2 (June 2025).

## Related Standards

- `PCI-SSC-Blog-Publishes-PTS-HSM-v5-0`
- `PCI-PTS-Listing-Field-Definitions`
- `PCI-SSC-Blog-KMO-v1-0-Published`
- `PCI-PTS-Program-Guide-v1-9`
- `PCI-PIN-v3-1-ROC-Reporting-Template`
- `PCI-P2PE-Security-Requirements-v3-1`
