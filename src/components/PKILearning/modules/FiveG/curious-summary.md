# 5G Security — In Simple Terms

## What This Is About

Some procedures in earlier mobile generations could expose permanent subscriber identifiers to rogue base stations. 5G SUCI conceals the subscriber-specific part of the identity when a non-null protection scheme is used; the null scheme provides no concealment, and network-routing fields remain visible. The ECIES public-key protection in the cited 3GPP profiles is vulnerable to a sufficiently capable quantum computer.

## Why It Matters

The scoped "harvest now, decrypt later" risk here is recorded SUCIs: an adversary could save one and later use a cryptographically relevant quantum computer to recover the concealed subscriber identifier from the public-key exchange. That would not decrypt all cellular traffic or automatically reveal a person's identity or movements; linking a recovered identifier to a person requires other information. ATIS recommends that 3GPP specify quantum-resistant key encapsulation for SUPI protection, with optional hybrid support. That is a recommendation, not a 3GPP deployment requirement.

## The Key Takeaway

One research proposal for post-quantum SUCI uses ML-KEM and calls its option "Profile C." In the cited TS 33.501 Release 19 Annex C, the null scheme and ECIES Profiles A and B are the defined schemes; Profile C is not an adopted normative profile there. The playground's Profile C is an educational implementation based on the research proposal, with project-specific choices described in the technical notes.

As of 18 November 2026, 3GPP has active Release 20 work on this problem. Its TR 33.703 study is under change control, and the dedicated "Post-quantum Cryptography Migration for SUCI" work item is PCG-approved with a scheduled end date of 3 March 2027. Those are study and work-item milestones, not an adopted normative SUCI profile. The cited 3GPP document for the lesson's profile details is Release 19 V19.7.0; the 3GPP version record lists Release 20 V20.3.0 as a later TS 33.501 version. Check the current approved TS text before conformance or deployment decisions. The research and playground Profile C variants are examples, not deployable specifications.

## What's Happening

Post-quantum schemes can change message size and processing needs, so deployment choices will need measurement on real devices and networks. The cited ETSI PDF is TS 33.501 Release 19 V19.7.0 (August 2026); the 3GPP change-request page now lists a V19.7.0 version link. The newer release records do not, by themselves, make the proposed post-quantum profiles normative. Check the latest specification and related work item before implementation.

Sources: [ATIS 5G quantum report](https://cdn.atis.org/atis.org/2025/02/25152429/Preparing-5G-for-the-Quantum-Era-WP-V9.pdf), [3GPP TS 33.703 status](https://portal.3gpp.org/desktopmodules/Specifications/SpecificationDetails.aspx?specificationId=4422), [3GPP SUCI migration work item](https://portal.3gpp.org/desktopmodules/WorkItem/WorkItemDetails.aspx?workitemId=1130028), [3GPP TS 33.501 status and versions](https://portal.3gpp.org/desktopmodules/Specifications/SpecificationDetails.aspx?specificationId=3169), [cited ETSI TS 33.501 Rel-19 V19.7.0 PDF](https://www.etsi.org/deliver/etsi_ts/133500_133599/133501/19.07.00_60/ts_133501v190700p.pdf).
