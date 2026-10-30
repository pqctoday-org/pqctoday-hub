# Crypto APIs PQC — In Simple Terms

## What This Is About

Software applications do not build their own cryptography from scratch; they rely on standardized application programming interfaces (APIs) like Java's JCA, OpenSSL, Windows CNG, and PKCS#11 to abstract and execute the complex underlying math safely.

## Why It Matters

These APIs utilize "provider models," meaning the specific algorithm implementations are pluggable. Designing applications around these abstract APIs keeps most of the core application code the same when upgrading to Post-Quantum algorithms. What still changes is the algorithm name, the much larger keys and signatures (and the storage that holds them), how the two sides agree on an algorithm, and what happens when one side does not support it.

## The Key Takeaway

Different APIs have vastly different mechanisms for PQC integration. For example, OpenSSL 3.5 and later include ML-KEM, ML-DSA and SLH-DSA out of the box (older versions needed the `oqsprovider` plug-in), while PKCS#11 requires meticulous session management to communicate with external hardware security modules that are just beginning to support PQC.

## What's Happening

Open-source libraries are actively leading the charge in PQC adoption. Bouncy Castle has provided ML-KEM and ML-DSA since release 1.79 (October 2024). Platform runtimes have caught up: Java (JDK 24+), Go (1.24+ for ML-KEM, 1.27+ for ML-DSA), .NET 10 and Python's cryptography library (48+) now ship them, and Windows CNG has offered ML-KEM and ML-DSA to everyone on Windows 11 24H2 and Windows Server 2025 since November 2025 — though not SLH-DSA.
