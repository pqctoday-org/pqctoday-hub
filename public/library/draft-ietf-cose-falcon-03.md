---
reference_id: draft-ietf-cose-falcon-03
document_type: Protocol
document_status: Internet-Draft
date_published: 2025-10-12
date_updated: 2025-10-12
region: International
migration_urgency: Medium
local_file: public/library/draft-ietf-cose-falcon-03.html
---

# FN-DSA for JOSE and COSE

## Authors

**Organization:** IETF COSE WG

## Scope

**Industries:** Web APIs; IoT; CBOR; JSON
**Region:** International
**Document type:** Protocol

## How It Relates to PQC

JOSE/COSE with FN-DSA signatures

**Dependencies:** FIPS 206; RFC 9052; RFC 7515

## PQC Risk Profile

**Harvest Now, Decrypt Later:** **HIGH** — Encrypted data captured today can be decrypted by a future quantum computer (harvest-now-decrypt-later attack). Adopting this specification is critical to protect long-lived confidential data.

**Identity & Authentication Integrity:** Not directly addressed by this document.

**Digital Signature Integrity:** **HIGH** — Classical digital signatures (RSA, ECDSA) are vulnerable to quantum forgery. Code signing, firmware integrity, and legally binding digital signatures depend on adopting post-quantum signature schemes.

**Migration urgency:** Medium

## PQC Key Types & Mechanisms

| Field                  | Value                            |
| ---------------------- | -------------------------------- |
| Algorithm family       | Lattice-based (NTRU)             |
| Security levels        | L1,L5                            |
| Protocol / tool impact | JOSE/COSE with FN-DSA signatures |
| Toolchain support      | Web API implementations          |

## Short Description

Defines FN-DSA (FALCON) algorithm identifiers and serialization for JSON Object Signing and Encryption (JOSE) and CBOR Object Signing and Encryption (COSE).

## Long Description

Skip to main content Datatracker Groups By area/parent Apps & Realtime General Internet Ops & Management Routing Security Web and Internet Transport IESG IAB IRTF IETF LLC RFC Editor Other Active AGs Active Areas Active Directorates Active IAB Workshops Active Programs Active RAGs Active Teams New work Chartering groups BOFs BOF Requests Other groups Concluded groups Non-WG lists Documents Search Recent I-Ds Submit an Internet-Draft RFC streams IAB IRTF ISE Editorial Subseries STD BCP FYI Meetings Agenda Materials Floor plan Registration Important dates Request a session Session requests Upcoming meetings Upcoming meetings Past meetings Past meetings Meeting proceedings Other IPR disclosures Liaison statements IESG agenda NomComs Downref registry Statistics I-Ds/RFCs Meetings API Help Release notes System status Report a bug User Sign in Password reset Preferences New account List subscriptions IETF Lists IRTF Lists IAB Lists RFC-Editor Lists Report a bug Sign in FN-DSA for JOSE and COSE draft-ietf-cose-falcon-03 Status IESG evaluation record IESG writeups Email expansions History Versions: 00 01 02 03 Document Type Active Internet-Draft ( cose WG ) Authors Michael Prorock , Orie Steele , Hannes Tschofenig Last updated 2025-10-12 Replaces draft-ietf-cose-post-quantum-signatures RFC stream Internet Engineering Task Force (IETF) Intended RFC status (None) Formats txt html xml htmlized bibtex bibxml Additional resources GitHub Repository Mailing list discussion Stream WG state WG Document Associated WG milestone Jan 2026 One or more documents describing the proper use of algorithms.

---

_Skip to main content Datatracker Groups By area/parent Apps & Realtime General Internet Ops & Management Routing Security Web and Internet Transport IESG IAB IRTF IETF LLC RFC Editor Other Active AGs Active Areas Active Directorates Active IAB Workshops Active Programs Active RAGs Active Teams New work Chartering groups BOFs BOF Requests Other groups Concluded groups Non-WG lists Documents Search Recent I-Ds Submit an Internet-Draft RFC streams IAB IRTF ISE Editorial Subseries STD BCP FYI Meetings Agenda Materials Floor plan_
