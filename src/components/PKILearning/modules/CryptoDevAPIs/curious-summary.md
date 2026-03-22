# Crypto APIs PQC — In Simple Terms

## What This Is About
Software applications do not build their own cryptography from scratch; they rely on standardized application programming interfaces (APIs) like Java's JCA, OpenSSL, Windows CNG, and PKCS#11 to abstract and execute the complex underlying math safely.

## Why It Matters
These APIs utilize "provider models," meaning the specific algorithm implementations are pluggable. Designing applications to leverage these abstract APIs ensures that upgrading to Post-Quantum algorithms requires zero changes to the core application code—developers only need to swap the underlying algorithm provider.

## The Key Takeaway
Different APIs have vastly different mechanisms for PQC integration. For example, OpenSSL 3.x can dynamically load PQC math at runtime via the `oqsprovider`, while PKCS#11 requires meticulous session management to communicate with external hardware security modules that are just beginning to support PQC.

## What's Happening
Open-source libraries are actively leading the charge in PQC adoption. Bouncy Castle has provided full ML-KEM and ML-DSA support since version 1.78, while Windows CNG has begun offering ML-KEM natively within Insider builds.
