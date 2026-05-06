# Network Security & PQC Migration

Module covering PQC migration for network security infrastructure including NGFWs, IDS/IPS, and zero trust architecture.

## Key Topics

- PQC impact on TLS inspection and DPI (certificate buffer overflows, latency overhead, hardware offload gaps)
- NGFW cipher policy migration to ML-KEM/ML-DSA hybrid and pure-PQC modes
- TLS intercept proxy behavior with PQC certificate chains (ML-DSA-65, hybrid ECDSA+ML-DSA)
- IDS/IPS signature updates for PQC traffic detection (hybrid KEM handshakes, cert size anomalies, downgrade attacks)
- Vendor roadmaps: Cisco (FTD 7.4+), Palo Alto (PAN-OS 11.x), Fortinet (FortiOS 7.6), Juniper (Junos 24.x), Check Point (R82), Sophos, SonicWall, pfSense/OPNsense
- Zero trust network access (ZTNA) PQC migration priorities: IdP → Policy Engine → Application Gateway → Micro-Segmentation
- TCP Initial Congestion Window (`initcwnd`) starvation: PQC TLS handshakes (which can exceed 25 KB) require multiple TCP flights because they surpass the standard 10-segment `initcwnd` limit, adding significant latency (RTT penalties) and increasing fragmentation risks at middleboxes.

## Workshop Steps

1. NGFW Cipher Analyzer — cipher policy comparison (classical/hybrid/pure PQC), hardware tier impact, cert size and latency metrics
2. TLS Inspection Lab — pass-through vs full inspection simulation, PQC cert chain sizes, inspection feasibility matrix
3. IDS Signature Updater — PQC-aware rule categories, false positive rate analysis, detection coverage balancing
4. Vendor Migration Matrix — interactive filtering by ML-KEM/ML-DSA support, TLS inspection, hardware offload, readiness status
5. ZTNA PQC Designer — component-by-component migration approach selection, risk score, architecture diagram
6. Network Telemetry Analyzer — visualization of TCP `initcwnd` limits and the latency penalties associated with massive PQC payloads forcing multi-flight handshakes.

## Key Data Points

- ML-DSA-65 certificate: ~2.5KB vs RSA-2048: ~1.2KB (+108%)
- Hybrid ECDSA+ML-DSA-65 chain: ~8.5KB — exceeds most 2025 NGFW inspection buffers (4KB limit)
- TLS inspection latency: classical ~9ms, hybrid ~28ms, pure PQC ~35ms (software-only DPI)
- Hardware offload reduces PQC inspection overhead by 60-70%
- IDS hybrid KEM detection: 92% coverage, low false positive risk
- Downgrade attack detection: 65% coverage, high false positive risk (requires tuning)

## Standards References

- NIST SP 800-227: Key Encapsulation Mechanisms (ML-KEM in TLS)
- NIST SP 800-207A: Zero Trust Architecture and PQC
- RFC 9370: Multiple Key Exchanges in IKEv2 (hybrid KEM for IPsec)
- CNSA 2.0: Hybrid by 2026, exclusively PQC by 2033 for NSS environments
- NIST IR 8547: Classical crypto deprecation timeline (2030/2035)
