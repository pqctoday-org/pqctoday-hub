# Aerospace PQC — Module Summary

## Overview

Advanced-level module (80 min, 6 workshop steps) covering post-quantum cryptography migration for the aerospace and space industries — environments with extreme bandwidth constraints, multi-decade asset lifetimes, re-certification requirements, and export-control implications for cryptographic algorithm changes.

## Key Topics

- **Avionics protocols and crypto constraints**: ARINC 429 (12–14.5 kbit/s low speed or 100 kbit/s high speed, late-1970s legacy, 32-bit/4-byte data word — PQC signatures not practical on a 32-bit word without fragmentation), ARINC 664/AFDX (100 Mbps Ethernet, ML-DSA overhead manageable with proper framing), MIL-STD-1553 (1 Mbps, strict deterministic latency, real-time command/response), EFB (Electronic Flight Bag) TLS connections, ACARS (very limited bandwidth, 2400 bps VHF — PQC handshake infeasible)
- **Satellite orbit types and link budget impact**: LEO (500–2000 km, 90-minute orbit, ~20 ms one-way latency, Starlink/OneWeb/Planet Labs constellations, frequent handoffs complicate key freshness), MEO (GPS/Galileo orbits, 12-hour period, ~70 ms latency, high radiation exposure for onboard processors), GEO (35,786 km, 500 ms round-trip latency — significant impact on interactive key exchange protocols), HEO (Molniya orbits, 12-hour highly elliptical, ground segment complexity)
- **Certification and airworthiness**: DO-178C (airborne software, Design Assurance Levels DAL A through E — DAL A for flight-critical), DO-254 (complex electronic hardware design assurance), EUROCAE ED-202A / RTCA DO-326A (airworthiness security process specification), ED-203A / DO-356 (airworthiness security methods and considerations) and ED-204 / DO-355 (information security guidance for continuing airworthiness) — all recognised as acceptable means of compliance in EASA AMC 20-42, compliance with which is not mandatory (an applicant may use an alternative means of compliance accepted by EASA), AS9100D (aerospace quality management). In this module's order-of-magnitude estimate (no certification authority publishes a tariff), a cryptographic algorithm change that touches safety-critical software means re-certifying that software at its DAL — potentially 3–7 years and tens of millions of dollars per aircraft type. A 2025 CEAS avionics paper argues that partitioning, which allows software on one partition to be replaced without affecting the others, greatly simplifies the certification process.
- **Export control**: ITAR (International Traffic in Arms Regulations) governs military avionics cryptography; EAR (Export Administration Regulations) governs dual-use. Standard encryption may qualify as EAR99 (no license required) or fall under ECCN 5E002. ML-DSA export classification under BIS review as of early 2026 — classification pending formal ruling. Wassenaar Arrangement cryptography controls apply to international aircraft programs.
- **Fleet interoperability and mixed-generation aircraft**: Legacy aircraft with ARINC 429 buses alongside modern AFDX-equipped platforms create heterogeneous ground-to-air upgrade paths; this module suggests gateway-mediated hybrid TLS sessions at ACARS/VDL ground stations; timeline for fleet-wide PQC migration spans 20+ years given aircraft service lives.
- **Aviation data links and satellite guidance**: A 2024 research paper (Dowling and Wimalasiri, IACR ePrint 2024/046) says that at the time of writing all CPDLC communications run over unencrypted and unauthenticated data links; it proposes two hybrid post-quantum key exchange protocols (PQAG-KEM, PQAG-SIG) as a research proposal with an implementation. ACARS message security is specified in ARINC 823 Part 1 but, per the same paper, is rarely adopted by any major airlines; several research proposals secure CPDLC over LDACS, a newer aeronautical data link. GSMA PQ.07 (version 1.0, 4 February 2026) recommends starting the migration of legacy satellite systems with hybrid solutions combining legacy and PQC keys, says IPsec and DTLS tunnels for satellite IoT connections should integrate quantum-resistant key exchange such as ML-KEM, and advises watching CCSDS for PQC-related recommendations. ARINC 835-2 (information report, December 2025) gives guidance on securing loadable software parts with digital signatures and PKI. A 2025 CEAS Aeronautical Journal paper (Varner et al., "Agile, post-quantum secure cryptography in avionics") states that long development times, certification delay and decades of operation make beginning the PQC migration a particularly urgent need for avionics.
- **National Security System (NSS) satellite links**: if a satellite link is part of an NSS, NSA CNSA 2.0 (FAQ version 2.2) applies and specifies ML-KEM-1024 and ML-DSA-87 (not the ML-KEM-768 and ML-DSA-44/65 used in most module examples). CNSA 2.0 algorithms are required in all new NSS acquisitions from 1 January 2027; NSS equipment and services that cannot support them must be phased out by 31 December 2030 unless an exception is granted; their use is mandated by 31 December 2031, unless otherwise noted. The FAQ says quantum-resistant algorithms should be implemented in NSS mission systems as NIAP-validated products, or in accordance with other implementation-specific guidance, typically including requiring CMVP-validated cryptographic modules.
- **Radiation-hardened processor constraints**: Space-qualified rad-hard processors (e.g., GR712RC LEON3FT, RAD750) have limited crypto acceleration, clock speeds typically 50–200 MHz — software ML-DSA verification at these speeds requires careful profiling; dedicated crypto coprocessors (e.g., RTAX-S FPGA) needed for real-time signing.
- **HNDL risk for satellite telemetry**: Satellite lifetime of 15–20 years (GEO) to 5–7 years (LEO) means telemetry and command links encrypted today are HNDL-exposed. Command uplinks (telecommand) authenticated with RSA or ECDSA are the highest-risk assets — spoofed commands could cause mission loss.
- **Algorithm recommendations by constraint tier**: ML-DSA-44 for signature-constrained avionics with adequate compute, ML-KEM-768 for key exchange over AFDX/Ethernet links, FN-DSA-512 (FALCON-512, 666-byte signature) for ultra-constrained processors where ML-DSA-44's 2,420-byte signature is too large for protocol framing.

## Workshop Steps

1. **AvionicsProtocolAnalyzer** — Compare ARINC 429, ARINC 664/AFDX, MIL-STD-1553, ACARS, and EFB by bandwidth, latency budget, message size limit, and PQC feasibility; visualize where each algorithm fits or fails
2. **SatelliteLinkBudgetCalculator** — Compute PQC handshake overhead as percentage of link budget across LEO/MEO/GEO/HEO orbits; model key refresh intervals vs pass duration for LEO
3. **CertificationImpactAnalyzer** — Map algorithm changes against DO-178C DAL levels; estimate re-certification scope, cost, and timeline per aircraft type; identify which changes require full vs partial re-certification
4. **FleetInteroperabilityMatrix** — Model mixed-generation fleet scenarios (legacy ARINC 429 + modern AFDX + ground systems); design hybrid protocol upgrade paths for ACARS ground station TLS sessions
5. **ExportControlClassifier** — Classify cryptographic changes against ITAR/EAR/Wassenaar; identify license requirements for international programs; flag ML-DSA pending classification status
6. **MissionCryptoLifecyclePlanner** — Plan end-to-end PQC migration for a spacecraft mission: launch crypto (RSA → ML-DSA), telecommand authentication, telemetry encryption, ground station key management, mission lifetime key rotation schedule

## Key Data Points

- ARINC 429 data word: 32 bits (4 bytes) — ML-DSA-44 signature (2,420 bytes) is 605× the word size; PQC infeasible on-wire, must use out-of-band key distribution
- ARINC 664/AFDX is Ethernet-based: the ML-KEM-768 ciphertext is 1,088 bytes and an ML-DSA-65 signature 3,309 bytes (FIPS 203, FIPS 204); how many frames each needs depends on the frame size, which this module's protocol table models as several blocks for an ML-DSA-65 signature
- MIL-STD-1553 message: up to 32 data words (64 bytes) — PQC signature transport requires multi-frame fragmentation protocol
- ML-DSA-44: public key 1,312 bytes, signature 2,420 bytes — baseline for signature-capable avionics
- ML-DSA-65: public key 1,952 bytes, signature 3,309 bytes — for ground segment and EFB where bandwidth allows
- FN-DSA-512 (FALCON-512): public key 897 bytes, signature 666 bytes — preferred for constrained onboard processors
- ML-KEM-768: public key 1,184 bytes, ciphertext 1,088 bytes — key exchange for AFDX/Ethernet-connected subsystems
- GEO round-trip latency 500 ms — IKEv2 with ML-KEM adds ~3 extra round trips vs classical ECDH, potential 1.5 s additional latency per session establishment
- LEO pass duration: typically 8–12 minutes for a ground station — key session must be established and torn down within pass window
- DO-178C DAL A re-certification: estimated $10M–$50M per aircraft type for cryptographic algorithm changes in flight-critical software
- Spacecraft lifetime HNDL exposure: GEO satellites launched 2026 with RSA-2048 telecommand auth remain exposed through ~2046 — well within projected CRQC window

## Standards Referenced

- RTCA DO-178C — Software Considerations in Airborne Systems and Equipment Certification
- RTCA DO-254 — Design Assurance Guidance for Airborne Electronic Hardware
- RTCA DO-326A — Airworthiness Security Process Specification
- EUROCAE ED-202A — Airworthiness Security Process Specification
- EUROCAE ED-203A / RTCA DO-356 — Airworthiness Security Methods and Considerations
- EUROCAE ED-204 / RTCA DO-355 — Information Security Guidance for Continuing Airworthiness
- EASA AMC 20-42 — Airworthiness information security risk assessment (recognises ED-202A/DO-326A, ED-203A/DO-356 and ED-204/DO-355 as acceptable means of compliance; not mandatory)
- ARINC 835-2 — Guidance for Security of Loadable Software Parts Using Digital Signatures (information report, December 2025)
- ARINC 823 Part 1 — ACARS Message Security
- GSMA PQ.07 — Post Quantum Cryptography for Non-Terrestrial Networks (version 1.0, 4 February 2026)
- NSA CNSA 2.0 FAQ (version 2.2) — NSS algorithm requirements and dates; ML-KEM-1024, ML-DSA-87
- IACR ePrint 2024/046 — Quantum-Secure Hybrid Communication for Aviation Infrastructure (research proposal)
- ARINC 429 — Mark 33 Digital Information Transfer System
- ARINC 664 / AFDX — Aircraft Data Network (Avionics Full-Duplex Switched Ethernet)
- MIL-STD-1553B — Aircraft Internal Time Division Command/Response Multiplex Data Bus
- FIPS 203 (ML-KEM) — key encapsulation for AFDX/Ethernet avionics links
- FIPS 204 (ML-DSA) — digital signatures for software load authentication and command integrity
- FIPS 205 (SLH-DSA) — stateless hash-based signatures for long-lived spacecraft firmware signing
- CCSDS 352.0-B-2 — CCSDS Cryptographic Algorithms
- AS9100D — Quality Management Systems for Aviation, Space, and Defense
- EAR Part 742.15 — Encryption export controls (BIS)
- ITAR Part 121.1 — U.S. Munitions List (USML) Category XV (spacecraft and related)

## Cross-References

- `hsm-pqc` — key storage for ground station signing keys and telecommand authentication HSMs
- `kms-pqc` — mission key management for satellite ground segment
- `code-signing` — firmware signing for spacecraft software loads (DO-178C artifact authentication)
- `migration-program` — multi-year fleet migration governance
- `hybrid-crypto` — hybrid classical+PQC during transition for AFDX-capable platforms
- `stateful-signatures` — LMS/HSS as alternative for spacecraft firmware signing (hardware-friendly)
- Quiz: 15 questions (aero-001 through aero-015)
