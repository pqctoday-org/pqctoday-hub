---
reference_id: draft-ietf-tls-ecdhe-mlkem-04
document_type: Protocol
document_status: Internet-Draft (Standards Track)
date_published: 2024-03-01
date_updated: 2026-02-08
region: International
migration_urgency: High
local_file: public/library/draft-ietf-tls-ecdhe-mlkem-04.html
---

# Post-quantum hybrid ECDHE-MLKEM Key Agreement for TLSv1.3

## Authors

**Organization:** IETF TLS WG

## Scope

**Industries:** Web; Cloud; Enterprise
**Region:** International
**Document type:** Protocol

## How It Relates to PQC

TLS 1.3 hybrid ECDHE-MLKEM

**Dependencies:** FIPS 203; RFC 8446; RFC 9847; draft-ietf-tls-hybrid-design

## PQC Risk Profile

**Harvest Now, Decrypt Later:** **HIGH** — Encrypted data captured today can be decrypted by a future quantum computer (harvest-now-decrypt-later attack). Adopting this specification is critical to protect long-lived confidential data.

**Identity & Authentication Integrity:** Not directly addressed by this document.

**Digital Signature Integrity:** Not directly addressed by this document.

**Migration urgency:** High

## PQC Key Types & Mechanisms

| Field                  | Value                          |
| ---------------------- | ------------------------------ |
| Algorithm family       | Lattice + ECDH                 |
| Security levels        | L1,L3,L5                       |
| Protocol / tool impact | TLS 1.3 hybrid ECDHE-MLKEM     |
| Toolchain support      | OpenSSL; BoringSSL; Cloudflare |

## Short Description

Specifies X25519MLKEM768 SecP256r1MLKEM768 and SecP384r1MLKEM1024 hybrid groups for TLS 1.3. Updated to Standards Track category with normative hybrid framework and RFC 9847 references. Expires Aug 2026.

## Long Description

Skip to main content Datatracker Groups By area/parent Apps & Realtime General Internet Ops & Management Routing Security Web and Internet Transport IESG IAB IRTF IETF LLC RFC Editor Other Active AGs Active Areas Active Directorates Active IAB Workshops Active Programs Active RAGs Active Teams New work Chartering groups BOFs BOF Requests Other groups Concluded groups Non-WG lists Documents Search Recent I-Ds Submit an Internet-Draft RFC streams IAB IRTF ISE Editorial Subseries STD BCP FYI Meetings Agenda Materials Floor plan Registration Important dates Request a session Session requests Upcoming meetings Upcoming meetings Past meetings Past meetings Meeting proceedings Other IPR disclosures Liaison statements IESG agenda NomComs Downref registry Statistics I-Ds/RFCs Meetings API Help Release notes System status Report a bug User Sign in Password reset Preferences New account List subscriptions IETF Lists IRTF Lists IAB Lists RFC-Editor Lists Report a bug Sign in Post-quantum hybrid ECDHE-MLKEM Key Agreement for TLSv1.3 draft-ietf-tls-ecdhe-mlkem-04 Status IESG evaluation record IESG writeups Email expansions History Versions: 00 01 02 03 04 Document Type Active Internet-Draft ( tls WG ) Authors Kris Kwiatkowski , Panos Kampanakis , Bas Westerbaan , Douglas Stebila Last updated 2026-02-17 (Latest revision 2026-02-08) Replaces draft-kwiatkowski-tls-ecdhe-mlkem RFC stream Internet Engineering Task Force (IETF) Intended RFC status Proposed Standard Formats txt html xml htmlized bibtex bibxml Reviews GENART IETF Last Call review (of -03) by Dale Worley Ready w/nits Additional resources Mailing list discussion Stream WG state Submitted to IESG for Publication

---

_Skip to main content Datatracker Groups By area/parent Apps & Realtime General Internet Ops & Management Routing Security Web and Internet Transport IESG IAB IRTF IETF LLC RFC Editor Other Active AGs Active Areas Active Directorates Active IAB Workshops Active Programs Active RAGs Active Teams New work Chartering groups BOFs BOF Requests Other groups Concluded groups Non-WG lists Documents Search Recent I-Ds Submit an Internet-Draft RFC streams IAB IRTF ISE Editorial Subseries STD BCP FYI Meetings Agenda Materials Floor plan_
