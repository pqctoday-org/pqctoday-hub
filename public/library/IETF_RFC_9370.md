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

## Authors

**Organization:** IETF IPSECME

## Scope

**Industries:** VPN; IPsec; Enterprise
**Region:** International
**Document type:** Protocol

## How It Relates to PQC

IKEv2 multiple key exchange framework

**Dependencies:** RFC 7296

## PQC Risk Profile

**Harvest Now, Decrypt Later:** **HIGH** — Encrypted data captured today can be decrypted by a future quantum computer (harvest-now-decrypt-later attack). Adopting this specification is critical to protect long-lived confidential data.

**Identity & Authentication Integrity:** Not directly addressed by this document.

**Digital Signature Integrity:** Not directly addressed by this document.

**Migration urgency:** High

## PQC Key Types & Mechanisms

| Field                  | Value                                 |
| ---------------------- | ------------------------------------- |
| Algorithm family       | Hybrid KEMs                           |
| Security levels        | N/A                                   |
| Protocol / tool impact | IKEv2 multiple key exchange framework |
| Toolchain support      | VPN implementations                   |

## Short Description

Framework for up to 7 additional KEMs in IKEv2 for PQ/T hybrid approaches.

## Long Description

RFC 9370 Multiple Key Exchanges in IKEv2 May 2023 Tjhai, et al. Standards Track [Page] Stream: Internet Engineering Task Force (IETF) RFC: 9370 Updates: 7296 Category: Standards Track Published: May 2023 ISSN: 2070-1721 Authors: CJ. Tjhai Post-Quantum M. Tomlinson Post-Quantum G. Bartlett Quantum Secret S. Fluhrer Cisco Systems D. Van Geest ISARA Corporation O. Garcia-Morchon Philips V. Smyslov ELVIS-PLUS RFC 9370 Multiple Key Exchanges in the Internet Key Exchange Protocol Version 2 (IKEv2) Abstract This document describes how to extend the Internet Key Exchange Protocol Version 2 (IKEv2) to allow multiple key exchanges to take place while computing a shared secret during a Security Association (SA) setup. ¶ This document utilizes the IKE_INTERMEDIATE exchange, where multiple key exchanges are performed when an IKE SA is being established. It also introduces a new IKEv2 exchange, IKE_FOLLOWUP_KE, which is used for the same purpose when the IKE SA is being rekeyed or is creating additional Child SAs. ¶ This document updates RFC 7296 by renaming a Transform Type 4 from "Diffie-Hellman Group (D-H)" to "Key Exchange Method (KE)" and renaming a field in the Key Exchange Payload from "Diffie-Hellman Group Num" to "Key Exchange Method". It also renames an IANA registry for this Transform Type from "Transform Type 4 - Diffie- Hellman Group Transform IDs" to "Transform Type 4 - Key Exchange Method Transform IDs". These changes generalize key exchange algorithms that can be used in IKEv2. ¶ Status of This Memo This is an Internet Standards Track document. ¶ This document is a product of the Internet Engineering Task Force (IETF). It represents the consensus of the IETF community. It has received public review and has been approved for publication by the Internet Engineering Steering Group (IESG). Further information on Internet Standards is available in Section 2 of RFC 7841. ¶ Information about the current status of this document, any errata, and how to provide feedback on it may be obtained at https://www.rfc-editor.org/info/rfc9370 . ¶ Copyright Notice Copyright (c) 2023 IETF Trust and the persons identified as the document authors. All rights reserved. ¶ This document is subject to BCP 78 and the IETF Trust's Legal Provisions Relating to IETF Documents ( https://trustee.ietf.org/license-info ) in effect on the date of publication of this document. Please review these documents carefully, as they describe your rights and restrictions with respect to this document. Code Components extracted from this document must include Revised BSD License text as described in Section 4.e of the Trust Legal Provisions and are provided without warranty as described in the Revised BSD License. ¶ ▲ Table of Contents 1 . Introduction 1.1 . Problem Description 1.2 . Proposed Extension 1.3 . Document Organization 2 . Multiple Key Exchanges 2.1 . Design Overview 2.2 . Protocol Details 2.2.1 . IKE_SA_INIT Round: Negotiation 2.2.2 . IKE_INTERMEDIATE Round: Additional Key Exchanges 2.2.3 . IKE_AUTH Exchange 2.2.4 . CREATE_CHILD_SA Exchange 2.2.5 . Interaction with IKEv2 Extensions 3 . IANA Considerations 4 . Security Considerations 5 . References 5.1 . Normative References 5.2 . Informative References Appendix A . Sample Multiple Key Exchanges A.1 . IKE_INTERMEDIATE Exchanges Carrying Additional Key Exchange Payloads A.2 . No Additional Key Exchange Used A.3 . Additional Key Exchange in the CREATE_CHILD_SA Exchange Only A.4 . No Matching Proposal for Additional Key Exchanges Appendix B . Design Criteria Appendix C . Alternative Design Acknowledgements Authors' Addresses 1. Introduction 1.1. Problem Description The Internet Key Exchange Protocol version 2 (IKEv2), as specified in [ RFC7296 ] , uses the Diffie-Hellman (DH) or the Elliptic Curve Diffie-Hellman (ECDH) algorithm, which shall be referred to as "(EC)DH" collectively, to establish a shared

---

_RFC 9370 Multiple Key Exchanges in IKEv2 May 2023 Tjhai, et al. Standards Track [Page] Stream: Internet Engineering Task Force (IETF) RFC: 9370 Updates: 7296 Category: Standards Track Published: May 2023 ISSN: 2070-1721 Authors: CJ. Tjhai Post-Quantum M. Tomlinson Post-Quantum G. Bartlett Quantum Secret S. Fluhrer Cisco Systems D. Van Geest ISARA Corporation O. Garcia-Morchon Philips V. Smyslov ELVIS-PLUS RFC 9370 Multiple Key Exchanges in the Internet Key Exchange Protocol Version 2 (IKEv2) Abstract This document describes how to extend_
