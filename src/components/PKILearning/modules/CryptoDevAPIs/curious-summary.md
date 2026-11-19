# Crypto APIs PQC — In Simple Terms

## What This Is About

Software applications do not build their own cryptography from scratch; they rely on standardized application programming interfaces (APIs) like Java's JCA, OpenSSL, Windows CNG, and PKCS#11 to abstract and execute the complex underlying math safely.

## Why It Matters

These APIs utilize "provider models," meaning the specific algorithm implementations are pluggable. Designing applications around these abstract APIs keeps most of the core application code the same when upgrading to Post-Quantum algorithms. What still changes is the algorithm name, the much larger keys and signatures (and the storage that holds them), how the two sides agree on an algorithm, and what happens when one side does not support it.

## The Key Takeaway

Different APIs have vastly different mechanisms for PQC integration. For example, OpenSSL 3.5 and later include ML-KEM, ML-DSA and SLH-DSA out of the box (older versions needed the `oqsprovider` plug-in), while PKCS#11 v3.2 now specifies PQC mechanisms. Actual availability still depends on the HSM model, firmware, client/provider versions, and validated configuration.

## What's Happening

Open-source libraries are actively leading the charge in PQC adoption. Bouncy Castle added ML-KEM and ML-DSA in release 1.79 (October 2024); treat that as a feature floor, not a current-version recommendation. BC Java 1.87 (11 November 2026) deprecates Classic McEliece and says it is no longer believed safe to use. Platform support differs by API, version, and backend: JDK 24+ and Go 1.24/1.27 provide the named primitives; pyca/cryptography 47+ availability depends on its linked backend; .NET 10 provides ML-KEM and marks ML-DSA experimental (SYSLIB5006); Windows documents ML-KEM/ML-DSA BCRYPT identifiers for Windows 11 24H2, while current end-to-end CNG examples are marked prerelease. Always verify target-platform support and keep primitive, key-storage, certificate, and TLS support separate.
