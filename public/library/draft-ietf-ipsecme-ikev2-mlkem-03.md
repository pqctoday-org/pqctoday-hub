---
reference_id: draft-ietf-ipsecme-ikev2-mlkem-03
document_type: Protocol
document_status: Internet-Draft
date_published: 2023-11-01
date_updated: 2025-09-29
region: International
migration_urgency: High
local_file: public/library/draft-ietf-ipsecme-ikev2-mlkem-03.html
---

# Post-quantum Hybrid Key Exchange with ML-KEM in IKEv2

## Authors

**Organization:** IETF IPSECME WG

## Scope

**Industries:** VPN; Enterprise; Government; Cloud
**Region:** International
**Document type:** Protocol

## How It Relates to PQC

IKEv2/IPsec with ML-KEM

**Dependencies:** FIPS 203; RFC 7296; RFC 9370

## PQC Risk Profile

**Harvest Now, Decrypt Later:** **HIGH** — Encrypted data captured today can be decrypted by a future quantum computer (harvest-now-decrypt-later attack). Adopting this specification is critical to protect long-lived confidential data.

**Identity & Authentication Integrity:** Not directly addressed by this document.

**Digital Signature Integrity:** Not directly addressed by this document.

**Migration urgency:** High

## PQC Key Types & Mechanisms

| Field                  | Value                      |
| ---------------------- | -------------------------- |
| Algorithm family       | Lattice-based              |
| Security levels        | L1,L3,L5                   |
| Protocol / tool impact | IKEv2/IPsec with ML-KEM    |
| Toolchain support      | StrongSwan; Cisco; Juniper |

## Short Description

Specifies ML-KEM in IKEv2 for quantum-resistant VPN and IPsec key establishment.

## Long Description

Skip to main content Datatracker Groups By area/parent Apps & Realtime General Internet Ops & Management Routing Security Web and Internet Transport IESG IAB IRTF IETF LLC RFC Editor Other Active AGs Active Areas Active Directorates Active IAB Workshops Active Programs Active RAGs Active Teams New work Chartering groups BOFs BOF Requests Other groups Concluded groups Non-WG lists Documents Search Recent I-Ds Submit an Internet-Draft RFC streams IAB IRTF ISE Editorial Subseries STD BCP FYI Meetings Agenda Materials Floor plan Registration Important dates Request a session Session requests Upcoming meetings Upcoming meetings Past meetings Past meetings Meeting proceedings Other IPR disclosures Liaison statements IESG agenda NomComs Downref registry Statistics I-Ds/RFCs Meetings API Help Release notes System status Report a bug User Sign in Password reset Preferences New account List subscriptions IETF Lists IRTF Lists IAB Lists RFC-Editor Lists Report a bug Sign in Post-quantum Hybrid Key Exchange with ML-KEM in the Internet Key Exchange Protocol Version 2 (IKEv2) draft-ietf-ipsecme-ikev2-mlkem-03 Status IESG evaluation record IESG writeups Email expansions History Versions: 00 01 02 03 Document Type Active Internet-Draft ( ipsecme WG ) Author Panos Kampanakis Last updated 2025-10-05 (Latest revision 2025-09-29) Replaces draft-kampanakis-ml-kem-ikev2 RFC stream Internet Engineering Task Force (IETF) Intended RFC status Proposed Standard Formats txt html xml htmlized bibtex bibxml Additional resources Mailing list discussion Stream WG state WG Consensus: Waiting for Write-Up Document shepherd (None) IESG IESG state

---

_Skip to main content Datatracker Groups By area/parent Apps & Realtime General Internet Ops & Management Routing Security Web and Internet Transport IESG IAB IRTF IETF LLC RFC Editor Other Active AGs Active Areas Active Directorates Active IAB Workshops Active Programs Active RAGs Active Teams New work Chartering groups BOFs BOF Requests Other groups Concluded groups Non-WG lists Documents Search Recent I-Ds Submit an Internet-Draft RFC streams IAB IRTF ISE Editorial Subseries STD BCP FYI Meetings Agenda Materials Floor plan_
