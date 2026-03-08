# Automotive PQC — Module Summary

## Overview

Advanced-level module (120 min, 6 workshop steps) covering post-quantum cryptography migration for the automotive industry — an ecosystem with stringent functional safety requirements (ISO 26262), 15-year vehicle lifetimes that exceed the projected quantum threat window, complex in-vehicle network topologies, and a global OTA update infrastructure that is itself a primary attack surface.

## Key Topics

- **Vehicle electrical architecture evolution**: Domain-based architecture (separate ECUs per domain: powertrain, chassis, ADAS, body, infotainment, connectivity, each with domain controller) vs. zonal architecture (physical zones with high-performance central compute nodes — HPCs — aggregating control from multiple domains). ADAS zone is the most security-critical domain in both architectures; zonal HPCs introduce new PQC upgrade points at zone boundaries.
- **In-vehicle network buses**: CAN classic (500 Kbps, 8-byte payload — no native crypto, limited to HMAC/MAC with symmetric keys via AUTOSAR SecOC), CAN-FD (up to 8 Mbps, 64-byte payload — AUTOSAR SecOC with larger MAC capacity), LIN (slave bus, up to 20 Kbps — no crypto support), FlexRay (10 Mbps, dual-channel, deterministic real-time — safety-critical), Automotive Ethernet (100BASE-T1 to 10GBASE-T1, MACsec and TLS 1.3 support — primary PQC migration target for backbone links)
- **Functional safety levels**: ISO 26262 Automotive Safety Integrity Levels ASIL A (lowest) through ASIL D (highest) and QM (non-safety). Braking and steering ECUs are ASIL-D. PQC signature verification on ASIL-D components must not introduce timing jitter exceeding the ASIL-D deterministic timing budget — constant-time algorithm implementations mandatory. SLH-DSA and ML-DSA both have deterministic signing; verification timing must be characterized per target MCU.
- **Sensor data integrity for ADAS**: LiDAR (point cloud at 100 Hz, ML-DSA-44 for sensor-to-HPC signing — 2,420-byte signature at 100 Hz = 242 KB/s overhead), Camera (H.265 compressed stream, HMAC-SHA256 per GOP preferred over per-frame signing), Radar (CAN-FD bus, signed with AUTOSAR SecOC using AES-CMAC — symmetric only, no PQC signature feasible on CAN-FD today), Fusion output to ADAS decision module (ML-DSA-65 for critical path output attestation)
- **OTA software update architecture**: 3-layer signing chain — OEM root CA (ML-DSA-87, offline, HSM-protected), ECU group signing CA (ML-DSA-65, online, Tier-1-partitioned), delta/patch signing key (ML-DSA-44, per-campaign). UNECE WP.29 Regulation 156 mandates software update management system (SUMS) security requirements. 10–15 year vehicle lifetime extends well beyond the 2030–2035 CRQC projection window — vehicles sold today with RSA/ECDSA OTA signing are HNDL-exposed.
- **Digital car key protocols**: CCC Digital Key 3.0 (Car Connectivity Consortium — UWB ranging for precise positioning + NFC for tap-to-start + BLE for passive entry), ISO 18013-5 mobile driver's license (mDL) used as identity anchor for vehicle access, CPCQ (Classical/PQ Combined Key agreement, hybrid ML-KEM-768 + X25519) for phone-as-key key exchange. Offline operation required — PQC key verification must work without cellular connectivity.
- **Vehicle lifecycle and type approval**: UNECE R155 (cybersecurity management system — CSMS — mandatory for type approval in EU/Japan/Korea as of 2024), UNECE R156 (software update management), ISO/SAE 21434 (road vehicles cybersecurity engineering process standard), SOTIF ISO 21448 (safety of the intended functionality — intersects with ADAS crypto timing requirements). 15-year post-sale support obligation in EU (proposed) creates long PQC maintenance tail.
- **Algorithm sizing for automotive constraints**: ML-DSA-44 for ECU-to-ECU and OTA delta signing on capable MCUs; ML-KEM-768 for session key exchange on Automotive Ethernet backbone; HMAC-SHA256 + AES-CMAC retained for real-time CAN/CAN-FD buses where asymmetric crypto is not feasible; FN-DSA-512 for the most resource-constrained ECUs (e.g., BCM body control modules with Cortex-M4 at 64 MHz)

## Workshop Steps

1. **VehicleArchitectureMapper** — Compare domain-based vs. zonal architectures; identify crypto upgrade points at domain controllers, zone HPCs, and gateway ECUs; map PQC feasibility to each internal bus type
2. **SensorDataIntegritySimulator** — Configure signing strategies per sensor type (LiDAR, camera, radar, fusion); calculate bandwidth overhead at operating frequency; evaluate HMAC vs. ML-DSA tradeoffs for real-time data streams
3. **SafetyCryptoAnalyzer** — Map ASIL levels to crypto requirements; model worst-case ML-DSA verification latency on representative MCUs (Cortex-M7, RISC-V RH850, Aurix TC3xx); identify timing budget violations and mitigations
4. **OTAOrchestrationPlanner** — Design 3-layer OTA signing chain with ML-DSA-87/65/44; simulate UNECE R156 compliance verification; model campaign rollout for a mixed fleet of 2M vehicles across 6 model years
5. **CarKeyProtocolExplorer** — Step through CCC Digital Key 3.0 pairing and unlock flows with PQC key exchange; compare CPCQ hybrid vs. pure ML-KEM-768; test offline operation without network connectivity
6. **LifecycleMigrationRoadmap** — Build a phased migration plan covering type approval crypto (R155/R156), OTA signing chain cutover, Automotive Ethernet TLS upgrade, and car key re-issuance; model by vehicle generation and model year

## Key Data Points

- CAN-FD maximum payload: 64 bytes — ML-DSA-44 signature (2,420 bytes) requires 38 CAN-FD frames; use AUTOSAR SecOC with AES-CMAC-128 (16 bytes) for real-time CAN buses
- Automotive Ethernet 100BASE-T1: 100 Mbps — ML-KEM-768 ciphertext (1,088 bytes) adds <0.1 ms overhead per session
- ML-DSA-44 verification time: ~1.3 ms on Cortex-M7 at 480 MHz (estimated); ~8 ms on Cortex-M4 at 64 MHz — potentially exceeds 5 ms ADAS timing budget on constrained MCUs
- FN-DSA-512 verification: ~0.6 ms on Cortex-M7 — preferred for latency-constrained safety-critical path
- OTA update signing chain size: ML-DSA-87 (OEM root) + ML-DSA-65 (group CA) + ML-DSA-44 (delta) = cert chain ~14 KB over-the-air
- Vehicle HNDL exposure: 2026 model year vehicle (expected service to 2041) — RSA/ECDSA OTA signing keys encrypted today could be broken by CRQC within vehicle lifetime
- CCC Digital Key 3.0 UWB ranging precision: ±10 cm — PQC key exchange must complete within 500 ms for passive entry user experience
- UNECE R155 compliance: mandatory for new type approvals in 54 UNECE member states since July 2024; retroactive for existing types by July 2027
- ISO/SAE 21434 TARA (Threat Analysis and Risk Assessment): cryptographic asset inventory and risk classification required; ML-DSA/ML-KEM migration must be captured as cybersecurity goals

## Standards Referenced

- ISO 26262 — Functional Safety for Road Vehicles (ASIL A–D classification)
- ISO/SAE 21434:2021 — Road Vehicles Cybersecurity Engineering
- ISO 21448 (SOTIF) — Safety of the Intended Functionality
- UNECE WP.29 Regulation 155 — Cybersecurity Management System (CSMS)
- UNECE WP.29 Regulation 156 — Software Update Management System (SUMS)
- AUTOSAR SecOC — Secure Onboard Communication specification
- CCC Digital Key 3.0 — Car Connectivity Consortium specification
- ISO 18013-5 — Personal Identification, Mobile Driving Licence (mDL)
- FIPS 203 (ML-KEM) — key encapsulation for Automotive Ethernet and car key protocols
- FIPS 204 (ML-DSA) — digital signatures for OTA signing chains and ECU attestation
- FIPS 205 (SLH-DSA) — stateless hash-based signatures for long-lived vehicle root CA
- SAE J3101 — Hardware-Protected Security for Ground Vehicles (HSM integration)

## Cross-References

- `hsm-pqc` — automotive HSMs (Evita Full/Medium/Light) for OTA signing key storage
- `kms-pqc` — OEM backend KMS for OTA campaign key management
- `iot-ot-pqc` — overlapping ECU constraints with embedded IoT device patterns
- `hybrid-crypto` — CPCQ hybrid key agreement for CCC Digital Key during transition
- `tls-basics` — Automotive Ethernet TLS 1.3 profile migration
- `code-signing` — firmware signing for ECU software loads
- `migration-program` — fleet-scale migration governance across model years
- Quiz: 15 questions (auto-001 through auto-015)
