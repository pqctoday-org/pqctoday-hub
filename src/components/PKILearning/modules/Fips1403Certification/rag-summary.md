# FIPS 140-3 Certification

## Overview

This advanced Hardware Infrastructure module (LM-067) is a scheme deep dive split out of LM-065 _Cryptographic Product Certification: Fundamentals_. It covers FIPS 140-3 and the CMVP: what a certificate proves, how to read one, and what adding post-quantum cryptography means for a validated module. PCI PTS HSM and the payment operating stack are covered in LM-071 _PCI Certification_. Version 1 is labelled "Practitioner orientation — not laboratory training. Not yet reviewed by an accredited lab or certification body." Facts are as of 24 September 2026.

One timed ~60-minute route. Deeper material is kept as optional reference sections.

## Key Concepts

- **Read the exact PQC capability** — KeyGen is key generation, SigGen is signing, and SigVer is signature verification. Follow the operation's algorithm-validation link for its capabilities and parameter sets, then check the module Security Policy for the approved service and configuration. A signing entry alone does not establish coverage of other operations or every parameter set. The existing certificate #5497 example links to A5631.
- **Three different ML-DSA checks** — external algorithm testing checks supplied cases; an algorithm self-test checks the module's own implementation before first approved use (a known-answer test uses fixed inputs and an expected result, not every customer key); a pair-wise consistency test checks that a generated key pair works together. They do not replace each other. Review test timing, failure reporting and required error-state restrictions; this explanation does not claim the Hub tested its HSM's failure handling. See IG §10.3.A for algorithm self-test and pair-wise consistency requirements.
- **Key export policy is not a blanket plaintext ban** — FIPS requirements for key entry/output depend on security level, module type and transfer method (IG §9.5.A). Consult the module’s Security Policy for covered services and protections. The linked PKCS#11 AES exercise checks a selected policy: plaintext reads refused, encrypted backup permitted, and protection retained on restoration. It does not establish FIPS validation.
- **Algorithm validation is not the certificate** — CAVP/ACVP algorithm validation is the prerequisite stage, not a FIPS 140-3 module certificate. A module is "in progress" only when NIST lists it on the Modules In Process or Implementation Under Test list; it is certified only with a FIPS 140-3 certificate.
- **Modules in Process is a queue, not an outcome** — a CMVP MIP entry is not evidence of validation.
- **FIPS 140-3 is unchanged** — no 2025–2026 draft revises FIPS 140-3 or Level 3. Executive Order 14412 §6(b) directs NIST to revise CMVP processes to accelerate validations, with a deadline of about 19 December 2026. FIPS 140-2 certificates moved to the Historical list on 21/22 September 2026.
- **FIPS Level 3 is not a PCI approval** — a FIPS 140-3 Level 3 HSM does not thereby hold PCI PTS HSM approval, though PCI PIN Security v3.1 and P2PE v3.1 accept FIPS Level 3+ HSMs.

## Workshop / Interactive Activities

_Level and boundary planner_: choose the FIPS 140-3 security level and module boundary for the anchor HSM's appliance and cloud-partition variants.

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
