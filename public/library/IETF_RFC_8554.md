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

## Author & Organization

**Organization:** IETF CFRG

## Scope

**Industries:** Firmware; Critical Infrastructure; Secure Boot
**Region:** International
**Document type:** Algorithm

## How It Relates to PQC

Secure boot and firmware signing

**Dependencies:** SP 800-208

## Risks Addressed

**Migration urgency:** Medium
**Security levels:** L1-L5

## PQC Key Types & Mechanisms

| Field                  | Value                            |
| ---------------------- | -------------------------------- |
| Algorithm family       | Hash-based (stateful)            |
| Security levels        | L1-L5                            |
| Protocol / tool impact | Secure boot and firmware signing |
| Toolchain support      | wolfSSL; Bouncy Castle           |

## Description

Specifies LMS/HSS stateful hash-based signature schemes.

---

_RFC 8554: Leighton-Micali Hash-Based Signatures [ RFC Home ] [ TEXT | PDF | HTML ] [ Tracker ] [ IPR ] [ Errata ] [ Info page ] INFORMATIONAL Errata Exist Internet Research Task Force (IRTF) D. McGrew Request for Comments: 8554 M. Curcio Category: Informational S. Fluhrer ISSN: 2070-1721 Cisco Systems April 2019 Leighton-Micali Hash-Based Signatures Abstract This note describes a digital-signature system based on cryptographic hash functions, following the seminal work in this area of Lamport, Diffie, Winternitz, and Merkle, as adapted by Leighton and Micali in 1995. It specifies a one-time signature scheme and a general signature scheme. These systems provide asymmetric authentication without using large integer mathematics and can achieve a high security level. They are suitable for compact implementations, are relatively simple to implement, and are naturally resistant to side- channel attacks. Unlike many other signature systems, hash-based signatures would still be secure even if it proves feasible for an attacker to build a quantum computer. This document is a product of the Crypto Forum Research Group (CFRG) in the IRTF. This has been reviewed by many researchers, both in the research group and outside of it. The Acknowledgements section lists many of them. Status of This Memo This document is not an Internet Standards Track specification_
