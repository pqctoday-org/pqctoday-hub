---
reference_id: IETF RFC 8784
document_type: Protocol
document_status: Standards Track
date_published: 2020-06-01
date_updated: 2020-06-01
region: International
migration_urgency: Medium
local_file: public/library/IETF_RFC_8784.html
---

# Mixing Preshared Keys in IKEv2 for Post-quantum Security

## Author & Organization

**Organization:** IETF IPSECME

## Scope

**Industries:** VPN; Government; High Security
**Region:** International
**Document type:** Protocol

## How It Relates to PQC

Quantum-resistant PSK mixing

**Dependencies:** RFC 7296

## Risks Addressed

**Migration urgency:** Medium
**Security levels:** N/A

## PQC Key Types & Mechanisms

| Field                  | Value                        |
| ---------------------- | ---------------------------- |
| Algorithm family       | Symmetric PSKs               |
| Security levels        | N/A                          |
| Protocol / tool impact | Quantum-resistant PSK mixing |
| Toolchain support      | VPN implementations          |

## Description

Defines Post-quantum Preshared Keys (PPK) for quantum-resistant IKEv2.

---

_RFC 8784 Mixing PSKs in IKEv2 for PQ Security June 2020 Fluhrer, et al. Standards Track [Page] Stream: Internet Engineering Task Force (IETF) RFC: 8784 Category: Standards Track Published: June 2020 ISSN: 2070-1721 Authors: S. Fluhrer Cisco Systems P. Kampanakis Cisco Systems D. McGrew Cisco Systems V. Smyslov ELVIS-PLUS RFC 8784 Mixing Preshared Keys in the Internet Key Exchange Protocol Version 2 (IKEv2) for Post-quantum Security Abstract The possibility of quantum computers poses a serious challenge to cryptographic algorithms deployed widely today. The Internet Key Exchange Protocol Version 2 (IKEv2) is one example of a cryptosystem that could be broken; someone storing VPN communications today could decrypt them at a later time when a quantum computer is available. It is anticipated that IKEv2 will be extended to support quantum-secure key exchange algorithms; however, that is not likely to happen in the near term. To address this problem before then, this document describes an extension of IKEv2 to allow it to be resistant to a quantum computer by using preshared keys. ¶ Status of This Memo This is an Internet Standards Track document. ¶ This document is a product of the Internet Engineering Task Force (IETF). It represents the consensus of the IETF community. It has received public review and has been approved for publication by the Internet Engineering Steering Group (IESG). Further information on Internet Standards is available in Section 2 of RFC 7841. ¶ Information about the current status of this document, any errata, and how to provide feedback on it may be obtained at http_
