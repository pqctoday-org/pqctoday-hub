# Government & Defense PQC

## Overview

The Government & Defense module teaches the federal post-quantum policy layer — the instruments that turn post-quantum cryptography from an engineering preference into a procurement requirement. It covers the CNSA 2.0 suite and precisely what it replaces from CNSA 1.0, the dated CNSSP 15 milestones that bind National Security Systems, the National Security System versus federal civilian distinction that decides which deadline applies to a given system, the Federal PKI certificate profile pair (one published and classical, one draft and post-quantum), and how the requirement propagates outward through procurement to contractors who never touch an NSS. It is the one Industries-track module carrying genuine dated algorithm deadlines rather than advisory guidance.

## Key Concepts

- **CNSA 2.0 replaces every public-key line of CNSA 1.0 and almost nothing else.** Key establishment moves from ECDH P-384 / RSA-3072 to ML-KEM-1024 (FIPS 203); general-purpose signatures move from ECDSA P-384 / RSA-3072 to ML-DSA-87 (FIPS 204); software and firmware signing moves to LMS or XMSS (NIST SP 800-208). AES-256 is unchanged and SHA-384 becomes SHA-384 or SHA-512. That asymmetry is the central budgeting lesson: "replace all cryptography" is the wrong model, because the symmetric half of the estate survives the transition intact
- **Level-5 parameters only.** CNSA 2.0 approves ML-KEM-1024 and ML-DSA-87 exclusively. ML-KEM-512, ML-KEM-768, ML-DSA-44 and ML-DSA-65 are FIPS-approved but not CNSA 2.0-approved — an NSS-specific narrowing of the NIST standards, not a restatement of them
- **Firmware signing moved first, and NSA said why.** Three stated reasons: NIST had already standardised the algorithms, the use case is more urgent than others, and stateful hash-based signatures have the longest cryptanalytic history — so their performance costs matter least here. NSA recommends Leighton-Micali with SHA-256/192, though all SP 800-208 algorithms are approved
- **The dated CNSSP 15 milestones** (quoted in the CNSA 2.0 FAQ Ver 2.1, December 2024):
  - **1 January 2027** — all new acquisitions for NSS must be CNSA 2.0 compliant unless otherwise noted
  - **31 December 2030** — all equipment and services that cannot support CNSA 2.0 must be phased out unless otherwise noted
  - **31 December 2031** — CNSA 2.0 algorithms are mandated for use unless otherwise noted; NSA expects the vast majority of cryptography in an NSS to be quantum resistant by this date
  - **2035** — all National Security Systems quantum-resistant, per the goal set in NSM-10
- **The deadlines moved because the policy was revised.** The September 2022 advisory carried a vaguer "2025–2030 depending on equipment type" framing; the December 2024 FAQ replaced it with the dates above. The change is a revision, not a slip — a useful thing for a learner to see directly
- **NSA does not require hybrids for NSS, and that is not a prohibition.** The FAQ states NSA "has confidence in CNSA 2.0 algorithms and will not require NSS developers to use hybrid certified products for security purposes," while explicitly allowing that "product availability and interoperability requirements may lead to adopting hybrid solutions." This is routinely misreported as a ban. NSA also acknowledges some protocols may need hybrid-like constructions simply to carry the larger ML-KEM-1024 and ML-DSA-87 objects
- **NSA's four stated objections to hybrids**: added protocol and library complexity (extra negotiation, error handling, modified APIs, more testing); interoperability becomes harder because every party must share both component algorithms _and_ the hybridisation method; it buys a second transition later when classical components are eventually dropped; and more security products fail from implementation flaws than from cryptanalysis, so added complexity is itself a risk. These are the strongest published arguments against the hybrid-by-default posture most of the commercial world has adopted — and the opposite of what ETSI specifies for European trust services
- **Naming drift is an inventory problem.** The September 2022 advisory names the algorithms CRYSTALS-Kyber and CRYSTALS-Dilithium because FIPS 203/204 did not exist yet; the December 2024 FAQ calls the same algorithms ML-KEM-1024 and ML-DSA-87. Both documents remain current and in force; only the naming changed. Estate inventory tooling must search both vocabularies, because a search for "Kyber" will not find documents written after standardisation
- **NSS and federal civilian are governed by different instruments.** CNSSP 15 carries the CNSA 2.0 dates and binds National Security Systems. Federal civilian agencies follow the Quantum Computing Cybersecurity Preparedness Act and OMB M-23-02 / M-26-15, which impose inventory and reporting obligations but **no equivalent dated algorithm deadline**. Which stack applies to a system is the first question to answer, because it determines whether there is a deadline at all
- **The federal mandate stack**:
  - **Quantum Computing Cybersecurity Preparedness Act (2022)** — Law. Federal civilian executive-branch agencies. Requires inventory of CRQC-vulnerable cryptographic systems and migration, with OMB reporting. The statute is what makes the rest of the stack enforceable rather than advisory
  - **OMB M-23-02** — Operationalises the QCCPA: prioritised cryptographic inventories and annual reporting of quantum-vulnerable systems
  - **OMB M-26-15** — The execution-phase successor to M-23-02; moves the programme from inventory to delivery
  - **Executive Order 14306** — Sustains and amends prior federal cybersecurity direction, including the PQC provisions driving the CISA product-category work
  - **CNSS Policy 15** — The instrument that actually carries the CNSA 2.0 dates, for National Security Systems
  - **NIST SP 800-171 Rev. 3** — Reaches nonfederal systems processing Controlled Unclassified Information: contractors, universities and suppliers who never touch an NSS. Supersedes Rev. 2 (2021)
- **Federal PKI has two certificate profiles, and only one is binding.** The Common Policy X.509 Certificate and CRL Profile is published, in force, and classical (RSA, SHA). A separate PQC profile dated **21 April 2026** is a **DRAFT**, adding ML-DSA and ML-KEM for CITE testing starting from v2.2 of the Common Policy profiles. A draft is not contractually bindable — teaching the pair side by side is crypto agility as an actual document lifecycle rather than a slogan

## Workshop / Interactive Activities

The workshop has 3 hands-on tools:

1. **CNSA 1.0 → 2.0 Suite Comparator** — which suite lines are replaced and which survive, with NSA's own stated rationale per line. Makes the "symmetric primitives survive" point concrete rather than asserted
2. **Federal Mandate Explorer** — pick a system type and see which instruments bind it, and critically, whether it has a dated deadline at all
3. **Federal PKI Profile Pair** — the classical certificate profile beside the draft PQC profile, and why a draft cannot be cited as binding

## Related Standards

CNSSP 15 carries the dates for National Security Systems. The QCCPA and OMB M-23-02 / M-26-15 carry inventory and reporting obligations for federal civilian systems, with no equivalent algorithm deadline. NIST SP 800-171 Rev. 3 reaches nonfederal systems handling Controlled Unclassified Information. The Federal PKI Common Policy certificate profile is in force and classical; a draft profile dated 21 April 2026 adds ML-DSA and ML-KEM for CITE testing. Underlying algorithm standards are FIPS 203 (ML-KEM), FIPS 204 (ML-DSA) and NIST SP 800-208 (LMS/XMSS). RFC 8603 profiles the earlier CNSA suite for X.509. Related guidance includes the NSA CSfC PQC Guidance Addendum, the CISA PQC product category list (2026) and the CMMC 2.0 model.

Cross-reference: the **Hybrid Cryptography** module reaches the opposite default — hybrid recommended or mandated — and the **Trust Services** module covers ETSI TS 119 312 V2.1.1, which _requires_ hybrid signatures for European qualified signatures. Same algorithms, different authorities, opposite defaults. Which applies is a jurisdiction question, not a cryptography question.
