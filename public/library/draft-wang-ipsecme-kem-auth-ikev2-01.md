---
reference_id: draft-wang-ipsecme-kem-auth-ikev2-01
document_type: Protocol
document_status: Internet-Draft
date_published: 2025-03-03
date_updated: 2025-07-07
region: International
migration_urgency: Medium
local_file: public/library/draft-wang-ipsecme-kem-auth-ikev2-01.html
---

# KEM based Authentication for IKEv2 with Post-quantum Security

## Authors

**Organization:** IETF Individual Submission

## Scope

**Industries:** VPN; Enterprise; Government
**Region:** International
**Document type:** Protocol

## How It Relates to PQC

IKEv2 authentication with KEMs

**Dependencies:** FIPS 203; RFC 7296; RFC 9593

## PQC Risk Profile

**Harvest Now, Decrypt Later:** **HIGH** — Encrypted data captured today can be decrypted by a future quantum computer (harvest-now-decrypt-later attack). Adopting this specification is critical to protect long-lived confidential data.

**Identity & Authentication Integrity:** **HIGH** — A quantum-capable adversary could forge certificates or impersonate identities protected by classical public-key cryptography. Migration to PQC-safe PKI and authentication systems is essential.

**Digital Signature Integrity:** **HIGH** — Classical digital signatures (RSA, ECDSA) are vulnerable to quantum forgery. Code signing, firmware integrity, and legally binding digital signatures depend on adopting post-quantum signature schemes.

**Migration urgency:** Medium

## PQC Key Types & Mechanisms

| Field                  | Value                          |
| ---------------------- | ------------------------------ |
| Algorithm family       | Lattice-based KEM              |
| Security levels        | L1,L3,L5                       |
| Protocol / tool impact | IKEv2 authentication with KEMs |
| Toolchain support      | VPN implementations            |

## Short Description

Specifies KEM-based authentication for IKEv2 as more efficient alternative to ML-DSA.

## Long Description

Skip to main content Datatracker Groups By area/parent Apps & Realtime General Internet Ops & Management Routing Security Web and Internet Transport IESG IAB IRTF IETF LLC RFC Editor Other Active AGs Active Areas Active Directorates Active IAB Workshops Active Programs Active RAGs Active Teams New work Chartering groups BOFs BOF Requests Other groups Concluded groups Non-WG lists Documents Search Recent I-Ds Submit an Internet-Draft RFC streams IAB IRTF ISE Editorial Subseries STD BCP FYI Meetings Agenda Materials Floor plan Registration Important dates Request a session Session requests Upcoming meetings Upcoming meetings Past meetings Past meetings Meeting proceedings Other IPR disclosures Liaison statements IESG agenda NomComs Downref registry Statistics I-Ds/RFCs Meetings API Help Release notes System status Report a bug User Sign in Password reset Preferences New account List subscriptions IETF Lists IRTF Lists IAB Lists RFC-Editor Lists Report a bug Sign in KEM-based Authentication for IKEv2 with Post-quantum Security draft-wang-ipsecme-kem-auth-ikev2-02 Status Email expansions History Versions: 00 01 02 This document is an Internet-Draft (I-D). Anyone may submit an I-D to the IETF. This I-D is not endorsed by the IETF and has no formal standing in the IETF standards process . Document Type Active Internet-Draft (individual) Authors Guilin WANG , Valery Smyslov Last updated 2025-10-18 RFC stream (None) Intended RFC status (None) Formats txt html xml htmlized bibtex bibxml Stream Stream state (No stream defined) Consensus boilerplate Unknown RFC Editor Note (None) IESG IESG state I-D Exists Telechat date (None) Responsible AD (None)

---

_Skip to main content Datatracker Groups By area/parent Apps & Realtime General Internet Ops & Management Routing Security Web and Internet Transport IESG IAB IRTF IETF LLC RFC Editor Other Active AGs Active Areas Active Directorates Active IAB Workshops Active Programs Active RAGs Active Teams New work Chartering groups BOFs BOF Requests Other groups Concluded groups Non-WG lists Documents Search Recent I-Ds Submit an Internet-Draft RFC streams IAB IRTF ISE Editorial Subseries STD BCP FYI Meetings Agenda Materials Floor plan_
