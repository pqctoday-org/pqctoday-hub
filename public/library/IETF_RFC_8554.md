---
reference_id: IETF RFC 8554
document_type: Algorithm
document_status: Informational
date_published: 2019-04-01
date_updated: 2019-04-01
region: International
migration_urgency: Medium
local_file: public/library/IETF_RFC_8554.html
---

# Leighton-Micali Hash-Based Signatures

## Authors

**Authors:** D. McGrew, M. Curcio, S. Fluhrer
**Organization:** IETF CFRG

## Scope

**Industries:** Firmware; Critical Infrastructure; Secure Boot
**Region:** International
**Document type:** Algorithm

## How It Relates to PQC

Secure boot and firmware signing

**Dependencies:** SP 800-208

## PQC Risk Profile

**Harvest Now, Decrypt Later:** Not directly addressed by this document.

**Identity & Authentication Integrity:** **HIGH** — A quantum-capable adversary could forge certificates or impersonate identities protected by classical public-key cryptography. Migration to PQC-safe PKI and authentication systems is essential.

**Digital Signature Integrity:** **HIGH** — Classical digital signatures (RSA, ECDSA) are vulnerable to quantum forgery. Code signing, firmware integrity, and legally binding digital signatures depend on adopting post-quantum signature schemes.

**Migration urgency:** Medium

## PQC Key Types & Mechanisms

| Field                  | Value                            |
| ---------------------- | -------------------------------- |
| Algorithm family       | Hash-based (stateful)            |
| Security levels        | L1-L5                            |
| Protocol / tool impact | Secure boot and firmware signing |
| Toolchain support      | wolfSSL; Bouncy Castle           |

## Short Description

Specifies LMS/HSS stateful hash-based signature schemes.

## Long Description

RFC 8554: Leighton-Micali Hash-Based Signatures [ RFC Home ] [ TEXT | PDF | HTML ] [ Tracker ] [ IPR ] [ Errata ] [ Info page ] INFORMATIONAL Errata Exist Internet Research Task Force (IRTF) D. McGrew Request for Comments: 8554 M. Curcio Category: Informational S. Fluhrer ISSN: 2070-1721 Cisco Systems April 2019 Leighton-Micali Hash-Based Signatures Abstract This note describes a digital-signature system based on cryptographic hash functions, following the seminal work in this area of Lamport, Diffie, Winternitz, and Merkle, as adapted by Leighton and Micali in 1995. It specifies a one-time signature scheme and a general signature scheme. These systems provide asymmetric authentication without using large integer mathematics and can achieve a high security level. They are suitable for compact implementations, are relatively simple to implement, and are naturally resistant to side- channel attacks. Unlike many other signature systems, hash-based signatures would still be secure even if it proves feasible for an attacker to build a quantum computer. This document is a product of the Crypto Forum Research Group (CFRG) in the IRTF. This has been reviewed by many researchers, both in the research group and outside of it. The Acknowledgements section lists many of them. Status of This Memo This document is not an Internet Standards Track specification; it is published for informational purposes. This document is a product of the Internet Research Task Force (IRTF). The IRTF publishes the results of Internet-related research and development activities. These results might not be suitable for deployment. This RFC represents the consensus of the Crypto Forum Research Group of the Internet Research Task Force (IRTF). Documents approved for publication by the IRSG are not candidates for any level of Internet Standard; see Section 2 of RFC 7841 . Information about the current status of this document, any errata, and how to provide feedback on it may be obtained at https://www.rfc-editor.org/info/rfc8554 . McGrew, et al. Informational [Page 1] RFC 8554 LMS Hash-Based Signatures April 2019 Copyright Notice Copyright (c) 2019 IETF Trust and the persons identified as the document authors. All rights reserved. This document is subject to BCP 78 and the IETF Trust's Legal Provisions Relating to IETF Documents ( https://trustee.ietf.org/license-info ) in effect on the date of publication of this document. Please review these documents carefully, as they describe your rights and restrictions with respect to this document. Table of Contents 1 . Introduction . . . . . . . . . . . . . . . . . . . . . . . . 3 1.1 . CFRG Note on Post-Quantum Cryptography . . . . . . . . . 5 1.2 . Intellectual Property . . . . . . . . . . . . . . . . . . 6 1.2.1 . Disclaimer . . . . . . . . . . . . . . . . . . . . . 6 1.3 . Conventions Used in This Document . . . . . . . . . . . . 6 2 . Interface . . . . . . . . . . . . . . . . . . . . . . . . . . 6 3 . Notation . . . . . . . . . . . . . . . . . . . . . . . . . . 7 3.1 . Data Types . . . . . . . . . . . . . . . . . . . . . . . 7 3.1.1 . Operators .

---

_RFC 8554: Leighton-Micali Hash-Based Signatures [ RFC Home ] [ TEXT | PDF | HTML ] [ Tracker ] [ IPR ] [ Errata ] [ Info page ] INFORMATIONAL Errata Exist Internet Research Task Force (IRTF) D. McGrew Request for Comments: 8554 M. Curcio Category: Informational S. Fluhrer ISSN: 2070-1721 Cisco Systems April 2019 Leighton-Micali Hash-Based Signatures Abstract This note describes a digital-signature system based on cryptographic hash functions, following the seminal work in this area of Lamport, Diffie,_
