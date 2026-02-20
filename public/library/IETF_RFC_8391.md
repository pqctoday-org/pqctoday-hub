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

## Author & Organization

**Organization:** IETF CFRG

## Scope

**Industries:** Firmware; Long-term Security; Archival
**Region:** International
**Document type:** Algorithm

## How It Relates to PQC

Firmware and long-term signatures

**Dependencies:** SP 800-208

## Risks Addressed

**Migration urgency:** Medium
**Security levels:** L1-L5

## PQC Key Types & Mechanisms

| Field                  | Value                             |
| ---------------------- | --------------------------------- |
| Algorithm family       | Hash-based (stateful)             |
| Security levels        | L1-L5                             |
| Protocol / tool impact | Firmware and long-term signatures |
| Toolchain support      | Various implementations           |

## Description

Specifies XMSS stateful hash-based signatures for long-term security.

---

_RFC 8391: XMSS: eXtended Merkle Signature Scheme [ RFC Home ] [ TEXT | PDF | HTML ] [ Tracker ] [ IPR ] [ Errata ] [ Info page ] INFORMATIONAL Errata Exist Internet Research Task Force (IRTF) A. Huelsing Request for Comments: 8391 TU Eindhoven Category: Informational D. Butin ISSN: 2070-1721 TU Darmstadt S. Gazdag genua GmbH J. Rijneveld Radboud University A. Mohaisen University of Central Florida May 2018 XMSS: eXtended Merkle Signature Scheme Abstract This note describes the eXtended Merkle Signature Scheme (XMSS), a hash-based digital signature system that is based on existing descriptions in scientific literature. This note specifies Winternitz One-Time Signature Plus (WOTS+), a one-time signature scheme; XMSS, a single-tree scheme; and XMSS^MT, a multi-tree variant of XMSS. Both XMSS and XMSS^MT use WOTS+ as a main building block. XMSS provides cryptographic digital signatures without relying on the conjectured hardness of mathematical problems. Instead, it is proven that it only relies on the properties of cryptog_
