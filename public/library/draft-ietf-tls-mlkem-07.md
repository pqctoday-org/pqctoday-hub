---
reference_id: draft-ietf-tls-mlkem-07
document_type: Protocol
document_status: Internet-Draft (Revised I-D Needed)
date_published: 2024-05-01
date_updated: 2026-02-12
region: International
migration_urgency: High
local_file: public/library/draft-ietf-tls-mlkem-07.html
---

# ML-KEM Post-Quantum Key Agreement for TLS 1.3

## Authors

**Organization:** IETF TLS WG

## Scope

**Industries:** Web; Cloud; Government
**Region:** International
**Document type:** Protocol

## How It Relates to PQC

TLS 1.3 pure PQ key exchange

**Dependencies:** FIPS 203; RFC 8446

## PQC Risk Profile

**Harvest Now, Decrypt Later:** **HIGH** — Encrypted data captured today can be decrypted by a future quantum computer (harvest-now-decrypt-later attack). Adopting this specification is critical to protect long-lived confidential data.

**Identity & Authentication Integrity:** Not directly addressed by this document.

**Digital Signature Integrity:** Not directly addressed by this document.

**Migration urgency:** High

## PQC Key Types & Mechanisms

| Field                  | Value                        |
| ---------------------- | ---------------------------- |
| Algorithm family       | Lattice-based                |
| Security levels        | L1,L3,L5                     |
| Protocol / tool impact | TLS 1.3 pure PQ key exchange |
| Toolchain support      | Reference implementations    |

## Short Description

Defines ML-KEM-512 ML-KEM-768 and ML-KEM-1024 as NamedGroups for pure PQ key agreement in TLS 1.3. WGLC issues identified requiring revision. Expires Aug 2026.

## Long Description

Skip to main content Datatracker Groups By area/parent Apps & Realtime General Internet Ops & Management Routing Security Web and Internet Transport IESG IAB IRTF IETF LLC RFC Editor Other Active AGs Active Areas Active Directorates Active IAB Workshops Active Programs Active RAGs Active Teams New work Chartering groups BOFs BOF Requests Other groups Concluded groups Non-WG lists Documents Search Recent I-Ds Submit an Internet-Draft RFC streams IAB IRTF ISE Editorial Subseries STD BCP FYI Meetings Agenda Materials Floor plan Registration Important dates Request a session Session requests Upcoming meetings Upcoming meetings Past meetings Past meetings Meeting proceedings Other IPR disclosures Liaison statements IESG agenda NomComs Downref registry Statistics I-Ds/RFCs Meetings API Help Release notes System status Report a bug User Sign in Password reset Preferences New account List subscriptions IETF Lists IRTF Lists IAB Lists RFC-Editor Lists Report a bug Sign in ML-KEM Post-Quantum Key Agreement for TLS 1.3 draft-ietf-tls-mlkem-07 Status IESG evaluation record IESG writeups Email expansions History Versions: 00 01 02 03 04 05 06 07 Document Type Active Internet-Draft ( tls WG ) Author Deirdre Connolly Last updated 2026-02-12 Replaces draft-connolly-tls-mlkem-key-agreement RFC stream Internet Engineering Task Force (IETF) Intended RFC status Informational Formats txt html xml htmlized bibtex bibxml Additional resources GitHub Repository Mailing list discussion Stream WG state WG Document Revised I-D Needed - Is

---

_Skip to main content Datatracker Groups By area/parent Apps & Realtime General Internet Ops & Management Routing Security Web and Internet Transport IESG IAB IRTF IETF LLC RFC Editor Other Active AGs Active Areas Active Directorates Active IAB Workshops Active Programs Active RAGs Active Teams New work Chartering groups BOFs BOF Requests Other groups Concluded groups Non-WG lists Documents Search Recent I-Ds Submit an Internet-Draft RFC streams IAB IRTF ISE Editorial Subseries STD BCP FYI Meetings Agenda Materials Floor plan_
