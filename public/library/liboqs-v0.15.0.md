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

## Authors

**Organization:** Open Quantum Safe; Linux Foundation PQCA

## Scope

**Industries:** Software Development; IT; Research
**Region:** Global
**Document type:** Algorithm

## How It Relates to PQC

TLS; SSH; X.509 integration

**Dependencies:** FIPS 203; FIPS 204; FIPS 205

## PQC Risk Profile

**Harvest Now, Decrypt Later:** **HIGH** — Encrypted data captured today can be decrypted by a future quantum computer (harvest-now-decrypt-later attack). Adopting this specification is critical to protect long-lived confidential data.

**Identity & Authentication Integrity:** **HIGH** — A quantum-capable adversary could forge certificates or impersonate identities protected by classical public-key cryptography. Migration to PQC-safe PKI and authentication systems is essential.

**Digital Signature Integrity:** **HIGH** — Classical digital signatures (RSA, ECDSA) are vulnerable to quantum forgery. Code signing, firmware integrity, and legally binding digital signatures depend on adopting post-quantum signature schemes.

**Migration urgency:** High

## PQC Key Types & Mechanisms

| Field                  | Value                           |
| ---------------------- | ------------------------------- |
| Algorithm family       | Lattice; Hash-based; Code-based |
| Security levels        | L1,L3,L5                        |
| Protocol / tool impact | TLS; SSH; X.509 integration     |
| Toolchain support      | Open source PQC implementations |

## Short Description

Latest liboqs release with updated PQC algorithm implementations including NIST-standardized ML-KEM ML-DSA and SLH-DSA. Part of Linux Foundation PQCA.

## Long Description

Skip to main content Link Menu Expand (external link) Document Search Copy Copied Open Quantum Safe Home Post-quantum cryptography FAQ About our project News Sponsors liboqs Getting started Algorithms BIKE Classic McEliece CROSS Falcon FrodoKEM HQC Kyber LMS MAYO ML-DSA ML-KEM NTRU NTRU-Prime SLH-DSA SNOVA UOV XMSS Security policy C example code Encapsulation and decapsulation Signing and verification C API documentation Language wrappers License Applications and protocols TLS SSH X.509 CMS and S/MIME External users of OQS Research Benchmarking Team Search Open Quantum Safe liboqs liboqs on Github liboqs is an open source C library for quantum-safe cryptographic algorithms. liboqs provides: a collection of open-source implementations of quantum-safe key encapsulation mechanism (KEM) and digital signature algorithms (see the list of supported algorithms ) a common API for these algorithms a test harness and benchmarking routines Overview Open source . liboqs is a C library for quantum-safe cryptographic algorithms, released under the MIT License. liboqs incorporates some external components which use a different license. Multi-platform . liboqs builds on Linux, macOS, and Windows, supports x86_64 and ARM architectures (except Windows on ARM64), and the clang, gcc, and Microsoft compilers. Toolchains are available for cross-compiling to other platforms. Not all algorithms are supported on all those platforms; always consult the algorithm datasheets for details on each algorithm. Common API . liboqs uses a common API for post-quantum key encapsulation and signature algorithms, making it easy to switch between algorithms. Our API closely follows the NIST/SUPERCOP API, with some additional wrappers and data structures. Testing and benchmarking . liboqs includes a test harness and benchmarking routines to compare performance of post-quantum implementations in a common framework. Application integrations . We provide integrations of liboqs into forks of a range of cryptographic applications and protocols . Language wrappers . Post-quantum algorithms from liboqs can be used in a variety of other programming languages using the provided wrappers . Post-quantum algorithm implementations in liboqs are derived from the reference and optimized code submitted by teams to the NIST Post-Quantum Cryptography Standardization Project. Some implementations come directly from teams; others come via the PQClean project . See the algorithm datasheets for the lineage of each algorithm’s implementation. Releases version 0.15.0 (November 14, 2025) current version version 0.14.0 (July 10, 2025) version 0.13.0 (April 17, 2025) version 0.12.0 (December 9, 2024) version 0.11.0 (September 27, 2024) version 0.10.1 (June 7, 2024) version 0.10.0 (March 23, 2024) version 0.9.2 (January 16, 2024) version 0.9.1 (December 22, 2023) version 0.9.0 (October 12, 2023) version 0.8.0 (June 7, 2023) version 0.7.2 (August 21, 2022) version 0.7.1 (December 16, 2021) version 0.7.0 (August 11, 2021) version 0.6.0 (June 8, 2021) version 0.5.0 (March 10, 2021) version 0.4.0 (August 11, 2020) version 0.3.0 (June 10, 2020) version 0.2.0 (October 8, 2019) version 0.1.0 (November 13, 2018) all releases Copyright Open Quantum Safe a Series of LF Projects, LLC. For website terms of use, trademark policy, and other project policies, please see https://lfprojects.org . This site uses Just the Docs , a documentation theme for Jekyll. Background image by Rick Doble .

---

_Skip to main content Link Menu Expand (external link) Document Search Copy Copied Open Quantum Safe Home Post-quantum cryptography FAQ About our project News Sponsors liboqs Getting started Algorithms BIKE Classic McEliece CROSS Falcon FrodoKEM HQC Kyber LMS MAYO ML-DSA ML-KEM NTRU NTRU-Prime SLH-DSA SNOVA UOV XMSS Security policy C example code Encapsulation and decapsulation Signing and verification C API documentation Language wrappers License Applications and protocols TLS SSH X.509 CMS and S/MIME External users of OQS Research Benchmarking Team_
