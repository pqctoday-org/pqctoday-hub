# PQC Network Testing & Validation — RAG Summary

## Module Overview

**Module ID**: `pqc-testing-validation`
**Track**: Protocols
**Duration**: 120 minutes
**Difficulty**: Advanced
**Prerequisites**: hybrid-crypto, network-security-pqc, vpn-ssh-pqc (recommended)

This module teaches how to design and execute testing strategies for post-quantum cryptography deployments. It covers the full PQC testing lifecycle from initial crypto discovery through production monitoring — distinct from protocol migration modules which cover *what* to migrate.

---

## Why PQC Testing Is Different

PQC testing introduces challenges absent from classical cryptography assessments:

1. **Algorithm size explosion** — ML-KEM public keys (1,184B), ciphertexts (1,088B), and ML-DSA signatures (3,293B) are orders of magnitude larger than ECDH/ECDSA equivalents. This causes TCP fragmentation, ClientHello oversize, and certificate chain size issues that standard TLS testing tools miss.

2. **Hybrid scheme complexity** — Testing hybrid PQC (X25519+ML-KEM-768) requires validating that both the classical and PQC components complete successfully. RFC 9794 prohibits silent downgrade — if either component fails, the shared secret is invalid.

3. **Side-channel failure modes are different** — Classical TVLA (fixed-vs-random) fails for lattice-based PQC because public keys and ciphertexts are structurally coupled, making fixed test vectors trivially distinguishable. NTT/INTT, polynomial multiplication, and modular reduction are the actual leakage targets.

4. **OT/ICS safety constraints** — Active scanning in OT environments can trigger safety system faults. Only passive-mode tools (CryptoNext COMPASS, pqc-flow in read-only mode) are appropriate for initial OT crypto inventory.

---

## Passive vs Active Discovery

**Passive discovery** inspects network traffic on SPAN ports or network taps without injecting packets. Tools observe:
- TLS ClientHello cipher suite extensions (hybrid KEM identifiers)
- Server certificate algorithm (RSA, ECDSA, or ML-DSA)
- SSH key exchange algorithm negotiation
- IKEv2 Key Exchange payload algorithm identifiers

Key limitation: passive tools can only detect algorithms in *current* flows. If no ML-KEM-capable connection is being made, ML-KEM support cannot be detected passively.

**Tools**: CryptoNext COMPASS (commercial, NIST NCCoE recommended, NIST CAVP certified for all 3 PQC standards), pqc-flow (open source, CipherIQ), VIAVI Observer Analyzer (commercial, PQC detection in development).

**Active scanning** initiates TLS/SSH/IKEv2 connections to probe which algorithms an endpoint supports. Provides complete algorithm support matrix but generates detectable connection attempts — requires security operations coordination.

**Tools**: pqcscan (Anvil Secure, open source, Rust, BSD license), CryptoLyzer (community, multi-protocol), SSLyze (open source).

---

## PQC Performance Benchmarking Methodology

Key insight: **TCP-to-TLS overhead dominates, not crypto computation.** On a WAN link with 50ms RTT, the TCP handshake adds 6 RTTs (300ms) before any crypto begins. ML-KEM key generation adds ~0.7ms — negligible. The real cost is message size.

### Critical benchmark data (from VIAVI TeraVM + PQC-LEO):

| Metric | Classical | Hybrid PQC | Pure PQC |
|--------|-----------|------------|----------|
| TLS handshake (WAN) | 68ms | 82ms (+21%) | 95ms (+40%) |
| IKEv2 SA setup (WAN) | 240ms | 380ms (+58%) | 12,626ms (+5,161%) |
| Certificate size | 1.2KB | 4.8KB | 17.2KB |
| ClientHello size | 320B | 1,120B | 1,536B |
| Throughput (WAN) | 100% | 87% | 79% |

The IKEv2 pure-PQC cliff (53×) makes hybrid the mandatory first step for VPN gateways. Pure-PQC TLS is more manageable (1.4× overhead on WAN).

**TCP fragmentation threshold**: ClientHello >~1,400 bytes triggers TCP fragmentation, adding exactly 1 RTT per connection. Pure PQC (1,536B) always fragments on standard Ethernet MTU.

**Tools**: VIAVI TeraVM (commercial, VPN benchmarking), PQC-LEO (open source, all NIST algorithms, x86+ARM), Keysight CyPerf (freemium, TLS, Community Edition free).

---

## Interoperability Testing & RFC 9794 Compliance

RFC 9794 (IETF, 2025) defines hybrid scheme design rules:
1. Both classical and PQC components must run to completion
2. Shared secret = KDF(classical_secret ∥ pqc_secret)
3. At least one algorithm must be shared between peers
4. Silent downgrade on failure is prohibited

### Real-world interoperability status (as of 2025):

| Client | OQS Server | Cloudflare | Legacy TLS 1.2 |
|--------|-----------|------------|----------------|
| Chrome 130+ (hybrid) | Compatible | Compatible | Partial (fallback) |
| Firefox 128+ (hybrid) | Compatible | Compatible | Partial (fallback) |
| Pure PQC client | Compatible | **Incompatible** (RFC 9794 policy) | **Incompatible** |
| Classical-only | Partial | Partial | Compatible |

**Oversized ClientHello risk**: Pure PQC ClientHellos (1,536B) exceed TCP MSS on some network devices — load balancers and firewalls may silently drop fragmented ClientHellos.

**Test infrastructure**: test.openquantumsafe.org (OQS Test Server, free public access, all NIST algorithm combinations available on separate ports).

---

## Side-Channel Testing & TVLA for Lattice Crypto

### Why TVLA is different for PQC

Classical fixed-vs-random TVLA divides measurements into "fixed plaintext" and "random plaintext" groups, then uses Welch's t-test to detect key-dependent power differences. For ML-KEM/ML-DSA, this approach fails: the public key and ciphertext are mathematically coupled, so a fixed ciphertext always uses the same secret polynomial — making the groups trivially distinguishable regardless of implementation quality.

**Correct approach**: Target specific algorithmic stages:
- **NTT/INTT** (Number Theoretic Transform) — primary leakage point in both ML-KEM and ML-DSA
- **Polynomial multiplication** — coefficient-wise multiplication in the Zq ring; leaks nonce information in ML-DSA signing
- **Modular reduction** — conditional subtraction for q=3329 (ML-KEM); leaks in unmasked implementations

**TVLA threshold**: |t| > 4.5 (NIST standard) indicates statistically significant leakage. |t| > 3.0 is used in strict evaluations.

### Implementation comparison:

| Stage | ML-KEM (unmasked) | ML-KEM (1st-order masked) | ML-DSA (unmasked) | ML-DSA (masked) |
|-------|-------------------|---------------------------|-------------------|-----------------|
| NTT/INTT | 12.7 (LEAKS) | 3.4 (safe) | 14.8 (LEAKS) | 3.1 (safe) |
| Poly. multiplication | 9.1 (LEAKS) | 2.8 (safe) | 11.3 (LEAKS) | 5.9 (LEAKS) |
| Modular reduction | 7.8 (LEAKS) | 1.9 (safe) | 3.1 (safe) | 1.3 (safe) |

First-order masking eliminates NTT leakage but ML-DSA polynomial multiplication still leaks under masking (higher-order attack required).

**Tools**: Keysight Inspector Crypto 3 (commercial, Dilithium TVLA generator, Known Key Analysis, FIPS 140-3 Level 4 support), ChipWhisperer (open source, NewAE Technology, power analysis + fault injection).

---

## Test Strategy by Phase & Environment

### Phase 1: Inventory
Focus: Discover and classify all crypto assets. Tools: passive discovery + CBOM generation.

### Phase 2: Lab Testing
Focus: Validate PQC performance overhead and interoperability before production exposure.

### Phase 3: Pilot Rollout
Focus: Limited production deployment (5–10% of traffic/devices) with continuous monitoring.

### Phase 4: Full Production
Focus: Enterprise-wide enforcement, continuous compliance scanning, policy automation.

### Environment-specific constraints:
- **Enterprise**: Full toolset available; start with passive network scan, then active endpoint scan
- **Cloud-native**: CBOM first (CBOMkit), then service mesh PQC validation (Keysight CyPerf)
- **OT/ICS**: Passive-only during inventory phase (active probing can trigger safety faults); 4–8 week isolated pilot
- **Embedded/IoT**: TVLA side-channel testing before firmware deployment; OTA update integrity via ML-DSA

---

## Tool Catalog (CSC-061)

| Tool | Category | License | PQC Support |
|------|----------|---------|-------------|
| CryptoNext COMPASS | Passive Discovery | Commercial | ML-KEM, ML-DSA, SLH-DSA (NIST CAVP) |
| pqc-flow | Passive Discovery | Open Source | ML-KEM, ML-DSA in TLS/SSH/QUIC |
| VIAVI Observer | Passive Discovery | Commercial | In development |
| pqcscan | Active Scanning | Open Source | Detects PQC, hybrid KEMs |
| CryptoLyzer | Active Scanning | Open Source | Experimental PQC OID detection |
| VIAVI TeraVM | Benchmarking | Commercial | ML-KEM, ML-DSA, SLH-DSA |
| Keysight CyPerf | Benchmarking | Freemium | X25519+ML-KEM-768 hybrid |
| PQC-LEO | Benchmarking | Open Source | All NIST PQC via OQS |
| OQS Test Server | Interop | Open Source | All NIST KEMs + signatures |
| Keysight Inspector | Side-Channel | Commercial | ML-DSA (prod), ML-KEM (pre-release) |
| ChipWhisperer | Side-Channel | Open Source | Community Kyber/Dilithium modules |
| CBOMkit | Inventory | Open Source | Crypto discovery in source code |

---

## Key Terms

- **TVLA** — Test Vector Leakage Assessment; Welch's t-test on power traces; |t| > 4.5 = leakage
- **CBOM** — Cryptography Bill of Materials; CycloneDX 1.6; generated by CBOMkit
- **RFC 9794** — Hybrid PQC design rules; both components must complete; no silent downgrade
- **Passive Discovery** — SPAN/TAP probe; no packet injection; production-safe
- **Active Scanning** — Connection-initiating probes; detects full capability; requires coordination
- **Interoperability Matrix** — Client × server compatibility map for hybrid PQC algorithm combinations
- **Crypto Inventory** — Complete multi-layer catalog: network (passive) + endpoint (active) + code (CBOM)
- **Performance Baseline** — Classical metrics used as comparison: TLS 68ms WAN, IKEv2 240ms WAN

---

## Cross-References

- **hybrid-crypto** — Covers hybrid cert formats and composite certificates (distinct from testing methodology)
- **network-security-pqc** — Covers NGFW cipher policy configuration (distinct from traffic scanning)
- **vpn-ssh-pqc** — Covers IPSec migration planning (distinct from performance benchmarking methodology)
- **platform-eng-pqc** — Covers CI/CD pipeline CBOM and OPA policy (complements test strategy builder)
- **Migrate catalog** — CSC-061 products auto-render in module's Tools & Products tab
