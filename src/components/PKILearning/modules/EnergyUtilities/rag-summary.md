# Energy & Utilities PQC — Module Summary

## Overview

Advanced-level module (90 min, 5 workshop steps) covering post-quantum cryptography migration for the energy sector — an industry where OT protocol security failures can cause physical equipment damage, widespread power outages, and safety-critical protection relay failures. Asset lifetimes of 40–50 years (substations) mean cryptographic decisions made today lock in quantum exposure for decades.

## Key Topics

- **OT protocols and crypto feasibility**: IEC 61850 (GOOSE for high-speed substation protection messaging at 4 ms trip time, Sampled Values for merging unit data — both multicast with no native asymmetric crypto in current IEC 62351-6 profile), DNP3 (SCADA field communications — DNP3 Secure Authentication v5 uses challenge-response with HMAC-SHA256, asymmetric update key change ceremony uses RSA-2048 — quantum-vulnerable), Modbus (legacy SCADA/sensor bus, no native security — must use VPN or TLS overlay), DLMS/COSEM (smart meter protocol, AES-128-GCM mandatory per IEC 62056-5-3, key transport uses asymmetric crypto vulnerable to quantum attacks)
- **Substation types and security tiers**: Transmission substations (500 kV+, IEC 62351 Parts 3/5/6 required, direct NERC-CIP applicability, highest priority for PQC migration), sub-transmission (69–230 kV, IEC 62351 Parts 3/5 applicable), distribution (4–35 kV, often legacy SCADA with Modbus/DNP3), generation (renewable and thermal plants, hybrid IT/OT environments with SCADA-to-EMS links)
- **IEC 62351 PQC migration status**: Part 3 (TLS profiles for MMS/TCP — migrate TLS cipher suites to ML-KEM/hybrid; draft profile expected 2026–2027), Part 5 (DNP3 Secure Authentication — asymmetric update key ceremony must migrate from RSA-2048 to ML-DSA), Part 6 (IEC 61850 GOOSE/SV security — role-based access, no PQC profile finalized as of 2026), Part 8 (RBAC over 61850 — authentication token signing must migrate to ML-DSA), Part 14 (cybersecurity monitoring — new audit log signing requirements compatible with ML-DSA). Full PQC profile for IEC 62351 expected from TC57 WG15 in 2026–2027.
- **NERC-CIP compliance**: CIP-005 (Electronic Security Perimeter — critical urgency; access controls for interactive and programmatic ESP entry points), CIP-007 (System Security Management — high; patch management and port/service management), CIP-010 (Configuration Change Management — medium; must document algorithm changes in CSMS), CIP-012 (Communications Between Control Centers — critical; encryption of inter-control-center communications), CIP-013 (Supply Chain Risk Management — high; vendor PQC roadmap requirements). PQC migration must be reflected in NERC-CIP compliance documentation and approved by grid operator; unilateral algorithm changes in BCS without documented CSMS update are a compliance violation.
- **Smart metering and AMI**: AMI (Advanced Metering Infrastructure) networks use DLMS/COSEM with AES-128-GCM for payload encryption and RSA-based key establishment for AMI head-end-to-meter sessions. 15-minute interval data creates high-volume data streams. HNDL risk is acute for 20+ year meter lifetimes — usage data encrypted in 2026 could be decrypted in 2040s revealing behavioral patterns. ML-KEM-768 for key establishment over AMI; AES-256-GCM retained for symmetric data encryption (Grover-safe at AES-256).
- **Safety-critical timing constraints**: GOOSE trip message timing — IEC 61850 GOOSE requires end-to-end delivery under 4 ms for Class P2/P3 protection applications; any crypto processing in the relay trip path that exceeds this budget causes breaker failure-to-trip — a safety-critical event. SV merging unit data: microsecond-precision timestamped current/voltage samples (80 or 256 samples/cycle). PQC must NOT be inserted in the real-time data path; authentication must use pre-shared symmetric MACs (HMAC) or be offloaded to a separate security appliance.
- **Equipment lifecycle and retrofit strategy**: Substations 40–50 years, protection relays 20–30 years, smart meters 15–25 years, SCADA RTUs 10–20 years. PQC retrofit strategies: (1) firmware update if processor-capable (modern IEDs with ARM Cortex-A), (2) out-of-band VPN/IPsec overlay terminating at substation gateway for legacy IEDs, (3) quantum-safe security appliance (QSA) inline for MMS/TCP traffic, (4) full equipment replacement for end-of-life assets.
- **RF Mesh Saturation**: Smart meter mesh networks (e.g., 900MHz Wi-SUN) operate at low bandwidths (50-300 kbps). PQC payloads (e.g., 2.4KB ML-DSA signatures) can cause the Time-on-Air (ToA) to exceed daily reporting windows, triggering mesh collapse.

## Workshop Steps

1. **ProtocolSecurityAnalyzer** — Compare IEC 61850 GOOSE/SV, DNP3 SA v5, Modbus, and DLMS/COSEM by security capability, PQC readiness, and migration path; identify which protocol layers can carry ML-KEM/ML-DSA and which require out-of-band crypto
2. **SubstationMigrationPlanner** — Design a phased PQC migration for a transmission substation: MMS/TCP TLS upgrade, DNP3 SA v5 key ceremony migration, IED firmware assessment, out-of-band VPN overlay for legacy assets; output a 36-month migration Gantt chart
3. **SmartMeterKeyManager** — Configure AMI key establishment migration: RSA-2048 → ML-KEM-768 at head-end HSM, per-meter key provisioning ceremony, 15-year re-keying schedule, HNDL risk window calculator for existing deployed meters
4. **SafetyRiskScorer** — Model impact of crypto processing delay on GOOSE trip timing; calculate maximum allowable verification latency per protection class; assess relay hardware upgrade requirements; generate ASIL-equivalent risk matrix for grid protection functions
5. **GridMigrationRoadmap** — Build a national-scale grid migration roadmap: asset inventory by type and age, NERC-CIP impact assessment, vendor PQC support timeline matrix, phased deployment plan from transmission → sub-transmission → distribution → metering
6. **RFMeshSimulator** — Model the Time-on-Air and network saturation of 900MHz smart meter mesh networks under massive PQC payload loads.

## Key Data Points

- GOOSE maximum trip time (Class P2): 4 ms end-to-end — ML-DSA-44 signing (~1 ms on capable IED) is at the edge of feasibility; must not be in synchronous trip path
- GOOSE multicast frame: typically 100–300 bytes — ML-DSA-44 signature (2,420 bytes) is 8–24× the message size; PQC signature infeasible in real-time GOOSE path
- DNP3 SA v5 update key change: RSA-2048 key transport ceremony (annual or on-demand) — replace with ML-KEM-768 encapsulation + ML-DSA-65 ceremony signing
- DLMS/COSEM key transport: RSA-2048 wrapping of AES meter keys — replace with ML-KEM-768 (1,088-byte ciphertext overhead vs 256-byte RSA ciphertext — 4× larger, but within TCP session budget)
- Smart meter HNDL window: meters deployed 2026 with RSA key establishment, lifetime 2026–2046 — full quantum-threat overlap with 2030–2035 CRQC projections
- IEC 62351-3 TLS profile: currently mandates TLS 1.2/1.3 with ECDHE — migration to X25519MLKEM768 hybrid requires TC57 WG15 profile update (expected 2026)
- Protection relay crypto processing: modern IED with ARM Cortex-A72 at 1.5 GHz — ML-DSA-44 verification ~0.3 ms (feasible for non-real-time auth); legacy IED with PowerPC 603 — ML-DSA infeasible, use VPN overlay
- NERC-CIP BES Cyber Asset inventory: utilities with >1,000 BES Cyber Assets face multi-year CSMS documentation update alongside technical migration
- AES-256-GCM quantum safety: Grover's algorithm reduces effective security to 128 bits — acceptable per CNSA 2.0 through 2030; no change needed for symmetric bulk encryption

## Standards Referenced

- IEC 61850 — Communication Networks and Systems for Power Utility Automation
- IEC 62351 Parts 3/5/6/8/14 — Power Systems Management — Information Security
- IEC 62056-5-3 (DLMS/COSEM) — Electricity Metering Data Exchange
- DNP3 Secure Authentication Version 5 (IEEE Std 1815-2012 Annex SC)
- NERC CIP-005, CIP-007, CIP-010, CIP-012, CIP-013 — Bulk Electric System Cybersecurity Standards
- NIST SP 800-82 Rev. 3 — Guide to OT Security (references crypto requirements)
- NIST SP 800-227 — Recommendations for Key-Encapsulation Mechanisms (ML-KEM)
- FIPS 203 (ML-KEM) — key encapsulation for AMI and MMS/TCP session establishment
- FIPS 204 (ML-DSA) — digital signatures for DNP3 SA v5 ceremonies and IEC 62351 authentication
- FIPS 205 (SLH-DSA) — stateless signing for substation gateway firmware and long-lived audit logs
- IEC 62443 — Industrial Automation and Control Systems Security (OT security zones and conduits)
- CNSA 2.0 — NSA Commercial National Security Algorithm Suite 2.0 (hybrid by 2026, PQC-only by 2033)

## Cross-References

- `iot-ot-pqc` — embedded OT device crypto constraints, IEC 62443 zone/conduit model
- `kms-pqc` — AMI head-end key management and HSM integration for meter key provisioning
- `hsm-pqc` — HSM-protected signing keys for DNP3 SA v5 update key ceremonies
- `tls-basics` — IEC 62351-3 TLS profile migration for MMS/TCP
- `vpn-ssh-pqc` — VPN overlay for legacy IED protection (IPsec with ML-KEM hybrid)
- `compliance-strategy` — NERC-CIP compliance integration for PQC migration documentation
- `migration-program` — multi-year fleet migration governance for national grid assets
- Quiz: 15 questions (eu-001 through eu-015)
