# IoT & OT Security Module

This module addresses the unique post-quantum cryptography migration challenges for Internet of Things (IoT) and Operational Technology (OT) devices. These devices operate under severe resource constraints -- limited RAM (2-256 KB), slow processors, and narrow bandwidth -- while having deployment lifetimes of 15-30 years that will span the arrival of cryptographically relevant quantum computers. The module covers constrained device classification (RFC 7228), PQC algorithm selection for resource-limited hardware, certificate chain bloat impact, firmware signing, IoT protocol considerations, SCADA/ICS security with the Purdue model, and hybrid approaches for different device classes.

## Key Concepts

- **RFC 7228 device classes**: Class 0 (<<10 KiB RAM, <<100 KiB flash, e.g., sensor tags, RFID), Class 1 (~10 KB RAM, ~100 KB flash, e.g., smart meters, environmental sensors), Class 2 (~50 KB RAM, ~250 KB flash, e.g., industrial gateways, PLCs), Class 3+ (~256 KB RAM, ~1 MB flash, e.g., edge gateways, RTUs, vehicle ECUs)
- **Algorithm selection for constrained devices**: ML-KEM-512 fits in ~3 KB stack RAM; FrodoKEM-640 needs ~180 KB (infeasible for Class 0/1); FN-DSA-512 (FIPS 206 draft) produces the most compact PQC signature (~666 avg, 690 max bytes); LMS has smallest verifier (0.5 KB RAM, 56-byte public key) but requires stateful key management
- **Certificate chain bloat**: Classical ECDSA P-256 chain is ~3 KB; PQC ML-DSA-65 chain balloons to ~22 KB (7x increase), exceeding Class 1 device total RAM; mitigations include Merkle Tree Certificates (85% reduction), certificate compression (RFC 8879, 25-35% savings), session resumption (PSK), raw public keys (RFC 7250)
- **Firmware signing for IoT**: LMS/HSS is leading choice (56-byte public key, 2.5 KB signature, fastest PQC verifier on constrained MCUs -- ~4x faster than XMSS on Cortex-M4); SUIT manifest (RFC 9019) wraps firmware with metadata and signatures for secure OTA delivery; CNSA 2.0 mandates LMS/XMSS for NSS firmware by 2030
- **IoT protocol constraints**: CoAP/DTLS 1.3 (1,024 B max payload, challenging), MQTT 5.0/TLS 1.3 (65,535 B, good), LoRaWAN 1.1 (222 B, problematic -- PQC requires out-of-band provisioning), Matter/Thread (1,280 B, challenging), LwM2M/DTLS (1,024 B, challenging), BLE Mesh (384 B, problematic), OPC UA (65,535 B, good); DTLS 1.3 with PQC grows handshake from ~5 KB to ~22 KB requiring 15+ fragments over IPv6 minimum MTU
- **SCADA/ICS security (Purdue model)**: Level 5 (Enterprise Network, critical PQC priority, internet-facing), Level 4 (Enterprise IT, critical, internet-facing), Level 3.5 (DMZ, critical, internet-facing), Level 3 (Site Operations, high, 10-year lifecycle), Level 2 (Area Supervisory, high, 15-year lifecycle), Level 1 (Basic Control, medium -- gateway-mediated, 20-year lifecycle), Level 0 (Physical Process, low -- gateway-mediated, 25-year lifecycle); internet-facing layers must migrate to PQC first as primary HNDL targets
- **Hybrid approaches by device class**: Gateway-mediated PQC for Class 0/1 (devices use classical crypto to gateway, gateway re-encrypts with PQC for IT/cloud); native hybrid for Class 2+ (X25519 + ML-KEM-768, requires 50+ KB RAM)
- **Long-lifetime challenge**: SCADA systems run 20-30 years; devices deployed today will operate when CRQCs arrive; crypto-agility must be designed in from the start (cannot be retrofitted); many OT devices are air-gapped or lack OTA update capability
- **Energy constraints**: PQC operations consume significantly more energy than classical crypto; battery-powered devices must budget this overhead, favoring session resumption (PSK) over repeated handshakes
- **Lightweight symmetric crypto**: NIST selected Ascon (2023) as the lightweight AEAD standard for constrained environments; complements PQC asymmetric algorithms for comprehensive IoT security
- **Hardware acceleration**: Secure elements (ARM TrustZone-M, Infineon OPTIGA TPM, Microchip ATECC608) can offload PQC operations from the main MCU; industry leaders including Samsung and Thales are developing ML-KEM support for embedded secure elements
- **Secure Boot RAM Load Latency**: During a Secure Boot sequence, the MCU must load the signature and public key from SPI Flash into SRAM. ML-DSA's large sizes (2.4KB sig, 1.3KB pk) introduce significant SPI load delays compared to ECDSA, potentially exceeding strict real-time RTOS boot constraints (e.g., 100ms) on low-MHz processors.
- **Automotive V2X Broadcast Storms**: V2X standards require vehicles to broadcast Basic Safety Messages (BSMs) at 10Hz. Switching from 64-byte ECDSA to 2.4KB ML-DSA signatures can quickly overwhelm the limited RF channel capacity (e.g., 6 Mbps DSRC) at a busy intersection, causing packet drops and endangering autonomous safety features.

## Workshop Activities

1. **Constrained Algorithm Explorer**: Compare PQC algorithm resource requirements (RAM, key sizes, signature sizes) against RFC 7228 device class constraints with visual resource budgets
2. **Firmware Signing Simulator**: Sign and verify a firmware image using LMS, XMSS, or ML-DSA; compare signature sizes and relative verification speeds on constrained MCUs
3. **DTLS Handshake Visualizer**: Simulate a CoAP/DTLS 1.3 handshake with PQC and measure overhead including fragment count and transmission time
4. **Certificate Chain Bloat Analyzer**: Analyze PQC certificate chain sizes across algorithms and their impact on constrained TLS with visual size comparisons
5. **SCADA Migration Planner**: Assess a SCADA/ICS environment and plan PQC migration across Purdue model layers with priority-based recommendations
6. **Hardware Constraints Simulator**: Explore how the physical limitations of embedded devices (SPI read speeds, MCU clock speeds) and constrained networks (V2X broadcast channel limits) react to the massive cryptographic parameters of PQC.

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
- NIST Lightweight Cryptography (Ascon)
