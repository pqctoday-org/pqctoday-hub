---
reference_id: draft-wang-ipsecme-hybrid-kem-ikev2-frodo-03
document_type: Protocol
document_status: Internet-Draft (Call for WG Adoption)
date_published: 2024-12-24
date_updated: 2026-01-12
region: International
migration_urgency: Medium
local_file: public/library/draft-wang-ipsecme-hybrid-kem-ikev2-frodo-03.html
---

# Post-quantum Hybrid Key Exchange in IKEv2 with FrodoKEM

## Authors

**Organization:** IETF IPSECME WG

## Scope

**Industries:** VPN; Enterprise; Government; High Security
**Region:** International
**Document type:** Protocol

## How It Relates to PQC

IKEv2/IPsec with FrodoKEM

**Dependencies:** FIPS 203; RFC 7296; RFC 9370

## PQC Risk Profile

**Harvest Now, Decrypt Later:** **HIGH** — Encrypted data captured today can be decrypted by a future quantum computer (harvest-now-decrypt-later attack). Adopting this specification is critical to protect long-lived confidential data.

**Identity & Authentication Integrity:** Not directly addressed by this document.

**Digital Signature Integrity:** Not directly addressed by this document.

**Migration urgency:** Medium

## PQC Key Types & Mechanisms

| Field                  | Value                           |
| ---------------------- | ------------------------------- |
| Algorithm family       | Unstructured Lattice (FrodoKEM) |
| Security levels        | L1,L3,L5                        |
| Protocol / tool impact | IKEv2/IPsec with FrodoKEM       |
| Toolchain support      | VPN implementations             |

## Short Description

Specifies FrodoKEM as additional KEM for IKEv2 hybrid key exchange. Unstructured lattice-based KEM providing conservative security. WG adoption call ending Feb 2026.

## Long Description

Skip to main content Datatracker Groups By area/parent Apps & Realtime General Internet Ops & Management Routing Security Web and Internet Transport IESG IAB IRTF IETF LLC RFC Editor Other Active AGs Active Areas Active Directorates Active IAB Workshops Active Programs Active RAGs Active Teams New work Chartering groups BOFs BOF Requests Other groups Concluded groups Non-WG lists Documents Search Recent I-Ds Submit an Internet-Draft RFC streams IAB IRTF ISE Editorial Subseries STD BCP FYI Meetings Agenda Materials Floor plan Registration Important dates Request a session Session requests Upcoming meetings Upcoming meetings Past meetings Past meetings Meeting proceedings Other IPR disclosures Liaison statements IESG agenda NomComs Downref registry Statistics I-Ds/RFCs Meetings API Help Release notes System status Report a bug User Sign in Password reset Preferences New account List subscriptions IETF Lists IRTF Lists IAB Lists RFC-Editor Lists Report a bug Sign in Post-quantum Hybrid Key Exchange in IKEv2 with FrodoKEM draft-wang-ipsecme-hybrid-kem-ikev2-frodo-03 Status IESG evaluation record IESG writeups Email expansions History Versions: 00 01 02 03 Document Type Active Internet-Draft ( ipsecme WG ) Authors Guilin WANG , Leonie Bruckert , Valery Smyslov Last updated 2026-02-16 (Latest revision 2025-12-24) Replaces draft-wang-hybrid-kem-ikev2-frodo RFC stream Internet Engineering Task Force (IETF) Intended RFC status (None) Formats txt html xml htmlized bibtex bibxml Additional resources Mailing list discussion Stream WG state Adopted by a WG Document shepherd (None) IESG IESG state

---

_Skip to main content Datatracker Groups By area/parent Apps & Realtime General Internet Ops & Management Routing Security Web and Internet Transport IESG IAB IRTF IETF LLC RFC Editor Other Active AGs Active Areas Active Directorates Active IAB Workshops Active Programs Active RAGs Active Teams New work Chartering groups BOFs BOF Requests Other groups Concluded groups Non-WG lists Documents Search Recent I-Ds Submit an Internet-Draft RFC streams IAB IRTF ISE Editorial Subseries STD BCP FYI Meetings Agenda Materials Floor plan_
