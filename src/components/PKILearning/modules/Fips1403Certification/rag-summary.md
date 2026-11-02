# FIPS 140-3 Certification

## Overview

This advanced Hardware Infrastructure module (LM-067) is a scheme deep dive split out of LM-065 _Cryptographic Product Certification: Fundamentals_. It covers FIPS 140-3 and the CMVP: what a certificate proves, how to read one, and what adding post-quantum cryptography means for a validated module. PCI PTS HSM and the payment operating stack are covered in LM-071 _PCI Certification_. Version 1 is labelled "Practitioner orientation — not laboratory training." Reviewed and signed off by the PQC Today owner on 1 November 2026. It has not been reviewed by an accredited laboratory or certification body. Facts are as of 24 September 2026, except items that give their own later dates (such as the algorithm records, read on 23 and 24 October 2026).

One timed ~80-minute route. Deeper material is kept as optional reference sections.

## Key Concepts

- **Read the exact PQC capability** — KeyGen is key generation, SigGen is signing, and SigVer is signature verification. Follow the operation's algorithm-validation link for its capabilities and parameter sets, then check the module Security Policy for the approved service and configuration. A signing entry alone does not establish coverage of other operations or every parameter set. The existing certificate #5497 example links to A5631.
- **Three different ML-DSA checks** — external algorithm testing checks supplied cases; an algorithm self-test checks the module's own implementation before first approved use (a known-answer test uses fixed inputs and an expected result, not every customer key); a pair-wise consistency test checks that a generated key pair works together. They do not replace each other. Review test timing, failure reporting and required error-state restrictions; this explanation does not claim the Hub tested its HSM's failure handling. See IG §10.3.A for algorithm self-test and pair-wise consistency requirements.
- **Key export policy is not a blanket plaintext ban** — FIPS requirements for key entry/output depend on security level, module type and transfer method (IG §9.5.A). Consult the module’s Security Policy for covered services and protections. The linked PKCS#11 AES exercise checks a selected policy: plaintext reads refused, encrypted backup permitted, and protection retained on restoration. It does not establish FIPS validation.
- **Side-channel and fault attacks: what a certificate shows** — SP 800-140F, the publication that would set test metrics for non-invasive security, lists no requirements yet, so the Management Manual treats that area as N/A by default. A publicly documented countermeasure must still be addressed under "Mitigation of other attacks" (IG 12.A), but no published CMVP test metric sets how far the lab's verification goes. Common Criteria AVA_VAN analysis and penetration testing covers only what the Security Target claims, under its assumptions. The section separates sourced statements from the module's own analysis.
- **Algorithm validation is not the certificate** — CAVP/ACVP algorithm validation is the prerequisite stage, not a FIPS 140-3 module certificate. A module can be in progress without being listed: the Modules In Process and Implementation Under Test lists are voluntary, and the Management Manual (§4.2) says the list “doesn’t necessarily include all modules being tested or reviewed”. It is certified only with a FIPS 140-3 certificate.
- **Vendor-affirmed is not an algorithm test certificate** — vendor-affirmed means the vendor states that an algorithm meets the standard without an algorithm test certificate; NIST's FIPS 140-3 Implementation Guidance allows it only where a specific IG section permits it, for example IG C.O for HSS signatures.
- **Modules in Process is a queue, not an outcome** — a CMVP MIP entry is not evidence of validation.
- **FIPS 140-3 is unchanged** — no 2025–2026 draft revises FIPS 140-3 or Level 3. Executive Order 14412 §6(b) directs NIST to revise CMVP processes to accelerate validations, with a deadline of about 19 December 2026. FIPS 140-2 certificates moved to the Historical list on 21/22 September 2026.
- **FIPS Level 3 is not a PCI approval** — a FIPS 140-3 Level 3 HSM does not thereby hold PCI PTS HSM approval; whether a PCI operational standard accepts a FIPS certificate in place of a PTS approval is set in that standard’s own requirement text, which this module does not state.

## Workshop / Interactive Activities

_Level and boundary planner_: choose the FIPS 140-3 security level and module boundary for the anchor HSM's appliance and cloud-partition variants.

_Read the algorithm records_ (about 15 minutes): read the records of two real modules, certificates #5497 (QASM Cryptographic Module, records as of 23 October 2026) and #5450 (Luna T7, records as of 24 October 2026), for the same operations. For each row the learner marks whether it is listed on the algorithm validation and whether it is listed in the Security Policy's Approved Algorithms table; the two deterministic-setting rows add a third mark for the Policy's function table (Security Function Implementations), because the Policy's two tables can differ. A last single-choice question asks what an algorithm validation can and cannot show. The step uses short quotes with page numbers and links to NIST's copies, names each vendor only as the source of its records, and does not rate or compare the modules.

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
