### What This Is About

UEFI Secure Boot uses a cryptographic chain of trust (Platform Key, KEK, db) to protect the OS kernel. Currently, every link relies on quantum-vulnerable algorithms like RSA-2048 or ECDSA. The risk to a signature is forgery once a quantum computer exists, not recorded data being read later, so how soon matters depends on how long a device and its trust anchors stay in the field.

### Why It Matters

Migrating to ML-DSA-65 is the standard path, but it introduces a massive size impact. ML-DSA signatures are roughly 13x larger than RSA-2048, threatening to exceed the typical 32–64 KB limits of UEFI NVRAM and breaking the boot chain. TPM 2.0 Library v185 (published by the Trusted Computing Group in March 2026) adds ML-DSA and ML-KEM, but TPMs built to earlier versions lack them and shipping chips follow the specification.

A firmware signature has two sides that are checked differently. The device checks the signature with code that, for ML-DSA and LMS, can be tested through NIST's algorithm validation program (CAVP); no test specification is published yet for XMSS or HSS. The signer holds the private key: NIST SP 800-208 requires LMS and XMSS key generation and signing to happen inside a hardware module validated to FIPS 140 with Level 3 or higher physical security, and the NSA's CNSA 2.0 FAQ says signers that are National Security Systems must follow SP 800-208 (which means CMVP-validated hardware) or other NSA guidance, while a product that only verifies signatures needs only the CAVP test.

Two other integrity checks sit beside the signature, and they are different kinds of rule. NIST SP 800-193 is a design guideline for platform builders (protect, detect and recover firmware) and names no validation program. The FIPS 140-3 integrity test is a requirement on a cryptographic module: the module checks its own software and firmware before it is used, and the test is run by an accredited laboratory and validated by the CMVP.

### The Key Takeaway

Firmware vendors are targeting 2026-2027 for PQC rollouts. In the interim, organizations must prepare for a dual-signature (RSA + ML-DSA) hybrid transition and immediately audit UEFI NVRAM capacity to accommodate the larger public keys and signatures.

### What's Happening

Firmware vendors are targeting 2026-2027 for PQC-capable UEFI implementations, while organizations are auditing their NVRAM capacity and planning dual-signature (RSA + ML-DSA) hybrid boot chains to maintain backward compatibility during the transition.
