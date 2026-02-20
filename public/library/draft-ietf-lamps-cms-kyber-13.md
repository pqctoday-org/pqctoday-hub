---
reference_id: draft-ietf-lamps-cms-kyber-13
document_type: Protocol
document_status: RFC 9936 Pending (AUTH48)
date_published: 2023-01-10
date_updated: 2025-09-23
region: International
migration_urgency: High
local_file: public/library/draft-ietf-lamps-cms-kyber-13.html
---

# Use of ML-KEM in the Cryptographic Message Syntax (CMS)

## Authors

**Organization:** IETF LAMPS

## Scope

**Industries:** Secure Messaging; Document Encryption; Email
**Region:** International
**Document type:** Protocol

## How It Relates to PQC

CMS PQ KEM encryption

**Dependencies:** RFC 9629; FIPS 203

## PQC Risk Profile

**Harvest Now, Decrypt Later:** **HIGH** — Encrypted data captured today can be decrypted by a future quantum computer (harvest-now-decrypt-later attack). Adopting this specification is critical to protect long-lived confidential data.

**Identity & Authentication Integrity:** Not directly addressed by this document.

**Digital Signature Integrity:** Not directly addressed by this document.

**Migration urgency:** High

## PQC Key Types & Mechanisms

| Field                  | Value                 |
| ---------------------- | --------------------- |
| Algorithm family       | Lattice-based         |
| Security levels        | L1,L3,L5              |
| Protocol / tool impact | CMS PQ KEM encryption |
| Toolchain support      | OpenSSL CMS           |

## Short Description

ML-KEM in CMS using KEMRecipientInfo from RFC 9629. Submitted to IESG and in RFC Editor Queue as RFC 9936 (AUTH48 stage).

## Long Description

Skip to main content Datatracker Groups By area/parent Apps & Realtime General Internet Ops & Management Routing Security Web and Internet Transport IESG IAB IRTF IETF LLC RFC Editor Other Active AGs Active Areas Active Directorates Active IAB Workshops Active Programs Active RAGs Active Teams New work Chartering groups BOFs BOF Requests Other groups Concluded groups Non-WG lists Documents Search Recent I-Ds Submit an Internet-Draft RFC streams IAB IRTF ISE Editorial Subseries STD BCP FYI Meetings Agenda Materials Floor plan Registration Important dates Request a session Session requests Upcoming meetings Upcoming meetings Past meetings Past meetings Meeting proceedings Other IPR disclosures Liaison statements IESG agenda NomComs Downref registry Statistics I-Ds/RFCs Meetings API Help Release notes System status Report a bug User Sign in Password reset Preferences New account List subscriptions IETF Lists IRTF Lists IAB Lists RFC-Editor Lists Report a bug Sign in Use of ML-KEM in the Cryptographic Message Syntax (CMS) draft-ietf-lamps-cms-kyber-13 Status IESG evaluation record IESG writeups Email expansions History Versions: 00 01 02 03 04 05 06 07 08 09 10 11 12 13 Document Type Active Internet-Draft ( lamps WG ) Authors PRAT Julien , Mike Ounsworth , Daniel Van Geest Last updated 2026-02-09 (Latest revision 2025-09-23) Replaces draft-ietf-lamps-kyber RFC stream Internet Engineering Task Force (IETF) Intended RFC status Proposed Standard Formats txt html xml htmlized bibtex bibxml Reviews SECDIR Telechat review (of -11) by Yaron Sheffer

---

_Skip to main content Datatracker Groups By area/parent Apps & Realtime General Internet Ops & Management Routing Security Web and Internet Transport IESG IAB IRTF IETF LLC RFC Editor Other Active AGs Active Areas Active Directorates Active IAB Workshops Active Programs Active RAGs Active Teams New work Chartering groups BOFs BOF Requests Other groups Concluded groups Non-WG lists Documents Search Recent I-Ds Submit an Internet-Draft RFC streams IAB IRTF ISE Editorial Subseries STD BCP FYI Meetings Agenda Materials Floor plan_
