# IoT & OT Security Module

This module addresses the unique post-quantum cryptography migration challenges for Internet of Things (IoT) and Operational Technology (OT) devices. These devices operate under severe resource constraints -- limited RAM (10-256 KB), slow processors, and narrow bandwidth -- while having deployment lifetimes of 15-30 years that will span the arrival of cryptographically relevant quantum computers. The module covers constrained device classification (RFC 7228), PQC algorithm selection for resource-limited hardware, certificate chain bloat impact, firmware signing, IoT protocol considerations, SCADA/ICS security with the Purdue model, and hybrid approaches for different device classes.

## Key Concepts

- **RFC 7228 device classes**: Class 0 (~10 KB RAM, ~100 KB flash, e.g., smart sensors), Class 1 (~10 KB RAM, ~100 KB flash, e.g., industrial sensors), Class 2 (~50 KB RAM, ~250 KB flash, e.g., smart meters), Unconstrained (>250 KB RAM, e.g., gateways, edge servers)
- **Algorithm selection for constrained devices**: ML-KEM-512 fits in ~3 KB stack RAM; FrodoKEM-640 needs ~180 KB (infeasible for Class 0/1); FN-DSA-512 (FIPS 206 draft) produces the most compact PQC signature at 666 bytes; LMS has smallest verifier (0.5 KB RAM, 56-byte public key) but requires stateful key management
- **Certificate chain bloat**: Classical ECDSA P-256 chain is ~3 KB; PQC ML-DSA-65 chain balloons to ~22 KB (7x increase), exceeding Class 1 device total RAM; mitigations include Merkle Tree Certificates (85% reduction), certificate compression (RFC 8879, 25-35% savings), session resumption (PSK), raw public keys (RFC 7250)
- **Firmware signing for IoT**: LMS/HSS is leading choice (56-byte public key, 2.5 KB signature, ~0.1 ms verification); SUIT manifest (RFC 9019) wraps firmware with metadata and signatures for secure OTA delivery; CNSA 2.0 mandates LMS/XMSS for NSS firmware by 2030
- **IoT protocol constraints**: CoAP/DTLS (1,152 B max payload, challenging PQC feasibility), MQTT/TLS (65,535 B, good), LwM2M/DTLS (1,152 B, challenging), LoRaWAN (222 B, problematic), NB-IoT (1,600 B, challenging), Zigbee/Thread (127 B, problematic); DTLS 1.3 with PQC grows handshake from ~5 KB to ~22 KB requiring 15+ fragments over IPv6 minimum MTU
- **SCADA/ICS security (Purdue model)**: Level 5 (Enterprise Network, critical PQC priority), Level 4 (Site Business/DMZ, critical), Level 3 (Site Operations, high), Level 2 (Supervisory Control, medium), Level 1 (Basic Control, low -- gateway-mediated), Level 0 (Physical Process, low -- gateway-mediated); internet-facing layers must migrate to PQC first as primary HNDL targets
- **Hybrid approaches by device class**: Gateway-mediated PQC for Class 0/1 (devices use classical crypto to gateway, gateway re-encrypts with PQC for IT/cloud); native hybrid for Class 2+ (X25519 + ML-KEM-768, requires 50+ KB RAM)
- **Long-lifetime challenge**: SCADA systems run 20-30 years; devices deployed today will operate when CRQCs arrive; crypto-agility must be designed in from the start (cannot be retrofitted); many OT devices are air-gapped or lack OTA update capability

## Workshop Activities

1. **Constrained Algorithm Explorer**: Compare PQC algorithm resource requirements (RAM, key sizes, signature sizes) against RFC 7228 device class constraints with visual resource budgets
2. **Firmware Signing Simulator**: Sign and verify a firmware image using LMS, XMSS, or ML-DSA; compare signature sizes and verification times
3. **DTLS Handshake Visualizer**: Simulate a CoAP/DTLS 1.3 handshake with PQC and measure overhead including fragment count and transmission time
4. **Certificate Chain Bloat Analyzer**: Analyze PQC certificate chain sizes across algorithms and their impact on constrained TLS with visual size comparisons
5. **SCADA Migration Planner**: Assess a SCADA/ICS environment and plan PQC migration across Purdue model layers with priority-based recommendations

## Related Standards

- RFC 7228 (Terminology for Constrained-Node Networks)
- RFC 9019 (SUIT Manifest for Firmware Updates)
- RFC 8879 (TLS Certificate Compression)
- RFC 7250 (Raw Public Keys in TLS/DTLS)
- FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 206 draft (FN-DSA)
- NIST SP 800-208 (LMS/HSS and XMSS)
- NSA CNSA 2.0 firmware signing mandates
- IEC 62443 (Industrial Automation and Control Systems Security)
- Purdue Enterprise Reference Architecture (ISA-95)
