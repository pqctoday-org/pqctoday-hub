# PCI Certification

## Overview

This advanced Hardware Infrastructure module (LM-071) is a scheme deep dive split out of LM-065 _Cryptographic Product Certification: Fundamentals_ (via LM-067). It covers PCI PTS HSM with the payment operating stack (PIN Security, P2PE, KMO): what a device approval proves, how to read one, and what adding post-quantum cryptography means for a payment HSM. FIPS 140-3 and the CMVP are covered in LM-067 _FIPS 140-3 Certification_. Version 1 is labelled "Practitioner orientation — not laboratory training." Corrected since the PQC Today owner's sign-off on 22 October 2026; awaiting re-sign-off. It has not been reviewed by an accredited laboratory or certification body. Facts are as of 30 October 2026.

This lesson covers four PCI programmes: PTS HSM, PIN Security, P2PE and key management operations. It does not cover PTS POI, card production and provisioning, 3-D Secure, or MPoC and CPoC.

One timed ~60-minute route. Deeper material is kept as optional reference sections.

## Key Concepts

- **PCI device approval is not entity assessment** — in this module’s reading, a PTS HSM approval is about the device (independent laboratories evaluate HSMs; PCI SSC approves and lists them), while PIN Security, P2PE and KMO are about how HSMs are operated and the solutions built on them. A PCI listing’s PQC notation records that PQC support exists; the implementation details are in the device’s security policy.
- **A FIPS certificate is not a PCI approval** — a FIPS 140-3 certificate and a PTS approval are separate evidence under separate schemes, each tied to versions; which HSM evidence a PCI standard accepts is set out in that standard, which this module does not read.

## Workshop / Interactive Activities

_Payment HSM evidence review_: review a payment HSM's evidence — PTS listing, Security Policy, FIPS certificate and KMO/PIN assessment scope.

## Source Currency

This module states only what public PCI SSC pages state: PCI Perspectives blogs, the P2PE and PTS HSM program pages, the Document Library feed (titles and dates only) and the PTS listing field definitions. The PTS HSM v5.0 requirements, the Device Testing and Approval Program Guide, the KMO standard and the P2PE standard are not read, so their content is not taught. The v5.0 announcement names no post-quantum algorithm and no deadline. PCI SSC announced P2PE v3.2 on 30 June 2025 as a minor revision; from 1 January 2026 all new P2PE submissions, including reassessments of listed products, must comply with it, and validations already done to P2PE v3.0 or v3.1 are not affected (P2PE v3.2 announcement).

## Related Standards

- `PCI-SSC-Blog-Publishes-PTS-HSM-v5-0`
- `PCI-PTS-Listing-Field-Definitions`
- `PCI-SSC-Blog-KMO-v1-0-Published`
