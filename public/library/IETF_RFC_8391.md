---
reference_id: IETF RFC 8391
document_type: Algorithm
document_status: Informational
date_published: 2018-05-01
date_updated: 2018-05-01
region: International
migration_urgency: Medium
local_file: public/library/IETF_RFC_8391.html
---

# XMSS: eXtended Merkle Signature Scheme

## Authors

**Authors:** A. Huelsing, D. Butin, S. Gazdag, J. Rijneveld, A. Mohaisen
**Organization:** IETF CFRG

## Scope

**Industries:** Firmware; Long-term Security; Archival
**Region:** International
**Document type:** Algorithm

## How It Relates to PQC

Firmware and long-term signatures

**Dependencies:** SP 800-208

## PQC Risk Profile

**Harvest Now, Decrypt Later:** Not directly addressed by this document.

**Identity & Authentication Integrity:** **HIGH** — A quantum-capable adversary could forge certificates or impersonate identities protected by classical public-key cryptography. Migration to PQC-safe PKI and authentication systems is essential.

**Digital Signature Integrity:** **HIGH** — Classical digital signatures (RSA, ECDSA) are vulnerable to quantum forgery. Code signing, firmware integrity, and legally binding digital signatures depend on adopting post-quantum signature schemes.

**Migration urgency:** Medium

## PQC Key Types & Mechanisms

| Field                  | Value                             |
| ---------------------- | --------------------------------- |
| Algorithm family       | Hash-based (stateful)             |
| Security levels        | L1-L5                             |
| Protocol / tool impact | Firmware and long-term signatures |
| Toolchain support      | Various implementations           |

## Short Description

Specifies XMSS stateful hash-based signatures for long-term security.

## Long Description

RFC 8391: XMSS: eXtended Merkle Signature Scheme [ RFC Home ] [ TEXT | PDF | HTML ] [ Tracker ] [ IPR ] [ Errata ] [ Info page ] INFORMATIONAL Errata Exist Internet Research Task Force (IRTF) A. Huelsing Request for Comments: 8391 TU Eindhoven Category: Informational D. Butin ISSN: 2070-1721 TU Darmstadt S. Gazdag genua GmbH J. Rijneveld Radboud University A. Mohaisen University of Central Florida May 2018 XMSS: eXtended Merkle Signature Scheme Abstract This note describes the eXtended Merkle Signature Scheme (XMSS), a hash-based digital signature system that is based on existing descriptions in scientific literature. This note specifies Winternitz One-Time Signature Plus (WOTS+), a one-time signature scheme; XMSS, a single-tree scheme; and XMSS^MT, a multi-tree variant of XMSS. Both XMSS and XMSS^MT use WOTS+ as a main building block. XMSS provides cryptographic digital signatures without relying on the conjectured hardness of mathematical problems. Instead, it is proven that it only relies on the properties of cryptographic hash functions. XMSS provides strong security guarantees and is even secure when the collision resistance of the underlying hash function is broken. It is suitable for compact implementations, is relatively simple to implement, and naturally resists side-channel attacks. Unlike most other signature systems, hash-based signatures can so far withstand known attacks using quantum computers. Huelsing, et al. Informational [Page 1] RFC 8391 XMSS May 2018 Status of This Memo This document is not an Internet Standards Track specification; it is published for informational purposes. This document is a product of the Internet Research Task Force (IRTF). The IRTF publishes the results of Internet-related research and development activities. These results might not be suitable for deployment. This RFC represents the consensus of the Crypto Forum Research Group of the Internet Research Task Force (IRTF). Documents approved for publication by the IRSG are not candidates for any level of Internet Standard; see Section 2 of RFC 7841 . Information about the current status of this document, any errata, and how to provide feedback on it may be obtained at https://www.rfc-editor.org/info/rfc8391 . Copyright Notice Copyright (c) 2018 IETF Trust and the persons identified as the document authors. All rights reserved. This document is subject to BCP 78 and the IETF Trust's Legal Provisions Relating to IETF Documents ( https://trustee.ietf.org/license-info ) in effect on the date of publication of this document. Please review these documents carefully, as they describe your rights and restrictions with respect to this document. Huelsing, et al. Informational [Page 2] RFC 8391 XMSS May 2018 Table of Contents 1 . Introduction .................................................... 5 1.1 . CFRG Note on Post-Quantum Cryptography ..................... 6 1.2 . Conventions Used in This Document .......................... 7 2 . Notation ........................................................ 7 2.1 . Data Types ................................................. 7 2.2 . Functions .................................................. 7 2.3 . Operators .................................................. 8 2.4 . Integer-to-Byte Conversion ................................. 9 2.5 . Hash Function Address Scheme ............................... 9 2.6 . Strings of Base w Numbers ................................. 12 2.7 . Member Functions .......................................... 13 3 . Primitives ..................................................... 14 3.1 . WOTS+: One-Time Signatures ................................ 14 3.1.1 . WOTS+ Parameters ................................... 14 3.1.1.1 . WOTS+ Functions ........................... 15 3.1.2 . WOTS+ Chaining Function ............................ 15 3.1.3 . WOTS+ Private Key .................................. 16 3.1.4 . WOTS+ Public Key ................................... 17 3.1.5 . WOTS+ Signature Generation ......................... 17 3.1.6 . WOTS+ Signature Verification ....................... 19 3.1.7 . Pseudorandom Key Generation ........................ 20 4 . Schemes ........................................................ 20 4.1 . XMSS: eXtended Merkle Signature Scheme .................... 20 4.1.1 . XMSS Parameters .................................... 21 4.1.2 . XMSS Hash Functions ................................ 22 4.1.3 . XMSS Private Key ................................... 22 4.1.4 . Randomized Tree Hashing ............................ 23 4.1.5

---

_RFC 8391: XMSS: eXtended Merkle Signature Scheme [ RFC Home ] [ TEXT | PDF | HTML ] [ Tracker ] [ IPR ] [ Errata ] [ Info page ] INFORMATIONAL Errata Exist Internet Research Task Force (IRTF) A. Huelsing Request for Comments: 8391 TU Eindhoven Category: Informational D. Butin ISSN: 2070-1721 TU Darmstadt S. Gazdag genua GmbH J. Rijneveld Radboud University A. Mohaisen University of Central Florida May 2018 XMSS: eXtended Merkle Signature Scheme Abstract This note describes_
