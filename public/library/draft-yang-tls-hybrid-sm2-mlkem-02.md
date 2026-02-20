---
reference_id: draft-yang-tls-hybrid-sm2-mlkem-02
document_type: Protocol
document_status: Internet-Draft
date_published: 2024-08-01
date_updated: 2025-02-12
region: China; Asia
migration_urgency: Medium
local_file: public/library/draft-yang-tls-hybrid-sm2-mlkem-02.html
---

# Hybrid Post-quantum Key Exchange SM2-MLKEM for TLSv1.3

## Authors

**Organization:** IETF Individual Submission

## Scope

**Industries:** China; Asia-Pacific; Government
**Region:** China; Asia
**Document type:** Protocol

## How It Relates to PQC

TLS for Chinese standards compliance

**Dependencies:** FIPS 203; GM/T 0003.2; ISO/IEC 14888-3

## PQC Risk Profile

**Harvest Now, Decrypt Later:** **HIGH** — Encrypted data captured today can be decrypted by a future quantum computer (harvest-now-decrypt-later attack). Adopting this specification is critical to protect long-lived confidential data.

**Identity & Authentication Integrity:** Not directly addressed by this document.

**Digital Signature Integrity:** Not directly addressed by this document.

**Migration urgency:** Medium

## PQC Key Types & Mechanisms

| Field                  | Value                                |
| ---------------------- | ------------------------------------ |
| Algorithm family       | SM2 + Lattice                        |
| Security levels        | L3                                   |
| Protocol / tool impact | TLS for Chinese standards compliance |
| Toolchain support      | Chinese TLS implementations          |

## Short Description

Defines curveSM2MLKEM768 hybrid for TLS 1.3 combining Chinese SM2 curve with ML-KEM.

## Long Description

Skip to main content Datatracker Groups By area/parent Apps & Realtime General Internet Ops & Management Routing Security Web and Internet Transport IESG IAB IRTF IETF LLC RFC Editor Other Active AGs Active Areas Active Directorates Active IAB Workshops Active Programs Active RAGs Active Teams New work Chartering groups BOFs BOF Requests Other groups Concluded groups Non-WG lists Documents Search Recent I-Ds Submit an Internet-Draft RFC streams IAB IRTF ISE Editorial Subseries STD BCP FYI Meetings Agenda Materials Floor plan Registration Important dates Request a session Session requests Upcoming meetings Upcoming meetings Past meetings Past meetings Meeting proceedings Other IPR disclosures Liaison statements IESG agenda NomComs Downref registry Statistics I-Ds/RFCs Meetings API Help Release notes System status Report a bug User Sign in Password reset Preferences New account List subscriptions IETF Lists IRTF Lists IAB Lists RFC-Editor Lists Report a bug Sign in Hybrid Post-quantum Key Exchange SM2-MLKEM for TLSv1.3 draft-yang-tls-hybrid-sm2-mlkem-03 Status Email expansions History Versions: 00 01 02 03 This document is an Internet-Draft (I-D). Anyone may submit an I-D to the IETF. This I-D is not endorsed by the IETF and has no formal standing in the IETF standards process . Document Type Active Internet-Draft (individual) Authors Paul Yang , Cong Peng , Jin Hu , Shine Sun Last updated 2025-11-14 RFC stream (None) Intended RFC status (None) Formats txt html xml htmlized bibtex bibxml Additional resources Draft on GitHub Stream Stream state (No stream defined) Consensus boilerplate Unknown RFC Editor Note (None) IESG IESG state I-D Exists

---

_Skip to main content Datatracker Groups By area/parent Apps & Realtime General Internet Ops & Management Routing Security Web and Internet Transport IESG IAB IRTF IETF LLC RFC Editor Other Active AGs Active Areas Active Directorates Active IAB Workshops Active Programs Active RAGs Active Teams New work Chartering groups BOFs BOF Requests Other groups Concluded groups Non-WG lists Documents Search Recent I-Ds Submit an Internet-Draft RFC streams IAB IRTF ISE Editorial Subseries STD BCP FYI Meetings Agenda Materials Floor plan_
