# Network Security & PQC Migration

Module covering PQC migration for network security infrastructure including NGFWs, IDS/IPS, and zero trust architecture.

## Key Topics

- PQC impact on TLS inspection and DPI (certificate buffer and parsing limits, latency overhead, hardware offload gaps)
- NGFW cipher policy migration to ML-KEM/ML-DSA hybrid and pure-PQC modes
- TLS intercept proxy behavior with PQC certificate chains (ML-DSA-65, hybrid ECDSA+ML-DSA)
- IDS/IPS signature updates for PQC traffic detection (hybrid KEM handshakes, cert size anomalies, downgrade attacks)
- Vendor roadmaps: Cisco (ML-KEM in FTD 10.5 and ASA 9.25, targeted for late 2026), Palo Alto (PAN-OS 12.1), Fortinet (FortiOS 7.6), Juniper (Junos OS 25.4R1), Check Point (R82), Sophos (SFOS 22.0 MR2), SonicWall, pfSense/OPNsense
- Zero trust network access (ZTNA) PQC migration priorities, in this module's suggested order: IdP → Policy Engine → Application Gateway → Micro-Segmentation
- TCP Initial Congestion Window (`initcwnd`) starvation: a PQC TLS handshake (one published estimate says a hybrid TLS 1.3 handshake using X25519+ML-KEM-768 and ECDSA+ML-DSA-65 may exceed 15 KB) can need more than one TCP flight when it exceeds the 10-segment initial window described in RFC 6928, which adds round trips. The Network Telemetry Analyzer uses illustrative payload profiles, not measurements.

## Workshop Steps

1. NGFW Cipher Analyzer — cipher policy comparison (classical/hybrid/pure PQC), hardware tier impact, cert size and latency metrics
2. TLS Inspection Lab — pass-through vs full inspection simulation, PQC cert chain sizes, inspection feasibility matrix
3. IDS Signature Updater — PQC-aware rule categories, false positive rate analysis, detection coverage balancing
4. Vendor Migration Matrix — interactive filtering by ML-KEM/ML-DSA support, TLS inspection, hardware offload, readiness status
5. ZTNA PQC Designer — component-by-component migration approach selection, risk score, architecture diagram
6. Network Telemetry Analyzer — visualization of TCP `initcwnd` limits and the latency penalties associated with massive PQC payloads forcing multi-flight handshakes.

## Key Data Points

- ML-DSA-65 certificate: at least 5,261 bytes (FIPS 204 Table 2: 1,952-byte public key plus 3,309-byte signature)
- Two-certificate TLS 1.3 chain in an IETF C509 draft example: ML-DSA-65 11,869 bytes, RSA 2,656 bytes, ECDSA 1,651 bytes
- Middleboxes: the Applied Quantum PQC Migration Framework v2.1 says many have hardcoded buffer sizes or parsing assumptions that break with PQC-sized handshakes and certificates, and advises testing every middlebox on every production network path
- Simulator default values (illustrative, not measurements): TLS Inspection Lab inspected handshake classical ~9ms, hybrid ~28ms, pure PQC ~35ms; NGFW Cipher Analyzer throughput factors; IDS Signature Updater hybrid KEM detection coverage 92% and downgrade attack detection coverage 65% (high false positive risk, requires tuning)

## Standards References

- NIST SP 800-227: Recommendations for Key-Encapsulation Mechanisms (KEMs in general, not specific to TLS)
- NIST SP 800-207A: access-control model for cloud-native, multi-location zero trust (no post-quantum content)
- RFC 9370: Multiple Key Exchanges in IKEv2 (hybrid KEM for IPsec)
- CNSA 2.0 FAQ version 2.2: new NSS acquisitions from 2027, unsupported equipment and services phased out by 2030, algorithms mandated by 2031 unless otherwise noted. The separate 2035 date is the broader NSM-10 objective. CNSA 2.0 does not generally require hybrid constructions.
- NIST IR 8547 (final, October 2026; systems that follow NIST standards): quantum-vulnerable public-key algorithms at 112-bit security and up deprecated after 2030 and disallowed after 2035
