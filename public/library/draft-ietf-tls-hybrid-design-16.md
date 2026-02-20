---
reference_id: draft-ietf-tls-hybrid-design-16
document_type: Protocol
document_status: Internet-Draft
date_published: 2020-08-01
date_updated: 2025-09-07
region: International
migration_urgency: High
local_file: public/library/draft-ietf-tls-hybrid-design-16.html
---

# Hybrid key exchange in TLS 1.3

## Authors

**Organization:** IETF TLS WG

## Scope

**Industries:** Web; Cloud; Enterprise; IoT
**Region:** International
**Document type:** Protocol

## How It Relates to PQC

TLS 1.3 hybrid key exchange design

**Dependencies:** RFC 8446; FIPS 203

## PQC Risk Profile

**Harvest Now, Decrypt Later:** **HIGH** — Encrypted data captured today can be decrypted by a future quantum computer (harvest-now-decrypt-later attack). Adopting this specification is critical to protect long-lived confidential data.

**Identity & Authentication Integrity:** Not directly addressed by this document.

**Digital Signature Integrity:** Not directly addressed by this document.

**Migration urgency:** High

## PQC Key Types & Mechanisms

| Field                  | Value                              |
| ---------------------- | ---------------------------------- |
| Algorithm family       | PQ/T Hybrid                        |
| Security levels        | L1,L3,L5                           |
| Protocol / tool impact | TLS 1.3 hybrid key exchange design |
| Toolchain support      | TLS implementations                |

## Short Description

Framework for hybrid key exchange combining traditional and PQ algorithms in TLS 1.3.

## Long Description

Skip to main content Datatracker Groups By area/parent Apps & Realtime General Internet Ops & Management Routing Security Web and Internet Transport IESG IAB IRTF IETF LLC RFC Editor Other Active AGs Active Areas Active Directorates Active IAB Workshops Active Programs Active RAGs Active Teams New work Chartering groups BOFs BOF Requests Other groups Concluded groups Non-WG lists Documents Search Recent I-Ds Submit an Internet-Draft RFC streams IAB IRTF ISE Editorial Subseries STD BCP FYI Meetings Agenda Materials Floor plan Registration Important dates Request a session Session requests Upcoming meetings Upcoming meetings Past meetings Past meetings Meeting proceedings Other IPR disclosures Liaison statements IESG agenda NomComs Downref registry Statistics I-Ds/RFCs Meetings API Help Release notes System status Report a bug User Sign in Password reset Preferences New account List subscriptions IETF Lists IRTF Lists IAB Lists RFC-Editor Lists Report a bug Sign in Hybrid key exchange in TLS 1.3 draft-ietf-tls-hybrid-design-16 Status IESG evaluation record IESG writeups Email expansions History Versions: 00 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 Document Type Active Internet-Draft ( tls WG ) Authors Douglas Stebila , Scott Fluhrer , Shay Gueron Last updated 2025-11-18 (Latest revision 2025-09-07) Replaces draft-stebila-tls-hybrid-design RFC stream Internet Engineering Task Force (IETF) Intended RFC status Informational Formats txt html xml htmlized bibtex bibxml

---

_Skip to main content Datatracker Groups By area/parent Apps & Realtime General Internet Ops & Management Routing Security Web and Internet Transport IESG IAB IRTF IETF LLC RFC Editor Other Active AGs Active Areas Active Directorates Active IAB Workshops Active Programs Active RAGs Active Teams New work Chartering groups BOFs BOF Requests Other groups Concluded groups Non-WG lists Documents Search Recent I-Ds Submit an Internet-Draft RFC streams IAB IRTF ISE Editorial Subseries STD BCP FYI Meetings Agenda Materials Floor plan_
