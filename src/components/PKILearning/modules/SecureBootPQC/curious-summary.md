### What This Is About

UEFI Secure Boot uses a cryptographic chain of trust (Platform Key, KEK, db) to protect the OS kernel. Currently, every link relies on quantum-vulnerable algorithms like RSA-2048 or ECDSA.

### Why It Matters

Migrating to ML-DSA-65 is the standard path, but it introduces a massive size impact. ML-DSA signatures are roughly 13x larger than RSA-2048, threatening to exceed the typical 32–64 KB limits of UEFI NVRAM and breaking the boot chain. Hardware TPM 2.0 also lacks native PQC support.

### The Key Takeaway

Firmware vendors are targeting 2026-2027 for PQC rollouts. In the interim, organizations must prepare for a dual-signature (RSA + ML-DSA) hybrid transition and immediately audit UEFI NVRAM capacity to accommodate the larger public keys and signatures.
