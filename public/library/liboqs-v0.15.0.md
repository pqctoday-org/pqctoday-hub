---
reference_id: liboqs-v0.15.0
document_type: Algorithm
document_status: Released
date_published: 2025-11-14
date_updated: 2025-11-14
region: Global
migration_urgency: High
local_file: public/library/liboqs-v0.15.0.html
---

# Open Quantum Safe liboqs Library v0.15.0

## Author & Organization

**Organization:** Open Quantum Safe; Linux Foundation PQCA

## Scope

**Industries:** Software Development; IT; Research
**Region:** Global
**Document type:** Algorithm

## How It Relates to PQC

TLS; SSH; X.509 integration

**Dependencies:** FIPS 203; FIPS 204; FIPS 205

## Risks Addressed

**Migration urgency:** High
**Security levels:** L1,L3,L5

## PQC Key Types & Mechanisms

| Field                  | Value                           |
| ---------------------- | ------------------------------- |
| Algorithm family       | Lattice; Hash-based; Code-based |
| Security levels        | L1,L3,L5                        |
| Protocol / tool impact | TLS; SSH; X.509 integration     |
| Toolchain support      | Open source PQC implementations |

## Description

Latest liboqs release with updated PQC algorithm implementations including NIST-standardized ML-KEM ML-DSA and SLH-DSA. Part of Linux Foundation PQCA.

---

_Skip to main content Link Menu Expand (external link) Document Search Copy Copied Open Quantum Safe Home Post-quantum cryptography FAQ About our project News Sponsors liboqs Getting started Algorithms BIKE Classic McEliece CROSS Falcon FrodoKEM HQC Kyber LMS MAYO ML-DSA ML-KEM NTRU NTRU-Prime SLH-DSA SNOVA UOV XMSS Security policy C example code Encapsulation and decapsulation Signing and verification C API documentation Language wrappers License Applications and protocols TLS SSH X.509 CMS and S/MIME External users of OQS Research Benchmarking Team Search Open Quantum Safe liboqs liboqs on Github liboqs is an open source C library for quantum-safe cryptographic algorithms. liboqs provides: a collection of open-source implementations of quantum-safe key encapsulation mechanism (KEM) and digital signature algorithms (see the list of supported algorithms ) a common API for these algorithms a test harness and benchmarking routines Overview Open source . liboqs is a C library for quantum-safe cryptographic algorithms, released under the MIT License. liboqs incorporates some external components which use a different license. Multi-platform . liboqs builds on Linux, macOS, and Windows, supports x86_64 and ARM architectures (except Windows on ARM64), and the clang, gcc, and Microsoft compilers. Toolchains are available for cross-compiling to other platforms. Not all algorithms are supported on all those platforms; always consult the algorithm datasheets for details on each algorithm. Common API . liboqs uses a common API for post-quantum key encapsulation and signature algorithms, making it easy to switch between algorithms. Our API closely follows the NIST/SUPERCOP API, with some add_
