---
generated: 2026-03-25
collection: csc_004
documents_processed: 1
enrichment_method: ollama-qwen3.5:27b
---


## Let's Encrypt

- **Category**: Public Key Infrastructure (PKI) Software
- **Product Name**: Boulder
- **Product Brief**: An ACME-based certificate authority written in Go that runs Let's Encrypt.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), PQC algorithms, or any plans for PQC migration. It focuses on standard ACME protocol implementation.
- **PQC Migration Priority**: Low
- **Crypto Primitives**: Not stated (Document mentions "private key material" and certificates generally but does not list specific algorithms like ECDSA, RSA, or Ed25519).
- **Key Management Model**: Not stated (Document mentions components talk to a Storage Authority for persistent copies of objects and uses MariaDB/S3, but does not describe the specific key hierarchy, HSM usage, or custody model).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Microservices-based CA with gRPC inter-component communication; includes Web Front Ends, Registration Authority, Validation Authority, Certificate Authority, Storage Authority, Publisher, and CRL Updater.
- **Infrastructure Layer**: Application, Cloud (via Docker deployment)
- **License Type**: Open Source
- **License**: MPL-2.0
- **Latest Version**: Not stated
- **Release Date**: 2026-03-25 (Last Updated timestamp in repository metadata)
- **FIPS Validated**: No
- **Primary Platforms**: Docker, Linux (implied by Go/Docker environment), MariaDB, S3
- **Target Industries**: Web PKI, Certificate Authorities
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/letsencrypt/boulder

---
