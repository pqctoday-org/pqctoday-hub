---
reference_id: IETF RFC 9370
document_type: Protocol
document_status: Standards Track
date_published: 2023-05-01
date_updated: 2023-05-01
region: International
migration_urgency: High
local_file: public/library/IETF_RFC_9370.html
---

# Multiple Key Exchanges in IKEv2

## Author & Organization

**Organization:** IETF IPSECME

## Scope

**Industries:** VPN; IPsec; Enterprise
**Region:** International
**Document type:** Protocol

## How It Relates to PQC

IKEv2 multiple key exchange framework

**Dependencies:** RFC 7296

## Risks Addressed

**Migration urgency:** High
**Security levels:** N/A

## PQC Key Types & Mechanisms

| Field                  | Value                                 |
| ---------------------- | ------------------------------------- |
| Algorithm family       | Hybrid KEMs                           |
| Security levels        | N/A                                   |
| Protocol / tool impact | IKEv2 multiple key exchange framework |
| Toolchain support      | VPN implementations                   |

## Description

Framework for up to 7 additional KEMs in IKEv2 for PQ/T hybrid approaches.

---

_RFC 9370 Multiple Key Exchanges in IKEv2 May 2023 Tjhai, et al. Standards Track [Page] Stream: Internet Engineering Task Force (IETF) RFC: 9370 Updates: 7296 Category: Standards Track Published: May 2023 ISSN: 2070-1721 Authors: CJ. Tjhai Post-Quantum M. Tomlinson Post-Quantum G. Bartlett Quantum Secret S. Fluhrer Cisco Systems D. Van Geest ISARA Corporation O. Garcia-Morchon Philips V. Smyslov ELVIS-PLUS RFC 9370 Multiple Key Exchanges in the Internet Key Exchange Protocol Version 2 (IKEv2) Abstract This document describes how to extend the Internet Key Exchange Protocol Version 2 (IKEv2) to allow multiple key exchanges to take place while computing a shared secret during a Security Association (SA) setup. ¶ This document utilizes the IKE_INTERMEDIATE exchange, where multiple key exchanges are performed when an IKE SA is being established. It also introduces a new IKEv2 exchange, IKE_FOLLOWUP_KE, which is used for the same purpose when the IKE SA is being rekeyed or is creating additional Child SAs. ¶ This document updates RFC 7296 by renaming a Transform Type 4 from "Diffie-Hellman Group (D-H)" to "Key Exchange Method (KE)" and renaming a field in the Key Exchange Payload from "Diffie-Hellman Group Num" to "Key Exchange Method". It also renames an IANA registry for this Transform Type from "Transform Type 4 - Diffie- Hellman Group Transform IDs" to "Transform Type 4 - Key Exchange Method Transform IDs". These changes generalize key exchange algorithms that can be used in IKEv2. ¶ Status of This Memo This is an Internet Standards Track document. ¶ This document is a product of the Internet Engineering Task Force (IETF). It represents the consensus o_
