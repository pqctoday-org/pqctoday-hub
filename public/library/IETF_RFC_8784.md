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

## Authors

**Organization:** IETF IPSECME

## Scope

**Industries:** VPN; Government; High Security
**Region:** International
**Document type:** Protocol

## How It Relates to PQC

Quantum-resistant PSK mixing

**Dependencies:** RFC 7296

## PQC Risk Profile

**Harvest Now, Decrypt Later:** **HIGH** — Encrypted data captured today can be decrypted by a future quantum computer (harvest-now-decrypt-later attack). Adopting this specification is critical to protect long-lived confidential data.

**Identity & Authentication Integrity:** **HIGH** — A quantum-capable adversary could forge certificates or impersonate identities protected by classical public-key cryptography. Migration to PQC-safe PKI and authentication systems is essential.

**Digital Signature Integrity:** Not directly addressed by this document.

**Migration urgency:** Medium

## PQC Key Types & Mechanisms

| Field                  | Value                        |
| ---------------------- | ---------------------------- |
| Algorithm family       | Symmetric PSKs               |
| Security levels        | N/A                          |
| Protocol / tool impact | Quantum-resistant PSK mixing |
| Toolchain support      | VPN implementations          |

## Short Description

Defines Post-quantum Preshared Keys (PPK) for quantum-resistant IKEv2.

## Long Description

RFC 8784 Mixing PSKs in IKEv2 for PQ Security June 2020 Fluhrer, et al. Standards Track [Page] Stream: Internet Engineering Task Force (IETF) RFC: 8784 Category: Standards Track Published: June 2020 ISSN: 2070-1721 Authors: S. Fluhrer Cisco Systems P. Kampanakis Cisco Systems D. McGrew Cisco Systems V. Smyslov ELVIS-PLUS RFC 8784 Mixing Preshared Keys in the Internet Key Exchange Protocol Version 2 (IKEv2) for Post-quantum Security Abstract The possibility of quantum computers poses a serious challenge to cryptographic algorithms deployed widely today. The Internet Key Exchange Protocol Version 2 (IKEv2) is one example of a cryptosystem that could be broken; someone storing VPN communications today could decrypt them at a later time when a quantum computer is available. It is anticipated that IKEv2 will be extended to support quantum-secure key exchange algorithms; however, that is not likely to happen in the near term. To address this problem before then, this document describes an extension of IKEv2 to allow it to be resistant to a quantum computer by using preshared keys. ¶ Status of This Memo This is an Internet Standards Track document. ¶ This document is a product of the Internet Engineering Task Force (IETF). It represents the consensus of the IETF community. It has received public review and has been approved for publication by the Internet Engineering Steering Group (IESG). Further information on Internet Standards is available in Section 2 of RFC 7841. ¶ Information about the current status of this document, any errata, and how to provide feedback on it may be obtained at https://www.rfc-editor.org/info/rfc8784 . ¶ Copyright Notice Copyright (c) 2020 IETF Trust and the persons identified as the document authors. All rights reserved. ¶ This document is subject to BCP 78 and the IETF Trust's Legal Provisions Relating to IETF Documents ( https://trustee.ietf.org/license-info ) in effect on the date of publication of this document. Please review these documents carefully, as they describe your rights and restrictions with respect to this document. Code Components extracted from this document must include Simplified BSD License text as described in Section 4.e of the Trust Legal Provisions and are provided without warranty as described in the Simplified BSD License. ¶ ▲ Table of Contents 1 . Introduction ¶ 1.1 . Requirements Language ¶ 2 . Assumptions ¶ 3 . Exchanges ¶ 4 . Upgrade Procedure ¶ 5 . PPK ¶ 5.1 . PPK_ID Format ¶ 5.2 . Operational Considerations ¶ 5.2.1 . PPK Distribution ¶ 5.2.2 . Group PPK ¶ 5.2.3 . PPK-Only Authentication ¶ 6 . Security Considerations ¶ 7 . IANA Considerations ¶ 8 . References ¶ 8.1 . Normative References ¶ 8.2 . Informative References ¶ Appendix A . Discussion and Rationale ¶ Acknowledgements ¶ Authors' Addresses ¶ 1. Introduction Recent achievements in developing quantum computers demonstrate that it is probably feasible to build one that is cryptographically significant. If such a computer is implemented, many of the cryptographic algorithms and protocols currently in use would be insecure. A quantum computer would be able to solve Diffie-Hellman (DH) and Elliptic Curve Diffie-Hellman (ECDH) problems in polynomial time [ C2PQ ] , and this would imply that the security of existing IKEv2 [ RFC7296 ] systems would be compromised. IKEv1 [ RFC2409 ] , when used with strong preshared keys, is not vulnerable to quantum attacks because those keys are one of the inputs to the key derivation function. If the preshared key has sufficient entropy and the Pseudorandom Function (PRF), encryption, and authentication transforms are quantum secure, then the resulting system is believed to be quantum secure -- that is, secure against classical attackers of today or

---

_RFC 8784 Mixing PSKs in IKEv2 for PQ Security June 2020 Fluhrer, et al. Standards Track [Page] Stream: Internet Engineering Task Force (IETF) RFC: 8784 Category: Standards Track Published: June 2020 ISSN: 2070-1721 Authors: S. Fluhrer Cisco Systems P. Kampanakis Cisco Systems D. McGrew Cisco Systems V. Smyslov ELVIS-PLUS RFC 8784 Mixing Preshared Keys in the Internet Key Exchange Protocol Version 2 (IKEv2) for Post-quantum Security Abstract The possibility of quantum computers poses a serious challenge to cryptographic algorithms deployed_
