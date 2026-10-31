# Cryptographic Product Certification: Fundamentals

## Overview

This advanced Hardware Infrastructure module (LM-065) distinguishes FIPS 140-3 module validation, Common Criteria product evaluation, EUCC scheme rules and PCI approval. Common Criteria supplies evaluation criteria; EUCC uses those criteria under an EU certification scheme. eIDAS is a separate legal context where applicable. The module explains certificate scope and what adding PQC changes, with links to LM-067 _FIPS 140-3 Certification_, LM-068 _Common Criteria, EUCC & eIDAS Certification_ and LM-071 _PCI Certification_. It is written for product vendors, product-assurance leads, buyers and evaluators. It is labelled "Practitioner orientation — not laboratory training." Corrected since the PQC Today owner's last sign-off; awaiting re-sign-off. It has not been reviewed by an accredited laboratory or certification body. The context-separation correction was checked on 21 October 2026; other dated claims retain their individual source dates.

The module is a single ~95-minute route with no learn paths. Deeper material is kept as optional reference sections that do not count toward duration or completion. For the certification-engineer role, the box at the start of the Learn tab names three reader roles (lab tester, vendor engineer, scheme reviewer) and points next to LM-067 _FIPS 140-3 Certification_, then LM-066 _ACVP Lab Workflow_; no test vectors are run in this module.

## Key Concepts

- **Hybrid or standalone, by scheme (as of 22 October 2026)** — FIPS 140-3 approves ML-KEM, ML-DSA and SLH-DSA on their own; a hybrid KEM is allowed under IG D.S Scenario 2 conditions (approved key combiner, module-enforced fixed combinations); the IG has no hybrid-signature scenario. EUCC (ECCG ACM v2, unchanged in the v3 draft): (M)LWE mechanisms such as ML-KEM and ML-DSA should not be used standalone but combined with a classical mechanism; hash-based signatures may stand alone. BSI TR-02102-1 (2026-01) recommends PQC key agreement and (non-hash-based) signatures only in hybrid form, while hash-based signatures may in principle be used alone, provided their implementation security is carefully considered (BSI limits stateful schemes such as LMS and XMSS to special scenarios where error-free state management can be guaranteed); ANSSI's FAQ calls hybridisation essential, except for hash-based signatures. IETF Composite ML-DSA is approved and awaiting RFC publication but not yet named by FIPS IG or the ECCG mechanisms.

- **Standards, criteria and schemes have different roles** — FIPS 140-3 specifies module requirements validated through CMVP; CC provides product evaluation criteria; EUCC is a scheme using CC, not a separate alternative to CC. PCI addresses payment-device approval. Name the applicable scheme before applying its rules.
- **Words used in the scheme comparison table** — a short key above the "One question per scheme" table gives plain definitions of CSTL (Cryptographic and Security Testing Laboratory), CCRA (Common Criteria Recognition Arrangement), Security Target, Protection Profile, ITSEF (IT Security Evaluation Facility), PTS HSM (PIN Transaction Security Hardware Security Module), P2PE (Point-to-Point Encryption), KMO (Key Management and Operations, a PCI standard published as version 1.0 on 14 September 2026), QPA (Qualified PIN Assessor) and AVA_VAN (the Common Criteria vulnerability-analysis family, levels AVA_VAN.1 to AVA_VAN.5).
- **Scope before level** — a certificate covers a defined module, target or device at a version and configuration. The anchor is a fictional network HSM ("Orrin N7") sold as an appliance and as a multi-tenant cloud service into four markets.
- **What PQC changes in certification** — adding ML-KEM or ML-DSA changes the certified product, and each scheme has its own route for that change.
- **Reading a hybrid in a certificate's scope** — a hybrid KEM claim (IG D.S Scenario 2) is evidenced in different places: CAVP certificates for the ML-KEM half and the key combiner, the Security Policy's "KEM-Hybrid" or "KEM-Hybrid-Full" entry, and the lab's source-code review for the fixed combinations and the order the secrets are joined. A non-approved classical half such as X25519 must be enforced inside an approved hybrid by the module, and there is no end-to-end hybrid algorithm test yet. Under Common Criteria and EUCC the algorithm claims sit in the Security Target's cryptographic requirements.
- **Crypto agility versus certification latency** — a product can be agile in code and still wait on a scheme's change route.
- **A new platform, chip or accelerator: what carries over** — a validation covers the environments it was tested on. A moved module goes through vendor affirmation (VAOE, no CMVP statement on correct operation), an Operational Environment Update (OEUP, with CAVP testing on the new environment and ESV where applicable) or revalidation. A processor accelerator must be on the IG's "known" list and be tested with and without it; the list names no ML-KEM, ML-DSA or SLH-DSA accelerator. Under Common Criteria, a platform that breaks the Security Target's assumptions is a major change.
- **A market deadline creates urgency, not a shortcut** — it does not make a PQC addition eligible for a scheme's lighter change route.

## Workshop / Interactive Activities

The PQC-impact lesson compares ML-KEM, ML-DSA and SLH-DSA parameter sets and applicable modes, not only sizes. It distinguishes standard-defined choices, product support and actual tested combinations; includes ML-DSA-44's random-generator-strength caveat; separates security categories from assurance levels; and asks readers to identify interfaces, key representations, implementation versions and environments. It links existing SLH-DSA and state-management exercises rather than claiming they certify products.

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
