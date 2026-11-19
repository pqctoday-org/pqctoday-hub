### What This Is About

Adding post-quantum cryptography to a hardware security module or cryptographic library is only half the work — proving it through formal product certification is often the longest bottleneck. Certification engineers, lab testers, and scheme reviewers must navigate FIPS 140-3, ACVP algorithm testing, entropy source validation (ESV), EUCC, NIAP Policy #33, and PCI boundaries without conflating what each certificate actually proves.

### Why It Matters

Active FIPS 140-2 certificates moved to the CMVP Historical List in September 2026, so PQC upgrades now run through FIPS 140-3 and congested laboratory queues. Meanwhile, PQC algorithms (ML-KEM, ML-DSA, SLH-DSA) introduce seed-driven ACVP `keyGen` test vectors, mandatory IG 10.3.A CAST/PCT self-tests, and SP 800-90B/90C ESV entropy dependencies. At the same time, separate regulatory clocks are active: CNSA 2.0 FAQ v2.2 sets 2027/2030/2031 National Security System gates (aligned with NIAP Policy #33), and EO 14412 / OMB M-26-15 sets 2030 key-establishment and 2031 signature dates for US federal civilian HVAs and high-impact systems.

### The Key Takeaway

Never equate an ACVP algorithm certificate or a Modules in Process (MIP) listing with an active FIPS 140-3 module certificate. Verify exact firmware versions, operating environments, ESV linkage, and regional scheme boundaries (FIPS 140-3 vs. EUCC vs. PCI PTS HSM v5.0 / PCI DSS v4.0.1) in primary registries — and mark anything unverified as Unknown.

### What's Happening

Final NIST IR 8547 (October 2026) deprecates quantum-vulnerable public-key algorithms by 2030 and disallows them under NIST standards after 2035. NIST finalized SP 800-90C in September 2025 alongside mandatory CMVP ESV validation, EUCC operates under CIR (EU) 2024/482 with ACM v2 PQC guidance, and PCI SSC separates PTS HSM v5.0 device approvals from PCI DSS v4.0.1 operational assessments.
