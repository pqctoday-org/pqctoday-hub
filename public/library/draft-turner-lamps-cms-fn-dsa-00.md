---
reference_id: draft-turner-lamps-cms-fn-dsa-00
document_type: Protocol
document_status: Internet-Draft (Individual Submission)
date_published: 2025-11-04
date_updated: 2025-11-04
region: International
migration_urgency: Medium
local_file: public/library/draft-turner-lamps-cms-fn-dsa-00.html
---

# Use of the FN-DSA Signature Algorithm in the Cryptographic Message Syntax (CMS)

## Authors

**Organization:** IETF LAMPS

## Scope

**Industries:** Email; Messaging; Document Signing
**Region:** International
**Document type:** Protocol

## How It Relates to PQC

CMS signatures with FN-DSA

**Dependencies:** FIPS 206; RFC 5652

## PQC Risk Profile

**Harvest Now, Decrypt Later:** Not directly addressed by this document.

**Identity & Authentication Integrity:** Not directly addressed by this document.

**Digital Signature Integrity:** **HIGH** — Classical digital signatures (RSA, ECDSA) are vulnerable to quantum forgery. Code signing, firmware integrity, and legally binding digital signatures depend on adopting post-quantum signature schemes.

**Migration urgency:** Medium

## PQC Key Types & Mechanisms

| Field                  | Value                      |
| ---------------------- | -------------------------- |
| Algorithm family       | Lattice-based (NTRU)       |
| Security levels        | L1,L5                      |
| Protocol / tool impact | CMS signatures with FN-DSA |
| Toolchain support      | In development             |

## Short Description

Defines FN-DSA (FALCON/FIPS 206) signature usage in CMS. Expires May 2026.

## Long Description

Skip to main content Datatracker Groups By area/parent Apps & Realtime General Internet Ops & Management Routing Security Web and Internet Transport IESG IAB IRTF IETF LLC RFC Editor Other Active AGs Active Areas Active Directorates Active IAB Workshops Active Programs Active RAGs Active Teams New work Chartering groups BOFs BOF Requests Other groups Concluded groups Non-WG lists Documents Search Recent I-Ds Submit an Internet-Draft RFC streams IAB IRTF ISE Editorial Subseries STD BCP FYI Meetings Agenda Materials Floor plan Registration Important dates Request a session Session requests Upcoming meetings Upcoming meetings Past meetings Past meetings Meeting proceedings Other IPR disclosures Liaison statements IESG agenda NomComs Downref registry Statistics I-Ds/RFCs Meetings API Help Release notes System status Report a bug User Sign in Password reset Preferences New account List subscriptions IETF Lists IRTF Lists IAB Lists RFC-Editor Lists Report a bug Sign in Use of the FN-DSA Signature Algorithm in the Cryptographic Message Syntax (CMS) draft-turner-lamps-cms-fn-dsa-00 Status Email expansions History Versions: 00 This document is an Internet-Draft (I-D). Anyone may submit an I-D to the IETF. This I-D is not endorsed by the IETF and has no formal standing in the IETF standards process . Document Type Active Internet-Draft (individual) Authors Daniel Van Geest , Sean Turner Last updated 2025-11-04 RFC stream (None) Intended RFC status (None) Formats txt html xml htmlized bibtex bibxml Stream Stream state (No stream defined) Consensus boilerplate Unknown RFC Editor Note (None) IESG IESG state I-D Exists Telechat date (None) Responsible AD (None) Send notices to

---

_Skip to main content Datatracker Groups By area/parent Apps & Realtime General Internet Ops & Management Routing Security Web and Internet Transport IESG IAB IRTF IETF LLC RFC Editor Other Active AGs Active Areas Active Directorates Active IAB Workshops Active Programs Active RAGs Active Teams New work Chartering groups BOFs BOF Requests Other groups Concluded groups Non-WG lists Documents Search Recent I-Ds Submit an Internet-Draft RFC streams IAB IRTF ISE Editorial Subseries STD BCP FYI Meetings Agenda Materials Floor plan_
